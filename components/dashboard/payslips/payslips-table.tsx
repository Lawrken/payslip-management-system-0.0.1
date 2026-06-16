"use client"

import { PayslipRowActions } from "@/components/dashboard/payslips/payslip-row-actions"
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
import type { Payslip } from "@/lib/types"

type PayslipsTableProps = {
  payslips: Payslip[]
  status: string
  sortKey: PayslipListSort
  sortDir: SortDirection
  onSort: (key: PayslipListSort) => void
  onStatusFilterChange: (status: string) => void
  onEdit: (payslip: Payslip) => void
  emptyMessage?: string
}

const payslipStatuses: Payslip["status"][] = [
  "draft",
  "pending",
  "adminApproved",
  "approved",
  "returned",
  "sent",
]
const payslipStatusOptions = payslipStatuses.map((status) => ({
  value: status,
  label: formatPayslipStatus(status),
}))

export function PayslipsTable({
  payslips,
  status,
  sortKey,
  sortDir,
  onSort,
  onStatusFilterChange,
  onEdit,
  emptyMessage = "No payslips yet.",
}: PayslipsTableProps) {
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
            options={payslipStatusOptions}
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
                isReturnedStatus(payslip.status) &&
                  "font-medium text-destructive"
              )}
            >
              {formatPayslipStatus(payslip.status)}
            </TableCell>
            <TableCell>
              <PayslipRowActions payslip={payslip} onEdit={onEdit} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
