export type Role = "admin" | "superAdmin"

export type User = {
  employeeId: string
  passwordHash: string
  role: Role
}

export type Session = {
  employeeId: string
  role: Role
}

export type Employee = {
  id: string
  name: string
  employeeId: string
  email: string
  tin: string
  sssNo: string
  phicNo: string
  hdmfNo: string
}

export type Payroll = {
  id: string
  /** Display label, e.g. "March 16-31, 2026" */
  payrollPeriodLabel: string
  payrollPeriodStart: string
  payrollPeriodEnd: string
  dtrCutOffStart: string
  dtrCutOffEnd: string
  payoutDate: string
}

export type PayslipStatus =
  | "draft"
  | "pending"
  | "adminApproved"
  | "approved"
  | "returned"
  | "sent"

export type PayslipPayrollInputs = {
  basicPay: number
  absencesDays: number
  tardiness: number
  undertime: number
  nd: number
  regOt: number
  rdOt: number
  rdOtOver8: number
  rdotNd: number
  legal: number
  legalOver8: number
  lglNd: number
  special: number
  spclOver8: number
  spclNd: number
  spclRd: number
  spclRdOver8: number
  addback: number
  addbackRegOt: number
  addbackRdOt: number
  addbackRdOtOver8: number
  projectAllowance: number
  performanceIncentives: number
  signingBonus: number
  referralIncentives: number
  salaryAdjustment: number
  tax: number
  sss: number
  sssMpf: number
  hdmf: number
  phic: number
  sssLoan: number
  sssCalamityLoan: number
  pagIbigLoan: number
  cashAdvance: number
  taxPayable: number
  cloth: number
  emplach: number
  holrep: number
  laundry: number
  medasst: number
  medcash: number
  otmeal: number
  riceSubsidy: number
  dmbAdj: number
  taxRefund: number
}

export type PayslipTotals = {
  taxableEarnings: number
  totalDeductions: number
  nonTaxableEarnings: number
  grossPay: number
  netPay: number
}

export type Payslip = {
  id: string
  payrollId: string
  employeeId: string
  employeeName: string
  status: PayslipStatus
  inputs: PayslipPayrollInputs
  totals: PayslipTotals
}

export type PayslipEmailData = Payslip & {
  employeeEmail: string
  tin: string
  sssNo: string
  phicNo: string
  hdmfNo: string
  payrollPeriodLabel: string
  payrollPeriodStart: string
  payrollPeriodEnd: string
  dtrCutOffStart: string
  dtrCutOffEnd: string
  payoutDate: string
}

export type AuditAction =
  | "employee.create"
  | "employee.update"
  | "employee.delete"
  | "payroll.create"
  | "payroll.update"
  | "payroll.delete"
  | "payslip.create"
  | "payslip.update"
  | "payslip.delete"
  | "payslip.admin_check"
  | "payslip.superadmin_approve"
  | "payslip.return"
  | "payslip.email_send"
  | "payslip.bulk_send"

export type AuditLog = {
  id: string
  createdAt: Date
  actorEmployeeId: string
  actorRole: Role
  action: AuditAction
  targetType: string
  targetId: string
  targetLabel: string
  details: string
}

export type AuditLogQuery = {
  dateFrom?: string
  dateTo?: string
  actorRole?: Role
  action?: AuditAction
}
