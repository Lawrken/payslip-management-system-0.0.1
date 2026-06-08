import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { users } from "@/db/schema"
import { normalizeEmployeeId } from "@/lib/auth-helpers"

export async function changeUserPassword(input: {
  employeeId: string
  currentPassword: string
  newPassword: string
}): Promise<{ success: true } | { error: string }> {
  const employeeId = normalizeEmployeeId(input.employeeId)
  const user = await db.query.users.findFirst({
    where: eq(users.employeeId, employeeId),
  })
  if (!user) {
    return { error: "User account not found." }
  }

  const isCurrentPasswordValid = await bcrypt.compare(
    input.currentPassword,
    user.passwordHash
  )
  if (!isCurrentPasswordValid) {
    return { error: "Current password is incorrect." }
  }

  if (input.newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." }
  }

  await db
    .update(users)
    .set({
      passwordHash: await bcrypt.hash(input.newPassword, 10),
      updatedAt: new Date(),
    })
    .where(eq(users.employeeId, employeeId))

  return { success: true }
}
