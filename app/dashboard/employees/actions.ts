"use server"

import { revalidatePath } from "next/cache"

import { db } from "@/db"
import {
  addEmployee,
  deleteEmployee,
  getEmployeeById,
  updateEmployee,
} from "@/lib/employees"
import { createAuditLog } from "@/lib/audit-logs"
import { requireDashboardSession } from "@/lib/authorization"
import {
  parseEmployeeFormData,
  toNewEmployeeInput,
  validateEmployeeFields,
} from "@/lib/employee-validation"
import { createUserAccount, syncEmployeeUserIdentity } from "@/lib/users"

type EmployeeFormState = {
  error?: string
  success?: boolean
  employeeId?: string
  initialPassword?: string
  message?: string
}

export type AddEmployeeState = EmployeeFormState
export type UpdateEmployeeState = EmployeeFormState

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
  const employeeInput = toNewEmployeeInput(fields)

  const result = await db.transaction(async (tx) => {
    const employee = await addEmployee(employeeInput, tx)

    if ("error" in employee) {
      return { error: employee.error }
    }

    const account = await createUserAccount({
      employeeId: employee.employeeId,
      email: employee.email,
      role: "employee",
      client: tx,
    })
    if ("error" in account) {
      return { error: account.error }
    }

    await createAuditLog({
      actor: session,
      action: "employee.create",
      targetType: "employee",
      targetId: employee.id,
      targetLabel: `${employee.name} (${employee.employeeId})`,
      details: "Created employee record and login account.",
      client: tx,
    })

    await createAuditLog({
      actor: session,
      action: "user.create",
      targetType: "user",
      targetId: account.user.employeeId,
      targetLabel: `${account.user.employeeId} (${account.user.role})`,
      details: "Created login account with stored initial password.",
      client: tx,
    })

    return {
      success: true as const,
      employeeId: account.user.employeeId,
      initialPassword: account.initialPassword,
    }
  })

  if ("error" in result) {
    return { error: result.error }
  }

  revalidatePath("/dashboard/employees")
  revalidatePath("/dashboard/users")
  revalidatePath("/dashboard/logs")
  return {
    success: true,
    employeeId: result.employeeId,
    initialPassword: result.initialPassword,
    message:
      "Employee and login account created. Give the initial password to the employee and ask them to change it after first login.",
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
  const employeeInput = toNewEmployeeInput(fields)

  const result = await db.transaction(async (tx) => {
    const previousEmployee = await getEmployeeById(id, tx)
    const employee = await updateEmployee({ id, ...employeeInput }, tx)

    if ("error" in employee) {
      return { error: employee.error }
    }
    if (!previousEmployee) {
      return { error: "Employee not found." }
    }

    const syncResult = await syncEmployeeUserIdentity({
      previousEmployeeId: previousEmployee.employeeId,
      employeeId: employee.employeeId,
      email: employee.email,
      client: tx,
    })
    if ("error" in syncResult) {
      return { error: syncResult.error }
    }

    await createAuditLog({
      actor: session,
      action: "employee.update",
      targetType: "employee",
      targetId: employee.id,
      targetLabel: `${employee.name} (${employee.employeeId})`,
      details: "Updated employee record.",
      client: tx,
    })

    return { success: true as const }
  })

  if ("error" in result) {
    return { error: result.error }
  }

  revalidatePath("/dashboard/employees")
  revalidatePath("/dashboard/logs")
  return { success: true }
}

export async function deleteEmployeeAction(id: string) {
  const session = await requireDashboardSession()
  if ("error" in session) {
    return session
  }

  const result = await db.transaction(async (tx) => {
    const employee = await getEmployeeById(id, tx)
    const deleted = await deleteEmployee(id, tx)

    if ("error" in deleted) {
      return { error: deleted.error }
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
      client: tx,
    })

    return { success: true as const }
  })

  if ("error" in result) {
    return { error: result.error }
  }

  revalidatePath("/dashboard/employees")
  revalidatePath("/dashboard/logs")
  return { success: true as const }
}
