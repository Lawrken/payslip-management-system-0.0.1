import {
  ACCOUNTS,
  DEPARTMENTS,
  EMPLOYEE_STATUSES,
  isEmployeeDivisor,
  isEmployeeOption,
  POSITION_TITLES,
  PROGRAMS,
} from "@/lib/employee-options"
import type { NewEmployeeInput } from "@/lib/employees"
import { parseDecimalInput } from "@/lib/payroll-calculator"

export type EmployeeFieldValues = {
  name: string
  employeeId: string
  email: string
  employeeStatus: string
  positionTitle: string
  department: string
  program: string
  account: string
  divisor: number
  basicPay: number
  tin: string
  sssNo: string
  phicNo: string
  hdmfNo: string
}

export function toNewEmployeeInput(
  fields: EmployeeFieldValues
): NewEmployeeInput {
  return fields as NewEmployeeInput
}

const numericIdFields = ["tin", "sssNo", "phicNo", "hdmfNo"] as const

function isDigitsOnly(value: string) {
  return /^\d+$/.test(value)
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function parseEmployeeFields(
  input: Record<string, unknown>
): EmployeeFieldValues {
  return {
    name: String(input.name ?? "").trim(),
    employeeId: String(input.employeeId ?? "").trim(),
    email: String(input.email ?? "").trim(),
    employeeStatus: String(input.employeeStatus ?? "").trim(),
    positionTitle: String(input.positionTitle ?? "").trim(),
    department: String(input.department ?? "").trim(),
    program: String(input.program ?? "").trim(),
    account: String(input.account ?? "").trim(),
    divisor: Number(String(input.divisor ?? "").trim()),
    basicPay: parseDecimalInput(String(input.basicPay ?? "")),
    tin: String(input.tin ?? "").trim(),
    sssNo: String(input.sssNo ?? "").trim(),
    phicNo: String(input.phicNo ?? "").trim(),
    hdmfNo: String(input.hdmfNo ?? "").trim(),
  }
}

export function parseEmployeeFormData(formData: FormData): EmployeeFieldValues {
  return parseEmployeeFields({
    name: formData.get("name"),
    employeeId: formData.get("employeeId"),
    email: formData.get("email"),
    employeeStatus: formData.get("employeeStatus"),
    positionTitle: formData.get("positionTitle"),
    department: formData.get("department"),
    program: formData.get("program"),
    account: formData.get("account"),
    divisor: formData.get("divisor"),
    basicPay: formData.get("basicPay"),
    tin: formData.get("tin"),
    sssNo: formData.get("sssNo"),
    phicNo: formData.get("phicNo"),
    hdmfNo: formData.get("hdmfNo"),
  })
}

export function validateEmployeeFields(
  fields: EmployeeFieldValues
): { error: string } | null {
  if (
    !fields.name ||
    !fields.employeeId ||
    !fields.email ||
    !fields.employeeStatus ||
    !fields.positionTitle ||
    !fields.department ||
    !fields.program ||
    !fields.account
  ) {
    return { error: "All fields are required." }
  }

  if (!isValidEmail(fields.email)) {
    return { error: "Enter a valid email address." }
  }

  if (
    !isEmployeeOption(fields.employeeStatus, EMPLOYEE_STATUSES) ||
    !isEmployeeOption(fields.positionTitle, POSITION_TITLES) ||
    !isEmployeeOption(fields.department, DEPARTMENTS) ||
    !isEmployeeOption(fields.program, PROGRAMS) ||
    !isEmployeeOption(fields.account, ACCOUNTS)
  ) {
    return { error: "Choose a valid employee profile option." }
  }

  if (!isEmployeeDivisor(fields.divisor)) {
    return { error: "Choose a valid divisor." }
  }

  if (Number.isNaN(fields.basicPay)) {
    return { error: "Basic Pay must be a non-negative number." }
  }

  for (const field of numericIdFields) {
    const value = fields[field]
    if (value && !isDigitsOnly(value)) {
      return {
        error:
          "TIN, SSS NO., PHIC NO., and HDMF NO. must contain numbers only.",
      }
    }
  }

  return null
}
