"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { clearSession, getSession } from "@/lib/session"
import { changeUserPassword } from "@/lib/users"

export type ChangePasswordState = {
  error?: string
  success?: boolean
}

export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await getSession()
  if (!session) {
    return { error: "Unauthorized." }
  }

  const currentPassword = String(formData.get("currentPassword") ?? "")
  const newPassword = String(formData.get("newPassword") ?? "")
  const confirmPassword = String(formData.get("confirmPassword") ?? "")

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "All password fields are required." }
  }

  if (newPassword !== confirmPassword) {
    return { error: "New password and confirmation do not match." }
  }

  const result = await changeUserPassword({
    employeeId: session.employeeId,
    currentPassword,
    newPassword,
  })

  if ("error" in result) {
    return { error: result.error }
  }

  revalidatePath("/dashboard/account/password")
  revalidatePath("/payslips")
  return { success: true }
}

export async function logoutAction() {
  await clearSession()
  redirect("/login")
}
