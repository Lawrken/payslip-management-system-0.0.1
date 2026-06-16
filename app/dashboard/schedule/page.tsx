import { redirect } from "next/navigation"
import { Suspense } from "react"

import { SchedulePageContent } from "@/components/dashboard/schedule/schedule-page-content"
import { requireDashboardSession } from "@/lib/authorization"
import { getEmployeeSchedulesByPayrollId } from "@/lib/employee-schedules"
import { getLatestPayroll, getPayrolls } from "@/lib/payrolls"
import { getPaginatedPayslips } from "@/lib/payslips"

export const dynamic = "force-dynamic"

type SchedulePageProps = {
  searchParams: Promise<{
    payrollId?: string
    page?: string
  }>
}

async function SchedulePageInner({ searchParams }: SchedulePageProps) {
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
  const [payslips, schedules] = selectedPayroll
    ? await Promise.all([
        getPaginatedPayslips({
          payrollId: selectedPayroll.id,
          page: params.page,
        }),
        getEmployeeSchedulesByPayrollId(selectedPayroll.id),
      ])
    : [
        {
          items: [],
          total: 0,
          page: 1,
          pageSize: 50,
          pageCount: 1,
        },
        [],
      ]

  return (
    <SchedulePageContent
      payslips={payslips}
      payrolls={payrolls}
      schedules={schedules}
      defaultPayrollId={latestPayroll?.id ?? null}
    />
  )
}

export default function SchedulePage({ searchParams }: SchedulePageProps) {
  return (
    <Suspense>
      <SchedulePageInner searchParams={searchParams} />
    </Suspense>
  )
}
