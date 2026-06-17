"use server"

import { revalidatePath } from "next/cache"

import { db } from "@/db"
import { createAuditLog } from "@/lib/audit-logs"
import { requireDashboardSession, requireSuperAdminSession } from "@/lib/authorization"
import {
  type EmployeeFieldValues,
  parseEmployeeFields,
  toNewEmployeeInput,
} from "@/lib/employee-validation"
import { isEmployeeDivisor } from "@/lib/employee-options"
import {
  getEmployeeById,
  updateEmployee,
  type UpdateEmployeeInput,
} from "@/lib/employees"
import { mergeDtrDays } from "@/lib/dtr-days"
import { upsertEmployeeSchedule } from "@/lib/employee-schedules"
import { getPayrollById, updatePayroll } from "@/lib/payrolls"
import { updatePayslip, refreshPayslipFromSchedule } from "@/lib/payslips"
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
import { syncEmployeeUserIdentity, updateUserRole } from "@/lib/users"
import type { Role } from "@/lib/types"

function failedBulkSave(scope: string, error: unknown): BulkSaveResult {
  console.error(`[spreadsheet] Failed to save ${scope}.`, error)

  return {
    success: false,
    updatedCount: 0,
    errors: [
      {
        rowId: "",
        message: `Unable to save ${scope}. Check the server logs and try again.`,
      },
    ],
  }
}

async function runBulkSave(
  scope: string,
  operation: () => Promise<BulkSaveResult>
): Promise<BulkSaveResult> {
  try {
    return await operation()
  } catch (error) {
    return failedBulkSave(scope, error)
  }
}

function revalidateSpreadsheetPaths(extraPaths: string[] = []) {
  const paths = new Set([
    "/dashboard/spreadsheet",
    "/dashboard/employees",
    "/dashboard/payrolls",
    "/dashboard/payslips",
    "/dashboard/schedule",
    "/dashboard/review",
    "/dashboard/users",
    "/dashboard/logs",
    ...extraPaths,
  ])

  for (const path of paths) {
    revalidatePath(path)
  }
}

const employeeNumericIdFields = ["tin", "sssNo", "phicNo", "hdmfNo"] as const
const employeeRequiredFields = [
  "name",
  "employeeId",
  "email",
  "employeeStatus",
  "positionTitle",
  "department",
  "program",
  "account",
  "tin",
  "sssNo",
  "phicNo",
  "hdmfNo",
] as const
const employeeValidatedFields = [
  ...employeeRequiredFields,
  "divisor",
  "basicPay",
] as const
const employeeValidatedFieldSet = new Set<string>(employeeValidatedFields)

