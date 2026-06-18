import type { NextRequest } from "next/server"

import { requireDashboardSession } from "@/lib/authorization"
import { buildPayrollExportWorkbook } from "@/lib/excel/export-payroll-workbook"

export const dynamic = "force-dynamic"

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ payrollId: string }> }
) {
  const session = await requireDashboardSession()
  if ("error" in session) {
    return jsonError(session.error, 401)
  }

  const { payrollId } = await params
  const result = await buildPayrollExportWorkbook(payrollId)
  if ("error" in result) {
    return jsonError(result.error ?? "Export failed.", 404)
  }

  return new Response(new Uint8Array(result.buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "Cache-Control": "no-store",
    },
  })
}
