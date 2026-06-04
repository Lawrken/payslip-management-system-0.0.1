import { eq } from "drizzle-orm"

import { db } from "@/db"
import { payrolls } from "@/db/schema"
import {
  dateRangesOverlap,
  formatPayrollPeriodLabel,
  isValidDateRange,
} from "@/lib/payroll-dates"
import { createPayslipsForPayroll } from "@/lib/payslips"
import type { Payroll } from "@/lib/types"

export async function getPayrolls(): Promise<Payroll[]> {
  return db.query.payrolls.findMany({
    orderBy: (table, { desc }) => [desc(table.payrollPeriodEnd)],
  })
}

export async function getPayrollById(id: string): Promise<Payroll | null> {
  const payroll = await db.query.payrolls.findFirst({
    where: eq(payrolls.id, id),
  })
  return payroll ?? null
}

export async function getLatestPayroll(): Promise<Payroll | null> {
  const [payroll] = await getPayrolls()
  return payroll ?? null
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

async function hasOverlappingPayrollPeriod(
  start: string,
  end: string,
  excludeId?: string
): Promise<boolean> {
  const existingPayrolls = await getPayrolls()
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
      formatPayrollPeriodLabel(input.payrollPeriodStart, input.payrollPeriodEnd),
    payrollPeriodStart: input.payrollPeriodStart,
    payrollPeriodEnd: input.payrollPeriodEnd,
    dtrCutOffStart: input.dtrCutOffStart,
    dtrCutOffEnd: input.dtrCutOffEnd,
    payoutDate: input.payoutDate,
  }
}

export async function addPayroll(
  input: NewPayrollInput
): Promise<Payroll | { error: string }> {
  const validationError = validatePayrollDates(input)
  if (validationError) {
    return validationError
  }

  if (
    await hasOverlappingPayrollPeriod(
      input.payrollPeriodStart,
      input.payrollPeriodEnd
    )
  ) {
    return { error: "This payroll period overlaps an existing payroll period." }
  }

  const payroll = buildPayroll(crypto.randomUUID(), input)
  await db.insert(payrolls).values({
    ...payroll,
    updatedAt: new Date(),
  })
  await createPayslipsForPayroll(payroll.id)
  return payroll
}

export async function updatePayroll(
  input: UpdatePayrollInput
): Promise<Payroll | { error: string }> {
  const existing = await getPayrollById(input.id)
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
      input.id
    )
  ) {
    return { error: "This payroll period overlaps an existing payroll period." }
  }

  const updated = buildPayroll(input.id, input)
  await db
    .update(payrolls)
    .set({ ...updated, updatedAt: new Date() })
    .where(eq(payrolls.id, input.id))
  return updated
}

export async function deletePayroll(
  id: string
): Promise<{ success: true } | { error: string }> {
  const existing = await getPayrollById(id)
  if (!existing) {
    return { error: "Payroll not found." }
  }

  await db.delete(payrolls).where(eq(payrolls.id, id))
  return { success: true }
}
