import type { Payslip } from "@/lib/types"

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
    return { label: "Sent", variant: "success" }
  }

  const allApprovedOrSent = payslips.every(
    (payslip) => payslip.status === "approved" || payslip.status === "sent"
  )
  const hasSent = payslips.some((payslip) => payslip.status === "sent")

  if (allApprovedOrSent && hasSent) {
    return { label: "In progress", variant: "muted" }
  }

  if (payslips.every((payslip) => payslip.status === "approved")) {
    return { label: "Ready for email", variant: "default" }
  }

  return { label: "In progress", variant: "muted" }
}
