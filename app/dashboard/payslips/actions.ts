"use server"

import { revalidatePath } from "next/cache"

import {
  addPayslip,
  deletePayslip,
  sendPendingPayslips,
  updatePayslip,
} from "@/lib/payslips"
import {
  calculatePayslipTotals,
  parsePayslipInputsFromFormData,
} from "@/lib/payroll-calculator"
import type { PayslipStatus } from "@/lib/types"

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

  const result = addPayslip({
    payrollId,
    employeeId,
    inputs: parsedInputs,
  })

  if ("error" in result) {
    return { error: result.error }
  }

  revalidatePath("/dashboard/payslips")
  return { success: true }
}

export async function updatePayslipAction(
  _prevState: UpdatePayslipState,
  formData: FormData
): Promise<UpdatePayslipState> {
  const id = String(formData.get("id") ?? "").trim()
  const payrollId = String(formData.get("payrollId") ?? "").trim()
  const employeeId = String(formData.get("employeeId") ?? "").trim()
  const status = String(formData.get("status") ?? "").trim() as PayslipStatus

  if (!id) {
    return { error: "Payslip not found." }
  }
  if (!payrollId || !employeeId) {
    return { error: "Payroll period and employee are required." }
  }
  if (status !== "pending" && status !== "sent") {
    return { error: "Invalid status." }
  }

  const parsedInputs = parsePayslipInputsFromFormData(formData)
  if ("error" in parsedInputs) {
    return { error: parsedInputs.error }
  }

  calculatePayslipTotals(parsedInputs)

  const result = updatePayslip({
    id,
    payrollId,
    employeeId,
    status,
    inputs: parsedInputs,
  })

  if ("error" in result) {
    return { error: result.error }
  }

  revalidatePath("/dashboard/payslips")
  return { success: true }
}

export async function deletePayslipAction(id: string) {
  const result = deletePayslip(id)

  if ("error" in result) {
    return { error: result.error }
  }

  revalidatePath("/dashboard/payslips")
  return { success: true as const }
}

export async function bulkEmailAction(payrollId: string) {
  const result = sendPendingPayslips(payrollId)
  if ("error" in result) {
    return { error: result.error }
  }

  revalidatePath("/dashboard/payslips")
  return { success: true as const, count: result.count }
}
