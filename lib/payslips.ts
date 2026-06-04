import { and, eq, ne } from "drizzle-orm"

import { db } from "@/db"
import {
  employees as employeesTable,
  payrolls as payrollsTable,
  payslipInputs,
  payslips,
} from "@/db/schema"
import { normalizeEmployeeId } from "@/lib/auth-helpers"
import { findEmployeeByEmployeeId, getEmployees } from "@/lib/employees"
import {
  calculatePayslipTotals,
  createEmptyPayslipInputs,
} from "@/lib/payroll-calculator"
import type { Payslip, PayslipPayrollInputs, PayslipStatus } from "@/lib/types"

function buildPayslipTotals(inputs: PayslipPayrollInputs) {
  const totals = calculatePayslipTotals(inputs)
  return {
    taxableEarnings: totals.taxableEarnings,
    totalDeductions: totals.totalDeductions,
    nonTaxableEarnings: totals.nonTaxableEarnings,
    grossPay: totals.grossPay,
    netPay: totals.netPay,
  }
}

function mapPayslipRow(row: {
  payslip: typeof payslips.$inferSelect
  payslipInput: typeof payslipInputs.$inferSelect | null
  employee: typeof employeesTable.$inferSelect | null
}): Payslip {
  const inputs = row.payslipInput?.inputs ?? createEmptyPayslipInputs()
  const totals = row.payslipInput?.totals ?? buildPayslipTotals(inputs)

  return {
    id: row.payslip.id,
    payrollId: row.payslip.payrollId,
    employeeId: row.payslip.employeeId,
    employeeName: row.employee?.name ?? row.payslip.employeeId,
    status: row.payslip.status,
    inputs,
    totals,
  }
}

async function getPayslipRows() {
  return db
    .select({
      payslip: payslips,
      payslipInput: payslipInputs,
      employee: employeesTable,
    })
    .from(payslips)
    .leftJoin(payslipInputs, eq(payslipInputs.payslipId, payslips.id))
    .leftJoin(employeesTable, eq(employeesTable.employeeId, payslips.employeeId))
}

export async function getPayslips(): Promise<Payslip[]> {
  const rows = await getPayslipRows()
  return rows.map(mapPayslipRow).sort((a, b) => {
    const payrollSort = a.payrollId.localeCompare(b.payrollId)
    if (payrollSort !== 0) {
      return payrollSort
    }
    return a.employeeName.localeCompare(b.employeeName)
  })
}

export async function getPayslipById(id: string): Promise<Payslip | null> {
  const [row] = await db
    .select({
      payslip: payslips,
      payslipInput: payslipInputs,
      employee: employeesTable,
    })
    .from(payslips)
    .leftJoin(payslipInputs, eq(payslipInputs.payslipId, payslips.id))
    .leftJoin(employeesTable, eq(employeesTable.employeeId, payslips.employeeId))
    .where(eq(payslips.id, id))
    .limit(1)

  return row ? mapPayslipRow(row) : null
}

export async function getPayslipsByPayrollId(
  payrollId: string
): Promise<Payslip[]> {
  const rows = await db
    .select({
      payslip: payslips,
      payslipInput: payslipInputs,
      employee: employeesTable,
    })
    .from(payslips)
    .leftJoin(payslipInputs, eq(payslipInputs.payslipId, payslips.id))
    .leftJoin(employeesTable, eq(employeesTable.employeeId, payslips.employeeId))
    .where(eq(payslips.payrollId, payrollId))

  return rows.map(mapPayslipRow)
}

export async function countPayslipsByPayrollId(
  payrollId: string
): Promise<number> {
  const payrollPayslips = await getPayslipsByPayrollId(payrollId)
  return payrollPayslips.length
}

export function hasPayslipData(inputs: PayslipPayrollInputs): boolean {
  return Object.values(inputs).some(
    (value) => typeof value === "number" && value > 0
  )
}

export function resolveStatusAfterSave(
  existingStatus: PayslipStatus,
  inputs: PayslipPayrollInputs
): PayslipStatus {
  if (!hasPayslipData(inputs)) {
    return "draft"
  }

  if (
    existingStatus === "adminApproved" ||
    existingStatus === "approved" ||
    existingStatus === "returned" ||
    existingStatus === "sent"
  ) {
    return "pending"
  }

  if (existingStatus === "draft") {
    return "pending"
  }

  return existingStatus
}

