import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  randomInt,
} from "node:crypto"

import bcrypt from "bcryptjs"
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  isNotNull,
  isNull,
  or,
  type SQL,
} from "drizzle-orm"

import { db, type DatabaseClient } from "@/db"
import { employees, users } from "@/db/schema"
import { normalizeEmail, normalizeEmployeeId } from "@/lib/auth-helpers"
import {
  buildPaginatedResult,
  normalizePagination,
  type PaginatedResult,
  type PaginationInput,
} from "@/lib/pagination"
import type { SortDirection } from "@/lib/table-sort"
import type { Role, UserAccount } from "@/lib/types"

const GENERATED_PASSWORD_LENGTH = 12
const PASSWORD_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%"
const PASSWORD_HASH_ROUNDS = 10
const CIPHER_ALGORITHM = "aes-256-gcm"
const CIPHER_IV_LENGTH = 12

function getEncryptionKey(): Buffer {
  const raw = process.env.CREDENTIALS_ENCRYPTION_KEY
  if (!raw) {
    throw new Error(
      "CREDENTIALS_ENCRYPTION_KEY is required to store initial passwords."
    )
  }

  const key = Buffer.from(raw, "hex")
  if (key.length !== 32) {
    throw new Error("CREDENTIALS_ENCRYPTION_KEY must be 64 hex characters.")
  }

  return key
}

export function encryptInitialPassword(password: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(CIPHER_IV_LENGTH)
  const cipher = createCipheriv(CIPHER_ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(password, "utf8"),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString("base64")
}

function decryptInitialPassword(ciphertext: string): string {
  const key = getEncryptionKey()
  const data = Buffer.from(ciphertext, "base64")
  const iv = data.subarray(0, CIPHER_IV_LENGTH)
  const tag = data.subarray(CIPHER_IV_LENGTH, CIPHER_IV_LENGTH + 16)
  const encrypted = data.subarray(CIPHER_IV_LENGTH + 16)
  const decipher = createDecipheriv(CIPHER_ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    "utf8"
  )
}

function generatePassword() {
  let password = ""
  for (let index = 0; index < GENERATED_PASSWORD_LENGTH; index += 1) {
    password += PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)]
  }
  return password
}

