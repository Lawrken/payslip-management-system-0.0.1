"use client"

import { PaginationControls } from "@/components/dashboard/shared/pagination-controls"
import { UsersTable } from "@/components/dashboard/users/users-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { PaginatedResult } from "@/lib/pagination"
import type { Role, UserAccount } from "@/lib/types"

type UsersPageContentProps = {
  users: PaginatedResult<UserAccount>
  search: string
  currentEmployeeId: string
  currentRole: Role
}

export function UsersPageContent({
  users,
  search,
  currentEmployeeId,
  currentRole,
}: UsersPageContentProps) {
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
        <form className="flex items-center gap-2">
          <Input
            name="search"
            defaultValue={search}
            placeholder="Search users..."
            className="h-9 w-56 sm:w-64"
          />
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      </div>

      <UsersTable
        users={users.items}
        currentEmployeeId={currentEmployeeId}
        currentRole={currentRole}
        emptyMessage={
          search ? "No users match that search." : "No users found."
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
