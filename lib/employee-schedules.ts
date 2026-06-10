import { and, eq } from "drizzle-orm"

import { db, type DatabaseClient } from "@/db"
import { employeeSchedules } from "@/db/schema"
import { getPayrollById } from "@/lib/payrolls"
import {
  mergeScheduleDays,
  validateScheduleDays,
} from "@/lib/schedule-days"
import type {
  EmployeeSchedule,
  EmployeeScheduleDay,
} from "@/lib/types"

function mapScheduleRow(
  row: typeof employeeSchedules.$inferSelect
): EmployeeSchedule {
  return {
    id: row.id,
    payrollId: row.payrollId,
    employeeId: row.employeeId,
    days: row.days,
  }
}

export async function getAllEmployeeSchedules(
  client: DatabaseClient = db
): Promise<EmployeeSchedule[]> {
  const rows = await client.query.employeeSchedules.findMany()
  return rows.map(mapScheduleRow)
}

export async function getScheduleByPayrollAndEmployee(
  payrollId: string,
  employeeId: string,
  client: DatabaseClient = db
): Promise<EmployeeSchedule | null> {
  const row = await client.query.employeeSchedules.findFirst({
    where: and(
      eq(employeeSchedules.payrollId, payrollId),
      eq(employeeSchedules.employeeId, employeeId)
    ),
  })
  return row ? mapScheduleRow(row) : null
}

export type UpsertEmployeeScheduleInput = {
  payrollId: string
  employeeId: string
  days: EmployeeScheduleDay[]
}

export async function upsertEmployeeSchedule(
  input: UpsertEmployeeScheduleInput,
  client: DatabaseClient = db
): Promise<EmployeeSchedule | { error: string }> {
  const payroll = await getPayrollById(input.payrollId, client)
  if (!payroll) {
    return { error: "Payroll not found." }
  }

  const validationError = validateScheduleDays(payroll, input.days)
  if (validationError) {
    return validationError
  }

  const normalizedDays = mergeScheduleDays(payroll, input.days)
  const existing = await getScheduleByPayrollAndEmployee(
    input.payrollId,
    input.employeeId,
    client
  )

  if (existing) {
    await client
      .update(employeeSchedules)
      .set({ days: normalizedDays, updatedAt: new Date() })
      .where(eq(employeeSchedules.id, existing.id))

    return {
      id: existing.id,
      payrollId: input.payrollId,
      employeeId: input.employeeId,
      days: normalizedDays,
    }
  }

  const id = crypto.randomUUID()
  await client.insert(employeeSchedules).values({
    id,
    payrollId: input.payrollId,
    employeeId: input.employeeId,
    days: normalizedDays,
    updatedAt: new Date(),
  })

  return {
    id,
    payrollId: input.payrollId,
    employeeId: input.employeeId,
    days: normalizedDays,
  }
}
