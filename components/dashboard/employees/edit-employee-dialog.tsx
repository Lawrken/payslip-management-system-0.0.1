"use client"

import { useRouter } from "next/navigation"
import * as React from "react"

import {
  updateEmployeeAction,
  type UpdateEmployeeState,
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
} from "@/components/ui/dialog"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { NumericInput } from "@/components/dashboard/shared/numeric-input"
import { Input } from "@/components/ui/input"
import type { Employee } from "@/lib/types"

const initialState: UpdateEmployeeState = {}

type EditEmployeeDialogProps = {
  employee: Employee
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditEmployeeDialog({
  employee,
  open,
  onOpenChange,
}: EditEmployeeDialogProps) {
  const router = useRouter()
  const [state, setState] = React.useState<UpdateEmployeeState>(initialState)
  const [isPending, startTransition] = React.useTransition()
  const formRef = React.useRef<HTMLFormElement>(null)

  React.useEffect(() => {
    if (open) {
      formRef.current?.reset()
    }
  }, [open, employee])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await updateEmployeeAction(initialState, formData)
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
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>
            Update the employee details below. All fields are required.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} key={employee.id}>
          <input type="hidden" name="id" value={employee.id} />
          <FieldGroup>
            {state.error ? (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}
            <Field>
              <FieldLabel htmlFor={`edit-name-${employee.id}`}>
                Employee Name
              </FieldLabel>
              <Input
                id={`edit-name-${employee.id}`}
                name="name"
                defaultValue={employee.name}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`edit-employeeId-${employee.id}`}>
                Employee ID
              </FieldLabel>
              <Input
                id={`edit-employeeId-${employee.id}`}
                name="employeeId"
                defaultValue={employee.employeeId}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`edit-email-${employee.id}`}>Email</FieldLabel>
              <Input
                id={`edit-email-${employee.id}`}
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={employee.email}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`edit-tin-${employee.id}`}>TIN</FieldLabel>
              <NumericInput
                id={`edit-tin-${employee.id}`}
                name="tin"
                defaultValue={employee.tin.replace(/\D/g, "")}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`edit-sssNo-${employee.id}`}>
                SSS NO.
              </FieldLabel>
              <NumericInput
                id={`edit-sssNo-${employee.id}`}
                name="sssNo"
                defaultValue={employee.sssNo.replace(/\D/g, "")}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`edit-phicNo-${employee.id}`}>
                PHIC NO.
              </FieldLabel>
              <NumericInput
                id={`edit-phicNo-${employee.id}`}
                name="phicNo"
                defaultValue={employee.phicNo.replace(/\D/g, "")}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`edit-hdmfNo-${employee.id}`}>
                HDMF NO.
              </FieldLabel>
              <NumericInput
                id={`edit-hdmfNo-${employee.id}`}
                name="hdmfNo"
                defaultValue={employee.hdmfNo.replace(/\D/g, "")}
                required
              />
            </Field>
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
