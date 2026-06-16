import { redirect } from "next/navigation"
import { Suspense } from "react"

import { ReviewPageContent } from "@/components/dashboard/review/review-page-content"
import { requireDashboardSession } from "@/lib/authorization"
import { redirectWithDefaultPayrollId } from "@/lib/dashboard-routing"
import { getEmployeeOptions } from "@/lib/employees"
import { getPayrollSummaries } from "@/lib/payrolls"
import {
  getPaginatedPayslipListItems,
  type PayslipListSort,
} from "@/lib/payslips"
import type { SortDirection } from "@/lib/table-sort"
import type { PayslipStatus } from "@/lib/types"

export const dynamic = "force-dynamic"

type ReviewPageProps = {
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

function getReviewStatuses(role: string): PayslipStatus[] {
  if (role === "admin") {
    return ["pending"]
  }
  if (role === "superAdmin") {
    return ["adminApproved", "approved"]
  }
  return []
}

const reviewSorts: PayslipListSort[] = [
  "employeeName",
  "employeeId",
  "status",
]

function normalizeSort(value: string | undefined): PayslipListSort {
  return reviewSorts.includes(value as PayslipListSort)
    ? (value as PayslipListSort)
    : "employeeName"
}

function normalizeDirection(value: string | undefined): SortDirection {
  return value === "desc" ? "desc" : "asc"
}

async function ReviewPageInner({ searchParams }: ReviewPageProps) {
  const session = await requireDashboardSession()
  if ("error" in session) {
    redirect("/login")
  }

  const params = await searchParams
  const allowedStatuses = getReviewStatuses(session.role)
  const status = allowedStatuses.includes(params.status as PayslipStatus)
    ? (params.status as PayslipStatus)
    : undefined
  const sort = normalizeSort(params.sort)
  const direction = normalizeDirection(params.direction)
  const payrolls = await getPayrollSummaries()
  const latestPayrollId = payrolls[0]?.id ?? null
  redirectWithDefaultPayrollId("/dashboard/review", params, latestPayrollId)

  const selectedPayroll =
    payrolls.find((payroll) => payroll.id === params.payrollId) ??
    payrolls[0] ??
    null
  const [employeeOptions, payslips] = await Promise.all([
    getEmployeeOptions(),
    selectedPayroll
      ? getPaginatedPayslipListItems({
          payrollId: selectedPayroll.id,
          employeeId: params.employeeId,
          statuses: status ? [status] : allowedStatuses,
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
  ])

  return (
    <ReviewPageContent
      payslips={payslips}
      employeeOptions={employeeOptions}
      payrolls={payrolls}
      selectedPayrollId={selectedPayroll?.id ?? ""}
      role={session.role}
      employeeId={params.employeeId ?? ""}
      status={status ?? ""}
      allowedStatuses={allowedStatuses}
      sortKey={sort}
      sortDir={direction}
    />
  )
}

export default function ReviewPage({ searchParams }: ReviewPageProps) {
  return (
    <Suspense>
      <ReviewPageInner searchParams={searchParams} />
    </Suspense>
  )
}
