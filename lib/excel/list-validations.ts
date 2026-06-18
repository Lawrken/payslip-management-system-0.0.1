import type { DataValidation, Worksheet } from "exceljs"
import type ExcelJS from "exceljs"

import type { ExcelListValidationKey } from "@/lib/excel/columns"
import { DTR_DAY_STATUS_OPTIONS } from "@/lib/dtr-days"
import { SHIFT_TYPE_OPTIONS } from "@/lib/schedule-days"

export const EXCEL_LIST_SHEET_NAME = "Lists"

export type ExcelListValidationRanges = Record<ExcelListValidationKey, string>

type WorksheetWithDataValidations = Worksheet & {
  dataValidations: {
    add: (address: string, validation: DataValidation) => void
  }
}

function columnLetter(columnIndex: number): string {
  let index = columnIndex + 1
  let letters = ""

  while (index > 0) {
    const remainder = (index - 1) % 26
    letters = String.fromCharCode(65 + remainder) + letters
    index = Math.floor((index - 1) / 26)
  }

  return letters
}

export function buildListValidationSheet(
  workbook: ExcelJS.Workbook
): ExcelListValidationRanges {
  const worksheet = workbook.addWorksheet(EXCEL_LIST_SHEET_NAME)
  worksheet.state = "veryHidden"

  const shiftTypes = SHIFT_TYPE_OPTIONS.map((option) => option.value)
  const dtrStatuses = DTR_DAY_STATUS_OPTIONS.map((option) => option.value)

  shiftTypes.forEach((value, index) => {
    worksheet.getCell(index + 1, 1).value = value
  })
  dtrStatuses.forEach((value, index) => {
    worksheet.getCell(index + 1, 2).value = value
  })

  const shiftTypeRange = `${EXCEL_LIST_SHEET_NAME}!$A$1:$A$${shiftTypes.length}`
  const dtrStatusRange = `${EXCEL_LIST_SHEET_NAME}!$B$1:$B$${dtrStatuses.length}`

  workbook.definedNames.add(shiftTypeRange, "ShiftTypeList")
  workbook.definedNames.add(dtrStatusRange, "DtrStatusList")

  return {
    shiftType: shiftTypeRange,
    dtrStatus: dtrStatusRange,
  }
}

export function applyListValidation(
  worksheet: Worksheet,
  columnIndex: number,
  dataRowCount: number,
  rangeFormula: string,
  options?: { allowBlank?: boolean }
) {
  if (dataRowCount < 1) {
    return
  }

  const column = columnLetter(columnIndex)
  const address = `${column}2:${column}${dataRowCount + 1}`
  const sheet = worksheet as WorksheetWithDataValidations

  sheet.dataValidations.add(address, {
    type: "list",
    allowBlank: options?.allowBlank ?? true,
    formulae: [rangeFormula],
    showErrorMessage: true,
    errorTitle: "Invalid value",
    error: "Choose a value from the dropdown list.",
    showInputMessage: true,
    promptTitle: "Select a value",
    prompt: "Use the dropdown to pick a valid option.",
  })
}
