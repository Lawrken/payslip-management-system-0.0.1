"use client"

import * as React from "react"
import { toast } from "sonner"

import { PayslipSummary } from "@/components/dashboard/payslips/payslip-summary"
import { PayslipBreakdown } from "@/components/dashboard/shared/payslip-breakdown"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  formatDisplayDate,
  formatDtrCutOffRange,
} from "@/lib/payroll-dates"
import type {
  PayslipPayrollInputs,
  PayslipStatus,
  PayslipTotals,
} from "@/lib/types"
import type { EmployeeDivisor } from "@/lib/employee-options"

export type EmployeePayslipPreviewItem = {
  id: string
  employeeId: string
  employeeName: string
  employeeDivisor: EmployeeDivisor
  tin: string
  sssNo: string
  phicNo: string
  hdmfNo: string
  payrollPeriodLabel: string
  dtrCutOffStart: string
  dtrCutOffEnd: string
  payoutDate: string
  status: PayslipStatus
  inputs: PayslipPayrollInputs
  totals: PayslipTotals
}

type EmployeePayslipViewerProps = {
  payslip: EmployeePayslipPreviewItem | null
}

function getDownloadFilename(response: Response, payslip: EmployeePayslipPreviewItem) {
  const disposition = response.headers.get("Content-Disposition")
  const match = disposition?.match(/filename="([^"]+)"/)
  if (match?.[1]) {
    return match[1]
  }
  const fallback = `${payslip.employeeId}-${payslip.payrollPeriodLabel}`
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
  return `${fallback || "payslip"}.pdf`
}

export function EmployeePayslipViewer({
  payslip,
}: EmployeePayslipViewerProps) {
  const [downloadOpen, setDownloadOpen] = React.useState(false)
  const [password, setPassword] = React.useState("")
  const [downloadError, setDownloadError] = React.useState<string | null>(null)
  const [isDownloading, setIsDownloading] = React.useState(false)

  async function handleDownloadPdf() {
    if (!payslip) {
      return
    }

    setIsDownloading(true)
    setDownloadError(null)

    try {
      const response = await fetch(
        `/payslips/${encodeURIComponent(payslip.id)}/pdf`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword: password }),
        }
      )

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        setDownloadError(body?.error ?? "Failed to download payslip PDF.")
        return
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = getDownloadFilename(response, payslip)
      document.body.append(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)

      setPassword("")
      setDownloadOpen(false)
      toast.success("Payslip PDF downloaded", {
        description: payslip.payrollPeriodLabel,
      })
    } finally {
      setIsDownloading(false)
    }
  }

  if (!payslip) {
    return (
      <section className="w-full py-6">
        <p className="text-sm text-muted-foreground">
          No released payslips yet.
        </p>
      </section>
    )
  }

  return (
    <section className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-3 text-sm">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">
                {payslip.employeeName}
              </h2>
              <p className="text-muted-foreground">{payslip.employeeId}</p>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
              <div>
                <dt className="text-xs text-muted-foreground">TIN</dt>
                <dd className="font-medium tabular-nums">{payslip.tin || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">SSS</dt>
                <dd className="font-medium tabular-nums">
                  {payslip.sssNo || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">PHIC</dt>
                <dd className="font-medium tabular-nums">
                  {payslip.phicNo || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">HDMF</dt>
                <dd className="font-medium tabular-nums">
                  {payslip.hdmfNo || "-"}
                </dd>
              </div>
            </dl>
          </div>
          <AlertDialog
            open={downloadOpen}
            onOpenChange={(nextOpen) => {
              setDownloadOpen(nextOpen)
              if (!nextOpen) {
                setPassword("")
                setDownloadError(null)
              }
            }}
          >
            <AlertDialogTrigger asChild>
              <Button type="button" size="sm">
                Download PDF
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Download payslip PDF?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will download a password-protected PDF for{" "}
                  {payslip.payrollPeriodLabel}. Enter your current portal
                  password to lock and open the PDF.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="grid gap-2">
                <Label htmlFor="payslip-download-password">
                  Current password
                </Label>
                <Input
                  id="payslip-download-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              {downloadError ? (
                <p className="text-sm text-destructive">{downloadError}</p>
              ) : null}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDownloading}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={isDownloading || !password}
                  onClick={(event) => {
                    event.preventDefault()
                    void handleDownloadPdf()
                  }}
                >
                  {isDownloading ? "Preparing..." : "Download"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="grid gap-2 text-sm sm:grid-cols-3">
          <div className="dashboard-chart-card rounded-xl p-3.5">
            <p className="text-xs text-muted-foreground">Payslip Date</p>
            <p className="font-medium">{payslip.payrollPeriodLabel}</p>
          </div>
          <div className="dashboard-chart-card rounded-xl p-3.5">
            <p className="text-xs text-muted-foreground">Payout</p>
            <p className="font-semibold tabular-nums">
              {formatDisplayDate(payslip.payoutDate)}
            </p>
          </div>
          <div className="dashboard-chart-card rounded-xl p-3.5">
            <p className="text-xs text-muted-foreground">DTR Cut-Off</p>
            <p className="font-medium">
              {formatDtrCutOffRange(
                payslip.dtrCutOffStart,
                payslip.dtrCutOffEnd
              )}
            </p>
          </div>
        </div>
        <PayslipSummary totals={payslip.totals} variant="compact" />
        <PayslipBreakdown
          inputs={payslip.inputs}
          divisor={payslip.employeeDivisor}
        />
      </div>
    </section>
  )
}
