"use client"

import * as React from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

function YtdMetricGrid({ summary }: { summary: EmployeeYtdSummary }) {
  const totalsRows = [
    { label: "Taxable Earnings", value: summary.totals.taxableEarnings },
    { label: "Total Deductions", value: summary.totals.totalDeductions },
    { label: "Non-Taxable Earnings", value: summary.totals.nonTaxableEarnings },
    { label: "Gross Pay", value: summary.totals.grossPay },
    { label: "Net Pay", value: summary.totals.netPay },
  ]

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {totalsRows.map((row) => (
          <div
            key={row.label}
            className="dashboard-chart-card rounded-xl p-3.5"
          >
            <dt className="text-xs text-muted-foreground">{row.label}</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">
              {formatMoney(row.value)}
            </dd>
          </div>
        ))}
      </dl>

      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="dashboard-chart-card rounded-xl p-3.5">
          <dt className="text-xs text-muted-foreground">
            Adjusted Basic Pay Basis
          </dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums">
            {formatMoney(summary.adjustedBasicPayBasis)}
          </dd>
        </div>
        <div className="dashboard-chart-card rounded-xl p-3.5">
          <dt className="text-xs text-muted-foreground">
            Estimated 13th Month Pay
          </dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums">
            {formatMoney(summary.estimated13thMonthPay)}
          </dd>
        </div>
        <div className="dashboard-chart-card rounded-xl p-3.5">
          <dt className="text-xs text-muted-foreground">Included Payslips</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums">
            {summary.includedPayslipCount.toLocaleString("en-PH")}
          </dd>
        </div>
      </dl>
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
