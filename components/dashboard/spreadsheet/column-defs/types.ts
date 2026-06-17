import type { SpreadsheetRow } from "@/lib/spreadsheet/types"

export type SpreadsheetColumnType =
  | "text"
  | "number"
  | "select"
  | "date"
  | "readonly"

export type SpreadsheetColumnOption = {
  value: string
  label: string
}

export type SpreadsheetColumnDef = {
  field: string
  headerName: string
  type?: SpreadsheetColumnType
  options?:
    | readonly string[]
    | SpreadsheetColumnOption[]
    | ((row: SpreadsheetRow) => readonly string[] | SpreadsheetColumnOption[])
  pinned?: "left" | "right"
  minWidth?: number
  editable?: boolean | ((row: SpreadsheetRow) => boolean)
  format?: (value: unknown, row: SpreadsheetRow) => string
}

export function minWidthForContent(
  values: readonly string[],
  headerName: string,
  floor = 120
): number {
  const longestChars = values.reduce(
    (max, value) => Math.max(max, value.length),
    headerName.length
  )

  return Math.max(floor, longestChars * 8 + 32)
}

export function resolveColumnOptions(
  options: SpreadsheetColumnDef["options"],
  row: SpreadsheetRow
): SpreadsheetColumnOption[] {
  if (!options) {
    return []
  }

  const resolved = typeof options === "function" ? options(row) : options
  return normalizeColumnOptions(resolved)
}

export function normalizeColumnOptions(
  options: readonly string[] | SpreadsheetColumnOption[]
): SpreadsheetColumnOption[] {
  if (!options) {
    return []
  }

  return options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option
  )
}

export function isColumnEditable(
  column: SpreadsheetColumnDef,
  row: SpreadsheetRow,
  readOnly: boolean
): boolean {
  if (readOnly || column.type === "readonly") {
    return false
  }

  if (column.editable === false) {
    return false
  }

  if (typeof column.editable === "function") {
    return column.editable(row)
  }

  return true
}
