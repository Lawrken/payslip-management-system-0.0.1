"use client"

import { Button } from "@/components/ui/button"
import type { Payslip } from "@/lib/types"

type ReviewRowActionsProps = {
  payslip: Payslip
  onReview: (payslip: Payslip) => void
}

export function ReviewRowActions({ payslip, onReview }: ReviewRowActionsProps) {
  return (
    <div className="flex justify-end">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onReview(payslip)}
      >
        Review
      </Button>
    </div>
  )
}
