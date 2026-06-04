import { redirect } from "next/navigation"

import { UsersPageContent } from "@/components/dashboard/users/users-page-content"
import { isDashboardRole } from "@/lib/auth-helpers"
import { listCredentialLookupOptions } from "@/lib/credential-exports"
import { getSession } from "@/lib/session"
import type { Role } from "@/lib/types"
import { getUserAccounts } from "@/lib/users"

export const dynamic = "force-dynamic"

function filterCredentialOptionsForRole(
  options: Awaited<ReturnType<typeof listCredentialLookupOptions>>,
  actorRole: Role
) {
  if (actorRole === "superAdmin") {
    return options
  }
  return options.filter((option) => option.role === "employee")
}

export default async function UsersPage() {
  const session = await getSession()
  if (!session || !isDashboardRole(session.role)) {
    redirect("/login")
  }

  const [users, allCredentialOptions] = await Promise.all([
    getUserAccounts(),
    listCredentialLookupOptions(),
  ])

  const credentialOptions = filterCredentialOptionsForRole(
    allCredentialOptions,
    session.role
  )

  return (
    <UsersPageContent
      users={users}
      currentEmployeeId={session.employeeId}
      currentRole={session.role}
      credentialOptions={credentialOptions}
    />
  )
}
