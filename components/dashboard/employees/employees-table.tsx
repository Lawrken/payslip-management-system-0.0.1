"use client"

import * as React from "react"

import { EmployeeRowActions } from "@/components/dashboard/employees/employee-row-actions"
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
import { applyDirection, compareStrings } from "@/lib/table-sort"
import type { SortDirection } from "@/lib/table-sort"
import type { Employee } from "@/lib/types"

type SortKey =
  | "name"
  | "employeeId"
  | "email"
  | "tin"
  | "sssNo"
  | "phicNo"
  | "hdmfNo"

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
  const result = compareStrings(a[key], b[key])
  return applyDirection(result, dir)
}

export function EmployeesTable({
  employees,
  emptyMessage = "No employees yet.",
}: EmployeesTableProps) {
  const { sortKey, sortDir, handleSort, sortedItems } = useTableSort<
    Employee,
    SortKey
  >({
    items: employees,
    defaultKey: "name",
    defaultDir: "asc",
    compare: compareEmployees,
  })

  if (employees.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{emptyMessage}</p>
    )
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
        {sortedItems.map((employee) => (
          <TableRow key={employee.id}>
            <TableCell className="font-medium">{employee.name}</TableCell>
            <TableCell>{employee.employeeId}</TableCell>
            <TableCell>{employee.email}</TableCell>
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
