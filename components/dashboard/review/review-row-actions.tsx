"use client"

import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { sendPayslipEmailAction } from "@/app/dashboard/review/actions"
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
import type { Payslip } from "@/lib/types"

type ReviewRowActionsProps = {
  payslip: Payslip
  onReview: (payslip: Payslip) => void
}

export function ReviewRowActions({ payslip, onReview }: ReviewRowActionsProps) {
  const router = useRouter()
  const [sendOpen, setSendOpen] = React.useState(false)
  const [isSending, setIsSending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSend() {
    setIsSending(true)
    setError(null)
    const result = await sendPayslipEmailAction(payslip.id)
    setIsSending(false)

    if ("error" in result && result.error) {
      setError(result.error)
      return
    }

    setSendOpen(false)
    toast.success("Payslip email sent", {
      description: `${payslip.employeeName} (${payslip.employeeId})`,
    })
    router.refresh()
  }

  if (payslip.status === "approved") {
    return (
      <div className="flex justify-end">
        <AlertDialog open={sendOpen} onOpenChange={setSendOpen}>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              Send Email
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Send payslip email?</AlertDialogTitle>
              <AlertDialogDescription>
                This will email the payslip for {payslip.employeeName} (
                {payslip.employeeId}) and mark it as sent.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={isSending}
                onClick={(event) => {
                  event.preventDefault()
                  void handleSend()
                }}
              >
                {isSending ? "Sending..." : "Send Email"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  return (
    <div className="flex justify-end">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onReview(payslip)}
      >
        Review
      </Button>
    </div>
  )
}
