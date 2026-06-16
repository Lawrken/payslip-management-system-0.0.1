"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import * as React from "react"

import { EmployeeScheduleTable } from "@/components/dashboard/schedule/employee-schedule-table"
import { PaginationControls } from "@/components/dashboard/shared/pagination-controls"
import { PayrollPeriodCombobox } from "@/components/dashboard/shared/payroll-period-combobox"
import { PayrollPeriodStrip } from "@/components/dashboard/shared/payroll-period-strip"
import { isScheduleComplete, mergeScheduleDays } from "@/lib/schedule-days"
import type { PaginatedResult } from "@/lib/pagination"
import type {
  EmployeeSchedule,
  EmployeeScheduleRow,
  Payroll,
  Payslip,
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
  payslips: PaginatedResult<Payslip>
  payrolls: Payroll[]
  schedules: EmployeeSchedule[]
  defaultPayrollId: string | null
}

export function SchedulePageContent({
  payslips,
  payrolls,
  schedules,
  defaultPayrollId,
}: SchedulePageContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const payrollIdFromUrl = searchParams.get("payrollId")

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [activeEmployeeId, setActiveEmployeeId] = React.useState<string | null>(
    null
  )

  const selectedPayrollId = React.useMemo(() => {
    if (
      payrollIdFromUrl &&
      payrolls.some((payroll) => payroll.id === payrollIdFromUrl)
    ) {
      return payrollIdFromUrl
    }
    return defaultPayrollId ?? payrolls[0]?.id ?? ""
  }, [payrollIdFromUrl, payrolls, defaultPayrollId])

  const selectedPayroll = payrolls.find(
    (payroll) => payroll.id === selectedPayrollId
  )

  React.useEffect(() => {
    if (!selectedPayrollId || payrollIdFromUrl === selectedPayrollId) {
      return
    }
    const params = new URLSearchParams(searchParams.toString())
    params.set("payrollId", selectedPayrollId)
    router.replace(`/dashboard/schedule?${params.toString()}`, {
      scroll: false,
    })
  }, [selectedPayrollId, payrollIdFromUrl, router, searchParams])

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

  const scheduleRows = React.useMemo((): EmployeeScheduleRow[] => {
    if (!selectedPayroll) {
      return []
    }

    const scheduleByEmployeeId = new Map(
      schedules
        .filter((schedule) => schedule.payrollId === selectedPayrollId)
        .map((schedule) => [schedule.employeeId, schedule])
    )

    return payslips.items.map((payslip) => {
      const schedule = scheduleByEmployeeId.get(payslip.employeeId)
      const days = schedule
        ? mergeScheduleDays(selectedPayroll, schedule.days)
        : mergeScheduleDays(selectedPayroll)

      return {
        employeeId: payslip.employeeId,
        employeeName: payslip.employeeName,
        employeeNumber: payslip.employeeId,
        status:
          schedule && isScheduleComplete(selectedPayroll, days)
            ? "modified"
            : "notModified",
      }
    })
  }, [payslips.items, schedules, selectedPayroll, selectedPayrollId])

  const activeSchedule = React.useMemo(() => {
    if (!activeEmployeeId || !selectedPayrollId) {
      return null
    }
    return (
      schedules.find(
        (schedule) =>
          schedule.payrollId === selectedPayrollId &&
          schedule.employeeId === activeEmployeeId
      ) ?? null
    )
  }, [activeEmployeeId, schedules, selectedPayrollId])

  const activeRow = scheduleRows.find(
    (row) => row.employeeId === activeEmployeeId
  )

  function handleEdit(row: EmployeeScheduleRow) {
    setActiveEmployeeId(row.employeeId)
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
        </div>

        {selectedPayroll ? (
          <PayrollPeriodStrip payroll={selectedPayroll} />
        ) : null}
      </div>

      <EmployeeScheduleTable
        rows={scheduleRows}
        onEdit={handleEdit}
        emptyMessage="No employees for this payroll period yet."
      />
      <PaginationControls
        page={payslips.page}
        pageCount={payslips.pageCount}
        total={payslips.total}
        pageSize={payslips.pageSize}
        itemLabel="employees"
      />

      {selectedPayroll && activeRow ? (
        <EditEmployeeScheduleDialog
          payroll={selectedPayroll}
          employeeId={activeRow.employeeId}
          employeeName={activeRow.employeeName}
          schedule={activeSchedule}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      ) : null}
    </div>
  )
}
