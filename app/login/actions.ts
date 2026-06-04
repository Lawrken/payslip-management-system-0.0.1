"use server"

import { redirect } from "next/navigation"

import { createSessionPayload, getHomePath } from "@/lib/auth-helpers"
import { validateCredentials } from "@/lib/auth"
import { setSession } from "@/lib/session"

export type LoginState = {
  error?: string
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const employeeId = String(formData.get("employeeId") ?? "")
  const password = String(formData.get("password") ?? "")

  if (!employeeId.trim() || !password) {
    return { error: "Employee ID and password are required." }
  }

  const user = await validateCredentials(employeeId, password)
  if (!user) {
    return { error: "Invalid employee ID or password." }
  }

  await setSession(createSessionPayload(user))
  redirect(getHomePath(user.role))
}
