import { redirect } from "next/navigation"

import { logoutAction } from "@/app/account/actions"
import { ThemeSelector } from "@/components/theme-selector"
import { ChangePasswordDialog } from "@/components/payslips/change-password-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { requireEmployeeSession } from "@/lib/authorization"
import { getUserAccount } from "@/lib/users"

export const dynamic = "force-dynamic"

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireEmployeeSession()
  if ("error" in session) {
    redirect("/login")
  }

  const account = await getUserAccount(session.employeeId)
  const shouldChangePassword = account?.passwordChangedAt === null
  const signedInLabel = account?.email ?? session.employeeId

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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Signed in as {signedInLabel}.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <ThemeSelector />
          <ChangePasswordDialog employeeId={session.employeeId} />
          <form action={logoutAction}>
            <Button type="submit" variant="outline">
              Logout
            </Button>
          </form>
        </div>
      </div>

      {children}
    </main>
  )
}
