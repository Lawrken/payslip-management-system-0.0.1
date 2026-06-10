"use client"

import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import {
  addEmployeeAction,
  type AddEmployeeState,
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
  DialogTrigger,
} from "@/components/ui/dialog"

const initialState: AddEmployeeState = {}

type AddEmployeeDialogProps = {
  children: React.ReactNode
}

export function AddEmployeeDialog({ children }: AddEmployeeDialogProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [state, setState] = React.useState<AddEmployeeState>(initialState)
  const [formKey, setFormKey] = React.useState(0)
  const [isPending, startTransition] = React.useTransition()
  const formRef = React.useRef<HTMLFormElement>(null)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await addEmployeeAction(initialState, formData)

      if (result.success && result.initialPassword) {
        setOpen(false)
        setState(initialState)
        setFormKey((key) => key + 1)
        formRef.current?.reset()
        router.refresh()
        toast.success("Employee created", {
          description:
            "Share the initial password with the employee and ask them to change it after first login.",
          action: {
            label: "Copy password",
            onClick: () => {
              void navigator.clipboard.writeText(result.initialPassword!)
            },
          },
          duration: 10000,
        })
        return
      }

      setState(result)
    })
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen) {
      setState(initialState)
      setFormKey((key) => key + 1)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex max-h-[min(92vh,48rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>Add Employee</DialogTitle>
          <DialogDescription>
            Add the employee details used for payroll and payslip generation.
          </DialogDescription>
        </DialogHeader>
        <form
          ref={formRef}
          key={formKey}
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <div className="flex flex-col gap-4">
              {state.error ? (
                <Alert variant="destructive">
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              ) : null}
              <EmployeeFormFields resetKey={formKey} />
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t px-6 py-4">
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
        </form>
      </DialogContent>
    </Dialog>
  )
}
