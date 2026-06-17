import type { Payroll } from "@/lib/types"
import type { SpreadsheetRow } from "@/lib/spreadsheet/types"

export type PayrollSpreadsheetRow = SpreadsheetRow & {
  id: string
  payrollPeriodLabel: string
  payrollPeriodStart: string
  payrollPeriodEnd: string
  dtrCutOffStart: string
  dtrCutOffEnd: string
  payoutDate: string
}

export function payrollToSpreadsheetRow(payroll: Payroll): PayrollSpreadsheetRow {
  return {
    rowId: payroll.id,
    id: payroll.id,
    payrollPeriodLabel: payroll.payrollPeriodLabel,
    payrollPeriodStart: payroll.payrollPeriodStart,
    payrollPeriodEnd: payroll.payrollPeriodEnd,
    dtrCutOffStart: payroll.dtrCutOffStart,
    dtrCutOffEnd: payroll.dtrCutOffEnd,
    payoutDate: payroll.payoutDate,
  }
}

export function payrollsToSpreadsheetRows(
  payrolls: Payroll[]
): PayrollSpreadsheetRow[] {
  return payrolls.map(payrollToSpreadsheetRow)
}
