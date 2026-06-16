import "server-only"

import { and, asc, count, desc, eq, gte, lte } from "drizzle-orm"

import { db, type DatabaseClient } from "@/db"
import { auditLogs } from "@/db/schema"
import {
  buildPaginatedResult,
  normalizePagination,
  type PaginatedResult,
  type PaginationInput,
} from "@/lib/pagination"
import type { SortDirection } from "@/lib/table-sort"
import type { AuditAction, AuditLog, AuditLogQuery, Session } from "@/lib/types"

type CreateAuditLogInput = {
  actor: Session
  action: AuditAction
  targetType: string
  targetId: string
  targetLabel: string
  details: string
  client?: DatabaseClient
}

export async function createAuditLog(input: CreateAuditLogInput) {
  const client = input.client ?? db
  await client.insert(auditLogs).values({
    id: crypto.randomUUID(),
    actorEmployeeId: input.actor.employeeId,
    actorRole: input.actor.role,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    targetLabel: input.targetLabel,
    details: input.details,
  })
}

function parseDateStart(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

function parseDateEnd(value: string) {
  const date = new Date(`${value}T23:59:59.999Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

export type AuditLogListSort =
  | "createdAt"
  | "actorEmployeeId"
  | "action"
  | "targetLabel"
  | "details"

export type AuditLogListQuery = AuditLogQuery &
  PaginationInput & {
    sort?: AuditLogListSort
    direction?: SortDirection
  }

function getAuditLogSortColumn(sort: AuditLogListSort) {
  return auditLogs[sort]
}

export async function getPaginatedAuditLogs(
  query: AuditLogListQuery = {}
): Promise<PaginatedResult<AuditLog>> {
  const pagination = normalizePagination(query)
  const conditions = []

  if (query.dateFrom) {
    const dateFrom = parseDateStart(query.dateFrom)
    if (dateFrom) {
      conditions.push(gte(auditLogs.createdAt, dateFrom))
    }
  }

  if (query.dateTo) {
    const dateTo = parseDateEnd(query.dateTo)
    if (dateTo) {
      conditions.push(lte(auditLogs.createdAt, dateTo))
    }
  }

  if (query.actorRole) {
    conditions.push(eq(auditLogs.actorRole, query.actorRole))
  }

  if (query.action) {
    conditions.push(eq(auditLogs.action, query.action))
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const sort = query.sort ?? "createdAt"
  const direction = query.direction === "asc" ? "asc" : "desc"
  const orderBy =
    direction === "asc"
      ? asc(getAuditLogSortColumn(sort))
      : desc(getAuditLogSortColumn(sort))

  const [totalRow] = await db
    .select({ count: count() })
    .from(auditLogs)
    .where(where)
  const items = await db
    .select()
    .from(auditLogs)
    .where(where)
    .orderBy(orderBy)
    .limit(pagination.pageSize)
    .offset(pagination.offset)

  return buildPaginatedResult(items, totalRow?.count ?? 0, pagination)
}
