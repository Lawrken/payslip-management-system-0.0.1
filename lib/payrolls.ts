import {
  dateRangesOverlap,
  formatPayrollPeriodLabel,
  isValidDateRange,
} from "@/lib/payroll-dates"
import { countPayslipsByPayrollId } from "@/lib/payslips"
import { seedPayrolls } from "@/lib/mock-payrolls"
import type { Payroll } from "@/lib/types"

const payrolls: Payroll[] = [...seedPayrolls]

export function getPayrolls(): Payroll[] {
  return [...payrolls].sort((a, b) =>
    b.payrollPeriodEnd.localeCompare(a.payrollPeriodEnd)
  )
}

export function getPayrollById(id: string): Payroll | undefined {
  return payrolls.find((payroll) => payroll.id === id)
}

export function getLatestPayroll(): Payroll | undefined {
  const sorted = getPayrolls()
  return sorted[0]
}

export type NewPayrollInput = Omit<Payroll, "id" | "payrollPeriodLabel"> & {
  payrollPeriodLabel?: string
}

export type UpdatePayrollInput = NewPayrollInput & { id: string }

function validatePayrollDates(input: NewPayrollInput): { error: string } | null {
  if (
    !input.payrollPeriodStart ||
    !input.payrollPeriodEnd ||
    !input.dtrCutOffStart ||
    !input.dtrCutOffEnd ||
    !input.payoutDate
  ) {
    return { error: "All date fields are required." }
  }

  if (!isValidDateRange(input.payrollPeriodStart, input.payrollPeriodEnd)) {
    return { error: "Payroll period end must be on or after the start date." }
  }

  if (!isValidDateRange(input.dtrCutOffStart, input.dtrCutOffEnd)) {
    return { error: "DTR cut-off end must be on or after the start date." }
  }

  return null
}

function hasOverlappingPayrollPeriod(
  start: string,
  end: string,
  excludeId?: string
): boolean {
  return payrolls.some(
    (payroll) =>
      payroll.id !== excludeId &&
      dateRangesOverlap(
        payroll.payrollPeriodStart,
        payroll.payrollPeriodEnd,
        start,
        end
      )
  )
}

function buildPayroll(
  id: string,
  input: NewPayrollInput
): Payroll {
  return {
    id,
    payrollPeriodLabel:
      input.payrollPeriodLabel ??
      formatPayrollPeriodLabel(input.payrollPeriodStart, input.payrollPeriodEnd),
    payrollPeriodStart: input.payrollPeriodStart,
    payrollPeriodEnd: input.payrollPeriodEnd,
    dtrCutOffStart: input.dtrCutOffStart,
    dtrCutOffEnd: input.dtrCutOffEnd,
    payoutDate: input.payoutDate,
  }
}

export function addPayroll(
  input: NewPayrollInput
): Payroll | { error: string } {
  const validationError = validatePayrollDates(input)
  if (validationError) {
    return validationError
  }

  if (
    hasOverlappingPayrollPeriod(input.payrollPeriodStart, input.payrollPeriodEnd)
  ) {
    return { error: "This payroll period overlaps an existing payroll period." }
  }

  const payroll = buildPayroll(crypto.randomUUID(), input)
  payrolls.push(payroll)
  return payroll
}

export function updatePayroll(
  input: UpdatePayrollInput
): Payroll | { error: string } {
  const index = payrolls.findIndex((payroll) => payroll.id === input.id)
  if (index === -1) {
    return { error: "Payroll not found." }
  }

  const validationError = validatePayrollDates(input)
  if (validationError) {
    return validationError
  }

  if (
    hasOverlappingPayrollPeriod(
      input.payrollPeriodStart,
      input.payrollPeriodEnd,
      input.id
    )
  ) {
    return { error: "This payroll period overlaps an existing payroll period." }
  }

  const updated = buildPayroll(input.id, input)
  payrolls[index] = updated
  return updated
}

export function deletePayroll(id: string): { success: true } | { error: string } {
  const index = payrolls.findIndex((payroll) => payroll.id === id)
  if (index === -1) {
    return { error: "Payroll not found." }
  }

  if (countPayslipsByPayrollId(id) > 0) {
    return {
      error: "Cannot delete a payroll period that has payslips. Remove payslips first.",
    }
  }

  payrolls.splice(index, 1)
  return { success: true }
}
