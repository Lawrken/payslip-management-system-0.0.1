"use client"

import * as React from "react"

import { AddEmployeeDialog } from "@/components/dashboard/employees/add-employee-dialog"
import { EmployeeCombobox } from "@/components/dashboard/shared/employee-combobox"
import { EmployeesTable } from "@/components/dashboard/employees/employees-table"
import { Button } from "@/components/ui/button"
import type { Employee } from "@/lib/types"

type EmployeesPageContentProps = {
  employees: Employee[]
}

export function EmployeesPageContent({ employees }: EmployeesPageContentProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState("")

  const filteredEmployees = React.useMemo(() => {
    if (!selectedEmployeeId) {
      return employees
    }
    return employees.filter(
      (employee) => employee.employeeId === selectedEmployeeId
    )
  }, [employees, selectedEmployeeId])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
        <div className="flex items-center gap-2">
          <EmployeeCombobox
            employees={employees}
            value={selectedEmployeeId}
            onChange={setSelectedEmployeeId}
            variant="filter"
          />
          <AddEmployeeDialog>
            <Button>Add Employee</Button>
          </AddEmployeeDialog>
        </div>
      </div>
      <EmployeesTable
        employees={filteredEmployees}
        emptyMessage={
          selectedEmployeeId
            ? "No employee matches that selection."
            : "No employees yet."
        }
      />
    </div>
  )
}
