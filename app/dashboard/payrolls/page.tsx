import { redirect } from "next/navigation"

import { PayrollsPageContent } from "@/components/dashboard/payrolls/payrolls-page-content"
import { requireDashboardSession } from "@/lib/authorization"
import { getPayrolls } from "@/lib/payrolls"
import { getPayslips } from "@/lib/payslips"
import type { Payslip } from "@/lib/types"

export const dynamic = "force-dynamic"

function groupPayslipsByPayrollId(
  payslips: Payslip[]
): Record<string, Payslip[]> {
  const grouped: Record<string, Payslip[]> = {}

  for (const payslip of payslips) {
    const list = grouped[payslip.payrollId] ?? []
    list.push(payslip)
    grouped[payslip.payrollId] = list
  }

  return grouped
}

export default async function PayrollsPage() {
  const session = await requireDashboardSession()
  if ("error" in session) {
    redirect("/login")
  }

  const [payrolls, payslips] = await Promise.all([getPayrolls(), getPayslips()])
  const payslipsByPayrollId = groupPayslipsByPayrollId(payslips)

  return (
    <PayrollsPageContent
      payrolls={payrolls}
      payslipsByPayrollId={payslipsByPayrollId}
    />
  )
}
