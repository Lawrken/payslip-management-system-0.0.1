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
  returnPayslipByAdmin,
  returnPayslipBySuperAdmin,
  sendApprovedPayslips,
} from "@/lib/payslips"

export type ReviewActionState = {
  error?: string
  success?: boolean
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

export async function bulkEmailAction(payrollId: string) {
  const session = await requireSuperAdminSession()
  if ("error" in session) {
    return session
  }

  const result = await db.transaction(async (tx) => {
    if (!(await areAllPayslipsApproved(payrollId, tx))) {
      return { error: "All payslips must be ready for email before sending bulk email." }
    }

    const sent = await sendApprovedPayslips(payrollId, tx)
    if ("error" in sent) {
      return { error: sent.error }
    }

    await createAuditLog({
      actor: session,
      action: "payslip.bulk_send",
      targetType: "payroll",
      targetId: payrollId,
      targetLabel: payrollId,
      details: `Marked ${sent.count} payslip${sent.count === 1 ? "" : "s"} ready for email as sent.`,
      client: tx,
    })

    return { success: true as const, count: sent.count }
  })

  if ("error" in result) {
    return { error: result.error }
  }

  revalidatePath("/dashboard/review")
  revalidatePath("/dashboard/payslips")
  revalidatePath("/dashboard/logs")
  return result
}
