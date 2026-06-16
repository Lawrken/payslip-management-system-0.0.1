import { redirect } from "next/navigation"
import { Suspense } from "react"

import { PayslipsPageContent } from "@/components/dashboard/payslips/payslips-page-content"
import { requireDashboardSession } from "@/lib/authorization"
import { getEmployees } from "@/lib/employees"
import { getLatestPayroll, getPayrolls } from "@/lib/payrolls"
import {
  getPaginatedPayslips,
  type PayslipListSort,
} from "@/lib/payslips"
import type { SortDirection } from "@/lib/table-sort"
import type { PayslipStatus } from "@/lib/types"

export const dynamic = "force-dynamic"

type PayslipsPageProps = {
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

const payslipStatuses: PayslipStatus[] = [
  "draft",
  "pending",
  "adminApproved",
  "approved",
  "returned",
  "sent",
]
const payslipSorts: PayslipListSort[] = [
  "employeeName",
  "employeeId",
  "status",
]

function normalizeStatus(value: string | undefined) {
  return payslipStatuses.includes(value as PayslipStatus)
    ? (value as PayslipStatus)
    : undefined
}

function normalizeSort(value: string | undefined): PayslipListSort {
  return payslipSorts.includes(value as PayslipListSort)
    ? (value as PayslipListSort)
    : "employeeName"
}

function normalizeDirection(value: string | undefined): SortDirection {
  return value === "desc" ? "desc" : "asc"
}

async function PayslipsPageInner({ searchParams }: PayslipsPageProps) {
  const session = await requireDashboardSession()
  if ("error" in session) {
    redirect("/login")
  }

  const params = await searchParams
  const status = normalizeStatus(params.status)
  const sort = normalizeSort(params.sort)
  const direction = normalizeDirection(params.direction)
  const [employees, payrolls, latestPayroll] = await Promise.all([
    getEmployees(),
    getPayrolls(),
    getLatestPayroll(),
  ])
  const selectedPayroll =
    payrolls.find((payroll) => payroll.id === params.payrollId) ??
    latestPayroll ??
    payrolls[0] ??
    null
  const payslips = selectedPayroll
    ? await getPaginatedPayslips({
        payrollId: selectedPayroll.id,
        employeeId: params.employeeId,
        statuses: status ? [status] : undefined,
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
    <PayslipsPageContent
      payslips={payslips}
      employees={employees}
      payrolls={payrolls}
      defaultPayrollId={latestPayroll?.id ?? null}
      status={status ?? ""}
      sortKey={sort}
      sortDir={direction}
    />
  )
}

export default function PayslipsPage({ searchParams }: PayslipsPageProps) {
  return (
    <Suspense>
      <PayslipsPageInner searchParams={searchParams} />
    </Suspense>
  )
}
