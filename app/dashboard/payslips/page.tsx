import { redirect } from "next/navigation"
import { Suspense } from "react"

import { PayslipsPageContent } from "@/components/dashboard/payslips/payslips-page-content"
import { requireDashboardSession } from "@/lib/authorization"
import { getEmployees } from "@/lib/employees"
import { getLatestPayroll, getPayrolls } from "@/lib/payrolls"
import { getPaginatedPayslips } from "@/lib/payslips"

export const dynamic = "force-dynamic"

type PayslipsPageProps = {
  searchParams: Promise<{
    payrollId?: string
    employeeId?: string
    page?: string
  }>
}

async function PayslipsPageInner({ searchParams }: PayslipsPageProps) {
  const session = await requireDashboardSession()
  if ("error" in session) {
    redirect("/login")
  }

  const params = await searchParams
  const [employees, payrolls, latestPayroll] = await Promise.all([
    getEmployees(),
    getPayrolls(),
    getLatestPayroll(),
  ])
  const selectedPayroll =
    payrolls.find((payroll) => payroll.id === params.payrollId) ??
    latestPayroll ??
    payrolls[0] ??
    null
  const payslips = selectedPayroll
    ? await getPaginatedPayslips({
        payrollId: selectedPayroll.id,
        employeeId: params.employeeId,
        page: params.page,
      })
    : {
        items: [],
        total: 0,
        page: 1,
        pageSize: 50,
        pageCount: 1,
      }

  return (
    <PayslipsPageContent
      payslips={payslips}
      employees={employees}
      payrolls={payrolls}
      defaultPayrollId={latestPayroll?.id ?? null}
    />
  )
}

export default function PayslipsPage({ searchParams }: PayslipsPageProps) {
  return (
    <Suspense>
      <PayslipsPageInner searchParams={searchParams} />
    </Suspense>
  )
}
