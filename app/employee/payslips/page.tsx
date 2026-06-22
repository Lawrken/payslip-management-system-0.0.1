import { redirect } from "next/navigation"

import { EmployeePayslipsWorkspace } from "@/components/payslips/employee-payslips-workspace"
import { EmployeePortalBackLink } from "@/components/payslips/employee-portal-back-link"
import { EmployeePortalSiblingLink } from "@/components/payslips/employee-portal-sibling-link"
import { requireEmployeeSession } from "@/lib/authorization"
import { getVisibleEmployeePayslipListItems } from "@/lib/payslips"

export const dynamic = "force-dynamic"

export default async function EmployeePayslipsPage() {
  const session = await requireEmployeeSession()
  if ("error" in session) {
    redirect("/login")
  }

  const payslipPeriods = await getVisibleEmployeePayslipListItems(
    session.employeeId
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <EmployeePortalBackLink />
        <EmployeePortalSiblingLink href="/employee/year-to-date">
          View Year to Date
        </EmployeePortalSiblingLink>
      </div>

      <EmployeePayslipsWorkspace payslipPeriods={payslipPeriods} />
    </div>
  )
}
