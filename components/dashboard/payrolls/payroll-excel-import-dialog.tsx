"use client"

import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type ImportError = {
  sheet: string
  row: number
  column: string
  message: string
}

type DryRunResponse = {
  valid: boolean
  errors: ImportError[]
  warnings?: ImportError[]
  summary: {
    payslipCount: number
    scheduleRowCount: number
  }
}

type PayrollExcelImportDialogProps = {
  payrollId: string
  children: React.ReactNode
  className?: string
}

export function PayrollExcelImportDialog({
  payrollId,
  children,
  className,
}: PayrollExcelImportDialogProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [dryRunResult, setDryRunResult] = React.useState<DryRunResponse | null>(
    null
  )
  const [requestError, setRequestError] = React.useState<string | null>(null)
  const [isValidating, setIsValidating] = React.useState(false)
  const [isApplying, setIsApplying] = React.useState(false)

  function resetState() {
    setSelectedFile(null)
    setDryRunResult(null)
    setRequestError(null)
    setIsValidating(false)
    setIsApplying(false)
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      resetState()
    }
  }

  async function runDryRun(file: File) {
    setIsValidating(true)
    setRequestError(null)
    setDryRunResult(null)

    const formData = new FormData()
    formData.set("file", file)

    try {
      const response = await fetch(
        `/dashboard/payrolls/${payrollId}/import?dryRun=1`,
        {
          method: "POST",
          body: formData,
        }
      )
      const body = (await response.json()) as DryRunResponse & { error?: string }
      if (!response.ok) {
        setRequestError(body.error ?? "Validation failed.")
        if (body.errors) {
          setDryRunResult(body)
        }
        return
      }
      setDryRunResult(body)
    } catch {
      setRequestError("Unable to validate the workbook. Try again.")
    } finally {
      setIsValidating(false)
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setSelectedFile(file)
    setDryRunResult(null)
    setRequestError(null)

    if (file) {
      await runDryRun(file)
    }
  }

  async function handleApply() {
    if (!selectedFile || !dryRunResult?.valid) {
      return
    }

    setIsApplying(true)
    setRequestError(null)

    const formData = new FormData()
    formData.set("file", selectedFile)

    try {
      const response = await fetch(`/dashboard/payrolls/${payrollId}/import`, {
        method: "POST",
        body: formData,
      })
      const body = (await response.json()) as {
        success?: boolean
        error?: string
        updatedPayslips?: number
        updatedSchedules?: number
        errors?: ImportError[]
      }

      if (!response.ok || !body.success) {
        setRequestError(
          body.error ??
            body.errors?.[0]?.message ??
            "Import failed. Fix the workbook and try again."
        )
        if (body.errors) {
          setDryRunResult({
            valid: false,
            errors: body.errors,
            summary: dryRunResult.summary,
          })
        }
        return
      }

      toast.success("Excel import applied", {
        description: `${body.updatedPayslips ?? 0} payslips and ${body.updatedSchedules ?? 0} schedules updated.`,
      })
      handleOpenChange(false)
      router.refresh()
    } catch {
      setRequestError("Unable to apply the workbook. Try again.")
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className={cn("sm:max-w-xl", className)}>
        <DialogHeader>
          <DialogTitle>Import Excel workbook</DialogTitle>
          <DialogDescription>
            Upload the payroll workbook for this period. Only Payslips and
            Schedule sheets are imported.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleFileChange}
            disabled={isValidating || isApplying}
          />

          {isValidating ? (
            <p className="text-sm text-muted-foreground">Validating workbook…</p>
          ) : null}

          {requestError ? (
            <p className="text-sm text-destructive">{requestError}</p>
          ) : null}

          {dryRunResult?.valid ? (
            <p className="text-sm text-muted-foreground">
              Ready to import {dryRunResult.summary.payslipCount} payslips and{" "}
              {dryRunResult.summary.scheduleRowCount} schedule rows.
            </p>
          ) : null}

          {dryRunResult && !dryRunResult.valid && dryRunResult.errors.length > 0 ? (
            <div className="max-h-56 overflow-y-auto rounded-md border p-3">
              <ul className="space-y-2 text-sm">
                {dryRunResult.errors.map((error, index) => (
                  <li key={`${error.sheet}-${error.row}-${error.column}-${index}`}>
                    <span className="font-medium">
                      {error.sheet}
                      {error.row > 0 ? ` row ${error.row}` : ""}
                      {error.column ? ` · ${error.column}` : ""}
                    </span>
                    {": "}
                    {error.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {dryRunResult?.warnings && dryRunResult.warnings.length > 0 ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
              <p className="font-medium">Warnings</p>
              <ul className="mt-2 space-y-1">
                {dryRunResult.warnings.slice(0, 5).map((warning, index) => (
                  <li key={`${warning.sheet}-${warning.row}-${index}`}>
                    {warning.sheet} row {warning.row}: {warning.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isApplying}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleApply()}
            disabled={!dryRunResult?.valid || isValidating || isApplying}
          >
            {isApplying ? "Applying…" : "Apply import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
