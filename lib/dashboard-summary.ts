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

export type DashboardSummary = {
  latestPayroll: Payroll | null
  statusCounts: PayslipStatusCount[]
  totalPayslips: number
  reviewQueueCount: number
  reviewQueueStatus: PayslipStatus | null
  approvedCount: number
  attentionStatus: PayslipStatus | null
}

export function filterPayslipsForPayroll(
  payslips: Payslip[],
  payrollId: string
): Payslip[] {
  return payslips.filter((payslip) => payslip.payrollId === payrollId)
}

export function countPayslipsByStatus(
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

export function getReviewQueueStatus(role: Role): PayslipStatus | null {
  if (role === "admin") {
    return "pending"
  }
  if (role === "superAdmin") {
    return "adminApproved"
  }
  return null
}

export function getReviewQueueCount(
  payslips: Payslip[],
  role: Role
): number {
  const queueStatus = getReviewQueueStatus(role)
  if (!queueStatus) {
    return 0
  }
  return payslips.filter((payslip) => payslip.status === queueStatus).length
}

export function getAttentionStatus(role: Role): PayslipStatus | null {
  return getReviewQueueStatus(role)
}

export function buildDashboardSummary(input: {
  latestPayroll: Payroll | null
  payslips: Payslip[]
  role: Role
}): DashboardSummary {
  const payrollPayslips = input.latestPayroll
    ? filterPayslipsForPayroll(input.payslips, input.latestPayroll.id)
    : []

  const statusCounts = countPayslipsByStatus(payrollPayslips)
  const approvedCount = payrollPayslips.filter(
    (payslip) => payslip.status === "approved"
  ).length

  return {
    latestPayroll: input.latestPayroll,
    statusCounts,
    totalPayslips: payrollPayslips.length,
    reviewQueueCount: getReviewQueueCount(payrollPayslips, input.role),
    reviewQueueStatus: getReviewQueueStatus(input.role),
    approvedCount,
    attentionStatus: getAttentionStatus(input.role),
  }
}
