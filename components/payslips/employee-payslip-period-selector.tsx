"use client"

import { ArrowDown01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import * as React from "react"

import type { EmployeePayslipListItem } from "@/lib/types"
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

type EmployeePayslipPeriodSelectorProps = {
  payslips: EmployeePayslipListItem[]
  value: string
  onChange: (payslipId: string) => void
  className?: string
}

export function EmployeePayslipPeriodSelector({
  payslips,
  value,
  onChange,
  className,
}: EmployeePayslipPeriodSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const selected = payslips.find((payslip) => payslip.id === value)

  if (payslips.length === 0) {
    return null
  }

  return (
    <div className={cn("relative min-w-0", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select payroll date"
            className="h-9 w-full min-w-56 justify-between font-normal sm:min-w-72"
          >
            <span className="truncate">
              {selected?.payrollPeriodLabel ?? "Select payroll date…"}
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
          align="end"
        >
          <Command>
            <CommandInput placeholder="Search payroll date…" />
            <CommandList className="max-h-72">
              <CommandEmpty>No payslip found.</CommandEmpty>
              <CommandGroup>
                {payslips.map((payslip) => (
                  <CommandItem
                    key={payslip.id}
                    value={`${payslip.payrollPeriodLabel} ${payslip.dtrCutOffStart} ${payslip.dtrCutOffEnd} ${payslip.payoutDate}`}
                    onSelect={() => {
                      onChange(payslip.id)
                      setOpen(false)
                    }}
                    className={cn(
                      "flex flex-col items-start gap-0.5",
                      payslip.id === value && "bg-accent"
                    )}
                  >
                    <span className="font-medium">
                      {payslip.payrollPeriodLabel}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      DTR{" "}
                      {formatDtrCutOffRange(
                        payslip.dtrCutOffStart,
                        payslip.dtrCutOffEnd
                      )}
                      {" · "}
                      Payout {formatDisplayDate(payslip.payoutDate)}
                    </span>
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
