import { redirect } from "next/navigation"
import { Suspense } from "react"

import { DashboardPageContent } from "@/components/dashboard/dashboard-page-content"
import { requireDashboardSession } from "@/lib/authorization"
import { getLatestPayroll, getPayrolls } from "@/lib/payrolls"
import { getPayslips } from "@/lib/payslips"

export const dynamic = "force-dynamic"

async function DashboardPageInner() {
  const session = await requireDashboardSession()
  if ("error" in session) {
    redirect("/login")
  }

  const [payrolls, payslips, latestPayroll] = await Promise.all([
    getPayrolls(),
    getPayslips(),
    getLatestPayroll(),
  ])

  return (
    <DashboardPageContent
      session={session}
      payrolls={payrolls}
      payslips={payslips}
      defaultPayrollId={latestPayroll?.id ?? null}
    />
  )
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardPageInner />
    </Suspense>
  )
}