export async function createPayslipsForPayroll(
  payrollId: string
): Promise<number> {
  const employees = await getEmployees()
  const existing = await getPayslipsByPayrollId(payrollId)
  const existingEmployeeIds = new Set(existing.map((payslip) => payslip.employeeId))
  const newPayslips = employees.filter(
    (employee) => !existingEmployeeIds.has(employee.employeeId)
  )

  if (newPayslips.length === 0) {
    return 0
  }

  const rows = newPayslips.map((employee) => ({
    id: crypto.randomUUID(),
    payrollId,
    employeeId: employee.employeeId,
    status: "draft" as const,
  }))
  const inputs = createEmptyPayslipInputs()
  const totals = buildPayslipTotals(inputs)

  await db.insert(payslips).values(rows)
  await db.insert(payslipInputs).values(
    rows.map((row) => ({
      payslipId: row.id,
      inputs,
      totals,
      updatedAt: new Date(),
    }))
  )

  return rows.length
}

export async function deletePayslipsByPayrollId(
  payrollId: string
): Promise<number> {
  const before = await countPayslipsByPayrollId(payrollId)
  await db.delete(payslips).where(eq(payslips.payrollId, payrollId))
  return before
}

export type NewPayslipInput = {
  payrollId: string
  employeeId: string
  inputs: PayslipPayrollInputs
}

export async function addPayslip(
  input: NewPayslipInput
): Promise<Payslip | { error: string }> {
  const payrollId = input.payrollId.trim()
  const employeeId = normalizeEmployeeId(input.employeeId)
  const payroll = await db.query.payrolls.findFirst({
    where: eq(payrollsTable.id, payrollId),
  })
  const employee = await findEmployeeByEmployeeId(employeeId)

  if (!payrollId || !payroll) {
    return { error: "Payroll period is required." }
  }

  if (!employee) {
    return { error: "No employee found with that Employee ID." }
  }

  const duplicate = await db.query.payslips.findFirst({
    where: and(
      eq(payslips.payrollId, payrollId),
      eq(payslips.employeeId, employeeId)
    ),
  })
  if (duplicate) {
    return {
      error: "A payslip for this employee and payroll period already exists.",
    }
  }

  const status: PayslipStatus = hasPayslipData(input.inputs) ? "pending" : "draft"
  const id = crypto.randomUUID()
  const totals = buildPayslipTotals(input.inputs)

  await db.insert(payslips).values({
    id,
    payrollId,
    employeeId,
    status,
    updatedAt: new Date(),
  })
  await db.insert(payslipInputs).values({
    payslipId: id,
    inputs: input.inputs,
    totals,
    updatedAt: new Date(),
  })

  return {
    id,
    payrollId,
    employeeId,
    employeeName: employee.name,
    status,
    inputs: input.inputs,
    totals,
  }
}

export type UpdatePayslipInput = {
  id: string
  payrollId: string
  employeeId: string
  inputs: PayslipPayrollInputs
}

export async function updatePayslip(
  input: UpdatePayslipInput
): Promise<Payslip | { error: string }> {
  const existing = await getPayslipById(input.id)
  if (!existing) {
    return { error: "Payslip not found." }
  }

  const payrollId = input.payrollId.trim()
  const employeeId = normalizeEmployeeId(input.employeeId)
  const payroll = await db.query.payrolls.findFirst({
    where: eq(payrollsTable.id, payrollId),
  })
  const employee = await findEmployeeByEmployeeId(employeeId)

  if (!payrollId || !payroll) {
    return { error: "Payroll period is required." }
  }

  if (!employee) {
    return { error: "No employee found with that Employee ID." }
  }

  const duplicate = await db.query.payslips.findFirst({
    where: and(
      ne(payslips.id, input.id),
      eq(payslips.payrollId, payrollId),
      eq(payslips.employeeId, employeeId)
    ),
  })
  if (duplicate) {
    return {
      error: "A payslip for this employee and payroll period already exists.",
    }
  }

  const status = resolveStatusAfterSave(existing.status, input.inputs)
  const totals = buildPayslipTotals(input.inputs)

  await db
    .update(payslips)
    .set({
      payrollId,
      employeeId,
      status,
      updatedAt: new Date(),
    })
    .where(eq(payslips.id, input.id))
  await db
    .update(payslipInputs)
    .set({
      inputs: input.inputs,
      totals,
      updatedAt: new Date(),
    })
    .where(eq(payslipInputs.payslipId, input.id))

  return {
    id: input.id,
    payrollId,
    employeeId,
    employeeName: employee.name,
    status,
    inputs: input.inputs,
    totals,
  }
}

