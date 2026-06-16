"use client"

import { FilterTableHead } from "@/components/dashboard/shared/table-column-filter"
import { SortableTableHead } from "@/components/dashboard/shared/table-sort"
import { UserRowActions } from "@/components/dashboard/users/user-row-actions"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ROLE_LABELS } from "@/lib/auth-helpers"
import type { UserListSort } from "@/lib/users"
import type { SortDirection } from "@/lib/table-sort"
import type { Role, UserAccount } from "@/lib/types"

type UsersTableProps = {
  users: UserAccount[]
  role: string
  passwordStatus: string
  sortKey: UserListSort
  sortDir: SortDirection
  onSort: (key: UserListSort) => void
  onFilterChange: (key: "role" | "passwordStatus", value: string) => void
  currentEmployeeId: string
  currentRole: Role
  emptyMessage?: string
}

const roles: Role[] = ["admin", "superAdmin", "employee"]
const roleOptions = roles.map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
}))
const passwordStatusOptions = [
  { value: "initial", label: "Initial password" },
  { value: "changed", label: "Changed password" },
]

function formatDate(date: Date | null) {
  if (!date) {
    return "Initial password"
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(date)
}

export function UsersTable({
  users,
  role,
  passwordStatus,
  sortKey,
  sortDir,
  onSort,
  onFilterChange,
  currentEmployeeId,
  currentRole,
  emptyMessage = "No users found.",
}: UsersTableProps) {
  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableTableHead
            label="Email"
            active={sortKey === "email"}
            direction={sortDir}
            onSort={() => onSort("email")}
          />
          <SortableTableHead
            label="Employee"
            active={sortKey === "employeeId"}
            direction={sortDir}
            onSort={() => onSort("employeeId")}
          />
          <FilterTableHead
            label="Role"
            value={role}
            onChange={(value) => onFilterChange("role", value)}
            options={roleOptions}
            searchPlaceholder="Search roles…"
            emptyMessage="No role found."
          />
          <FilterTableHead
            label="Password Status"
            value={passwordStatus}
            onChange={(value) => onFilterChange("passwordStatus", value)}
            options={passwordStatusOptions}
            searchPlaceholder="Search password statuses…"
            emptyMessage="No password status found."
          />
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.employeeId}>
            <TableCell className="font-medium">{user.email}</TableCell>
            <TableCell>
              <div>{user.employeeId}</div>
              <div className="text-xs text-muted-foreground">
                {user.employeeName ?? "No employee record"}
                {user.employeeId === currentEmployeeId ? " · You" : ""}
              </div>
            </TableCell>
            <TableCell>{ROLE_LABELS[user.role]}</TableCell>
            <TableCell>{formatDate(user.passwordChangedAt)}</TableCell>
            <TableCell>
              <UserRowActions
                user={user}
                currentEmployeeId={currentEmployeeId}
                currentRole={currentRole}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
