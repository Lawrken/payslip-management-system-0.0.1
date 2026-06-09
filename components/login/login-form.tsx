"use client"

import { EyeIcon, ViewOffIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useActionState, useState } from "react"

import { loginAction, type LoginState } from "@/app/login/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { cn } from "@/lib/utils"

const initialState: LoginState = {}

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  )
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form action={formAction}>
      <FieldGroup>
        {state.error ? (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="admin@helport.local"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                <span className="relative size-4">
                  <HugeiconsIcon
                    icon={EyeIcon}
                    strokeWidth={2}
                    aria-hidden
                    className={cn(
                      "absolute inset-0 size-4 transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
                      showPassword
                        ? "scale-[0.25] opacity-0 blur-[4px]"
                        : "scale-100 opacity-100 blur-0"
                    )}
                  />
                  <HugeiconsIcon
                    icon={ViewOffIcon}
                    strokeWidth={2}
                    aria-hidden
                    className={cn(
                      "absolute inset-0 size-4 transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
                      showPassword
                        ? "scale-100 opacity-100 blur-0"
                        : "scale-[0.25] opacity-0 blur-[4px]"
                    )}
                  />
                </span>
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Signing in…" : "Sign in"}
        </Button>
      </FieldGroup>
    </form>
  )
}
