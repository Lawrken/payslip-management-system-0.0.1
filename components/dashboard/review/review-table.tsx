import { ReviewRowActions } from "@/components/dashboard/review/review-row-actions"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  formatPayslipStatus,
  isDraftStatus,
  isReturnedStatus,
} from "@/lib/payslip-status"
import { cn } from "@/lib/utils"
import type { Payslip } from "@/lib/types"

type ReviewTableProps = {
  payslips: Payslip[]
  onReview: (payslip: Payslip) => void
  emptyMessage?: string
}

export function ReviewTable({
  payslips,
  onReview,
  emptyMessage = "No payslips for this payroll period yet.",
}: ReviewTableProps) {
  if (payslips.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{emptyMessage}</p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee Name</TableHead>
          <TableHead>Employee ID</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payslips.map((payslip) => (
          <TableRow key={payslip.id}>
            <TableCell className="font-medium">{payslip.employeeName}</TableCell>
            <TableCell>{payslip.employeeId}</TableCell>
            <TableCell
              className={cn(
                isDraftStatus(payslip.status) && "text-muted-foreground",
                isReturnedStatus(payslip.status) && "font-medium text-destructive"
              )}
            >
              {formatPayslipStatus(payslip.status)}
            </TableCell>
            <TableCell>
              <ReviewRowActions payslip={payslip} onReview={onReview} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
