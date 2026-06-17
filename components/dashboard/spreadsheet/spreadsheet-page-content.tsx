"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import {
  bulkUpdateEmployeesAction,
  bulkUpdatePayrollsAction,
  bulkUpdatePayslipsAction,
  bulkUpdateSchedulesAction,
  bulkUpdateUsersAction,
} from "@/app/dashboard/spreadsheet/actions"
import { employeeColumns } from "@/components/dashboard/spreadsheet/column-defs/employees"
import { auditLogColumns } from "@/components/dashboard/spreadsheet/column-defs/logs"
import { payrollColumns } from "@/components/dashboard/spreadsheet/column-defs/payrolls"
import { payslipColumns } from "@/components/dashboard/spreadsheet/column-defs/payslips"
import { scheduleColumns } from "@/components/dashboard/spreadsheet/column-defs/schedules"
import { getUserColumns } from "@/components/dashboard/spreadsheet/column-defs/users"
import type { SpreadsheetColumnDef } from "@/components/dashboard/spreadsheet/column-defs/types"
import { HandsontableSpreadsheet } from "@/components/dashboard/spreadsheet/handsontable-spreadsheet"
import { PayrollPeriodCombobox } from "@/components/dashboard/shared/payroll-period-combobox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { recalculatePayslipRowTotals } from "@/lib/spreadsheet/payslips"
import type { ScheduleSpreadsheetRow } from "@/lib/spreadsheet/schedules"
import type { PayslipSpreadsheetRow } from "@/lib/spreadsheet/payslips"
import type { SpreadsheetRow, SpreadsheetTab } from "@/lib/spreadsheet/types"
import { SPREADSHEET_TABS } from "@/lib/spreadsheet/types"
import type { PayrollSummary, Role } from "@/lib/types"

type SpreadsheetPageContentProps = {
  activeTab: SpreadsheetTab
  payrolls: PayrollSummary[]
  selectedPayrollId: string
  rowData: SpreadsheetRow[]
  sessionRole: Role
}

const TAB_LABELS: Record<SpreadsheetTab, string> = {
  employees: "Employees",
  payrolls: "Payrolls",
  payslips: "Payslips",
  schedule: "Schedule",
  users: "Users",
  logs: "Logs",
}

const TAB_LINKS: Partial<Record<SpreadsheetTab, string>> = {
  employees: "/dashboard/employees",
  payrolls: "/dashboard/payrolls",
  payslips: "/dashboard/payslips",
  schedule: "/dashboard/schedule",
  users: "/dashboard/users",
  logs: "/dashboard/logs",
}

function getColumns(tab: SpreadsheetTab, canEditUserRole: boolean): SpreadsheetColumnDef[] {
  switch (tab) {
    case "employees":
      return employeeColumns
    case "payrolls":
      return payrollColumns
    case "payslips":
      return payslipColumns
    case "schedule":
      return scheduleColumns
    case "users":
      return getUserColumns(canEditUserRole)
    case "logs":
      return auditLogColumns
    default:
      return employeeColumns
  }
}

