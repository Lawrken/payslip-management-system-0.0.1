"use client"

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import {
  adminApprovePayslipAction,
  returnPayslipAction,
  superAdminApprovePayslipAction,
} from "@/app/dashboard/review/actions"
import {
  getEmployeeByEmployeeIdAction,
  getPayslipByIdAction,
} from "@/app/dashboard/payslips/actions"
import { getEmployeeScheduleAction } from "@/app/dashboard/schedule/actions"
import { EmployeeCombobox } from "@/components/dashboard/shared/employee-combobox"
import { PayslipBreakdown } from "@/components/dashboard/shared/payslip-breakdown"
import { PayslipSummary } from "@/components/dashboard/payslips/payslip-summary"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { EmployeeOption } from "@/lib/employees"
import type { EmployeeDivisor } from "@/lib/employee-options"
import { formatDayOfWeek, formatLongDisplayDate } from "@/lib/payroll-dates"
import type { EmployeeScheduleDay, Payslip, PayslipListItem, PayslipPayrollInputs, Role } from "@/lib/types"

function payslipHasData(inputs: PayslipPayrollInputs): boolean {
  return Object.values(inputs).some(
    (value) => typeof value === "number" && value > 0
  )
}

type ReviewPayslipDialogProps = {
  employeeOptions: EmployeeOption[]
  payslipListItems: PayslipListItem[]
  activePayslipId: string | null
  activeIndex: number
  onActiveIndexChange: (index: number) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role
}

function isEditableElement(element: Element | null): boolean {
  if (!element) {
    return false
  }
  const tagName = element.tagName
  return (
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT" ||
    element.getAttribute("contenteditable") === "true"
  )
}

