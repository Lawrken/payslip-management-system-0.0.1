"use client"

import { useRouter } from "next/navigation"
import * as React from "react"

import {
  deleteUserAction,
  resetUserPasswordAction,
  type UserActionState,
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
import type { UserAccount } from "@/lib/types"

type UserRowActionsProps = {
  user: UserAccount
  currentEmployeeId: string
  canManageElevatedRoles: boolean
}

export function UserRowActions({
  user,
  currentEmployeeId,
  canManageElevatedRoles,
}: UserRowActionsProps) {
  const router = useRouter()
  const [resetOpen, setResetOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [resetState, setResetState] = React.useState<UserActionState>({})
  const [deleteError, setDeleteError] = React.useState("")
  const [isResetting, startResetTransition] = React.useTransition()
  const [isDeleting, startDeleteTransition] = React.useTransition()
  const isSelf = user.employeeId === currentEmployeeId
  const canManageUser = user.role === "employee" || canManageElevatedRoles

  function handleReset() {
    startResetTransition(async () => {
      const result = await resetUserPasswordAction(user.employeeId)
      setResetState(result)
      if (result.success) {
        router.refresh()
      }
    })
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      const result = await deleteUserAction(user.employeeId)
      if (result.error) {
        setDeleteError(result.error)
        return
      }
      setDeleteOpen(false)
      router.refresh()
    })
  }

  return (
    <div className="flex justify-end gap-2">
      <AlertDialog
        open={resetOpen}
        onOpenChange={(nextOpen) => {
          setResetOpen(nextOpen)
          if (nextOpen) {
            setResetState({})
          }
        }}
      >
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canManageUser}
          >
            Reset
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset password?</AlertDialogTitle>
            <AlertDialogDescription>
              Restores the initial password from when the account was created
              for {user.employeeId}. Use View password on the Users page if you
              need to look it up.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {resetState.error ? (
            <Alert variant="destructive">
              <AlertDescription>{resetState.error}</AlertDescription>
            </Alert>
          ) : null}
          {resetState.success && resetState.message ? (
            <Alert>
              <AlertDescription>{resetState.message}</AlertDescription>
            </Alert>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            {!resetState.success ? (
              <AlertDialogAction
                disabled={isResetting}
                onClick={(event) => {
                  event.preventDefault()
                  handleReset()
                }}
              >
                {isResetting ? "Resetting…" : "Reset Password"}
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
            setDeleteError("")
          }
        }}
      >
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isSelf || !canManageUser}
          >
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes login access for {user.employeeId}. Employee records
              and payslips are not deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError ? (
            <Alert variant="destructive">
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault()
                handleDelete()
              }}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
