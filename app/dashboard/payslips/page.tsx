import { PayslipsPageContent } from "@/components/dashboard/payslips/payslips-page-content"
import { getEmployees } from "@/lib/employees"
import { getLatestPayroll, getPayrolls } from "@/lib/payrolls"
import { getPayslips } from "@/lib/payslips"
import { Suspense } from "react"

function PayslipsPageInner() {
  const payslips = getPayslips()
  const employees = getEmployees()
  const payrolls = getPayrolls()
  const latestPayroll = getLatestPayroll()

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
