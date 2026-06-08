import { redirect } from "next/navigation"
import Link from "next/link"

import { LogsTable } from "@/components/dashboard/logs/logs-table"
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTIONS,
  AUDIT_ACTOR_ROLE_LABELS,
  AUDIT_ACTOR_ROLES,
  getAuditLogs,
} from "@/lib/audit-logs"
import { requireDashboardSession } from "@/lib/authorization"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

const selectClassName =
  "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"

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

      <form className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
          <Label htmlFor="action">Action</Label>
          <select
            id="action"
            name="action"
            defaultValue={query.action ?? ""}
            className={selectClassName}
          >
            <option value="">All actions</option>
            {AUDIT_ACTIONS.map((action) => (
              <option key={action} value={action}>
                {AUDIT_ACTION_LABELS[action]}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="actorRole">Actor</Label>
          <select
            id="actorRole"
            name="actorRole"
            defaultValue={query.actorRole ?? ""}
            className={selectClassName}
          >
            <option value="">All actors</option>
            {AUDIT_ACTOR_ROLES.map((role) => (
              <option key={role} value={role}>
                {AUDIT_ACTOR_ROLE_LABELS[role]}
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

      <LogsTable logs={logs} />
    </div>
  )
}
