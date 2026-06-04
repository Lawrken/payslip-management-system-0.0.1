import { redirect } from "next/navigation"

import { ChangePasswordCard } from "@/components/account/change-password-card"
import { requireDashboardSession } from "@/lib/authorization"

export const dynamic = "force-dynamic"

export default async function DashboardChangePasswordPage() {
  const session = await requireDashboardSession()
  if ("error" in session) {
    redirect("/login")
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
