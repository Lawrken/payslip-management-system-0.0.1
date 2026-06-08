import { redirect } from "next/navigation"
import { Suspense } from "react"

import { ReviewPageContent } from "@/components/dashboard/review/review-page-content"
import { requireDashboardSession } from "@/lib/authorization"
import { getEmployees } from "@/lib/employees"
import { getLatestPayroll, getPayrolls } from "@/lib/payrolls"
import { getPayslips } from "@/lib/payslips"

export const dynamic = "force-dynamic"

async function ReviewPageInner() {
  const session = await requireDashboardSession()
  if ("error" in session) {
    redirect("/login")
  }

  const [payslips, employees, payrolls, latestPayroll] = await Promise.all([
    getPayslips(),
    getEmployees(),
    getPayrolls(),
    getLatestPayroll(),
  ])

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

export default function ReviewPage() {
  return (
    <Suspense>
      <ReviewPageInner />
    </Suspense>
  )
}
