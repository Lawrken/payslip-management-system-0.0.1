"use client"

import { useRouter } from "next/navigation"
import * as React from "react"

import {
  resetUserPasswordAction,
  type ResetUserPasswordState,
} from "@/app/dashboard/users/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import type { Role, UserAccount } from "@/lib/types"

type UserRowActionsProps = {
  user: UserAccount
  currentRole: Role
}

const initialState: ResetUserPasswordState = {}

function canResetUser(currentRole: Role, user: UserAccount) {
  if (!user.hasInitialPassword) {
    return false
  }
  if (currentRole === "superAdmin") {
    return true
  }
  return user.role === "employee"
}

export function UserRowActions({ user, currentRole }: UserRowActionsProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [state, setState] = React.useState<ResetUserPasswordState>(initialState)
  const [copyStatus, setCopyStatus] = React.useState("")
  const [isPending, startTransition] = React.useTransition()
  const canReset = canResetUser(currentRole, user)

  function handleReset() {
    startTransition(async () => {
      const result = await resetUserPasswordAction(user.employeeId)
      setState(result)
      if (result.success) {
        router.refresh()
      }
    })
  }

  async function copyInitialPassword() {
    if (!state.initialPassword) {
      return
    }
    await navigator.clipboard.writeText(state.initialPassword)
    setCopyStatus("Copied.")
  }

  return (
    <div className="flex justify-end">
      <AlertDialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (nextOpen) {
            setState(initialState)
            setCopyStatus("")
          }
        }}
      >
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canReset}
          >
            Reset
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset password?</AlertDialogTitle>
            <AlertDialogDescription>
              This restores {user.email} to the initial password stored when the
              account was created.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          {state.success && state.initialPassword ? (
            <Alert>
              <AlertDescription>
                <span className="block">{state.message}</span>
                <span className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <span className="font-mono text-sm">
                    {state.initialPassword}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyInitialPassword}
                  >
                    Copy Password
                  </Button>
                  {copyStatus ? (
                    <span className="text-xs text-muted-foreground">
                      {copyStatus}
                    </span>
                  ) : null}
                </span>
              </AlertDescription>
            </Alert>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            {!state.success ? (
              <AlertDialogAction
                disabled={isPending}
                onClick={(event) => {
                  event.preventDefault()
                  handleReset()
                }}
              >
                {isPending ? "Resetting..." : "Reset Password"}
              </AlertDialogAction>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
