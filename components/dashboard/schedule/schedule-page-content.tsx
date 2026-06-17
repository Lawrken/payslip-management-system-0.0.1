"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import * as React from "react"

import { getEmployeeScheduleAction } from "@/app/dashboard/schedule/actions"
import { EmployeeScheduleTable } from "@/components/dashboard/schedule/employee-schedule-table"
import { EmployeeCombobox } from "@/components/dashboard/shared/employee-combobox"
import { PaginationControls } from "@/components/dashboard/shared/pagination-controls"
import { PayrollPeriodCombobox } from "@/components/dashboard/shared/payroll-period-combobox"
import { PayrollPeriodStrip } from "@/components/dashboard/shared/payroll-period-strip"
import type { EmployeeOption } from "@/lib/employees"
import type { ScheduleRowSort } from "@/lib/employee-schedules"
import type { PaginatedResult } from "@/lib/pagination"
import type { SortDirection } from "@/lib/table-sort"
import type {
  EmployeeSchedule,
  EmployeeScheduleRow,
  Payroll,
  PayrollSummary,
} from "@/lib/types"

const EditEmployeeScheduleDialog = dynamic(
  () =>
    import("@/components/dashboard/schedule/edit-employee-schedule-dialog").then(
      (mod) => mod.EditEmployeeScheduleDialog
    ),
  {
    loading: () => null,
  }
)

type SchedulePageContentProps = {
  scheduleRows: PaginatedResult<EmployeeScheduleRow>
  payrolls: PayrollSummary[]
  selectedPayroll: Payroll | null
  employeeOptions: EmployeeOption[]
  selectedPayrollId: string
  employeeId: string
  status: string
  sortKey: ScheduleRowSort
  sortDir: SortDirection
}

export function SchedulePageContent({
  scheduleRows,
  payrolls,
  selectedPayroll,
  employeeOptions,
  selectedPayrollId,
  employeeId,
  status,
  sortKey,
  sortDir,
}: SchedulePageContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [activeEmployeeId, setActiveEmployeeId] = React.useState<string | null>(
    null
  )
  const [activeSchedule, setActiveSchedule] =
    React.useState<EmployeeSchedule | null>(null)
  const [isLoadingSchedule, setIsLoadingSchedule] = React.useState(false)

  const activeRow = scheduleRows.items.find(
    (row) => row.employeeId === activeEmployeeId
  )

  React.useEffect(() => {
    if (!dialogOpen || !selectedPayroll || !activeEmployeeId) {
      return
    }

    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) {
        setIsLoadingSchedule(true)
      }
    })
    void getEmployeeScheduleAction(
      selectedPayroll.id,
      activeEmployeeId
    ).then((result) => {
      if (cancelled) {
        return
      }
      setIsLoadingSchedule(false)
      if ("error" in result) {
        setActiveSchedule(null)
        return
      }
      setActiveSchedule(result.schedule)
    })

    return () => {
      cancelled = true
    }
  }, [dialogOpen, selectedPayroll, activeEmployeeId])

  function handlePayrollChange(payrollId: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (payrollId) {
      params.set("payrollId", payrollId)
    } else {
      params.delete("payrollId")
    }
    params.delete("page")
    router.replace(`/dashboard/schedule?${params.toString()}`, {
      scroll: false,
    })
    setActiveEmployeeId(null)
  }

  function replaceParams(params: URLSearchParams) {
    const query = params.toString()
    router.replace(query ? `/dashboard/schedule?${query}` : "/dashboard/schedule", {
      scroll: false,
    })
  }

  function handleStatusFilterChange(statusValue: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (statusValue) {
      params.set("status", statusValue)
    } else {
      params.delete("status")
    }
    params.delete("page")
    replaceParams(params)
    setActiveEmployeeId(null)
  }

  function handleEmployeeFilterChange(nextEmployeeId: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (nextEmployeeId) {
      params.set("employeeId", nextEmployeeId)
    } else {
      params.delete("employeeId")
    }
    params.delete("page")
    replaceParams(params)
    setActiveEmployeeId(null)
  }

  function handleSort(key: ScheduleRowSort) {
    const params = new URLSearchParams(searchParams.toString())
    const nextDirection =
      sortKey === key && sortDir === "asc" ? "desc" : "asc"
    params.set("sort", key)
    params.set("direction", nextDirection)
    params.delete("page")
    replaceParams(params)
  }

  function handleEdit(row: EmployeeScheduleRow) {
    setActiveEmployeeId(row.employeeId)
    setActiveSchedule(null)
    setDialogOpen(true)
  }

  if (payrolls.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Schedule</h1>
        <p className="text-sm text-muted-foreground">
          No payroll periods yet.{" "}
          <Link
            href="/dashboard/payrolls"
            className="text-foreground underline"
          >
            Create a payroll period
          </Link>{" "}
          before managing schedules.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Schedule</h1>

        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <PayrollPeriodCombobox
            payrolls={payrolls}
            value={selectedPayrollId}
            onChange={handlePayrollChange}
            className="w-full lg:w-80"
          />
          <EmployeeCombobox
            employees={employeeOptions}
            value={employeeId}
            onChange={handleEmployeeFilterChange}
            variant="filter"
          />
        </div>

        {selectedPayroll ? (
          <PayrollPeriodStrip payroll={selectedPayroll} />
        ) : null}
      </div>

      <EmployeeScheduleTable
        rows={scheduleRows.items}
        status={status}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        onStatusFilterChange={handleStatusFilterChange}
        onEdit={handleEdit}
        emptyMessage={
          status || employeeId
            ? "No employees match the selected filters."
            : "No employees for this payroll period yet."
        }
      />
      <PaginationControls
        page={scheduleRows.page}
        pageCount={scheduleRows.pageCount}
        total={scheduleRows.total}
        pageSize={scheduleRows.pageSize}
        itemLabel="employees"
      />

      {selectedPayroll && activeRow ? (
        <EditEmployeeScheduleDialog
          payroll={selectedPayroll}
          employeeId={activeRow.employeeId}
          employeeName={activeRow.employeeName}
          schedule={isLoadingSchedule ? null : activeSchedule}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      ) : null}
    </div>
  )
}
