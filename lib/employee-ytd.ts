import type { EmployeeDivisor } from "@/lib/employee-options"
import { calculatePayslipTotals } from "@/lib/payroll-calculator"
import {
  DEDUCTION_FIELDS,
  NON_TAXABLE_FIELDS,
  PAY_DETAILS_FIELDS,
} from "@/lib/payslip-fields"
import type {
  EmployeeYtdBreakdownItem,
  EmployeeYtdSummary,
  PayslipPayrollInputs,
} from "@/lib/types"

const THIRTEENTH_MONTH_DIVISOR = 12

export type EmployeeYtdPayslipSource = {
  inputs: PayslipPayrollInputs
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

function readInputAmount(
  inputs: PayslipPayrollInputs,
  key: string
): number {
  const value = inputs[key as keyof PayslipPayrollInputs]
  return typeof value === "number" ? value : 0
}

function toBreakdownItems(
  fields: { key: string; label: string }[],
  totalsByKey: Map<string, number>
): EmployeeYtdBreakdownItem[] {
  return fields.map((field) => ({
    key: field.key,
    label: field.label,
    amount: roundMoney(totalsByKey.get(field.key) ?? 0),
  }))
}

/**
 * Aggregates a set of visible payslips into a single year-to-date summary.
 *
 * The 13th month estimate uses adjusted basic pay as its basis:
 * `basicPay - absence deduction - tardiness - undertime`, summed across the
 * included payslips and divided by 12. Absence deductions are derived from the
 * shared payroll calculation logic so the employee divisor is applied
 * consistently with how individual payslips are calculated.
 */
export function buildEmployeeYtdSummary(
  year: number,
  sources: EmployeeYtdPayslipSource[],
  divisor?: EmployeeDivisor | number
): EmployeeYtdSummary {
  const payDetailTotals = new Map<string, number>()
  const deductionTotals = new Map<string, number>()
  const nonTaxableTotals = new Map<string, number>()

  let taxableEarnings = 0
  let totalDeductions = 0
  let nonTaxableEarnings = 0
  let grossPay = 0
  let netPay = 0
  let adjustedBasicPayBasis = 0

  for (const source of sources) {
    const { inputs } = source
    const calculation = calculatePayslipTotals(inputs, divisor)

    taxableEarnings += calculation.taxableEarnings
    totalDeductions += calculation.totalDeductions
    nonTaxableEarnings += calculation.nonTaxableEarnings
    grossPay += calculation.grossPay
    netPay += calculation.netPay

    // lineAmounts.absencesDays is the absence deduction (a non-positive value),
    // so adding it subtracts the deduction from basic pay.
    const basicPay = readInputAmount(inputs, "basicPay")
    const absenceDeduction = calculation.lineAmounts.absencesDays ?? 0
    const tardiness = readInputAmount(inputs, "tardiness")
    const undertime = readInputAmount(inputs, "undertime")
    adjustedBasicPayBasis +=
      basicPay + absenceDeduction - tardiness - undertime

    for (const field of PAY_DETAILS_FIELDS) {
      const amount =
        calculation.lineAmounts[field.key] ?? readInputAmount(inputs, field.key)
      payDetailTotals.set(
        field.key,
        (payDetailTotals.get(field.key) ?? 0) + amount
      )
    }
    for (const field of DEDUCTION_FIELDS) {
      deductionTotals.set(
        field.key,
        (deductionTotals.get(field.key) ?? 0) +
          readInputAmount(inputs, field.key)
      )
    }
    for (const field of NON_TAXABLE_FIELDS) {
      nonTaxableTotals.set(
        field.key,
        (nonTaxableTotals.get(field.key) ?? 0) +
          readInputAmount(inputs, field.key)
      )
    }
  }

  const roundedAdjustedBasis = roundMoney(adjustedBasicPayBasis)

  return {
    year,
    includedPayslipCount: sources.length,
    totals: {
      taxableEarnings: roundMoney(taxableEarnings),
      totalDeductions: roundMoney(totalDeductions),
      nonTaxableEarnings: roundMoney(nonTaxableEarnings),
      grossPay: roundMoney(grossPay),
      netPay: roundMoney(netPay),
    },
    adjustedBasicPayBasis: roundedAdjustedBasis,
    estimated13thMonthPay: roundMoney(
      roundedAdjustedBasis / THIRTEENTH_MONTH_DIVISOR
    ),
    breakdown: {
      payDetails: toBreakdownItems(PAY_DETAILS_FIELDS, payDetailTotals),
      deductions: toBreakdownItems(DEDUCTION_FIELDS, deductionTotals),
      nonTaxableEarnings: toBreakdownItems(
        NON_TAXABLE_FIELDS,
        nonTaxableTotals
      ),
    },
  }
}
