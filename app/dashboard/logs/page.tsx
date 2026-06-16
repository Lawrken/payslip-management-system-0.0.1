import { redirect } from "next/navigation"

import { LogsFilters } from "@/components/dashboard/logs/logs-filters"
import { LogsTable } from "@/components/dashboard/logs/logs-table"
import { PaginationControls } from "@/components/dashboard/shared/pagination-controls"
import { AUDIT_ACTIONS, AUDIT_ACTOR_ROLES } from "@/lib/audit-log-options"
import {
  getPaginatedAuditLogs,
  type AuditLogListSort,
} from "@/lib/audit-logs"
import { requireDashboardSession } from "@/lib/authorization"
import type { SortDirection } from "@/lib/table-sort"
import type { AuditAction, AuditLogQuery, Role } from "@/lib/types"

export const dynamic = "force-dynamic"

type LogsPageProps = {
  searchParams: Promise<{
    dateFrom?: string
    dateTo?: string
    actorRole?: string
    action?: string
    page?: string
    pageSize?: string
    sort?: string
    direction?: string
  }>
}

const auditLogSorts: AuditLogListSort[] = [
  "createdAt",
  "actorEmployeeId",
  "action",
  "targetLabel",
  "details",
]

function normalizeAction(action: string | undefined): AuditAction | undefined {
  if (!action) {
    return undefined
  }
  return AUDIT_ACTIONS.includes(action as AuditAction)
    ? (action as AuditAction)
    : undefined
}

function normalizeActorRole(role: string | undefined): Role | undefined {
  if (!role) {
    return undefined
  }
  return AUDIT_ACTOR_ROLES.includes(role as Role) ? (role as Role) : undefined
}

function normalizeSort(value: string | undefined): AuditLogListSort {
  return auditLogSorts.includes(value as AuditLogListSort)
    ? (value as AuditLogListSort)
    : "createdAt"
}

function normalizeDirection(value: string | undefined): SortDirection {
  return value === "asc" ? "asc" : "desc"
}

export default async function LogsPage({ searchParams }: LogsPageProps) {
  const session = await requireDashboardSession()
  if ("error" in session) {
    redirect("/login")
  }

  const params = await searchParams
  const sort = normalizeSort(params.sort)
  const direction = normalizeDirection(params.direction)
  const query: AuditLogQuery = {
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    actorRole: normalizeActorRole(params.actorRole),
    action: normalizeAction(params.action),
  }
  const logs = await getPaginatedAuditLogs({
    ...query,
    page: params.page,
    pageSize: params.pageSize,
    sort,
    direction,
  })

  return (
    <div className="flex max-w-full min-w-0 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Logs</h1>
        <p className="text-sm text-muted-foreground">
          Recent activity across payslips, payrolls, and employees.
        </p>
      </div>

      <LogsFilters
        query={query}
        sortKey={sort}
        sortDir={direction}
        pageSize={logs.pageSize}
      />

      <LogsTable logs={logs.items} sortKey={sort} sortDir={direction} />
      <PaginationControls
        page={logs.page}
        pageCount={logs.pageCount}
        total={logs.total}
        pageSize={logs.pageSize}
        itemLabel="logs"
      />
    </div>
  )
}
