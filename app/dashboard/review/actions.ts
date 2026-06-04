"use server"

import { revalidatePath } from "next/cache"

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

  const result = await approvePayslipByAdmin(id)
  if ("error" in result) {
    return { error: result.error }
  }

  await createAuditLog({
    actor: session,
    action: "payslip.admin_check",
    targetType: "payslip",
    targetId: result.id,
    targetLabel: `${result.employeeName} (${result.employeeId})`,
    details: "Marked payslip checked for superadmin approval.",
  })

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

  const result = await approvePayslipBySuperAdmin(id)
  if ("error" in result) {
    return { error: result.error }
  }

  await createAuditLog({
    actor: session,
    action: "payslip.superadmin_approve",
    targetType: "payslip",
    targetId: result.id,
    targetLabel: `${result.employeeName} (${result.employeeId})`,
    details: "Approved payslip.",
  })

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

  const result =
    session.role === "admin"
      ? await returnPayslipByAdmin(id)
      : await returnPayslipBySuperAdmin(id)

  if ("error" in result) {
    return { error: result.error }
  }

  await createAuditLog({
    actor: session,
    action: "payslip.return",
    targetType: "payslip",
    targetId: result.id,
    targetLabel: `${result.employeeName} (${result.employeeId})`,
    details: "Returned payslip for edits.",
  })

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

  if (!(await areAllPayslipsApproved(payrollId))) {
    return { error: "All payslips must be approved before sending bulk email." }
  }

  const result = await sendApprovedPayslips(payrollId)
  if ("error" in result) {
    return { error: result.error }
  }

  await createAuditLog({
    actor: session,
    action: "payslip.bulk_send",
    targetType: "payroll",
    targetId: payrollId,
    targetLabel: payrollId,
    details: `Marked ${result.count} approved payslip${result.count === 1 ? "" : "s"} as sent.`,
  })

  revalidatePath("/dashboard/review")
  revalidatePath("/dashboard/payslips")
  revalidatePath("/dashboard/logs")
  return { success: true as const, count: result.count }
}
