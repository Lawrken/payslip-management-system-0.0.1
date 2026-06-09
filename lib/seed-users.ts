import type { Role } from "@/lib/types"

export type SeedUser = {
  employeeId: string
  email: string
  password: string
  role: Role
}

/**
 * Local seed accounts:
 * admin@helport.local / admin123 (admin)
 * superadmin@helport.local / super123 (superAdmin)
 */
export const seedUsers: SeedUser[] = [
  {
    employeeId: "ADMIN001",
    email: "admin@helport.local",
    password: "admin123",
    role: "admin",
  },
  {
    employeeId: "SUPER001",
    email: "superadmin@helport.local",
    password: "super123",
    role: "superAdmin",
  },
]
