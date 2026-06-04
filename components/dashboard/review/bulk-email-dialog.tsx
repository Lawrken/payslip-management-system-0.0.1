"use client"

import { useRouter } from "next/navigation"
import * as React from "react"

import { bulkEmailAction } from "@/app/dashboard/review/actions"
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

type BulkEmailDialogProps = {
  payrollId: string
  disabled: boolean
  approvedCount: number
  totalCount: number
  children: React.ReactNode
}

export function BulkEmailDialog({
  payrollId,
  disabled,
  approvedCount,
  totalCount,
  children,
}: BulkEmailDialogProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [isSending, setIsSending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSend() {
    setIsSending(true)
    setError(null)
    const result = await bulkEmailAction(payrollId)
    setIsSending(false)

    if ("error" in result && result.error) {
      setError(result.error)
      return
    }

    setOpen(false)
    router.refresh()
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild disabled={disabled}>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send bulk email?</AlertDialogTitle>
          <AlertDialogDescription>
            This will email all {approvedCount} payslip
            {approvedCount === 1 ? "" : "s"} ready for email for this payroll
            period and mark them as sent.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}
        {!disabled && approvedCount < totalCount ? (
          <p className="text-sm text-muted-foreground">
            {approvedCount} of {totalCount} payslips are ready for email.
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isSending || disabled}
            onClick={(event) => {
              event.preventDefault()
              void handleSend()
            }}
          >
            {isSending ? "Sending…" : "Send Email"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
