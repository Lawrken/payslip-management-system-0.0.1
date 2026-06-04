"use server"

import { revalidatePath } from "next/cache"

import {
  addPayroll,
  deletePayroll,
  getPayrollById,
  updatePayroll,
} from "@/lib/payrolls"
import { createAuditLog } from "@/lib/audit-logs"
import { requireDashboardSession } from "@/lib/authorization"

export type PayrollFormState = {
  error?: string
  success?: boolean
}

export type AddPayrollState = PayrollFormState
export type UpdatePayrollState = PayrollFormState

function parsePayrollFormData(formData: FormData) {
  return {
    payrollPeriodStart: String(formData.get("payrollPeriodStart") ?? "").trim(),
    payrollPeriodEnd: String(formData.get("payrollPeriodEnd") ?? "").trim(),
    dtrCutOffStart: String(formData.get("dtrCutOffStart") ?? "").trim(),
    dtrCutOffEnd: String(formData.get("dtrCutOffEnd") ?? "").trim(),
    payoutDate: String(formData.get("payoutDate") ?? "").trim(),
  }
}

export async function addPayrollAction(
  _prevState: AddPayrollState,
  formData: FormData
): Promise<AddPayrollState> {
  const session = await requireDashboardSession()
  if ("error" in session) {
    return session
  }

  const fields = parsePayrollFormData(formData)
  const result = await addPayroll(fields)

  if ("error" in result) {
    return { error: result.error }
  }

  await createAuditLog({
    actor: session,
    action: "payroll.create",
    targetType: "payroll",
    targetId: result.id,
    targetLabel: result.payrollPeriodLabel,
    details: "Created payroll period and draft payslips.",
  })

  revalidatePath("/dashboard/payrolls")
  revalidatePath("/dashboard/payslips")
  revalidatePath("/dashboard/review")
  revalidatePath("/dashboard/logs")
  return { success: true }
}

export async function updatePayrollAction(
  _prevState: UpdatePayrollState,
  formData: FormData
): Promise<UpdatePayrollState> {
  const session = await requireDashboardSession()
  if ("error" in session) {
    return session
  }

  const id = String(formData.get("id") ?? "").trim()
  const fields = parsePayrollFormData(formData)

  if (!id) {
    return { error: "Payroll not found." }
  }

  const result = await updatePayroll({ id, ...fields })

  if ("error" in result) {
    return { error: result.error }
  }

  await createAuditLog({
    actor: session,
    action: "payroll.update",
    targetType: "payroll",
    targetId: result.id,
    targetLabel: result.payrollPeriodLabel,
    details: "Updated payroll period.",
  })

  revalidatePath("/dashboard/payrolls")
  revalidatePath("/dashboard/payslips")
  revalidatePath("/dashboard/review")
  revalidatePath("/dashboard/logs")
  return { success: true }
}

export async function deletePayrollAction(id: string) {
  const session = await requireDashboardSession()
  if ("error" in session) {
    return session
  }

  const payroll = await getPayrollById(id)
  const result = await deletePayroll(id)

  if ("error" in result) {
    return { error: result.error }
  }

  await createAuditLog({
    actor: session,
    action: "payroll.delete",
    targetType: "payroll",
    targetId: id,
    targetLabel: payroll?.payrollPeriodLabel ?? "Deleted payroll",
    details: "Deleted payroll period and its payslips.",
  })

  revalidatePath("/dashboard/payrolls")
  revalidatePath("/dashboard/payslips")
  revalidatePath("/dashboard/review")
  revalidatePath("/dashboard/logs")
  return { success: true as const }
}