export function SpreadsheetPageContent({
  activeTab,
  payrolls,
  selectedPayrollId,
  rowData,
  sessionRole,
}: SpreadsheetPageContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSaving, setIsSaving] = React.useState(false)
  const [saveErrors, setSaveErrors] = React.useState<
    { rowId: string; message: string }[]
  >([])

  const canEditUserRole = sessionRole === "superAdmin"
  const needsPayroll = activeTab === "payslips" || activeTab === "schedule"

  function handleTabChange(tab: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", tab)
    if (tab !== "payslips" && tab !== "schedule") {
      params.delete("payrollId")
    }
    router.replace(`/dashboard/spreadsheet?${params.toString()}`, {
      scroll: false,
    })
    setSaveErrors([])
  }

  function handlePayrollChange(payrollId: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (payrollId) {
      params.set("payrollId", payrollId)
    } else {
      params.delete("payrollId")
    }
    router.replace(`/dashboard/spreadsheet?${params.toString()}`, {
      scroll: false,
    })
    setSaveErrors([])
  }

  async function handleSave(context: {
    dirtyRows: SpreadsheetRow[]
    allRows: SpreadsheetRow[]
    dirtyRowIds: string[]
  }) {
    setIsSaving(true)
    setSaveErrors([])

    try {
      let result

      switch (activeTab) {
        case "employees":
          result = await bulkUpdateEmployeesAction(context.dirtyRows)
          break
        case "payrolls":
          result = await bulkUpdatePayrollsAction(context.dirtyRows)
          break
        case "payslips":
          result = await bulkUpdatePayslipsAction(context.dirtyRows)
          break
        case "schedule": {
          const dirtyEmployeeIds = [
            ...new Set(
              (context.dirtyRows as ScheduleSpreadsheetRow[]).map(
                (row) => row.employeeId
              )
            ),
          ]
          result = await bulkUpdateSchedulesAction({
            payrollId: selectedPayrollId,
            allRows: context.allRows,
            dirtyEmployeeIds,
          })
          break
        }
        case "users":
          result = await bulkUpdateUsersAction(context.dirtyRows)
          break
        default:
          return
      }

      if (result.errors.length > 0) {
        setSaveErrors(result.errors)
      }

      if (result.updatedCount > 0 && result.errors.length === 0) {
        toast.success(
          `Saved ${result.updatedCount} row${result.updatedCount === 1 ? "" : "s"}.`
        )
        router.refresh()
      } else if (result.updatedCount > 0 && result.errors.length > 0) {
        toast.error("Some rows could not be saved.")
      } else if (result.errors.length > 0) {
        toast.error("No rows were saved. Fix the highlighted errors and try again.")
      }
    } catch {
      toast.error("Failed to save changes.")
    } finally {
      setIsSaving(false)
    }
  }

  const columns = getColumns(activeTab, canEditUserRole)
  const tabLink = TAB_LINKS[activeTab]
  const errorRowIds = React.useMemo(
    () => saveErrors.map((error) => error.rowId).filter(Boolean),
    [saveErrors]
  )

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Spreadsheet
        </h1>
        <p className="text-muted-foreground text-sm">
          Bulk view and edit admin data. Use the main dashboard pages to add or
          delete records.
          {tabLink ? (
            <>
              {" "}
              <Link href={tabLink} className="text-foreground underline">
                Open {TAB_LABELS[activeTab]} page
              </Link>
            </>
          ) : null}
        </p>
      </div>

      {activeTab === "payrolls" ? (
        <Alert>
          <AlertDescription>
            DTR day status editing is not available in this grid. Use the Payrolls
            page to edit holiday and DTR day details.
          </AlertDescription>
        </Alert>
      ) : null}

      {activeTab === "users" && !canEditUserRole ? (
        <Alert>
          <AlertDescription>
            User roles are read-only here. Only superadmins can edit roles in this
            spreadsheet.
          </AlertDescription>
        </Alert>
      ) : null}

      {saveErrors.length > 0 ? (
        <Alert variant="destructive">
          <AlertDescription>
            <ul className="list-disc space-y-1 pl-4">
              {saveErrors.map((error) => (
                <li key={`${error.rowId}-${error.message}`}>
                  {error.rowId ? `${error.rowId}: ` : ""}
                  {error.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <TabsList className="h-auto flex-wrap">
            {SPREADSHEET_TABS.map((tab) => (
              <TabsTrigger key={tab} value={tab}>
                {TAB_LABELS[tab]}
              </TabsTrigger>
            ))}
          </TabsList>

          {needsPayroll ? (
            <div className="w-full max-w-sm">
              <PayrollPeriodCombobox
                payrolls={payrolls}
                value={selectedPayrollId}
                onChange={handlePayrollChange}
              />
            </div>
          ) : null}
        </div>

        {SPREADSHEET_TABS.map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            {needsPayroll && tab === activeTab && !selectedPayrollId ? (
              <div className="text-muted-foreground flex min-h-[calc(100vh-12rem)] items-center justify-center text-sm">
                Select a payroll period to load {TAB_LABELS[tab].toLowerCase()}.
              </div>
            ) : (
              <HandsontableSpreadsheet
                key={`${tab}-${selectedPayrollId}-${rowData.length}`}
                columns={columns}
                initialRowData={tab === activeTab ? rowData : []}
                isActive={tab === activeTab}
                readOnly={tab === "logs" || (tab === "users" && !canEditUserRole)}
                errorRowIds={tab === activeTab ? errorRowIds : []}
                onRowDataChange={
                  tab === "payslips"
                    ? (row) =>
                        recalculatePayslipRowTotals(row as PayslipSpreadsheetRow)
                    : undefined
                }
                onSave={handleSave}
                onSaveError={(message) => toast.error(message)}
                isSaving={isSaving}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
