import type { PayslipFieldDefinition } from "@/lib/payslip-fields"
import {
  DEDUCTION_FIELDS,
  NON_TAXABLE_FIELDS,
  PAY_DETAILS_FIELDS,
} from "@/lib/payslip-fields"
import type { EmployeeDivisor } from "@/lib/employee-options"
import { calculatePayslipTotals } from "@/lib/payroll-calculator"
import type { PayslipPayrollInputs } from "@/lib/types"
import { cn } from "@/lib/utils"

type PayslipBreakdownProps = {
  inputs: PayslipPayrollInputs
  divisor?: EmployeeDivisor | number
}

type BreakdownSectionKind = "pay" | "deduction" | "nonTaxable"

function formatMoney(value: number, { signed = false } = {}) {
  const absValue = Math.abs(value)
  const formatted = absValue.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  if (!signed || value === 0) {
    return `₱${formatted}`
  }

  return `${value < 0 ? "-" : "+"}₱${formatted}`
}

function formatQuantity(field: PayslipFieldDefinition, value: number): string {
  switch (field.inputKind) {
    case "hours":
      return `${value.toLocaleString("en-PH", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })} hrs`
    case "days":
      return value === 1 ? "1 day" : `${value} days`
    case "peso":
      return formatMoney(value)
  }
}

function getAmountClassName(value: number) {
  if (value > 0) {
    return "text-emerald-700 dark:text-emerald-400"
  }
  if (value < 0) {
    return "text-red-700 dark:text-red-400"
  }
  return "text-muted-foreground"
}

function getDisplayAmount({
  sectionKind,
  value,
  lineAmount,
}: {
  sectionKind: BreakdownSectionKind
  value: number
  lineAmount?: number
}) {
  if (sectionKind === "pay") {
    return lineAmount ?? value
  }

  if (sectionKind === "deduction") {
    return -value
  }

  return value
}

function BreakdownValue({
  field,
  sectionKind,
  value,
  lineAmount,
}: {
  field: PayslipFieldDefinition
  sectionKind: BreakdownSectionKind
  value: unknown
  lineAmount?: number
}) {
  if (typeof value !== "number") {
    return "—"
  }

  const amount = getDisplayAmount({
    sectionKind,
    value,
    lineAmount,
  })

  if (field.inputKind === "hours" || field.inputKind === "days") {
    return (
      <span className="flex flex-wrap items-baseline justify-end gap-x-1.5 gap-y-0.5 text-right">
        <span>{formatQuantity(field, value)}</span>
        <span className="text-muted-foreground">/</span>
        <span className={cn("font-semibold", getAmountClassName(amount))}>
          {formatMoney(amount, { signed: true })}
        </span>
      </span>
    )
  }

  return (
    <span className={cn("font-semibold", getAmountClassName(amount))}>
      {formatMoney(amount, { signed: true })}
    </span>
  )
}

function BreakdownSection({
  title,
  fields,
  inputs,
  lineAmounts,
  sectionKind,
}: {
  title: string
  fields: PayslipFieldDefinition[]
  inputs: PayslipPayrollInputs
  lineAmounts?: Record<string, number>
  sectionKind: BreakdownSectionKind
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <dl className="grid gap-1.5 sm:grid-cols-2">
        {fields.map((field) => {
          const value = inputs[field.key as keyof PayslipPayrollInputs]
          return (
            <div
              key={field.key}
              className="flex items-baseline justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2 text-sm"
            >
              <dt className="text-muted-foreground">{field.label}</dt>
              <dd className="shrink-0 font-medium tabular-nums">
                <BreakdownValue
                  field={field}
                  sectionKind={sectionKind}
                  value={value}
                  lineAmount={lineAmounts?.[field.key]}
                />
              </dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}

export function PayslipBreakdown({ inputs, divisor }: PayslipBreakdownProps) {
  const calculation = calculatePayslipTotals(inputs, divisor)

  return (
    <div className="flex flex-col gap-6">
      <BreakdownSection
        title="Pay Details"
        fields={PAY_DETAILS_FIELDS}
        inputs={inputs}
        lineAmounts={calculation.lineAmounts}
        sectionKind="pay"
      />
      <BreakdownSection
        title="Deductions"
        fields={DEDUCTION_FIELDS}
        inputs={inputs}
        sectionKind="deduction"
      />
      <BreakdownSection
        title="Non-Taxable Earnings"
        fields={NON_TAXABLE_FIELDS}
        inputs={inputs}
        sectionKind="nonTaxable"
      />
    </div>
  )
}
