import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard</CardTitle>
        <CardDescription>
          Use the sidebar to manage employees, payrolls, payslips, reviews, and
          audit logs.
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
