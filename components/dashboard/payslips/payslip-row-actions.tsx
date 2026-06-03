"use client"

import { useRouter } from "next/navigation"
import * as React from "react"

import { deletePayslipAction } from "@/app/dashboard/payslips/actions"
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

type PayslipRowActionsProps = {
  payslip: Payslip
  onEdit: (payslip: Payslip) => void
}

export function PayslipRowActions({ payslip, onEdit }: PayslipRowActionsProps) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    const result = await deletePayslipAction(payslip.id)
    setIsDeleting(false)

    if ("error" in result && result.error) {
      return
    }

    setDeleteOpen(false)
    router.refresh()
  }

  return (
    <div className="flex justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onEdit(payslip)}
      >
        Edit
      </Button>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="destructive" size="sm">
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete payslip?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the payslip for {payslip.employeeName} (
                {payslip.employeeId}) in this payroll period.
              </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault()
                void handleDelete()
              }}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
