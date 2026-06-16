import {
  and,
  asc,
  eq,
} from "drizzle-orm"

import { db, type DatabaseClient } from "@/db"
import {
  employeeSchedules,
  employees as employeesTable,
  payslips,
} from "@/db/schema"
import { normalizeEmployeeId } from "@/lib/auth-helpers"
import {
  buildPaginatedResult,
  normalizePagination,
  type PaginatedResult,
  type PaginationInput,
} from "@/lib/pagination"
import { getPayrollById } from "@/lib/payrolls"
import {
  isScheduleComplete,
  mergeScheduleDays,
  validateScheduleDays,
} from "@/lib/schedule-days"
import type { SortDirection } from "@/lib/table-sort"
import type {
  EmployeeSchedule,
  EmployeeScheduleDay,
  EmployeeScheduleRow,
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

export async function getEmployeeSchedulesByPayrollId(
  payrollId: string,
  client: DatabaseClient = db
): Promise<EmployeeSchedule[]> {
  const rows = await client.query.employeeSchedules.findMany({
    where: eq(employeeSchedules.payrollId, payrollId),
  })
  return rows.map(mapScheduleRow)
}

export type ScheduleStatusFilter = EmployeeScheduleRow["status"]
export type ScheduleRowSort = "employeeName" | "employeeNumber" | "status"

export type ScheduleRowListQuery = PaginationInput & {
  payrollId: string
  employeeId?: string
  status?: ScheduleStatusFilter
  sort?: ScheduleRowSort
  direction?: SortDirection
}

function compareScheduleRows(
  a: EmployeeScheduleRow,
  b: EmployeeScheduleRow,
  sort: ScheduleRowSort,
  direction: SortDirection
) {
  const result =
    sort === "employeeName"
      ? a.employeeName.localeCompare(b.employeeName)
      : sort === "employeeNumber"
        ? a.employeeNumber.localeCompare(b.employeeNumber)
        : a.status.localeCompare(b.status)
  const directedResult = direction === "desc" ? -result : result
  return directedResult || a.employeeNumber.localeCompare(b.employeeNumber)
}

export async function getPaginatedScheduleRows(
  query: ScheduleRowListQuery,
  client: DatabaseClient = db
): Promise<PaginatedResult<EmployeeScheduleRow>> {
  const payroll = await getPayrollById(query.payrollId, client)
  const pagination = normalizePagination(query)
  const conditions = [eq(payslips.payrollId, query.payrollId)]
  if (query.employeeId) {
    conditions.push(
      eq(payslips.employeeId, normalizeEmployeeId(query.employeeId))
    )
  }
  const where = and(...conditions)
  const sort = query.sort ?? "employeeName"
  const direction = query.direction === "desc" ? "desc" : "asc"

  const rows = await client
    .select({
      employeeId: payslips.employeeId,
      employeeName: employeesTable.name,
      schedule: employeeSchedules,
    })
    .from(payslips)
    .leftJoin(
      employeesTable,
      eq(employeesTable.employeeId, payslips.employeeId)
    )
    .leftJoin(
      employeeSchedules,
      and(
        eq(employeeSchedules.payrollId, payslips.payrollId),
        eq(employeeSchedules.employeeId, payslips.employeeId)
      )
    )
    .where(where)
    .orderBy(asc(payslips.employeeId))

  const items = rows.map((row): EmployeeScheduleRow => {
    const schedule = row.schedule ? mapScheduleRow(row.schedule) : null
    const days =
      payroll && schedule
        ? mergeScheduleDays(payroll, schedule.days)
        : []

    return {
      employeeId: row.employeeId,
      employeeName: row.employeeName ?? row.employeeId,
      employeeNumber: row.employeeId,
      status:
        payroll && schedule && isScheduleComplete(payroll, days)
          ? "modified"
          : "notModified",
      schedule,
    }
  })
  const filteredItems = query.status
    ? items.filter((item) => item.status === query.status)
    : items
  const sortedItems = [...filteredItems].sort((a, b) =>
    compareScheduleRows(a, b, sort, direction)
  )
  const paginatedItems = sortedItems.slice(
    pagination.offset,
    pagination.offset + pagination.pageSize
  )

  return buildPaginatedResult(paginatedItems, filteredItems.length, pagination)
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
