"use server"

import { revalidatePath } from "next/cache"

import {
  addEmployee,
  deleteEmployee,
  updateEmployee,
} from "@/lib/employees"

export type EmployeeFormState = {
  error?: string
  success?: boolean
}

export type AddEmployeeState = EmployeeFormState
export type UpdateEmployeeState = EmployeeFormState

function parseEmployeeFormData(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    employeeId: String(formData.get("employeeId") ?? "").trim(),
    tin: String(formData.get("tin") ?? "").trim(),
    sssNo: String(formData.get("sssNo") ?? "").trim(),
    phicNo: String(formData.get("phicNo") ?? "").trim(),
    hdmfNo: String(formData.get("hdmfNo") ?? "").trim(),
  }
}

const numericIdFields = ["tin", "sssNo", "phicNo", "hdmfNo"] as const

function isDigitsOnly(value: string) {
  return /^\d+$/.test(value)
}

function validateEmployeeFields(fields: ReturnType<typeof parseEmployeeFormData>) {
  if (
    !fields.name ||
    !fields.employeeId ||
    !fields.tin ||
    !fields.sssNo ||
    !fields.phicNo ||
    !fields.hdmfNo
  ) {
    return { error: "All fields are required." } as const
  }

  for (const field of numericIdFields) {
    if (!isDigitsOnly(fields[field])) {
      return {
        error: "TIN, SSS NO., PHIC NO., and HDMF NO. must contain numbers only.",
      } as const
    }
  }

  return null
}

export async function addEmployeeAction(
  _prevState: AddEmployeeState,
  formData: FormData
): Promise<AddEmployeeState> {
  const fields = parseEmployeeFormData(formData)
  const validationError = validateEmployeeFields(fields)
  if (validationError) {
    return validationError
  }

  const result = addEmployee(fields)

  if ("error" in result) {
    return { error: result.error }
  }

  revalidatePath("/dashboard/employees")
  return { success: true }
}

export async function updateEmployeeAction(
  _prevState: UpdateEmployeeState,
  formData: FormData
): Promise<UpdateEmployeeState> {
  const id = String(formData.get("id") ?? "").trim()
  const fields = parseEmployeeFormData(formData)
  const validationError = validateEmployeeFields(fields)
  if (!id) {
    return { error: "Employee not found." }
  }
  if (validationError) {
    return validationError
  }

  const result = updateEmployee({ id, ...fields })

  if ("error" in result) {
    return { error: result.error }
  }

  revalidatePath("/dashboard/employees")
  return { success: true }
}

export async function deleteEmployeeAction(id: string) {
  const result = deleteEmployee(id)

  if ("error" in result) {
    return { error: result.error }
  }

  revalidatePath("/dashboard/employees")
  return { success: true as const }
}
