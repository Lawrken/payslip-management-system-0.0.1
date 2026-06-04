"use client"

import * as React from "react"

import { CredentialExportsToolbar } from "@/components/dashboard/users/credential-exports-toolbar"
import { CreateUserDialog } from "@/components/dashboard/users/create-user-dialog"
import { UsersTable } from "@/components/dashboard/users/users-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { CredentialLookupOption } from "@/lib/credential-exports"
import type { Role, UserAccount } from "@/lib/types"

type UsersPageContentProps = {
  users: UserAccount[]
  currentEmployeeId: string
  currentRole: Role
  credentialOptions: CredentialLookupOption[]
}

export function UsersPageContent({
  users,
  currentEmployeeId,
  currentRole,
  credentialOptions,
}: UsersPageContentProps) {
  const [query, setQuery] = React.useState("")
  const canManageElevatedRoles = currentRole === "superAdmin"
  const filteredUsers = React.useMemo(() => {
    const search = query.trim().toLowerCase()
    if (!search) {
      return users
    }
    return users.filter((user) => {
      return (
        user.employeeId.toLowerCase().includes(search) ||
        user.role.toLowerCase().includes(search) ||
        (user.employeeName?.toLowerCase().includes(search) ?? false)
      )
    })
  }, [query, users])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
            <p className="text-sm text-muted-foreground">
              View login accounts and reset access. Employee accounts are created
              when you add an employee. Initial passwords are stored for export,
              lookup, and reset—employees should change password after first
              login.
            </p>
          </div>
          <CreateUserDialog canManageElevatedRoles={canManageElevatedRoles}>
            <Button type="button">Create User</Button>
          </CreateUserDialog>
        </div>

        <CredentialExportsToolbar credentialOptions={credentialOptions} />
      </div>

      <div className="flex max-w-sm flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="userSearch">
          Filter users
        </label>
        <Input
          id="userSearch"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Employee ID, name, or role"
        />
      </div>

      <UsersTable
        users={filteredUsers}
        currentEmployeeId={currentEmployeeId}
        canManageElevatedRoles={canManageElevatedRoles}
      />
    </div>
  )
}
