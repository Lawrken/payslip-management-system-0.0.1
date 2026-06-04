"use server"

import { revalidatePath } from "next/cache"

import {
  addEmployee,
  deleteEmployee,
  getEmployeeById,
  updateEmployee,
} from "@/lib/employees"
import { createAuditLog } from "@/lib/audit-logs"
import { requireDashboardSession } from "@/lib/authorization"
import { createUserAccount } from "@/lib/users"

export type EmployeeFormState = {
  error?: string
  success?: boolean
  employeeId?: string
  message?: string
}

export type AddEmployeeState = EmployeeFormState
export type UpdateEmployeeState = EmployeeFormState

function parseEmployeeFormData(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    employeeId: String(formData.get("employeeId") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
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

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function validateEmployeeFields(fields: ReturnType<typeof parseEmployeeFormData>) {
  if (
    !fields.name ||
    !fields.employeeId ||
    !fields.email ||
    !fields.tin ||
    !fields.sssNo ||
    !fields.phicNo ||
    !fields.hdmfNo
  ) {
    return { error: "All fields are required." } as const
  }

  if (!isValidEmail(fields.email)) {
    return { error: "Enter a valid email address." } as const
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
  const session = await requireDashboardSession()
  if ("error" in session) {
    return session
  }

  const fields = parseEmployeeFormData(formData)
  const validationError = validateEmployeeFields(fields)
  if (validationError) {
    return validationError
  }

  const result = await addEmployee(fields)

  if ("error" in result) {
    return { error: result.error }
  }

  const account = await createUserAccount({
    employeeId: result.employeeId,
    role: "employee",
    createdByEmployeeId: session.employeeId,
  })

  if ("error" in account) {
    await deleteEmployee(result.id)
    return { error: account.error }
  }

  await createAuditLog({
    actor: session,
    action: "employee.create",
    targetType: "employee",
    targetId: result.id,
    targetLabel: `${result.name} (${result.employeeId})`,
    details: "Created employee record and login account.",
  })

  await createAuditLog({
    actor: session,
    action: "user.create",
    targetType: "user",
    targetId: account.employeeId,
    targetLabel: `${account.employeeId} (employee)`,
    details:
      "Created login account; initial password queued for credential export.",
  })

  revalidatePath("/dashboard/employees")
  revalidatePath("/dashboard/users")
  revalidatePath("/dashboard/logs")
  return {
    success: true,
    employeeId: account.employeeId,
    message:
      "Employee and login account created. Download initial credentials from the Users page (.xlsx).",
  }
}

export async function updateEmployeeAction(
  _prevState: UpdateEmployeeState,
  formData: FormData
): Promise<UpdateEmployeeState> {
  const session = await requireDashboardSession()
  if ("error" in session) {
    return session
  }

  const id = String(formData.get("id") ?? "").trim()
  const fields = parseEmployeeFormData(formData)
  const validationError = validateEmployeeFields(fields)
  if (!id) {
    return { error: "Employee not found." }
  }
  if (validationError) {
    return validationError
  }

  const result = await updateEmployee({ id, ...fields })

  if ("error" in result) {
    return { error: result.error }
  }

  await createAuditLog({
    actor: session,
    action: "employee.update",
    targetType: "employee",
    targetId: result.id,
    targetLabel: `${result.name} (${result.employeeId})`,
    details: "Updated employee record.",
  })

  revalidatePath("/dashboard/employees")
  revalidatePath("/dashboard/logs")
  return { success: true }
}

export async function deleteEmployeeAction(id: string) {
  const session = await requireDashboardSession()
  if ("error" in session) {
    return session
  }

  const employee = await getEmployeeById(id)
  const result = await deleteEmployee(id)

  if ("error" in result) {
    return { error: result.error }
  }

  await createAuditLog({
    actor: session,
    action: "employee.delete",
    targetType: "employee",
    targetId: id,
    targetLabel: employee
      ? `${employee.name} (${employee.employeeId})`
      : "Deleted employee",
    details: "Deleted employee record.",
  })

  revalidatePath("/dashboard/employees")
  revalidatePath("/dashboard/logs")
  return { success: true as const }
}
