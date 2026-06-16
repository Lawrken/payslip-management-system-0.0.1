import { redirect } from "next/navigation"

import { EmployeesPageContent } from "@/components/dashboard/employees/employees-page-content"
import { requireDashboardSession } from "@/lib/authorization"
import { getEmployeeOptions, getPaginatedEmployees } from "@/lib/employees"

export const dynamic = "force-dynamic"

type EmployeesPageProps = {
  searchParams: Promise<{
    search?: string
    page?: string
  }>
}

export default async function EmployeesPage({
  searchParams,
}: EmployeesPageProps) {
  const session = await requireDashboardSession()
  if ("error" in session) {
    redirect("/login")
  }

  const params = await searchParams
  const [employees, employeeOptions] = await Promise.all([
    getPaginatedEmployees({
      search: params.search,
      page: params.page,
    }),
    getEmployeeOptions(),
  ])

  return (
    <EmployeesPageContent
      employees={employees}
      employeeOptions={employeeOptions}
      search={params.search ?? ""}
    />
  )
}
