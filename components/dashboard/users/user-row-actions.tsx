"use client"

import { useRouter } from "next/navigation"
import * as React from "react"

import {
  deleteUserAction,
  resetUserPasswordAction,
  type DeleteUserState,
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
  currentEmployeeId: string
  currentRole: Role
}

const initialState: ResetUserPasswordState = {}
const initialDeleteState: DeleteUserState = {}

function canResetUser(currentRole: Role, user: UserAccount) {
  if (!user.hasInitialPassword) {
    return false
  }
  if (currentRole === "superAdmin") {
    return true
  }
  return user.role === "employee"
}

function canDeleteUser(
  currentRole: Role,
  user: UserAccount,
  currentEmployeeId: string
) {
  if (user.employeeId === currentEmployeeId) {
    return false
  }
  if (currentRole === "superAdmin") {
    return true
  }
  return user.role === "employee"
}

export function UserRowActions({
  user,
  currentEmployeeId,
  currentRole,
}: UserRowActionsProps) {
  const router = useRouter()
  const [resetOpen, setResetOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [state, setState] = React.useState<ResetUserPasswordState>(initialState)
  const [deleteState, setDeleteState] =
    React.useState<DeleteUserState>(initialDeleteState)
  const [copyStatus, setCopyStatus] = React.useState("")
  const [isResetPending, startResetTransition] = React.useTransition()
  const [isDeletePending, startDeleteTransition] = React.useTransition()
  const canReset = canResetUser(currentRole, user)
  const canDelete = canDeleteUser(currentRole, user, currentEmployeeId)

  function handleReset() {
    startResetTransition(async () => {
      const result = await resetUserPasswordAction(user.employeeId)
      setState(result)
      if (result.success) {
        router.refresh()
      }
    })
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      const result = await deleteUserAction(user.employeeId)
      setDeleteState(result)
      if (result.success) {
        setDeleteOpen(false)
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
    <div className="flex justify-end gap-2">
      <AlertDialog
        open={resetOpen}
        onOpenChange={(nextOpen) => {
          setResetOpen(nextOpen)
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
                disabled={isResetPending}
                onClick={(event) => {
                  event.preventDefault()
                  handleReset()
                }}
              >
                {isResetPending ? "Resetting..." : "Reset Password"}
              </AlertDialogAction>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          setDeleteOpen(nextOpen)
          if (nextOpen) {
            setDeleteState(initialDeleteState)
          }
        }}
      >
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={!canDelete}
          >
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the login account for {user.email}.
              The employee record and payroll history will remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteState.error ? (
            <Alert variant="destructive">
              <AlertDescription>{deleteState.error}</AlertDescription>
            </Alert>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeletePending}
              onClick={(event) => {
                event.preventDefault()
                handleDelete()
              }}
            >
              {isDeletePending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
