"use client"

import { useRouter, useSearchParams } from "next/navigation"

import { EmployeeCombobox } from "@/components/dashboard/shared/employee-combobox"
import { PaginationControls } from "@/components/dashboard/shared/pagination-controls"
import { UsersTable } from "@/components/dashboard/users/users-table"
import type { EmployeeOption } from "@/lib/employees"
import type { PaginatedResult } from "@/lib/pagination"
import type { SortDirection } from "@/lib/table-sort"
import type { UserListSort } from "@/lib/users"
import type { Role, UserAccount } from "@/lib/types"

type UsersPageContentProps = {
  users: PaginatedResult<UserAccount>
  userOptions: EmployeeOption[]
  search: string
  role: string
  passwordStatus: string
  sortKey: UserListSort
  sortDir: SortDirection
  currentEmployeeId: string
  currentRole: Role
}

export function UsersPageContent({
  users,
  userOptions,
  search,
  role,
  passwordStatus,
  sortKey,
  sortDir,
  currentEmployeeId,
  currentRole,
}: UsersPageContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function replaceParams(params: URLSearchParams) {
    const query = params.toString()
    router.replace(query ? `/dashboard/users?${query}` : "/dashboard/users", {
      scroll: false,
    })
  }

  function handleSearchChange(employeeId: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (employeeId) {
      params.set("search", employeeId)
    } else {
      params.delete("search")
    }
    params.delete("page")
    replaceParams(params)
  }

  function handleFilterChange(key: "role" | "passwordStatus", value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete("page")
    replaceParams(params)
  }

  function handleSort(key: UserListSort) {
    const params = new URLSearchParams(searchParams.toString())
    const nextDirection =
      sortKey === key && sortDir === "asc" ? "desc" : "asc"
    params.set("sort", key)
    params.set("direction", nextDirection)
    params.delete("page")
    replaceParams(params)
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            Manage login accounts and reset forgotten passwords to their stored
            initial password.
          </p>
        </div>
        <EmployeeCombobox
          employees={userOptions}
          value={search}
          onChange={handleSearchChange}
          variant="filter"
          placeholder="Search users…"
          searchPlaceholder="Search by ID, name, or email…"
          emptyMessage="No user found."
        />
      </div>

      <UsersTable
        users={users.items}
        role={role}
        passwordStatus={passwordStatus}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        onFilterChange={handleFilterChange}
        currentEmployeeId={currentEmployeeId}
        currentRole={currentRole}
        emptyMessage={
          search || role || passwordStatus
            ? "No users match the selected filters."
            : "No users found."
        }
      />
      <PaginationControls
        page={users.page}
        pageCount={users.pageCount}
        total={users.total}
        pageSize={users.pageSize}
        itemLabel="users"
      />
    </div>
  )
}
