"use client"

import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import {
  updatePayrollAction,
  type UpdatePayrollState,
} from "@/app/dashboard/payrolls/actions"
import { PayrollDialogSteps } from "@/components/dashboard/payrolls/payroll-dialog-steps"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Payroll } from "@/lib/types"
import { cn } from "@/lib/utils"

const initialState: UpdatePayrollState = {}

type EditPayrollDialogProps = {
  payroll: Payroll
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditPayrollDialog({
  payroll,
  open,
  onOpenChange,
}: EditPayrollDialogProps) {
  const router = useRouter()
  const [state, setState] = React.useState<UpdatePayrollState>(initialState)
  const [step, setStep] = React.useState<1 | 2>(1)
  const [isPending, startTransition] = React.useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updatePayrollAction(initialState, formData)
      setState(result)

      if (result.success) {
        onOpenChange(false)
        toast.success("Payroll updated", {
          description: payroll.payrollPeriodLabel,
        })
        router.refresh()
      }
    })
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setStep(1)
      setState(initialState)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          step === 2
            ? "flex max-h-[min(92vh,48rem)] flex-col sm:max-w-5xl"
            : "sm:max-w-lg"
        )}
      >
        <DialogHeader>
          <DialogTitle>Edit Payroll</DialogTitle>
        </DialogHeader>
        <PayrollDialogSteps
          key={open ? payroll.id : "edit-closed"}
          mode="edit"
          payroll={payroll}
          error={state.error}
          isPending={isPending}
          submitLabel="Save Changes"
          onSubmit={handleSubmit}
          onCancel={() => handleOpenChange(false)}
          onStepChange={setStep}
        />
      </DialogContent>
    </Dialog>
  )
}
