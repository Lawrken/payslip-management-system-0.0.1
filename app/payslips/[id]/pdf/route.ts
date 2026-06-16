import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import type { NextRequest } from "next/server"

import { db } from "@/db"
import { users } from "@/db/schema"
import { requireEmployeeSession } from "@/lib/authorization"
import { normalizeEmployeeId } from "@/lib/auth-helpers"
import { buildPasswordLockedPayslipPdf } from "@/lib/payslip-pdf"
import { getVisibleEmployeePayslipDetailsByEmployeeAndId } from "@/lib/payslips"

export const dynamic = "force-dynamic"

function safeFilename(value: string) {
  return (
    value
      .replace(/[^a-z0-9._-]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "payslip"
  )
}

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireEmployeeSession()
  if ("error" in session) {
    return jsonError(session.error, 401)
  }

  let currentPassword = ""
  try {
    const body = (await request.json()) as { currentPassword?: unknown }
    currentPassword =
      typeof body.currentPassword === "string" ? body.currentPassword : ""
  } catch {
    return jsonError("Current password is required.", 400)
  }

  if (!currentPassword) {
    return jsonError("Current password is required.", 400)
  }

  const employeeId = normalizeEmployeeId(session.employeeId)
  const user = await db.query.users.findFirst({
    where: eq(users.employeeId, employeeId),
  })
  if (!user) {
    return jsonError("User account not found.", 404)
  }

  const isCurrentPasswordValid = await bcrypt.compare(
    currentPassword,
    user.passwordHash
  )
  if (!isCurrentPasswordValid) {
    return jsonError("Current password is incorrect.", 400)
  }

  const { id } = await params
  const payslip = await getVisibleEmployeePayslipDetailsByEmployeeAndId(
    employeeId,
    id
  )
  if (!payslip) {
    return jsonError("Payslip not found.", 404)
  }

  const pdf = await buildPasswordLockedPayslipPdf(payslip, currentPassword)
  const filename = safeFilename(
    `${payslip.employeeId}-${payslip.payrollPeriodLabel}`
  )

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}.pdf"`,
      "Cache-Control": "no-store",
    },
  })
}
