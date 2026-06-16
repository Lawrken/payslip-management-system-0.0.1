import type { CSSProperties } from "react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  PAYROLL_TOTALS_BACKGROUNDS,
  PAYROLL_TOTALS_COLORS,
} from "@/lib/dashboard-chart-colors"
import type { PayslipTotals } from "@/lib/types"
import { cn } from "@/lib/utils"

type PayslipSummaryProps = {
  totals: PayslipTotals
  variant?: "card" | "compact" | "inline"
}

function formatMoney(value: number) {
  return value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function PayslipSummary({
  totals,
  variant = "card",
}: PayslipSummaryProps) {
  const rows = [
    { label: "Taxable Earnings", value: totals.taxableEarnings },
    { label: "Total Deductions", value: totals.totalDeductions },
    { label: "Non-Taxable Earnings", value: totals.nonTaxableEarnings },
    { label: "Gross Pay", value: totals.grossPay },
    { label: "Net Pay", value: totals.netPay },
  ]

  if (variant === "inline") {
    return (
      <dl className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline gap-1.5">
            <dt className="text-muted-foreground">{row.label}:</dt>
            <dd
              className={
                row.label === "Net Pay"
                  ? "font-semibold tabular-nums"
                  : "font-medium tabular-nums"
              }
            >
              {formatMoney(row.value)}
            </dd>
          </div>
        ))}
      </dl>
    )
  }

  if (variant === "compact") {
    const metricStyles: Partial<
      Record<(typeof rows)[number]["label"], { bg: string; chart: string }>
    > = {
      "Gross Pay": {
        bg: PAYROLL_TOTALS_BACKGROUNDS.gross,
        chart: PAYROLL_TOTALS_COLORS.gross,
      },
      "Total Deductions": {
        bg: PAYROLL_TOTALS_BACKGROUNDS.deductions,
        chart: PAYROLL_TOTALS_COLORS.deductions,
      },
      "Net Pay": {
        bg: PAYROLL_TOTALS_BACKGROUNDS.net,
        chart: PAYROLL_TOTALS_COLORS.net,
      },
    }

    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Summary</p>
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {rows.map((row) => {
            const metric = metricStyles[row.label]
            const isZero = row.value === 0

            if (!metric) {
              return (
                <div
                  key={row.label}
                  data-zero={isZero ? "true" : "false"}
                  className="dashboard-metric-card dashboard-chart-card rounded-xl p-3.5"
                >
                  <dt className="text-xs text-muted-foreground">{row.label}</dt>
                  <dd
                    className={cn(
                      "metric-value mt-1 text-lg font-semibold tabular-nums",
                      isZero && "font-medium"
                    )}
                  >
                    {formatMoney(row.value)}
                  </dd>
                </div>
              )
            }

            return (
              <div
                key={row.label}
                data-zero={isZero ? "true" : "false"}
                className="dashboard-metric-card rounded-xl p-3.5"
                style={
                  {
                    "--metric-bg": metric.bg,
                    "--metric-chart": metric.chart,
                  } as CSSProperties
                }
              >
                <dt className="text-xs text-muted-foreground">{row.label}</dt>
                <dd
                  className={cn(
                    "metric-value mt-1 text-lg font-semibold tabular-nums",
                    isZero && "font-medium"
                  )}
                >
                  {formatMoney(row.value)}
                </dd>
              </div>
            )
          })}
        </dl>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-4 border-b border-border pb-2 last:border-0"
            >
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="font-medium tabular-nums">
                {formatMoney(row.value)}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}
