"use server"

import { revalidatePath } from "next/cache"

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

  const result = await createUserAccount({
    employeeId,
    role: roleValue,
    createdByEmployeeId: session.employeeId,
  })
  if ("error" in result) {
    return { error: result.error }
  }

  await createAuditLog({
    actor: session,
    action: "user.create",
    targetType: "user",
    targetId: result.employeeId,
    targetLabel: `${result.employeeId} (${result.role})`,
    details: "Created user account; initial password queued for credential export.",
  })

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

  const result = await resetUserPassword(employeeId)
  if ("error" in result) {
    return { error: result.error }
  }

  await createAuditLog({
    actor: session,
    action: "user.password_reset",
    targetType: "user",
    targetId: result.employeeId,
    targetLabel: `${result.employeeId} (${result.role})`,
    details: "Restored login to the initial password from credential export.",
  })

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

  const result = await deleteUserAccount(employeeId)
  if ("error" in result) {
    return { error: result.error }
  }

  await createAuditLog({
    actor: session,
    action: "user.delete",
    targetType: "user",
    targetId: result.employeeId,
    targetLabel: `${result.employeeId} (${result.role})`,
    details: "Deleted user account.",
  })

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

  await createAuditLog({
    actor: session,
    action: "credential.view",
    targetType: "credential_exports",
    targetId: option.employeeId,
    targetLabel: option.employeeId,
    details: "Viewed initial credential via lookup.",
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
