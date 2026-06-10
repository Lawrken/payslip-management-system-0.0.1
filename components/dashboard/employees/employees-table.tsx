"use client"

import * as React from "react"

import { EmployeeRowActions } from "@/components/dashboard/employees/employee-row-actions"
import { FilterTableHead } from "@/components/dashboard/shared/table-column-filter"
import {
  SortableTableHead,
  useTableSort,
} from "@/components/dashboard/shared/table-sort"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ACCOUNTS,
  DEPARTMENTS,
  EMPLOYEE_DIVISORS,
  EMPLOYEE_STATUSES,
  POSITION_TITLES,
  PROGRAMS,
} from "@/lib/employee-options"
import { applyDirection, compareStrings } from "@/lib/table-sort"
import type { SortDirection } from "@/lib/table-sort"
import type { Employee } from "@/lib/types"

type SortKey =
  | "name"
  | "employeeId"
  | "email"
  | "basicPay"
  | "tin"
  | "sssNo"
  | "phicNo"
  | "hdmfNo"

type EmployeeColumnFilters = {
  employeeStatus: string
  positionTitle: string
  department: string
  program: string
  account: string
  divisor: string
}

const emptyFilters: EmployeeColumnFilters = {
  employeeStatus: "",
  positionTitle: "",
  department: "",
  program: "",
  account: "",
  divisor: "",
}

function toOptions(values: readonly string[]) {
  return values.map((value) => ({ value, label: value }))
}

const statusOptions = toOptions(EMPLOYEE_STATUSES)
const positionOptions = toOptions(POSITION_TITLES)
const departmentOptions = toOptions(DEPARTMENTS)
const programOptions = toOptions(PROGRAMS)
const accountOptions = toOptions(ACCOUNTS)
const divisorOptions = EMPLOYEE_DIVISORS.map((value) => ({
  value: String(value),
  label: String(value),
}))

type EmployeesTableProps = {
  employees: Employee[]
  emptyMessage?: string
}

function compareEmployees(
  a: Employee,
  b: Employee,
  key: SortKey,
  dir: SortDirection
) {
  const result =
    key === "basicPay"
      ? a[key] - b[key]
      : compareStrings(a[key], b[key])
  return applyDirection(result, dir)
}

function formatMoney(value: number) {
  return value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function applyEmployeeFilters(
  employees: Employee[],
  filters: EmployeeColumnFilters
) {
  return employees.filter(
    (employee) =>
      (!filters.employeeStatus ||
        employee.employeeStatus === filters.employeeStatus) &&
      (!filters.positionTitle ||
        employee.positionTitle === filters.positionTitle) &&
      (!filters.department || employee.department === filters.department) &&
      (!filters.program || employee.program === filters.program) &&
      (!filters.account || employee.account === filters.account) &&
      (!filters.divisor || String(employee.divisor) === filters.divisor)
  )
}

export function EmployeesTable({
  employees,
  emptyMessage = "No employees yet.",
}: EmployeesTableProps) {
  const [filters, setFilters] =
    React.useState<EmployeeColumnFilters>(emptyFilters)

  const filteredItems = React.useMemo(
    () => applyEmployeeFilters(employees, filters),
    [employees, filters]
  )

  const { sortKey, sortDir, handleSort, sortedItems } = useTableSort<
    Employee,
    SortKey
  >({
    items: filteredItems,
    defaultKey: "name",
    defaultDir: "asc",
    compare: compareEmployees,
  })

  function updateFilter<K extends keyof EmployeeColumnFilters>(
    key: K,
    value: string
  ) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  if (employees.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableTableHead
            label="Employee Name"
            active={sortKey === "name"}
            direction={sortDir}
            onSort={() => handleSort("name")}
          />
          <SortableTableHead
            label="Employee ID"
            active={sortKey === "employeeId"}
            direction={sortDir}
            onSort={() => handleSort("employeeId")}
          />
          <SortableTableHead
            label="Email"
            active={sortKey === "email"}
            direction={sortDir}
            onSort={() => handleSort("email")}
          />
          <FilterTableHead
            label="Employee Status"
            value={filters.employeeStatus}
            onChange={(value) => updateFilter("employeeStatus", value)}
            options={statusOptions}
            searchPlaceholder="Search statuses…"
            emptyMessage="No status found."
          />
          <FilterTableHead
            label="Position Title"
            value={filters.positionTitle}
            onChange={(value) => updateFilter("positionTitle", value)}
            options={positionOptions}
            searchPlaceholder="Search positions…"
            emptyMessage="No position found."
          />
          <FilterTableHead
            label="Department"
            value={filters.department}
            onChange={(value) => updateFilter("department", value)}
            options={departmentOptions}
            searchPlaceholder="Search departments…"
            emptyMessage="No department found."
          />
          <FilterTableHead
            label="Program"
            value={filters.program}
            onChange={(value) => updateFilter("program", value)}
            options={programOptions}
            searchPlaceholder="Search programs…"
            emptyMessage="No program found."
          />
          <FilterTableHead
            label="Account"
            value={filters.account}
            onChange={(value) => updateFilter("account", value)}
            options={accountOptions}
            searchPlaceholder="Search accounts…"
            emptyMessage="No account found."
          />
          <FilterTableHead
            label="Divisor"
            value={filters.divisor}
            onChange={(value) => updateFilter("divisor", value)}
            options={divisorOptions}
            searchPlaceholder="Search divisors…"
            emptyMessage="No divisor found."
          />
          <SortableTableHead
            label="Basic Pay"
            active={sortKey === "basicPay"}
            direction={sortDir}
            onSort={() => handleSort("basicPay")}
          />
          <SortableTableHead
            label="TIN"
            active={sortKey === "tin"}
            direction={sortDir}
            onSort={() => handleSort("tin")}
          />
          <SortableTableHead
            label="SSS NO."
            active={sortKey === "sssNo"}
            direction={sortDir}
            onSort={() => handleSort("sssNo")}
          />
          <SortableTableHead
            label="PHIC NO."
            active={sortKey === "phicNo"}
            direction={sortDir}
            onSort={() => handleSort("phicNo")}
          />
          <SortableTableHead
            label="HDMF NO."
            active={sortKey === "hdmfNo"}
            direction={sortDir}
            onSort={() => handleSort("hdmfNo")}
          />
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredItems.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={15}
              className="py-8 text-center text-muted-foreground"
            >
              No employees match the selected filters.
            </TableCell>
          </TableRow>
        ) : (
          sortedItems.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell className="font-medium">{employee.name}</TableCell>
              <TableCell>{employee.employeeId}</TableCell>
              <TableCell>{employee.email}</TableCell>
              <TableCell>{employee.employeeStatus}</TableCell>
              <TableCell>{employee.positionTitle}</TableCell>
              <TableCell>{employee.department}</TableCell>
              <TableCell>{employee.program}</TableCell>
              <TableCell>{employee.account}</TableCell>
              <TableCell>{employee.divisor}</TableCell>
              <TableCell className="text-right">
                {formatMoney(employee.basicPay)}
              </TableCell>
              <TableCell>{employee.tin}</TableCell>
              <TableCell>{employee.sssNo}</TableCell>
              <TableCell>{employee.phicNo}</TableCell>
              <TableCell>{employee.hdmfNo}</TableCell>
              <TableCell>
                <EmployeeRowActions employee={employee} />
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
