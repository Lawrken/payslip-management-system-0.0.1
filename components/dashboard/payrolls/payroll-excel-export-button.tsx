"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type PayrollExcelExportButtonProps = {
  payrollId: string
  label?: string
  className?: string
  size?: React.ComponentProps<typeof Button>["size"]
  variant?: React.ComponentProps<typeof Button>["variant"]
}

export function PayrollExcelExportButton({
  payrollId,
  label = "Download Excel",
  className,
  size = "sm",
  variant = "outline",
}: PayrollExcelExportButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(className)}
      asChild
    >
      <a href={`/dashboard/payrolls/${payrollId}/export`}>{label}</a>
    </Button>
  )
}
