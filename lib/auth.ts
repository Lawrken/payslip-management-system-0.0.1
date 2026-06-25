import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"

import { db, withDbRetry } from "@/db"
import { users } from "@/db/schema"
import { isRole, normalizeEmail } from "@/lib/auth-helpers"
import type { User } from "@/lib/types"

export function validateCredentials(
  email: string,
  password: string
): Promise<User | null> {
  const normalizedEmail = normalizeEmail(email)
  return withDbRetry(() =>
    db.query.users.findFirst({ where: eq(users.email, normalizedEmail) })
  ).then(async (user) => {
      if (!user) {
        return null
      }
      if (!isRole(user.role)) {
        return null
      }

      const isValid = await bcrypt.compare(password, user.passwordHash)
      return isValid ? user : null
    })
}
