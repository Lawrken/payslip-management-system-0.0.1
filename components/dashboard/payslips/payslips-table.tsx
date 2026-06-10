"use client"

import * as React from "react"

import { PayslipRowActions } from "@/components/dashboard/payslips/payslip-row-actions"
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
  comparePayslipStatus,
  formatPayslipStatus,
  isDraftStatus,
  isReturnedStatus,
} from "@/lib/payslip-status"
import { applyDirection, compareStrings } from "@/lib/table-sort"
import type { SortDirection } from "@/lib/table-sort"
import { cn } from "@/lib/utils"
import type { Payslip } from "@/lib/types"

type SortKey = "employeeName" | "employeeId" | "status"

type PayslipsTableProps = {
  payslips: Payslip[]
  onEdit: (payslip: Payslip) => void
  emptyMessage?: string
}

function comparePayslips(
  a: Payslip,
  b: Payslip,
  key: SortKey,
  dir: SortDirection
) {
  if (key === "status") {
    return comparePayslipStatus(a.status, b.status, dir)
  }
  const result =
    key === "employeeName"
      ? compareStrings(a.employeeName, b.employeeName)
      : compareStrings(a.employeeId, b.employeeId)
  return applyDirection(result, dir)
}

export function PayslipsTable({
  payslips,
  onEdit,
  emptyMessage = "No payslips yet.",
}: PayslipsTableProps) {
  const { sortKey, sortDir, handleSort, sortedItems } = useTableSort<
    Payslip,
    SortKey
  >({
    items: payslips,
    defaultKey: "status",
    defaultDir: "asc",
    compare: comparePayslips,
  })

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
            onSort={() => handleSort("employeeName")}
          />
          <SortableTableHead
            label="Employee ID"
            active={sortKey === "employeeId"}
            direction={sortDir}
            onSort={() => handleSort("employeeId")}
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
        {sortedItems.map((payslip) => (
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
