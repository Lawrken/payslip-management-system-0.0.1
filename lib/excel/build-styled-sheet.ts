import ExcelJS from "exceljs"

import { SCHEDULE_TIME_KEYS, type ExcelColumnDef, type ExcelListValidationKey } from "@/lib/excel/columns"
import { applyListValidation, type ExcelListValidationRanges } from "@/lib/excel/list-validations"
import {
  isLockedStyleKind,
  protectWorksheet,
  setCellLocked,
} from "@/lib/excel/sheet-protection"
import {
  cellStyleForKind,
  headerStyleForKind,
  type ExcelCellStyleKind,
} from "@/lib/excel/styles"
import { rowToSheetValues } from "@/lib/excel/workbook-utils"

export type BuildStyledDataSheetOptions = {
  workbook: ExcelJS.Workbook
  sheetName: string
  columns: ExcelColumnDef[]
  rows: Record<string, unknown>[]
  resolveCellStyle?: (
    row: Record<string, unknown>,
    column: ExcelColumnDef
  ) => ExcelCellStyleKind
  protectSheet?: boolean
  listValidationRanges?: ExcelListValidationRanges
}

function isNumericColumn(column: ExcelColumnDef, value: unknown): boolean {
  if (column.key === "divisor") {
    return true
  }
  if (typeof value === "number") {
    return true
  }
  if (column.section === "Totals") {
    return true
  }
  if (
    column.section &&
    !["Identity", "Totals"].includes(column.section) &&
    column.editable
  ) {
    return true
  }
  if (
    column.section &&
    !["Identity", "Totals"].includes(column.section) &&
    !column.editable
  ) {
    return true
  }
  return false
}

function formatCellValue(value: unknown): string | number | boolean {
  if (value === null || value === undefined) {
    return ""
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No"
  }
  if (typeof value === "number") {
    return value
  }
  return String(value)
}

function defaultCellStyle(column: ExcelColumnDef): ExcelCellStyleKind {
  return column.editable ? "editable" : "readonly"
}

function listValidationAllowBlank(key: ExcelListValidationKey): boolean {
  return key !== "shiftType"
}

export async function buildStyledDataSheet({
  workbook,
  sheetName,
  columns,
  rows,
  resolveCellStyle,
  protectSheet = true,
  listValidationRanges,
}: BuildStyledDataSheetOptions): Promise<ExcelJS.Worksheet> {
  const worksheet = workbook.addWorksheet(sheetName)

  const headerRow = worksheet.addRow(columns.map((column) => column.label))
  headerRow.height = 22

  columns.forEach((column, columnIndex) => {
    const cell = headerRow.getCell(columnIndex + 1)
    const styleKind = defaultCellStyle(column)
    cell.style = { ...headerStyleForKind(styleKind) }
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
    setCellLocked(cell, true)
  })

  for (const row of rows) {
    const values = rowToSheetValues(row, columns)
    const dataRow = worksheet.addRow(values.map(formatCellValue))

    columns.forEach((column, columnIndex) => {
      const cell = dataRow.getCell(columnIndex + 1)
      const value = values[columnIndex]
      const styleKind = resolveCellStyle
        ? resolveCellStyle(row, column)
        : defaultCellStyle(column)
      cell.style = { ...cellStyleForKind(styleKind) }
      cell.alignment = {
        vertical: "middle",
        horizontal: isNumericColumn(column, value) ? "right" : "left",
      }
      if (typeof value === "number" && Number.isFinite(value)) {
        cell.numFmt = "#,##0.00"
      } else if (SCHEDULE_TIME_KEYS.has(column.key) && value !== "") {
        cell.numFmt = "@"
      }
      setCellLocked(cell, isLockedStyleKind(styleKind))
    })
  }

  worksheet.columns = columns.map((column) => ({
    width: Math.max(column.label.length + 2, 12),
  }))

  worksheet.views = [{ state: "frozen", ySplit: 1, activeCell: "A2" }]

  if (listValidationRanges) {
    columns.forEach((column, columnIndex) => {
      if (!column.listValidation) {
        return
      }

      const rangeFormula = listValidationRanges[column.listValidation]
      if (!rangeFormula) {
        return
      }

      applyListValidation(worksheet, columnIndex, rows.length, rangeFormula, {
        allowBlank: listValidationAllowBlank(column.listValidation),
      })
    })
  }

  if (protectSheet) {
    await protectWorksheet(worksheet)
  }

  return worksheet
}

export async function workbookToExcelBuffer(
  workbook: ExcelJS.Workbook
): Promise<Buffer> {
  const arrayBuffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer)
}
