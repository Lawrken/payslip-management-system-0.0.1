"use client"

import * as React from "react"

import { AddPayrollDialog } from "@/components/dashboard/payrolls/add-payroll-dialog"
import { PayrollsTable } from "@/components/dashboard/payrolls/payrolls-table"
import { Button } from "@/components/ui/button"
import type { PayrollPayslipMetrics } from "@/lib/payslips"
import type { Payroll } from "@/lib/types"

type PayrollsPageContentProps = {
  payrolls: Payroll[]
  metricsByPayrollId: Record<string, PayrollPayslipMetrics>
}

export function PayrollsPageContent({
  payrolls,
  metricsByPayrollId,
}: PayrollsPageContentProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Payrolls</h1>
        <AddPayrollDialog>
          <Button>Add Payroll</Button>
        </AddPayrollDialog>
      </div>
      <PayrollsTable
        payrolls={payrolls}
        metricsByPayrollId={metricsByPayrollId}
        emptyMessage="No payroll periods yet."
      />
    </div>
  )
}
