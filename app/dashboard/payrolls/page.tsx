import { redirect } from "next/navigation"

import { PayrollsPageContent } from "@/components/dashboard/payrolls/payrolls-page-content"
import { requireDashboardSession } from "@/lib/authorization"
import { getPayrolls } from "@/lib/payrolls"
import { getPayrollPayslipMetricsByPayrollIds } from "@/lib/payslips"

export const dynamic = "force-dynamic"

export default async function PayrollsPage() {
  const session = await requireDashboardSession()
  if ("error" in session) {
    redirect("/login")
  }

  const payrolls = await getPayrolls()
  const metricsByPayrollId = await getPayrollPayslipMetricsByPayrollIds(
    payrolls.map((payroll) => payroll.id)
  )

  return (
    <PayrollsPageContent
      payrolls={payrolls}
      metricsByPayrollId={metricsByPayrollId}
    />
  )
}
