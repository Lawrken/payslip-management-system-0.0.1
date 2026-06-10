"use client"

import { useRouter } from "next/navigation"
import * as React from "react"

import {
  updateEmployeeAction,
  type UpdateEmployeeState,
} from "@/app/dashboard/employees/actions"
import { EmployeeFormFields } from "@/components/dashboard/employees/employee-form-fields"
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

  function handleOpenChange(nextOpen: boolean) {
    setState(initialState)
    onOpenChange(nextOpen)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await updateEmployeeAction(initialState, formData)
      setState(result)

      if (result.success) {
        onOpenChange(false)
        setState(initialState)
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,48rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>
            Update the employee details below. All fields are required.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          key={employee.id}
          className="flex min-h-0 flex-1 flex-col"
        >
          <input type="hidden" name="id" value={employee.id} />
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <div className="flex flex-col gap-4">
              {state.error ? (
                <Alert variant="destructive">
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              ) : null}
              <EmployeeFormFields
                employee={employee}
                idPrefix={`edit-${employee.id}`}
                resetKey={employee.id}
              />
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
