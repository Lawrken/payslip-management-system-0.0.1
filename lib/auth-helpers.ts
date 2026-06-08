import { createHmac, timingSafeEqual } from "node:crypto"

import type { Role, Session, User } from "@/lib/types"

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  superAdmin: "Superadmin",
}

export function normalizeEmployeeId(employeeId: string): string {
  return employeeId.trim().toUpperCase()
}

export function getHomePath(role: Role): string {
  void role
  return "/dashboard"
}

export function createSessionPayload(user: User): Session {
  return {
    employeeId: user.employeeId,
    role: user.role,
  }
}

export function isRole(value: unknown): value is Role {
  return value === "admin" || value === "superAdmin"
}

function isSession(value: unknown): value is Session {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Session).employeeId === "string" &&
    isRole((value as Session).role)
  )
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET ?? process.env.CREDENTIALS_ENCRYPTION_KEY
  if (secret) {
    return secret
  }

  if (process.env.NODE_ENV !== "production") {
    return "dev-only-payslip-session-secret"
  }

  throw new Error("SESSION_SECRET is required in production.")
}

function signPayload(payload: string): string {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url")
}

function verifySignature(payload: string, signature: string): boolean {
  const expected = Buffer.from(signPayload(payload), "base64url")
  const actual = Buffer.from(signature, "base64url")

  if (expected.length !== actual.length) {
    return false
  }

  return timingSafeEqual(expected, actual)
}

export function serializeSession(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString(
    "base64url"
  )
  return `${payload}.${signPayload(payload)}`
}

export function parseSession(cookieValue: string | undefined): Session | null {
  if (!cookieValue) {
    return null
  }

  const [payload, signature] = cookieValue.split(".")
  if (!payload || !signature || !verifySignature(payload, signature)) {
    return null
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    )
    if (!isSession(parsed)) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function isDashboardRole(role: Role): boolean {
  return isRole(role)
}

export function isAdmin(role: Role): boolean {
  return role === "admin"
}

export function isSuperAdmin(role: Role): boolean {
  return role === "superAdmin"
}
