"use client"

import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import {
  addPayslipAction,
  updatePayslipAction,
  type PayslipFormState,
} from "@/app/dashboard/payslips/actions"
import { EmployeeCombobox } from "@/components/dashboard/shared/employee-combobox"
import { PayslipFormSection } from "@/components/dashboard/payslips/payslip-form-section"
import { PayslipSummary } from "@/components/dashboard/payslips/payslip-summary"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DEDUCTION_FIELDS,
  NON_TAXABLE_FIELDS,
  PAY_DETAILS_FIELDS,
} from "@/lib/payslip-fields"
import {
  calculatePayslipTotals,
  createEmptyPayslipInputs,
  createPayslipInputsWithBasicPay,
  DERIVED_PAYSLIP_FIELD_KEYS,
  parseDecimalInput,
} from "@/lib/payroll-calculator"
import type { Employee, Payslip, PayslipPayrollInputs } from "@/lib/types"

const initialState: PayslipFormState = {}
const READ_ONLY_PAYSLIP_FIELDS = new Set<keyof PayslipPayrollInputs>(
  DERIVED_PAYSLIP_FIELD_KEYS
)

type EditPayslipDialogProps = {
  employees: Employee[]
  payslips: Payslip[]
  payrollId: string
  activeIndex: number
  onActiveIndexChange: (index: number) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  children?: React.ReactNode
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

export function EditPayslipDialog({
  employees,
  payslips,
  payrollId,
  activeIndex,
  onActiveIndexChange,
  open,
  onOpenChange,
  children,
}: EditPayslipDialogProps) {
  const router = useRouter()
  const activePayslip = activeIndex >= 0 ? payslips[activeIndex] : null
  const isCreateMode = activeIndex === -1

  const [employeeId, setEmployeeId] = React.useState("")
  const [inputs, setInputs] = React.useState<PayslipPayrollInputs>(
    createEmptyPayslipInputs
  )
  const [fieldDrafts, setFieldDrafts] = React.useState<
    Partial<Record<keyof PayslipPayrollInputs, string>>
  >({})
  const [state, setState] = React.useState<PayslipFormState>(initialState)
  const [isPending, startTransition] = React.useTransition()
  const formRef = React.useRef<HTMLFormElement>(null)

  const selectedEmployee = React.useMemo(
    () => employees.find((employee) => employee.employeeId === employeeId),
    [employees, employeeId]
  )
  const totals = React.useMemo(
    () => calculatePayslipTotals(inputs, selectedEmployee?.divisor),
    [inputs, selectedEmployee?.divisor]
  )

  const canGoPrev = activeIndex > 0
  const canGoNext = activeIndex >= 0 && activeIndex < payslips.length - 1

  function resetForm() {
    setState(initialState)
    setEmployeeId("")
    setInputs(createEmptyPayslipInputs())
    setFieldDrafts({})
    formRef.current?.reset()
  }

  function syncFromPayslip(payslip: Payslip | null) {
    setFieldDrafts({})
    if (!payslip) {
      setEmployeeId("")
      setInputs(createEmptyPayslipInputs())
      return
    }
    setEmployeeId(payslip.employeeId)
    setInputs({ ...payslip.inputs })
  }

  React.useEffect(() => {
    if (!open) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setState(initialState)
      if (activePayslip) {
        syncFromPayslip(activePayslip)
      }
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [open, activePayslip])

  function handleClose() {
    onOpenChange(false)
    resetForm()
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setState(initialState)
      onOpenChange(true)
      return
    }
    handleClose()
  }

  function handleTriggerClick() {
    onActiveIndexChange(-1)
    resetForm()
  }

  function goToPrev() {
    if (canGoPrev) {
      onActiveIndexChange(activeIndex - 1)
    }
  }

  function goToNext() {
    if (canGoNext) {
      onActiveIndexChange(activeIndex + 1)
    }
  }

  function handleEmployeeChange(nextEmployeeId: string) {
    const matchIndex = payslips.findIndex(
      (payslip) => payslip.employeeId === nextEmployeeId
    )
    if (matchIndex >= 0) {
      onActiveIndexChange(matchIndex)
      return
    }

    onActiveIndexChange(-1)
    setEmployeeId(nextEmployeeId)
    const nextEmployee = employees.find(
      (employee) => employee.employeeId === nextEmployeeId
    )
    setInputs(createPayslipInputsWithBasicPay(nextEmployee?.basicPay ?? 0))
    setFieldDrafts({})
  }

  function handleFieldChange(key: keyof PayslipPayrollInputs, value: string) {
    if (value === "") {
      setFieldDrafts((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      setInputs((prev) => ({ ...prev, [key]: 0 }))
      return
    }

    const parseValue = value.endsWith(".") ? value.slice(0, -1) || "0" : value
    const parsed = parseDecimalInput(parseValue)
    if (Number.isNaN(parsed)) {
      return
    }

    setFieldDrafts((prev) => ({ ...prev, [key]: value }))
    setInputs((prev) => ({ ...prev, [key]: parsed }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = isCreateMode
        ? await addPayslipAction(initialState, formData)
        : await updatePayslipAction(initialState, formData)
      setState(result)

      if (result.success) {
        toast.success(isCreateMode ? "Payslip created" : "Payslip updated", {
          description:
            selectedEmployee !== undefined
              ? `${selectedEmployee.name} (${selectedEmployee.employeeId})`
              : undefined,
        })
        handleClose()
        router.refresh()
      }
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
        onActiveIndexChange(activeIndex - 1)
      } else if (
        event.key === "ArrowRight" &&
        activeIndex >= 0 &&
        activeIndex < payslips.length - 1
      ) {
        event.preventDefault()
        onActiveIndexChange(activeIndex + 1)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, activeIndex, payslips.length, onActiveIndexChange])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children ? (
        <DialogTrigger asChild onClick={handleTriggerClick}>
          {children}
        </DialogTrigger>
      ) : null}
      <DialogContent
        showCloseButton={false}
        closeOnOutsideClick={false}
        closeOnEscape={false}
        className="flex max-h-[min(92vh,56rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl"
      >
        <DialogHeader className="shrink-0 space-y-0 border-b px-6 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <DialogTitle className="shrink-0">Edit Payslip</DialogTitle>
            <DialogDescription className="sr-only">
              Edit manual payslip inputs. Attendance, overtime, holiday, and
              night differential fields are calculated from the employee
              schedule.
            </DialogDescription>
            <div className="flex w-full min-w-0 overflow-hidden rounded-md border border-input shadow-xs lg:max-w-xl dark:bg-input/30">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 shrink-0 rounded-none border-r border-input"
                onClick={goToPrev}
                disabled={!canGoPrev || isPending}
                aria-label="Previous payslip"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
              </Button>
              <EmployeeCombobox
                employees={employees}
                value={employeeId}
                onChange={handleEmployeeChange}
                disabled={isPending}
                label=""
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 shrink-0 rounded-none border-l border-input"
                onClick={goToNext}
                disabled={!canGoNext || isPending}
                aria-label="Next payslip"
              >
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          key={activePayslip?.id ?? "create"}
          className="flex min-h-0 flex-1 flex-col"
        >
          <input type="hidden" name="payrollId" value={payrollId} />
          {!isCreateMode && activePayslip ? (
            <input type="hidden" name="id" value={activePayslip.id} />
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex flex-col gap-4 px-6 py-4">
              {state.error ? (
                <Alert variant="destructive">
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              ) : null}

              <div className="-mx-4 no-scrollbar max-h-[min(58vh,34rem)] overflow-y-auto px-4">
                <div className="flex flex-col gap-8">
                  <PayslipFormSection
                    title="Pay Details"
                    fields={PAY_DETAILS_FIELDS}
                    values={inputs}
                    fieldDrafts={fieldDrafts}
                    readOnlyFields={READ_ONLY_PAYSLIP_FIELDS}
                    onChange={handleFieldChange}
                  />
                  <PayslipFormSection
                    title="Deductions"
                    fields={DEDUCTION_FIELDS}
                    values={inputs}
                    fieldDrafts={fieldDrafts}
                    onChange={handleFieldChange}
                  />
                  <PayslipFormSection
                    title="Non-Taxable Earnings"
                    fields={NON_TAXABLE_FIELDS}
                    values={inputs}
                    fieldDrafts={fieldDrafts}
                    onChange={handleFieldChange}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t bg-popover px-6 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <PayslipSummary totals={totals} variant="inline" />
              <div className="flex shrink-0 flex-col-reverse gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || !employeeId}>
                  {isPending ? "Saving…" : "Save Payslip"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
