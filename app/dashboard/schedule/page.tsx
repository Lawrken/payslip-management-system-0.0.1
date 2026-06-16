import { redirect } from "next/navigation"
import { Suspense } from "react"

import { SchedulePageContent } from "@/components/dashboard/schedule/schedule-page-content"
import { requireDashboardSession } from "@/lib/authorization"
import {
  getPaginatedScheduleRows,
  type ScheduleRowSort,
  type ScheduleStatusFilter,
} from "@/lib/employee-schedules"
import { getEmployeeOptions } from "@/lib/employees"
import { getLatestPayroll, getPayrolls } from "@/lib/payrolls"
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
  const [payrolls, latestPayroll, employeeOptions] = await Promise.all([
    getPayrolls(),
    getLatestPayroll(),
    getEmployeeOptions(),
  ])
  const selectedPayroll =
    payrolls.find((payroll) => payroll.id === params.payrollId) ??
    latestPayroll ??
    payrolls[0] ??
    null
  const scheduleRows = selectedPayroll
    ? await getPaginatedScheduleRows({
        payrollId: selectedPayroll.id,
        employeeId: params.employeeId,
        status,
        page: params.page,
        pageSize: params.pageSize,
        sort,
        direction,
      })
    : {
        items: [],
        total: 0,
        page: 1,
        pageSize: 50,
        pageCount: 1,
      }

  return (
    <SchedulePageContent
      scheduleRows={scheduleRows}
      payrolls={payrolls}
      employeeOptions={employeeOptions}
      defaultPayrollId={latestPayroll?.id ?? null}
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
