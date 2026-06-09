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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
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
  const [copyStatus, setCopyStatus] = React.useState("")
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
      }
    })
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen) {
      setState(initialState)
      setCopyStatus("")
    }
  }

  async function copyInitialPassword() {
    if (!state.initialPassword) {
      return
    }
    await navigator.clipboard.writeText(state.initialPassword)
    setCopyStatus("Copied.")
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Employee</DialogTitle>
          <DialogDescription>
            Add the employee details used for payroll and payslip generation.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit}>
          <FieldGroup>
            {state.error ? (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}
            {state.success && state.initialPassword ? (
              <Alert>
                <AlertDescription>
                  <span className="block">{state.message}</span>
                  <span className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <span className="font-mono text-sm">
                      {state.initialPassword}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyInitialPassword}
                    >
                      Copy Password
                    </Button>
                    {copyStatus ? (
                      <span className="text-xs text-muted-foreground">
                        {copyStatus}
                      </span>
                    ) : null}
                  </span>
                </AlertDescription>
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
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
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
