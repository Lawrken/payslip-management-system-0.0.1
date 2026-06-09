import { redirect } from "next/navigation"

import { LoginForm } from "@/components/login/login-form"
import { ThemeSelector } from "@/components/theme-selector"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getHomePath } from "@/lib/auth-helpers"
import { getSession } from "@/lib/session"

export default async function LoginPage() {
  const session = await getSession()
  if (session) {
    redirect(getHomePath(session.role))
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-background p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-muted/80 via-background to-muted/40"
      />

      <div className="absolute top-4 right-4 z-10">
        <ThemeSelector />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <Card className="border border-border bg-card shadow-sm ring-0">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-xl text-balance">Helport AI</CardTitle>
            <CardDescription className="text-pretty">
              Sign in to view and manage payslips.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
