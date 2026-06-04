import { redirect } from "next/navigation"

import { LoginForm } from "@/components/login/login-form"
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
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Enter your employee ID and password to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  )
}
