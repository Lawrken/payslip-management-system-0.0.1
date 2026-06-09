import { PAYSLIP_STATUS_COLORS } from "@/lib/dashboard-chart-colors"
import { formatPayslipStatus } from "@/lib/payslip-status"
import type { Payroll, Payslip, PayslipStatus, Role } from "@/lib/types"

const PAYSLIP_STATUSES: PayslipStatus[] = [
  "draft",
  "pending",
  "adminApproved",
  "approved",
  "returned",
  "sent",
]

export type PayslipStatusCount = {
  status: PayslipStatus
  label: string
  count: number
}

export type StatusChartDatum = {
  status: PayslipStatus
  label: string
  count: number
  fill: string
}

export type PayrollTotalsChartRow = {
  key: "gross" | "deductions" | "net"
  label: string
  value: number
}

export type DashboardUrgencyLevel = "critical" | "action" | "soon" | "clear"

type DashboardUrgency = {
  level: DashboardUrgencyLevel
  daysUntilPayout: number | null
  returnedCount: number
  completionPercent: number
}

export type DashboardSummary = {
  selectedPayroll: Payroll | null
  statusCounts: PayslipStatusCount[]
  totalPayslips: number
  reviewQueueCount: number
  reviewQueueStatus: PayslipStatus | null
  approvedCount: number
  attentionStatus: PayslipStatus | null
  returnedCount: number
  daysUntilPayout: number | null
  urgencyLevel: DashboardUrgencyLevel
  completionPercent: number
}

function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function getDaysUntilPayout(
  payoutDate: string,
  today: Date = new Date()
): number {
  const payout = startOfDay(parseIsoDate(payoutDate))
  const reference = startOfDay(today)
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((payout.getTime() - reference.getTime()) / msPerDay)
}

export function formatPayoutCountdown(days: number): string {
  if (days === 0) {
    return "Payout today"
  }
  if (days === 1) {
    return "Payout tomorrow"
  }
  if (days > 1) {
    return `Payout in ${days} days`
  }
  if (days === -1) {
    return "Payout was yesterday"
  }
  return `Payout was ${Math.abs(days)} days ago`
}

function getReturnedCount(payslips: Payslip[]): number {
  return payslips.filter((payslip) => payslip.status === "returned").length
}

function getCompletionPercent(payslips: Payslip[]): number {
  if (payslips.length === 0) {
    return 0
  }
  const completeCount = payslips.filter(
    (payslip) => payslip.status === "approved" || payslip.status === "sent"
  ).length
  return Math.round((completeCount / payslips.length) * 100)
}

function isPipelineComplete(payslips: Payslip[]): boolean {
  if (payslips.length === 0) {
    return true
  }
  return payslips.every(
    (payslip) => payslip.status === "approved" || payslip.status === "sent"
  )
}

function getDashboardUrgency(input: {
  payslips: Payslip[]
  role: Role
  payoutDate: string | null
  today?: Date
}): DashboardUrgency {
  const returnedCount = getReturnedCount(input.payslips)
  const reviewQueueCount = getReviewQueueCount(input.payslips, input.role)
  const daysUntilPayout = input.payoutDate
    ? getDaysUntilPayout(input.payoutDate, input.today)
    : null
  const completionPercent = getCompletionPercent(input.payslips)
  const pipelineComplete = isPipelineComplete(input.payslips)

  let level: DashboardUrgencyLevel = "clear"

  if (returnedCount > 0) {
    level = "critical"
  } else if (
    daysUntilPayout !== null &&
    daysUntilPayout <= 2 &&
    !pipelineComplete
  ) {
    level = "critical"
  } else if (reviewQueueCount > 0) {
    level = "action"
  } else if (
    daysUntilPayout !== null &&
    daysUntilPayout <= 5 &&
    daysUntilPayout >= 0
  ) {
    level = "soon"
  }

  return {
    level,
    daysUntilPayout,
    returnedCount,
    completionPercent,
  }
}

export function filterPayslipsForPayroll(
  payslips: Payslip[],
  payrollId: string
): Payslip[] {
  return payslips.filter((payslip) => payslip.payrollId === payrollId)
}

function countPayslipsByStatus(
  payslips: Payslip[]
): PayslipStatusCount[] {
  const counts = Object.fromEntries(
    PAYSLIP_STATUSES.map((status) => [status, 0])
  ) as Record<PayslipStatus, number>

  for (const payslip of payslips) {
    counts[payslip.status] += 1
  }

  return PAYSLIP_STATUSES.map((status) => ({
    status,
    label: formatPayslipStatus(status),
    count: counts[status],
  }))
}

export function buildStatusChartData(
  statusCounts: PayslipStatusCount[]
): StatusChartDatum[] {
  return statusCounts.map((item) => ({
      status: item.status,
      label: item.label,
      count: item.count,
      fill: PAYSLIP_STATUS_COLORS[item.status],
    }))
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

export function buildPayrollTotalsChartData(
  payslips: Payslip[]
): PayrollTotalsChartRow[] {
  const aggregated = payslips.reduce(
    (acc, payslip) => ({
      grossPay: acc.grossPay + payslip.totals.grossPay,
      totalDeductions: acc.totalDeductions + payslip.totals.totalDeductions,
      netPay: acc.netPay + payslip.totals.netPay,
    }),
    { grossPay: 0, totalDeductions: 0, netPay: 0 }
  )

  return [
    {
      key: "gross",
      label: "Gross",
      value: roundMoney(aggregated.grossPay),
    },
    {
      key: "deductions",
      label: "Deductions",
      value: roundMoney(aggregated.totalDeductions),
    },
    {
      key: "net",
      label: "Net",
      value: roundMoney(aggregated.netPay),
    },
  ]
}

function getReviewQueueStatus(role: Role): PayslipStatus | null {
  if (role === "admin") {
    return "pending"
  }
  if (role === "superAdmin") {
    return "adminApproved"
  }
  return null
}

function getReviewQueueCount(
  payslips: Payslip[],
  role: Role
): number {
  const queueStatus = getReviewQueueStatus(role)
  if (!queueStatus) {
    return 0
  }
  return payslips.filter((payslip) => payslip.status === queueStatus).length
}

function getAttentionStatus(role: Role): PayslipStatus | null {
  return getReviewQueueStatus(role)
}

export function buildDashboardSummary(input: {
  selectedPayroll: Payroll | null
  payslips: Payslip[]
  role: Role
}): DashboardSummary {
  const payrollPayslips = input.selectedPayroll
    ? filterPayslipsForPayroll(input.payslips, input.selectedPayroll.id)
    : []

  const statusCounts = countPayslipsByStatus(payrollPayslips)
  const approvedCount = payrollPayslips.filter(
    (payslip) => payslip.status === "approved"
  ).length
  const urgency = getDashboardUrgency({
    payslips: payrollPayslips,
    role: input.role,
    payoutDate: input.selectedPayroll?.payoutDate ?? null,
  })

  return {
    selectedPayroll: input.selectedPayroll,
    statusCounts,
    totalPayslips: payrollPayslips.length,
    reviewQueueCount: getReviewQueueCount(payrollPayslips, input.role),
    reviewQueueStatus: getReviewQueueStatus(input.role),
    approvedCount,
    attentionStatus: getAttentionStatus(input.role),
    returnedCount: urgency.returnedCount,
    daysUntilPayout: urgency.daysUntilPayout,
    urgencyLevel: urgency.level,
    completionPercent: urgency.completionPercent,
  }
}
