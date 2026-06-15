"use client"

import * as React from "react"

import {
  SortableTableHead,
  useTableSort,
} from "@/components/dashboard/shared/table-sort"
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
import { applyDirection, compareDates, compareStrings } from "@/lib/table-sort"
import type { SortDirection } from "@/lib/table-sort"
import type { Role, UserAccount } from "@/lib/types"

type SortKey = "email" | "employeeId" | "role" | "passwordChangedAt"

type UsersTableProps = {
  users: UserAccount[]
  currentEmployeeId: string
  currentRole: Role
  emptyMessage?: string
}

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

function compareUsers(
  a: UserAccount,
  b: UserAccount,
  key: SortKey,
  dir: SortDirection
) {
  let result = 0

  if (key === "passwordChangedAt") {
    result = compareDates(a.passwordChangedAt, b.passwordChangedAt)
  } else if (key === "role") {
    result = compareStrings(ROLE_LABELS[a.role], ROLE_LABELS[b.role])
  } else {
    result = compareStrings(a[key], b[key])
  }

  return applyDirection(result, dir)
}

export function UsersTable({
  users,
  currentEmployeeId,
  currentRole,
  emptyMessage = "No users found.",
}: UsersTableProps) {
  const { sortKey, sortDir, handleSort, sortedItems } = useTableSort<
    UserAccount,
    SortKey
  >({
    items: users,
    defaultKey: "email",
    defaultDir: "asc",
    compare: compareUsers,
  })

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
            onSort={() => handleSort("email")}
          />
          <SortableTableHead
            label="Employee"
            active={sortKey === "employeeId"}
            direction={sortDir}
            onSort={() => handleSort("employeeId")}
          />
          <SortableTableHead
            label="Role"
            active={sortKey === "role"}
            direction={sortDir}
            onSort={() => handleSort("role")}
          />
          <SortableTableHead
            label="Password Status"
            active={sortKey === "passwordChangedAt"}
            direction={sortDir}
            onSort={() => handleSort("passwordChangedAt")}
          />
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedItems.map((user) => (
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
