"use server"

import { revalidatePath } from "next/cache"

import { createAuditLog } from "@/lib/audit-logs"
import { requireDashboardSession } from "@/lib/authorization"
import type { Role } from "@/lib/types"
import { getUserAccount, resetUserPassword } from "@/lib/users"

export type ResetUserPasswordState = {
  error?: string
  success?: boolean
  employeeId?: string
  initialPassword?: string
  message?: string
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
