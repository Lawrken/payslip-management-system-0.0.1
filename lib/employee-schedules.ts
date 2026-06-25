import "server-only"

import {
  and,
  asc,
  count,
  desc,
  eq,
  isNotNull,
  isNull,
  or,
  sql,
  type SQL,
} from "drizzle-orm"

import { db, withDbRetry, type DatabaseClient } from "@/db"
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

const scheduleModifiedCondition = and(
  isNotNull(employeeSchedules.id),
  eq(employeeSchedules.isComplete, true)
)

const scheduleNotModifiedCondition = or(
  isNull(employeeSchedules.id),
  eq(employeeSchedules.isComplete, false)
)

const scheduleStatusOrder = sql<number>`CASE WHEN ${employeeSchedules.id} IS NOT NULL AND ${employeeSchedules.isComplete} THEN 1 ELSE 0 END`

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

function getScheduleSortColumn(sort: ScheduleRowSort) {
  if (sort === "employeeName") {
    return employeesTable.name
  }
  if (sort === "employeeNumber") {
    return payslips.employeeId
  }
  return scheduleStatusOrder
}

function buildScheduleRowWhere(query: ScheduleRowListQuery) {
  const conditions: SQL[] = [eq(payslips.payrollId, query.payrollId)]

  if (query.employeeId) {
    conditions.push(
      eq(payslips.employeeId, normalizeEmployeeId(query.employeeId))
    )
  }

  if (query.status === "modified") {
    conditions.push(scheduleModifiedCondition!)
  } else if (query.status === "notModified") {
    conditions.push(scheduleNotModifiedCondition!)
  }

  return and(...conditions)
}

function mapScheduleListRow(row: {
  employeeId: string
  employeeName: string | null
  scheduleIsComplete: boolean | null
}): EmployeeScheduleRow {
  const isModified = row.scheduleIsComplete === true

  return {
    employeeId: row.employeeId,
    employeeName: row.employeeName ?? row.employeeId,
    employeeNumber: row.employeeId,
    status: isModified ? "modified" : "notModified",
    schedule: null,
  }
}

export async function getPaginatedScheduleRows(
  query: ScheduleRowListQuery,
  client: DatabaseClient = db
): Promise<PaginatedResult<EmployeeScheduleRow>> {
  return withDbRetry(async () => {
    const pagination = normalizePagination(query)
    const where = buildScheduleRowWhere(query)
    const sort = query.sort ?? "employeeName"
    const direction = query.direction === "desc" ? "desc" : "asc"
    const orderBy =
      direction === "desc"
        ? desc(getScheduleSortColumn(sort))
        : asc(getScheduleSortColumn(sort))

    const [totalRow] = await client
      .select({ count: count() })
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

    const rows = await client
      .select({
        employeeId: payslips.employeeId,
        employeeName: employeesTable.name,
        scheduleIsComplete: employeeSchedules.isComplete,
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
      .orderBy(orderBy, asc(payslips.employeeId))
      .limit(pagination.pageSize)
      .offset(pagination.offset)

    return buildPaginatedResult(
      rows.map(mapScheduleListRow),
      totalRow?.count ?? 0,
      pagination
    )
  })
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

export async function backfillScheduleCompleteFlags(
  client: DatabaseClient = db
): Promise<number> {
  const rows = await client.query.employeeSchedules.findMany()
  let updated = 0

  for (const row of rows) {
    const payroll = await getPayrollById(row.payrollId, client)
    if (!payroll) {
      continue
    }

    const normalizedDays = mergeScheduleDays(payroll, row.days)
    const isComplete = isScheduleComplete(payroll, normalizedDays)
    if (isComplete !== row.isComplete) {
      await client
        .update(employeeSchedules)
        .set({ isComplete, updatedAt: new Date() })
        .where(eq(employeeSchedules.id, row.id))
      updated += 1
    }
  }

  return updated
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
  const isComplete = isScheduleComplete(payroll, normalizedDays)
  const existing = await getScheduleByPayrollAndEmployee(
    input.payrollId,
    input.employeeId,
    client
  )

  if (existing) {
    await client
      .update(employeeSchedules)
      .set({
        days: normalizedDays,
        isComplete,
        updatedAt: new Date(),
      })
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
    isComplete,
    updatedAt: new Date(),
  })

  return {
    id,
    payrollId: input.payrollId,
    employeeId: input.employeeId,
    days: normalizedDays,
  }
}
