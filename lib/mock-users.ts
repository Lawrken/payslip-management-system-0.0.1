import type { MockUser } from "@/lib/types"

/**
 * Dev mock accounts:
 * ADMIN001 / admin123 (admin)
 * SUPER001 / super123 (superAdmin)
 * EMP001 / emp123 (employee)
 */
export const mockUsers: MockUser[] = [
  {
    employeeId: "ADMIN001",
    password: "admin123",
    role: "admin",
  },
  {
    employeeId: "SUPER001",
    password: "super123",
    role: "superAdmin",
  },
  {
    employeeId: "EMP001",
    password: "emp123",
    role: "employee",
  },
]
