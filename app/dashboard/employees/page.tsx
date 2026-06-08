import { redirect } from "next/navigation"

import { EmployeesPageContent } from "@/components/dashboard/employees/employees-page-content"
import { requireDashboardSession } from "@/lib/authorization"
import { getEmployees } from "@/lib/employees"

export const dynamic = "force-dynamic"

export default async function EmployeesPage() {
  const session = await requireDashboardSession()
  if ("error" in session) {
    redirect("/login")
  }

  const employees = await getEmployees()

  return <EmployeesPageContent employees={employees} />
}
