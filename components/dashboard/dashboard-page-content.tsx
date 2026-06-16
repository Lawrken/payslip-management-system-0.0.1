"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import * as React from "react"

import { DashboardReminder } from "@/components/dashboard/dashboard-reminder"
import { DashboardStatusStrip } from "@/components/dashboard/dashboard-status-strip"
import { DashboardTotalsStrip } from "@/components/dashboard/dashboard-totals-strip"
import { PayrollPeriodCombobox } from "@/components/dashboard/shared/payroll-period-combobox"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ROLE_LABELS } from "@/lib/auth-helpers"
import type {
  DashboardSummary,
  PayrollTotalsChartRow,
  StatusChartDatum,
} from "@/lib/dashboard-summary"
import type { Payroll, Session } from "@/lib/types"

const DashboardCharts = dynamic(
  () =>
    import("@/components/dashboard/dashboard-charts").then(
      (mod) => mod.DashboardCharts
    ),
  {
    loading: () => null,
  }
)

type DashboardPageContentProps = {
  session: Session
  payrolls: Payroll[]
  defaultPayrollId: string | null
  summary: DashboardSummary
  totalsChartData: PayrollTotalsChartRow[]
  statusChartData: StatusChartDatum[]
}

export function DashboardPageContent({
  session,
  payrolls,
  defaultPayrollId,
  summary,
  totalsChartData,
  statusChartData,
}: DashboardPageContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const payrollIdFromUrl = searchParams.get("payrollId")

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
    router.replace(`/dashboard?${params.toString()}`, {
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
    router.replace(`/dashboard?${params.toString()}`, {
      scroll: false,
    })
  }

  const reviewHref = selectedPayroll
    ? `/dashboard/review?payrollId=${encodeURIComponent(selectedPayroll.id)}`
    : "/dashboard/review"
  const payslipsHref = selectedPayroll
    ? `/dashboard/payslips?payrollId=${encodeURIComponent(selectedPayroll.id)}`
    : "/dashboard/payslips"

  return (
    <div className="flex max-w-full min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {session.employeeId} · {ROLE_LABELS[session.role]}
          </p>
        </div>
        {payrolls.length > 0 ? (
          <PayrollPeriodCombobox
            payrolls={payrolls}
            value={selectedPayrollId}
            onChange={handlePayrollChange}
            className="w-full sm:w-auto"
          />
        ) : null}
      </div>

      {!selectedPayroll ? (
        <Card>
          <CardHeader>
            <CardTitle>No payroll period yet</CardTitle>
            <CardDescription>
              Create a payroll period before reviewing or editing payslips.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/dashboard/payrolls">Go to payrolls</Link>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <DashboardReminder
          payroll={selectedPayroll}
          summary={summary}
          role={session.role}
          reviewHref={reviewHref}
          payslipsHref={payslipsHref}
        />
      )}

      {selectedPayroll ? (
        <>
          <section className="space-y-5">
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">
                Payslip status
              </h2>
              <DashboardStatusStrip summary={summary} />
            </div>
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">
                Payroll totals
              </h2>
              <DashboardTotalsStrip totalsData={totalsChartData} />
            </div>
          </section>
          <DashboardCharts
            payrollLabel={selectedPayroll.payrollPeriodLabel}
            totalPayslips={summary.totalPayslips}
            statusData={statusChartData}
            totalsData={totalsChartData}
          />
        </>
      ) : null}
    </div>
  )
}
