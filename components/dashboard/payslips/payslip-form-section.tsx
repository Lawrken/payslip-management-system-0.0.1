"use client"

import { DecimalInput } from "@/components/dashboard/shared/decimal-input"
import {
  Field,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import type { PayslipFieldDefinition } from "@/lib/payslip-fields"
import type { PayslipPayrollInputs } from "@/lib/types"

type PayslipFormSectionProps = {
  title: string
  fields: PayslipFieldDefinition[]
  values: PayslipPayrollInputs
  fieldDrafts?: Partial<Record<keyof PayslipPayrollInputs, string>>
  onChange: (key: keyof PayslipPayrollInputs, value: string) => void
}

export function PayslipFormSection({
  title,
  fields,
  values,
  fieldDrafts,
  onChange,
}: PayslipFormSectionProps) {
  return (
    <FieldSet>
      <FieldLegend>{title}</FieldLegend>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => {
          const key = field.key as keyof PayslipPayrollInputs
          const value = values[key]
          const draft = fieldDrafts?.[key]
          const displayValue =
            draft !== undefined
              ? draft
              : value === 0
                ? ""
                : String(value)

          return (
            <Field key={field.key}>
              <FieldLabel htmlFor={field.key}>{field.label}</FieldLabel>
              <DecimalInput
                id={field.key}
                name={field.key}
                value={displayValue}
                onChange={(event) =>
                  onChange(
                    field.key as keyof PayslipPayrollInputs,
                    event.target.value
                  )
                }
                placeholder="0"
              />
            </Field>
          )
        })}
      </div>
    </FieldSet>
  )
}
