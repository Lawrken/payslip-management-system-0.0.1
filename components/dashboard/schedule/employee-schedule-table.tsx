"use client"

import { FilterTableHead } from "@/components/dashboard/shared/table-column-filter"
import { SortableTableHead } from "@/components/dashboard/shared/table-sort"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ScheduleRowSort } from "@/lib/employee-schedules"
import type { SortDirection } from "@/lib/table-sort"
import { cn } from "@/lib/utils"
import type { EmployeeScheduleRow } from "@/lib/types"

type EmployeeScheduleTableProps = {
  rows: EmployeeScheduleRow[]
  status: string
  sortKey: ScheduleRowSort
  sortDir: SortDirection
  onSort: (key: ScheduleRowSort) => void
  onStatusFilterChange: (status: string) => void
  onEdit: (row: EmployeeScheduleRow) => void
  emptyMessage?: string
}

function formatScheduleStatus(status: EmployeeScheduleRow["status"]) {
  return status === "modified" ? "Modified" : "Not Modified"
}

const scheduleStatusOptions = [
  { value: "modified", label: "Modified" },
  { value: "notModified", label: "Not Modified" },
]

export function EmployeeScheduleTable({
  rows,
  status,
  sortKey,
  sortDir,
  onSort,
  onStatusFilterChange,
  onEdit,
  emptyMessage = "No employees yet.",
}: EmployeeScheduleTableProps) {
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
            onSort={() => onSort("employeeName")}
          />
          <SortableTableHead
            label="Employee ID"
            active={sortKey === "employeeNumber"}
            direction={sortDir}
            onSort={() => onSort("employeeNumber")}
          />
          <FilterTableHead
            label="Status"
            value={status}
            onChange={onStatusFilterChange}
            options={scheduleStatusOptions}
            searchPlaceholder="Search statuses…"
            emptyMessage="No status found."
          />
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
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
