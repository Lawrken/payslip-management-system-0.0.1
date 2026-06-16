import { redirect } from "next/navigation"

import { UsersPageContent } from "@/components/dashboard/users/users-page-content"
import { isRole } from "@/lib/auth-helpers"
import { requireDashboardSession } from "@/lib/authorization"
import {
  getPaginatedUserAccounts,
  getUserOptions,
  type UserListSort,
  type UserPasswordStatus,
} from "@/lib/users"
import type { SortDirection } from "@/lib/table-sort"

export const dynamic = "force-dynamic"

type UsersPageProps = {
  searchParams: Promise<{
    search?: string
    page?: string
    pageSize?: string
    role?: string
    passwordStatus?: string
    sort?: string
    direction?: string
  }>
}

const userSorts: UserListSort[] = [
  "email",
  "employeeId",
  "role",
  "passwordChangedAt",
]

function normalizeSort(value: string | undefined): UserListSort {
  return userSorts.includes(value as UserListSort)
    ? (value as UserListSort)
    : "email"
}

function normalizeDirection(value: string | undefined): SortDirection {
  return value === "desc" ? "desc" : "asc"
}

function normalizePasswordStatus(value: string | undefined) {
  return value === "initial" || value === "changed"
    ? (value as UserPasswordStatus)
    : undefined
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const session = await requireDashboardSession()
  if ("error" in session) {
    redirect("/login")
  }

  const params = await searchParams
  const role = isRole(params.role) ? params.role : undefined
  const passwordStatus = normalizePasswordStatus(params.passwordStatus)
  const sort = normalizeSort(params.sort)
  const direction = normalizeDirection(params.direction)
  const [users, userOptions] = await Promise.all([
    getPaginatedUserAccounts({
      search: params.search,
      page: params.page,
      pageSize: params.pageSize,
      role,
      passwordStatus,
      sort,
      direction,
    }),
    getUserOptions(),
  ])

  return (
    <UsersPageContent
      users={users}
      userOptions={userOptions.map((user) => ({
        id: user.employeeId,
        employeeId: user.employeeId,
        name: user.employeeName
          ? `${user.employeeName} · ${user.email}`
          : user.email,
      }))}
      search={params.search ?? ""}
      role={role ?? ""}
      passwordStatus={passwordStatus ?? ""}
      sortKey={sort}
      sortDir={direction}
      currentEmployeeId={session.employeeId}
      currentRole={session.role}
    />
  )
}
