import type { Fill, Font, Style } from "exceljs"

const READONLY_HEADER_FILL: Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFD9D9D9" },
}

const EDITABLE_HEADER_FILL: Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFFFFFF" },
}

const READONLY_CELL_FILL: Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF2F2F2" },
}

const EDITABLE_CELL_FILL: Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFFFFFF" },
}

const READONLY_HOLIDAY_FILL: Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFE0E0E0" },
}

const HEADER_FONT: Partial<Font> = {
  bold: true,
  color: { argb: "FF1F2937" },
}

const BODY_FONT: Partial<Font> = {
  color: { argb: "FF111827" },
}

function baseStyle(fill: Fill, font: Partial<Font> = BODY_FONT): Partial<Style> {
  return {
    fill,
    font,
    border: {
      top: { style: "thin", color: { argb: "FFD1D5DB" } },
      left: { style: "thin", color: { argb: "FFD1D5DB" } },
      bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
      right: { style: "thin", color: { argb: "FFD1D5DB" } },
    },
  }
}

export const EXCEL_STYLES = {
  headerEditable: baseStyle(EDITABLE_HEADER_FILL, HEADER_FONT),
  headerReadonly: baseStyle(READONLY_HEADER_FILL, HEADER_FONT),
  cellEditable: baseStyle(EDITABLE_CELL_FILL),
  cellReadonly: baseStyle(READONLY_CELL_FILL),
  cellReadonlyHoliday: baseStyle(READONLY_HOLIDAY_FILL),
  legendEditableSample: baseStyle(EDITABLE_CELL_FILL),
  legendReadonlySample: baseStyle(READONLY_CELL_FILL),
} as const

export type ExcelCellStyleKind = "editable" | "readonly" | "readonlyHoliday"

export function headerStyleForKind(kind: ExcelCellStyleKind): Partial<Style> {
  return kind === "editable"
    ? EXCEL_STYLES.headerEditable
    : EXCEL_STYLES.headerReadonly
}

export function cellStyleForKind(kind: ExcelCellStyleKind): Partial<Style> {
  switch (kind) {
    case "editable":
      return EXCEL_STYLES.cellEditable
    case "readonlyHoliday":
      return EXCEL_STYLES.cellReadonlyHoliday
    default:
      return EXCEL_STYLES.cellReadonly
  }
}
