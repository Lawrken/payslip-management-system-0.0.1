import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTOR_ROLE_LABELS,
} from "@/lib/audit-logs"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AuditAction, AuditLog } from "@/lib/types"

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

export function LogsTable({
  logs,
  emptyMessage = "No logs match the filters.",
}: LogsTableProps) {
  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{emptyMessage}</p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[10.5rem]">Date</TableHead>
          <TableHead className="w-[8.5rem]">Actor</TableHead>
          <TableHead className="w-[9.5rem]">Action</TableHead>
          <TableHead className="w-[26%]">Target</TableHead>
          <TableHead>Details</TableHead>
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
