"use client"

import * as React from "react"

import { PayslipRowActions } from "@/components/dashboard/payslips/payslip-row-actions"
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
import { cn } from "@/lib/utils"
import type { Payslip } from "@/lib/types"

type SortKey = "employeeName" | "employeeId" | "status"
type SortDir = "asc" | "desc"

type PayslipsTableProps = {
  payslips: Payslip[]
  onEdit: (payslip: Payslip) => void
  emptyMessage?: string
}

function SortIndicator({
  active,
  dir,
}: {
  active: boolean
  dir: SortDir
}) {
  if (!active) {
    return null
  }

  return (
    <span className="ml-1 text-muted-foreground" aria-hidden="true">
      {dir === "asc" ? "↑" : "↓"}
    </span>
  )
}

export function PayslipsTable({
  payslips,
  onEdit,
  emptyMessage = "No payslips yet.",
}: PayslipsTableProps) {
  const [sortKey, setSortKey] = React.useState<SortKey>("status")
  const [sortDir, setSortDir] = React.useState<SortDir>("asc")

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"))
      return
    }
    setSortKey(key)
    setSortDir("asc")
  }

  const sortedPayslips = React.useMemo(() => {
    const copy = [...payslips]

    copy.sort((a, b) => {
      let result = 0

      if (sortKey === "employeeName") {
        result = a.employeeName.localeCompare(b.employeeName)
      } else if (sortKey === "employeeId") {
        result = a.employeeId.localeCompare(b.employeeId)
      } else {
        result = comparePayslipStatus(a.status, b.status, sortDir)
        return result
      }

      return sortDir === "asc" ? result : -result
    })

    return copy
  }, [payslips, sortKey, sortDir])

  if (payslips.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{emptyMessage}</p>
    )
  }

  const headerButtonClassName =
    "inline-flex items-center font-medium hover:text-foreground"

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <button
              type="button"
              className={headerButtonClassName}
              onClick={() => handleSort("employeeName")}
            >
              Employee Name
              <SortIndicator
                active={sortKey === "employeeName"}
                dir={sortDir}
              />
            </button>
          </TableHead>
          <TableHead>
            <button
              type="button"
              className={headerButtonClassName}
              onClick={() => handleSort("employeeId")}
            >
              Employee ID
              <SortIndicator active={sortKey === "employeeId"} dir={sortDir} />
            </button>
          </TableHead>
          <TableHead>
            <button
              type="button"
              className={headerButtonClassName}
              onClick={() => handleSort("status")}
            >
              Status
              <SortIndicator active={sortKey === "status"} dir={sortDir} />
            </button>
          </TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedPayslips.map((payslip) => (
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
