import { PayslipsPageContent } from "@/components/dashboard/payslips/payslips-page-content"
import { getEmployees } from "@/lib/employees"
import { getLatestPayroll, getPayrolls } from "@/lib/payrolls"
import { getPayslips } from "@/lib/payslips"
import { Suspense } from "react"

export const dynamic = "force-dynamic"

async function PayslipsPageInner() {
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