export function ReviewPayslipDialog({
  employeeOptions,
  payslipListItems,
  activePayslipId,
  activeIndex,
  onActiveIndexChange,
  open,
  onOpenChange,
  role,
}: ReviewPayslipDialogProps) {
  const router = useRouter()
  const activeListItem =
    activeIndex >= 0 ? payslipListItems[activeIndex] : null
  const [activePayslip, setActivePayslip] = React.useState<Payslip | null>(null)
  const [employeeDivisor, setEmployeeDivisor] =
    React.useState<EmployeeDivisor | undefined>(undefined)
  const [error, setError] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()
  const [isLoadingPayslip, setIsLoadingPayslip] = React.useState(false)
  const [schedule, setSchedule] = React.useState<EmployeeScheduleDay[] | null>(null)
  const [isLoadingSchedule, setIsLoadingSchedule] = React.useState(false)

  const canGoPrev = activeIndex > 0
  const canGoNext = activeIndex >= 0 && activeIndex < payslipListItems.length - 1

  const canAdminAct = role === "admin" && activePayslip?.status === "pending"
  const canSuperAdminAct =
    role === "superAdmin" && activePayslip?.status === "adminApproved"
  const hasActions = canAdminAct || canSuperAdminAct

  React.useEffect(() => {
    if (!open || !activePayslipId) {
      return
    }

    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) {
        setIsLoadingPayslip(true)
      }
    })
    void getPayslipByIdAction(activePayslipId).then((result) => {
      if (cancelled) {
        return
      }
      setIsLoadingPayslip(false)
      if ("error" in result) {
        setError(result.error)
        setActivePayslip(null)
        return
      }
      setActivePayslip(result.payslip)
      void getEmployeeByEmployeeIdAction(result.payslip.employeeId).then(
        (employeeResult) => {
          if (cancelled || "error" in employeeResult) {
            setEmployeeDivisor(undefined)
            return
          }
          setEmployeeDivisor(employeeResult.employee.divisor)
        }
      )
    })

    return () => {
      cancelled = true
    }
  }, [open, activePayslipId])

  // Clear schedule when navigating between payslips; fetch after payslip loads
  React.useEffect(() => {
    setSchedule(null)
    setIsLoadingSchedule(false)
  }, [activePayslipId])

  React.useEffect(() => {
    if (!activePayslip) {
      return
    }

    let cancelled = false
    setIsLoadingSchedule(true)

    void getEmployeeScheduleAction(
      activePayslip.payrollId,
      activePayslip.employeeId
    ).then((result) => {
      if (cancelled) {
        return
      }
      setIsLoadingSchedule(false)
      if ("error" in result) {
        setSchedule(null)
        return
      }
      setSchedule(result.schedule?.days ?? null)
    })

    return () => {
      cancelled = true
    }
  }, [activePayslip])

  const viewOnlyMessage = React.useMemo(() => {
    if (!activePayslip || hasActions) {
      return null
    }
    if (activePayslip.status === "draft") {
      return "Edit this payslip on Payslips before reviewing."
    }
    if (activePayslip.status === "returned") {
      return "This payslip was returned. Edit it on Payslips, then resubmit for review."
    }
    return null
  }, [activePayslip, hasActions])

  function handleClose() {
    onOpenChange(false)
    setError(null)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setError(null)
      onOpenChange(true)
      return
    }
    handleClose()
  }

  function goToPrev() {
    if (canGoPrev) {
      setError(null)
      onActiveIndexChange(activeIndex - 1)
    }
  }

  function goToNext() {
    if (canGoNext) {
      setError(null)
      onActiveIndexChange(activeIndex + 1)
    }
  }

  function handleEmployeeChange(nextEmployeeId: string) {
    const matchIndex = payslipListItems.findIndex(
      (payslip) => payslip.employeeId === nextEmployeeId
    )
    if (matchIndex >= 0) {
      setError(null)
      onActiveIndexChange(matchIndex)
    }
  }

  function handleApprove() {
    if (!activePayslip) {
      return
    }

    const nextIndex = activeIndex + 1
    const hasNextInQueue = nextIndex < payslipListItems.length

    startTransition(async () => {
      const result =
        role === "admin"
          ? await adminApprovePayslipAction(activePayslip.id)
          : await superAdminApprovePayslipAction(activePayslip.id)

      if (result.error) {
        setError(result.error)
        return
      }

      setError(null)
      toast.success(role === "admin" ? "Payslip checked" : "Payslip approved", {
        description: `${activePayslip.employeeName} (${activePayslip.employeeId})`,
      })
      if (hasNextInQueue) {
        onActiveIndexChange(nextIndex)
      } else {
        handleClose()
      }
      router.refresh()
    })
  }

  function handleReturn() {
    if (!activePayslip) {
      return
    }

    startTransition(async () => {
      const result = await returnPayslipAction(activePayslip.id)

      if (result.error) {
        setError(result.error)
        return
      }

      handleClose()
      toast.success("Payslip returned", {
        description: `${activePayslip.employeeName} (${activePayslip.employeeId})`,
      })
      router.refresh()
    })
  }

  React.useEffect(() => {
    if (!open) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableElement(document.activeElement)) {
        return
      }
      if (event.key === "ArrowLeft" && activeIndex > 0) {
        event.preventDefault()
        setError(null)
        onActiveIndexChange(activeIndex - 1)
      } else if (
        event.key === "ArrowRight" &&
        activeIndex >= 0 &&
        activeIndex < payslipListItems.length - 1
      ) {
        event.preventDefault()
        setError(null)
        onActiveIndexChange(activeIndex + 1)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, activeIndex, payslipListItems.length, onActiveIndexChange])

  if (!activeListItem) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        closeOnOutsideClick={false}
        className="flex max-h-[min(92vh,56rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
      >
        <DialogHeader className="shrink-0 gap-0 border-b px-6 py-4">
          <DialogTitle className="sr-only">
            Review payslip for {activeListItem.employeeName}
          </DialogTitle>
          <div className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={goToPrev}
                disabled={!canGoPrev || isPending || isLoadingPayslip}
                aria-label="Previous payslip"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
              </Button>
              <EmployeeCombobox
                employees={employeeOptions}
                value={activeListItem.employeeId}
                onChange={handleEmployeeChange}
                disabled={isPending || isLoadingPayslip}
                label=""
                className="min-w-0 flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={goToNext}
                disabled={!canGoNext || isPending || isLoadingPayslip}
                aria-label="Next payslip"
              >
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
              </Button>
            </div>
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0"
                disabled={isPending}
              >
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {error ? (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {viewOnlyMessage ? (
            <p className="mb-4 text-sm text-muted-foreground">
              {viewOnlyMessage}
            </p>
          ) : null}

          {isLoadingPayslip || !activePayslip ? (
            <p className="text-sm text-muted-foreground">Loading payslip…</p>
          ) : (
            <>
              <PayslipBreakdown
                inputs={activePayslip.inputs}
                divisor={employeeDivisor}
                attendance={activePayslip.attendance}
              />

              <div className="mt-6">
                <h3 className="mb-2 text-sm font-medium">Schedule</h3>
                {isLoadingSchedule ? (
                  <p className="text-sm text-muted-foreground">Loading schedule…</p>
                ) : !schedule || schedule.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No schedule data available.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Day</TableHead>
                          <TableHead>Shift Type</TableHead>
                          <TableHead>Shift-In</TableHead>
                          <TableHead>Shift-Out</TableHead>
                          <TableHead>Log-In</TableHead>
                          <TableHead>Log-Out</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {schedule.map((day) => (
                          <TableRow key={day.date}>
                            <TableCell className="font-medium">{formatLongDisplayDate(day.date)}</TableCell>
                            <TableCell>{formatDayOfWeek(day.date)}</TableCell>
                            <TableCell>{day.shiftType || "—"}</TableCell>
                            <TableCell>{day.shiftIn || "—"}</TableCell>
                            <TableCell>{day.shiftOut || "—"}</TableCell>
                            <TableCell>{day.logIn || "—"}</TableCell>
                            <TableCell>{day.logOut || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="shrink-0 border-t bg-popover px-6 py-4">
          <div
            className={
              hasActions
                ? "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
                : "flex flex-col gap-4"
            }
          >
            <PayslipSummary
              totals={
                activePayslip?.totals ?? {
                  taxableEarnings: 0,
                  totalDeductions: 0,
                  nonTaxableEarnings: 0,
                  grossPay: 0,
                  netPay: 0,
                }
              }
              variant="inline"
            />
            {hasActions ? (
              <div className="flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReturn}
                  disabled={isPending || !activePayslip}
                >
                  {isPending ? "Saving…" : "Return"}
                </Button>
                <Button
                  type="button"
                  onClick={handleApprove}
                  disabled={
                    isPending ||
                    !activePayslip ||
                    !payslipHasData(activePayslip.inputs)
                  }
                >
                  {isPending
                    ? "Saving…"
                    : role === "admin"
                      ? "Mark Checked"
                      : "Release"}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
