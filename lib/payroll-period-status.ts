import type { SortDirection } from "@/lib/table-sort"
import type { Payslip, PayslipStatus } from "@/lib/types"

type PayrollPeriodStatusVariant = "muted" | "default" | "success"

export type PayrollPeriodStatus = {
  label: string
  variant: PayrollPeriodStatusVariant
}

export function getPayrollPeriodStatus(
  payslips: Payslip[]
): PayrollPeriodStatus {
  if (payslips.length === 0) {
    return { label: "No payslips", variant: "muted" }
  }

  if (payslips.every((payslip) => payslip.status === "sent")) {
    return { label: "Released", variant: "success" }
  }

  const allApprovedOrSent = payslips.every(
    (payslip) => payslip.status === "approved" || payslip.status === "sent"
  )
  if (allApprovedOrSent) {
    return { label: "Released", variant: "default" }
  }

  return { label: "In progress", variant: "muted" }
}

export function getPayrollPeriodStatusFromCounts(
  counts: Partial<Record<PayslipStatus, number>>
): PayrollPeriodStatus {
  const total = Object.values(counts).reduce(
    (sum, value) => sum + (value ?? 0),
    0
  )
  if (total === 0) {
    return { label: "No payslips", variant: "muted" }
  }

  const sent = counts.sent ?? 0
  if (sent === total) {
    return { label: "Released", variant: "success" }
  }

  const approvedOrSent = (counts.approved ?? 0) + sent
  if (approvedOrSent === total) {
    return { label: "Released", variant: "default" }
  }

  return { label: "In progress", variant: "muted" }
}

const PAYROLL_PERIOD_STATUS_SORT_RANK: Record<string, number> = {
  "No payslips": 0,
  "In progress": 1,
  Released: 2,
}

export function comparePayrollPeriodStatus(
  a: PayrollPeriodStatus,
  b: PayrollPeriodStatus,
  dir: SortDirection
): number {
  const rankA = PAYROLL_PERIOD_STATUS_SORT_RANK[a.label] ?? 0
  const rankB = PAYROLL_PERIOD_STATUS_SORT_RANK[b.label] ?? 0
  const diff = rankA - rankB
  return dir === "asc" ? diff : -diff
}
