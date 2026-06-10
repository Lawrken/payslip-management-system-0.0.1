import {
  ALL_PAYSLIP_FIELD_KEYS,
  DEDUCTION_FIELDS,
  NON_TAXABLE_FIELDS,
  PAY_DETAILS_FIELDS,
} from "@/lib/payslip-fields"
import {
  CUTOFF_PERIOD_DAYS,
  HOURS_PER_DAY,
  PAYROLL_RATE_MULTIPLIERS,
  type PayrollRateKey,
} from "@/lib/payroll-rates"
import type { PayslipPayrollInputs, PayslipTotals } from "@/lib/types"

export function createEmptyPayslipInputs(): PayslipPayrollInputs {
  return ALL_PAYSLIP_FIELD_KEYS.reduce((acc, key) => {
    acc[key as keyof PayslipPayrollInputs] = 0
    return acc
  }, {} as PayslipPayrollInputs)
}

export function createPayslipInputsWithBasicPay(
  basicPay: number
): PayslipPayrollInputs {
  return {
    ...createEmptyPayslipInputs(),
    basicPay,
  }
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

function getHourlyRate(basicPay: number): number {
  return basicPay / CUTOFF_PERIOD_DAYS / HOURS_PER_DAY
}

function getDailyRate(basicPay: number): number {
  return basicPay / CUTOFF_PERIOD_DAYS
}

function computeHourLineAmount(
  hours: number,
  basicPay: number,
  rateKey: PayrollRateKey
): number {
  if (hours <= 0 || basicPay <= 0) {
    return 0
  }
  const hourlyRate = getHourlyRate(basicPay)
  return roundMoney(hours * hourlyRate * PAYROLL_RATE_MULTIPLIERS[rateKey])
}

function sumFields(
  inputs: PayslipPayrollInputs,
  fields: { key: string }[]
): number {
  return fields.reduce((sum, field) => {
    const value = inputs[field.key as keyof PayslipPayrollInputs]
    return sum + (typeof value === "number" ? value : 0)
  }, 0)
}

export type PayslipCalculationResult = PayslipTotals & {
  lineAmounts: Record<string, number>
}

export function calculatePayslipTotals(
  inputs: PayslipPayrollInputs
): PayslipCalculationResult {
  const lineAmounts: Record<string, number> = {}
  const basicPay = inputs.basicPay ?? 0

  lineAmounts.basicPay = roundMoney(basicPay)
  lineAmounts.absencesDays = roundMoney(
    -(inputs.absencesDays ?? 0) * getDailyRate(basicPay)
  )
  lineAmounts.tardiness = roundMoney(-(inputs.tardiness ?? 0))
  lineAmounts.undertime = roundMoney(-(inputs.undertime ?? 0))

  for (const field of PAY_DETAILS_FIELDS) {
    if (field.inputKind !== "hours" || !field.rateKey) {
      continue
    }
    const hours = inputs[field.key as keyof PayslipPayrollInputs] ?? 0
    lineAmounts[field.key] = computeHourLineAmount(
      typeof hours === "number" ? hours : 0,
      basicPay,
      field.rateKey
    )
  }

  const manualPesoPayDetailKeys = PAY_DETAILS_FIELDS.filter(
    (field) =>
      field.inputKind === "peso" &&
      !["basicPay", "tardiness", "undertime"].includes(field.key)
  ).map((field) => field.key)

  for (const key of manualPesoPayDetailKeys) {
    lineAmounts[key] = roundMoney(
      inputs[key as keyof PayslipPayrollInputs] ?? 0
    )
  }

  const taxableEarnings = roundMoney(
    Object.entries(lineAmounts)
      .filter(([key]) => PAY_DETAILS_FIELDS.some((field) => field.key === key))
      .reduce((sum, [, amount]) => sum + amount, 0)
  )

  const totalDeductions = roundMoney(sumFields(inputs, DEDUCTION_FIELDS))
  const nonTaxableEarnings = roundMoney(sumFields(inputs, NON_TAXABLE_FIELDS))
  const grossPay = roundMoney(taxableEarnings + nonTaxableEarnings)
  const netPay = roundMoney(grossPay - totalDeductions)

  return {
    lineAmounts,
    taxableEarnings,
    totalDeductions,
    nonTaxableEarnings,
    grossPay,
    netPay,
  }
}

export function parseDecimalInput(value: string | null | undefined): number {
  if (value === null || value === undefined) {
    return 0
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return 0
  }
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return NaN
  }
  return parsed
}

export function parsePayslipInputsFromFormData(
  formData: FormData
): PayslipPayrollInputs | { error: string } {
  const inputs = createEmptyPayslipInputs()

  for (const key of ALL_PAYSLIP_FIELD_KEYS) {
    const parsed = parseDecimalInput(String(formData.get(key) ?? ""))
    if (Number.isNaN(parsed)) {
      return { error: `Invalid number for ${key}.` }
    }
    inputs[key as keyof PayslipPayrollInputs] = parsed
  }

  return inputs
}
