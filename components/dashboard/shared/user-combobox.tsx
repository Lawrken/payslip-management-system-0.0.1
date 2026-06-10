"use client"

import { ArrowDown01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ROLE_LABELS } from "@/lib/auth-helpers"
import { cn } from "@/lib/utils"
import type { UserAccount } from "@/lib/types"

type UserComboboxProps = {
  users: UserAccount[]
  value: string
  onChange: (employeeId: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function UserCombobox({
  users,
  value,
  onChange,
  disabled = false,
  placeholder = "Search by ID, email, or name…",
  className,
}: UserComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const selected = users.find((user) => user.employeeId === value)

  return (
    <div className={cn("relative w-56 sm:w-64", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="user-filter"
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Filter users"
            disabled={disabled}
            className={cn(
              "h-9 w-full justify-between font-normal",
              value && "pr-9",
              !selected && "text-muted-foreground"
            )}
          >
            <span className="truncate">
              {selected
                ? `${selected.employeeId} — ${selected.employeeName ?? selected.email}`
                : placeholder}
            </span>
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              strokeWidth={2}
              className="size-4 shrink-0 opacity-50"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Search by ID, email, or name…" />
            <CommandList className="max-h-60">
              <CommandEmpty>No user found.</CommandEmpty>
              <CommandGroup>
                {users.map((user) => (
                  <CommandItem
                    key={user.employeeId}
                    value={`${user.employeeId} ${user.email} ${user.employeeName ?? ""} ${ROLE_LABELS[user.role]}`}
                    onSelect={() => {
                      onChange(user.employeeId)
                      setOpen(false)
                    }}
                    className="flex flex-col items-start gap-0.5"
                  >
                    <span className="font-medium">{user.email}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.employeeId}
                      {user.employeeName ? ` · ${user.employeeName}` : ""}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="absolute top-1/2 right-1 -translate-y-1/2 transition-none active:!-translate-y-1/2"
          onClick={() => onChange("")}
          aria-label="Clear filter"
        >
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
        </Button>
      ) : null}
    </div>
  )
}
