import { redirect } from "next/navigation"

import { ChangePasswordCard } from "@/components/account/change-password-card"
import { isDashboardRole } from "@/lib/auth-helpers"
import { getSession } from "@/lib/session"

export const dynamic = "force-dynamic"

export default async function PayslipChangePasswordPage() {
  const session = await getSession()
  if (!session) {
    redirect("/login")
  }
  if (isDashboardRole(session.role)) {
    redirect("/dashboard/account/password")
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Change Password</h1>
        <p className="text-sm text-muted-foreground">
          Update the password for your account.
        </p>
      </div>
      <ChangePasswordCard employeeId={session.employeeId} />
    </div>
  )
}
