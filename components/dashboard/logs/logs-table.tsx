"use client"

import * as React from "react"

import {
  SortableTableHead,
  useTableSort,
} from "@/components/dashboard/shared/table-sort"
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTOR_ROLE_LABELS,
} from "@/lib/audit-log-options"
import { applyDirection, compareDates, compareStrings } from "@/lib/table-sort"
import type { SortDirection } from "@/lib/table-sort"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AuditAction, AuditLog } from "@/lib/types"

type SortKey = "createdAt" | "actorEmployeeId" | "action" | "targetLabel" | "details"

type LogsTableProps = {
  logs: AuditLog[]
  emptyMessage?: string
}

function formatLogDate(date: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  }).format(date)
}

function isDestructiveAction(action: AuditAction) {
  return action === "payslip.return" || action.endsWith(".delete")
}

function isSuccessAction(action: AuditAction) {
  return (
    action === "payslip.email_send" ||
    action === "payslip.bulk_send" ||
    action === "payslip.superadmin_approve"
  )
}

function compareLogs(
  a: AuditLog,
  b: AuditLog,
  key: SortKey,
  dir: SortDirection
) {
  let result = 0

  if (key === "createdAt") {
    result = compareDates(a.createdAt, b.createdAt)
  } else if (key === "action") {
    result = compareStrings(
      AUDIT_ACTION_LABELS[a.action] ?? a.action,
      AUDIT_ACTION_LABELS[b.action] ?? b.action
    )
  } else {
    result = compareStrings(a[key], b[key])
  }

  return applyDirection(result, dir)
}

export function LogsTable({
  logs,
  emptyMessage = "No logs match the filters.",
}: LogsTableProps) {
  const { sortKey, sortDir, handleSort, sortedItems } = useTableSort<
    AuditLog,
    SortKey
  >({
    items: logs,
    defaultKey: "createdAt",
    defaultDir: "desc",
    compare: compareLogs,
  })

  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{emptyMessage}</p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableTableHead
            label="Date"
            active={sortKey === "createdAt"}
            direction={sortDir}
            onSort={() => handleSort("createdAt")}
            className="w-[10.5rem]"
          />
          <SortableTableHead
            label="Actor"
            active={sortKey === "actorEmployeeId"}
            direction={sortDir}
            onSort={() => handleSort("actorEmployeeId")}
            className="w-[8.5rem]"
          />
          <SortableTableHead
            label="Action"
            active={sortKey === "action"}
            direction={sortDir}
            onSort={() => handleSort("action")}
            className="w-[9.5rem]"
          />
          <SortableTableHead
            label="Target"
            active={sortKey === "targetLabel"}
            direction={sortDir}
            onSort={() => handleSort("targetLabel")}
            className="w-[26%]"
          />
          <SortableTableHead
            label="Details"
            active={sortKey === "details"}
            direction={sortDir}
            onSort={() => handleSort("details")}
          />
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedItems.map((log) => (
          <TableRow key={log.id}>
            <TableCell className="align-top whitespace-nowrap text-muted-foreground">
              {formatLogDate(log.createdAt)}
            </TableCell>
            <TableCell className="align-top whitespace-normal break-words">
              <div className="font-medium">{log.actorEmployeeId}</div>
              <div className="text-xs text-muted-foreground">
                {AUDIT_ACTOR_ROLE_LABELS[log.actorRole]}
              </div>
            </TableCell>
            <TableCell
              className={cn(
                "align-top whitespace-normal break-words",
                isDestructiveAction(log.action) &&
                  "font-medium text-destructive",
                isSuccessAction(log.action) && "font-medium"
              )}
            >
              {AUDIT_ACTION_LABELS[log.action] ?? log.action}
            </TableCell>
            <TableCell className="align-top whitespace-normal break-words">
              <div className="font-medium break-words">{log.targetLabel}</div>
              <div className="text-xs break-words text-muted-foreground">
                {log.targetType} · {log.targetId}
              </div>
            </TableCell>
            <TableCell className="align-top whitespace-normal break-words">
              {log.details}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
