import type { SpreadsheetColumnDef } from "@/components/dashboard/spreadsheet/column-defs/types"
import type { Role } from "@/lib/types"

const ROLES: Role[] = ["admin", "superAdmin", "employee"]

export function getUserColumns(canEditRole: boolean): SpreadsheetColumnDef[] {
  return [
    {
      field: "employeeId",
      headerName: "Employee ID",
      type: "readonly",
      pinned: "left",
      minWidth: 120,
    },
    {
      field: "employeeName",
      headerName: "Name",
      type: "readonly",
      minWidth: 240,
    },
    {
      field: "email",
      headerName: "Email",
      type: "readonly",
      minWidth: 220,
    },
    {
      field: "role",
      headerName: "Role",
      type: canEditRole ? "select" : "readonly",
      options: ROLES,
      minWidth: 120,
      editable: canEditRole,
    },
    {
      field: "passwordChangedAt",
      headerName: "Password Changed",
      type: "readonly",
      minWidth: 180,
      format: (value) => {
        if (!value) {
          return "Initial password"
        }
        return new Date(String(value)).toLocaleString()
      },
    },
  ]
}
