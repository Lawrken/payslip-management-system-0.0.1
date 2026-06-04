import type { PayslipFieldDefinition } from "@/lib/payslip-fields"
import {
  DEDUCTION_FIELDS,
  NON_TAXABLE_FIELDS,
  PAY_DETAILS_FIELDS,
} from "@/lib/payslip-fields"
import type { PayslipPayrollInputs } from "@/lib/types"

type PayslipBreakdownProps = {
  inputs: PayslipPayrollInputs
}

function formatMoney(value: number) {
  return value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatFieldValue(
  field: PayslipFieldDefinition,
  value: number
): string {
  switch (field.inputKind) {
    case "peso":
      return `₱${formatMoney(value)}`
    case "hours":
      return `${value.toLocaleString("en-PH", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })} hrs`
    case "days":
      return value === 1 ? "1 day" : `${value} days`
  }
}

function BreakdownSection({
  title,
  fields,
  inputs,
}: {
  title: string
  fields: PayslipFieldDefinition[]
  inputs: PayslipPayrollInputs
}) {
  const rows = fields.filter((field) => {
    const value = inputs[field.key as keyof PayslipPayrollInputs]
    return typeof value === "number" && value > 0
  })

  if (rows.length === 0) {
    return null
  }

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <dl className="grid gap-1.5 sm:grid-cols-2">
        {rows.map((field) => {
          const value = inputs[field.key as keyof PayslipPayrollInputs]
          return (
            <div
              key={field.key}
              className="flex items-baseline justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2 text-sm"
            >
              <dt className="text-muted-foreground">{field.label}</dt>
              <dd className="shrink-0 font-medium tabular-nums">
                {formatFieldValue(field, value as number)}
              </dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}

export function PayslipBreakdown({ inputs }: PayslipBreakdownProps) {
  const hasAnyData = [
    ...PAY_DETAILS_FIELDS,
    ...DEDUCTION_FIELDS,
    ...NON_TAXABLE_FIELDS,
  ].some((field) => {
    const value = inputs[field.key as keyof PayslipPayrollInputs]
    return typeof value === "number" && value > 0
  })

  if (!hasAnyData) {
    return (
      <p className="text-sm text-muted-foreground">
        No payroll data entered yet.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <BreakdownSection
        title="Pay Details"
        fields={PAY_DETAILS_FIELDS}
        inputs={inputs}
      />
      <BreakdownSection
        title="Deductions"
        fields={DEDUCTION_FIELDS}
        inputs={inputs}
      />
      <BreakdownSection
        title="Non-Taxable Earnings"
        fields={NON_TAXABLE_FIELDS}
        inputs={inputs}
      />
    </div>
  )
}
