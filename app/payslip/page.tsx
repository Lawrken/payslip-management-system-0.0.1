import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatPayslipStatus } from "@/lib/payslip-status"
import { formatDisplayDate } from "@/lib/payroll-dates"
import { getVisiblePayslipsByEmployeeId } from "@/lib/payslips"
import { getSession } from "@/lib/session"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value)
}

export default async function PayslipPage() {
  const session = await getSession()
  const payslips = session
    ? await getVisiblePayslipsByEmployeeId(session.employeeId)
    : []

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Your payslips</CardTitle>
          <CardDescription>
            {session
              ? `Signed in as ${session.employeeId}. Only approved and sent payslips are shown.`
              : "Payslip history will appear here."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payslips.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No released payslips yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payroll Period</TableHead>
                  <TableHead>Payout Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.map((payslip) => (
                  <TableRow key={payslip.id}>
                    <TableCell className="font-medium">
                      {payslip.payrollPeriodLabel}
                    </TableCell>
                    <TableCell>{formatDisplayDate(payslip.payoutDate)}</TableCell>
                    <TableCell>{formatPayslipStatus(payslip.status)}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(payslip.totals.netPay)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
