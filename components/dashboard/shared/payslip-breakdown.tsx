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
  value: unknown
): string {
  if (typeof value !== "number") {
    return "—"
  }

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
                {formatFieldValue(field, value)}
              </dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}

export function PayslipBreakdown({ inputs }: PayslipBreakdownProps) {
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
