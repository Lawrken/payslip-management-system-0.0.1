"use client"

import * as React from "react"

import { EmployeePayslipPeriodSelector } from "@/components/payslips/employee-payslip-period-selector"
import {
  EmployeePayslipViewer,
  type EmployeePayslipPreviewItem,
} from "@/components/payslips/employee-payslip-viewer"

type EmployeePayslipsWorkspaceProps = {
  payslips: EmployeePayslipPreviewItem[]
  signedInLabel: string
  headerActions: React.ReactNode
}

export function EmployeePayslipsWorkspace({
  payslips,
  signedInLabel,
  headerActions,
}: EmployeePayslipsWorkspaceProps) {
  const [selectedId, setSelectedId] = React.useState(payslips[0]?.id ?? "")

  const selectedPayslip =
    payslips.find((payslip) => payslip.id === selectedId) ?? payslips[0] ?? null

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
          {payslips.length > 0 ? (
            <EmployeePayslipPeriodSelector
              payslips={payslips}
              value={selectedId}
              onChange={setSelectedId}
              className="w-full sm:w-auto"
            />
          ) : null}
          {headerActions}
        </div>
      </div>

      <EmployeePayslipViewer payslip={selectedPayslip} />
    </>
  )
}
