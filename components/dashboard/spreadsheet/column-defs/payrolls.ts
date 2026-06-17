import type { SpreadsheetColumnDef } from "@/components/dashboard/spreadsheet/column-defs/types"

export const payrollColumns: SpreadsheetColumnDef[] = [
  {
    field: "payrollPeriodLabel",
    headerName: "Period Label",
    type: "readonly",
    pinned: "left",
    minWidth: 180,
  },
  {
    field: "payrollPeriodStart",
    headerName: "Period Start",
    type: "date",
    minWidth: 130,
  },
  {
    field: "payrollPeriodEnd",
    headerName: "Period End",
    type: "date",
    minWidth: 130,
  },
  {
    field: "dtrCutOffStart",
    headerName: "DTR Cut-off Start",
    type: "date",
    minWidth: 150,
  },
  {
    field: "dtrCutOffEnd",
    headerName: "DTR Cut-off End",
    type: "date",
    minWidth: 150,
  },
  { field: "payoutDate", headerName: "Payout Date", type: "date", minWidth: 130 },
]
