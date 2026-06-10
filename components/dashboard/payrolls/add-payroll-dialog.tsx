"use client"

import { useRouter } from "next/navigation"
import * as React from "react"

import {
  addPayrollAction,
  type AddPayrollState,
} from "@/app/dashboard/payrolls/actions"
import { PayrollDialogSteps } from "@/components/dashboard/payrolls/payroll-dialog-steps"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const initialState: AddPayrollState = {}

type AddPayrollDialogProps = {
  children: React.ReactNode
}

export function AddPayrollDialog({ children }: AddPayrollDialogProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [state, setState] = React.useState<AddPayrollState>(initialState)
  const [step, setStep] = React.useState<1 | 2>(1)
  const [isPending, startTransition] = React.useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await addPayrollAction(initialState, formData)
      setState(result)

      if (result.success) {
        setOpen(false)
        router.refresh()
      }
    })
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      setStep(1)
      setState(initialState)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className={cn(
          step === 2
            ? "flex max-h-[min(92vh,48rem)] flex-col sm:max-w-5xl"
            : "sm:max-w-lg"
        )}
      >
        <DialogHeader>
          <DialogTitle>Add Payroll</DialogTitle>
        </DialogHeader>
        <PayrollDialogSteps
          key={open ? "add-open" : "add-closed"}
          mode="add"
          error={state.error}
          isPending={isPending}
          submitLabel="Save Payroll"
          onSubmit={handleSubmit}
          onCancel={() => handleOpenChange(false)}
          onStepChange={setStep}
        />
      </DialogContent>
    </Dialog>
  )
}
