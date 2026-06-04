import { AUDIT_ACTION_LABELS, AUDIT_ACTIONS, getAuditLogs } from "@/lib/audit-logs"
import type { AuditAction, AuditLogQuery } from "@/lib/types"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export const dynamic = "force-dynamic"

type LogsPageProps = {
  searchParams: Promise<{
    dateFrom?: string
    dateTo?: string
    actorEmployeeId?: string
    action?: string
  }>
}

function normalizeAction(action: string | undefined): AuditAction | undefined {
  if (!action) {
    return undefined
  }
  return AUDIT_ACTIONS.includes(action as AuditAction)
    ? (action as AuditAction)
    : undefined
}

function formatLogDate(date: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(date)
}

export default async function LogsPage({ searchParams }: LogsPageProps) {
  const params = await searchParams
  const query: AuditLogQuery = {
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    actorEmployeeId: params.actorEmployeeId?.trim(),
    action: normalizeAction(params.action),
  }
  const logs = await getAuditLogs(query)

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Logs</h1>
        <p className="text-sm text-muted-foreground">
          Business activity for approvals, edits, returns, sends, and record
          changes.
        </p>
      </div>

      <form className="grid min-w-0 gap-3 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="grid gap-2">
          <Label htmlFor="dateFrom">From</Label>
          <Input
            id="dateFrom"
            name="dateFrom"
            type="date"
            defaultValue={query.dateFrom ?? ""}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="dateTo">To</Label>
          <Input
            id="dateTo"
            name="dateTo"
            type="date"
            defaultValue={query.dateTo ?? ""}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="actorEmployeeId">Actor</Label>
          <Input
            id="actorEmployeeId"
            name="actorEmployeeId"
            placeholder="Employee ID"
            defaultValue={query.actorEmployeeId ?? ""}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="action">Action</Label>
          <select
            id="action"
            name="action"
            defaultValue={query.action ?? ""}
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">All actions</option>
            {AUDIT_ACTIONS.map((action) => (
              <option key={action} value={action}>
                {AUDIT_ACTION_LABELS[action]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2 sm:col-span-2 xl:col-span-4">
          <Button type="submit">Apply Filters</Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/logs">Clear</Link>
          </Button>
        </div>
      </form>

      {logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No logs match the filters.</p>
      ) : (
        <div className="min-w-0 w-full overflow-hidden rounded-lg border">
          <Table className="table-fixed">
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
                  <TableCell className="whitespace-nowrap align-top">
                    {formatLogDate(log.createdAt)}
                  </TableCell>
                  <TableCell className="align-top whitespace-normal break-words">
                    {log.actorEmployeeId}
                    <span className="text-muted-foreground">
                      {" "}
                      · {log.actorRole}
                    </span>
                  </TableCell>
                  <TableCell className="align-top whitespace-normal break-words">
                    {AUDIT_ACTION_LABELS[log.action]}
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
        </div>
      )}
    </div>
  )
}
