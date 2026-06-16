import { eq } from "drizzle-orm"

import { db, type DatabaseClient } from "@/db"
import { payrolls } from "@/db/schema"
import { resolveDtrDays, validateDtrDays } from "@/lib/dtr-days"
import {
  dateRangesOverlap,
  formatPayrollPeriodLabel,
  isValidDateRange,
} from "@/lib/payroll-dates"
import { createPayslipsForPayroll } from "@/lib/payslips"
import type { Payroll, PayrollDtrDay } from "@/lib/types"

function normalizePayroll(payroll: Payroll): Payroll {
  return {
    ...payroll,
    dtrDays: resolveDtrDays(payroll),
  }
}

export async function getPayrolls(
  client: DatabaseClient = db
): Promise<Payroll[]> {
  const rows = await client.query.payrolls.findMany({
    orderBy: (table, { desc }) => [desc(table.payrollPeriodEnd)],
  })
  return rows.map(normalizePayroll)
}

export async function getPayrollById(
  id: string,
  client: DatabaseClient = db
): Promise<Payroll | null> {
  const payroll = await client.query.payrolls.findFirst({
    where: eq(payrolls.id, id),
  })
  return payroll ? normalizePayroll(payroll) : null
}

export async function getLatestPayroll(): Promise<Payroll | null> {
  const payroll = await db.query.payrolls.findFirst({
    orderBy: (table, { desc }) => [desc(table.payrollPeriodEnd)],
  })
  return payroll ? normalizePayroll(payroll) : null
}

export type NewPayrollInput = Omit<
  Payroll,
  "id" | "payrollPeriodLabel" | "dtrDays"
> & {
  payrollPeriodLabel?: string
  dtrDays: PayrollDtrDay[]
}

export type UpdatePayrollInput = NewPayrollInput & { id: string }

function validatePayrollDates(
  input: NewPayrollInput
): { error: string } | null {
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

  const dtrDaysError = validateDtrDays(
    input.dtrCutOffStart,
    input.dtrCutOffEnd,
    input.dtrDays
  )
  if (dtrDaysError) {
    return dtrDaysError
  }

  return null
}

async function hasOverlappingPayrollPeriod(
  start: string,
  end: string,
  excludeId?: string,
  client: DatabaseClient = db
): Promise<boolean> {
  const existingPayrolls = await getPayrolls(client)
  return existingPayrolls.some(
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

function buildPayroll(id: string, input: NewPayrollInput): Payroll {
  return {
    id,
    payrollPeriodLabel:
      input.payrollPeriodLabel ??
      formatPayrollPeriodLabel(
        input.payrollPeriodStart,
        input.payrollPeriodEnd
      ),
    payrollPeriodStart: input.payrollPeriodStart,
    payrollPeriodEnd: input.payrollPeriodEnd,
    dtrCutOffStart: input.dtrCutOffStart,
    dtrCutOffEnd: input.dtrCutOffEnd,
    dtrDays: input.dtrDays,
    payoutDate: input.payoutDate,
  }
}

export async function addPayroll(
  input: NewPayrollInput,
  client: DatabaseClient = db
): Promise<Payroll | { error: string }> {
  const validationError = validatePayrollDates(input)
  if (validationError) {
    return validationError
  }

  if (
    await hasOverlappingPayrollPeriod(
      input.payrollPeriodStart,
      input.payrollPeriodEnd,
      undefined,
      client
    )
  ) {
    return { error: "This payroll period overlaps an existing payroll period." }
  }

  const payroll = buildPayroll(crypto.randomUUID(), input)
  await client.insert(payrolls).values({
    ...payroll,
    updatedAt: new Date(),
  })
  await createPayslipsForPayroll(payroll.id, client)
  return payroll
}

export async function updatePayroll(
  input: UpdatePayrollInput,
  client: DatabaseClient = db
): Promise<Payroll | { error: string }> {
  const existing = await getPayrollById(input.id, client)
  if (!existing) {
    return { error: "Payroll not found." }
  }

  const validationError = validatePayrollDates(input)
  if (validationError) {
    return validationError
  }

  if (
    await hasOverlappingPayrollPeriod(
      input.payrollPeriodStart,
      input.payrollPeriodEnd,
      input.id,
      client
    )
  ) {
    return { error: "This payroll period overlaps an existing payroll period." }
  }

  const updated = buildPayroll(input.id, input)
  await client
    .update(payrolls)
    .set({ ...updated, updatedAt: new Date() })
    .where(eq(payrolls.id, input.id))
  return updated
}

export async function deletePayroll(
  id: string,
  client: DatabaseClient = db
): Promise<{ success: true } | { error: string }> {
  const existing = await getPayrollById(id, client)
  if (!existing) {
    return { error: "Payroll not found." }
  }

  await client.delete(payrolls).where(eq(payrolls.id, id))
  return { success: true }
}
