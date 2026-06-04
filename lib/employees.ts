import { eq, ne } from "drizzle-orm"

import { db } from "@/db"
import { employees } from "@/db/schema"
import { normalizeEmployeeId } from "@/lib/auth-helpers"
import type { Employee } from "@/lib/types"

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function getEmployees(): Promise<Employee[]> {
  return db.query.employees.findMany({
    orderBy: (table, { asc }) => [asc(table.name)],
  })
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  const employee = await db.query.employees.findFirst({
    where: eq(employees.id, id),
  })
  return employee ?? null
}

export async function findEmployeeByEmployeeId(
  employeeId: string
): Promise<Employee | null> {
  const normalizedId = normalizeEmployeeId(employeeId)
  const employee = await db.query.employees.findFirst({
    where: eq(employees.employeeId, normalizedId),
  })
  return employee ?? null
}

export type NewEmployeeInput = Omit<Employee, "id">

export async function addEmployee(
  input: NewEmployeeInput
): Promise<Employee | { error: string }> {
  const employeeId = normalizeEmployeeId(input.employeeId)
  const email = normalizeEmail(input.email)

  const duplicateId = await db.query.employees.findFirst({
    where: eq(employees.employeeId, employeeId),
  })
  if (duplicateId) {
    return { error: "An employee with this Employee ID already exists." }
  }

  const duplicateEmail = await db.query.employees.findFirst({
    where: eq(employees.email, email),
  })
  if (duplicateEmail) {
    return { error: "An employee with this email already exists." }
  }

  const [employee] = await db
    .insert(employees)
    .values({
      id: crypto.randomUUID(),
      name: input.name.trim(),
      employeeId,
      email,
      tin: input.tin.trim(),
      sssNo: input.sssNo.trim(),
      phicNo: input.phicNo.trim(),
      hdmfNo: input.hdmfNo.trim(),
      updatedAt: new Date(),
    })
    .returning()

  return employee
}

export type UpdateEmployeeInput = NewEmployeeInput & { id: string }

export async function updateEmployee(
  input: UpdateEmployeeInput
): Promise<Employee | { error: string }> {
  const existing = await getEmployeeById(input.id)
  if (!existing) {
    return { error: "Employee not found." }
  }

  const employeeId = normalizeEmployeeId(input.employeeId)
  const email = normalizeEmail(input.email)

  const duplicateId = await db.query.employees.findFirst({
    where: (table, { and }) =>
      and(eq(table.employeeId, employeeId), ne(table.id, input.id)),
  })
  if (duplicateId) {
    return { error: "An employee with this Employee ID already exists." }
  }

  const duplicateEmail = await db.query.employees.findFirst({
    where: (table, { and }) =>
      and(eq(table.email, email), ne(table.id, input.id)),
  })
  if (duplicateEmail) {
    return { error: "An employee with this email already exists." }
  }

  const [updated] = await db
    .update(employees)
    .set({
      name: input.name.trim(),
      employeeId,
      email,
      tin: input.tin.trim(),
      sssNo: input.sssNo.trim(),
      phicNo: input.phicNo.trim(),
      hdmfNo: input.hdmfNo.trim(),
      updatedAt: new Date(),
    })
    .where(eq(employees.id, input.id))
    .returning()

  return updated
}

export async function deleteEmployee(
  id: string
): Promise<{ success: true } | { error: string }> {
  const existing = await getEmployeeById(id)
  if (!existing) {
    return { error: "Employee not found." }
  }

  await db.delete(employees).where(eq(employees.id, id))
  return { success: true }
}
