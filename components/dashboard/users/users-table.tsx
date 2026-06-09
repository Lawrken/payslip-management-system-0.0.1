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
import type { Role, UserAccount } from "@/lib/types"

type UsersTableProps = {
  users: UserAccount[]
  currentEmployeeId: string
  currentRole: Role
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

export function UsersTable({
  users,
  currentEmployeeId,
  currentRole,
}: UsersTableProps) {
  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground">No users found.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Employee</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Password Status</TableHead>
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
              <UserRowActions user={user} currentRole={currentRole} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
