import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

import type {
  Account,
  Department,
  EmployeeDivisor,
  EmployeeStatus,
  PositionTitle,
  Program,
} from "@/lib/employee-options"
import type {
  AuditAction,
  PayslipPayrollInputs,
  PayslipStatus,
  PayslipTotals,
  Role,
} from "@/lib/types"

export const users = pgTable("users", {
  employeeId: text("employee_id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  initialPasswordCiphertext: text("initial_password_ciphertext"),
  passwordChangedAt: timestamp("password_changed_at", { withTimezone: true }),
  role: text("role").$type<Role>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const employees = pgTable("employees", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  employeeId: text("employee_id").notNull().unique(),
  email: text("email").notNull().unique(),
  employeeStatus: text("employee_status").$type<EmployeeStatus>().notNull(),
  positionTitle: text("position_title").$type<PositionTitle>().notNull(),
  department: text("department").$type<Department>().notNull(),
  program: text("program").$type<Program>().notNull(),
  account: text("account").$type<Account>().notNull(),
  divisor: integer("divisor").$type<EmployeeDivisor>().notNull(),
  basicPay: numeric("basic_pay", { mode: "number" }).notNull(),
  tin: text("tin").notNull(),
  sssNo: text("sss_no").notNull(),
  phicNo: text("phic_no").notNull(),
  hdmfNo: text("hdmf_no").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const payrolls = pgTable("payrolls", {
  id: text("id").primaryKey(),
  payrollPeriodLabel: text("payroll_period_label").notNull(),
  payrollPeriodStart: text("payroll_period_start").notNull(),
  payrollPeriodEnd: text("payroll_period_end").notNull(),
  dtrCutOffStart: text("dtr_cut_off_start").notNull(),
  dtrCutOffEnd: text("dtr_cut_off_end").notNull(),
  payoutDate: text("payout_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const payslips = pgTable(
  "payslips",
  {
    id: text("id").primaryKey(),
    payrollId: text("payroll_id")
      .notNull()
      .references(() => payrolls.id, { onDelete: "cascade" }),
    employeeId: text("employee_id").notNull(),
    status: text("status").$type<PayslipStatus>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("payslips_payroll_id_idx").on(table.payrollId),
    index("payslips_employee_id_idx").on(table.employeeId),
  ]
)

export const payslipInputs = pgTable("payslip_inputs", {
  payslipId: text("payslip_id")
    .primaryKey()
    .references(() => payslips.id, { onDelete: "cascade" }),
  inputs: jsonb("inputs").$type<PayslipPayrollInputs>().notNull(),
  totals: jsonb("totals").$type<PayslipTotals>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    actorEmployeeId: text("actor_employee_id").notNull(),
    actorRole: text("actor_role").$type<Role>().notNull(),
    action: text("action").$type<AuditAction>().notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    targetLabel: text("target_label").notNull(),
    details: text("details").notNull(),
  },
  (table) => [
    index("audit_logs_created_at_idx").on(table.createdAt),
    index("audit_logs_actor_employee_id_idx").on(table.actorEmployeeId),
    index("audit_logs_action_idx").on(table.action),
  ]
)
