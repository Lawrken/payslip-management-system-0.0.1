"use client"

import * as React from "react"

import { PayrollFormFields } from "@/components/dashboard/payrolls/payroll-form-fields"
import { DtrDayStatusTable } from "@/components/dashboard/payrolls/dtr-day-status-table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import { mergeDtrDays, resolveDtrDays, validateDtrDays } from "@/lib/dtr-days"
import { isValidDateRange } from "@/lib/payroll-dates"
import type { Payroll, PayrollDtrDay } from "@/lib/types"

type PayrollFormValues = {
  payrollPeriodStart: string
  payrollPeriodEnd: string
  dtrCutOffStart: string
  dtrCutOffEnd: string
  payoutDate: string
}

type PayrollDialogStepsProps = {
  mode: "add" | "edit"
  payroll?: Payroll
  error?: string
  isPending: boolean
  submitLabel: string
  onSubmit: (formData: FormData) => void
  onCancel: () => void
  onStepChange?: (step: 1 | 2) => void
}

function readPayrollFormValues(form: HTMLFormElement): PayrollFormValues {
  const formData = new FormData(form)
  return {
    payrollPeriodStart: String(formData.get("payrollPeriodStart") ?? "").trim(),
    payrollPeriodEnd: String(formData.get("payrollPeriodEnd") ?? "").trim(),
    dtrCutOffStart: String(formData.get("dtrCutOffStart") ?? "").trim(),
    dtrCutOffEnd: String(formData.get("dtrCutOffEnd") ?? "").trim(),
    payoutDate: String(formData.get("payoutDate") ?? "").trim(),
  }
}

function validateStep1(values: PayrollFormValues): string | null {
  if (
    !values.payrollPeriodStart ||
    !values.payrollPeriodEnd ||
    !values.dtrCutOffStart ||
    !values.dtrCutOffEnd ||
    !values.payoutDate
  ) {
    return "All date fields are required."
  }

  if (!isValidDateRange(values.payrollPeriodStart, values.payrollPeriodEnd)) {
    return "Payroll period end must be on or after the start date."
  }

  if (!isValidDateRange(values.dtrCutOffStart, values.dtrCutOffEnd)) {
    return "DTR cut-off end must be on or after the start date."
  }

  return null
}

function toPayrollDraft(
  values: PayrollFormValues,
  payroll?: Payroll
): Payroll {
  return {
    id: payroll?.id ?? "",
    payrollPeriodLabel: payroll?.payrollPeriodLabel ?? "",
    ...values,
    dtrDays: [],
  }
}

export function PayrollDialogSteps({
  mode,
  payroll,
  error,
  isPending,
  submitLabel,
  onSubmit,
  onCancel,
  onStepChange,
}: PayrollDialogStepsProps) {
  const formRef = React.useRef<HTMLFormElement>(null)
  const [step, setStep] = React.useState<1 | 2>(1)
  const [step1Values, setStep1Values] = React.useState<PayrollFormValues | null>(
    null
  )
  const [dtrDays, setDtrDays] = React.useState<PayrollDtrDay[]>(() =>
    payroll ? resolveDtrDays(payroll) : []
  )
  const [clientError, setClientError] = React.useState<string | null>(null)

  React.useEffect(() => {
    onStepChange?.(step)
  }, [onStepChange, step])

  function handleNext(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault()

    const form = formRef.current
    if (!form) {
      return
    }

    const values = readPayrollFormValues(form)
    const validationError = validateStep1(values)
    if (validationError) {
      setClientError(validationError)
      return
    }

    setClientError(null)
    setStep1Values(values)
    setDtrDays((currentDays) =>
      mergeDtrDays(
        values.dtrCutOffStart,
        values.dtrCutOffEnd,
        currentDays.length > 0
          ? currentDays
          : payroll
            ? resolveDtrDays(payroll)
            : undefined
      )
    )
    // Defer so the click that activated "Next" cannot fall through to the
    // "Save" button that replaces it in the same footer slot.
    queueMicrotask(() => setStep(2))
  }

  function handleBack() {
    setClientError(null)
    setStep(1)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (step !== 2 || !step1Values) {
      return
    }

    const validationError = validateDtrDays(
      step1Values.dtrCutOffStart,
      step1Values.dtrCutOffEnd,
      dtrDays
    )
    if (validationError) {
      setClientError(validationError.error)
      return
    }

    setClientError(null)
    const formData = new FormData(event.currentTarget)
    formData.set("dtrDays", JSON.stringify(dtrDays))
    onSubmit(formData)
  }

  function handleSaveClick() {
    formRef.current?.requestSubmit()
  }

  const formPayroll = step1Values
    ? toPayrollDraft(step1Values, payroll)
    : payroll
  const formKey = step1Values
    ? `step1-${JSON.stringify(step1Values)}`
    : payroll?.id ?? "new"

  return (
    <>
      <DialogDescription>
        {step === 1
          ? mode === "add"
            ? "Set the payroll period, DTR cut-off, and payout date."
            : "Update the payroll period, DTR cut-off, and payout date."
          : "Set the day status for each date in the DTR cut-off range."}
      </DialogDescription>
      <form ref={formRef} onSubmit={handleSubmit}>
        {payroll ? <input type="hidden" name="id" value={payroll.id} /> : null}
        <FieldGroup>
          {(error ?? clientError) ? (
            <Alert variant="destructive">
              <AlertDescription>{error ?? clientError}</AlertDescription>
            </Alert>
          ) : null}
          {step === 1 ? (
            <PayrollFormFields
              key={formKey}
              payroll={formPayroll}
              idPrefix={payroll?.id}
            />
          ) : step1Values ? (
            <>
              <input
                type="hidden"
                name="payrollPeriodStart"
                value={step1Values.payrollPeriodStart}
              />
              <input
                type="hidden"
                name="payrollPeriodEnd"
                value={step1Values.payrollPeriodEnd}
              />
              <input
                type="hidden"
                name="dtrCutOffStart"
                value={step1Values.dtrCutOffStart}
              />
              <input
                type="hidden"
                name="dtrCutOffEnd"
                value={step1Values.dtrCutOffEnd}
              />
              <input
                type="hidden"
                name="payoutDate"
                value={step1Values.payoutDate}
              />
              <DtrDayStatusTable value={dtrDays} onChange={setDtrDays} />
            </>
          ) : null}
          <DialogFooter className="px-0">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            {step === 2 ? (
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
            ) : null}
            {step === 1 ? (
              <Button type="button" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button
                type="button"
                disabled={isPending}
                onClick={handleSaveClick}
              >
                {isPending ? "Saving…" : submitLabel}
              </Button>
            )}
          </DialogFooter>
        </FieldGroup>
      </form>
    </>
  )
}
