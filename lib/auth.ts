import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { users } from "@/db/schema"
import { normalizeEmployeeId } from "@/lib/auth-helpers"
import type { User } from "@/lib/types"

export function validateCredentials(
  employeeId: string,
  password: string
): Promise<User | null> {
  const normalizedId = normalizeEmployeeId(employeeId)
  return db.query.users
    .findFirst({
      where: eq(users.employeeId, normalizedId),
    })
    .then(async (user) => {
      if (!user) {
        return null
      }

      const isValid = await bcrypt.compare(password, user.passwordHash)
      return isValid ? user : null
    })
}
