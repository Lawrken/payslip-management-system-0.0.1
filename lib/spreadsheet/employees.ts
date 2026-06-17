import type { Employee } from "@/lib/types"
import type { SpreadsheetRow } from "@/lib/spreadsheet/types"

export type EmployeeSpreadsheetRow = SpreadsheetRow & {
  id: string
  name: string
  employeeId: string
  email: string
  employeeStatus: string
  positionTitle: string
  department: string
  program: string
  account: string
  divisor: number
  basicPay: number
  tin: string
  sssNo: string
  phicNo: string
  hdmfNo: string
}

export function employeeToSpreadsheetRow(employee: Employee): EmployeeSpreadsheetRow {
  return {
    rowId: employee.id,
    id: employee.id,
    name: employee.name,
    employeeId: employee.employeeId,
    email: employee.email,
    employeeStatus: employee.employeeStatus,
    positionTitle: employee.positionTitle,
    department: employee.department,
    program: employee.program,
    account: employee.account,
    divisor: employee.divisor,
    basicPay: employee.basicPay,
    tin: employee.tin,
    sssNo: employee.sssNo,
    phicNo: employee.phicNo,
    hdmfNo: employee.hdmfNo,
  }
}

export function employeesToSpreadsheetRows(
  employees: Employee[]
): EmployeeSpreadsheetRow[] {
  return employees.map(employeeToSpreadsheetRow)
}
