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
  const [isDragOver, setIsDragOver] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  function resetState() {
    setSelectedFile(null)
    setDryRunResult(null)
    setRequestError(null)
    setIsValidating(false)
    setIsApplying(false)
    setIsDragOver(false)
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

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragOver(false)
    const file = event.dataTransfer.files?.[0] ?? null
    if (file && file.name.endsWith(".xlsx")) {
      setSelectedFile(file)
      setDryRunResult(null)
      setRequestError(null)
      void runDryRun(file)
    }
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave() {
    setIsDragOver(false)
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

  const errorCount = dryRunResult?.errors.length ?? 0
  const warningCount = dryRunResult?.warnings?.length ?? 0

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
          <div
            className={cn(
              "relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50",
              (isValidating || isApplying) && "pointer-events-none opacity-50"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click()
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {selectedFile ? (
              <p className="text-sm font-medium">{selectedFile.name}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Drag and drop an .xlsx file here, or click to browse
              </p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFileChange}
              disabled={isValidating || isApplying}
              className="sr-only"
              aria-label="Upload Excel file"
            />
          </div>

          {isValidating ? (
            <p className="text-sm text-muted-foreground">Validating workbook…</p>
          ) : null}

          {requestError ? (
            <p className="text-sm text-destructive">{requestError}</p>
          ) : null}

          {dryRunResult && (errorCount > 0 || warningCount > 0) ? (
            <p className="text-sm font-medium">
              {errorCount > 0 ? (
                <span className="text-destructive">{errorCount} error{errorCount !== 1 ? "s" : ""}</span>
              ) : null}
              {errorCount > 0 && warningCount > 0 ? ", " : ""}
              {warningCount > 0 ? (
                <span className="text-amber-600 dark:text-amber-400">{warningCount} warning{warningCount !== 1 ? "s" : ""}</span>
              ) : null}
            </p>
          ) : null}

          {dryRunResult?.valid ? (
            <p className="text-sm text-muted-foreground">
              Ready to import {dryRunResult.summary.payslipCount} payslips and{" "}
              {dryRunResult.summary.scheduleRowCount} schedule rows.
            </p>
          ) : null}

          {dryRunResult && !dryRunResult.valid && dryRunResult.errors.length > 0 ? (
            <div className="max-h-48 overflow-y-auto rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <ul className="space-y-2 text-sm">
                {dryRunResult.errors.map((error, index) => (
                  <li key={`${error.sheet}-${error.row}-${error.column}-${index}`} className="text-destructive">
                    <span className="font-medium">
                      {error.sheet}
                      {error.row > 0 ? ` row ${error.row}` : ""}
                    </span>
                    {": "}
                    {error.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {dryRunResult?.warnings && dryRunResult.warnings.length > 0 ? (
            <div className="max-h-40 overflow-y-auto rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
              <ul className="space-y-1">
                {dryRunResult.warnings.map((warning, index) => (
                  <li key={`${warning.sheet}-${warning.row}-${index}`}>
                    {warning.message}
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
