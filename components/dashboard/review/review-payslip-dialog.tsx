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
import type { Employee, Payslip, PayslipPayrollInputs, Role } from "@/lib/types"

function payslipHasData(inputs: PayslipPayrollInputs): boolean {
  return Object.values(inputs).some(
    (value) => typeof value === "number" && value > 0
  )
}

type ReviewPayslipDialogProps = {
  employees: Employee[]
  payslips: Payslip[]
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
  employees,
  payslips,
  activeIndex,
  onActiveIndexChange,
  open,
  onOpenChange,
  role,
}: ReviewPayslipDialogProps) {
  const router = useRouter()
  const activePayslip = activeIndex >= 0 ? payslips[activeIndex] : null
  const [error, setError] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  const canGoPrev = activeIndex > 0
  const canGoNext = activeIndex >= 0 && activeIndex < payslips.length - 1

  const canAdminAct = role === "admin" && activePayslip?.status === "pending"
  const canSuperAdminAct =
    role === "superAdmin" && activePayslip?.status === "adminApproved"
  const hasActions = canAdminAct || canSuperAdminAct

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
    const matchIndex = payslips.findIndex(
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
    const hasNextInQueue = nextIndex < payslips.length

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
        activeIndex < payslips.length - 1
      ) {
        event.preventDefault()
        setError(null)
        onActiveIndexChange(activeIndex + 1)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, activeIndex, payslips.length, onActiveIndexChange])

  if (!activePayslip) {
    return null
  }

  const activeEmployee = employees.find(
    (employee) => employee.employeeId === activePayslip.employeeId
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        closeOnOutsideClick={false}
        className="flex max-h-[min(92vh,56rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
      >
        <DialogHeader className="shrink-0 gap-0 border-b px-6 py-4">
          <DialogTitle className="sr-only">
            Review payslip for {activePayslip.employeeName}
          </DialogTitle>
          <div className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={goToPrev}
                disabled={!canGoPrev || isPending}
                aria-label="Previous payslip"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
              </Button>
              <EmployeeCombobox
                employees={employees}
                value={activePayslip.employeeId}
                onChange={handleEmployeeChange}
                disabled={isPending}
                label=""
                className="min-w-0 flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={goToNext}
                disabled={!canGoNext || isPending}
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

          <PayslipBreakdown
            inputs={activePayslip.inputs}
            divisor={activeEmployee?.divisor}
          />
        </div>

        <div className="shrink-0 border-t bg-popover px-6 py-4">
          <div
            className={
              hasActions
                ? "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
                : "flex flex-col gap-4"
            }
          >
            <PayslipSummary totals={activePayslip.totals} variant="inline" />
            {hasActions ? (
              <div className="flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReturn}
                  disabled={isPending}
                >
                  {isPending ? "Saving…" : "Return"}
                </Button>
                <Button
                  type="button"
                  onClick={handleApprove}
                  disabled={isPending || !payslipHasData(activePayslip.inputs)}
                >
                  {isPending
                    ? "Saving…"
                    : role === "admin"
                      ? "Mark Checked"
                      : "Ready for email"}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
