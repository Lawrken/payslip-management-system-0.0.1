import "server-only"

import { cache } from "react"

import { getSession } from "@/lib/session"
import type { Session } from "@/lib/types"
import {
  isAdmin,
  isDashboardRole,
  isEmployee,
  isSuperAdmin,
} from "@/lib/auth-helpers"

async function requireDashboardSessionUncached(): Promise<
  Session | { error: string }
> {
  const session = await getSession()
  if (!session || !isDashboardRole(session.role)) {
    return { error: "Unauthorized." }
  }
  return session
}

async function requireAdminSessionUncached(): Promise<
  Session | { error: string }
> {
  const session = await getSession()
  if (!session || !isAdmin(session.role)) {
    return { error: "Unauthorized." }
  }
  return session
}

async function requireSuperAdminSessionUncached(): Promise<
  Session | { error: string }
> {
  const session = await getSession()
  if (!session || !isSuperAdmin(session.role)) {
    return { error: "Unauthorized." }
  }
  return session
}

async function requireEmployeeSessionUncached(): Promise<
  Session | { error: string }
> {
  const session = await getSession()
  if (!session || !isEmployee(session.role)) {
    return { error: "Unauthorized." }
  }
  return session
}

export const requireDashboardSession = cache(requireDashboardSessionUncached)
export const requireAdminSession = cache(requireAdminSessionUncached)
export const requireSuperAdminSession = cache(requireSuperAdminSessionUncached)
export const requireEmployeeSession = cache(requireEmployeeSessionUncached)
