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

type OptionSelectOption = {
  value: string
  label: string
}

type OptionSelectProps = {
  name: string
  id: string
  label: string
  options: OptionSelectOption[]
  defaultValue?: string
  placeholder: string
  searchPlaceholder: string
  emptyMessage: string
  disabled?: boolean
  className?: string
}

export function OptionSelect({
  name,
  id,
  label,
  options,
  defaultValue = "",
  placeholder,
  searchPlaceholder,
  emptyMessage,
  disabled = false,
  className,
}: OptionSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState(defaultValue)
  const selected = options.find((option) => option.value === value)

  return (
    <Field className={cn("min-w-0", className)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input type="hidden" name={name} value={value} />
      <div className="relative min-w-0">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-label={label}
              disabled={disabled}
              className={cn(
                "h-9 w-full justify-between font-normal",
                value && "pr-9",
                !selected && "text-muted-foreground"
              )}
            >
              <span className="truncate">
                {selected ? selected.label : placeholder}
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
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => {
                        setValue(option.value)
                        setOpen(false)
                      }}
                    >
                      {option.label}
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
            onClick={() => setValue("")}
            aria-label={`Clear ${label.toLowerCase()}`}
          >
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
          </Button>
        ) : null}
      </div>
    </Field>
  )
}
