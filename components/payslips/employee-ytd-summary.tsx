"use client"

import * as React from "react"
import type { CSSProperties } from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PAYROLL_TOTALS_BACKGROUNDS,
  PAYROLL_TOTALS_COLORS,
} from "@/lib/dashboard-chart-colors"
import type {
  EmployeeYtdBreakdownItem,
  EmployeeYtdOverview,
  EmployeeYtdSummary,
} from "@/lib/types"
import { cn } from "@/lib/utils"

type EmployeeYtdSummaryCardProps = {
  overview: EmployeeYtdOverview
}

type BreakdownSectionKind = "pay" | "deduction" | "nonTaxable"

function formatMoney(value: number, { signed = false } = {}) {
  const absValue = Math.abs(value)
  const formatted = absValue.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  if (!signed || value === 0) {
    return `₱${formatted}`
  }

  return `${value < 0 ? "-" : "+"}₱${formatted}`
}

function getAmountClassName(value: number) {
  if (value > 0) {
    return "text-emerald-700 dark:text-emerald-400"
  }
  if (value < 0) {
    return "text-red-700 dark:text-red-400"
  }
  return "text-muted-foreground"
}

function getDisplayAmount(kind: BreakdownSectionKind, amount: number) {
  // Pay-detail amounts are already signed line amounts. Deductions are stored
  // as positive values but reduce pay, so they are shown as negative.
  return kind === "deduction" ? -amount : amount
}

function BreakdownSection({
  title,
  kind,
  items,
}: {
  title: string
  kind: BreakdownSectionKind
  items: EmployeeYtdBreakdownItem[]
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <dl className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => {
          const amount = getDisplayAmount(kind, item.amount)
          return (
            <div
              key={item.key}
              className="flex items-baseline justify-between gap-3 rounded-xl border bg-muted/30 px-3 py-2.5 text-sm"
            >
              <dt className="min-w-0 text-muted-foreground">{item.label}</dt>
              <dd className="shrink-0 font-medium tabular-nums">
                <span className={cn("font-semibold", getAmountClassName(amount))}>
                  {formatMoney(amount, { signed: true })}
                </span>
              </dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}

function YtdThirteenthMonthSection({ summary }: { summary: EmployeeYtdSummary }) {
  const payslipCountLabel = summary.includedPayslipCount.toLocaleString("en-PH")

  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-muted/20 p-4 sm:p-5">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold tracking-tight">
          13th Month Pay Estimate
        </h3>
        <p className="text-sm text-pretty text-muted-foreground">
          This estimate uses your year-to-date adjusted basic pay from{" "}
          {payslipCountLabel} released{" "}
          {summary.includedPayslipCount === 1 ? "payslip" : "payslips"} in{" "}
          {summary.year}. For each period, we start with basic pay and subtract
          absences, tardiness, and undertime, then add those amounts together.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_auto_minmax(0,1fr)] lg:items-stretch">
        <div className="dashboard-metric-card dashboard-chart-card rounded-xl p-4 ring-1 ring-foreground/10">
          <dt className="text-xs font-medium text-muted-foreground">
            Adjusted Basic Pay Basis
          </dt>
          <dd className="metric-value mt-2 text-2xl font-semibold tabular-nums tracking-tight">
            {formatMoney(summary.adjustedBasicPayBasis)}
          </dd>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Year-to-date total of{" "}
            <span className="font-medium text-foreground">
              basic pay − absences − tardiness − undertime
            </span>
            . This is the amount used before dividing by 12.
          </p>
        </div>

        <div className="flex items-center justify-center px-1 text-sm font-medium text-muted-foreground lg:py-4">
          <span className="rounded-full border bg-background px-3 py-1 tabular-nums">
            ÷ 12
          </span>
        </div>

        <div
          className="dashboard-metric-card rounded-xl p-4"
          style={
            {
              "--metric-bg": PAYROLL_TOTALS_BACKGROUNDS.gross,
              "--metric-chart": PAYROLL_TOTALS_COLORS.gross,
            } as CSSProperties
          }
        >
          <dt className="text-xs font-medium text-muted-foreground">
            Estimated 13th Month Pay
          </dt>
          <dd className="metric-value mt-2 text-2xl font-semibold tabular-nums tracking-tight">
            {formatMoney(summary.estimated13thMonthPay)}
          </dd>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Projected amount based on the adjusted basic pay basis above.
          </p>
        </div>
      </div>
    </section>
  )
}

function YtdMetricGrid({ summary }: { summary: EmployeeYtdSummary }) {
  const totalsRows = [
    { label: "Taxable Earnings", value: summary.totals.taxableEarnings },
    { label: "Total Deductions", value: summary.totals.totalDeductions },
    { label: "Non-Taxable Earnings", value: summary.totals.nonTaxableEarnings },
    { label: "Gross Pay", value: summary.totals.grossPay },
    { label: "Net Pay", value: summary.totals.netPay },
  ] as const

  const metricStyles: Partial<
    Record<(typeof totalsRows)[number]["label"], { bg: string; chart: string }>
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
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {totalsRows.map((row) => {
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

      <YtdThirteenthMonthSection summary={summary} />
    </div>
  )
}

export function EmployeeYtdSummaryCard({
  overview,
}: EmployeeYtdSummaryCardProps) {
  const { availableYears, summaries } = overview
  const [selectedYear, setSelectedYear] = React.useState(
    availableYears[0] ?? null
  )

  const summary = React.useMemo(() => {
    if (selectedYear === null) {
      return null
    }
    return summaries.find((item) => item.year === selectedYear) ?? null
  }, [summaries, selectedYear])

  const hasData = availableYears.length > 0

  return (
    <section className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight">
            Year-to-Date Summary
          </h2>
          <p className="text-sm text-muted-foreground">
            Money totals and 13th month estimate from your released payslips.
          </p>
        </div>
        {hasData && availableYears.length > 1 ? (
          <Select
            value={selectedYear !== null ? String(selectedYear) : undefined}
            onValueChange={(value) => setSelectedYear(Number(value))}
          >
            <SelectTrigger
              className="w-full sm:w-32"
              aria-label="Select year"
            >
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : hasData ? (
          <span className="text-sm font-medium tabular-nums text-muted-foreground">
            {availableYears[0]}
          </span>
        ) : null}
      </div>

      {!hasData || !summary ? (
        <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground">
          No released payslips yet. Your year-to-date summary will appear here
          once payslips are released to you.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <YtdMetricGrid summary={summary} />
          <div className="flex flex-col gap-5">
            <BreakdownSection
              title="Pay Details"
              kind="pay"
              items={summary.breakdown.payDetails}
            />
            <BreakdownSection
              title="Deductions"
              kind="deduction"
              items={summary.breakdown.deductions}
            />
            <BreakdownSection
              title="Non-Taxable Earnings"
              kind="nonTaxable"
              items={summary.breakdown.nonTaxableEarnings}
            />
          </div>
        </div>
      )}
    </section>
  )
}
