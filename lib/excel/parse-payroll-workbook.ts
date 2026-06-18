import * as XLSX from "xlsx"

import {
  EXCEL_SHEET_NAMES,
  PAYSLIPS_COLUMNS,
  SCHEDULE_COLUMNS,
  type ExcelColumnDef,
} from "@/lib/excel/columns"
import { coerceScheduleTimeCell } from "@/lib/schedule-time"

export type ParsedPayslipImportRow = Record<string, unknown> & {
  payslipId: string
  employeeId: string
  employeeName: string
  rowNumber: number
}

export type ParsedScheduleImportRow = Record<string, unknown> & {
  employeeId: string
  employeeName: string
  date: string
  holidayLocked: boolean
  shiftType: string
  shiftIn: string
  shiftOut: string
  logIn: string
  logOut: string
  rowNumber: number
}

export type ParsedPayrollWorkbook = {
  payrollId: string
  payslipRows: ParsedPayslipImportRow[]
  scheduleRows: ParsedScheduleImportRow[]
}

function parseBooleanCell(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value
  }
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
  return normalized === "yes" || normalized === "true" || normalized === "1"
}

function sheetToRows(
  workbook: XLSX.WorkBook,
  sheetName: string,
  columns: ExcelColumnDef[]
): Record<string, unknown>[] | { error: string } {
  const worksheet = workbook.Sheets[sheetName]
  if (!worksheet) {
    return { error: `Missing sheet "${sheetName}".` }
  }

  const rawRows = XLSX.utils.sheet_to_json<(string | number | boolean)[]>(
    worksheet,
    { header: 1, defval: "" }
  )

  if (rawRows.length < 2) {
    return []
  }

  const dataRows = rawRows.slice(1)
  return dataRows
    .map((cells, index) => {
      const row: Record<string, unknown> = {}
      let hasValue = false

      for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
        const column = columns[columnIndex]
        const cellValue = cells[columnIndex]
        if (cellValue !== "" && cellValue !== null && cellValue !== undefined) {
          hasValue = true
        }
        row[column.key] = cellValue ?? ""
      }

      if (!hasValue) {
        return null
      }

      row.rowNumber = index + 2
      return row
    })
    .filter((row): row is Record<string, unknown> => row !== null)
}

function readPayrollIdFromInstructions(
  workbook: XLSX.WorkBook
): string | { error: string } {
  const worksheet = workbook.Sheets[EXCEL_SHEET_NAMES.instructions]
  if (!worksheet) {
    return { error: `Missing sheet "${EXCEL_SHEET_NAMES.instructions}".` }
  }

  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, {
    header: 1,
    defval: "",
  })

  for (const row of rows) {
    const label = String(row[0] ?? "").trim()
    if (label === "payrollId" || label === "Payroll ID") {
      const value = String(row[1] ?? "").trim()
      if (value) {
        return value
      }
    }
  }

  return { error: "Payroll ID not found on Instructions sheet." }
}

export function parsePayrollWorkbook(
  buffer: ArrayBuffer | Buffer
): ParsedPayrollWorkbook | { error: string } {
  const workbook = XLSX.read(buffer, { type: "buffer" })
  const payrollIdResult = readPayrollIdFromInstructions(workbook)
  if (typeof payrollIdResult !== "string") {
    return payrollIdResult
  }

  const payslipResult = sheetToRows(
    workbook,
    EXCEL_SHEET_NAMES.payslips,
    PAYSLIPS_COLUMNS
  )
  if ("error" in payslipResult) {
    return payslipResult
  }

  const scheduleResult = sheetToRows(
    workbook,
    EXCEL_SHEET_NAMES.schedule,
    SCHEDULE_COLUMNS
  )
  if ("error" in scheduleResult) {
    return scheduleResult
  }

  const payslipRows = payslipResult.map((row) => ({
    ...row,
    payslipId: String(row.payslipId ?? "").trim(),
    employeeId: String(row.employeeId ?? "").trim(),
    employeeName: String(row.employeeName ?? "").trim(),
    rowNumber: Number(row.rowNumber),
  }))

  const scheduleRows = scheduleResult.map((row) => ({
    ...row,
    employeeId: String(row.employeeId ?? "").trim(),
    employeeName: String(row.employeeName ?? "").trim(),
    date: String(row.date ?? "").trim(),
    holidayLocked: parseBooleanCell(row.holidayLocked),
    shiftType: String(row.shiftType ?? "").trim(),
    shiftIn: coerceScheduleTimeCell(row.shiftIn),
    shiftOut: coerceScheduleTimeCell(row.shiftOut),
    logIn: coerceScheduleTimeCell(row.logIn),
    logOut: coerceScheduleTimeCell(row.logOut),
    rowNumber: Number(row.rowNumber),
  }))

  return {
    payrollId: payrollIdResult,
    payslipRows,
    scheduleRows,
  }
}
