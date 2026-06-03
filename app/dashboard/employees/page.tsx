import { EmployeesPageContent } from "@/components/dashboard/employees/employees-page-content"
import { getEmployees } from "@/lib/employees"

export default function EmployeesPage() {
  const employees = getEmployees()

  return <EmployeesPageContent employees={employees} />
}
