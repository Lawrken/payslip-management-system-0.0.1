"use server"

import { revalidatePath } from "next/cache"

import {
  addPayroll,
  deletePayroll,
  updatePayroll,
} from "@/lib/payrolls"

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
  const fields = parsePayrollFormData(formData)
  const result = addPayroll(fields)

  if ("error" in result) {
    return { error: result.error }
  }

  revalidatePath("/dashboard/payrolls")
  revalidatePath("/dashboard/payslips")
  return { success: true }
}

export async function updatePayrollAction(
  _prevState: UpdatePayrollState,
  formData: FormData
): Promise<UpdatePayrollState> {
  const id = String(formData.get("id") ?? "").trim()
  const fields = parsePayrollFormData(formData)

  if (!id) {
    return { error: "Payroll not found." }
  }

  const result = updatePayroll({ id, ...fields })

  if ("error" in result) {
    return { error: result.error }
  }

  revalidatePath("/dashboard/payrolls")
  revalidatePath("/dashboard/payslips")
  return { success: true }
}

export async function deletePayrollAction(id: string) {
  const result = deletePayroll(id)

  if ("error" in result) {
    return { error: result.error }
  }

  revalidatePath("/dashboard/payrolls")
  revalidatePath("/dashboard/payslips")
  return { success: true as const }
}
