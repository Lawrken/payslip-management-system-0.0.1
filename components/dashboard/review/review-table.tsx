"use client"

import { ReviewRowActions } from "@/components/dashboard/review/review-row-actions"
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
  formatPayslipStatus,
  isDraftStatus,
  isReturnedStatus,
} from "@/lib/payslip-status"
import type { PayslipListSort } from "@/lib/payslips"
import type { SortDirection } from "@/lib/table-sort"
import { cn } from "@/lib/utils"
import type { Payslip, PayslipStatus } from "@/lib/types"

type ReviewTableProps = {
  payslips: Payslip[]
  status: string
  allowedStatuses: PayslipStatus[]
  sortKey: PayslipListSort
  sortDir: SortDirection
  onSort: (key: PayslipListSort) => void
  onStatusFilterChange: (status: string) => void
  onReview: (payslip: Payslip) => void
  emptyMessage?: string
}

export function ReviewTable({
  payslips,
  status,
  allowedStatuses,
  sortKey,
  sortDir,
  onSort,
  onStatusFilterChange,
  onReview,
  emptyMessage = "No payslips for this payroll period yet.",
}: ReviewTableProps) {
  const statusOptions = allowedStatuses.map((status) => ({
    value: status,
    label: formatPayslipStatus(status),
  }))

  if (payslips.length === 0) {
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
            active={sortKey === "employeeName"}
            direction={sortDir}
            onSort={() => onSort("employeeName")}
          />
          <SortableTableHead
            label="Employee ID"
            active={sortKey === "employeeId"}
            direction={sortDir}
            onSort={() => onSort("employeeId")}
          />
          <FilterTableHead
            label="Status"
            value={status}
            onChange={onStatusFilterChange}
            options={statusOptions}
            searchPlaceholder="Search statuses…"
            emptyMessage="No status found."
          />
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payslips.map((payslip) => (
          <TableRow key={payslip.id}>
            <TableCell className="font-medium">{payslip.employeeName}</TableCell>
            <TableCell>{payslip.employeeId}</TableCell>
            <TableCell
              className={cn(
                isDraftStatus(payslip.status) && "text-muted-foreground",
                isReturnedStatus(payslip.status) && "font-medium text-destructive"
              )}
            >
              {formatPayslipStatus(payslip.status)}
            </TableCell>
            <TableCell>
              <ReviewRowActions payslip={payslip} onReview={onReview} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
