"use client"

import type { CSSProperties } from "react"

import {
  PAYROLL_TOTALS_BACKGROUNDS,
  PAYROLL_TOTALS_COLORS,
} from "@/lib/dashboard-chart-colors"
import type { PayrollTotalsChartRow } from "@/lib/dashboard-summary"
import { cn } from "@/lib/utils"

type DashboardTotalsStripProps = {
  totalsData: PayrollTotalsChartRow[]
}

function formatPhp(value: number) {
  return value.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function DashboardTotalsStrip({ totalsData }: DashboardTotalsStripProps) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {totalsData.map((item) => {
        const isZero = item.value === 0

        return (
          <div
            key={item.key}
            data-total={item.key}
            data-zero={isZero ? "true" : "false"}
            className="dashboard-metric-card rounded-xl p-3.5"
            style={
              {
                "--metric-bg": PAYROLL_TOTALS_BACKGROUNDS[item.key],
                "--metric-chart": PAYROLL_TOTALS_COLORS[item.key],
              } as CSSProperties
            }
          >
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p
              className={cn(
                "metric-value mt-1 text-xl font-semibold tabular-nums",
                isZero && "font-medium"
              )}
            >
              {formatPhp(item.value)}
            </p>
          </div>
        )
      })}
    </div>
  )
}
