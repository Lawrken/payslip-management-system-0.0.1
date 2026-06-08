"use client"

import type { DashboardSummary } from "@/lib/dashboard-summary"
import { cn } from "@/lib/utils"

type DashboardStatusStripProps = {
  summary: DashboardSummary
}

export function DashboardStatusStrip({ summary }: DashboardStatusStripProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {summary.statusCounts.map((item) => {
        const isZero = item.count === 0

        return (
          <div
            key={item.status}
            data-status={item.status}
            data-zero={isZero ? "true" : "false"}
            className="dashboard-metric-card dashboard-chart-card rounded-xl p-3.5"
          >
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p
              className={cn(
                "metric-value mt-1 text-xl font-semibold tabular-nums",
                isZero && "font-medium"
              )}
            >
              {item.count}
            </p>
          </div>
        )
      })}
    </div>
  )
}
