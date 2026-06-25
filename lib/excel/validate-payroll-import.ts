import { DERIVED_PAYSLIP_FIELD_KEYS, parseDecimalInput } from "@/lib/payroll-calculator"
import {
  PAYSLIPS_COLUMNS,
  PAYSLIPS_EDITABLE_KEYS,
  SCHEDULE_COLUMNS,
  SCHEDULE_HOLIDAY_LOCKED_KEYS,
} from "@/lib/excel/columns"
import type {
  ParsedPayslipImportRow,
  ParsedPayrollWorkbook,
  ParsedScheduleImportRow,
} from "@/lib/excel/parse-payroll-workbook"
import { enumerateIsoDates } from "@/lib/payroll-dates"
import { coerceScheduleTimeCell, scheduleTimesEqual } from "@/lib/schedule-time"
import { SHIFT_TYPE_OPTIONS } from "@/lib/schedule-days"
import { parseScheduleSpreadsheetTime } from "@/lib/spreadsheet/schedules"
import {
  payslipToSpreadsheetRow,
  spreadsheetRowToPayslipInputs,
  type PayslipSpreadsheetRow,
} from "@/lib/spreadsheet/payslips"
import {
  scheduleDayToSpreadsheetRow,
  type ScheduleSpreadsheetRow,
} from "@/lib/spreadsheet/schedules"
import type { Employee, Payroll, Payslip } from "@/lib/types"

const VALID_SHIFT_TYPES = new Set(
  SHIFT_TYPE_OPTIONS.map((option) => option.value)
)

const derivedFieldKeys = new Set<string>(DERIVED_PAYSLIP_FIELD_KEYS)

const payslipLabelByKey = new Map(PAYSLIPS_COLUMNS.map((c) => [c.key, c.label]))
const scheduleLabelByKey = new Map(SCHEDULE_COLUMNS.map((c) => [c.key, c.label]))

function getPayslipLabel(key: string): string {
  return payslipLabelByKey.get(key) ?? key
}

function getScheduleLabel(key: string): string {
  return scheduleLabelByKey.get(key) ?? key
}

export type PayrollImportError = {
  sheet: string
  row: number
  column: string
  message: string
}

export type PayrollImportWarning = {
  sheet: string
  row: number
  column: string
  message: string
}

export type PayrollImportValidationResult = {
  valid: boolean
  errors: PayrollImportError[]
  warnings: PayrollImportWarning[]
  summary: {
    payslipCount: number
    scheduleRowCount: number
  }
  payslipRows: PayslipSpreadsheetRow[]
  scheduleRows: ScheduleSpreadsheetRow[]
  dirtyEmployeeIds: string[]
}

function pushPayslipError(
  errors: PayrollImportError[],
  row: ParsedPayslipImportRow,
  column: string,
  message: string
) {
  errors.push({
    sheet: "Payslips",
    row: row.rowNumber,
    column,
    message,
  })
}

function pushScheduleError(
  errors: PayrollImportError[],
  row: ParsedScheduleImportRow,
  column: string,
  message: string
) {
  errors.push({
    sheet: "Schedule",
    row: row.rowNumber,
    column,
    message,
  })
}

function normalizeComparableValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ""
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : ""
  }
  return String(value).trim()
}

function valuesDiffer(left: unknown, right: unknown): boolean {
  const leftNumber = Number(left)
  const rightNumber = Number(right)
  if (
    normalizeComparableValue(left) !== "" &&
    normalizeComparableValue(right) !== "" &&
    !Number.isNaN(leftNumber) &&
    !Number.isNaN(rightNumber)
  ) {
    return Math.abs(leftNumber - rightNumber) > 0.009
  }
  return normalizeComparableValue(left) !== normalizeComparableValue(right)
}

