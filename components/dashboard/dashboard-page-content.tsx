import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ROLE_LABELS } from "@/lib/auth-helpers"
import type { DashboardSummary } from "@/lib/dashboard-summary"
import {
  formatDisplayDate,
  formatDtrCutOffRange,
} from "@/lib/payroll-dates"
import { cn } from "@/lib/utils"
import type { Role, Session } from "@/lib/types"

type DashboardPageContentProps = {
  session: Session
  summary: DashboardSummary
}

function reviewQueueMessage(role: Role, count: number) {
  if (count === 0) {
    return "You are caught up for this period."
  }
  if (role === "admin") {
    return `${count} payslip${count === 1 ? "" : "s"} ready for review.`
  }
  return `${count} payslip${count === 1 ? "" : "s"} awaiting approval.`
}

export function DashboardPageContent({
  session,
  summary,
}: DashboardPageContentProps) {
  const payroll = summary.latestPayroll
  const reviewHref = payroll
    ? `/dashboard/review?payrollId=${encodeURIComponent(payroll.id)}`
    : "/dashboard/review"
  const isSuperAdmin = session.role === "superAdmin"
  const allApproved =
    summary.totalPayslips > 0 &&
    summary.approvedCount === summary.totalPayslips

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Signed in as {session.employeeId} · {ROLE_LABELS[session.role]}
        </p>
      </div>

      {!payroll ? (
        <Card>
          <CardHeader>
            <CardTitle>No payroll period yet</CardTitle>
            <CardDescription>
              Create a payroll period before reviewing or editing payslips.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/dashboard/payrolls">Go to payrolls</Link>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{payroll.payrollPeriodLabel}</CardTitle>
            <CardDescription>
              DTR cut-off:{" "}
              {formatDtrCutOffRange(
                payroll.dtrCutOffStart,
                payroll.dtrCutOffEnd
              )}
              <span className="mx-1">·</span>
              Payout: {formatDisplayDate(payroll.payoutDate)}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={reviewHref}>Open review</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/payslips">Edit payslips</Link>
            </Button>
          </CardFooter>
        </Card>
      )}

      {payroll ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">Payslip status</h2>
          <p className="text-sm text-muted-foreground">
            {payroll.payrollPeriodLabel} · {summary.totalPayslips} payslip
            {summary.totalPayslips === 1 ? "" : "s"}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {summary.statusCounts.map((item) => {
              const isAttention =
                summary.attentionStatus !== null &&
                item.status === summary.attentionStatus &&
                item.count > 0

              return (
                <Card
                  key={item.status}
                  size="sm"
                  className={cn(
                    isAttention && "ring-2 ring-foreground/20"
                  )}
                >
                  <CardHeader className="gap-1">
                    <CardDescription className="text-xs">
                      {item.label}
                    </CardDescription>
                    <CardTitle className="text-2xl tabular-nums">
                      {item.count}
                    </CardTitle>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </div>
      ) : null}

      {payroll ? (
        <Card>
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
            <CardDescription>
              {reviewQueueMessage(session.role, summary.reviewQueueCount)}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {isSuperAdmin && summary.totalPayslips > 0 ? (
              <p className="text-sm text-muted-foreground">
                {summary.approvedCount} of {summary.totalPayslips} ready for
                email
                {!allApproved
                  ? " — bulk email unlocks when all payslips are ready for email."
                  : " — ready for bulk email on the Review page."}
              </p>
            ) : null}
          </CardContent>
          {summary.reviewQueueCount > 0 ? (
            <CardFooter>
              <Button asChild>
                <Link href={reviewHref}>Go to review</Link>
              </Button>
            </CardFooter>
          ) : null}
        </Card>
      ) : null}
    </div>
  )
}
