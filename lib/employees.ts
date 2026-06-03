import { normalizeEmployeeId } from "@/lib/auth"
import { seedEmployees } from "@/lib/mock-employees"
import type { Employee } from "@/lib/types"

const employees: Employee[] = [...seedEmployees]

export function getEmployees(): Employee[] {
  return [...employees]
}

export function findEmployeeByEmployeeId(
  employeeId: string
): Employee | undefined {
  const normalizedId = normalizeEmployeeId(employeeId)
  return employees.find((employee) => employee.employeeId === normalizedId)
}

export type NewEmployeeInput = Omit<Employee, "id">

export function addEmployee(input: NewEmployeeInput): Employee | { error: string } {
  const employeeId = normalizeEmployeeId(input.employeeId)

  if (employees.some((employee) => employee.employeeId === employeeId)) {
    return { error: "An employee with this Employee ID already exists." }
  }

  const employee: Employee = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    employeeId,
    tin: input.tin.trim(),
    sssNo: input.sssNo.trim(),
    phicNo: input.phicNo.trim(),
    hdmfNo: input.hdmfNo.trim(),
  }

  employees.push(employee)
  return employee
}

export type UpdateEmployeeInput = NewEmployeeInput & { id: string }

export function updateEmployee(
  input: UpdateEmployeeInput
): Employee | { error: string } {
  const index = employees.findIndex((employee) => employee.id === input.id)
  if (index === -1) {
    return { error: "Employee not found." }
  }

  const employeeId = normalizeEmployeeId(input.employeeId)
  const duplicate = employees.some(
    (employee) =>
      employee.id !== input.id && employee.employeeId === employeeId
  )
  if (duplicate) {
    return { error: "An employee with this Employee ID already exists." }
  }

  const updated: Employee = {
    id: input.id,
    name: input.name.trim(),
    employeeId,
    tin: input.tin.trim(),
    sssNo: input.sssNo.trim(),
    phicNo: input.phicNo.trim(),
    hdmfNo: input.hdmfNo.trim(),
  }

  employees[index] = updated
  return updated
}

export function deleteEmployee(id: string): { success: true } | { error: string } {
  const index = employees.findIndex((employee) => employee.id === id)
  if (index === -1) {
    return { error: "Employee not found." }
  }

  employees.splice(index, 1)
  return { success: true }
}
