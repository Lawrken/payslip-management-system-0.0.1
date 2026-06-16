"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import * as React from "react"

import { EmployeeCombobox } from "@/components/dashboard/shared/employee-combobox"
import { PaginationControls } from "@/components/dashboard/shared/pagination-controls"
import { PayrollPeriodCombobox } from "@/components/dashboard/shared/payroll-period-combobox"
import { PayrollPeriodStrip } from "@/components/dashboard/shared/payroll-period-strip"
import { PayslipsTable } from "@/components/dashboard/payslips/payslips-table"
import { Button } from "@/components/ui/button"
import type { PaginatedResult } from "@/lib/pagination"
import type { Employee, Payroll, Payslip } from "@/lib/types"

const EditPayslipDialog = dynamic(
  () =>
    import("@/components/dashboard/payslips/edit-payslip-dialog").then(
      (mod) => mod.EditPayslipDialog
    ),
  {
    loading: () => null,
  }
)

type PayslipsPageContentProps = {
  payslips: PaginatedResult<Payslip>
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
  const selectedEmployeeId = searchParams.get("employeeId") ?? ""

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
    params.delete("page")
    router.replace(`/dashboard/payslips?${params.toString()}`, {
      scroll: false,
    })
    setActivePayslipId(null)
  }

  function handleEmployeeFilterChange(employeeId: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (employeeId) {
      params.set("employeeId", employeeId)
    } else {
      params.delete("employeeId")
    }
    params.delete("page")
    router.replace(`/dashboard/payslips?${params.toString()}`, {
      scroll: false,
    })
    setActivePayslipId(null)
  }

  const activeIndex = activePayslipId
    ? payslips.items.findIndex((payslip) => payslip.id === activePayslipId)
    : -1

  function handleActiveIndexChange(index: number) {
    if (index < 0) {
      setActivePayslipId(null)
      return
    }
    setActivePayslipId(payslips.items[index]?.id ?? null)
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
          <Link
            href="/dashboard/payrolls"
            className="text-foreground underline"
          >
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
              onChange={handleEmployeeFilterChange}
              variant="filter"
            />
            {selectedPayrollId ? (
              <EditPayslipDialog
                employees={employees}
                payslips={payslips.items}
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
          <PayrollPeriodStrip payroll={selectedPayroll} />
        ) : null}
      </div>

      <PayslipsTable
        payslips={payslips.items}
        onEdit={handleEdit}
        emptyMessage={
          selectedEmployeeId
            ? "No payslips match that employee for this payroll period."
            : "No payslips for this payroll period yet."
        }
      />
      <PaginationControls
        page={payslips.page}
        pageCount={payslips.pageCount}
        total={payslips.total}
        pageSize={payslips.pageSize}
        itemLabel="payslips"
      />
    </div>
  )
}
