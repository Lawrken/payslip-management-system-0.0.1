import { redirect } from "next/navigation"
import { Suspense } from "react"

import { ReviewPageContent } from "@/components/dashboard/review/review-page-content"
import { requireDashboardSession } from "@/lib/authorization"
import { getEmployees } from "@/lib/employees"
import { getLatestPayroll, getPayrolls } from "@/lib/payrolls"
import { getPaginatedPayslips } from "@/lib/payslips"
import type { PayslipStatus } from "@/lib/types"

export const dynamic = "force-dynamic"

type ReviewPageProps = {
  searchParams: Promise<{
    payrollId?: string
    page?: string
  }>
}

function getReviewStatuses(role: string): PayslipStatus[] {
  if (role === "admin") {
    return ["pending"]
  }
  if (role === "superAdmin") {
    return ["adminApproved", "approved"]
  }
  return []
}

async function ReviewPageInner({ searchParams }: ReviewPageProps) {
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
        statuses: getReviewStatuses(session.role),
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
    <ReviewPageContent
      payslips={payslips}
      employees={employees}
      payrolls={payrolls}
      defaultPayrollId={latestPayroll?.id ?? null}
      role={session.role}
    />
  )
}

export default function ReviewPage({ searchParams }: ReviewPageProps) {
  return (
    <Suspense>
      <ReviewPageInner searchParams={searchParams} />
    </Suspense>
  )
}
