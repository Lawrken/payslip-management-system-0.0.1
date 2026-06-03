import { PayrollRowActions } from "@/components/dashboard/payrolls/payroll-row-actions"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDisplayDate, formatDtrCutOffRange } from "@/lib/payroll-dates"
import type { Payroll } from "@/lib/types"

type PayrollsTableProps = {
  payrolls: Payroll[]
  emptyMessage?: string
}

export function PayrollsTable({
  payrolls,
  emptyMessage = "No payroll periods yet.",
}: PayrollsTableProps) {
  if (payrolls.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{emptyMessage}</p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Payroll Period</TableHead>
          <TableHead>DTR Cut-Off</TableHead>
          <TableHead>Payout Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payrolls.map((payroll) => (
          <TableRow key={payroll.id}>
            <TableCell className="font-medium">
              {payroll.payrollPeriodLabel}
            </TableCell>
            <TableCell>
              {formatDtrCutOffRange(
                payroll.dtrCutOffStart,
                payroll.dtrCutOffEnd
              )}
            </TableCell>
            <TableCell>{formatDisplayDate(payroll.payoutDate)}</TableCell>
            <TableCell>
              <PayrollRowActions payroll={payroll} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
