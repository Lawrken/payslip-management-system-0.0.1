import {
  DEDUCTION_FIELDS,
  NON_TAXABLE_FIELDS,
  PAY_DETAILS_FIELDS,
  type PayslipFieldDefinition,
} from "@/lib/payslip-fields"

export const GOVERNMENT_ID_MAX_LENGTH = 15
export const MONEY_INPUT_MAX_LENGTH = 15
export const HOURS_INPUT_MAX_LENGTH = 15
export const DAYS_INPUT_MAX_LENGTH = 15

type PayslipFieldInputKind = PayslipFieldDefinition["inputKind"]

const PAYSLIP_FIELD_BY_KEY = new Map<string, PayslipFieldInputKind>(
  [...PAY_DETAILS_FIELDS, ...DEDUCTION_FIELDS, ...NON_TAXABLE_FIELDS].map(
    (field) => [field.key, field.inputKind]
  )
)

const GOVERNMENT_ID_FIELD_LABELS: Record<string, string> = {
  tin: "TIN",
  sssNo: "SSS NO.",
  phicNo: "PHIC NO.",
  hdmfNo: "HDMF NO.",
}

export function getGovernmentIdFieldLabel(field: string): string {
  return GOVERNMENT_ID_FIELD_LABELS[field] ?? field
}

export function getPayslipFieldMaxLength(inputKind: PayslipFieldInputKind): number {
  switch (inputKind) {
    case "peso":
      return MONEY_INPUT_MAX_LENGTH
    case "hours":
      return HOURS_INPUT_MAX_LENGTH
    case "days":
      return DAYS_INPUT_MAX_LENGTH
  }
}

export function getPayslipFieldMaxLengthByKey(key: string): number | undefined {
  const inputKind = PAYSLIP_FIELD_BY_KEY.get(key)
  return inputKind ? getPayslipFieldMaxLength(inputKind) : undefined
}
