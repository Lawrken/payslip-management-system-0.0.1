import {
  ALL_PAYSLIP_FIELD_KEYS,
  DEDUCTION_FIELDS,
  NON_TAXABLE_ADJUSTMENT_PAIRS,
  NON_TAXABLE_FIELDS,
  PAY_DETAILS_FIELDS,
} from "@/lib/payslip-fields"
import {
  calculatePayslipTotals,
  derivePayslipInputsFromSchedule,
  parseDecimalInput,
} from "@/lib/payroll-calculator"
import { mergeScheduleDays } from "@/lib/schedule-days"
import type { SpreadsheetRow } from "@/lib/spreadsheet/types"
import type {
  Employee,
  EmployeeSchedule,
  Payroll,
  Payslip,
  PayslipPayrollInputs,
} from "@/lib/types"

export type PayslipSpreadsheetRow = SpreadsheetRow & {
  id: string
  payrollId: string
  employeeId: string
  employeeName: string
  status: string
  divisor: number
  taxableEarnings: number
  totalDeductions: number
  nonTaxableEarnings: number
  grossPay: number
  netPay: number
} & PayslipPayrollInputs

const PAYSLIP_INPUT_KEYS = ALL_PAYSLIP_FIELD_KEYS as (keyof PayslipPayrollInputs)[]
const NON_TAXABLE_ADJUSTMENT_FIELD_KEYS = new Set<string>(
  NON_TAXABLE_ADJUSTMENT_PAIRS.map(({ adjKey }) => adjKey)
)

const DEFAULT_DIVISOR = 261

export function payslipToSpreadsheetRow(
  payslip: Payslip,
  employee?: Employee | null,
  options?: {
    payroll?: Payroll
    scheduleDays?: EmployeeSchedule["days"]
  }
): PayslipSpreadsheetRow {
  const divisor = employee?.divisor ?? DEFAULT_DIVISOR
  let inputs = payslip.inputs

  if (employee && options?.payroll) {
    inputs = derivePayslipInputsFromSchedule({
      employee,
      payroll: options.payroll,
      scheduleDays: options.scheduleDays ?? [],
      existingInputs: payslip.inputs,
    })
  }

  const totals = calculatePayslipTotals(inputs, divisor)

  return {
    rowId: payslip.id,
    id: payslip.id,
    payrollId: payslip.payrollId,
    employeeId: payslip.employeeId,
    employeeName: payslip.employeeName,
    status: payslip.status,
    divisor,
    ...inputs,
    taxableEarnings: totals.taxableEarnings,
    totalDeductions: totals.totalDeductions,
    nonTaxableEarnings: totals.nonTaxableEarnings,
    grossPay: totals.grossPay,
    netPay: totals.netPay,
  }
}

export function payslipsToSpreadsheetRows(
  payslips: Payslip[],
  employeesByEmployeeId: Map<string, Employee>,
  payroll?: Payroll | null,
  schedulesByEmployeeId?: Map<string, EmployeeSchedule>
): PayslipSpreadsheetRow[] {
  return payslips.map((payslip) => {
    const employee = employeesByEmployeeId.get(payslip.employeeId) ?? null
    const schedule = schedulesByEmployeeId?.get(payslip.employeeId)
    const scheduleDays =
      payroll !== undefined && payroll !== null
        ? mergeScheduleDays(payroll, schedule?.days)
        : schedule?.days

    return payslipToSpreadsheetRow(payslip, employee, {
      payroll: payroll ?? undefined,
      scheduleDays,
    })
  })
}

export function recalculatePayslipRowTotals(
  row: PayslipSpreadsheetRow
): PayslipSpreadsheetRow {
  const inputs = PAYSLIP_INPUT_KEYS.reduce((acc, key) => {
    acc[key] = Number(row[key] ?? 0)
    return acc
  }, {} as PayslipPayrollInputs)

  const totals = calculatePayslipTotals(inputs, row.divisor)
  return {
    ...row,
    ...inputs,
    taxableEarnings: totals.taxableEarnings,
    totalDeductions: totals.totalDeductions,
    nonTaxableEarnings: totals.nonTaxableEarnings,
    grossPay: totals.grossPay,
    netPay: totals.netPay,
  }
}

export function spreadsheetRowToPayslipInputs(
  row: PayslipSpreadsheetRow
): PayslipPayrollInputs | { error: string } {
  const inputs = {} as PayslipPayrollInputs

  for (const key of PAYSLIP_INPUT_KEYS) {
    if (NON_TAXABLE_ADJUSTMENT_FIELD_KEYS.has(key)) {
      inputs[key] = 0
      continue
    }

    const parsed = parseDecimalInput(String(row[key] ?? ""))
    if (Number.isNaN(parsed)) {
      return { error: `Invalid number for ${key}.` }
    }
    inputs[key] = parsed
  }

  return inputs
}

export const PAYSLIP_FIELD_SECTIONS = [
  { label: "Pay Details", fields: PAY_DETAILS_FIELDS },
  { label: "Deductions", fields: DEDUCTION_FIELDS },
  { label: "Non-Taxable", fields: NON_TAXABLE_FIELDS },
] as const
