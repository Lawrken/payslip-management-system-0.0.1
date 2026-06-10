"use client"

import * as React from "react"

import { UserCombobox } from "@/components/dashboard/shared/user-combobox"
import { UsersTable } from "@/components/dashboard/users/users-table"
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
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState("")

  const filteredUsers = React.useMemo(() => {
    if (!selectedEmployeeId) {
      return users
    }
    return users.filter((user) => user.employeeId === selectedEmployeeId)
  }, [selectedEmployeeId, users])

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
        <UserCombobox
          users={users}
          value={selectedEmployeeId}
          onChange={setSelectedEmployeeId}
        />
      </div>

      <UsersTable
        users={filteredUsers}
        currentEmployeeId={currentEmployeeId}
        currentRole={currentRole}
        emptyMessage={
          selectedEmployeeId
            ? "No user matches that selection."
            : "No users found."
        }
      />
    </div>
  )
}
