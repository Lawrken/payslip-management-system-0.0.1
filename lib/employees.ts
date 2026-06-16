import { asc, count, desc, eq, ilike, ne, or } from "drizzle-orm"

import { db, type DatabaseClient } from "@/db"
import { employees } from "@/db/schema"
import { normalizeEmployeeId } from "@/lib/auth-helpers"
import {
  buildPaginatedResult,
  normalizePagination,
  type PaginatedResult,
  type PaginationInput,
} from "@/lib/pagination"
import type { SortDirection } from "@/lib/table-sort"
import type { Employee } from "@/lib/types"

export type EmployeeOption = Pick<Employee, "id" | "employeeId" | "name">

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function getEmployees(
  client: DatabaseClient = db
): Promise<Employee[]> {
  return client.query.employees.findMany({
    orderBy: (table, { asc }) => [asc(table.name)],
  })
}

export async function getEmployeeOptions(
  client: DatabaseClient = db
): Promise<EmployeeOption[]> {
  return client.query.employees.findMany({
    columns: {
      id: true,
      employeeId: true,
      name: true,
    },
    orderBy: (table, { asc }) => [asc(table.name)],
  })
}

export type EmployeeListSort =
  | "name"
  | "employeeId"
  | "email"
  | "basicPay"
  | "employeeStatus"
  | "positionTitle"
  | "department"
  | "program"
  | "account"
  | "divisor"

export type EmployeeListQuery = PaginationInput & {
  search?: string
  sort?: EmployeeListSort
  direction?: SortDirection
}

function getEmployeeSortColumn(sort: EmployeeListSort) {
  if (sort === "employeeId") {
    return employees.employeeId
  }
  return employees[sort]
}

export async function getPaginatedEmployees(
  query: EmployeeListQuery = {},
  client: DatabaseClient = db
): Promise<PaginatedResult<Employee>> {
  const pagination = normalizePagination(query)
  const search = query.search?.trim()
  const where = search
    ? or(
        ilike(employees.name, `%${search}%`),
        ilike(employees.employeeId, `%${search}%`),
        ilike(employees.email, `%${search}%`)
      )
    : undefined
  const sort = query.sort ?? "name"
  const direction = query.direction === "desc" ? "desc" : "asc"
  const orderBy =
    direction === "desc"
      ? desc(getEmployeeSortColumn(sort))
      : asc(getEmployeeSortColumn(sort))

  const [totalRow] = await client
    .select({ count: count() })
    .from(employees)
    .where(where)
  const items = await client.query.employees.findMany({
    where,
    orderBy: () => [orderBy],
    limit: pagination.pageSize,
    offset: pagination.offset,
  })

  return buildPaginatedResult(items, totalRow?.count ?? 0, pagination)
}

export async function getEmployeeById(
  id: string,
  client: DatabaseClient = db
): Promise<Employee | null> {
  const employee = await client.query.employees.findFirst({
    where: eq(employees.id, id),
  })
  return employee ?? null
}

export async function findEmployeeByEmployeeId(
  employeeId: string,
  client: DatabaseClient = db
): Promise<Employee | null> {
  const normalizedId = normalizeEmployeeId(employeeId)
  const employee = await client.query.employees.findFirst({
    where: eq(employees.employeeId, normalizedId),
  })
  return employee ?? null
}

export type NewEmployeeInput = Omit<Employee, "id">

export async function addEmployee(
  input: NewEmployeeInput,
  client: DatabaseClient = db
): Promise<Employee | { error: string }> {
  const employeeId = normalizeEmployeeId(input.employeeId)
  const email = normalizeEmail(input.email)

  const duplicateId = await client.query.employees.findFirst({
    where: eq(employees.employeeId, employeeId),
  })
  if (duplicateId) {
    return { error: "An employee with this Employee ID already exists." }
  }

  const duplicateEmail = await client.query.employees.findFirst({
    where: eq(employees.email, email),
  })
  if (duplicateEmail) {
    return { error: "An employee with this email already exists." }
  }

  const [employee] = await client
    .insert(employees)
    .values({
      id: crypto.randomUUID(),
      name: input.name.trim(),
      employeeId,
      email,
      employeeStatus: input.employeeStatus,
      positionTitle: input.positionTitle,
      department: input.department,
      program: input.program,
      account: input.account,
      divisor: input.divisor,
      basicPay: input.basicPay,
      tin: input.tin.trim(),
      sssNo: input.sssNo.trim(),
      phicNo: input.phicNo.trim(),
      hdmfNo: input.hdmfNo.trim(),
      updatedAt: new Date(),
    })
    .returning()

  return employee
}

export type UpdateEmployeeInput = NewEmployeeInput & { id: string }

export async function updateEmployee(
  input: UpdateEmployeeInput,
  client: DatabaseClient = db
): Promise<Employee | { error: string }> {
  const existing = await getEmployeeById(input.id, client)
  if (!existing) {
    return { error: "Employee not found." }
  }

  const employeeId = normalizeEmployeeId(input.employeeId)
  const email = normalizeEmail(input.email)

  const duplicateId = await client.query.employees.findFirst({
    where: (table, { and }) =>
      and(eq(table.employeeId, employeeId), ne(table.id, input.id)),
  })
  if (duplicateId) {
    return { error: "An employee with this Employee ID already exists." }
  }

  const duplicateEmail = await client.query.employees.findFirst({
    where: (table, { and }) =>
      and(eq(table.email, email), ne(table.id, input.id)),
  })
  if (duplicateEmail) {
    return { error: "An employee with this email already exists." }
  }

  const [updated] = await client
    .update(employees)
    .set({
      name: input.name.trim(),
      employeeId,
      email,
      employeeStatus: input.employeeStatus,
      positionTitle: input.positionTitle,
      department: input.department,
      program: input.program,
      account: input.account,
      divisor: input.divisor,
      basicPay: input.basicPay,
      tin: input.tin.trim(),
      sssNo: input.sssNo.trim(),
      phicNo: input.phicNo.trim(),
      hdmfNo: input.hdmfNo.trim(),
      updatedAt: new Date(),
    })
    .where(eq(employees.id, input.id))
    .returning()

  return updated
}

export async function deleteEmployee(
  id: string,
  client: DatabaseClient = db
): Promise<{ success: true } | { error: string }> {
  const existing = await getEmployeeById(id, client)
  if (!existing) {
    return { error: "Employee not found." }
  }

  await client.delete(employees).where(eq(employees.id, id))
  return { success: true }
}
