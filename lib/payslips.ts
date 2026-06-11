import { and, eq, inArray, ne } from "drizzle-orm"

import { db, type DatabaseClient } from "@/db"
import {
  employees as employeesTable,
  payrolls as payrollsTable,
  payslipInputs,
  payslips,
} from "@/db/schema"
import { normalizeEmployeeId } from "@/lib/auth-helpers"
import { getScheduleByPayrollAndEmployee } from "@/lib/employee-schedules"
import { findEmployeeByEmployeeId, getEmployees } from "@/lib/employees"
import {
  calculatePayslipTotals,
  createEmptyPayslipInputs,
  createPayslipInputsWithBasicPay,
  derivePayslipInputsFromSchedule,
} from "@/lib/payroll-calculator"
import type {
  Employee,
  EmployeePayslip,
  Payroll,
  Payslip,
  PayslipEmailData,
  PayslipPayrollInputs,
  PayslipStatus,
} from "@/lib/types"

const VISIBLE_EMPLOYEE_PAYSLIP_STATUSES: PayslipStatus[] = ["approved", "sent"]

function buildPayslipTotals(
  inputs: PayslipPayrollInputs,
  divisor?: Employee["divisor"]
) {
  const totals = calculatePayslipTotals(inputs, divisor)
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
  const totals =
    row.payslipInput?.totals ??
    buildPayslipTotals(inputs, row.employee?.divisor)

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

async function resolveDerivedPayslipInputs({
  employee,
  payroll,
  inputs,
  client,
}: {
  employee: Employee
  payroll: Payroll
  inputs: PayslipPayrollInputs
  client: DatabaseClient
}) {
  const schedule = await getScheduleByPayrollAndEmployee(
    payroll.id,
    employee.employeeId,
    client
  )

  return derivePayslipInputsFromSchedule({
    employee,
    payroll,
    scheduleDays: schedule?.days ?? [],
    existingInputs: inputs,
  })
}

function mapPayslipEmailRow(row: {
  payslip: typeof payslips.$inferSelect
  payslipInput: typeof payslipInputs.$inferSelect | null
  employee: typeof employeesTable.$inferSelect
  payroll: typeof payrollsTable.$inferSelect
}): PayslipEmailData {
  return {
    ...mapPayslipRow(row),
    employeeEmail: row.employee.email,
    tin: row.employee.tin,
    sssNo: row.employee.sssNo,
    phicNo: row.employee.phicNo,
    hdmfNo: row.employee.hdmfNo,
    payrollPeriodLabel: row.payroll.payrollPeriodLabel,
    payrollPeriodStart: row.payroll.payrollPeriodStart,
    payrollPeriodEnd: row.payroll.payrollPeriodEnd,
    dtrCutOffStart: row.payroll.dtrCutOffStart,
    dtrCutOffEnd: row.payroll.dtrCutOffEnd,
    payoutDate: row.payroll.payoutDate,
  }
}

function mapEmployeePayslipRow(row: {
  payslip: typeof payslips.$inferSelect
  payslipInput: typeof payslipInputs.$inferSelect | null
  employee: typeof employeesTable.$inferSelect | null
  payroll: typeof payrollsTable.$inferSelect
}): EmployeePayslip {
  return {
    ...mapPayslipRow(row),
    payrollPeriodLabel: row.payroll.payrollPeriodLabel,
    payrollPeriodStart: row.payroll.payrollPeriodStart,
    payrollPeriodEnd: row.payroll.payrollPeriodEnd,
    dtrCutOffStart: row.payroll.dtrCutOffStart,
    dtrCutOffEnd: row.payroll.dtrCutOffEnd,
    payoutDate: row.payroll.payoutDate,
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
    .leftJoin(
      employeesTable,
      eq(employeesTable.employeeId, payslips.employeeId)
    )
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

export async function getPayslipById(
  id: string,
  client: DatabaseClient = db
): Promise<Payslip | null> {
  const [row] = await client
    .select({
      payslip: payslips,
      payslipInput: payslipInputs,
      employee: employeesTable,
    })
    .from(payslips)
    .leftJoin(payslipInputs, eq(payslipInputs.payslipId, payslips.id))
    .leftJoin(
      employeesTable,
      eq(employeesTable.employeeId, payslips.employeeId)
    )
    .where(eq(payslips.id, id))
    .limit(1)

  return row ? mapPayslipRow(row) : null
}

export async function getPayslipsByPayrollId(
  payrollId: string,
  client: DatabaseClient = db
): Promise<Payslip[]> {
  const rows = await client
    .select({
      payslip: payslips,
      payslipInput: payslipInputs,
      employee: employeesTable,
    })
    .from(payslips)
    .leftJoin(payslipInputs, eq(payslipInputs.payslipId, payslips.id))
    .leftJoin(
      employeesTable,
      eq(employeesTable.employeeId, payslips.employeeId)
    )
    .where(eq(payslips.payrollId, payrollId))

  return rows.map(mapPayslipRow)
}

export async function getApprovedPayslipEmailById(
  id: string,
  client: DatabaseClient = db
): Promise<PayslipEmailData | null> {
  const [row] = await client
    .select({
      payslip: payslips,
      payslipInput: payslipInputs,
      employee: employeesTable,
      payroll: payrollsTable,
    })
    .from(payslips)
    .innerJoin(payrollsTable, eq(payrollsTable.id, payslips.payrollId))
    .innerJoin(
      employeesTable,
      eq(employeesTable.employeeId, payslips.employeeId)
    )
    .leftJoin(payslipInputs, eq(payslipInputs.payslipId, payslips.id))
    .where(and(eq(payslips.id, id), eq(payslips.status, "approved")))
    .limit(1)

  return row ? mapPayslipEmailRow(row) : null
}

export async function getApprovedPayslipEmailsByPayrollId(
  payrollId: string,
  client: DatabaseClient = db
): Promise<PayslipEmailData[]> {
  const rows = await client
    .select({
      payslip: payslips,
      payslipInput: payslipInputs,
      employee: employeesTable,
      payroll: payrollsTable,
    })
    .from(payslips)
    .innerJoin(payrollsTable, eq(payrollsTable.id, payslips.payrollId))
    .innerJoin(
      employeesTable,
      eq(employeesTable.employeeId, payslips.employeeId)
    )
    .leftJoin(payslipInputs, eq(payslipInputs.payslipId, payslips.id))
    .where(
      and(eq(payslips.payrollId, payrollId), eq(payslips.status, "approved"))
    )

  return rows.map(mapPayslipEmailRow)
}

export async function getVisiblePayslipsByEmployeeId(
  employeeId: string
): Promise<EmployeePayslip[]> {
  const normalizedId = normalizeEmployeeId(employeeId)
  const rows = await db
    .select({
      payslip: payslips,
      payslipInput: payslipInputs,
      employee: employeesTable,
      payroll: payrollsTable,
    })
    .from(payslips)
    .innerJoin(payrollsTable, eq(payrollsTable.id, payslips.payrollId))
    .leftJoin(payslipInputs, eq(payslipInputs.payslipId, payslips.id))
    .leftJoin(
      employeesTable,
      eq(employeesTable.employeeId, payslips.employeeId)
    )
    .where(
      and(
        eq(payslips.employeeId, normalizedId),
        inArray(payslips.status, VISIBLE_EMPLOYEE_PAYSLIP_STATUSES)
      )
    )

  return rows.map(mapEmployeePayslipRow).sort((a, b) => {
    return b.payrollPeriodEnd.localeCompare(a.payrollPeriodEnd)
  })
}

function hasPayslipData(inputs: PayslipPayrollInputs): boolean {
  return Object.values(inputs).some(
    (value) => typeof value === "number" && value > 0
  )
}

function resolveStatusAfterSave(
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
  payrollId: string,
  client: DatabaseClient = db
): Promise<number> {
  const payroll = await client.query.payrolls.findFirst({
    where: eq(payrollsTable.id, payrollId),
  })
  if (!payroll) {
    return 0
  }

  const employees = await getEmployees(client)
  const existing = await getPayslipsByPayrollId(payrollId, client)
  const existingEmployeeIds = new Set(
    existing.map((payslip) => payslip.employeeId)
  )
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
  await client.insert(payslips).values(rows)
  await client.insert(payslipInputs).values(
    rows.map((row, index) => {
      const employee = newPayslips[index]
      const inputs = derivePayslipInputsFromSchedule({
        employee,
        payroll,
        scheduleDays: [],
        existingInputs: createPayslipInputsWithBasicPay(employee.basicPay),
      })

      return {
        payslipId: row.id,
        inputs,
        totals: buildPayslipTotals(inputs, employee.divisor),
        updatedAt: new Date(),
      }
    })
  )

  return rows.length
}

export type NewPayslipInput = {
  payrollId: string
  employeeId: string
  inputs: PayslipPayrollInputs
}

export async function addPayslip(
  input: NewPayslipInput,
  client: DatabaseClient = db
): Promise<Payslip | { error: string }> {
  const payrollId = input.payrollId.trim()
  const employeeId = normalizeEmployeeId(input.employeeId)
  const payroll = await client.query.payrolls.findFirst({
    where: eq(payrollsTable.id, payrollId),
  })
  const employee = await findEmployeeByEmployeeId(employeeId, client)

  if (!payrollId || !payroll) {
    return { error: "Payroll period is required." }
  }

  if (!employee) {
    return { error: "No employee found with that Employee ID." }
  }

  const duplicate = await client.query.payslips.findFirst({
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

  const id = crypto.randomUUID()
  const inputs = await resolveDerivedPayslipInputs({
    employee,
    payroll,
    inputs: input.inputs,
    client,
  })
  const status: PayslipStatus = hasPayslipData(inputs) ? "pending" : "draft"
  const totals = buildPayslipTotals(inputs, employee.divisor)

  await client.insert(payslips).values({
    id,
    payrollId,
    employeeId,
    status,
    updatedAt: new Date(),
  })
  await client.insert(payslipInputs).values({
    payslipId: id,
    inputs,
    totals,
    updatedAt: new Date(),
  })

  return {
    id,
    payrollId,
    employeeId,
    employeeName: employee.name,
    status,
    inputs,
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
  input: UpdatePayslipInput,
  client: DatabaseClient = db
): Promise<Payslip | { error: string }> {
  const existing = await getPayslipById(input.id, client)
  if (!existing) {
    return { error: "Payslip not found." }
  }

  const payrollId = input.payrollId.trim()
  const employeeId = normalizeEmployeeId(input.employeeId)
  const payroll = await client.query.payrolls.findFirst({
    where: eq(payrollsTable.id, payrollId),
  })
  const employee = await findEmployeeByEmployeeId(employeeId, client)

  if (!payrollId || !payroll) {
    return { error: "Payroll period is required." }
  }

  if (!employee) {
    return { error: "No employee found with that Employee ID." }
  }

  const duplicate = await client.query.payslips.findFirst({
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

  const inputs = await resolveDerivedPayslipInputs({
    employee,
    payroll,
    inputs: input.inputs,
    client,
  })
  const status = resolveStatusAfterSave(existing.status, inputs)
  const totals = buildPayslipTotals(inputs, employee.divisor)

  await client
    .update(payslips)
    .set({
      payrollId,
      employeeId,
      status,
      updatedAt: new Date(),
    })
    .where(eq(payslips.id, input.id))
  await client
    .update(payslipInputs)
    .set({
      inputs,
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
    inputs,
    totals,
  }
}

export async function refreshPayslipFromSchedule(
  payrollId: string,
  employeeId: string,
  client: DatabaseClient = db
): Promise<Payslip | { error: string }> {
  const normalizedEmployeeId = normalizeEmployeeId(employeeId)
  const payroll = await client.query.payrolls.findFirst({
    where: eq(payrollsTable.id, payrollId),
  })
  const employee = await findEmployeeByEmployeeId(normalizedEmployeeId, client)
  const existing = await client.query.payslips.findFirst({
    where: and(
      eq(payslips.payrollId, payrollId),
      eq(payslips.employeeId, normalizedEmployeeId)
    ),
  })

  if (!payroll) {
    return { error: "Payroll not found." }
  }

  if (!employee) {
    return { error: "Employee not found." }
  }

  if (!existing) {
    return { error: "Employee payslip not found for this payroll period." }
  }

  const current = await getPayslipById(existing.id, client)
  if (!current) {
    return { error: "Payslip not found." }
  }

  const inputs = await resolveDerivedPayslipInputs({
    employee,
    payroll,
    inputs: current.inputs,
    client,
  })
  const status = resolveStatusAfterSave(current.status, inputs)
  const totals = buildPayslipTotals(inputs, employee.divisor)

  await client
    .update(payslips)
    .set({ status, updatedAt: new Date() })
    .where(eq(payslips.id, current.id))
  await client
    .update(payslipInputs)
    .set({ inputs, totals, updatedAt: new Date() })
    .where(eq(payslipInputs.payslipId, current.id))

  return {
    ...current,
    status,
    inputs,
    totals,
  }
}

export async function approvePayslipByAdmin(
  id: string,
  client: DatabaseClient = db
): Promise<Payslip | { error: string }> {
  const payslip = await getPayslipById(id, client)
  if (!payslip) {
    return { error: "Payslip not found." }
  }

  if (payslip.status !== "pending") {
    return { error: "Only payslips ready for review can be marked checked." }
  }

  if (!hasPayslipData(payslip.inputs)) {
    return { error: "Payslip must have payroll data before it can be checked." }
  }

  await client
    .update(payslips)
    .set({ status: "adminApproved", updatedAt: new Date() })
    .where(eq(payslips.id, id))

  return { ...payslip, status: "adminApproved" }
}

export async function approvePayslipBySuperAdmin(
  id: string,
  client: DatabaseClient = db
): Promise<Payslip | { error: string }> {
  const payslip = await getPayslipById(id, client)
  if (!payslip) {
    return { error: "Payslip not found." }
  }

  if (payslip.status !== "adminApproved") {
    return { error: "Only checked payslips can be marked ready for email." }
  }

  await client
    .update(payslips)
    .set({ status: "approved", updatedAt: new Date() })
    .where(eq(payslips.id, id))

  return { ...payslip, status: "approved" }
}

export async function returnPayslipByAdmin(
  id: string,
  client: DatabaseClient = db
): Promise<Payslip | { error: string }> {
  const payslip = await getPayslipById(id, client)
  if (!payslip) {
    return { error: "Payslip not found." }
  }

  if (payslip.status !== "pending") {
    return { error: "Only payslips ready for review can be returned." }
  }

  if (!hasPayslipData(payslip.inputs)) {
    return {
      error: "Payslip must have payroll data before it can be returned.",
    }
  }

  await client
    .update(payslips)
    .set({ status: "returned", updatedAt: new Date() })
    .where(eq(payslips.id, id))

  return { ...payslip, status: "returned" }
}

export async function returnPayslipBySuperAdmin(
  id: string,
  client: DatabaseClient = db
): Promise<Payslip | { error: string }> {
  const payslip = await getPayslipById(id, client)
  if (!payslip) {
    return { error: "Payslip not found." }
  }

  if (payslip.status !== "adminApproved") {
    return { error: "Only checked payslips can be returned." }
  }

  await client
    .update(payslips)
    .set({ status: "returned", updatedAt: new Date() })
    .where(eq(payslips.id, id))

  return { ...payslip, status: "returned" }
}

export async function areAllPayslipsApproved(
  payrollId: string,
  client: DatabaseClient = db
): Promise<boolean> {
  const payrollPayslips = await getPayslipsByPayrollId(payrollId, client)
  if (payrollPayslips.length === 0) {
    return false
  }
  return payrollPayslips.every((payslip) => payslip.status === "approved")
}

export async function markPayslipsSentByIds(
  ids: string[],
  client: DatabaseClient = db
): Promise<{ count: number } | { error: string }> {
  if (ids.length === 0) {
    return { count: 0 }
  }

  const approvedPayslips = await client
    .select({ id: payslips.id })
    .from(payslips)
    .where(and(inArray(payslips.id, ids), eq(payslips.status, "approved")))

  if (approvedPayslips.length !== ids.length) {
    return { error: "Only payslips ready for email can be marked sent." }
  }

  await client
    .update(payslips)
    .set({ status: "sent", updatedAt: new Date() })
    .where(inArray(payslips.id, ids))

  return { count: ids.length }
}

export async function deletePayslip(
  id: string,
  client: DatabaseClient = db
): Promise<{ success: true } | { error: string }> {
  const existing = await getPayslipById(id, client)
  if (!existing) {
    return { error: "Payslip not found." }
  }

  await client.delete(payslips).where(eq(payslips.id, id))
  return { success: true }
}
