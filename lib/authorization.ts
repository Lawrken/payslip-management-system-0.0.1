import { isAdmin, isDashboardRole, isSuperAdmin } from "@/lib/auth-helpers"
import { getSession } from "@/lib/session"
import type { Session } from "@/lib/types"

export async function requireDashboardSession(): Promise<
  Session | { error: string }
> {
  const session = await getSession()
  if (!session || !isDashboardRole(session.role)) {
    return { error: "Unauthorized." }
  }
  return session
}

export async function requireAdminSession(): Promise<Session | { error: string }> {
  const session = await getSession()
  if (!session || !isAdmin(session.role)) {
    return { error: "Unauthorized." }
  }
  return session
}

export async function requireSuperAdminSession(): Promise<
  Session | { error: string }
> {
  const session = await getSession()
  if (!session || !isSuperAdmin(session.role)) {
    return { error: "Unauthorized." }
  }
  return session
}
