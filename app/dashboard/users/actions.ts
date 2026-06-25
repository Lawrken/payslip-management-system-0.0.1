"use server"

import { revalidatePath } from "next/cache"

import { db, transaction } from "@/db"
import { createAuditLog } from "@/lib/audit-logs"
import { requireDashboardSession } from "@/lib/authorization"
import type { Role } from "@/lib/types"
import {
  deleteUserAccount,
  getUserAccount,
  resetUserPassword,
} from "@/lib/users"

export type ResetUserPasswordState = {
  error?: string
  success?: boolean
  employeeId?: string
  initialPassword?: string
  message?: string
}

export type DeleteUserState = {
  error?: string
  success?: boolean
}

function canResetRole(actorRole: Role, targetRole: Role) {
  if (actorRole === "superAdmin") {
    return true
  }
  return targetRole === "employee"
}

export async function resetUserPasswordAction(
  employeeId: string
): Promise<ResetUserPasswordState> {
  const session = await requireDashboardSession()
  if ("error" in session) {
    return session
  }

  const user = await getUserAccount(employeeId)
  if (!user) {
    return { error: "User account not found." }
  }
  if (!canResetRole(session.role, user.role)) {
    return { error: "Only superadmins can reset admin and superadmin users." }
  }

  const result = await resetUserPassword(employeeId)
  if ("error" in result) {
    return { error: result.error }
  }

  await createAuditLog({
    actor: session,
    action: "user.password_reset",
    targetType: "user",
    targetId: result.user.employeeId,
    targetLabel: `${result.user.employeeId} (${result.user.role})`,
    details: "Reset password to the stored initial password.",
  })

  revalidatePath("/dashboard/users")
  revalidatePath("/dashboard/logs")

  return {
    success: true,
    employeeId: result.user.employeeId,
    initialPassword: result.initialPassword,
    message: "Password reset to the stored initial password.",
  }
}

export async function deleteUserAction(
  employeeId: string
): Promise<DeleteUserState> {
  const session = await requireDashboardSession()
  if ("error" in session) {
    return session
  }

  const result = await transaction(async (tx) => {
    const user = await getUserAccount(employeeId, tx)
    if (!user) {
      return { error: "User account not found." }
    }

    if (user.employeeId === session.employeeId) {
      return { error: "You cannot delete your own account." }
    }

    if (!canResetRole(session.role, user.role)) {
      return { error: "Only superadmins can delete admin and superadmin users." }
    }

    const deleted = await deleteUserAccount(employeeId, tx)
    if ("error" in deleted) {
      return { error: deleted.error }
    }

    await createAuditLog({
      actor: session,
      action: "user.delete",
      targetType: "user",
      targetId: user.employeeId,
      targetLabel: `${user.employeeId} (${user.role})`,
      details: "Deleted user login account.",
      client: tx,
    })

    return { success: true as const }
  })

  if ("error" in result) {
    return { error: result.error }
  }

  revalidatePath("/dashboard/users")
  revalidatePath("/dashboard/logs")

  return { success: true }
}
