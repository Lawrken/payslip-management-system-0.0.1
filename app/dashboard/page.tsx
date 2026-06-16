import { redirect } from "next/navigation"
import { Suspense } from "react"

import { DashboardPageContent } from "@/components/dashboard/dashboard-page-content"
import { requireDashboardSession } from "@/lib/authorization"
import {
  buildDashboardSummaryFromMetrics,
  buildPayrollTotalsChartDataFromMetrics,
  buildStatusChartData,
} from "@/lib/dashboard-summary"
import { getLatestPayroll, getPayrolls } from "@/lib/payrolls"
import { getPayrollPayslipMetrics } from "@/lib/payslips"

export const dynamic = "force-dynamic"

type DashboardPageProps = {
  searchParams: Promise<{
    payrollId?: string
  }>
}

async function DashboardPageInner({ searchParams }: DashboardPageProps) {
  const session = await requireDashboardSession()
  if ("error" in session) {
    redirect("/login")
  }

  const params = await searchParams
  const [payrolls, latestPayroll] = await Promise.all([
    getPayrolls(),
    getLatestPayroll(),
  ])
  const selectedPayroll =
    payrolls.find((payroll) => payroll.id === params.payrollId) ??
    latestPayroll ??
    payrolls[0] ??
    null
  const metrics = selectedPayroll
    ? await getPayrollPayslipMetrics(selectedPayroll.id)
    : null
  const summary = buildDashboardSummaryFromMetrics({
    selectedPayroll,
    metrics,
    role: session.role,
  })
  const totalsChartData = buildPayrollTotalsChartDataFromMetrics(metrics)
  const statusChartData = buildStatusChartData(summary.statusCounts)

  return (
    <DashboardPageContent
      session={session}
      payrolls={payrolls}
      defaultPayrollId={latestPayroll?.id ?? null}
      summary={summary}
      totalsChartData={totalsChartData}
      statusChartData={statusChartData}
    />
  )
}

export default function DashboardPage({ searchParams }: DashboardPageProps) {
  return (
    <Suspense>
      <DashboardPageInner searchParams={searchParams} />
    </Suspense>
  )
}
