import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import {
  getHomePath,
  parseSession,
} from "@/lib/auth-helpers"
import { SESSION_COOKIE_NAME } from "@/lib/session"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = parseSession(request.cookies.get(SESSION_COOKIE_NAME)?.value)

  const isLogin = pathname === "/login"
  const isDashboard = pathname.startsWith("/dashboard")

  if (isLogin && session) {
    return NextResponse.redirect(new URL(getHomePath(session.role), request.url))
  }

  if (isDashboard && !session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
}
