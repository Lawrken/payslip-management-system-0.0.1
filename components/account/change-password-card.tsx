"use client"

import * as React from "react"
import { useActionState } from "react"

import {
  changePasswordAction,
  type ChangePasswordState,
} from "@/app/account/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const initialState: ChangePasswordState = {}

type ChangePasswordCardProps = {
  employeeId: string
}

export function ChangePasswordCard({ employeeId }: ChangePasswordCardProps) {
  const [state, formAction, isPending] = useActionState(
    changePasswordAction,
    initialState
  )
  const formRef = React.useRef<HTMLFormElement>(null)

  React.useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
    }
  }, [state.success])

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Signed in as {employeeId}. Update your password anytime.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction}>
          <FieldGroup className="gap-4">
            {state.error ? (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}
            {state.success ? (
              <Alert>
                <AlertDescription>Password changed.</AlertDescription>
              </Alert>
            ) : null}
            <Field>
              <FieldLabel htmlFor="currentPassword">Current Password</FieldLabel>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </Field>
            <Button type="submit" disabled={isPending} className="w-fit">
              {isPending ? "Changing…" : "Change Password"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
