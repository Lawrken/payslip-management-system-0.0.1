"use client"

import { useRouter, useSearchParams } from "next/navigation"

import { AddEmployeeDialog } from "@/components/dashboard/employees/add-employee-dialog"
import {
  EmployeesTable,
  type EmployeeColumnFilters,
} from "@/components/dashboard/employees/employees-table"
import { EmployeeCombobox } from "@/components/dashboard/shared/employee-combobox"
import { PaginationControls } from "@/components/dashboard/shared/pagination-controls"
import { Button } from "@/components/ui/button"
import type { EmployeeListSort, EmployeeOption } from "@/lib/employees"
import type { PaginatedResult } from "@/lib/pagination"
import type { SortDirection } from "@/lib/table-sort"
import type { Employee } from "@/lib/types"

type EmployeesPageContentProps = {
  employees: PaginatedResult<Employee>
  employeeOptions: EmployeeOption[]
  search: string
  filters: EmployeeColumnFilters
  sortKey: EmployeeListSort
  sortDir: SortDirection
}

export function EmployeesPageContent({
  employees,
  employeeOptions,
  search,
  filters,
  sortKey,
  sortDir,
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

  function replaceParams(params: URLSearchParams) {
    const query = params.toString()
    router.replace(query ? `/dashboard/employees?${query}` : "/dashboard/employees", {
      scroll: false,
    })
  }

  function handleColumnFilterChange(
    key: keyof EmployeeColumnFilters,
    value: string
  ) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete("page")
    replaceParams(params)
  }

  function handleSort(key: EmployeeListSort) {
    const params = new URLSearchParams(searchParams.toString())
    const nextDirection =
      sortKey === key && sortDir === "asc" ? "desc" : "asc"
    params.set("sort", key)
    params.set("direction", nextDirection)
    params.delete("page")
    replaceParams(params)
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
        filters={filters}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        onFilterChange={handleColumnFilterChange}
        emptyMessage={
          search || Object.values(filters).some(Boolean)
            ? "No employees match the selected filters."
            : "No employees yet."
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
