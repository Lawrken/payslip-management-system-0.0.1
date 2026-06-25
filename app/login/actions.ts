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

  let user: Awaited<ReturnType<typeof validateCredentials>>
  try {
    user = await validateCredentials(email, password)
  } catch {
    return {
      error: "Service is temporarily unavailable. Please try again in a moment.",
    }
  }
  if (!user) {
    return { error: "Invalid email or password." }
  }

  await setSession(createSessionPayload(user))
  redirect(getHomePath(user.role))
}