function isDigitsOnly(value: string) {
  return /^\d+$/.test(value)
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function validateSpreadsheetEmployeeFields(
  fields: EmployeeFieldValues,
  changedFields: string[]
): { error: string } | null {
  const fieldsToValidate =
    changedFields.length > 0
      ? changedFields.filter((field) => employeeValidatedFieldSet.has(field))
      : [...employeeValidatedFields]

  for (const field of employeeRequiredFields) {
    if (fieldsToValidate.includes(field) && !fields[field]) {
      return { error: "Edited employee fields cannot be blank." }
    }
  }

  if (fieldsToValidate.includes("email") && !isValidEmail(fields.email)) {
    return { error: "Enter a valid email address." }
  }

  if (fieldsToValidate.includes("divisor") && !isEmployeeDivisor(fields.divisor)) {
    return { error: "Choose a valid divisor." }
  }

  if (
    fieldsToValidate.includes("basicPay") &&
    (Number.isNaN(fields.basicPay) || fields.basicPay < 0)
  ) {
    return { error: "Basic Pay must be a non-negative number." }
  }

  for (const field of employeeNumericIdFields) {
    if (fieldsToValidate.includes(field) && !isDigitsOnly(fields[field])) {
      return {
        error:
          "TIN, SSS NO., PHIC NO., and HDMF NO. must contain numbers only.",
      }
    }
  }

  return null
}

export async function bulkUpdateEmployeesAction(
  rows: Record<string, unknown>[]
): Promise<BulkSaveResult> {
  return runBulkSave("employees", async () => {
    const session = await requireDashboardSession()
    if ("error" in session) {
      return {
        success: false,
        updatedCount: 0,
        errors: [{ rowId: "", message: session.error }],
      }
    }

    const errors: BulkSaveResult["errors"] = []
    let updatedCount = 0

    await db.transaction(async (tx) => {
      for (const row of rows) {
        const rowId = String(row.rowId ?? row.id ?? "")
        const id = String(row.id ?? rowId)
        const fields = parseEmployeeFields(row)
        const changedFields = Array.isArray(row.__changedFields)
          ? row.__changedFields.map(String)
          : []
        const validationError = validateSpreadsheetEmployeeFields(
          fields,
          changedFields
        )

        if (validationError) {
          errors.push({ rowId, message: validationError.error })
          continue
        }

        const previousEmployee = await getEmployeeById(id, tx)
        const employee = await updateEmployee(
          { id, ...toNewEmployeeInput(fields) } satisfies UpdateEmployeeInput,
          tx
        )

        if ("error" in employee) {
          errors.push({ rowId, message: employee.error })
          continue
        }

        if (!previousEmployee) {
          errors.push({ rowId, message: "Employee not found." })
          continue
        }

        const syncResult = await syncEmployeeUserIdentity({
          previousEmployeeId: previousEmployee.employeeId,
          employeeId: employee.employeeId,
          email: employee.email,
          client: tx,
        })

        if ("error" in syncResult) {
          errors.push({ rowId, message: syncResult.error })
          continue
        }

        await createAuditLog({
          actor: session,
          action: "employee.update",
          targetType: "employee",
          targetId: employee.id,
          targetLabel: `${employee.name} (${employee.employeeId})`,
          details: "Updated employee record from spreadsheet.",
          client: tx,
        })

        updatedCount += 1
      }
    })

    if (updatedCount > 0) {
      revalidateSpreadsheetPaths()
    }

    return {
      success: errors.length === 0,
      updatedCount,
      errors,
    }
  })
}

export async function bulkUpdatePayrollsAction(
  rows: Record<string, unknown>[]
): Promise<BulkSaveResult> {
  return runBulkSave("payrolls", async () => {
    const session = await requireDashboardSession()
    if ("error" in session) {
      return {
        success: false,
        updatedCount: 0,
        errors: [{ rowId: "", message: session.error }],
      }
    }

    const errors: BulkSaveResult["errors"] = []
    let updatedCount = 0

    await db.transaction(async (tx) => {
      for (const row of rows) {
        const rowId = String(row.rowId ?? row.id ?? "")
        const id = String(row.id ?? rowId)
        const existing = await getPayrollById(id, tx)

        if (!existing) {
          errors.push({ rowId, message: "Payroll not found." })
          continue
        }

        const payrollPeriodStart = String(
          row.payrollPeriodStart ?? existing.payrollPeriodStart
        )
        const payrollPeriodEnd = String(
          row.payrollPeriodEnd ?? existing.payrollPeriodEnd
        )
        const dtrCutOffStart = String(
          row.dtrCutOffStart ?? existing.dtrCutOffStart
        )
        const dtrCutOffEnd = String(row.dtrCutOffEnd ?? existing.dtrCutOffEnd)
        const payoutDate = String(row.payoutDate ?? existing.payoutDate)
        const cutOffChanged =
          dtrCutOffStart !== existing.dtrCutOffStart ||
          dtrCutOffEnd !== existing.dtrCutOffEnd
        const dtrDays = cutOffChanged
          ? mergeDtrDays(dtrCutOffStart, dtrCutOffEnd, existing.dtrDays)
          : existing.dtrDays

        const payroll = await updatePayroll(
          {
            id,
            payrollPeriodStart,
            payrollPeriodEnd,
            dtrCutOffStart,
            dtrCutOffEnd,
            payoutDate,
            dtrDays,
          },
          tx
        )

        if ("error" in payroll) {
          errors.push({ rowId, message: payroll.error })
          continue
        }

        await createAuditLog({
          actor: session,
          action: "payroll.update",
          targetType: "payroll",
          targetId: payroll.id,
          targetLabel: payroll.payrollPeriodLabel,
          details: "Updated payroll period from spreadsheet.",
          client: tx,
        })

        updatedCount += 1
      }
    })

    if (updatedCount > 0) {
      revalidateSpreadsheetPaths()
    }

    return {
      success: errors.length === 0,
      updatedCount,
      errors,
    }
  })
}

export async function bulkUpdatePayslipsAction(
  rows: Record<string, unknown>[]
): Promise<BulkSaveResult> {
  return runBulkSave("payslips", async () => {
    const session = await requireDashboardSession()
    if ("error" in session) {
      return {
        success: false,
        updatedCount: 0,
        errors: [{ rowId: "", message: session.error }],
      }
    }

    const errors: BulkSaveResult["errors"] = []
    let updatedCount = 0

    await db.transaction(async (tx) => {
      for (const row of rows) {
        const payslipRow = row as PayslipSpreadsheetRow
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
          details: "Updated payslip from spreadsheet.",
          client: tx,
        })

        updatedCount += 1
      }
    })

    if (updatedCount > 0) {
      revalidateSpreadsheetPaths()
    }

    return {
      success: errors.length === 0,
      updatedCount,
      errors,
    }
  })
}