export async function approvePayslipByAdmin(
  id: string
): Promise<Payslip | { error: string }> {
  const payslip = await getPayslipById(id)
  if (!payslip) {
    return { error: "Payslip not found." }
  }

  if (payslip.status !== "pending") {
    return { error: "Only payslips ready for review can be marked checked." }
  }

  if (!hasPayslipData(payslip.inputs)) {
    return { error: "Payslip must have payroll data before it can be checked." }
  }

  await db
    .update(payslips)
    .set({ status: "adminApproved", updatedAt: new Date() })
    .where(eq(payslips.id, id))

  return { ...payslip, status: "adminApproved" }
}

export async function approvePayslipBySuperAdmin(
  id: string
): Promise<Payslip | { error: string }> {
  const payslip = await getPayslipById(id)
  if (!payslip) {
    return { error: "Payslip not found." }
  }

  if (payslip.status !== "adminApproved") {
    return { error: "Only checked payslips can be approved." }
  }

  await db
    .update(payslips)
    .set({ status: "approved", updatedAt: new Date() })
    .where(eq(payslips.id, id))

  return { ...payslip, status: "approved" }
}

export async function returnPayslipByAdmin(
  id: string
): Promise<Payslip | { error: string }> {
  const payslip = await getPayslipById(id)
  if (!payslip) {
    return { error: "Payslip not found." }
  }

  if (payslip.status !== "pending") {
    return { error: "Only payslips ready for review can be returned." }
  }

  if (!hasPayslipData(payslip.inputs)) {
    return { error: "Payslip must have payroll data before it can be returned." }
  }

  await db
    .update(payslips)
    .set({ status: "returned", updatedAt: new Date() })
    .where(eq(payslips.id, id))

  return { ...payslip, status: "returned" }
}

export async function returnPayslipBySuperAdmin(
  id: string
): Promise<Payslip | { error: string }> {
  const payslip = await getPayslipById(id)
  if (!payslip) {
    return { error: "Payslip not found." }
  }

  if (payslip.status !== "adminApproved") {
    return { error: "Only checked payslips can be returned." }
  }

  await db
    .update(payslips)
    .set({ status: "returned", updatedAt: new Date() })
    .where(eq(payslips.id, id))

  return { ...payslip, status: "returned" }
}

export async function areAllPayslipsApproved(
  payrollId: string
): Promise<boolean> {
  const payrollPayslips = await getPayslipsByPayrollId(payrollId)
  if (payrollPayslips.length === 0) {
    return false
  }
  return payrollPayslips.every((payslip) => payslip.status === "approved")
}

export async function sendApprovedPayslips(
  payrollId: string
): Promise<{ count: number } | { error: string }> {
  if (!(await areAllPayslipsApproved(payrollId))) {
    return { error: "All payslips must be approved before sending bulk email." }
  }

  const payrollPayslips = await getPayslipsByPayrollId(payrollId)
  const approvedIds = payrollPayslips
    .filter((payslip) => payslip.status === "approved")
    .map((payslip) => payslip.id)

  if (approvedIds.length === 0) {
    return { count: 0 }
  }

  for (const id of approvedIds) {
    await db
      .update(payslips)
      .set({ status: "sent", updatedAt: new Date() })
      .where(eq(payslips.id, id))
  }

  return { count: approvedIds.length }
}

export async function deletePayslip(
  id: string
): Promise<{ success: true } | { error: string }> {
  const existing = await getPayslipById(id)
  if (!existing) {
    return { error: "Payslip not found." }
  }

  await db.delete(payslips).where(eq(payslips.id, id))
  return { success: true }
}
