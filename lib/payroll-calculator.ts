import {
  ALL_PAYSLIP_FIELD_KEYS,
  DEDUCTION_FIELDS,
  NON_TAXABLE_FIELDS,
  PAY_DETAILS_FIELDS,
} from "@/lib/payslip-fields"
import type { EmployeeDivisor } from "@/lib/employee-options"
import {
  CUTOFF_PERIOD_DAYS,
  HOURS_PER_DAY,
  PAYROLL_RATE_MULTIPLIERS,
  type PayrollRateKey,
} from "@/lib/payroll-rates"
import type {
  Employee,
  EmployeeScheduleDay,
  Payroll,
  PayslipPayrollInputs,
  PayslipTotals,
} from "@/lib/types"

export const DERIVED_PAYSLIP_FIELD_KEYS = [
  "basicPay",
  "absencesDays",
  "tardiness",
  "undertime",
  "nd",
  "regOt",
  "rdOt",
  "rdOtOver8",
  "rdotNd",
  "legal",
  "legalOver8",
  "special",
  "spclOver8",
  "lglNd",
  "spclNd",
  "spclRd",
  "spclRdOver8",
] as const satisfies readonly (keyof PayslipPayrollInputs)[]

const NIGHT_DIFFERENTIAL_START_MINUTE = 22 * 60
const NIGHT_DIFFERENTIAL_END_MINUTE = 6 * 60

const DERIVED_PAYSLIP_FIELDS = new Set<keyof PayslipPayrollInputs>(
  DERIVED_PAYSLIP_FIELD_KEYS
)

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

function getDailyRate(
  basicPay: number,
  divisor: EmployeeDivisor | number = CUTOFF_PERIOD_DAYS * 24
): number {
  return roundMoney((basicPay * 24) / divisor)
}

function getHourlyRate(
  basicPay: number,
  divisor: EmployeeDivisor | number = CUTOFF_PERIOD_DAYS * 24
): number {
  return roundMoney(getDailyRate(basicPay, divisor) / HOURS_PER_DAY)
}

function getPerMinuteRate(
  basicPay: number,
  divisor: EmployeeDivisor | number
): number {
  return roundMoney(getHourlyRate(basicPay, divisor) / 60)
}

