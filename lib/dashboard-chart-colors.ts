import type { ChartConfig } from "@/components/ui/chart"
import { formatPayslipStatus } from "@/lib/payslip-status"
import type { PayslipStatus } from "@/lib/types"

export const PAYSLIP_STATUS_COLORS: Record<PayslipStatus, string> = {
  draft: "var(--dashboard-status-draft-chart)",
  pending: "var(--dashboard-status-pending-chart)",
  adminApproved: "var(--dashboard-status-admin-approved-chart)",
  approved: "var(--dashboard-status-approved-chart)",
  returned: "var(--dashboard-status-returned-chart)",
  sent: "var(--dashboard-status-sent-chart)",
}

export const PAYROLL_TOTALS_COLORS = {
  gross: "var(--dashboard-totals-gross-chart)",
  deductions: "var(--dashboard-totals-deductions-chart)",
  net: "var(--dashboard-totals-net-chart)",
} as const

export const PAYROLL_TOTALS_BACKGROUNDS = {
  gross: "var(--dashboard-totals-gross-bg)",
  deductions: "var(--dashboard-totals-deductions-bg)",
  net: "var(--dashboard-totals-net-bg)",
} as const

function chartTheme(color: string) {
  return { light: color, dark: color } as const
}

export function buildStatusChartConfig(): ChartConfig {
  return (Object.keys(PAYSLIP_STATUS_COLORS) as PayslipStatus[]).reduce(
    (config, status) => {
      config[status] = {
        label: formatPayslipStatus(status),
        theme: chartTheme(PAYSLIP_STATUS_COLORS[status]),
      }
      return config
    },
    {} as ChartConfig
  )
}

export const totalsChartConfig = {
  gross: {
    label: "Gross",
    theme: chartTheme(PAYROLL_TOTALS_COLORS.gross),
  },
  deductions: {
    label: "Deductions",
    theme: chartTheme(PAYROLL_TOTALS_COLORS.deductions),
  },
  net: {
    label: "Net",
    theme: chartTheme(PAYROLL_TOTALS_COLORS.net),
  },
} satisfies ChartConfig
