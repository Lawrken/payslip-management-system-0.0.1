"use server"

import { revalidatePath } from "next/cache"

import { db } from "@/db"
import { createAuditLog } from "@/lib/audit-logs"
import {
  requireAdminSession,
  requireDashboardSession,
  requireSuperAdminSession,
} from "@/lib/authorization"
import {
  approvePayslipByAdmin,
  approvePayslipBySuperAdmin,
  areAllPayslipsApproved,
  getApprovedPayslipEmailById,
  getApprovedPayslipEmailsByPayrollId,
  getPayslipsByPayrollId,
  markPayslipsSentByIds,
  returnPayslipByAdmin,
  returnPayslipBySuperAdmin,
} from "@/lib/payslips"
import { sendPayslipEmail, sendPayslipEmailBatch } from "@/lib/payslip-email"

export type ReviewActionState = {
  error?: string
  success?: boolean
  count?: number
  failedCount?: number
  failed?: {
    employeeId: string
    employeeName: string
    email: string
    error: string
  }[]
}

export async function adminApprovePayslipAction(
  id: string
): Promise<ReviewActionState> {
  const session = await requireAdminSession()
  if ("error" in session) {
    return session
  }

  const result = await db.transaction(async (tx) => {
    const payslip = await approvePayslipByAdmin(id, tx)
    if ("error" in payslip) {
      return { error: payslip.error }
    }

    await createAuditLog({
      actor: session,
      action: "payslip.admin_check",
      targetType: "payslip",
      targetId: payslip.id,
      targetLabel: `${payslip.employeeName} (${payslip.employeeId})`,
      details: "Marked payslip checked for superadmin approval.",
      client: tx,
    })

    return { success: true as const }
  })

  if ("error" in result) {
    return { error: result.error }
  }

  revalidatePath("/dashboard/review")
  revalidatePath("/dashboard/payslips")
  revalidatePath("/dashboard/logs")
  return { success: true }
}

export async function superAdminApprovePayslipAction(
  id: string
): Promise<ReviewActionState> {
  const session = await requireSuperAdminSession()
  if ("error" in session) {
    return session
  }

  const result = await db.transaction(async (tx) => {
    const payslip = await approvePayslipBySuperAdmin(id, tx)
    if ("error" in payslip) {
      return { error: payslip.error }
    }

    await createAuditLog({
      actor: session,
      action: "payslip.superadmin_approve",
      targetType: "payslip",
      targetId: payslip.id,
      targetLabel: `${payslip.employeeName} (${payslip.employeeId})`,
      details: "Marked payslip ready for email.",
      client: tx,
    })

    return { success: true as const }
  })

  if ("error" in result) {
    return { error: result.error }
  }

  revalidatePath("/dashboard/review")
  revalidatePath("/dashboard/payslips")
  revalidatePath("/dashboard/logs")
  return { success: true }
}

export async function returnPayslipAction(
  id: string
): Promise<ReviewActionState> {
  const session = await requireDashboardSession()
  if ("error" in session) {
    return session
  }

  const result = await db.transaction(async (tx) => {
    const payslip =
      session.role === "admin"
        ? await returnPayslipByAdmin(id, tx)
        : await returnPayslipBySuperAdmin(id, tx)

    if ("error" in payslip) {
      return { error: payslip.error }
    }

    await createAuditLog({
      actor: session,
      action: "payslip.return",
      targetType: "payslip",
      targetId: payslip.id,
      targetLabel: `${payslip.employeeName} (${payslip.employeeId})`,
      details: "Returned payslip for edits.",
      client: tx,
    })

    return { success: true as const }
  })

  if ("error" in result) {
    return { error: result.error }
  }

  revalidatePath("/dashboard/review")
  revalidatePath("/dashboard/payslips")
  revalidatePath("/dashboard/logs")
  return { success: true }
}

function getEmailError(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Failed to send payslip email."
}

export async function sendPayslipEmailAction(id: string) {
  const session = await requireSuperAdminSession()
  if ("error" in session) {
    return session
  }

  const payslip = await getApprovedPayslipEmailById(id)
  if (!payslip) {
    return { error: "Only payslips ready for email can be sent." }
  }

  try {
    await sendPayslipEmail(payslip)
  } catch (error) {
    return { error: getEmailError(error) }
  }

  const result = await db.transaction(async (tx) => {
    const marked = await markPayslipsSentByIds([id], tx)
    if ("error" in marked) {
      return { error: marked.error }
    }

    await createAuditLog({
      actor: session,
      action: "payslip.email_send",
      targetType: "payslip",
      targetId: payslip.id,
      targetLabel: `${payslip.employeeName} (${payslip.employeeId})`,
      details: `Sent payslip email to ${payslip.employeeEmail}.`,
      client: tx,
    })

    return { success: true as const, count: marked.count }
  })

  if ("error" in result) {
    return { error: result.error }
  }

  revalidatePath("/dashboard/review")
  revalidatePath("/dashboard/payslips")
  revalidatePath("/dashboard/logs")
  revalidatePath("/payslip")
  return result
}

export async function bulkEmailAction(payrollId: string) {
  const session = await requireSuperAdminSession()
  if ("error" in session) {
    return session
  }

  if (!(await areAllPayslipsApproved(payrollId))) {
    return {
      error: "All payslips must be ready for email before sending bulk email.",
    }
  }

  const [payrollPayslips, emailPayslips] = await Promise.all([
    getPayslipsByPayrollId(payrollId),
    getApprovedPayslipEmailsByPayrollId(payrollId),
  ])

  if (emailPayslips.length !== payrollPayslips.length) {
    return {
      error:
        "Every payslip must have a matching employee record and email before sending bulk email.",
    }
  }

  let sent: Awaited<ReturnType<typeof sendPayslipEmailBatch>>
  try {
    sent = await sendPayslipEmailBatch(emailPayslips)
  } catch (error) {
    return { error: getEmailError(error) }
  }
  const sentIds = sent.sent.map((payslip) => payslip.id)

  const result = await db.transaction(async (tx) => {
    const marked = await markPayslipsSentByIds(sentIds, tx)
    if ("error" in marked) {
      return { error: marked.error }
    }

    const failedDetails =
      sent.failed.length > 0
        ? ` ${sent.failed.length} failed: ${sent.failed
            .map(
              ({ payslip }) => `${payslip.employeeName} (${payslip.employeeId})`
            )
            .join(", ")}.`
        : ""

    await createAuditLog({
      actor: session,
      action: "payslip.bulk_send",
      targetType: "payroll",
      targetId: payrollId,
      targetLabel: payrollId,
      details: `Sent ${marked.count} payslip email${marked.count === 1 ? "" : "s"} via Gmail API.${failedDetails}`,
      client: tx,
    })

    return {
      success: true as const,
      count: marked.count,
      failedCount: sent.failed.length,
      failed: sent.failed.map(({ payslip, error }) => ({
        employeeId: payslip.employeeId,
        employeeName: payslip.employeeName,
        email: payslip.employeeEmail,
        error,
      })),
    }
  })

  if ("error" in result) {
    return { error: result.error }
  }

  revalidatePath("/dashboard/review")
  revalidatePath("/dashboard/payslips")
  revalidatePath("/dashboard/logs")
  revalidatePath("/payslip")
  return result
}
