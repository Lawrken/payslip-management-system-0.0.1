"use client"

import { EmployeeRowActions } from "@/components/dashboard/employees/employee-row-actions"
import { FilterTableHead } from "@/components/dashboard/shared/table-column-filter"
import { SortableTableHead } from "@/components/dashboard/shared/table-sort"
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
import type { EmployeeListSort } from "@/lib/employees"
import type { SortDirection } from "@/lib/table-sort"
import type { Employee } from "@/lib/types"

export type EmployeeColumnFilters = {
  employeeStatus: string
  positionTitle: string
  department: string
  program: string
  account: string
  divisor: string
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
  filters: EmployeeColumnFilters
  sortKey: EmployeeListSort
  sortDir: SortDirection
  onSort: (key: EmployeeListSort) => void
  onFilterChange: (key: keyof EmployeeColumnFilters, value: string) => void
  emptyMessage?: string
}

function formatMoney(value: number) {
  return value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function EmployeesTable({
  employees,
  filters,
  sortKey,
  sortDir,
  onSort,
  onFilterChange,
  emptyMessage = "No employees yet.",
}: EmployeesTableProps) {
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
            onSort={() => onSort("name")}
          />
          <SortableTableHead
            label="Employee ID"
            active={sortKey === "employeeId"}
            direction={sortDir}
            onSort={() => onSort("employeeId")}
          />
          <SortableTableHead
            label="Email"
            active={sortKey === "email"}
            direction={sortDir}
            onSort={() => onSort("email")}
          />
          <FilterTableHead
            label="Employee Status"
            value={filters.employeeStatus}
            onChange={(value) => onFilterChange("employeeStatus", value)}
            options={statusOptions}
            searchPlaceholder="Search statuses…"
            emptyMessage="No status found."
          />
          <FilterTableHead
            label="Position Title"
            value={filters.positionTitle}
            onChange={(value) => onFilterChange("positionTitle", value)}
            options={positionOptions}
            searchPlaceholder="Search positions…"
            emptyMessage="No position found."
          />
          <FilterTableHead
            label="Department"
            value={filters.department}
            onChange={(value) => onFilterChange("department", value)}
            options={departmentOptions}
            searchPlaceholder="Search departments…"
            emptyMessage="No department found."
          />
          <FilterTableHead
            label="Program"
            value={filters.program}
            onChange={(value) => onFilterChange("program", value)}
            options={programOptions}
            searchPlaceholder="Search programs…"
            emptyMessage="No program found."
          />
          <FilterTableHead
            label="Account"
            value={filters.account}
            onChange={(value) => onFilterChange("account", value)}
            options={accountOptions}
            searchPlaceholder="Search accounts…"
            emptyMessage="No account found."
          />
          <FilterTableHead
            label="Divisor"
            value={filters.divisor}
            onChange={(value) => onFilterChange("divisor", value)}
            options={divisorOptions}
            searchPlaceholder="Search divisors…"
            emptyMessage="No divisor found."
          />
          <SortableTableHead
            label="Basic Pay"
            active={sortKey === "basicPay"}
            direction={sortDir}
            onSort={() => onSort("basicPay")}
          />
          <SortableTableHead
            label="TIN"
            active={sortKey === "tin"}
            direction={sortDir}
            onSort={() => onSort("tin")}
          />
          <SortableTableHead
            label="SSS NO."
            active={sortKey === "sssNo"}
            direction={sortDir}
            onSort={() => onSort("sssNo")}
          />
          <SortableTableHead
            label="PHIC NO."
            active={sortKey === "phicNo"}
            direction={sortDir}
            onSort={() => onSort("phicNo")}
          />
          <SortableTableHead
            label="HDMF NO."
            active={sortKey === "hdmfNo"}
            direction={sortDir}
            onSort={() => onSort("hdmfNo")}
          />
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((employee) => (
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
          ))}
      </TableBody>
    </Table>
  )
}
