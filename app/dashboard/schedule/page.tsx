import { redirect } from "next/navigation"
import { Suspense } from "react"

import { SchedulePageContent } from "@/components/dashboard/schedule/schedule-page-content"
import { requireDashboardSession } from "@/lib/authorization"
import { getAllEmployeeSchedules } from "@/lib/employee-schedules"
import { getLatestPayroll, getPayrolls } from "@/lib/payrolls"
import { getPayslips } from "@/lib/payslips"

export const dynamic = "force-dynamic"

async function SchedulePageInner() {
  const session = await requireDashboardSession()
  if ("error" in session) {
    redirect("/login")
  }

  const [payslips, payrolls, schedules, latestPayroll] = await Promise.all([
    getPayslips(),
    getPayrolls(),
    getAllEmployeeSchedules(),
    getLatestPayroll(),
  ])

  return (
    <SchedulePageContent
      payslips={payslips}
      payrolls={payrolls}
      schedules={schedules}
      defaultPayrollId={latestPayroll?.id ?? null}
    />
  )
}

export default function SchedulePage() {
  return (
    <Suspense>
      <SchedulePageInner />
    </Suspense>
  )
}
