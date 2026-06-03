"use client"

import { useActionState } from "react"

import { loginAction, type LoginState } from "@/app/login/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const initialState: LoginState = {}

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  )

  return (
    <form action={formAction}>
      <FieldGroup>
        {state.error ? (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}
        <Field>
          <FieldLabel htmlFor="employeeId">Employee ID</FieldLabel>
          <Input
            id="employeeId"
            name="employeeId"
            autoComplete="username"
            placeholder="ADMIN001"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Signing in…" : "Login"}
        </Button>
      </FieldGroup>
    </form>
  )
}
