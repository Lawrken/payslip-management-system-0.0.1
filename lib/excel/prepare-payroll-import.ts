import "server-only"

import { getEmployees } from "@/lib/employees"
import { getEmployeeSchedulesByPayrollId } from "@/lib/employee-schedules"
import type { ParsedPayrollWorkbook } from "@/lib/excel/parse-payroll-workbook"
import { validatePayrollImport } from "@/lib/excel/validate-payroll-import"
import { getPayrollById } from "@/lib/payrolls"
import { getPayslipsByPayrollId } from "@/lib/payslips"
import { buildScheduleSpreadsheetRows } from "@/lib/spreadsheet/schedules"

export async function preparePayrollImportValidation(
  payrollId: string,
  parsed: ParsedPayrollWorkbook
) {
  const payroll = await getPayrollById(payrollId)
  if (!payroll) {
    return { error: "Payroll not found." as const }
  }

  const [payslips, employees, schedules] = await Promise.all([
    getPayslipsByPayrollId(payrollId),
    getEmployees(),
    getEmployeeSchedulesByPayrollId(payrollId),
  ])

  const employeesByEmployeeId = new Map(
    employees.map((employee) => [employee.employeeId, employee])
  )
  const baselineScheduleRows = buildScheduleSpreadsheetRows({
    payroll,
    payslips,
    schedules,
  })

  const validation = validatePayrollImport({
    expectedPayrollId: payrollId,
    parsed,
    payroll,
    payslips,
    employeesByEmployeeId,
    baselineScheduleRows,
  })

  return { payroll, validation }
}
