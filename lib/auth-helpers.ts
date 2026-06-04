import type { Role, Session, User } from "@/lib/types"

export const ROLE_LABELS: Record<Role, string> = {
  employee: "Employee",
  admin: "Admin",
  superAdmin: "Superadmin",
}

export const USER_ROLES = Object.keys(ROLE_LABELS) as Role[]

export function normalizeEmployeeId(employeeId: string): string {
  return employeeId.trim().toUpperCase()
}

export function getHomePath(role: Role): string {
  if (role === "employee") {
    return "/payslip"
  }
  return "/dashboard"
}

export function createSessionPayload(user: User): Session {
  return {
    employeeId: user.employeeId,
    role: user.role,
  }
}

export function parseSession(cookieValue: string | undefined): Session | null {
  if (!cookieValue) {
    return null
  }

  try {
    const parsed = JSON.parse(cookieValue) as Session
    if (
      typeof parsed.employeeId !== "string" ||
      (parsed.role !== "admin" &&
        parsed.role !== "superAdmin" &&
        parsed.role !== "employee")
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function isDashboardRole(role: Role): boolean {
  return role === "admin" || role === "superAdmin"
}

export function isAdmin(role: Role): boolean {
  return role === "admin"
}

export function isSuperAdmin(role: Role): boolean {
  return role === "superAdmin"
}
