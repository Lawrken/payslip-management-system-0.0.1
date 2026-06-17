import {
  ACCOUNTS,
  DEPARTMENTS,
  EMPLOYEE_DIVISORS,
  EMPLOYEE_STATUSES,
  POSITION_TITLES,
  PROGRAMS,
} from "@/lib/employee-options"

import {
  minWidthForContent,
  type SpreadsheetColumnDef,
} from "@/components/dashboard/spreadsheet/column-defs/types"

export const employeeColumns: SpreadsheetColumnDef[] = [
  { field: "name", headerName: "Name", type: "text", pinned: "left", minWidth: 220 },
  { field: "employeeId", headerName: "Employee ID", type: "text", minWidth: 120 },
  { field: "email", headerName: "Email", type: "text", minWidth: 200 },
  {
    field: "employeeStatus",
    headerName: "Status",
    type: "select",
    options: EMPLOYEE_STATUSES,
    minWidth: 120,
  },
  {
    field: "positionTitle",
    headerName: "Position",
    type: "select",
    options: POSITION_TITLES,
    minWidth: minWidthForContent(POSITION_TITLES, "Position"),
  },
  {
    field: "department",
    headerName: "Department",
    type: "select",
    options: DEPARTMENTS,
    minWidth: minWidthForContent(DEPARTMENTS, "Department"),
  },
  {
    field: "program",
    headerName: "Program",
    type: "select",
    options: PROGRAMS,
    minWidth: minWidthForContent(PROGRAMS, "Program"),
  },
  {
    field: "account",
    headerName: "Account",
    type: "select",
    options: ACCOUNTS,
    minWidth: minWidthForContent(ACCOUNTS, "Account"),
  },
  {
    field: "divisor",
    headerName: "Divisor",
    type: "select",
    options: EMPLOYEE_DIVISORS.map(String),
    minWidth: 100,
  },
  {
    field: "basicPay",
    headerName: "Basic Pay",
    type: "number",
    minWidth: 120,
  },
  { field: "tin", headerName: "TIN", type: "text", minWidth: 120 },
  { field: "sssNo", headerName: "SSS No.", type: "text", minWidth: 120 },
  { field: "phicNo", headerName: "PHIC No.", type: "text", minWidth: 120 },
  { field: "hdmfNo", headerName: "HDMF No.", type: "text", minWidth: 120 },
]
