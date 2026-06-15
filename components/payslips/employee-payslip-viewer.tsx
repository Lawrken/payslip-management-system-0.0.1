"use client"

import { ArrowDown01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import * as React from "react"

import { PayslipSummary } from "@/components/dashboard/payslips/payslip-summary"
import { PayslipBreakdown } from "@/components/dashboard/shared/payslip-breakdown"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { formatPayslipStatus } from "@/lib/payslip-status"
import {
  formatDisplayDate,
  formatDtrCutOffRange,
} from "@/lib/payroll-dates"
import type {
  PayslipPayrollInputs,
  PayslipStatus,
  PayslipTotals,
} from "@/lib/types"
import type { EmployeeDivisor } from "@/lib/employee-options"
import { cn } from "@/lib/utils"

export type EmployeePayslipPreviewItem = {
  id: string
  employeeId: string
  employeeName: string
  employeeDivisor: EmployeeDivisor
  tin: string
  sssNo: string
  phicNo: string
  hdmfNo: string
  payrollPeriodLabel: string
  dtrCutOffStart: string
  dtrCutOffEnd: string
  payoutDate: string
  status: PayslipStatus
  inputs: PayslipPayrollInputs
  totals: PayslipTotals
}

type EmployeePayslipViewerProps = {
  payslips: EmployeePayslipPreviewItem[]
}

function formatMoney(value: number) {
  return value.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function EmployeePayslipViewer({
  payslips,
}: EmployeePayslipViewerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedId, setSelectedId] = React.useState(payslips[0]?.id ?? "")

  const selectedPayslip =
    payslips.find((payslip) => payslip.id === selectedId) ?? payslips[0]

  if (!selectedPayslip) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground">
            No released payslips yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 text-card-foreground sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium">Payroll Date</p>
          <p className="text-xs text-muted-foreground">
            Select a released payslip to preview.
          </p>
        </div>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-label="Select payroll date"
              className="h-auto min-h-9 w-full justify-between gap-3 py-2 font-normal sm:w-80"
            >
              <span className="flex min-w-0 flex-col items-start text-left">
                <span className="max-w-full truncate font-medium">
                  {selectedPayslip.payrollPeriodLabel}
                </span>
                <span className="max-w-full truncate text-xs text-muted-foreground">
                  Payout {formatDisplayDate(selectedPayslip.payoutDate)}
                </span>
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
              <CommandInput placeholder="Search payroll date..." />
              <CommandList className="max-h-72">
                <CommandEmpty>No payslip found.</CommandEmpty>
                <CommandGroup>
                  {payslips.map((payslip) => (
                    <CommandItem
                      key={payslip.id}
                      value={`${payslip.payrollPeriodLabel} ${payslip.dtrCutOffStart} ${payslip.dtrCutOffEnd} ${payslip.payoutDate}`}
                      onSelect={() => {
                        setSelectedId(payslip.id)
                        setOpen(false)
                      }}
                      className={cn(
                        "flex flex-col items-start gap-0.5",
                        payslip.id === selectedPayslip.id && "bg-accent"
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

      <Card>
        <CardHeader>
          <CardTitle>{selectedPayslip.payrollPeriodLabel}</CardTitle>
          <CardDescription>
            {formatPayslipStatus(selectedPayslip.status)}
            {" · "}
            Payout {formatDisplayDate(selectedPayslip.payoutDate)}
            {" · "}
            Net pay {formatMoney(selectedPayslip.totals.netPay)}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Employee</p>
              <p className="truncate font-medium">
                {selectedPayslip.employeeName}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedPayslip.employeeId}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">DTR Cut-Off</p>
              <p className="font-medium">
                {formatDtrCutOffRange(
                  selectedPayslip.dtrCutOffStart,
                  selectedPayslip.dtrCutOffEnd
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">TIN</p>
              <p className="font-medium tabular-nums">
                {selectedPayslip.tin || "-"}
              </p>
            </div>
            <div className="grid gap-2 sm:col-span-2 sm:grid-cols-3 lg:col-span-1">
              <div>
                <p className="text-xs text-muted-foreground">SSS</p>
                <p className="font-medium tabular-nums">
                  {selectedPayslip.sssNo || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">PHIC</p>
                <p className="font-medium tabular-nums">
                  {selectedPayslip.phicNo || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">HDMF</p>
                <p className="font-medium tabular-nums">
                  {selectedPayslip.hdmfNo || "-"}
                </p>
              </div>
            </div>
          </div>
          <PayslipSummary totals={selectedPayslip.totals} variant="compact" />
          <PayslipBreakdown
            inputs={selectedPayslip.inputs}
            divisor={selectedPayslip.employeeDivisor}
          />
        </CardContent>
      </Card>
    </section>
  )
}
