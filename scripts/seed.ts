import "dotenv/config"

import bcrypt from "bcryptjs"

import { closeDb, db } from "@/db"
import { users } from "@/db/schema"
import { seedUsers } from "@/lib/seed-users"
import { encryptInitialPassword } from "@/lib/users"

async function main() {
  await db.insert(users).values(
    await Promise.all(
      seedUsers.map(async (user) => ({
        employeeId: user.employeeId,
        email: user.email,
        passwordHash: await bcrypt.hash(user.password, 10),
        initialPasswordCiphertext: encryptInitialPassword(user.password),
        passwordChangedAt: null,
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
