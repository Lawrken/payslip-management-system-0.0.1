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
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")

  if (!email.trim() || !password) {
    return { error: "Email and password are required." }
  }

  const user = await validateCredentials(email, password)
  if (!user) {
    return { error: "Invalid email or password." }
  }

  await setSession(createSessionPayload(user))
  redirect(getHomePath(user.role))
}
