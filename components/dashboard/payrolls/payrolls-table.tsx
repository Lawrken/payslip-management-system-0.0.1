"use client"

import * as React from "react"

import { PayrollRowActions } from "@/components/dashboard/payrolls/payroll-row-actions"
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
import { formatDisplayDate, formatDtrCutOffRange } from "@/lib/payroll-dates"
import {
  comparePayrollPeriodStatus,
  getPayrollPeriodStatus,
} from "@/lib/payroll-period-status"
import { applyDirection, compareStrings } from "@/lib/table-sort"
import type { SortDirection } from "@/lib/table-sort"
import { cn } from "@/lib/utils"
import type { Payroll, Payslip } from "@/lib/types"

type SortKey = "payrollPeriodLabel" | "dtrCutOffStart" | "payoutDate" | "status"

type PayrollsTableProps = {
  payrolls: Payroll[]
  payslipsByPayrollId: Record<string, Payslip[]>
  emptyMessage?: string
}

function comparePayrolls(
  a: Payroll,
  b: Payroll,
  key: SortKey,
  dir: SortDirection,
  payslipsByPayrollId: Record<string, Payslip[]>
) {
  if (key === "status") {
    const statusA = getPayrollPeriodStatus(payslipsByPayrollId[a.id] ?? [])
    const statusB = getPayrollPeriodStatus(payslipsByPayrollId[b.id] ?? [])
    return comparePayrollPeriodStatus(statusA, statusB, dir)
  }

  const result =
    key === "payrollPeriodLabel"
      ? compareStrings(a.payrollPeriodLabel, b.payrollPeriodLabel)
      : compareStrings(a[key], b[key])
  return applyDirection(result, dir)
}

export function PayrollsTable({
  payrolls,
  payslipsByPayrollId,
  emptyMessage = "No payroll periods yet.",
}: PayrollsTableProps) {
  const compare = React.useCallback(
    (a: Payroll, b: Payroll, key: SortKey, dir: SortDirection) =>
      comparePayrolls(a, b, key, dir, payslipsByPayrollId),
    [payslipsByPayrollId]
  )

  const { sortKey, sortDir, handleSort, sortedItems } = useTableSort<
    Payroll,
    SortKey
  >({
    items: payrolls,
    defaultKey: "payoutDate",
    defaultDir: "desc",
    compare,
  })

  if (payrolls.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{emptyMessage}</p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableTableHead
            label="Payroll Period"
            active={sortKey === "payrollPeriodLabel"}
            direction={sortDir}
            onSort={() => handleSort("payrollPeriodLabel")}
          />
          <SortableTableHead
            label="DTR Cut-Off"
            active={sortKey === "dtrCutOffStart"}
            direction={sortDir}
            onSort={() => handleSort("dtrCutOffStart")}
          />
          <SortableTableHead
            label="Payout Date"
            active={sortKey === "payoutDate"}
            direction={sortDir}
            onSort={() => handleSort("payoutDate")}
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
        {sortedItems.map((payroll) => {
          const periodStatus = getPayrollPeriodStatus(
            payslipsByPayrollId[payroll.id] ?? []
          )

          return (
            <TableRow key={payroll.id}>
              <TableCell className="font-medium">
                {payroll.payrollPeriodLabel}
              </TableCell>
              <TableCell>
                {formatDtrCutOffRange(
                  payroll.dtrCutOffStart,
                  payroll.dtrCutOffEnd
                )}
              </TableCell>
              <TableCell>{formatDisplayDate(payroll.payoutDate)}</TableCell>
              <TableCell
                className={cn(
                  periodStatus.variant === "muted" && "text-muted-foreground",
                  periodStatus.variant === "success" && "font-medium"
                )}
              >
                {periodStatus.label}
              </TableCell>
              <TableCell>
                <PayrollRowActions payroll={payroll} />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
