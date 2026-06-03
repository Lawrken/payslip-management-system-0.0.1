"use client"

import { useRouter } from "next/navigation"
import * as React from "react"

import {
  updatePayrollAction,
  type UpdatePayrollState,
} from "@/app/dashboard/payrolls/actions"
import { PayrollFormFields } from "@/components/dashboard/payrolls/payroll-form-fields"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import type { Payroll } from "@/lib/types"

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
  const [isPending, startTransition] = React.useTransition()
  const formRef = React.useRef<HTMLFormElement>(null)

  React.useEffect(() => {
    if (open) {
      formRef.current?.reset()
    }
  }, [open, payroll])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await updatePayrollAction(initialState, formData)
      setState(result)

      if (result.success) {
        onOpenChange(false)
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Payroll</DialogTitle>
          <DialogDescription>
            Update the payroll period, DTR cut-off, and payout date.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} key={payroll.id}>
          <input type="hidden" name="id" value={payroll.id} />
          <FieldGroup>
            {state.error ? (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}
            <PayrollFormFields payroll={payroll} idPrefix={payroll.id} />
            <DialogFooter className="px-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving…" : "Save Changes"}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}
