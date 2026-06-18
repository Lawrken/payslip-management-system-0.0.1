import type { NextRequest } from "next/server"

import { requireDashboardSession } from "@/lib/authorization"
import { applyPayrollImport } from "@/lib/excel/apply-payroll-import"
import { parsePayrollWorkbook } from "@/lib/excel/parse-payroll-workbook"
import { preparePayrollImportValidation } from "@/lib/excel/prepare-payroll-import"

export const dynamic = "force-dynamic"

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ payrollId: string }> }
) {
  const session = await requireDashboardSession()
  if ("error" in session) {
    return jsonError(session.error, 401)
  }

  const { payrollId } = await params
  const dryRun = request.nextUrl.searchParams.get("dryRun") === "1"

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return jsonError("Expected multipart form data with a file.", 400)
  }

  const file = formData.get("file")
  if (!(file instanceof File)) {
    return jsonError("Excel file is required.", 400)
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const parsed = parsePayrollWorkbook(buffer)
  if ("error" in parsed) {
    return Response.json(
      {
        valid: false,
        errors: [{ sheet: "", row: 0, column: "", message: parsed.error }],
        summary: { payslipCount: 0, scheduleRowCount: 0 },
      },
      { status: 400 }
    )
  }

  const prepared = await preparePayrollImportValidation(payrollId, parsed)
  if ("error" in prepared) {
    return jsonError(prepared.error ?? "Import preparation failed.", 404)
  }

  const { validation } = prepared

  if (dryRun) {
    return Response.json({
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
      summary: validation.summary,
    })
  }

  if (!validation.valid) {
    return Response.json(
      {
        success: false,
        errors: validation.errors,
        updatedPayslips: 0,
        updatedSchedules: 0,
      },
      { status: 400 }
    )
  }

  const result = await applyPayrollImport({
    session,
    payrollId,
    payslipRows: validation.payslipRows,
    scheduleRows: validation.scheduleRows,
    dirtyEmployeeIds: validation.dirtyEmployeeIds,
  })

  if (!result.success) {
    return Response.json(result, { status: 400 })
  }

  return Response.json(result)
}
