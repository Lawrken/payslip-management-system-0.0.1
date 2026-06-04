import { cookies } from "next/headers"

import { parseSession, serializeSession } from "@/lib/auth-helpers"
import type { Session } from "@/lib/types"

export const SESSION_COOKIE_NAME = "payslip_session"

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const value = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!value) {
    return null
  }

  return parseSession(value)
}

export async function setSession(session: Session): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, serializeSession(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  })
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
