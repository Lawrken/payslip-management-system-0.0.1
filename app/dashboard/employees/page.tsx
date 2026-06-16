import { redirect } from "next/navigation"

import { EmployeesPageContent } from "@/components/dashboard/employees/employees-page-content"
import { requireDashboardSession } from "@/lib/authorization"
import {
  getEmployeeOptions,
  getPaginatedEmployees,
  type EmployeeListSort,
} from "@/lib/employees"
import {
  ACCOUNTS,
  DEPARTMENTS,
  EMPLOYEE_STATUSES,
  isEmployeeDivisor,
  isEmployeeOption,
  POSITION_TITLES,
  PROGRAMS,
} from "@/lib/employee-options"
import type {
  Account,
  Department,
  EmployeeStatus,
  PositionTitle,
  Program,
} from "@/lib/employee-options"
import type { SortDirection } from "@/lib/table-sort"

export const dynamic = "force-dynamic"

type EmployeesPageProps = {
  searchParams: Promise<{
    search?: string
    page?: string
    pageSize?: string
    employeeStatus?: string
    positionTitle?: string
    department?: string
    program?: string
    account?: string
    divisor?: string
    sort?: string
    direction?: string
  }>
}

const employeeSorts: EmployeeListSort[] = [
  "name",
  "employeeId",
  "email",
  "employeeStatus",
  "positionTitle",
  "department",
  "program",
  "account",
  "divisor",
  "basicPay",
  "tin",
  "sssNo",
  "phicNo",
  "hdmfNo",
]

function normalizeSort(value: string | undefined): EmployeeListSort {
  return employeeSorts.includes(value as EmployeeListSort)
    ? (value as EmployeeListSort)
    : "name"
}

function normalizeDirection(value: string | undefined): SortDirection {
  return value === "desc" ? "desc" : "asc"
}

function normalizeDivisor(value: string | undefined) {
  if (!value) {
    return undefined
  }
  const parsed = Number.parseInt(value, 10)
  return isEmployeeDivisor(parsed) ? parsed : undefined
}

export default async function EmployeesPage({
  searchParams,
}: EmployeesPageProps) {
  const session = await requireDashboardSession()
  if ("error" in session) {
    redirect("/login")
  }

  const params = await searchParams
  const sort = normalizeSort(params.sort)
  const direction = normalizeDirection(params.direction)
  const employeeStatus = isEmployeeOption(params.employeeStatus ?? "", EMPLOYEE_STATUSES)
    ? (params.employeeStatus as EmployeeStatus)
    : undefined
  const positionTitle = isEmployeeOption(params.positionTitle ?? "", POSITION_TITLES)
    ? (params.positionTitle as PositionTitle)
    : undefined
  const department = isEmployeeOption(params.department ?? "", DEPARTMENTS)
    ? (params.department as Department)
    : undefined
  const program = isEmployeeOption(params.program ?? "", PROGRAMS)
    ? (params.program as Program)
    : undefined
  const account = isEmployeeOption(params.account ?? "", ACCOUNTS)
    ? (params.account as Account)
    : undefined
  const divisor = normalizeDivisor(params.divisor)
  const [employees, employeeOptions] = await Promise.all([
    getPaginatedEmployees({
      search: params.search,
      page: params.page,
      pageSize: params.pageSize,
      employeeStatus,
      positionTitle,
      department,
      program,
      account,
      divisor,
      sort,
      direction,
    }),
    getEmployeeOptions(),
  ])

  return (
    <EmployeesPageContent
      employees={employees}
      employeeOptions={employeeOptions}
      search={params.search ?? ""}
      filters={{
        employeeStatus: employeeStatus ?? "",
        positionTitle: positionTitle ?? "",
        department: department ?? "",
        program: program ?? "",
        account: account ?? "",
        divisor: divisor ? String(divisor) : "",
      }}
      sortKey={sort}
      sortDir={direction}
    />
  )
}
