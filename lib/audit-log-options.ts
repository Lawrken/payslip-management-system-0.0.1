import type { AuditAction, Role } from "@/lib/types"

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  "employee.create": "Employee created",
  "employee.update": "Employee edited",
  "employee.delete": "Employee deleted",
  "user.create": "User created",
  "user.delete": "User deleted",
  "user.password_reset": "Password reset",
  "payroll.create": "Payroll created",
  "payroll.update": "Payroll edited",
  "payroll.delete": "Payroll deleted",
  "payslip.create": "Payslip created",
  "payslip.update": "Payslip edited",
  "payslip.delete": "Payslip deleted",
  "payslip.admin_check": "Payslip checked",
  "payslip.superadmin_approve": "Payslip released",
  "payslip.return": "Payslip returned",
  "schedule.create": "Schedule created",
  "schedule.update": "Schedule updated",
}

export const AUDIT_ACTIONS = Object.keys(AUDIT_ACTION_LABELS) as AuditAction[]

export const AUDIT_ACTOR_ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  superAdmin: "Superadmin",
  employee: "Employee",
}

export const AUDIT_ACTOR_ROLES = Object.keys(AUDIT_ACTOR_ROLE_LABELS) as Role[]
