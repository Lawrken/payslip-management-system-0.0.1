"use client"

import { useRouter } from "next/navigation"
import * as React from "react"

import { bulkEmailAction } from "@/app/dashboard/payslips/actions"
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
  pendingCount: number
  payrollId: string
  children: React.ReactNode
}

export function BulkEmailDialog({
  pendingCount,
  payrollId,
  children,
}: BulkEmailDialogProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [isSending, setIsSending] = React.useState(false)

  async function handleSend() {
    setIsSending(true)
    await bulkEmailAction(payrollId)
    setIsSending(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send bulk email?</AlertDialogTitle>
          <AlertDialogDescription>
            {pendingCount > 0
              ? `This will email ${pendingCount} pending payslip${pendingCount === 1 ? "" : "s"} and mark them as sent.`
              : "There are no pending payslips to email."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pendingCount === 0 || isSending}
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
