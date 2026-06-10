import { redirect } from "next/navigation"

import { LogsFilters } from "@/components/dashboard/logs/logs-filters"
import { LogsTable } from "@/components/dashboard/logs/logs-table"
import { AUDIT_ACTIONS, AUDIT_ACTOR_ROLES } from "@/lib/audit-log-options"
import { getAuditLogs } from "@/lib/audit-logs"
import { requireDashboardSession } from "@/lib/authorization"
import type { AuditAction, AuditLogQuery, Role } from "@/lib/types"

export const dynamic = "force-dynamic"

type LogsPageProps = {
  searchParams: Promise<{
    dateFrom?: string
    dateTo?: string
    actorRole?: string
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

function normalizeActorRole(role: string | undefined): Role | undefined {
  if (!role) {
    return undefined
  }
  return AUDIT_ACTOR_ROLES.includes(role as Role) ? (role as Role) : undefined
}

export default async function LogsPage({ searchParams }: LogsPageProps) {
  const session = await requireDashboardSession()
  if ("error" in session) {
    redirect("/login")
  }

  const params = await searchParams
  const query: AuditLogQuery = {
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    actorRole: normalizeActorRole(params.actorRole),
    action: normalizeAction(params.action),
  }
  const logs = await getAuditLogs(query)

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Logs</h1>
        <p className="text-sm text-muted-foreground">
          Recent activity across payslips, payrolls, and employees.
        </p>
      </div>

      <LogsFilters query={query} />

      <LogsTable logs={logs} />
    </div>
  )
}
