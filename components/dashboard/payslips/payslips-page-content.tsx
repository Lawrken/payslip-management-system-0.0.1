"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import * as React from "react"

import { PayrollExcelExportButton } from "@/components/dashboard/payrolls/payroll-excel-export-button"
import { PayrollExcelImportDialog } from "@/components/dashboard/payrolls/payroll-excel-import-dialog"
import { EmployeeCombobox } from "@/components/dashboard/shared/employee-combobox"
import { PaginationControls } from "@/components/dashboard/shared/pagination-controls"
import { PayrollPeriodCombobox } from "@/components/dashboard/shared/payroll-period-combobox"
import { PayrollPeriodStrip } from "@/components/dashboard/shared/payroll-period-strip"
import { PayslipsTable } from "@/components/dashboard/payslips/payslips-table"
import { Button } from "@/components/ui/button"
import type { EmployeeOption } from "@/lib/employees"
import type { PaginatedResult } from "@/lib/pagination"
import type { PayslipListSort } from "@/lib/payslips"
import type { SortDirection } from "@/lib/table-sort"
import type { PayrollSummary, PayslipListItem } from "@/lib/types"

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
  payslips: PaginatedResult<PayslipListItem>
  employeeOptions: EmployeeOption[]
  payrolls: PayrollSummary[]
  selectedPayrollId: string
  status: string
  sortKey: PayslipListSort
  sortDir: SortDirection
}

export function PayslipsPageContent({
  payslips,
  employeeOptions,
  payrolls,
  selectedPayrollId,
  status,
  sortKey,
  sortDir,
}: PayslipsPageContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedEmployeeId = searchParams.get("employeeId") ?? ""

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [activePayslipId, setActivePayslipId] = React.useState<string | null>(
    null
  )

  const selectedPayroll = payrolls.find(
    (payroll) => payroll.id === selectedPayrollId
  )

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

  function replaceParams(params: URLSearchParams) {
    const query = params.toString()
    router.replace(query ? `/dashboard/payslips?${query}` : "/dashboard/payslips", {
      scroll: false,
    })
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

  function handleStatusFilterChange(statusValue: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (statusValue) {
      params.set("status", statusValue)
    } else {
      params.delete("status")
    }
    params.delete("page")
    replaceParams(params)
    setActivePayslipId(null)
  }

  function handleSort(key: PayslipListSort) {
    const params = new URLSearchParams(searchParams.toString())
    const nextDirection =
      sortKey === key && sortDir === "asc" ? "desc" : "asc"
    params.set("sort", key)
    params.set("direction", nextDirection)
    params.delete("page")
    replaceParams(params)
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

  function handleEdit(payslip: PayslipListItem) {
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
              employees={employeeOptions}
              value={selectedEmployeeId}
              onChange={handleEmployeeFilterChange}
              variant="filter"
            />
            {selectedPayrollId ? (
              <>
                <PayrollExcelExportButton
                  payrollId={selectedPayrollId}
                  size="default"
                />
                <PayrollExcelImportDialog payrollId={selectedPayrollId}>
                  <Button type="button" variant="outline">
                    Import Excel
                  </Button>
                </PayrollExcelImportDialog>
                <EditPayslipDialog
                employeeOptions={employeeOptions}
                payslipListItems={payslips.items}
                payrollId={selectedPayrollId}
                activePayslipId={activePayslipId}
                activeIndex={activeIndex}
                onActiveIndexChange={handleActiveIndexChange}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
              >
                <Button>Edit Payslip</Button>
              </EditPayslipDialog>
              </>
            ) : null}
          </div>
        </div>

        {selectedPayroll ? (
          <PayrollPeriodStrip payroll={selectedPayroll} />
        ) : null}
      </div>

      <PayslipsTable
        payslips={payslips.items}
        status={status}
        onEdit={handleEdit}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        onStatusFilterChange={handleStatusFilterChange}
        emptyMessage={
          selectedEmployeeId || status
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
