"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import * as React from "react"

import { BulkEmailDialog } from "@/components/dashboard/payslips/bulk-email-dialog"
import { EditPayslipDialog } from "@/components/dashboard/payslips/edit-payslip-dialog"
import { EmployeeCombobox } from "@/components/dashboard/shared/employee-combobox"
import { PayrollPeriodCombobox } from "@/components/dashboard/shared/payroll-period-combobox"
import { PayslipsTable } from "@/components/dashboard/payslips/payslips-table"
import { Button } from "@/components/ui/button"
import {
  formatDisplayDate,
  formatDtrCutOffRange,
} from "@/lib/payroll-dates"
import type { Employee, Payroll, Payslip } from "@/lib/types"

type PayslipsPageContentProps = {
  payslips: Payslip[]
  employees: Employee[]
  payrolls: Payroll[]
  defaultPayrollId: string | null
}

export function PayslipsPageContent({
  payslips,
  employees,
  payrolls,
  defaultPayrollId,
}: PayslipsPageContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const payrollIdFromUrl = searchParams.get("payrollId")

  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState("")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [activePayslipId, setActivePayslipId] = React.useState<string | null>(
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
    router.replace(`/dashboard/payslips?${params.toString()}`, {
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
    router.replace(`/dashboard/payslips?${params.toString()}`, {
      scroll: false,
    })
    setActivePayslipId(null)
  }

  const payrollPayslips = React.useMemo(() => {
    if (!selectedPayrollId) {
      return []
    }
    return payslips.filter((payslip) => payslip.payrollId === selectedPayrollId)
  }, [payslips, selectedPayrollId])

  const filteredPayslips = React.useMemo(() => {
    if (!selectedEmployeeId) {
      return payrollPayslips
    }
    return payrollPayslips.filter(
      (payslip) => payslip.employeeId === selectedEmployeeId
    )
  }, [payrollPayslips, selectedEmployeeId])

  const activeIndex = activePayslipId
    ? filteredPayslips.findIndex((payslip) => payslip.id === activePayslipId)
    : -1

  const pendingCount = payrollPayslips.filter(
    (payslip) => payslip.status === "pending"
  ).length

  function handleActiveIndexChange(index: number) {
    if (index < 0) {
      setActivePayslipId(null)
      return
    }
    setActivePayslipId(filteredPayslips[index]?.id ?? null)
  }

  function handleEdit(payslip: Payslip) {
    setActivePayslipId(payslip.id)
    setDialogOpen(true)
  }

  if (payrolls.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Payslips</h1>
        <p className="text-sm text-muted-foreground">
          No payroll periods yet.{" "}
          <Link href="/dashboard/payrolls" className="text-foreground underline">
            Create a payroll period
          </Link>{" "}
          before editing payslips.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Payslips</h1>

        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <PayrollPeriodCombobox
            payrolls={payrolls}
            value={selectedPayrollId}
            onChange={handlePayrollChange}
            className="w-full lg:w-80"
          />
          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            <EmployeeCombobox
              employees={employees}
              value={selectedEmployeeId}
              onChange={setSelectedEmployeeId}
              variant="filter"
            />
            <BulkEmailDialog
              pendingCount={pendingCount}
              payrollId={selectedPayrollId}
            >
              <Button type="button" variant="outline">
                Bulk Email
              </Button>
            </BulkEmailDialog>
            {selectedPayrollId ? (
              <EditPayslipDialog
                employees={employees}
                payslips={filteredPayslips}
                payrollId={selectedPayrollId}
                activeIndex={activeIndex}
                onActiveIndexChange={handleActiveIndexChange}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
              >
                <Button>Edit Payslip</Button>
              </EditPayslipDialog>
            ) : null}
          </div>
        </div>

        {selectedPayroll ? (
          <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
            <dl className="grid gap-2 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Payroll Period
                </dt>
                <dd className="mt-0.5 font-medium">
                  {selectedPayroll.payrollPeriodLabel}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  DTR Cut-Off
                </dt>
                <dd className="mt-0.5 font-medium">
                  {formatDtrCutOffRange(
                    selectedPayroll.dtrCutOffStart,
                    selectedPayroll.dtrCutOffEnd
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Payout Date
                </dt>
                <dd className="mt-0.5 font-medium">
                  {formatDisplayDate(selectedPayroll.payoutDate)}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}
      </div>

      <PayslipsTable
        payslips={filteredPayslips}
        onEdit={handleEdit}
        emptyMessage={
          selectedEmployeeId
            ? "No payslips match that employee for this payroll period."
            : "No payslips for this payroll period yet."
        }
      />
    </div>
  )
}
