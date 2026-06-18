import type { ExcelColumnDef } from "@/lib/excel/columns"

export function rowToSheetValues(
  row: Record<string, unknown>,
  columns: ExcelColumnDef[]
): unknown[] {
  return columns.map((column) => {
    const value = row[column.key]
    if (value === null || value === undefined) {
      return ""
    }
    if (typeof value === "boolean") {
      return value ? "Yes" : "No"
    }
    return value
  })
}

export function safeWorkbookFilename(value: string) {
  return (
    value
      .replace(/[^a-z0-9._-]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "payroll"
  )
}
