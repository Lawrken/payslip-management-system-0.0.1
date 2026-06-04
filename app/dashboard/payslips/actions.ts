"use server"

import { revalidatePath } from "next/cache"

import { createAuditLog } from "@/lib/audit-logs"
import { requireDashboardSession } from "@/lib/authorization"
import {
  addPayslip,
  deletePayslip,
  getPayslipById,
  updatePayslip,
} from "@/lib/payslips"
import {
  calculatePayslipTotals,
  parsePayslipInputsFromFormData,
} from "@/lib/payroll-calculator"

export type PayslipFormState = {
  error?: string
  success?: boolean
}

export type AddPayslipState = PayslipFormState
export type UpdatePayslipState = PayslipFormState

export async function addPayslipAction(
  _prevState: AddPayslipState,
  formData: FormData
): Promise<AddPayslipState> {
  const session = await requireDashboardSession()
  if ("error" in session) {
    return session
  }

  const payrollId = String(formData.get("payrollId") ?? "").trim()
  const employeeId = String(formData.get("employeeId") ?? "").trim()

  if (!payrollId || !employeeId) {
    return { error: "Payroll period and employee are required." }
  }

  const parsedInputs = parsePayslipInputsFromFormData(formData)
  if ("error" in parsedInputs) {
    return { error: parsedInputs.error }
  }

  calculatePayslipTotals(parsedInputs)

  const result = await addPayslip({
    payrollId,
    employeeId,
    inputs: parsedInputs,
  })

  if ("error" in result) {
    return { error: result.error }
  }

  await createAuditLog({
    actor: session,
    action: "payslip.create",
    targetType: "payslip",
    targetId: result.id,
    targetLabel: `${result.employeeName} (${result.employeeId})`,
    details: "Created payslip.",
  })

  revalidatePath("/dashboard/payslips")
  revalidatePath("/dashboard/review")
  revalidatePath("/dashboard/logs")
  return { success: true }
}

export async function updatePayslipAction(
  _prevState: UpdatePayslipState,
  formData: FormData
): Promise<UpdatePayslipState> {
  const session = await requireDashboardSession()
  if ("error" in session) {
    return session
  }

  const id = String(formData.get("id") ?? "").trim()
  const payrollId = String(formData.get("payrollId") ?? "").trim()
  const employeeId = String(formData.get("employeeId") ?? "").trim()

  if (!id) {
    return { error: "Payslip not found." }
  }
  if (!payrollId || !employeeId) {
    return { error: "Payroll period and employee are required." }
  }

  const parsedInputs = parsePayslipInputsFromFormData(formData)
  if ("error" in parsedInputs) {
    return { error: parsedInputs.error }
  }

  calculatePayslipTotals(parsedInputs)

  const result = await updatePayslip({
    id,
    payrollId,
    employeeId,
    inputs: parsedInputs,
  })

  if ("error" in result) {
    return { error: result.error }
  }

  await createAuditLog({
    actor: session,
    action: "payslip.update",
    targetType: "payslip",
    targetId: result.id,
    targetLabel: `${result.employeeName} (${result.employeeId})`,
    details: `Updated payslip. Status is now ${result.status}.`,
  })

  revalidatePath("/dashboard/payslips")
  revalidatePath("/dashboard/review")
  revalidatePath("/dashboard/logs")
  return { success: true }
}

export async function deletePayslipAction(id: string) {
  const session = await requireDashboardSession()
  if ("error" in session) {
    return session
  }

  const payslip = await getPayslipById(id)
  const result = await deletePayslip(id)

  if ("error" in result) {
    return { error: result.error }
  }

  await createAuditLog({
    actor: session,
    action: "payslip.delete",
    targetType: "payslip",
    targetId: id,
    targetLabel: payslip
      ? `${payslip.employeeName} (${payslip.employeeId})`
      : "Deleted payslip",
    details: "Deleted payslip.",
  })

  revalidatePath("/dashboard/payslips")
  revalidatePath("/dashboard/review")
  revalidatePath("/dashboard/logs")
  return { success: true as const }
}
