"use client"

import { useRouter } from "next/navigation"
import * as React from "react"

import {
  saveEmployeeScheduleAction,
  type SaveEmployeeScheduleState,
} from "@/app/dashboard/schedule/actions"
import { EmployeeScheduleDaysTable } from "@/components/dashboard/schedule/employee-schedule-days-table"
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
import { mergeScheduleDays, validateScheduleDays } from "@/lib/schedule-days"
import type { EmployeeSchedule, EmployeeScheduleDay, Payroll } from "@/lib/types"

const initialState: SaveEmployeeScheduleState = {}

type EditEmployeeScheduleDialogProps = {
  payroll: Payroll
  employeeId: string
  employeeName: string
  schedule: EmployeeSchedule | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function EditEmployeeScheduleDialogContent({
  payroll,
  employeeId,
  employeeName,
  schedule,
  onOpenChange,
}: Omit<EditEmployeeScheduleDialogProps, "open">) {
  const router = useRouter()
  const [state, setState] = React.useState<SaveEmployeeScheduleState>(initialState)
  const [clientError, setClientError] = React.useState<string | null>(null)
  const [days, setDays] = React.useState<EmployeeScheduleDay[]>(() =>
    mergeScheduleDays(payroll, schedule?.days)
  )
  const [isPending, startTransition] = React.useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationError = validateScheduleDays(payroll, days)
    if (validationError) {
      setClientError(validationError.error)
      return
    }

    setClientError(null)
    const formData = new FormData(event.currentTarget)
    formData.set("days", JSON.stringify(days))

    startTransition(async () => {
      const result = await saveEmployeeScheduleAction(initialState, formData)
      setState(result)

      if (result.success) {
        onOpenChange(false)
        router.refresh()
      }
    })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{employeeName}</DialogTitle>
        <DialogDescription>
          Employee schedule for {payroll.payrollPeriodLabel}. Holiday shift types
          are set from the payroll DTR calendar.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <input type="hidden" name="payrollId" value={payroll.id} />
        <input type="hidden" name="employeeId" value={employeeId} />
        <FieldGroup>
          {(state.error ?? clientError) ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error ?? clientError}</AlertDescription>
            </Alert>
          ) : null}
          <EmployeeScheduleDaysTable
            payroll={payroll}
            value={days}
            onChange={setDays}
          />
          <DialogFooter className="px-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save Schedule"}
            </Button>
          </DialogFooter>
        </FieldGroup>
      </form>
    </>
  )
}

export function EditEmployeeScheduleDialog({
  payroll,
  employeeId,
  employeeName,
  schedule,
  open,
  onOpenChange,
}: EditEmployeeScheduleDialogProps) {
  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,48rem)] flex-col sm:max-w-5xl">
        {open ? (
          <EditEmployeeScheduleDialogContent
            key={`${payroll.id}-${employeeId}-${schedule?.id ?? "new"}`}
            payroll={payroll}
            employeeId={employeeId}
            employeeName={employeeName}
            schedule={schedule}
            onOpenChange={handleOpenChange}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
