"use client"

import * as React from "react"

import {
  viewInitialCredentialByEmployeeIdAction,
  type InitialCredentialResult,
} from "@/app/dashboard/users/actions"
import { CredentialLookupCombobox } from "@/components/dashboard/shared/credential-lookup-combobox"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ROLE_LABELS } from "@/lib/auth-helpers"
import type { CredentialLookupOption } from "@/lib/credential-exports"

type CredentialExportsToolbarProps = {
  credentialOptions: CredentialLookupOption[]
}

export function CredentialExportsToolbar({
  credentialOptions,
}: CredentialExportsToolbarProps) {
  const [selectedId, setSelectedId] = React.useState("")
  const [revealed, setRevealed] = React.useState<InitialCredentialResult | null>(
    null
  )
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [error, setError] = React.useState("")
  const [isLoading, startTransition] = React.useTransition()

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open)
    if (!open) {
      setSelectedId("")
      setRevealed(null)
      setError("")
    }
  }

  function handleSelectionChange(employeeId: string) {
    setSelectedId(employeeId)
    setRevealed(null)
    setError("")

    if (!employeeId) {
      setDialogOpen(false)
      return
    }

    startTransition(async () => {
      const result = await viewInitialCredentialByEmployeeIdAction(employeeId)
      if (result.error) {
        setError(result.error)
        setSelectedId("")
        return
      }
      if (result.result) {
        setRevealed(result.result)
        setDialogOpen(true)
      }
    })
  }

  async function handleCopyPassword() {
    if (!revealed?.password) {
      return
    }
    try {
      await navigator.clipboard.writeText(revealed.password)
    } catch {
      setError("Could not copy to clipboard.")
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <CredentialLookupCombobox
            options={credentialOptions}
            value={selectedId}
            onChange={handleSelectionChange}
            disabled={isLoading || credentialOptions.length === 0}
          />
          <Button type="button" variant="default" asChild>
            <a href="/dashboard/users/credentials">
              Download credentials (.xlsx)
            </a>
          </Button>
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          {revealed ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {revealed.employeeId}
                  {revealed.employeeName ? ` — ${revealed.employeeName}` : ""}
                </DialogTitle>
                <DialogDescription>
                  Role: {ROLE_LABELS[revealed.role]}
                </DialogDescription>
              </DialogHeader>
              <code className="block w-fit rounded-md bg-muted px-2 py-1 font-mono text-sm">
                {revealed.password}
              </code>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogOpenChange(false)}
                >
                  Close
                </Button>
                <Button type="button" onClick={handleCopyPassword}>
                  Copy password
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
