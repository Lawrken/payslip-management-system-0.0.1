import { redirect } from "next/navigation"

import { logoutAction } from "@/app/account/actions"
import { ChangePasswordCard } from "@/components/account/change-password-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatPayslipStatus } from "@/lib/payslip-status"
import { formatDisplayDate } from "@/lib/payroll-dates"
import { getVisiblePayslipsByEmployeeId } from "@/lib/payslips"
import { requireEmployeeSession } from "@/lib/authorization"
import { getUserAccount } from "@/lib/users"

export const dynamic = "force-dynamic"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value)
}

export default async function EmployeePayslipsPage() {
  const session = await requireEmployeeSession()
  if ("error" in session) {
    redirect("/login")
  }

  const [payslips, account] = await Promise.all([
    getVisiblePayslipsByEmployeeId(session.employeeId),
    getUserAccount(session.employeeId),
  ])
  const shouldChangePassword = account?.passwordChangedAt === null

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Your Payslips
          </h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {account?.email ?? session.employeeId}.
          </p>
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="outline">
            Logout
          </Button>
        </form>
      </div>

      {shouldChangePassword ? (
        <Alert>
          <AlertTitle>Change your password</AlertTitle>
          <AlertDescription>
            This account is using its initial password or was recently reset.
            Change it to your personal password before continuing routine use.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Released Payslips</CardTitle>
          <CardDescription>
            Only approved and sent payslips are visible here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payslips.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No released payslips yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payroll Period</TableHead>
                  <TableHead>Payout Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.map((payslip) => (
                  <TableRow key={payslip.id}>
                    <TableCell className="font-medium">
                      {payslip.payrollPeriodLabel}
                    </TableCell>
                    <TableCell>
                      {formatDisplayDate(payslip.payoutDate)}
                    </TableCell>
                    <TableCell>{formatPayslipStatus(payslip.status)}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(payslip.totals.netPay)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ChangePasswordCard employeeId={session.employeeId} />
    </main>
  )
}
