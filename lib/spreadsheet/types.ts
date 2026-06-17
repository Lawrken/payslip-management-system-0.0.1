export type SpreadsheetRow = Record<string, unknown> & { rowId: string }

export type BulkSaveResult = {
  success: boolean
  updatedCount: number
  errors: { rowId: string; message: string }[]
}

export type SpreadsheetTab =
  | "employees"
  | "payrolls"
  | "payslips"
  | "schedule"
  | "users"
  | "logs"

export const SPREADSHEET_TABS: SpreadsheetTab[] = [
  "employees",
  "payrolls",
  "payslips",
  "schedule",
  "users",
  "logs",
]

export function isSpreadsheetTab(value: string | undefined): value is SpreadsheetTab {
  return SPREADSHEET_TABS.includes(value as SpreadsheetTab)
}

export const PAYROLL_SCOPED_TABS = new Set<SpreadsheetTab>(["payslips", "schedule"])
