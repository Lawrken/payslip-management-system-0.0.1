import type { Cell, Worksheet } from "exceljs"

import type { ExcelCellStyleKind } from "@/lib/excel/styles"

export const WORKSHEET_PROTECTION_OPTIONS = {
  selectLockedCells: true,
  selectUnlockedCells: true,
  formatCells: false,
  formatColumns: false,
  formatRows: false,
  insertColumns: false,
  insertRows: false,
  deleteColumns: false,
  deleteRows: false,
  sort: false,
  autoFilter: false,
  pivotTables: false,
} as const

export function isLockedStyleKind(kind: ExcelCellStyleKind): boolean {
  return kind === "readonly" || kind === "readonlyHoliday"
}

export function setCellLocked(cell: Cell, locked: boolean): void {
  cell.protection = { locked }
}

export async function protectWorksheet(worksheet: Worksheet): Promise<void> {
  await worksheet.protect("", WORKSHEET_PROTECTION_OPTIONS)
}

export async function lockAndProtectEntireWorksheet(
  worksheet: Worksheet
): Promise<void> {
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      setCellLocked(cell, true)
    })
  })

  await protectWorksheet(worksheet)
}
