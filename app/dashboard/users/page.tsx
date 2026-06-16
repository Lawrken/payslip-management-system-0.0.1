import { redirect } from "next/navigation"

import { UsersPageContent } from "@/components/dashboard/users/users-page-content"
import { requireDashboardSession } from "@/lib/authorization"
import { getPaginatedUserAccounts } from "@/lib/users"

export const dynamic = "force-dynamic"

type UsersPageProps = {
  searchParams: Promise<{
    search?: string
    page?: string
  }>
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const session = await requireDashboardSession()
  if ("error" in session) {
    redirect("/login")
  }

  const params = await searchParams
  const users = await getPaginatedUserAccounts({
    search: params.search,
    page: params.page,
  })

  return (
    <UsersPageContent
      users={users}
      search={params.search ?? ""}
      currentEmployeeId={session.employeeId}
      currentRole={session.role}
    />
  )
}
