"use client"

import { Bar, BarChart, Cell, Pie, PieChart, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  buildStatusChartConfig,
  PAYROLL_TOTALS_COLORS,
  totalsChartConfig,
} from "@/lib/dashboard-chart-colors"
import type {
  PayrollTotalsChartRow,
  StatusChartDatum,
} from "@/lib/dashboard-summary"

const CHART_HEIGHT = "h-[240px]"
const CHART_CONTAINER_CLASS = "!aspect-auto h-[240px] max-h-[240px] w-full min-w-0"

function formatPhp(value: number) {
  return value.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatPhpAxis(value: number) {
  const abs = Math.abs(value)

  if (abs >= 1_000_000) {
    return `₱${(value / 1_000_000).toFixed(1)}M`
  }

  if (abs >= 1_000) {
    return `₱${(value / 1_000).toFixed(0)}K`
  }

  if (value === 0) {
    return "₱0"
  }

  return formatPhp(value)
}

type DashboardChartsProps = {
  payrollLabel: string
  totalPayslips: number
  statusData: StatusChartDatum[]
  totalsData: PayrollTotalsChartRow[]
}

function StatusChartLegend({ data }: { data: StatusChartDatum[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
      {data.map((item) => (
        <div key={item.status} className="flex items-center gap-1.5 text-xs">
          <div
            className="h-2 w-2 shrink-0 rounded-[2px]"
            style={{ backgroundColor: item.fill }}
          />
          <span className="text-muted-foreground">{item.label}</span>
          <span className="font-medium tabular-nums text-foreground">
            {item.count}
          </span>
        </div>
      ))}
    </div>
  )
}

function TotalsChartLegend({ data }: { data: PayrollTotalsChartRow[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
      {data.map((item) => (
        <div key={item.key} className="flex items-center gap-1.5 text-xs">
          <div
            className="h-2 w-2 shrink-0 rounded-[2px]"
            style={{ backgroundColor: PAYROLL_TOTALS_COLORS[item.key] }}
          />
          <span className="text-muted-foreground">{item.label}</span>
          <span className="font-medium tabular-nums text-foreground">
            {formatPhp(item.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

function ChartEmptyState({ message }: { message: string }) {
  return (
    <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
      {message}
    </p>
  )
}

export function DashboardCharts({
  payrollLabel,
  totalPayslips,
  statusData,
  totalsData,
}: DashboardChartsProps) {
  const statusChartConfig = buildStatusChartConfig()
  const emptyMessage =
    totalPayslips === 0
      ? "No payslips for this payroll period yet."
      : "No chart data available."

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      <Card
        className="dashboard-chart-card w-full self-start ring-0 shadow-none"
        size="sm"
      >
        <CardHeader className="shrink-0">
          <CardTitle>Payslip status</CardTitle>
          <CardDescription>Breakdown for {payrollLabel}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className={`flex ${CHART_HEIGHT} justify-center`}>
            <ChartContainer
              config={statusChartConfig}
              className={`aspect-square ${CHART_HEIGHT} w-full max-w-[240px]`}
            >
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent hideLabel nameKey="status" />
                  }
                />
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={56}
                  outerRadius={88}
                  strokeWidth={2}
                >
                  {statusData.map((item) => (
                    <Cell key={item.status} fill={item.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>
          <StatusChartLegend data={statusData} />
        </CardContent>
      </Card>

      <Card
        className="dashboard-chart-card w-full self-start ring-0 shadow-none"
        size="sm"
      >
        <CardHeader className="shrink-0">
          <CardTitle>Payroll totals</CardTitle>
          <CardDescription>
            Aggregated gross, deductions, and net for {payrollLabel}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className={`flex ${CHART_HEIGHT} justify-center`}>
            {totalPayslips === 0 ? (
              <ChartEmptyState message={emptyMessage} />
            ) : (
              <ChartContainer
                config={totalsChartConfig}
                className={CHART_CONTAINER_CLASS}
                initialDimension={{ width: 400, height: 240 }}
              >
                <BarChart
                  data={totalsData}
                  accessibilityLayer
                  margin={{ top: 8, right: 16, bottom: 0, left: 16 }}
                >
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    width={64}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={4}
                    domain={[0, "dataMax"]}
                    tickFormatter={(value) =>
                      typeof value === "number"
                        ? formatPhpAxis(value)
                        : String(value)
                    }
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => (
                          <span className="font-medium tabular-nums">
                            {formatPhp(Number(value))}
                          </span>
                        )}
                      />
                    }
                  />
                  <Bar dataKey="value" radius={6}>
                    {totalsData.map((item) => (
                      <Cell key={item.key} fill={`var(--color-${item.key})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </div>
          <TotalsChartLegend data={totalsData} />
        </CardContent>
      </Card>
    </div>
  )
}
