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
import {
  formatDisplayDate,
  formatDtrCutOffRange,
} from "@/lib/payroll-dates"
import { cn } from "@/lib/utils"
import type { PayrollSummary } from "@/lib/types"

type PayrollPeriodComboboxProps = {
  payrolls: PayrollSummary[]
  value: string
  onChange: (payrollId: string) => void
  disabled?: boolean
  allowClear?: boolean
  className?: string
}

export function PayrollPeriodCombobox({
  payrolls,
  value,
  onChange,
  disabled = false,
  allowClear = false,
  className,
}: PayrollPeriodComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const selected = payrolls.find((payroll) => payroll.id === value)

  return (
    <div className={cn("relative min-w-0", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="payroll-period-filter"
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select payroll period"
            disabled={disabled}
            className={cn(
              "h-9 w-full min-w-56 justify-between font-normal sm:min-w-72",
              allowClear && value && "pr-9",
              !selected && "text-muted-foreground"
            )}
          >
            <span className="truncate">
              {selected
                ? selected.payrollPeriodLabel
                : "Search payroll period…"}
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
            <CommandInput placeholder="Search by period or date…" />
            <CommandList className="max-h-60">
              <CommandEmpty>No payroll period found.</CommandEmpty>
              <CommandGroup>
                {payrolls.map((payroll) => (
                  <CommandItem
                    key={payroll.id}
                    value={`${payroll.payrollPeriodLabel} ${payroll.payrollPeriodStart} ${payroll.payrollPeriodEnd} ${formatDtrCutOffRange(payroll.dtrCutOffStart, payroll.dtrCutOffEnd)} ${formatDisplayDate(payroll.payoutDate)}`}
                    onSelect={() => {
                      onChange(payroll.id)
                      setOpen(false)
                    }}
                    className="flex flex-col items-start gap-0.5"
                  >
                    <span className="font-medium">
                      {payroll.payrollPeriodLabel}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      DTR {formatDtrCutOffRange(payroll.dtrCutOffStart, payroll.dtrCutOffEnd)}
                      {" · "}
                      Payout {formatDisplayDate(payroll.payoutDate)}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {allowClear && value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="absolute top-1/2 right-1 -translate-y-1/2 transition-none active:!translate-y-1/2"
          onClick={() => onChange("")}
          aria-label="Clear payroll period"
        >
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
        </Button>
      ) : null}
    </div>
  )
}
