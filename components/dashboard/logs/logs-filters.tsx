"use client"

import Link from "next/link"

import { DateSelect } from "@/components/dashboard/shared/date-select"
import { OptionSelect } from "@/components/dashboard/shared/option-select"
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTIONS,
  AUDIT_ACTOR_ROLE_LABELS,
  AUDIT_ACTOR_ROLES,
} from "@/lib/audit-log-options"
import { Button } from "@/components/ui/button"
import type { AuditLogListSort } from "@/lib/audit-logs"
import type { SortDirection } from "@/lib/table-sort"
import type { AuditLogQuery } from "@/lib/types"

type LogsFiltersProps = {
  query: AuditLogQuery
  sortKey: AuditLogListSort
  sortDir: SortDirection
  pageSize: number
}

const actionOptions = AUDIT_ACTIONS.map((action) => ({
  value: action,
  label: AUDIT_ACTION_LABELS[action],
}))

const actorRoleOptions = AUDIT_ACTOR_ROLES.map((role) => ({
  value: role,
  label: AUDIT_ACTOR_ROLE_LABELS[role],
}))

export function LogsFilters({
  query,
  sortKey,
  sortDir,
  pageSize,
}: LogsFiltersProps) {
  return (
    <form
      action="/dashboard/logs"
      className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      <input type="hidden" name="sort" value={sortKey} />
      <input type="hidden" name="direction" value={sortDir} />
      <input type="hidden" name="pageSize" value={pageSize} />
      <DateSelect
        id="dateFrom"
        name="dateFrom"
        label="From"
        defaultValue={query.dateFrom}
      />
      <DateSelect
        id="dateTo"
        name="dateTo"
        label="To"
        defaultValue={query.dateTo}
      />
      <OptionSelect
        id="action"
        name="action"
        label="Action"
        options={actionOptions}
        defaultValue={query.action ?? ""}
        placeholder="All actions"
        searchPlaceholder="Search actions…"
        emptyMessage="No action found."
      />
      <OptionSelect
        id="actorRole"
        name="actorRole"
        label="Actor"
        options={actorRoleOptions}
        defaultValue={query.actorRole ?? ""}
        placeholder="All actors"
        searchPlaceholder="Search actors…"
        emptyMessage="No actor found."
      />
      <div className="flex flex-wrap gap-2 sm:col-span-2 xl:col-span-4">
        <Button type="submit">Apply Filters</Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/logs">Clear</Link>
        </Button>
      </div>
    </form>
  )
}
