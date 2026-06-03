import { PayslipRowActions } from "@/components/dashboard/payslips/payslip-row-actions"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Payslip } from "@/lib/types"

type PayslipsTableProps = {
  payslips: Payslip[]
  onEdit: (payslip: Payslip) => void
  emptyMessage?: string
}

function formatStatus(status: Payslip["status"]) {
  return status === "sent" ? "Sent" : "Pending"
}

export function PayslipsTable({
  payslips,
  onEdit,
  emptyMessage = "No payslips yet.",
}: PayslipsTableProps) {
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
            <TableCell>{formatStatus(payslip.status)}</TableCell>
            <TableCell>
              <PayslipRowActions payslip={payslip} onEdit={onEdit} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
