import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

import { asc, eq, inArray } from "drizzle-orm"
import * as XLSX from "xlsx"

import { db, type DatabaseClient } from "@/db"
import { credentialExports } from "@/db/schema"
import { normalizeEmployeeId } from "@/lib/auth-helpers"
import type { Role } from "@/lib/types"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12

export type CredentialExportRow = {
  employeeId: string
  employeeName: string | null
  role: Role
  password: string
  createdAt: Date
  createdByEmployeeId: string
}

export type CredentialLookupOption = {
  employeeId: string
  employeeName: string | null
  role: Role
}

export function getCredentialExportRolesForActor(role: Role): Role[] {
  return role === "superAdmin"
    ? ["employee", "admin", "superAdmin"]
    : ["employee"]
}

function getEncryptionKey(): Buffer {
  const raw = process.env.CREDENTIALS_ENCRYPTION_KEY
  if (!raw) {
    throw new Error(
      "CREDENTIALS_ENCRYPTION_KEY is not set. Generate with: openssl rand -hex 32"
    )
  }
  const key = Buffer.from(raw, "hex")
  if (key.length !== 32) {
    throw new Error(
      "CREDENTIALS_ENCRYPTION_KEY must be 32 bytes (64 hex characters)."
    )
  }
  return key
}

function encryptPassword(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString("base64")
}

function decryptPassword(ciphertext: string): string {
  const key = getEncryptionKey()
  const data = Buffer.from(ciphertext, "base64")
  const iv = data.subarray(0, IV_LENGTH)
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + 16)
  const encrypted = data.subarray(IV_LENGTH + 16)
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    "utf8"
  )
}

export async function queueInitialCredential(input: {
  employeeId: string
  employeeName: string | null
  role: Role
  password: string
  createdByEmployeeId: string
  client?: DatabaseClient
}) {
  const client = input.client ?? db
  const employeeId = normalizeEmployeeId(input.employeeId)
  const createdByEmployeeId = normalizeEmployeeId(input.createdByEmployeeId)
  const passwordCiphertext = encryptPassword(input.password)

  await client
    .insert(credentialExports)
    .values({
      employeeId,
      employeeName: input.employeeName,
      role: input.role,
      passwordCiphertext,
      createdByEmployeeId,
      createdAt: new Date(),
    })
    .onConflictDoUpdate({
      target: credentialExports.employeeId,
      set: {
        employeeName: input.employeeName,
        role: input.role,
        passwordCiphertext,
        createdByEmployeeId,
        createdAt: new Date(),
      },
    })
}

export async function getInitialCredentialPassword(
  employeeId: string,
  client: DatabaseClient = db
): Promise<{ password: string } | { error: string }> {
  const normalizedId = normalizeEmployeeId(employeeId)
  const [row] = await client
    .select()
    .from(credentialExports)
    .where(eq(credentialExports.employeeId, normalizedId))
    .limit(1)

  if (!row) {
    return {
      error:
        "No stored initial password found for this account.",
    }
  }

  try {
    return { password: decryptPassword(row.passwordCiphertext) }
  } catch {
    return { error: "Stored credentials could not be decrypted." }
  }
}

export async function listCredentialLookupOptions(): Promise<
  CredentialLookupOption[]
> {
  return db
    .select({
      employeeId: credentialExports.employeeId,
      employeeName: credentialExports.employeeName,
      role: credentialExports.role,
    })
    .from(credentialExports)
    .orderBy(asc(credentialExports.employeeId))
}

export async function getCredentialLookupOption(
  employeeId: string
): Promise<CredentialLookupOption | null> {
  const normalizedId = normalizeEmployeeId(employeeId)
  const [row] = await db
    .select({
      employeeId: credentialExports.employeeId,
      employeeName: credentialExports.employeeName,
      role: credentialExports.role,
    })
    .from(credentialExports)
    .where(eq(credentialExports.employeeId, normalizedId))
    .limit(1)

  return row ?? null
}

export async function listCredentialExportsForRole(
  role: Role
): Promise<CredentialExportRow[]> {
  const allowedRoles = getCredentialExportRolesForActor(role)
  const rows = await db
    .select()
    .from(credentialExports)
    .where(inArray(credentialExports.role, allowedRoles))
    .orderBy(asc(credentialExports.employeeId))

  return rows.map(rowToCredentialExport)
}

function rowToCredentialExport(row: {
  employeeId: string
  employeeName: string | null
  role: Role
  passwordCiphertext: string
  createdAt: Date
  createdByEmployeeId: string
}): CredentialExportRow {
  return {
    employeeId: row.employeeId,
    employeeName: row.employeeName,
    role: row.role,
    password: decryptPassword(row.passwordCiphertext),
    createdAt: row.createdAt,
    createdByEmployeeId: row.createdByEmployeeId,
  }
}

export function buildCredentialsWorkbookBuffer(
  rows: CredentialExportRow[]
): Buffer {
  const sheetRows = rows.map((row) => ({
    "Employee ID": row.employeeId,
    Name: row.employeeName ?? "",
    Role: row.role,
    "Initial Password": row.password,
    Created: row.createdAt.toISOString(),
    "Created By": row.createdByEmployeeId,
  }))

  const worksheet =
    sheetRows.length > 0
      ? XLSX.utils.json_to_sheet(sheetRows)
      : XLSX.utils.aoa_to_sheet([
          [
            "Employee ID",
            "Name",
            "Role",
            "Initial Password",
            "Created",
            "Created By",
          ],
        ])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Credentials")
  return Buffer.from(
    XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
  )
}
