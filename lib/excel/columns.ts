import { DERIVED_PAYSLIP_FIELD_KEYS } from "@/lib/payroll-calculator"
import { PAYSLIP_FIELD_SECTIONS } from "@/lib/spreadsheet/payslips"

export const EXCEL_SHEET_NAMES = {
  instructions: "Instructions",
  payroll: "Payroll",
  dtrCalendar: "DTR_Calendar",
  payslips: "Payslips",
  schedule: "Schedule",
} as const

export type ExcelSheetName =
  (typeof EXCEL_SHEET_NAMES)[keyof typeof EXCEL_SHEET_NAMES]

export const IMPORTABLE_SHEET_NAMES = [
  EXCEL_SHEET_NAMES.payslips,
  EXCEL_SHEET_NAMES.schedule,
] as const satisfies readonly ExcelSheetName[]

export type ExcelListValidationKey = "shiftType" | "dtrStatus"

export type ExcelColumnDef = {
  key: string
  label: string
  editable: boolean
  section?: string
  listValidation?: ExcelListValidationKey
}

const derivedFieldKeys = new Set<string>(DERIVED_PAYSLIP_FIELD_KEYS)

const PAYSLIP_IDENTITY_COLUMNS: ExcelColumnDef[] = [
  { key: "payslipId", label: "Payslip ID", editable: false, section: "Identity" },
  { key: "employeeId", label: "Employee ID", editable: false, section: "Identity" },
  { key: "employeeName", label: "Employee", editable: false, section: "Identity" },
  { key: "status", label: "Status", editable: false, section: "Identity" },
  { key: "divisor", label: "Divisor", editable: false, section: "Identity" },
]

const PAYSLIP_TOTAL_COLUMNS: ExcelColumnDef[] = [
  {
    key: "taxableEarnings",
    label: "Taxable Earnings",
    editable: false,
    section: "Totals",
  },
  {
    key: "totalDeductions",
    label: "Total Deductions",
    editable: false,
    section: "Totals",
  },
  {
    key: "nonTaxableEarnings",
    label: "Non-Taxable",
    editable: false,
    section: "Totals",
  },
  { key: "grossPay", label: "Gross Pay", editable: false, section: "Totals" },
  { key: "netPay", label: "Net Pay", editable: false, section: "Totals" },
]

export const PAYSLIPS_COLUMNS: ExcelColumnDef[] = [
  ...PAYSLIP_IDENTITY_COLUMNS,
  ...PAYSLIP_FIELD_SECTIONS.flatMap((section) =>
    section.fields.map((field) => ({
      key: field.key,
      label: field.label,
      editable: !derivedFieldKeys.has(field.key),
      section: section.label,
    }))
  ),
  ...PAYSLIP_TOTAL_COLUMNS,
]

export const SCHEDULE_COLUMNS: ExcelColumnDef[] = [
  {
    key: "employeeId",
    label: "Employee ID",
    editable: false,
    section: "Identity",
  },
  {
    key: "employeeName",
    label: "Employee",
    editable: false,
    section: "Identity",
  },
  { key: "date", label: "Date", editable: false, section: "Identity" },
  {
    key: "holidayLocked",
    label: "Holiday Locked",
    editable: false,
    section: "Identity",
  },
  { key: "shiftType", label: "Shift Type", editable: true, listValidation: "shiftType" },
  { key: "shiftIn", label: "Shift In", editable: true },
  { key: "shiftOut", label: "Shift Out", editable: true },
  { key: "logIn", label: "Log In", editable: true },
  { key: "logOut", label: "Log Out", editable: true },
]

export const PAYROLL_COLUMNS: ExcelColumnDef[] = [
  { key: "payrollPeriodLabel", label: "Payroll Period", editable: false },
  { key: "payrollPeriodStart", label: "Period Start", editable: false },
  { key: "payrollPeriodEnd", label: "Period End", editable: false },
  { key: "dtrCutOffStart", label: "DTR Cut-Off Start", editable: false },
  { key: "dtrCutOffEnd", label: "DTR Cut-Off End", editable: false },
  { key: "payoutDate", label: "Payout Date", editable: false },
]

export const DTR_COLUMNS: ExcelColumnDef[] = [
  { key: "date", label: "Date", editable: false },
  { key: "status", label: "Status", editable: false, listValidation: "dtrStatus" },
  { key: "holidayName", label: "Holiday Name", editable: false },
]

export const PAYSLIPS_EDITABLE_KEYS = new Set(
  PAYSLIPS_COLUMNS.filter((column) => column.editable).map((column) => column.key)
)

export const SCHEDULE_EDITABLE_KEYS = new Set(
  SCHEDULE_COLUMNS.filter((column) => column.editable).map((column) => column.key)
)

export const SCHEDULE_TIME_KEYS = new Set([
  "shiftIn",
  "shiftOut",
  "logIn",
  "logOut",
])

export const SCHEDULE_HOLIDAY_LOCKED_KEYS = new Set([
  "shiftType",
  "shiftIn",
  "shiftOut",
])
