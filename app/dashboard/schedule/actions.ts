"use server"

import { revalidatePath } from "next/cache"

import { db } from "@/db"
import { createAuditLog } from "@/lib/audit-logs"
import { requireDashboardSession } from "@/lib/authorization"
import {
  getScheduleByPayrollAndEmployee,
  upsertEmployeeSchedule,
} from "@/lib/employee-schedules"
import { getPayrollById } from "@/lib/payrolls"
import {
  getPayslipByPayrollAndEmployee,
  refreshPayslipFromSchedule,
} from "@/lib/payslips"
import { parseScheduleDaysFromFormData } from "@/lib/schedule-days"

export type SaveEmployeeScheduleState = {
  error?: string
  success?: boolean
}

export async function saveEmployeeScheduleAction(
  _prevState: SaveEmployeeScheduleState,
  formData: FormData
): Promise<SaveEmployeeScheduleState> {
  const session = await requireDashboardSession()
  if ("error" in session) {
    return session
  }

  const payrollId = String(formData.get("payrollId") ?? "").trim()
  const employeeId = String(formData.get("employeeId") ?? "").trim()

  if (!payrollId || !employeeId) {
    return { error: "Payroll period and employee are required." }
  }

  const days = parseScheduleDaysFromFormData(formData)
  if ("error" in days) {
    return { error: days.error }
  }

  const payroll = await getPayrollById(payrollId)
  if (!payroll) {
    return { error: "Payroll not found." }
  }

  const payslip = await getPayslipByPayrollAndEmployee(payrollId, employeeId)
  if (!payslip) {
    return { error: "Employee payslip not found for this payroll period." }
  }

  const existing = await getScheduleByPayrollAndEmployee(payrollId, employeeId)

  const result = await db.transaction(async (tx) => {
    const schedule = await upsertEmployeeSchedule(
      { payrollId, employeeId, days },
      tx
    )

    if ("error" in schedule) {
      return { error: schedule.error }
    }

    const refreshedPayslip = await refreshPayslipFromSchedule(
      payrollId,
      employeeId,
      tx
    )
    if ("error" in refreshedPayslip) {
      return { error: refreshedPayslip.error }
    }

    await createAuditLog({
      actor: session,
      action: existing ? "schedule.update" : "schedule.create",
      targetType: "employee_schedule",
      targetId: schedule.id,
      targetLabel: `${payslip.employeeName} (${employeeId})`,
      details: existing
        ? "Updated employee schedule."
        : "Created employee schedule.",
      client: tx,
    })

    return { success: true as const }
  })

  if ("error" in result) {
    return { error: result.error }
  }

  revalidatePath("/dashboard/schedule")
  revalidatePath("/dashboard/payslips")
  revalidatePath("/dashboard/review")
  revalidatePath("/dashboard/logs")
  return { success: true }
}
