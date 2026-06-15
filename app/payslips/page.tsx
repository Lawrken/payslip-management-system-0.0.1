import { redirect } from "next/navigation"

import { logoutAction } from "@/app/account/actions"
import { ThemeSelector } from "@/components/theme-selector"
import { ChangePasswordDialog } from "@/components/payslips/change-password-dialog"
import {
  EmployeePayslipViewer,
  type EmployeePayslipPreviewItem,
} from "@/components/payslips/employee-payslip-viewer"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { getVisibleEmployeePayslipDetailsByEmployeeId } from "@/lib/payslips"
import { requireEmployeeSession } from "@/lib/authorization"
import { getUserAccount } from "@/lib/users"

export const dynamic = "force-dynamic"

export default async function EmployeePayslipsPage() {
  const session = await requireEmployeeSession()
  if ("error" in session) {
    redirect("/login")
  }

  const [payslips, account] = await Promise.all([
    getVisibleEmployeePayslipDetailsByEmployeeId(session.employeeId),
    getUserAccount(session.employeeId),
  ])
  const previewPayslips: EmployeePayslipPreviewItem[] = payslips.map(
    (payslip) => ({
      id: payslip.id,
      employeeId: payslip.employeeId,
      employeeName: payslip.employeeName,
      employeeDivisor: payslip.employeeDivisor,
      tin: payslip.tin,
      sssNo: payslip.sssNo,
      phicNo: payslip.phicNo,
      hdmfNo: payslip.hdmfNo,
      payrollPeriodLabel: payslip.payrollPeriodLabel,
      dtrCutOffStart: payslip.dtrCutOffStart,
      dtrCutOffEnd: payslip.dtrCutOffEnd,
      payoutDate: payslip.payoutDate,
      status: payslip.status,
      inputs: payslip.inputs,
      totals: payslip.totals,
    })
  )
  const shouldChangePassword = account?.passwordChangedAt === null

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Your Payslips
          </h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {account?.email ?? session.employeeId}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSelector />
          <ChangePasswordDialog employeeId={session.employeeId} />
          <form action={logoutAction}>
            <Button type="submit" variant="outline">
              Logout
            </Button>
          </form>
        </div>
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

      <EmployeePayslipViewer payslips={previewPayslips} />
    </main>
  )
}
