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
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { EmployeeOption } from "@/lib/employees"

type EmployeeComboboxProps = {
  employees: EmployeeOption[]
  value: string
  onChange: (employeeId: string) => void
  disabled?: boolean
  /** Form: label + required hidden input. Filter: compact toolbar control. */
  variant?: "form" | "filter"
  label?: string
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
}

export function EmployeeCombobox({
  employees,
  value,
  onChange,
  disabled = false,
  variant = "form",
  label = "Employee ID",
  placeholder,
  searchPlaceholder = "Search by ID or name…",
  emptyMessage = "No employee found.",
  className,
}: EmployeeComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const selected = employees.find((employee) => employee.employeeId === value)

  const defaultPlaceholder =
    variant === "filter" ? "Search by ID or name…" : "Search employee…"

  const trigger = (
    <div
      className={cn(
        variant === "filter" && "relative w-56 sm:w-64",
        variant === "form" && "min-w-0 flex-1",
        className
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={variant === "form" ? "employeeId-trigger" : "employee-filter"}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={variant === "filter" ? "Filter employees" : undefined}
            disabled={disabled}
            className={cn(
              "h-9 w-full justify-between font-normal",
              variant === "filter" && value && "pr-9",
              !selected && "text-muted-foreground"
            )}
          >
            <span className="truncate">
              {selected
                ? `${selected.employeeId} — ${selected.name}`
                : (placeholder ?? defaultPlaceholder)}
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
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList className="max-h-60">
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {employees.map((employee) => (
                  <CommandItem
                    key={employee.id}
                    value={`${employee.employeeId} ${employee.name}`}
                    onSelect={() => {
                      onChange(employee.employeeId)
                      setOpen(false)
                    }}
                    className="flex flex-col items-start gap-0.5"
                  >
                    <span className="font-medium">{employee.employeeId}</span>
                    <span className="text-xs text-muted-foreground">
                      {employee.name}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {variant === "filter" && value ? (
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

  if (variant === "filter") {
    return trigger
  }

  return (
    <Field className="min-w-0 flex-1">
      {label ? (
        <FieldLabel htmlFor="employeeId-trigger">{label}</FieldLabel>
      ) : null}
      <input type="hidden" name="employeeId" value={value} required />
      {trigger}
    </Field>
  )
}
