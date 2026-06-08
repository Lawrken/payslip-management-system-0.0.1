import { redirect } from "next/navigation"
import { Suspense } from "react"

import { PayslipsPageContent } from "@/components/dashboard/payslips/payslips-page-content"
import { requireDashboardSession } from "@/lib/authorization"
import { getEmployees } from "@/lib/employees"
import { getLatestPayroll, getPayrolls } from "@/lib/payrolls"
import { getPayslips } from "@/lib/payslips"

export const dynamic = "force-dynamic"

async function PayslipsPageInner() {
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
    <PayslipsPageContent
      payslips={payslips}
      employees={employees}
      payrolls={payrolls}
      defaultPayrollId={latestPayroll?.id ?? null}
    />
  )
}

export default function PayslipsPage() {
  return (
    <Suspense>
      <PayslipsPageInner />
    </Suspense>
  )
}
