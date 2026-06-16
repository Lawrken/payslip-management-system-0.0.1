"use client"

import dynamic from "next/dynamic"
import { useRouter, useSearchParams } from "next/navigation"
import * as React from "react"

import { PaginationControls } from "@/components/dashboard/shared/pagination-controls"
import { ReviewTable } from "@/components/dashboard/review/review-table"
import { PayrollPeriodCombobox } from "@/components/dashboard/shared/payroll-period-combobox"
import { PayrollPeriodStrip } from "@/components/dashboard/shared/payroll-period-strip"
import type { PaginatedResult } from "@/lib/pagination"
import type { Employee, Payroll, Payslip, Role } from "@/lib/types"

const ReviewPayslipDialog = dynamic(
  () =>
    import("@/components/dashboard/review/review-payslip-dialog").then(
      (mod) => mod.ReviewPayslipDialog
    ),
  {
    loading: () => null,
  }
)

type ReviewPageContentProps = {
  payslips: PaginatedResult<Payslip>
  employees: Employee[]
  payrolls: Payroll[]
  defaultPayrollId: string | null
  role: Role
}

export function ReviewPageContent({
  payslips,
  employees,
  payrolls,
  defaultPayrollId,
  role,
}: ReviewPageContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const payrollIdFromUrl = searchParams.get("payrollId")

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
    router.replace(`/dashboard/review?${params.toString()}`, {
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
    router.replace(`/dashboard/review?${params.toString()}`, {
      scroll: false,
    })
    setActivePayslipId(null)
  }

  const activeIndex = React.useMemo(() => {
    if (!activePayslipId) {
      return -1
    }
    return payslips.items.findIndex((payslip) => payslip.id === activePayslipId)
  }, [payslips.items, activePayslipId])

  function handleReview(payslip: Payslip) {
    setActivePayslipId(payslip.id)
    setDialogOpen(true)
  }

  const reviewEmptyMessage =
    role === "admin"
      ? "No payslips ready for review for this payroll period."
      : "No checked or ready-for-email payslips for this payroll period."

  if (payrolls.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Review</h1>
        <p className="text-sm text-muted-foreground">
          No payroll periods yet. Create a payroll period before reviewing
          payslips.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Review</h1>

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

      <ReviewTable
        payslips={payslips.items}
        onReview={handleReview}
        emptyMessage={reviewEmptyMessage}
      />

      <ReviewPayslipDialog
        employees={employees}
        payslips={payslips.items}
        activeIndex={activeIndex}
        onActiveIndexChange={(index) => {
          const payslip = payslips.items[index]
          setActivePayslipId(payslip?.id ?? null)
        }}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        role={role}
      />
      <PaginationControls
        page={payslips.page}
        pageCount={payslips.pageCount}
        total={payslips.total}
        pageSize={payslips.pageSize}
        itemLabel="review items"
      />
    </div>
  )
}
