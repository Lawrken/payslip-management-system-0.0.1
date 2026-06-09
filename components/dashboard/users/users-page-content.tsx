"use client"

import * as React from "react"

import { UsersTable } from "@/components/dashboard/users/users-table"
import { Input } from "@/components/ui/input"
import type { Role, UserAccount } from "@/lib/types"

type UsersPageContentProps = {
  users: UserAccount[]
  currentEmployeeId: string
  currentRole: Role
}

export function UsersPageContent({
  users,
  currentEmployeeId,
  currentRole,
}: UsersPageContentProps) {
  const [query, setQuery] = React.useState("")
  const filteredUsers = React.useMemo(() => {
    const search = query.trim().toLowerCase()
    if (!search) {
      return users
    }

    return users.filter((user) => {
      return (
        user.employeeId.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.role.toLowerCase().includes(search) ||
        (user.employeeName?.toLowerCase().includes(search) ?? false)
      )
    })
  }, [query, users])

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage login accounts and reset forgotten passwords to their stored
          initial password.
        </p>
      </div>

      <div className="flex max-w-sm flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="userSearch">
          Filter users
        </label>
        <Input
          id="userSearch"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Email, Employee ID, name, or role"
        />
      </div>

      <UsersTable
        users={filteredUsers}
        currentEmployeeId={currentEmployeeId}
        currentRole={currentRole}
      />
    </div>
  )
}
