import { normalizeEmployeeId } from "@/lib/auth"
import { findEmployeeByEmployeeId } from "@/lib/employees"
import { seedPayslips } from "@/lib/mock-payslips"
import { calculatePayslipTotals } from "@/lib/payroll-calculator"
import type { Payslip, PayslipPayrollInputs, PayslipStatus } from "@/lib/types"

const payslips: Payslip[] = [...seedPayslips]

export function getPayslips(): Payslip[] {
  return [...payslips]
}

export function getPayslipsByPayrollId(payrollId: string): Payslip[] {
  return payslips.filter((payslip) => payslip.payrollId === payrollId)
}

export function countPayslipsByPayrollId(payrollId: string): number {
  return payslips.filter((payslip) => payslip.payrollId === payrollId).length
}

export type NewPayslipInput = {
  payrollId: string
  employeeId: string
  inputs: PayslipPayrollInputs
}

export function addPayslip(
  input: NewPayslipInput
): Payslip | { error: string } {
  const payrollId = input.payrollId.trim()
  const employeeId = normalizeEmployeeId(input.employeeId)
  const employee = findEmployeeByEmployeeId(employeeId)

  if (!payrollId) {
    return { error: "Payroll period is required." }
  }

  if (!employee) {
    return { error: "No employee found with that Employee ID." }
  }

  if (
    payslips.some(
      (payslip) =>
        payslip.payrollId === payrollId && payslip.employeeId === employeeId
    )
  ) {
    return {
      error: "A payslip for this employee and payroll period already exists.",
    }
  }

  const totals = calculatePayslipTotals(input.inputs)

  const payslip: Payslip = {
    id: crypto.randomUUID(),
    payrollId,
    employeeId,
    employeeName: employee.name,
    status: "pending",
    inputs: input.inputs,
    totals: {
      taxableEarnings: totals.taxableEarnings,
      totalDeductions: totals.totalDeductions,
      nonTaxableEarnings: totals.nonTaxableEarnings,
      grossPay: totals.grossPay,
      netPay: totals.netPay,
    },
  }

  payslips.push(payslip)
  return payslip
}

export type UpdatePayslipInput = {
  id: string
  payrollId: string
  employeeId: string
  status: PayslipStatus
  inputs?: PayslipPayrollInputs
}

export function updatePayslip(
  input: UpdatePayslipInput
): Payslip | { error: string } {
  const index = payslips.findIndex((payslip) => payslip.id === input.id)
  if (index === -1) {
    return { error: "Payslip not found." }
  }

  const existing = payslips[index]
  const payrollId = input.payrollId.trim()
  const employeeId = normalizeEmployeeId(input.employeeId)
  const employee = findEmployeeByEmployeeId(employeeId)

  if (!payrollId) {
    return { error: "Payroll period is required." }
  }

  if (!employee) {
    return { error: "No employee found with that Employee ID." }
  }

  const duplicate = payslips.some(
    (payslip) =>
      payslip.id !== input.id &&
      payslip.payrollId === payrollId &&
      payslip.employeeId === employeeId
  )
  if (duplicate) {
    return {
      error: "A payslip for this employee and payroll period already exists.",
    }
  }

  const inputs = input.inputs ?? existing.inputs
  const totals = calculatePayslipTotals(inputs)

  const updated: Payslip = {
    id: input.id,
    payrollId,
    employeeId,
    employeeName: employee.name,
    status: input.status,
    inputs,
    totals: {
      taxableEarnings: totals.taxableEarnings,
      totalDeductions: totals.totalDeductions,
      nonTaxableEarnings: totals.nonTaxableEarnings,
      grossPay: totals.grossPay,
      netPay: totals.netPay,
    },
  }

  payslips[index] = updated
  return updated
}

export function deletePayslip(id: string): { success: true } | { error: string } {
  const index = payslips.findIndex((payslip) => payslip.id === id)
  if (index === -1) {
    return { error: "Payslip not found." }
  }

  payslips.splice(index, 1)
  return { success: true }
}

export function sendPendingPayslips(
  payrollId?: string
): { count: number } | { error: string } {
  let count = 0
  for (const payslip of payslips) {
    if (payrollId && payslip.payrollId !== payrollId) {
      continue
    }
    if (payslip.status === "pending") {
      payslip.status = "sent"
      count += 1
    }
  }
  return { count }
}
