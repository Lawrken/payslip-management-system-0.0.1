import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { PayslipTotals } from "@/lib/types"

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
    return (
      <div className="rounded-lg border bg-muted/40 p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Summary
        </p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3 lg:grid-cols-5">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">{row.label}</dt>
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
