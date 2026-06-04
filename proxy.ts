import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import {
  getHomePath,
  isDashboardRole,
  parseSession,
} from "@/lib/auth-helpers"
import { SESSION_COOKIE_NAME } from "@/lib/session"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = parseSession(request.cookies.get(SESSION_COOKIE_NAME)?.value)

  const isLogin = pathname === "/login"
  const isDashboard = pathname.startsWith("/dashboard")
  const isPayslip = pathname.startsWith("/payslip")

  if (isLogin && session) {
    return NextResponse.redirect(new URL(getHomePath(session.role), request.url))
  }

  if ((isDashboard || isPayslip) && !session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (session && isDashboard && !isDashboardRole(session.role)) {
    return NextResponse.redirect(new URL("/payslip", request.url))
  }

  if (session && isPayslip && isDashboardRole(session.role)) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/payslip/:path*", "/login"],
}