export function validatePayrollImport(input: {
  expectedPayrollId: string
  parsed: ParsedPayrollWorkbook
  payroll: Payroll
  payslips: Payslip[]
  employeesByEmployeeId: Map<string, Employee>
  baselineScheduleRows: ScheduleSpreadsheetRow[]
}): PayrollImportValidationResult {
  const errors: PayrollImportError[] = []
  const warnings: PayrollImportWarning[] = []

  if (input.parsed.payrollId !== input.expectedPayrollId) {
    errors.push({
      sheet: "Instructions",
      row: 0,
      column: "payrollId",
      message: `Workbook payroll ID (${input.parsed.payrollId}) does not match this payroll (${input.expectedPayrollId}).`,
    })
  }

  const payslipByEmployeeId = new Map(
    input.payslips.map((payslip) => [payslip.employeeId, payslip])
  )
  const payslipById = new Map(input.payslips.map((payslip) => [payslip.id, payslip]))
  const validDates = new Set(
    enumerateIsoDates(input.payroll.dtrCutOffStart, input.payroll.dtrCutOffEnd)
  )
  const baselineScheduleByKey = new Map(
    input.baselineScheduleRows.map((row) => [`${row.employeeId}:${row.date}`, row])
  )

  const seenPayslipEmployees = new Set<string>()
  const mergedPayslipRows: PayslipSpreadsheetRow[] = []

  for (const row of input.parsed.payslipRows) {
    if (!row.employeeId) {
      pushPayslipError(errors, row, "employeeId", `Row ${row.rowNumber}: 'Employee ID' is required.`)
      continue
    }

    if (seenPayslipEmployees.has(row.employeeId)) {
      pushPayslipError(
        errors,
        row,
        "employeeId",
        `Row ${row.rowNumber}: Duplicate Employee ID '${row.employeeId}'.`
      )
      continue
    }
    seenPayslipEmployees.add(row.employeeId)

    const payslip = payslipByEmployeeId.get(row.employeeId)
    if (!payslip) {
      pushPayslipError(
        errors,
        row,
        "employeeId",
        `Row ${row.rowNumber}: Employee '${row.employeeId}' is not part of this payroll.`
      )
      continue
    }

    if (row.payslipId && row.payslipId !== payslip.id) {
      pushPayslipError(
        errors,
        row,
        "payslipId",
        `Row ${row.rowNumber}: Payslip ID does not match employee '${row.employeeId}'.`
      )
      continue
    }

    if (row.payslipId && !payslipById.has(row.payslipId)) {
      pushPayslipError(errors, row, "payslipId", `Row ${row.rowNumber}: Unknown Payslip ID.`)
      continue
    }

    const employee = input.employeesByEmployeeId.get(row.employeeId) ?? null
    const baselineRow = payslipToSpreadsheetRow(payslip, employee, {
      payroll: input.payroll,
    })
    const mergedRow: PayslipSpreadsheetRow = { ...baselineRow }

    for (const key of PAYSLIPS_EDITABLE_KEYS) {
      if (!(key in row)) {
        continue
      }
      const rawValue = row[key]
      if (rawValue === "" || rawValue === null || rawValue === undefined) {
        mergedRow[key as keyof PayslipSpreadsheetRow] = 0 as never
        continue
      }

      const parsed = parseDecimalInput(String(rawValue))
      if (Number.isNaN(parsed)) {
        pushPayslipError(errors, row, key, `Row ${row.rowNumber}: Invalid value for '${getPayslipLabel(key)}' — must be a number.`)
        continue
      }
      mergedRow[key as keyof PayslipSpreadsheetRow] = parsed as never
    }

    for (const key of derivedFieldKeys) {
      if (key in row && valuesDiffer(row[key], baselineRow[key as keyof PayslipSpreadsheetRow])) {
        warnings.push({
          sheet: "Payslips",
          row: row.rowNumber,
          column: key,
          message: `Row ${row.rowNumber}: '${getPayslipLabel(key)}' is derived from schedule and will be recalculated on import.`,
        })
      }
    }

    const inputs = spreadsheetRowToPayslipInputs(mergedRow)
    if ("error" in inputs) {
      pushPayslipError(errors, row, "inputs", inputs.error)
      continue
    }

    mergedPayslipRows.push(mergedRow)
  }

  const importedScheduleByKey = new Map<string, ScheduleSpreadsheetRow>()
  const dirtyEmployeeIds = new Set<string>()

  for (const row of input.parsed.scheduleRows) {
    if (!row.employeeId) {
      pushScheduleError(errors, row, "employeeId", `Row ${row.rowNumber}: 'Employee ID' is required.`)
      continue
    }

    if (!payslipByEmployeeId.has(row.employeeId)) {
      pushScheduleError(
        errors,
        row,
        "employeeId",
        `Row ${row.rowNumber}: Employee '${row.employeeId}' is not part of this payroll.`
      )
      continue
    }

    if (!row.date) {
      pushScheduleError(errors, row, "date", `Row ${row.rowNumber}: 'Date' is required.`)
      continue
    }

    if (!validDates.has(row.date)) {
      pushScheduleError(
        errors,
        row,
        "date",
        `Row ${row.rowNumber}: Date '${row.date}' is outside the payroll DTR range.`
      )
      continue
    }

    if (!row.shiftType) {
      warnings.push({
        sheet: "Schedule",
        row: row.rowNumber,
        column: "shiftType",
        message: `Schedule row ${row.rowNumber}: Shift type is missing — set it in the Schedule page after import.`,
      })
      continue
    }

    if (!VALID_SHIFT_TYPES.has(row.shiftType as never)) {
      pushScheduleError(
        errors,
        row,
        "shiftType",
        `Row ${row.rowNumber}: Invalid value for 'Shift Type' — must be one of the allowed shift types.`
      )
      continue
    }

    const baseline = baselineScheduleByKey.get(`${row.employeeId}:${row.date}`)
    if (!baseline) {
      pushScheduleError(
        errors,
        row,
        "date",
        `Row ${row.rowNumber}: No schedule row exists for employee '${row.employeeId}' on ${row.date}.`
      )
      continue
    }

    if (baseline.holidayLocked) {
      for (const key of SCHEDULE_HOLIDAY_LOCKED_KEYS) {
        if (
          key === "shiftType"
            ? valuesDiffer(row[key], baseline[key as keyof ScheduleSpreadsheetRow])
            : !scheduleTimesEqual(
                row[key],
                baseline[key as keyof ScheduleSpreadsheetRow]
              )
        ) {
          pushScheduleError(
            errors,
            row,
            key,
            `Row ${row.rowNumber}: Holiday dates cannot be changed — '${getScheduleLabel(key)}' is locked.`
          )
        }
      }
    }

    for (const field of ["shiftIn", "shiftOut", "logIn", "logOut"] as const) {
      const rawValue = coerceScheduleTimeCell(row[field])
      if (!rawValue) {
        continue
      }
      if (parseScheduleSpreadsheetTime(rawValue) === null) {
        pushScheduleError(
          errors,
          row,
          field,
          `Row ${row.rowNumber}: Invalid value for '${getScheduleLabel(field)}' — use format like 9:30 AM.`
        )
      }
    }

    const scheduleRow = scheduleDayToSpreadsheetRow({
      payrollId: input.payroll.id,
      employeeId: row.employeeId,
      employeeName: row.employeeName || baseline.employeeName,
      day: {
        date: row.date,
        shiftType: row.shiftType as never,
        shiftIn: coerceScheduleTimeCell(row.shiftIn),
        shiftOut: coerceScheduleTimeCell(row.shiftOut),
        logIn: coerceScheduleTimeCell(row.logIn),
        logOut: coerceScheduleTimeCell(row.logOut),
      },
      holidayLocked: baseline.holidayLocked,
    })

    importedScheduleByKey.set(`${row.employeeId}:${row.date}`, scheduleRow)
    dirtyEmployeeIds.add(row.employeeId)
  }

  const scheduleRows: ScheduleSpreadsheetRow[] = []
  for (const baselineRow of input.baselineScheduleRows) {
    if (!dirtyEmployeeIds.has(baselineRow.employeeId)) {
      continue
    }

    const imported = importedScheduleByKey.get(
      `${baselineRow.employeeId}:${baselineRow.date}`
    )
    scheduleRows.push(imported ?? baselineRow)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: {
      payslipCount: mergedPayslipRows.length,
      scheduleRowCount: scheduleRows.length,
    },
    payslipRows: mergedPayslipRows,
    scheduleRows,
    dirtyEmployeeIds: [...dirtyEmployeeIds],
  }
}
