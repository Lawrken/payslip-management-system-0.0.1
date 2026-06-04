import { ReviewPageContent } from "@/components/dashboard/review/review-page-content"
import { getEmployees } from "@/lib/employees"
import { getLatestPayroll, getPayrolls } from "@/lib/payrolls"
import { getPayslips } from "@/lib/payslips"
import { getSession } from "@/lib/session"
import { Suspense } from "react"

export const dynamic = "force-dynamic"

async function ReviewPageInner() {
  const session = await getSession()

  if (!session) {
    return null
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
