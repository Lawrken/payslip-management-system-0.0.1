import "server-only"

import { revalidatePath } from "next/cache"

import { db } from "@/db"
import { createAuditLog } from "@/lib/audit-logs"
import type { Session } from "@/lib/types"
import { getPayrollById } from "@/lib/payrolls"
import { refreshPayslipFromSchedule, updatePayslip } from "@/lib/payslips"
import { upsertEmployeeSchedule } from "@/lib/employee-schedules"
import {
  groupScheduleRowsByEmployee,
  resolveScheduleErrorRowId,
  scheduleRowsToDays,
  type ScheduleSpreadsheetRow,
} from "@/lib/spreadsheet/schedules"
import {
  spreadsheetRowToPayslipInputs,
  type PayslipSpreadsheetRow,
} from "@/lib/spreadsheet/payslips"
import type { BulkSaveResult } from "@/lib/spreadsheet/types"

function revalidatePayrollPaths() {
  const paths = [
    "/dashboard/spreadsheet",
    "/dashboard/employees",
    "/dashboard/payrolls",
    "/dashboard/payslips",
    "/dashboard/schedule",
    "/dashboard/review",
    "/dashboard/users",
    "/dashboard/logs",
  ]

  for (const path of paths) {
    revalidatePath(path)
  }
}

export async function bulkSavePayslipRows(
  session: Session,
  rows: PayslipSpreadsheetRow[]
): Promise<BulkSaveResult> {
  const errors: BulkSaveResult["errors"] = []
  let updatedCount = 0

  await db.transaction(async (tx) => {
    for (const payslipRow of rows) {
      const rowId = String(payslipRow.rowId ?? payslipRow.id ?? "")
      const inputs = spreadsheetRowToPayslipInputs(payslipRow)
      if ("error" in inputs) {
        errors.push({ rowId, message: inputs.error })
        continue
      }

      const payslip = await updatePayslip(
        {
          id: String(payslipRow.id),
          payrollId: String(payslipRow.payrollId),
          employeeId: String(payslipRow.employeeId),
          inputs,
        },
        tx
      )

      if ("error" in payslip) {
        errors.push({ rowId, message: payslip.error })
        continue
      }

      await createAuditLog({
        actor: session,
        action: "payslip.update",
        targetType: "payslip",
        targetId: payslip.id,
        targetLabel: `${payslip.employeeName} (${payslip.employeeId})`,
        details: "Updated payslip from Excel import.",
        client: tx,
      })

      updatedCount += 1
    }
  })

  if (updatedCount > 0) {
    revalidatePayrollPaths()
  }

  return {
    success: errors.length === 0,
    updatedCount,
    errors,
  }
}

export async function bulkSaveScheduleRows(
  session: Session,
  input: {
    payrollId: string
    allRows: ScheduleSpreadsheetRow[]
    dirtyEmployeeIds: string[]
  }
): Promise<BulkSaveResult> {
  const payroll = await getPayrollById(input.payrollId)
  if (!payroll) {
    return {
      success: false,
      updatedCount: 0,
      errors: [{ rowId: "", message: "Payroll not found." }],
    }
  }

  const grouped = groupScheduleRowsByEmployee(input.allRows)
  const errors: BulkSaveResult["errors"] = []
  let updatedCount = 0

  await db.transaction(async (tx) => {
    for (const employeeId of input.dirtyEmployeeIds) {
      const employeeRows = grouped.get(employeeId) ?? []
      if (employeeRows.length === 0) {
        errors.push({
          rowId: employeeId,
          message: "Schedule rows not found for employee.",
        })
        continue
      }

      const daysResult = scheduleRowsToDays(employeeRows)
      if ("error" in daysResult) {
        errors.push({ rowId: daysResult.rowId, message: daysResult.error })
        continue
      }

      const schedule = await upsertEmployeeSchedule(
        { payrollId: input.payrollId, employeeId, days: daysResult },
        tx
      )

      if ("error" in schedule) {
        errors.push({
          rowId: resolveScheduleErrorRowId(
            employeeId,
            daysResult,
            schedule.error
          ),
          message: schedule.error,
        })
        continue
      }

      const refreshedPayslip = await refreshPayslipFromSchedule(
        input.payrollId,
        employeeId,
        tx
      )

      if ("error" in refreshedPayslip) {
        errors.push({
          rowId: resolveScheduleErrorRowId(
            employeeId,
            daysResult,
            refreshedPayslip.error
          ),
          message: refreshedPayslip.error,
        })
        continue
      }

      await createAuditLog({
        actor: session,
        action: "schedule.update",
        targetType: "employee_schedule",
        targetId: schedule.id,
        targetLabel: `${employeeId} (${payroll.payrollPeriodLabel})`,
        details: "Updated employee schedule from Excel import.",
        client: tx,
      })

      updatedCount += 1
    }
  })

  if (updatedCount > 0) {
    revalidatePayrollPaths()
  }

  return {
    success: errors.length === 0,
    updatedCount,
    errors,
  }
}

export type ApplyPayrollImportResult = {
  success: boolean
  updatedPayslips: number
  updatedSchedules: number
  errors: BulkSaveResult["errors"]
}

export async function applyPayrollImport(input: {
  session: Session
  payrollId: string
  payslipRows: PayslipSpreadsheetRow[]
  scheduleRows: ScheduleSpreadsheetRow[]
  dirtyEmployeeIds: string[]
}): Promise<ApplyPayrollImportResult> {
  const scheduleResult = await bulkSaveScheduleRows(input.session, {
    payrollId: input.payrollId,
    allRows: input.scheduleRows,
    dirtyEmployeeIds: input.dirtyEmployeeIds,
  })

  if (!scheduleResult.success) {
    return {
      success: false,
      updatedPayslips: 0,
      updatedSchedules: scheduleResult.updatedCount,
      errors: scheduleResult.errors,
    }
  }

  const payslipResult = await bulkSavePayslipRows(input.session, input.payslipRows)

  return {
    success: payslipResult.success,
    updatedPayslips: payslipResult.updatedCount,
    updatedSchedules: scheduleResult.updatedCount,
    errors: payslipResult.errors,
  }
}
