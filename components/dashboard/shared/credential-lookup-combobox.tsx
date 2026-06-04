"use client"

import { ArrowDown01Icon } from "@hugeicons/core-free-icons"
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
import { cn } from "@/lib/utils"
import type { CredentialLookupOption } from "@/lib/credential-exports"

type CredentialLookupComboboxProps = {
  options: CredentialLookupOption[]
  value: string
  onChange: (employeeId: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

function formatOptionLabel(option: CredentialLookupOption) {
  if (option.employeeName) {
    return `${option.employeeId} — ${option.employeeName}`
  }
  return option.employeeId
}

export function CredentialLookupCombobox({
  options,
  value,
  onChange,
  disabled = false,
  placeholder = "Search by ID or name…",
  className,
}: CredentialLookupComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const selected = options.find((option) => option.employeeId === value)

  return (
    <div className={cn("w-56 sm:w-64", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="credential-lookup"
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Look up initial password"
            disabled={disabled}
            className={cn(
              "h-9 w-full justify-between font-normal",
              !selected && "text-muted-foreground"
            )}
          >
            <span className="truncate">
              {selected ? formatOptionLabel(selected) : placeholder}
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
            <CommandInput placeholder="Search by ID or name…" />
            <CommandList className="max-h-60">
              <CommandEmpty>No stored credentials found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.employeeId}
                    value={`${option.employeeId} ${option.employeeName ?? ""}`}
                    onSelect={() => {
                      onChange(option.employeeId)
                      setOpen(false)
                    }}
                    className="flex flex-col items-start gap-0.5"
                  >
                    <span className="font-medium">{option.employeeId}</span>
                    {option.employeeName ? (
                      <span className="text-xs text-muted-foreground">
                        {option.employeeName}
                      </span>
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
