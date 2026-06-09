import { redirect } from "next/navigation"

import { UsersPageContent } from "@/components/dashboard/users/users-page-content"
import { requireDashboardSession } from "@/lib/authorization"
import { getUserAccounts } from "@/lib/users"

export const dynamic = "force-dynamic"

export default async function UsersPage() {
  const session = await requireDashboardSession()
  if ("error" in session) {
    redirect("/login")
  }

  const users = await getUserAccounts()

  return (
    <UsersPageContent
      users={users}
      currentEmployeeId={session.employeeId}
      currentRole={session.role}
    />
  )
}
