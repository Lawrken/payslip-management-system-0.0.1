import ExcelJS from "exceljs"

import {
  buildStyledDataSheet,
  workbookToExcelBuffer,
} from "@/lib/excel/build-styled-sheet"
import { buildInstructionsWorksheet } from "@/lib/excel/build-instructions-sheet"
import {
  DTR_COLUMNS,
  EXCEL_SHEET_NAMES,
  PAYROLL_COLUMNS,
  PAYSLIPS_COLUMNS,
  SCHEDULE_COLUMNS,
  SCHEDULE_HOLIDAY_LOCKED_KEYS,
  type ExcelColumnDef,
} from "@/lib/excel/columns"
import type { ExcelCellStyleKind } from "@/lib/excel/styles"
import { formatScheduleTimeForExcel } from "@/lib/schedule-time"
import { buildListValidationSheet } from "@/lib/excel/list-validations"
import { safeWorkbookFilename } from "@/lib/excel/workbook-utils"
import { getEmployees } from "@/lib/employees"
import { getEmployeeSchedulesByPayrollId } from "@/lib/employee-schedules"
import { getPayrollById } from "@/lib/payrolls"
import { getPayslipsByPayrollId } from "@/lib/payslips"
import {
  payslipsToSpreadsheetRows,
  type PayslipSpreadsheetRow,
} from "@/lib/spreadsheet/payslips"
import {
  buildScheduleSpreadsheetRows,
  type ScheduleSpreadsheetRow,
} from "@/lib/spreadsheet/schedules"

function payslipRowForExport(row: PayslipSpreadsheetRow): Record<string, unknown> {
  return {
    payslipId: row.id,
    employeeId: row.employeeId,
    employeeName: row.employeeName,
    status: row.status,
    divisor: row.divisor,
    ...Object.fromEntries(
      PAYSLIPS_COLUMNS.filter(
        (column) =>
          column.section !== "Identity" && column.section !== "Totals"
      ).map((column) => [column.key, row[column.key as keyof PayslipSpreadsheetRow] ?? 0])
    ),
    taxableEarnings: row.taxableEarnings,
    totalDeductions: row.totalDeductions,
    nonTaxableEarnings: row.nonTaxableEarnings,
    grossPay: row.grossPay,
    netPay: row.netPay,
  }
}

function scheduleRowForExport(
  row: ScheduleSpreadsheetRow
): Record<string, unknown> {
  return {
    employeeId: row.employeeId,
    employeeName: row.employeeName,
    date: row.date,
    holidayLocked: row.holidayLocked,
    shiftType: row.shiftType,
    shiftIn: formatScheduleTimeForExcel(row.shiftIn),
    shiftOut: formatScheduleTimeForExcel(row.shiftOut),
    logIn: formatScheduleTimeForExcel(row.logIn),
    logOut: formatScheduleTimeForExcel(row.logOut),
  }
}

function resolveScheduleCellStyle(
  row: Record<string, unknown>,
  column: ExcelColumnDef
): ExcelCellStyleKind {
  if (!column.editable) {
    return "readonly"
  }

  const holidayLocked = row.holidayLocked === true || row.holidayLocked === "Yes"
  if (holidayLocked && SCHEDULE_HOLIDAY_LOCKED_KEYS.has(column.key)) {
    return "readonlyHoliday"
  }

  return "editable"
}

export async function buildPayrollExportWorkbook(payrollId: string) {
  const payroll = await getPayrollById(payrollId)
  if (!payroll) {
    return { error: "Payroll not found." as const }
  }

  const [payslips, employees, schedules] = await Promise.all([
    getPayslipsByPayrollId(payrollId),
    getEmployees(),
    getEmployeeSchedulesByPayrollId(payrollId),
  ])

  const employeesByEmployeeId = new Map(
    employees.map((employee) => [employee.employeeId, employee])
  )
  const schedulesByEmployeeId = new Map(
    schedules.map((schedule) => [schedule.employeeId, schedule])
  )

  const payslipRows = payslipsToSpreadsheetRows(
    payslips,
    employeesByEmployeeId,
    payroll,
    schedulesByEmployeeId
  )
  const scheduleRows = buildScheduleSpreadsheetRows({
    payroll,
    payslips,
    schedules,
  })

  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Helport Payslip"
  workbook.created = new Date()

  const listValidationRanges = buildListValidationSheet(workbook)

  await buildInstructionsWorksheet(workbook, payroll)

  await buildStyledDataSheet({
    workbook,
    sheetName: EXCEL_SHEET_NAMES.payroll,
    columns: PAYROLL_COLUMNS,
    rows: [
      {
        payrollPeriodLabel: payroll.payrollPeriodLabel,
        payrollPeriodStart: payroll.payrollPeriodStart,
        payrollPeriodEnd: payroll.payrollPeriodEnd,
        dtrCutOffStart: payroll.dtrCutOffStart,
        dtrCutOffEnd: payroll.dtrCutOffEnd,
        payoutDate: payroll.payoutDate,
      },
    ],
    listValidationRanges,
  })

  await buildStyledDataSheet({
    workbook,
    sheetName: EXCEL_SHEET_NAMES.dtrCalendar,
    columns: DTR_COLUMNS,
    rows: payroll.dtrDays.map((day) => ({
      date: day.date,
      status: day.status,
      holidayName: day.holidayName,
    })),
    listValidationRanges,
  })

  await buildStyledDataSheet({
    workbook,
    sheetName: EXCEL_SHEET_NAMES.payslips,
    columns: PAYSLIPS_COLUMNS,
    rows: payslipRows.map(payslipRowForExport),
    listValidationRanges,
  })

  await buildStyledDataSheet({
    workbook,
    sheetName: EXCEL_SHEET_NAMES.schedule,
    columns: SCHEDULE_COLUMNS,
    rows: scheduleRows.map(scheduleRowForExport),
    resolveCellStyle: resolveScheduleCellStyle,
    listValidationRanges,
  })

  const filename = `helport-payroll-${safeWorkbookFilename(payroll.payrollPeriodLabel)}.xlsx`
  const buffer = await workbookToExcelBuffer(workbook)

  return { payroll, filename, buffer }
}
