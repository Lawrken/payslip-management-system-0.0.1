import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getSession } from "@/lib/session"

export default async function PayslipPage() {
  const session = await getSession()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your payslips</CardTitle>
        <CardDescription>
          {session
            ? `Signed in as ${session.employeeId}. Payslip history will appear here.`
            : "Payslip history will appear here."}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
