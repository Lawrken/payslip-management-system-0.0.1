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
import type { UserAccount } from "@/lib/types"

type UsersTableProps = {
  users: UserAccount[]
  currentEmployeeId: string
  canManageElevatedRoles: boolean
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(date)
}

export function UsersTable({
  users,
  currentEmployeeId,
  canManageElevatedRoles,
}: UsersTableProps) {
  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground">No users yet.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.employeeId}>
            <TableCell className="font-medium">
              {user.employeeId}
              {user.employeeId === currentEmployeeId ? (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  You
                </span>
              ) : null}
            </TableCell>
            <TableCell>{user.employeeName ?? "No employee record"}</TableCell>
            <TableCell>{ROLE_LABELS[user.role]}</TableCell>
            <TableCell>{formatDate(user.createdAt)}</TableCell>
            <TableCell>
              <UserRowActions
                user={user}
                currentEmployeeId={currentEmployeeId}
                canManageElevatedRoles={canManageElevatedRoles}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
