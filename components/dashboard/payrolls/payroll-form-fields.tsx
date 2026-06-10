import { DateSelect } from "@/components/dashboard/shared/date-select"
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
      <DateSelect
        id={`${prefix}payrollPeriodStart`}
        name="payrollPeriodStart"
        label="Payroll Period Start"
        defaultValue={payroll?.payrollPeriodStart}
        required
      />
      <DateSelect
        id={`${prefix}payrollPeriodEnd`}
        name="payrollPeriodEnd"
        label="Payroll Period End"
        defaultValue={payroll?.payrollPeriodEnd}
        required
      />
      <DateSelect
        id={`${prefix}dtrCutOffStart`}
        name="dtrCutOffStart"
        label="DTR Cut-Off Start"
        defaultValue={payroll?.dtrCutOffStart}
        required
      />
      <DateSelect
        id={`${prefix}dtrCutOffEnd`}
        name="dtrCutOffEnd"
        label="DTR Cut-Off End"
        defaultValue={payroll?.dtrCutOffEnd}
        required
      />
      <DateSelect
        id={`${prefix}payoutDate`}
        name="payoutDate"
        label="Payout Date"
        defaultValue={payroll?.payoutDate}
        required
      />
    </>
  )
}
