"use client"

import * as React from "react"

import { getEmployeePayslipDetailAction } from "@/app/payslips/actions"
import { EmployeePayslipPeriodSelector } from "@/components/payslips/employee-payslip-period-selector"
import { EmployeePayslipViewer } from "@/components/payslips/employee-payslip-viewer"
import type { EmployeePayslipPreviewItem } from "@/components/payslips/employee-payslip-viewer"
import { EmployeeYtdSummaryCard } from "@/components/payslips/employee-ytd-summary"
import { Separator } from "@/components/ui/separator"
import type { EmployeePayslipListItem, EmployeeYtdOverview } from "@/lib/types"

type EmployeePayslipsWorkspaceProps = {
  payslipPeriods: EmployeePayslipListItem[]
  ytdOverview: EmployeeYtdOverview
  signedInLabel: string
  headerActions: React.ReactNode
}

export function EmployeePayslipsWorkspace({
  payslipPeriods,
  ytdOverview,
  signedInLabel,
  headerActions,
}: EmployeePayslipsWorkspaceProps) {
  const [selectedId, setSelectedId] = React.useState(payslipPeriods[0]?.id ?? "")
  const [selectedPayslip, setSelectedPayslip] =
    React.useState<EmployeePayslipPreviewItem | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false

    if (!selectedId) {
      queueMicrotask(() => {
        if (!cancelled) {
          setSelectedPayslip(null)
        }
      })
      return
    }

    queueMicrotask(() => {
      if (!cancelled) {
        setIsLoading(true)
      }
    })
    void getEmployeePayslipDetailAction(selectedId).then((result) => {
      if (cancelled) {
        return
      }
      setIsLoading(false)
      if ("error" in result) {
        setSelectedPayslip(null)
        return
      }

      const payslip = result.payslip
      setSelectedPayslip({
        id: payslip.id,
        employeeId: payslip.employeeId,
        employeeName: payslip.employeeName,
        employeeDivisor: payslip.employeeDivisor,
        tin: payslip.tin,
        sssNo: payslip.sssNo,
        phicNo: payslip.phicNo,
        hdmfNo: payslip.hdmfNo,
        payrollPeriodLabel: payslip.payrollPeriodLabel,
        dtrCutOffStart: payslip.dtrCutOffStart,
        dtrCutOffEnd: payslip.dtrCutOffEnd,
        payoutDate: payslip.payoutDate,
        status: payslip.status,
        inputs: payslip.inputs,
        totals: payslip.totals,
        attendance: payslip.attendance,
      })
    })

    return () => {
      cancelled = true
    }
  }, [selectedId])

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            Your Payslips
          </h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {signedInLabel}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {payslipPeriods.length > 0 ? (
            <EmployeePayslipPeriodSelector
              payslips={payslipPeriods}
              value={selectedId}
              onChange={setSelectedId}
              className="w-full sm:w-auto"
            />
          ) : null}
          {headerActions}
        </div>
      </div>

      <EmployeePayslipViewer
        payslip={selectedPayslip}
        isLoading={isLoading}
      />

      <Separator />

      <EmployeeYtdSummaryCard overview={ytdOverview} />
    </>
  )
}
