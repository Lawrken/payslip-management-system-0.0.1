"use client"

import { FilterMailIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import * as React from "react"

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
import { TableHead } from "@/components/ui/table"
import { cn } from "@/lib/utils"

type TableColumnFilterOption = {
  value: string
  label: string
}

type FilterTableHeadProps = {
  label: string
  value: string
  onChange: (value: string) => void
  options: TableColumnFilterOption[]
  searchPlaceholder: string
  emptyMessage: string
  className?: string
}

export function FilterTableHead({
  label,
  value,
  onChange,
  options,
  searchPlaceholder,
  emptyMessage,
  className,
}: FilterTableHeadProps) {
  const [open, setOpen] = React.useState(false)
  const triggerId = React.useId()
  const isActive = Boolean(value)

  return (
    <TableHead className={className}>
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <button
            id={triggerId}
            type="button"
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-label={`Filter ${label}`}
            className="inline-flex items-center gap-1 font-medium hover:text-foreground"
          >
            {label}
            <HugeiconsIcon
              icon={FilterMailIcon}
              strokeWidth={2}
              className={cn(
                "size-3.5 shrink-0",
                isActive ? "text-foreground opacity-100" : "opacity-50"
              )}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
            className="w-56 p-0"
            align="start"
            onWheel={(event) => event.stopPropagation()}
          >
            <Command>
              <CommandInput placeholder={searchPlaceholder} />
              <CommandList className="max-h-60">
                <CommandEmpty>{emptyMessage}</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="All"
                    onSelect={() => {
                      onChange("")
                      setOpen(false)
                    }}
                  >
                    All
                  </CommandItem>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => {
                        onChange(option.value)
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
    </TableHead>
  )
}
