import { createAuditLog } from "@/lib/audit-logs"
import { requireDashboardSession } from "@/lib/authorization"
import {
  buildCredentialsWorkbookBuffer,
  listCredentialExportsForExport,
} from "@/lib/credential-exports"

export async function GET() {
  const session = await requireDashboardSession()
  if ("error" in session) {
    return new Response(session.error, { status: 401 })
  }

  const rows = await listCredentialExportsForExport()
  const buffer = buildCredentialsWorkbookBuffer(rows)
  const date = new Date().toISOString().slice(0, 10)

  await createAuditLog({
    actor: session,
    action: "credential.export",
    targetType: "credential_exports",
    targetId: "export",
    targetLabel: "Credential export",
    details: `Exported ${rows.length} credential(s) to spreadsheet.`,
  })

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="credentials-${date}.xlsx"`,
    },
  })
}
