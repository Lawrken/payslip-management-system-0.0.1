"use client"

import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { deletePayrollAction } from "@/app/dashboard/payrolls/actions"
import { PayrollExcelExportButton } from "@/components/dashboard/payrolls/payroll-excel-export-button"
import { EditPayrollDialog } from "@/components/dashboard/payrolls/edit-payroll-dialog"
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
import type { Payroll } from "@/lib/types"

type PayrollRowActionsProps = {
  payroll: Payroll
}

export function PayrollRowActions({ payroll }: PayrollRowActionsProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    const result = await deletePayrollAction(payroll.id)
    setIsDeleting(false)

    if ("error" in result && result.error) {
      return
    }

    setDeleteOpen(false)
    toast.success("Payroll deleted", {
      description: payroll.payrollPeriodLabel,
    })
    router.refresh()
  }

  return (
    <>
      <div className="flex justify-end gap-2">
        <PayrollExcelExportButton payrollId={payroll.id} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setEditOpen(true)}
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
              <AlertDialogTitle>Delete payroll period?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove {payroll.payrollPeriodLabel} and all of its
                payslips.
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
      <EditPayrollDialog
        payroll={payroll}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  )
}
