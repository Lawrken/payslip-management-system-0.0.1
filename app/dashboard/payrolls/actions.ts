"use server"

import { revalidatePath } from "next/cache"

import { db, transaction } from "@/db"
import { parseDtrDaysFromFormData } from "@/lib/dtr-days"
import {
  addPayroll,
  deletePayroll,
  getPayrollById,
  updatePayroll,
} from "@/lib/payrolls"
import { createAuditLog } from "@/lib/audit-logs"
import { requireDashboardSession } from "@/lib/authorization"

type PayrollFormState = {
  error?: string
  success?: boolean
}

export type AddPayrollState = PayrollFormState
export type UpdatePayrollState = PayrollFormState

function parsePayrollFormData(formData: FormData) {
  const dtrDays = parseDtrDaysFromFormData(formData)
  if ("error" in dtrDays) {
    return dtrDays
  }

  return {
    payrollPeriodStart: String(formData.get("payrollPeriodStart") ?? "").trim(),
    payrollPeriodEnd: String(formData.get("payrollPeriodEnd") ?? "").trim(),
    dtrCutOffStart: String(formData.get("dtrCutOffStart") ?? "").trim(),
    dtrCutOffEnd: String(formData.get("dtrCutOffEnd") ?? "").trim(),
    payoutDate: String(formData.get("payoutDate") ?? "").trim(),
    dtrDays,
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
  if ("error" in fields) {
    return { error: fields.error }
  }

  const result = await transaction(async (tx) => {
    const payroll = await addPayroll(fields, tx)

    if ("error" in payroll) {
      return { error: payroll.error }
    }

    await createAuditLog({
      actor: session,
      action: "payroll.create",
      targetType: "payroll",
      targetId: payroll.id,
      targetLabel: payroll.payrollPeriodLabel,
      details: "Created payroll period and draft payslips.",
      client: tx,
    })

    return { success: true as const }
  })

  if ("error" in result) {
    return { error: result.error }
  }

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

  if ("error" in fields) {
    return { error: fields.error }
  }

  const result = await transaction(async (tx) => {
    const payroll = await updatePayroll({ id, ...fields }, tx)

    if ("error" in payroll) {
      return { error: payroll.error }
    }

    await createAuditLog({
      actor: session,
      action: "payroll.update",
      targetType: "payroll",
      targetId: payroll.id,
      targetLabel: payroll.payrollPeriodLabel,
      details: "Updated payroll period.",
      client: tx,
    })

    return { success: true as const }
  })

  if ("error" in result) {
    return { error: result.error }
  }

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

  const result = await transaction(async (tx) => {
    const payroll = await getPayrollById(id, tx)
    const deleted = await deletePayroll(id, tx)

    if ("error" in deleted) {
      return { error: deleted.error }
    }

    await createAuditLog({
      actor: session,
      action: "payroll.delete",
      targetType: "payroll",
      targetId: id,
      targetLabel: payroll?.payrollPeriodLabel ?? "Deleted payroll",
      details: "Deleted payroll period and its payslips.",
      client: tx,
    })

    return { success: true as const }
  })

  if ("error" in result) {
    return { error: result.error }
  }

  revalidatePath("/dashboard/payrolls")
  revalidatePath("/dashboard/payslips")
  revalidatePath("/dashboard/review")
  revalidatePath("/dashboard/logs")
  return { success: true as const }
}
