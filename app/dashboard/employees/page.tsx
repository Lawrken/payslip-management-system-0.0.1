import { EmployeesPageContent } from "@/components/dashboard/employees/employees-page-content"
import { getEmployees } from "@/lib/employees"

export const dynamic = "force-dynamic"

export default async function EmployeesPage() {
  const employees = await getEmployees()

  return <EmployeesPageContent employees={employees} />
}
