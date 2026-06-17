import { Suspense } from "react"

import { SpreadsheetPageContent } from "@/components/dashboard/spreadsheet/spreadsheet-page-content"
import { requireDashboardSession } from "@/lib/authorization"
import { redirectWithDefaultPayrollId } from "@/lib/dashboard-routing"
import { getEmployees } from "@/lib/employees"
import { getEmployeeSchedulesByPayrollId } from "@/lib/employee-schedules"
import { getPaginatedAuditLogs } from "@/lib/audit-logs"
import { getPayrollById, getPayrollSummaries, getPayrolls } from "@/lib/payrolls"
import { getPayslipsByPayrollId } from "@/lib/payslips"
import { employeesToSpreadsheetRows } from "@/lib/spreadsheet/employees"
import { payrollsToSpreadsheetRows } from "@/lib/spreadsheet/payrolls"
import { payslipsToSpreadsheetRows } from "@/lib/spreadsheet/payslips"
import { buildScheduleSpreadsheetRows } from "@/lib/spreadsheet/schedules"
import {
  auditLogsToSpreadsheetRows,
  usersToSpreadsheetRows,
} from "@/lib/spreadsheet/users"
import {
  isSpreadsheetTab,
  PAYROLL_SCOPED_TABS,
  type SpreadsheetRow,
  type SpreadsheetTab,
} from "@/lib/spreadsheet/types"
import { getUserAccounts } from "@/lib/users"

export const dynamic = "force-dynamic"

type SpreadsheetPageProps = {
  searchParams: Promise<{
    tab?: string
    payrollId?: string
  }>
}

async function loadSpreadsheetRows(
  tab: SpreadsheetTab,
  payrollId: string | undefined
): Promise<SpreadsheetRow[]> {
  switch (tab) {
    case "employees":
      return employeesToSpreadsheetRows(await getEmployees())
    case "payrolls":
      return payrollsToSpreadsheetRows(await getPayrolls())
    case "payslips": {
      if (!payrollId) {
        return []
      }
      const payroll = await getPayrollById(payrollId)
      if (!payroll) {
        return []
      }
      const payslips = await getPayslipsByPayrollId(payrollId)
      const employees = await getEmployees()
      const schedules = await getEmployeeSchedulesByPayrollId(payrollId)
      const employeesByEmployeeId = new Map(
        employees.map((employee) => [employee.employeeId, employee])
      )
      const schedulesByEmployeeId = new Map(
        schedules.map((schedule) => [schedule.employeeId, schedule])
      )
      return payslipsToSpreadsheetRows(
        payslips,
        employeesByEmployeeId,
        payroll,
        schedulesByEmployeeId
      )
    }
    case "schedule": {
      if (!payrollId) {
        return []
      }
      const payroll = await getPayrollById(payrollId)
      if (!payroll) {
        return []
      }
      const payslips = await getPayslipsByPayrollId(payrollId)
      const schedules = await getEmployeeSchedulesByPayrollId(payrollId)
      return buildScheduleSpreadsheetRows({
        payroll,
        payslips,
        schedules,
      })
    }
    case "users":
      return usersToSpreadsheetRows(await getUserAccounts())
    case "logs": {
      const logs = await getPaginatedAuditLogs({
        page: 1,
        pageSize: 500,
        sort: "createdAt",
        direction: "desc",
      })
      return auditLogsToSpreadsheetRows(logs.items)
    }
    default:
      return []
  }
}

export default async function SpreadsheetPage({
  searchParams,
}: SpreadsheetPageProps) {
  const session = await requireDashboardSession()
  if ("error" in session) {
    return null
  }

  const params = await searchParams
  const activeTab: SpreadsheetTab = isSpreadsheetTab(params.tab)
    ? params.tab
    : "employees"

  const payrolls = await getPayrollSummaries()
  const defaultPayrollId = payrolls[0]?.id ?? null

  if (PAYROLL_SCOPED_TABS.has(activeTab)) {
    redirectWithDefaultPayrollId("/dashboard/spreadsheet", params, defaultPayrollId)
  }

  const selectedPayrollId = params.payrollId ?? defaultPayrollId ?? ""
  const rowData = await loadSpreadsheetRows(
    activeTab,
    PAYROLL_SCOPED_TABS.has(activeTab) ? selectedPayrollId : undefined
  )

  return (
    <Suspense fallback={null}>
      <SpreadsheetPageContent
        activeTab={activeTab}
        payrolls={payrolls}
        selectedPayrollId={selectedPayrollId}
        rowData={rowData}
        sessionRole={session.role}
      />
    </Suspense>
  )
}
