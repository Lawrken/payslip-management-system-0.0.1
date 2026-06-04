import type { Role } from "@/lib/types"

export type SeedUser = {
  employeeId: string
  password: string
  role: Role
}

/**
 * Local seed accounts:
 * ADMIN001 / admin123 (admin)
 * SUPER001 / super123 (superAdmin)
 */
export const seedUsers: SeedUser[] = [
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
]
