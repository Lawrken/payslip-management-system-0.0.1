import {
  formatDisplayDate,
  formatDtrCutOffRange,
} from "@/lib/payroll-dates"
import type { Payroll } from "@/lib/types"

type PayrollPeriodStripProps = {
  payroll: Payroll
}

export function PayrollPeriodStrip({ payroll }: PayrollPeriodStripProps) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <div className="dashboard-metric-card dashboard-chart-card rounded-xl p-3.5">
        <p className="text-xs text-muted-foreground">Payroll period</p>
        <p className="mt-1 font-medium">{payroll.payrollPeriodLabel}</p>
      </div>
      <div className="dashboard-metric-card dashboard-chart-card rounded-xl p-3.5">
        <p className="text-xs text-muted-foreground">DTR cut-off</p>
        <p className="mt-1 font-medium tabular-nums">
          {formatDtrCutOffRange(payroll.dtrCutOffStart, payroll.dtrCutOffEnd)}
        </p>
      </div>
      <div className="dashboard-metric-card dashboard-chart-card rounded-xl p-3.5">
        <p className="text-xs text-muted-foreground">Payout date</p>
        <p className="mt-1 font-medium tabular-nums">
          {formatDisplayDate(payroll.payoutDate)}
        </p>
      </div>
    </div>
  )
}
