import { and, desc, eq, gte, lte } from "drizzle-orm"

import { db, type DatabaseClient } from "@/db"
import { auditLogs } from "@/db/schema"
import type { AuditAction, AuditLog, AuditLogQuery, Session } from "@/lib/types"

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  "employee.create": "Employee created",
  "employee.update": "Employee edited",
  "employee.delete": "Employee deleted",
  "user.create": "User created",
  "user.delete": "User deleted",
  "user.password_reset": "Password reset",
  "credential.export": "Credentials exported",
  "credential.view": "Initial credential viewed",
  "payroll.create": "Payroll created",
  "payroll.update": "Payroll edited",
  "payroll.delete": "Payroll deleted",
  "payslip.create": "Payslip created",
  "payslip.update": "Payslip edited",
  "payslip.delete": "Payslip deleted",
  "payslip.admin_check": "Payslip checked",
  "payslip.superadmin_approve": "Payslip ready for email",
  "payslip.return": "Payslip returned",
  "payslip.email_send": "Payslip email sent",
  "payslip.bulk_send": "Payslips sent",
}

export const AUDIT_ACTIONS = Object.keys(AUDIT_ACTION_LABELS) as AuditAction[]

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

export async function getAuditLogs(
  query: AuditLogQuery = {}
): Promise<AuditLog[]> {
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

  if (query.actorEmployeeId) {
    conditions.push(eq(auditLogs.actorEmployeeId, query.actorEmployeeId))
  }

  if (query.action) {
    conditions.push(eq(auditLogs.action, query.action))
  }

  return db
    .select()
    .from(auditLogs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditLogs.createdAt))
    .limit(200)
}
