export type Role = "admin" | "superAdmin" | "employee"

export type MockUser = {
  employeeId: string
  password: string
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

export type PayslipStatus = "pending" | "sent"

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
