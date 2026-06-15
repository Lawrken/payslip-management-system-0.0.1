"use client"

import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { deleteEmployeeAction } from "@/app/dashboard/employees/actions"
import { EditEmployeeDialog } from "@/components/dashboard/employees/edit-employee-dialog"
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
import type { Employee } from "@/lib/types"

type EmployeeRowActionsProps = {
  employee: Employee
}

export function EmployeeRowActions({ employee }: EmployeeRowActionsProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    const result = await deleteEmployeeAction(employee.id)
    setIsDeleting(false)

    if ("error" in result && result.error) {
      return
    }

    setDeleteOpen(false)
    toast.success("Employee deleted", {
      description: `${employee.name} (${employee.employeeId}) was removed.`,
    })
    router.refresh()
  }

  return (
    <>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setEditOpen(true)}
        >
          Edit
        </Button>
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive" size="sm">
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete employee?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove {employee.name} (
                {employee.employeeId}) from the list.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={isDeleting}
                onClick={(event) => {
                  event.preventDefault()
                  void handleDelete()
                }}
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <EditEmployeeDialog
        employee={employee}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  )
}