function toUserAccount(row: {
  employeeId: string
  email: string
  role: Role
  employeeName: string | null
  initialPasswordCiphertext: string | null
  passwordChangedAt: Date | null
  createdAt: Date
  updatedAt: Date
}): UserAccount {
  return {
    employeeId: row.employeeId,
    email: row.email,
    role: row.role,
    employeeName: row.employeeName,
    hasInitialPassword: Boolean(row.initialPasswordCiphertext),
    passwordChangedAt: row.passwordChangedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function getUserAccounts(
  client: DatabaseClient = db
): Promise<UserAccount[]> {
  const rows = await client
    .select({
      employeeId: users.employeeId,
      email: users.email,
      role: users.role,
      employeeName: employees.name,
      initialPasswordCiphertext: users.initialPasswordCiphertext,
      passwordChangedAt: users.passwordChangedAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .leftJoin(employees, eq(users.employeeId, employees.employeeId))
    .orderBy(asc(users.employeeId))

  return rows.map(toUserAccount)
}

export type UserListSort = "email" | "employeeId" | "role" | "passwordChangedAt"
export type UserPasswordStatus = "initial" | "changed"

export type UserListQuery = PaginationInput & {
  search?: string
  role?: Role
  passwordStatus?: UserPasswordStatus
  sort?: UserListSort
  direction?: SortDirection
}

function getUserSortColumn(sort: UserListSort) {
  if (sort === "passwordChangedAt") {
    return users.passwordChangedAt
  }
  return users[sort]
}

export async function getPaginatedUserAccounts(
  query: UserListQuery = {},
  client: DatabaseClient = db
): Promise<PaginatedResult<UserAccount>> {
  const pagination = normalizePagination(query)
  const search = query.search?.trim()
  const conditions: SQL[] = []

  if (search) {
    const searchCondition = or(
      ilike(users.employeeId, `%${search}%`),
      ilike(users.email, `%${search}%`),
      ilike(employees.name, `%${search}%`)
    )
    if (searchCondition) {
      conditions.push(searchCondition)
    }
  }
  if (query.role) {
    conditions.push(eq(users.role, query.role))
  }
  if (query.passwordStatus === "initial") {
    conditions.push(isNull(users.passwordChangedAt))
  }
  if (query.passwordStatus === "changed") {
    conditions.push(isNotNull(users.passwordChangedAt))
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const sort = query.sort ?? "email"
  const direction = query.direction === "desc" ? "desc" : "asc"
  const orderBy =
    direction === "desc"
      ? desc(getUserSortColumn(sort))
      : asc(getUserSortColumn(sort))

  const [totalRow] = await client
    .select({ count: count() })
    .from(users)
    .leftJoin(employees, eq(users.employeeId, employees.employeeId))
    .where(where)
  const rows = await client
    .select({
      employeeId: users.employeeId,
      email: users.email,
      role: users.role,
      employeeName: employees.name,
      initialPasswordCiphertext: users.initialPasswordCiphertext,
      passwordChangedAt: users.passwordChangedAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .leftJoin(employees, eq(users.employeeId, employees.employeeId))
    .where(where)
    .orderBy(orderBy)
    .limit(pagination.pageSize)
    .offset(pagination.offset)

  return buildPaginatedResult(
    rows.map(toUserAccount),
    totalRow?.count ?? 0,
    pagination
  )
}

export async function getUserAccount(
  employeeId: string,
  client: DatabaseClient = db
): Promise<UserAccount | null> {
  const normalizedId = normalizeEmployeeId(employeeId)
  const [row] = await client
    .select({
      employeeId: users.employeeId,
      email: users.email,
      role: users.role,
      employeeName: employees.name,
      initialPasswordCiphertext: users.initialPasswordCiphertext,
      passwordChangedAt: users.passwordChangedAt,
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
  email: string
  role: Role
  client?: DatabaseClient
}): Promise<
  | {
      user: UserAccount
      initialPassword: string
    }
  | { error: string }
> {
  const client = input.client ?? db
  const employeeId = normalizeEmployeeId(input.employeeId)
  const email = normalizeEmail(input.email)

  if (!employeeId || !email) {
    return { error: "Employee ID and email are required." }
  }

  const existingEmployeeId = await client.query.users.findFirst({
    where: eq(users.employeeId, employeeId),
  })
  if (existingEmployeeId) {
    return { error: "A user with this Employee ID already exists." }
  }

  const existingEmail = await client.query.users.findFirst({
    where: eq(users.email, email),
  })
  if (existingEmail) {
    return { error: "A user with this email already exists." }
  }

  const initialPassword = generatePassword()
  await client.insert(users).values({
    employeeId,
    email,
    role: input.role,
    passwordHash: await bcrypt.hash(initialPassword, PASSWORD_HASH_ROUNDS),
    initialPasswordCiphertext: encryptInitialPassword(initialPassword),
    passwordChangedAt: null,
    updatedAt: new Date(),
  })

  const user = await getUserAccount(employeeId, client)
  if (!user) {
    return { error: "User account was not created." }
  }

  return { user, initialPassword }
}

export async function syncEmployeeUserIdentity(input: {
  previousEmployeeId: string
  employeeId: string
  email: string
  client?: DatabaseClient
}): Promise<{ success: true } | { error: string }> {
  const client = input.client ?? db
  const previousEmployeeId = normalizeEmployeeId(input.previousEmployeeId)
  const employeeId = normalizeEmployeeId(input.employeeId)
  const email = normalizeEmail(input.email)

  const existing = await client.query.users.findFirst({
    where: eq(users.employeeId, previousEmployeeId),
  })
  if (!existing) {
    return { success: true }
  }

  if (employeeId !== previousEmployeeId) {
    const duplicateId = await client.query.users.findFirst({
      where: eq(users.employeeId, employeeId),
    })
    if (duplicateId) {
      return { error: "A user with this Employee ID already exists." }
    }
  }

  if (email !== existing.email) {
    const duplicateEmail = await client.query.users.findFirst({
      where: eq(users.email, email),
    })
    if (duplicateEmail) {
      return { error: "A user with this email already exists." }
    }
  }

  await client
    .update(users)
    .set({
      employeeId,
      email,
      updatedAt: new Date(),
    })
    .where(eq(users.employeeId, previousEmployeeId))

  return { success: true }
}

export async function resetUserPassword(
  employeeId: string,
  client: DatabaseClient = db
): Promise<
  | {
      user: UserAccount
      initialPassword: string
    }
  | { error: string }
> {
  const normalizedId = normalizeEmployeeId(employeeId)
  const row = await client.query.users.findFirst({
    where: eq(users.employeeId, normalizedId),
  })
  if (!row) {
    return { error: "User account not found." }
  }
  if (!row.initialPasswordCiphertext) {
    return { error: "No stored initial password found for this account." }
  }

  let initialPassword: string
  try {
    initialPassword = decryptInitialPassword(row.initialPasswordCiphertext)
  } catch {
    return { error: "Stored initial password could not be decrypted." }
  }

  await client
    .update(users)
    .set({
      passwordHash: await bcrypt.hash(initialPassword, PASSWORD_HASH_ROUNDS),
      passwordChangedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(users.employeeId, normalizedId))

  const user = await getUserAccount(normalizedId, client)
  if (!user) {
    return { error: "User account not found." }
  }

  return { user, initialPassword }
}

export async function deleteUserAccount(
  employeeId: string,
  client: DatabaseClient = db
): Promise<{ success: true } | { error: string }> {
  const normalizedId = normalizeEmployeeId(employeeId)
  const existing = await client.query.users.findFirst({
    where: eq(users.employeeId, normalizedId),
  })
  if (!existing) {
    return { error: "User account not found." }
  }

  await client.delete(users).where(eq(users.employeeId, normalizedId))
  return { success: true }
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
      passwordHash: await bcrypt.hash(input.newPassword, PASSWORD_HASH_ROUNDS),
      passwordChangedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.employeeId, employeeId))

  return { success: true }
}
