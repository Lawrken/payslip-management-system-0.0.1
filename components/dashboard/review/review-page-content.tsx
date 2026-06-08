"use client"

import { useRouter, useSearchParams } from "next/navigation"
import * as React from "react"

import { BulkEmailDialog } from "@/components/dashboard/review/bulk-email-dialog"
import { ReviewPayslipDialog } from "@/components/dashboard/review/review-payslip-dialog"
import { ReviewTable } from "@/components/dashboard/review/review-table"
import { PayrollPeriodCombobox } from "@/components/dashboard/shared/payroll-period-combobox"
import { PayrollPeriodStrip } from "@/components/dashboard/shared/payroll-period-strip"
import { Button } from "@/components/ui/button"
import type { Employee, Payroll, Payslip, Role } from "@/lib/types"

type ReviewPageContentProps = {
  payslips: Payslip[]
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
    router.replace(`/dashboard/review?${params.toString()}`, {
      scroll: false,
    })
    setActivePayslipId(null)
  }

  const allPayrollPayslips = React.useMemo(() => {
    if (!selectedPayrollId) {
      return []
    }
    return payslips.filter((payslip) => payslip.payrollId === selectedPayrollId)
  }, [payslips, selectedPayrollId])

  const reviewQueuePayslips = React.useMemo(() => {
    if (role === "admin") {
      return allPayrollPayslips.filter(
        (payslip) => payslip.status === "pending"
      )
    }
    if (role === "superAdmin") {
      return allPayrollPayslips.filter(
        (payslip) =>
          payslip.status === "adminApproved" || payslip.status === "approved"
      )
    }
    return []
  }, [allPayrollPayslips, role])

  const activeIndex = React.useMemo(() => {
    if (!activePayslipId) {
      return -1
    }
    return reviewQueuePayslips.findIndex(
      (payslip) => payslip.id === activePayslipId
    )
  }, [reviewQueuePayslips, activePayslipId])

  function handleReview(payslip: Payslip) {
    setActivePayslipId(payslip.id)
    setDialogOpen(true)
  }

  const approvedCount = allPayrollPayslips.filter(
    (payslip) => payslip.status === "approved"
  ).length
  const totalCount = allPayrollPayslips.length
  const allApproved =
    totalCount > 0 &&
    allPayrollPayslips.every((payslip) => payslip.status === "approved")
  const isSuperAdmin = role === "superAdmin"

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
          {isSuperAdmin ? (
            <div className="flex flex-col items-start gap-1 lg:ml-auto lg:items-end">
              <BulkEmailDialog
                payrollId={selectedPayrollId}
                disabled={!allApproved}
                approvedCount={approvedCount}
                totalCount={totalCount}
              >
                <Button type="button" disabled={!allApproved}>
                  Bulk Email
                </Button>
              </BulkEmailDialog>
              {!allApproved && totalCount > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {approvedCount} of {totalCount} ready for email
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {selectedPayroll ? (
          <PayrollPeriodStrip payroll={selectedPayroll} />
        ) : null}
      </div>

      <ReviewTable
        payslips={reviewQueuePayslips}
        onReview={handleReview}
        emptyMessage={reviewEmptyMessage}
      />

      <ReviewPayslipDialog
        employees={employees}
        payslips={reviewQueuePayslips}
        activeIndex={activeIndex}
        onActiveIndexChange={(index) => {
          const payslip = reviewQueuePayslips[index]
          setActivePayslipId(payslip?.id ?? null)
        }}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        role={role}
      />
    </div>
  )
}
