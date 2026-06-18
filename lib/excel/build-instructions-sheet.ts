import ExcelJS from "exceljs"

import { EXCEL_SHEET_NAMES } from "@/lib/excel/columns"
import { lockAndProtectEntireWorksheet } from "@/lib/excel/sheet-protection"
import { EXCEL_STYLES } from "@/lib/excel/styles"
import type { Payroll } from "@/lib/types"

export async function buildInstructionsWorksheet(
  workbook: ExcelJS.Workbook,
  payroll: Payroll
): Promise<ExcelJS.Worksheet> {
  const worksheet = workbook.addWorksheet(EXCEL_SHEET_NAMES.instructions)

  worksheet.getColumn(1).width = 28
  worksheet.getColumn(2).width = 52

  const titleRow = worksheet.addRow(["Helport Payroll Workbook"])
  titleRow.getCell(1).font = { bold: true, size: 14 }
  worksheet.addRow([])

  worksheet.addRow(["Payroll Period", payroll.payrollPeriodLabel])
  worksheet.addRow(["Payroll ID", payroll.id])
  worksheet.addRow([])

  const legendTitle = worksheet.addRow(["Column legend"])
  legendTitle.getCell(1).font = { bold: true }

  const legendHeader = worksheet.addRow(["Column type", "Meaning"])
  legendHeader.eachCell((cell) => {
    cell.style = { ...EXCEL_STYLES.headerReadonly }
    cell.alignment = { vertical: "middle", horizontal: "center" }
  })

  const legendRows: [string, string, keyof typeof EXCEL_STYLES][] = [
    ["White cells", "Edit these values", "legendEditableSample"],
    [
      "Gray cells (locked in Excel)",
      "Read-only — recalculated on import",
      "legendReadonlySample",
    ],
    [
      "Payroll / DTR_Calendar sheets",
      "Reference only — do not edit",
      "legendReadonlySample",
    ],
  ]

  for (const [columnType, meaning, styleKey] of legendRows) {
    const row = worksheet.addRow([columnType, meaning])
    row.getCell(1).style = { ...EXCEL_STYLES[styleKey] }
    row.getCell(2).style = { ...EXCEL_STYLES[styleKey] }
    row.getCell(1).alignment = { vertical: "middle", horizontal: "left" }
    row.getCell(2).alignment = { vertical: "middle", horizontal: "left" }
  }

  worksheet.addRow([])
  const stepsTitle = worksheet.addRow(["How to use"])
  stepsTitle.getCell(1).font = { bold: true }

  const steps = [
    "1. Edit only the Payslips and Schedule sheets.",
    "2. Do not rename sheets or change column order.",
    "3. Use the dropdown arrows on Shift Type (and DTR status for reference).",
    "4. In Excel, gray cells are locked. If using Google Sheets, only edit white cells — the app validates on import.",
    "5. Upload this file from Payslips or Schedule in the dashboard.",
  ]
  for (const step of steps) {
    worksheet.addRow([step])
  }

  worksheet.addRow([])
  worksheet.addRow(["payrollId", payroll.id])

  await lockAndProtectEntireWorksheet(worksheet)

  return worksheet
}
