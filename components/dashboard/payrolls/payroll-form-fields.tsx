import {
  Field,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { Payroll } from "@/lib/types"

type PayrollFormFieldsProps = {
  payroll?: Payroll
  idPrefix?: string
}

export function PayrollFormFields({
  payroll,
  idPrefix = "",
}: PayrollFormFieldsProps) {
  const prefix = idPrefix ? `${idPrefix}-` : ""

  return (
    <>
      <Field>
        <FieldLabel htmlFor={`${prefix}payrollPeriodStart`}>
          Payroll Period Start
        </FieldLabel>
        <Input
          id={`${prefix}payrollPeriodStart`}
          name="payrollPeriodStart"
          type="date"
          defaultValue={payroll?.payrollPeriodStart}
          required
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${prefix}payrollPeriodEnd`}>
          Payroll Period End
        </FieldLabel>
        <Input
          id={`${prefix}payrollPeriodEnd`}
          name="payrollPeriodEnd"
          type="date"
          defaultValue={payroll?.payrollPeriodEnd}
          required
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${prefix}dtrCutOffStart`}>
          DTR Cut-Off Start
        </FieldLabel>
        <Input
          id={`${prefix}dtrCutOffStart`}
          name="dtrCutOffStart"
          type="date"
          defaultValue={payroll?.dtrCutOffStart}
          required
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${prefix}dtrCutOffEnd`}>DTR Cut-Off End</FieldLabel>
        <Input
          id={`${prefix}dtrCutOffEnd`}
          name="dtrCutOffEnd"
          type="date"
          defaultValue={payroll?.dtrCutOffEnd}
          required
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${prefix}payoutDate`}>Payout Date</FieldLabel>
        <Input
          id={`${prefix}payoutDate`}
          name="payoutDate"
          type="date"
          defaultValue={payroll?.payoutDate}
          required
        />
      </Field>
    </>
  )
}
