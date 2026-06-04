"use client"

import { useRouter } from "next/navigation"
import * as React from "react"

import {
  addEmployeeAction,
  type AddEmployeeState,
} from "@/app/dashboard/employees/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { NumericInput } from "@/components/dashboard/shared/numeric-input"
import { Input } from "@/components/ui/input"

const initialState: AddEmployeeState = {}

type AddEmployeeDialogProps = {
  children: React.ReactNode
}

export function AddEmployeeDialog({ children }: AddEmployeeDialogProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [state, setState] = React.useState<AddEmployeeState>(initialState)
  const [isPending, startTransition] = React.useTransition()
  const formRef = React.useRef<HTMLFormElement>(null)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await addEmployeeAction(initialState, formData)
      setState(result)

      if (result.success) {
        formRef.current?.reset()
        router.refresh()
        setOpen(false)
      }
    })
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen) {
      setState(initialState)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Employee</DialogTitle>
          <DialogDescription>
            A login account with an initial password is created automatically.
            Download credentials from the Users page (.xlsx)—passwords are not
            shown here.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit}>
          <FieldGroup>
            {state.error ? (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}
            <Field>
              <FieldLabel htmlFor="name">Employee Name</FieldLabel>
              <Input id="name" name="name" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="employeeId">Employee ID</FieldLabel>
              <Input id="employeeId" name="employeeId" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="tin">TIN</FieldLabel>
              <NumericInput id="tin" name="tin" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="sssNo">SSS NO.</FieldLabel>
              <NumericInput id="sssNo" name="sssNo" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="phicNo">PHIC NO.</FieldLabel>
              <NumericInput id="phicNo" name="phicNo" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="hdmfNo">HDMF NO.</FieldLabel>
              <NumericInput id="hdmfNo" name="hdmfNo" required />
            </Field>
            <DialogFooter className="px-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving…" : "Save Employee"}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}
