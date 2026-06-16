"use client"

import { useRouter, useSearchParams } from "next/navigation"

import { SortableTableHead } from "@/components/dashboard/shared/table-sort"
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTOR_ROLE_LABELS,
} from "@/lib/audit-log-options"
import type { AuditLogListSort } from "@/lib/audit-logs"
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

type LogsTableProps = {
  logs: AuditLog[]
  sortKey: AuditLogListSort
  sortDir: SortDirection
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
  return action === "payslip.superadmin_approve"
}

export function LogsTable({
  logs,
  sortKey,
  sortDir,
  emptyMessage = "No logs match the filters.",
}: LogsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleSort(key: AuditLogListSort) {
    const params = new URLSearchParams(searchParams.toString())
    const nextDirection =
      sortKey === key && sortDir === "asc" ? "desc" : "asc"
    params.set("sort", key)
    params.set("direction", nextDirection)
    params.delete("page")
    const query = params.toString()
    router.replace(query ? `/dashboard/logs?${query}` : "/dashboard/logs", {
      scroll: false,
    })
  }

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
        {logs.map((log) => (
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
