import { redirect } from "next/navigation"

import { EmployeePortalBackLink } from "@/components/payslips/employee-portal-back-link"
import { EmployeePortalSiblingLink } from "@/components/payslips/employee-portal-sibling-link"
import { EmployeeYtdSummaryCard } from "@/components/payslips/employee-ytd-summary"
import { requireEmployeeSession } from "@/lib/authorization"
import { getEmployeeYtdOverview } from "@/lib/payslips"

export const dynamic = "force-dynamic"

export default async function EmployeeYearToDatePage() {
  const session = await requireEmployeeSession()
  if ("error" in session) {
    redirect("/login")
  }

  const ytdOverview = await getEmployeeYtdOverview(session.employeeId)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <EmployeePortalBackLink />
        <EmployeePortalSiblingLink href="/employee/payslips">
          View Payslips
        </EmployeePortalSiblingLink>
      </div>

      <EmployeeYtdSummaryCard overview={ytdOverview} />
    </div>
  )
}
