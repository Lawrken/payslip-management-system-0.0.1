import { DecimalInput } from "@/components/dashboard/shared/decimal-input"
import { NumericInput } from "@/components/dashboard/shared/numeric-input"
import { OptionSelect } from "@/components/dashboard/shared/option-select"
import {
  Field,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  ACCOUNTS,
  DEPARTMENTS,
  EMPLOYEE_DIVISORS,
  EMPLOYEE_STATUSES,
  POSITION_TITLES,
  PROGRAMS,
} from "@/lib/employee-options"
import {
  GOVERNMENT_ID_MAX_LENGTH,
  MONEY_INPUT_MAX_LENGTH,
} from "@/lib/input-limits"
import type { Employee } from "@/lib/types"

type EmployeeFormFieldsProps = {
  employee?: Employee
  idPrefix?: string
  resetKey?: string | number
}

function toOptions(values: readonly string[]) {
  return values.map((value) => ({ value, label: value }))
}

const divisorOptions = EMPLOYEE_DIVISORS.map((value) => ({
  value: String(value),
  label: String(value),
}))

export function EmployeeFormFields({
  employee,
  idPrefix = "",
  resetKey = "new",
}: EmployeeFormFieldsProps) {
  const prefix = idPrefix ? `${idPrefix}-` : ""

  return (
    <div className="flex flex-col gap-8">
      <FieldSet>
        <FieldLegend>Identity</FieldLegend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={`${prefix}name`}>Employee Name</FieldLabel>
            <Input
              id={`${prefix}name`}
              name="name"
              defaultValue={employee?.name}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${prefix}employeeId`}>Employee ID</FieldLabel>
            <Input
              id={`${prefix}employeeId`}
              name="employeeId"
              defaultValue={employee?.employeeId}
              required
            />
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor={`${prefix}email`}>Email</FieldLabel>
            <Input
              id={`${prefix}email`}
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={employee?.email}
              required
            />
          </Field>
        </div>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Employment</FieldLegend>
        <div className="grid gap-4 sm:grid-cols-2">
          <OptionSelect
            key={`${resetKey}-employeeStatus`}
            id={`${prefix}employeeStatus`}
            name="employeeStatus"
            label="Employee Status"
            options={toOptions(EMPLOYEE_STATUSES)}
            defaultValue={employee?.employeeStatus ?? ""}
            placeholder="Select status…"
            searchPlaceholder="Search statuses…"
            emptyMessage="No status found."
            required
          />
          <OptionSelect
            key={`${resetKey}-positionTitle`}
            id={`${prefix}positionTitle`}
            name="positionTitle"
            label="Position Title"
            options={toOptions(POSITION_TITLES)}
            defaultValue={employee?.positionTitle ?? ""}
            placeholder="Select position…"
            searchPlaceholder="Search positions…"
            emptyMessage="No position found."
            required
          />
          <OptionSelect
            key={`${resetKey}-department`}
            id={`${prefix}department`}
            name="department"
            label="Department"
            options={toOptions(DEPARTMENTS)}
            defaultValue={employee?.department ?? ""}
            placeholder="Select department…"
            searchPlaceholder="Search departments…"
            emptyMessage="No department found."
            required
          />
          <OptionSelect
            key={`${resetKey}-program`}
            id={`${prefix}program`}
            name="program"
            label="Program"
            options={toOptions(PROGRAMS)}
            defaultValue={employee?.program ?? ""}
            placeholder="Select program…"
            searchPlaceholder="Search programs…"
            emptyMessage="No program found."
            required
          />
          <OptionSelect
            key={`${resetKey}-account`}
            id={`${prefix}account`}
            name="account"
            label="Account"
            options={toOptions(ACCOUNTS)}
            defaultValue={employee?.account ?? ""}
            placeholder="Select account…"
            searchPlaceholder="Search accounts…"
            emptyMessage="No account found."
            required
          />
          <OptionSelect
            key={`${resetKey}-divisor`}
            id={`${prefix}divisor`}
            name="divisor"
            label="Divisor"
            options={divisorOptions}
            defaultValue={
              employee?.divisor ? String(employee.divisor) : ""
            }
            placeholder="Select divisor…"
            searchPlaceholder="Search divisors…"
            emptyMessage="No divisor found."
            required
          />
          <Field>
            <FieldLabel htmlFor={`${prefix}basicPay`}>Basic Pay</FieldLabel>
            <DecimalInput
              id={`${prefix}basicPay`}
              name="basicPay"
              className="tabular-nums"
              maxLength={MONEY_INPUT_MAX_LENGTH}
              defaultValue={
                employee?.basicPay !== undefined
                  ? String(employee.basicPay)
                  : undefined
              }
              placeholder="0.00"
              required
            />
          </Field>
        </div>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Government IDs</FieldLegend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={`${prefix}tin`}>TIN</FieldLabel>
            <NumericInput
              id={`${prefix}tin`}
              name="tin"
              maxLength={GOVERNMENT_ID_MAX_LENGTH}
              defaultValue={employee?.tin?.replace(/\D/g, "")}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${prefix}sssNo`}>SSS NO.</FieldLabel>
            <NumericInput
              id={`${prefix}sssNo`}
              name="sssNo"
              maxLength={GOVERNMENT_ID_MAX_LENGTH}
              defaultValue={employee?.sssNo?.replace(/\D/g, "")}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${prefix}phicNo`}>PHIC NO.</FieldLabel>
            <NumericInput
              id={`${prefix}phicNo`}
              name="phicNo"
              maxLength={GOVERNMENT_ID_MAX_LENGTH}
              defaultValue={employee?.phicNo?.replace(/\D/g, "")}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${prefix}hdmfNo`}>HDMF NO.</FieldLabel>
            <NumericInput
              id={`${prefix}hdmfNo`}
              name="hdmfNo"
              maxLength={GOVERNMENT_ID_MAX_LENGTH}
              defaultValue={employee?.hdmfNo?.replace(/\D/g, "")}
            />
          </Field>
        </div>
      </FieldSet>
    </div>
  )
}
