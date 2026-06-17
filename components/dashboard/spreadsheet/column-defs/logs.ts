import type { SpreadsheetColumnDef } from "@/components/dashboard/spreadsheet/column-defs/types"

export const auditLogColumns: SpreadsheetColumnDef[] = [
  {
    field: "createdAt",
    headerName: "Created",
    type: "readonly",
    pinned: "left",
    minWidth: 180,
    format: (value) =>
      value ? new Date(String(value)).toLocaleString() : "",
  },
  {
    field: "actorEmployeeId",
    headerName: "Actor",
    type: "readonly",
    minWidth: 120,
  },
  {
    field: "actorRole",
    headerName: "Actor Role",
    type: "readonly",
    minWidth: 120,
  },
  { field: "action", headerName: "Action", type: "readonly", minWidth: 200 },
  {
    field: "targetType",
    headerName: "Target Type",
    type: "readonly",
    minWidth: 120,
  },
  {
    field: "targetId",
    headerName: "Target ID",
    type: "readonly",
    minWidth: 300,
  },
  {
    field: "targetLabel",
    headerName: "Target",
    type: "readonly",
    minWidth: 280,
  },
  { field: "details", headerName: "Details", type: "readonly", minWidth: 420 },
]
