import { redirect } from "next/navigation"
import { Suspense } from "react"

import { DashboardPageContent } from "@/components/dashboard/dashboard-page-content"
import { requireDashboardSession } from "@/lib/authorization"
import {
  buildDashboardSummaryFromMetrics,
  buildPayrollTotalsChartDataFromMetrics,
  buildStatusChartData,
} from "@/lib/dashboard-summary"
import { redirectWithDefaultPayrollId } from "@/lib/dashboard-routing"
import { getPayrollSummaries } from "@/lib/payrolls"
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
  const payrolls = await getPayrollSummaries()
  const latestPayrollId = payrolls[0]?.id ?? null
  redirectWithDefaultPayrollId("/dashboard", params, latestPayrollId)

  const selectedPayroll =
    payrolls.find((payroll) => payroll.id === params.payrollId) ??
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
      selectedPayrollId={selectedPayroll?.id ?? ""}
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