export async function bulkUpdateSchedulesAction(input: {
  payrollId: string
  allRows: Record<string, unknown>[]
  dirtyEmployeeIds: string[]
}): Promise<BulkSaveResult> {
  return runBulkSave("schedules", async () => {
    const session = await requireDashboardSession()
    if ("error" in session) {
      return {
        success: false,
        updatedCount: 0,
        errors: [{ rowId: "", message: session.error }],
      }
    }

    const payrollId = input.payrollId.trim()
    const payroll = await getPayrollById(payrollId)
    if (!payroll) {
      return {
        success: false,
        updatedCount: 0,
        errors: [{ rowId: "", message: "Payroll not found." }],
      }
    }

    const scheduleRows = input.allRows as ScheduleSpreadsheetRow[]
    const grouped = groupScheduleRowsByEmployee(scheduleRows)
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
          { payrollId, employeeId, days: daysResult },
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
          payrollId,
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
          details: "Updated employee schedule from spreadsheet.",
          client: tx,
        })

        updatedCount += 1
      }
    })

    if (updatedCount > 0) {
      revalidateSpreadsheetPaths()
    }

    return {
      success: errors.length === 0,
      updatedCount,
      errors,
    }
  })
}

export async function bulkUpdateUsersAction(
  rows: Record<string, unknown>[]
): Promise<BulkSaveResult> {
  return runBulkSave("users", async () => {
    const session = await requireSuperAdminSession()
    if ("error" in session) {
      return {
        success: false,
        updatedCount: 0,
        errors: [{ rowId: "", message: session.error }],
      }
    }

    const errors: BulkSaveResult["errors"] = []
    let updatedCount = 0

    await db.transaction(async (tx) => {
      for (const row of rows) {
        const rowId = String(row.rowId ?? row.employeeId ?? "")
        const employeeId = String(row.employeeId ?? rowId)
        const role = String(row.role ?? "") as Role

        const user = await updateUserRole(employeeId, role, tx)
        if ("error" in user) {
          errors.push({ rowId, message: user.error })
          continue
        }

        await createAuditLog({
          actor: session,
          action: "user.update",
          targetType: "user",
          targetId: user.employeeId,
          targetLabel: `${user.employeeId} (${user.role})`,
          details: "Updated user role from spreadsheet.",
          client: tx,
        })

        updatedCount += 1
      }
    })

    if (updatedCount > 0) {
      revalidateSpreadsheetPaths()
    }

    return {
      success: errors.length === 0,
      updatedCount,
      errors,
    }
  })
}
