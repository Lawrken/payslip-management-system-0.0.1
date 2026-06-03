import { mockUsers } from "@/lib/mock-users"
import type { MockUser, Role, Session } from "@/lib/types"

export function normalizeEmployeeId(employeeId: string): string {
  return employeeId.trim().toUpperCase()
}

export function validateCredentials(
  employeeId: string,
  password: string
): MockUser | null {
  const normalizedId = normalizeEmployeeId(employeeId)
  const user = mockUsers.find(
    (entry) =>
      entry.employeeId === normalizedId && entry.password === password
  )
  return user ?? null
}

export function getHomePath(role: Role): string {
  if (role === "employee") {
    return "/payslip"
  }
  return "/dashboard"
}

export function createSessionPayload(user: MockUser): Session {
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
