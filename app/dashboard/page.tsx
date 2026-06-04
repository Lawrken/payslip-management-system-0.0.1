import { redirect } from "next/navigation"

import { DashboardPageContent } from "@/components/dashboard/dashboard-page-content"
import { isDashboardRole } from "@/lib/auth-helpers"
import { buildDashboardSummary } from "@/lib/dashboard-summary"
import { getLatestPayroll } from "@/lib/payrolls"
import { getPayslips } from "@/lib/payslips"
import { getSession } from "@/lib/session"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await getSession()
  if (!session || !isDashboardRole(session.role)) {
    redirect("/login")
  }

  const [latestPayroll, payslips] = await Promise.all([
    getLatestPayroll(),
    getPayslips(),
  ])

  const summary = buildDashboardSummary({
    latestPayroll,
    payslips,
    role: session.role,
  })

  return <DashboardPageContent session={session} summary={summary} />
}
