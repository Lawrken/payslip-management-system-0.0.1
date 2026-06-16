"use client"

import { useRouter, useSearchParams } from "next/navigation"

import { AddEmployeeDialog } from "@/components/dashboard/employees/add-employee-dialog"
import { EmployeesTable } from "@/components/dashboard/employees/employees-table"
import { EmployeeCombobox } from "@/components/dashboard/shared/employee-combobox"
import { PaginationControls } from "@/components/dashboard/shared/pagination-controls"
import { Button } from "@/components/ui/button"
import type { EmployeeOption } from "@/lib/employees"
import type { PaginatedResult } from "@/lib/pagination"
import type { Employee } from "@/lib/types"

type EmployeesPageContentProps = {
  employees: PaginatedResult<Employee>
  employeeOptions: EmployeeOption[]
  search: string
}

export function EmployeesPageContent({
  employees,
  employeeOptions,
  search,
}: EmployeesPageContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedEmployee = employeeOptions.find(
    (employee) => employee.employeeId === search
  )

  function handleEmployeeFilterChange(employeeId: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (employeeId) {
      params.set("search", employeeId)
    } else {
      params.delete("search")
    }
    params.delete("page")
    router.replace(`/dashboard/employees?${params.toString()}`, {
      scroll: false,
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
        <div className="flex items-center gap-2">
          <EmployeeCombobox
            employees={employeeOptions}
            value={selectedEmployee?.employeeId ?? ""}
            onChange={handleEmployeeFilterChange}
            variant="filter"
          />
          <AddEmployeeDialog>
            <Button>Add Employee</Button>
          </AddEmployeeDialog>
        </div>
      </div>
      <EmployeesTable
        employees={employees.items}
        emptyMessage={
          search ? "No employees match that search." : "No employees yet."
        }
      />
      <PaginationControls
        page={employees.page}
        pageCount={employees.pageCount}
        total={employees.total}
        pageSize={employees.pageSize}
        itemLabel="employees"
      />
    </div>
  )
}
