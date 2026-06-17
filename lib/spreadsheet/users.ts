import type { SpreadsheetRow } from "@/lib/spreadsheet/types"
import type { AuditLog, UserAccount } from "@/lib/types"

export type UserSpreadsheetRow = SpreadsheetRow & {
  employeeId: string
  employeeName: string | null
  email: string
  role: string
  passwordChangedAt: string | null
}

export type AuditLogSpreadsheetRow = SpreadsheetRow & {
  createdAt: string
  actorEmployeeId: string
  actorRole: string
  action: string
  targetType: string
  targetId: string
  targetLabel: string
  details: string
}

export function userToSpreadsheetRow(user: UserAccount): UserSpreadsheetRow {
  return {
    rowId: user.employeeId,
    employeeId: user.employeeId,
    employeeName: user.employeeName,
    email: user.email,
    role: user.role,
    passwordChangedAt: user.passwordChangedAt
      ? user.passwordChangedAt.toISOString()
      : null,
  }
}

export function usersToSpreadsheetRows(users: UserAccount[]): UserSpreadsheetRow[] {
  return users.map(userToSpreadsheetRow)
}

export function auditLogToSpreadsheetRow(log: AuditLog): AuditLogSpreadsheetRow {
  return {
    rowId: log.id,
    createdAt: log.createdAt.toISOString(),
    actorEmployeeId: log.actorEmployeeId,
    actorRole: log.actorRole,
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId,
    targetLabel: log.targetLabel,
    details: log.details,
  }
}

export function auditLogsToSpreadsheetRows(
  logs: AuditLog[]
): AuditLogSpreadsheetRow[] {
  return logs.map(auditLogToSpreadsheetRow)
}
