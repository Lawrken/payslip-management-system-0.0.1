import "dotenv/config"

import bcrypt from "bcryptjs"

import { closeDb, db } from "@/db"
import { users } from "@/db/schema"
import { mockUsers } from "@/lib/mock-users"

async function main() {
  const dashboardUsers = mockUsers.filter((user) => user.role !== "employee")

  await db.insert(users).values(
    await Promise.all(
      dashboardUsers.map(async (user) => ({
        employeeId: user.employeeId,
        passwordHash: await bcrypt.hash(user.password, 10),
        role: user.role,
      }))
    )
  )
}

main()
  .then(() => {
    console.log("Database seeded.")
    return closeDb()
  })
  .catch((error) => {
    console.error(error)
    closeDb().finally(() => process.exit(1))
  })
