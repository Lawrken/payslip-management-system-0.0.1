import type { SpreadsheetColumnDef } from "@/components/dashboard/spreadsheet/column-defs/types"
import {
  MANUAL_SHIFT_TYPE_OPTIONS,
  SHIFT_TYPE_OPTIONS,
} from "@/lib/schedule-days"
import type { SpreadsheetRow } from "@/lib/spreadsheet/types"

function isHolidayLocked(row: SpreadsheetRow) {
  return Boolean(row.holidayLocked)
}

function getShiftTypeOptions(row: SpreadsheetRow) {
  return isHolidayLocked(row) ? SHIFT_TYPE_OPTIONS : MANUAL_SHIFT_TYPE_OPTIONS
}

export const scheduleColumns: SpreadsheetColumnDef[] = [
  {
    field: "employeeName",
    headerName: "Employee",
    type: "readonly",
    pinned: "left",
    minWidth: 240,
  },
  {
    field: "employeeId",
    headerName: "Employee ID",
    type: "readonly",
    pinned: "left",
    minWidth: 120,
  },
  {
    field: "date",
    headerName: "Date",
    type: "readonly",
    minWidth: 120,
  },
  {
    field: "shiftType",
    headerName: "Shift Type",
    type: "select",
    options: getShiftTypeOptions,
    minWidth: 180,
    editable: (row) => !isHolidayLocked(row),
  },
  {
    field: "shiftIn",
    headerName: "Shift In",
    type: "text",
    minWidth: 110,
    editable: (row) => !isHolidayLocked(row),
  },
  {
    field: "shiftOut",
    headerName: "Shift Out",
    type: "text",
    minWidth: 110,
    editable: (row) => !isHolidayLocked(row),
  },
  { field: "logIn", headerName: "Log In", type: "text", minWidth: 110 },
  { field: "logOut", headerName: "Log Out", type: "text", minWidth: 110 },
]
