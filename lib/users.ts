import { randomInt } from "node:crypto"

import bcrypt from "bcryptjs"
import { asc, eq } from "drizzle-orm"

import { db } from "@/db"
import { employees, users } from "@/db/schema"
import { normalizeEmployeeId } from "@/lib/auth-helpers"
import {
  getInitialCredentialPassword,
  queueInitialCredential,
} from "@/lib/credential-exports"
import type { Role, UserAccount } from "@/lib/types"

const GENERATED_PASSWORD_LENGTH = 12
const PASSWORD_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%"

function toUserAccount(row: {
  employeeId: string
  role: Role
  employeeName: string | null
  createdAt: Date
  updatedAt: Date
}): UserAccount {
  return {
    employeeId: row.employeeId,
    role: row.role,
    employeeName: row.employeeName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function isRole(value: string): value is Role {
  return value === "employee" || value === "admin" || value === "superAdmin"
}

export function generatePassword() {
  let password = ""
  for (let index = 0; index < GENERATED_PASSWORD_LENGTH; index += 1) {
    password += PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)]
  }
  return password
}

export async function getUserAccounts(): Promise<UserAccount[]> {
  const rows = await db
    .select({
      employeeId: users.employeeId,
      role: users.role,
      employeeName: employees.name,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .leftJoin(employees, eq(users.employeeId, employees.employeeId))
    .orderBy(asc(users.employeeId))

  return rows.map(toUserAccount)
}

export async function getUserAccount(
  employeeId: string
): Promise<UserAccount | null> {
  const normalizedId = normalizeEmployeeId(employeeId)
  const [row] = await db
    .select({
      employeeId: users.employeeId,
      role: users.role,
      employeeName: employees.name,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .leftJoin(employees, eq(users.employeeId, employees.employeeId))
    .where(eq(users.employeeId, normalizedId))
    .limit(1)

  return row ? toUserAccount(row) : null
}

export async function createUserAccount(input: {
  employeeId: string
  role: Role
  createdByEmployeeId: string
}): Promise<UserAccount | { error: string }> {
  const employeeId = normalizeEmployeeId(input.employeeId)
  if (!employeeId) {
    return { error: "Employee ID is required." }
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.employeeId, employeeId),
  })
  if (existing) {
    return { error: "A user with this Employee ID already exists." }
  }

  const generatedPassword = generatePassword()
  await db.insert(users).values({
    employeeId,
    role: input.role,
    passwordHash: await bcrypt.hash(generatedPassword, 10),
    updatedAt: new Date(),
  })

  const user = await getUserAccount(employeeId)
  if (!user) {
    return { error: "User account was not created." }
  }

  await queueInitialCredential({
    employeeId,
    employeeName: user.employeeName,
    role: input.role,
    password: generatedPassword,
    createdByEmployeeId: input.createdByEmployeeId,
  })

  return user
}

export async function deleteUserAccount(
  employeeId: string
): Promise<UserAccount | { error: string }> {
  const user = await getUserAccount(employeeId)
  if (!user) {
    return { error: "User account not found." }
  }

  await db.delete(users).where(eq(users.employeeId, user.employeeId))
  return user
}

export async function resetUserPassword(
  employeeId: string
): Promise<UserAccount | { error: string }> {
  const user = await getUserAccount(employeeId)
  if (!user) {
    return { error: "User account not found." }
  }

  const credential = await getInitialCredentialPassword(employeeId)
  if ("error" in credential) {
    return { error: credential.error }
  }

  await db
    .update(users)
    .set({
      passwordHash: await bcrypt.hash(credential.password, 10),
      updatedAt: new Date(),
    })
    .where(eq(users.employeeId, user.employeeId))

  return { ...user, updatedAt: new Date() }
}

export async function changeUserPassword(input: {
  employeeId: string
  currentPassword: string
  newPassword: string
}): Promise<{ success: true } | { error: string }> {
  const employeeId = normalizeEmployeeId(input.employeeId)
  const user = await db.query.users.findFirst({
    where: eq(users.employeeId, employeeId),
  })
  if (!user) {
    return { error: "User account not found." }
  }

  const isCurrentPasswordValid = await bcrypt.compare(
    input.currentPassword,
    user.passwordHash
  )
  if (!isCurrentPasswordValid) {
    return { error: "Current password is incorrect." }
  }

  if (input.newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." }
  }

  await db
    .update(users)
    .set({
      passwordHash: await bcrypt.hash(input.newPassword, 10),
      updatedAt: new Date(),
    })
    .where(eq(users.employeeId, employeeId))

  return { success: true }
}
