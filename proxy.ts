import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { getHomePath, isDashboardRole, parseSession } from "@/lib/auth-helpers"
import { SESSION_COOKIE_NAME } from "@/lib/session"

function getLegacyPayslipsRedirect(pathname: string, request: NextRequest) {
  if (pathname === "/payslips") {
    return NextResponse.redirect(new URL("/employee", request.url))
  }

  if (pathname.startsWith("/payslips/")) {
    const nextPath = pathname.replace(/^\/payslips/, "/employee/payslips")
    return NextResponse.redirect(new URL(nextPath, request.url))
  }

  return null
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const legacyRedirect = getLegacyPayslipsRedirect(pathname, request)
  if (legacyRedirect) {
    return legacyRedirect
  }

  const session = parseSession(request.cookies.get(SESSION_COOKIE_NAME)?.value)

  const isLogin = pathname === "/login"
  const isDashboard = pathname.startsWith("/dashboard")
  const isEmployee = pathname.startsWith("/employee")

  if (isLogin && session) {
    return NextResponse.redirect(
      new URL(getHomePath(session.role), request.url)
    )
  }

  if ((isDashboard || isEmployee) && !session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (session && isDashboard && !isDashboardRole(session.role)) {
    return NextResponse.redirect(new URL("/employee", request.url))
  }

  if (session && isEmployee && isDashboardRole(session.role)) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/employee/:path*", "/payslips/:path*", "/login"],
}
