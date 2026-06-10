"use client"

import * as React from "react"

import {
  SortableTableHead,
  useTableSort,
} from "@/components/dashboard/shared/table-sort"
import { Button } from "@/components/ui/button"
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
import { cn } from "@/lib/utils"
import type { EmployeeScheduleRow } from "@/lib/types"

type SortKey = "employeeName" | "employeeNumber" | "status"

type EmployeeScheduleTableProps = {
  rows: EmployeeScheduleRow[]
  onEdit: (row: EmployeeScheduleRow) => void
  emptyMessage?: string
}

function compareScheduleRows(
  a: EmployeeScheduleRow,
  b: EmployeeScheduleRow,
  key: SortKey,
  dir: SortDirection
) {
  if (key === "status") {
    const result = compareStrings(a.status, b.status)
    return applyDirection(result, dir)
  }

  const result =
    key === "employeeName"
      ? compareStrings(a.employeeName, b.employeeName)
      : compareStrings(a.employeeNumber, b.employeeNumber)
  return applyDirection(result, dir)
}

function formatScheduleStatus(status: EmployeeScheduleRow["status"]) {
  return status === "modified" ? "Modified" : "Not Modified"
}

export function EmployeeScheduleTable({
  rows,
  onEdit,
  emptyMessage = "No employees yet.",
}: EmployeeScheduleTableProps) {
  const { sortKey, sortDir, handleSort, sortedItems } = useTableSort<
    EmployeeScheduleRow,
    SortKey
  >({
    items: rows,
    defaultKey: "employeeName",
    defaultDir: "asc",
    compare: compareScheduleRows,
  })

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableTableHead
            label="Employee Name"
            active={sortKey === "employeeName"}
            direction={sortDir}
            onSort={() => handleSort("employeeName")}
          />
          <SortableTableHead
            label="Employee ID"
            active={sortKey === "employeeNumber"}
            direction={sortDir}
            onSort={() => handleSort("employeeNumber")}
          />
          <SortableTableHead
            label="Status"
            active={sortKey === "status"}
            direction={sortDir}
            onSort={() => handleSort("status")}
          />
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedItems.map((row) => (
          <TableRow key={row.employeeId}>
            <TableCell className="font-medium">{row.employeeName}</TableCell>
            <TableCell>{row.employeeNumber}</TableCell>
            <TableCell
              className={cn(
                row.status === "notModified" && "text-muted-foreground",
                row.status === "modified" && "font-medium"
              )}
            >
              {formatScheduleStatus(row.status)}
            </TableCell>
            <TableCell className="text-right">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEdit(row)}
              >
                Edit Schedule
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
