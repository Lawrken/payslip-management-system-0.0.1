"use server"

import { revalidatePath } from "next/cache"

import { db } from "@/db"
import { createAuditLog } from "@/lib/audit-logs"
import { requireDashboardSession } from "@/lib/authorization"
import {
  getCredentialLookupOption,
  getInitialCredentialPassword,
} from "@/lib/credential-exports"
import type { Role } from "@/lib/types"
import {
  createUserAccount,
  deleteUserAccount,
  getUserAccount,
  isRole,
  resetUserPassword,
} from "@/lib/users"

export type UserActionState = {
  error?: string
  success?: boolean
  employeeId?: string
  message?: string
}

export type InitialCredentialResult = {
  employeeId: string
  employeeName: string | null
  role: Role
  password: string
}

export type ViewInitialCredentialByEmployeeIdState = {
  error?: string
  result?: InitialCredentialResult
}

function canManageRole(actorRole: Role, targetRole: Role) {
  if (actorRole === "superAdmin") {
    return true
  }
  return targetRole === "employee"
}

export async function createUserAction(
  _prevState: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const session = await requireDashboardSession()
  if ("error" in session) {
    return session
  }

  const employeeId = String(formData.get("employeeId") ?? "").trim()
  const roleValue = String(formData.get("role") ?? "")
  if (!isRole(roleValue)) {
    return { error: "Choose a valid role." }
  }
  if (!canManageRole(session.role, roleValue)) {
    return { error: "Only superadmins can create admin and superadmin users." }
  }

  const result = await db.transaction(async (tx) => {
    const user = await createUserAccount({
      employeeId,
      role: roleValue,
      createdByEmployeeId: session.employeeId,
      client: tx,
    })

    if ("error" in user) {
      return { error: user.error }
    }

    await createAuditLog({
      actor: session,
      action: "user.create",
      targetType: "user",
      targetId: user.employeeId,
      targetLabel: `${user.employeeId} (${user.role})`,
      details: "Created user account; initial password queued for credential export.",
      client: tx,
    })

    return { success: true as const, employeeId: user.employeeId }
  })

  if ("error" in result) {
    return { error: result.error }
  }

  revalidatePath("/dashboard/users")
  revalidatePath("/dashboard/logs")
  return {
    success: true,
    employeeId: result.employeeId,
    message:
      "User created. Download initial credentials from the Users page (.xlsx).",
  }
}

export async function resetUserPasswordAction(
  employeeId: string
): Promise<UserActionState> {
  const session = await requireDashboardSession()
  if ("error" in session) {
    return session
  }

  const user = await getUserAccount(employeeId)
  if (!user) {
    return { error: "User account not found." }
  }
  if (!canManageRole(session.role, user.role)) {
    return { error: "Only superadmins can reset admin and superadmin users." }
  }

  const result = await db.transaction(async (tx) => {
    const reset = await resetUserPassword(employeeId, tx)
    if ("error" in reset) {
      return { error: reset.error }
    }

    await createAuditLog({
      actor: session,
      action: "user.password_reset",
      targetType: "user",
      targetId: reset.employeeId,
      targetLabel: `${reset.employeeId} (${reset.role})`,
      details: "Restored login to the initial password from credential export.",
      client: tx,
    })

    return { success: true as const, employeeId: reset.employeeId }
  })

  if ("error" in result) {
    return { error: result.error }
  }

  revalidatePath("/dashboard/users")
  revalidatePath("/dashboard/logs")
  return {
    success: true,
    employeeId: result.employeeId,
    message: "Password reset to the initial password.",
  }
}

export async function deleteUserAction(
  employeeId: string
): Promise<UserActionState> {
  const session = await requireDashboardSession()
  if ("error" in session) {
    return session
  }
  if (session.employeeId === employeeId) {
    return { error: "You cannot delete your own account." }
  }

  const user = await getUserAccount(employeeId)
  if (!user) {
    return { error: "User account not found." }
  }
  if (!canManageRole(session.role, user.role)) {
    return { error: "Only superadmins can delete admin and superadmin users." }
  }

  const result = await db.transaction(async (tx) => {
    const deleted = await deleteUserAccount(employeeId, tx)
    if ("error" in deleted) {
      return { error: deleted.error }
    }

    await createAuditLog({
      actor: session,
      action: "user.delete",
      targetType: "user",
      targetId: deleted.employeeId,
      targetLabel: `${deleted.employeeId} (${deleted.role})`,
      details: "Deleted user account.",
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

export async function viewInitialCredentialByEmployeeIdAction(
  employeeId: string
): Promise<ViewInitialCredentialByEmployeeIdState> {
  const session = await requireDashboardSession()
  if ("error" in session) {
    return session
  }

  const option = await getCredentialLookupOption(employeeId)
  if (!option) {
    return { error: "No stored initial password found for this account." }
  }
  if (!canManageRole(session.role, option.role)) {
    return { error: "You are not allowed to view credentials for this account." }
  }

  const credential = await getInitialCredentialPassword(option.employeeId)
  if ("error" in credential) {
    return { error: credential.error }
  }

  await db.transaction(async (tx) => {
    await createAuditLog({
      actor: session,
      action: "credential.view",
      targetType: "credential_exports",
      targetId: option.employeeId,
      targetLabel: option.employeeId,
      details: "Viewed initial credential via lookup.",
      client: tx,
    })
  })

  return {
    result: {
      employeeId: option.employeeId,
      employeeName: option.employeeName,
      role: option.role,
      password: credential.password,
    },
  }
}