function computeHourLineAmount(
  hours: number,
  basicPay: number,
  rateKey: PayrollRateKey,
  divisor?: EmployeeDivisor | number
): number {
  if (hours <= 0 || basicPay <= 0) {
    return 0
  }
  const hourlyRate = getHourlyRate(basicPay, divisor)
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
  inputs: PayslipPayrollInputs,
  divisor?: EmployeeDivisor | number
): PayslipCalculationResult {
  const lineAmounts: Record<string, number> = {}
  const basicPay = inputs.basicPay ?? 0

  lineAmounts.basicPay = roundMoney(basicPay)
  lineAmounts.absencesDays = roundMoney(
    -(inputs.absencesDays ?? 0) * getDailyRate(basicPay, divisor)
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
      field.rateKey,
      divisor
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

function parseMinutes(value: string): number | null {
  const match = value.trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/)
  if (!match) {
    return null
  }
  return Number(match[1]) * 60 + Number(match[2])
}

function minutesBetween(start: string, end: string): number | null {
  const startMinutes = parseMinutes(start)
  const endMinutes = parseMinutes(end)
  if (startMinutes === null || endMinutes === null) {
    return null
  }

  return endMinutes >= startMinutes
    ? endMinutes - startMinutes
    : endMinutes + 24 * 60 - startMinutes
}

function minutesAfter(start: string, end: string): number {
  const minutes = minutesBetween(start, end)
  return minutes === null ? 0 : minutes
}

function floorToHalfHour(minutes: number): number {
  if (minutes <= 0) {
    return 0
  }
  return Math.floor(minutes / 30) * 0.5
}

function roundHours(value: number): number {
  return Math.round(value * 100) / 100
}

function hasLogPair(day: EmployeeScheduleDay): boolean {
  return Boolean(day.logIn && day.logOut)
}

function hasShiftPair(day: EmployeeScheduleDay): boolean {
  return Boolean(day.shiftIn && day.shiftOut)
}

function countOvertimeHours(day: EmployeeScheduleDay): number {
  if (!hasLogPair(day) || !day.shiftOut) {
    return 0
  }

  const logOut = parseMinutes(day.logOut)
  const shiftOut = parseMinutes(day.shiftOut)
  if (logOut === null || shiftOut === null) {
    return 0
  }

  const overtimeMinutes = logOut > shiftOut ? logOut - shiftOut : 0
  return floorToHalfHour(overtimeMinutes)
}

function countWorkedHolidayHours(day: EmployeeScheduleDay): number {
  if (!hasLogPair(day)) {
    return 0
  }

  const workedMinutes = minutesAfter(day.logIn, day.logOut)
  return roundHours(Math.min(workedMinutes / 60, HOURS_PER_DAY))
}

function countHolidayOver8Hours(day: EmployeeScheduleDay): number {
  if (!hasLogPair(day)) {
    return 0
  }

  if (hasShiftPair(day)) {
    return countOvertimeHours(day)
  }

  const workedMinutes = minutesAfter(day.logIn, day.logOut)
  return floorToHalfHour(Math.max(0, workedMinutes - HOURS_PER_DAY * 60))
}

function countNightDifferentialHours(day: EmployeeScheduleDay): number {
  if (!hasLogPair(day)) {
    return 0
  }

  const start = parseMinutes(day.logIn)
  const end = parseMinutes(day.logOut)
  if (start === null || end === null) {
    return 0
  }

  const adjustedEnd = end <= start ? end + 24 * 60 : end
  const nightWindows: [number, number][] = [
    [0, NIGHT_DIFFERENTIAL_END_MINUTE],
    [NIGHT_DIFFERENTIAL_START_MINUTE, 24 * 60 + NIGHT_DIFFERENTIAL_END_MINUTE],
  ]

  const nightMinutes = nightWindows.reduce((sum, [windowStart, windowEnd]) => {
    const overlapStart = Math.max(start, windowStart)
    const overlapEnd = Math.min(adjustedEnd, windowEnd)
    return sum + Math.max(0, overlapEnd - overlapStart)
  }, 0)

  return roundHours(nightMinutes / 60)
}

function isWorkRequired(day: EmployeeScheduleDay): boolean {
  return day.shiftType === "scheduledShift" || day.shiftType === "legalHoliday"
}

export function derivePayslipInputsFromSchedule({
  employee,
  scheduleDays,
  existingInputs,
}: {
  employee: Employee
  payroll: Payroll
  scheduleDays: EmployeeScheduleDay[]
  existingInputs?: PayslipPayrollInputs
}): PayslipPayrollInputs {
  const inputs = {
    ...createEmptyPayslipInputs(),
    ...(existingInputs ?? {}),
  }
  const perMinuteRate = getPerMinuteRate(employee.basicPay, employee.divisor)

  for (const key of DERIVED_PAYSLIP_FIELDS) {
    inputs[key] = 0
  }

  inputs.basicPay = roundMoney(employee.basicPay)

  for (const day of scheduleDays) {
    const hasLogs = hasLogPair(day)

    if (isWorkRequired(day) && !hasLogs) {
      inputs.absencesDays += 1
      continue
    }

    if (!hasLogs) {
      continue
    }

    if (isWorkRequired(day) && hasShiftPair(day)) {
      const shiftIn = parseMinutes(day.shiftIn)
      const shiftOut = parseMinutes(day.shiftOut)
      const logIn = parseMinutes(day.logIn)
      const logOut = parseMinutes(day.logOut)

      if (shiftIn !== null && logIn !== null && logIn > shiftIn) {
        inputs.tardiness += roundMoney((logIn - shiftIn) * perMinuteRate)
      }

      if (shiftOut !== null && logOut !== null && logOut < shiftOut) {
        inputs.undertime += roundMoney((shiftOut - logOut) * perMinuteRate)
      }
    }

    if (day.shiftType === "scheduledShift") {
      inputs.nd += countNightDifferentialHours(day)
      inputs.regOt += countOvertimeHours(day)
    } else if (day.shiftType === "legalHoliday") {
      inputs.legal += countWorkedHolidayHours(day)
      inputs.legalOver8 += countHolidayOver8Hours(day)
      inputs.lglNd += countNightDifferentialHours(day)
    } else if (day.shiftType === "specialHoliday") {
      inputs.special += countWorkedHolidayHours(day)
      inputs.spclOver8 += countHolidayOver8Hours(day)
      inputs.spclNd += countNightDifferentialHours(day)
    }
  }

  inputs.absencesDays = roundHours(inputs.absencesDays)
  inputs.tardiness = roundMoney(inputs.tardiness)
  inputs.undertime = roundMoney(inputs.undertime)
  inputs.nd = roundHours(inputs.nd)
  inputs.regOt = roundHours(inputs.regOt)
  inputs.legal = roundHours(inputs.legal)
  inputs.legalOver8 = roundHours(inputs.legalOver8)
  inputs.lglNd = roundHours(inputs.lglNd)
  inputs.special = roundHours(inputs.special)
  inputs.spclOver8 = roundHours(inputs.spclOver8)
  inputs.spclNd = roundHours(inputs.spclNd)

  return inputs
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
