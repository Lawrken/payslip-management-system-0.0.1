"use server"

import { revalidatePath } from "next/cache"

import { db } from "@/db"
import { createAuditLog } from "@/lib/audit-logs"
import { requireDashboardSession } from "@/lib/authorization"
import {
  addPayslip,
  deletePayslip,
  getPayslipById,
  updatePayslip,
} from "@/lib/payslips"
import { parsePayslipInputsFromFormData } from "@/lib/payroll-calculator"

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

  const result = await db.transaction(async (tx) => {
    const payslip = await addPayslip(
      {
        payrollId,
        employeeId,
        inputs: parsedInputs,
      },
      tx
    )

    if ("error" in payslip) {
      return { error: payslip.error }
    }

    await createAuditLog({
      actor: session,
      action: "payslip.create",
      targetType: "payslip",
      targetId: payslip.id,
      targetLabel: `${payslip.employeeName} (${payslip.employeeId})`,
      details: "Created payslip.",
      client: tx,
    })

    return { success: true as const }
  })

  if ("error" in result) {
    return { error: result.error }
  }

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

  const result = await db.transaction(async (tx) => {
    const payslip = await updatePayslip(
      {
        id,
        payrollId,
        employeeId,
        inputs: parsedInputs,
      },
      tx
    )

    if ("error" in payslip) {
      return { error: payslip.error }
    }

    await createAuditLog({
      actor: session,
      action: "payslip.update",
      targetType: "payslip",
      targetId: payslip.id,
      targetLabel: `${payslip.employeeName} (${payslip.employeeId})`,
      details: `Updated payslip. Status is now ${payslip.status}.`,
      client: tx,
    })

    return { success: true as const }
  })

  if ("error" in result) {
    return { error: result.error }
  }

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

  const result = await db.transaction(async (tx) => {
    const payslip = await getPayslipById(id, tx)
    const deleted = await deletePayslip(id, tx)

    if ("error" in deleted) {
      return { error: deleted.error }
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
      client: tx,
    })

    return { success: true as const }
  })

  if ("error" in result) {
    return { error: result.error }
  }

  revalidatePath("/dashboard/payslips")
  revalidatePath("/dashboard/review")
  revalidatePath("/dashboard/logs")
  return { success: true as const }
}
