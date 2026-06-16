import { redirect } from "next/navigation"

import { logoutAction } from "@/app/account/actions"
import { ThemeSelector } from "@/components/theme-selector"
import { ChangePasswordDialog } from "@/components/payslips/change-password-dialog"
import { EmployeePayslipsWorkspace } from "@/components/payslips/employee-payslips-workspace"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { requireEmployeeSession } from "@/lib/authorization"
import { getVisibleEmployeePayslipListItems } from "@/lib/payslips"
import { getUserAccount } from "@/lib/users"

export const dynamic = "force-dynamic"

export default async function EmployeePayslipsPage() {
  const session = await requireEmployeeSession()
  if ("error" in session) {
    redirect("/login")
  }

  const [payslipPeriods, account] = await Promise.all([
    getVisibleEmployeePayslipListItems(session.employeeId),
    getUserAccount(session.employeeId),
  ])
  const shouldChangePassword = account?.passwordChangedAt === null

  return (
    <main className="flex min-h-screen w-full flex-col gap-6 p-4 sm:p-6">
      {shouldChangePassword ? (
        <Alert>
          <AlertTitle>Change your password</AlertTitle>
          <AlertDescription>
            This account is using its initial password or was recently reset.
            Change it to your personal password before continuing routine use.
          </AlertDescription>
        </Alert>
      ) : null}

      <EmployeePayslipsWorkspace
        payslipPeriods={payslipPeriods}
        signedInLabel={account?.email ?? session.employeeId}
        headerActions={
          <>
            <ThemeSelector />
            <ChangePasswordDialog employeeId={session.employeeId} />
            <form action={logoutAction}>
              <Button type="submit" variant="outline">
                Logout
              </Button>
            </form>
          </>
        }
      />
    </main>
  )
}
