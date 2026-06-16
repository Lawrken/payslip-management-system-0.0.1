import { redirect } from "next/navigation"
import { Suspense } from "react"

import { SchedulePageContent } from "@/components/dashboard/schedule/schedule-page-content"
import { requireDashboardSession } from "@/lib/authorization"
import { redirectWithDefaultPayrollId } from "@/lib/dashboard-routing"
import {
  getPaginatedScheduleRows,
  type ScheduleRowSort,
  type ScheduleStatusFilter,
} from "@/lib/employee-schedules"
import { getEmployeeOptions } from "@/lib/employees"
import { getPayrollById, getPayrollSummaries } from "@/lib/payrolls"
import type { SortDirection } from "@/lib/table-sort"

export const dynamic = "force-dynamic"

type SchedulePageProps = {
  searchParams: Promise<{
    payrollId?: string
    employeeId?: string
    status?: string
    page?: string
    pageSize?: string
    sort?: string
    direction?: string
  }>
}

const scheduleStatuses: ScheduleStatusFilter[] = ["modified", "notModified"]
const scheduleSorts: ScheduleRowSort[] = [
  "employeeName",
  "employeeNumber",
  "status",
]

function normalizeStatus(value: string | undefined) {
  return scheduleStatuses.includes(value as ScheduleStatusFilter)
    ? (value as ScheduleStatusFilter)
    : undefined
}

function normalizeSort(value: string | undefined): ScheduleRowSort {
  return scheduleSorts.includes(value as ScheduleRowSort)
    ? (value as ScheduleRowSort)
    : "employeeName"
}

function normalizeDirection(value: string | undefined): SortDirection {
  return value === "desc" ? "desc" : "asc"
}

async function SchedulePageInner({ searchParams }: SchedulePageProps) {
  const session = await requireDashboardSession()
  if ("error" in session) {
    redirect("/login")
  }

  const params = await searchParams
  const status = normalizeStatus(params.status)
  const sort = normalizeSort(params.sort)
  const direction = normalizeDirection(params.direction)
  const payrolls = await getPayrollSummaries()
  const latestPayrollId = payrolls[0]?.id ?? null
  redirectWithDefaultPayrollId("/dashboard/schedule", params, latestPayrollId)

  const selectedPayrollSummary =
    payrolls.find((payroll) => payroll.id === params.payrollId) ??
    payrolls[0] ??
    null
  const [employeeOptions, scheduleRows, selectedPayroll] = await Promise.all([
    getEmployeeOptions(),
    selectedPayrollSummary
      ? getPaginatedScheduleRows({
          payrollId: selectedPayrollSummary.id,
          employeeId: params.employeeId,
          status,
          page: params.page,
          pageSize: params.pageSize,
          sort,
          direction,
        })
      : Promise.resolve({
          items: [],
          total: 0,
          page: 1,
          pageSize: 50,
          pageCount: 1,
        }),
    selectedPayrollSummary
      ? getPayrollById(selectedPayrollSummary.id)
      : Promise.resolve(null),
  ])

  return (
    <SchedulePageContent
      scheduleRows={scheduleRows}
      payrolls={payrolls}
      selectedPayroll={selectedPayroll}
      employeeOptions={employeeOptions}
      selectedPayrollId={selectedPayrollSummary?.id ?? ""}
      employeeId={params.employeeId ?? ""}
      status={status ?? ""}
      sortKey={sort}
      sortDir={direction}
    />
  )
}

export default function SchedulePage({ searchParams }: SchedulePageProps) {
  return (
    <Suspense>
      <SchedulePageInner searchParams={searchParams} />
    </Suspense>
  )
}
