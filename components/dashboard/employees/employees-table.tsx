import { EmployeeRowActions } from "@/components/dashboard/employees/employee-row-actions"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Employee } from "@/lib/types"

type EmployeesTableProps = {
  employees: Employee[]
  emptyMessage?: string
}

export function EmployeesTable({
  employees,
  emptyMessage = "No employees yet.",
}: EmployeesTableProps) {
  if (employees.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{emptyMessage}</p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee Name</TableHead>
          <TableHead>Employee ID</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>TIN</TableHead>
          <TableHead>SSS NO.</TableHead>
          <TableHead>PHIC NO.</TableHead>
          <TableHead>HDMF NO.</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((employee) => (
          <TableRow key={employee.id}>
            <TableCell className="font-medium">{employee.name}</TableCell>
            <TableCell>{employee.employeeId}</TableCell>
            <TableCell>{employee.email}</TableCell>
            <TableCell>{employee.tin}</TableCell>
            <TableCell>{employee.sssNo}</TableCell>
            <TableCell>{employee.phicNo}</TableCell>
            <TableCell>{employee.hdmfNo}</TableCell>
            <TableCell>
              <EmployeeRowActions employee={employee} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
