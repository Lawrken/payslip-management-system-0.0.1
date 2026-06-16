"use client"

import {
  Alert02Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  formatPayoutCountdown,
  type DashboardSummary,
  type DashboardUrgencyLevel,
} from "@/lib/dashboard-summary"
import {
  formatDisplayDate,
  formatDtrCutOffRange,
} from "@/lib/payroll-dates"
import { cn } from "@/lib/utils"
import type { Payroll, Role } from "@/lib/types"

type DashboardReminderProps = {
  payroll: Payroll
  summary: DashboardSummary
  role: Role
  reviewHref: string
  payslipsHref: string
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

function reminderTitle(level: DashboardUrgencyLevel) {
  switch (level) {
    case "critical":
      return "Action required"
    case "action":
      return "Action required"
    case "soon":
      return "Payout approaching"
    case "clear":
      return "All clear"
  }
}

function reminderMessage(
  summary: DashboardSummary,
  role: Role,
  daysUntilPayout: number | null
) {
  if (summary.returnedCount > 0) {
    return `${summary.returnedCount} payslip${summary.returnedCount === 1 ? "" : "s"} returned — needs fixes before payout.`
  }
  if (summary.urgencyLevel === "action") {
    return reviewQueueMessage(role, summary.reviewQueueCount)
  }
  if (summary.urgencyLevel === "critical" && daysUntilPayout !== null) {
    const countdown = formatPayoutCountdown(daysUntilPayout)
    return `${countdown} — complete the payroll pipeline before payout.`
  }
  if (summary.urgencyLevel === "soon") {
    return "Payout is approaching — pipeline is on track."
  }
  return reviewQueueMessage(role, summary.reviewQueueCount)
}

function ReminderIcon({ level }: { level: DashboardUrgencyLevel }) {
  const icon =
    level === "clear"
      ? CheckmarkCircle01Icon
      : level === "soon"
        ? Clock01Icon
        : Alert02Icon

  return (
    <HugeiconsIcon
      icon={icon}
      strokeWidth={2}
      className="size-5 shrink-0 text-[var(--reminder-accent)]"
    />
  )
}

export function DashboardReminder({
  payroll,
  summary,
  role,
  reviewHref,
  payslipsHref,
}: DashboardReminderProps) {
  const { urgencyLevel, daysUntilPayout, completionPercent, totalPayslips } =
    summary
  const isSuperAdmin = role === "superAdmin"
  const allApproved =
    totalPayslips > 0 && summary.approvedCount === totalPayslips
  const showPrimaryCta =
    urgencyLevel === "critical" || urgencyLevel === "action"
  const showCountBadge =
    urgencyLevel === "action" && summary.reviewQueueCount > 0
  const emphasizeMessage =
    urgencyLevel === "critical" || urgencyLevel === "action"

  return (
    <div
      role="alert"
      data-urgency={urgencyLevel}
      className="dashboard-reminder rounded-xl p-4"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5">
              <ReminderIcon level={urgencyLevel} />
            </span>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className={cn(
                    "text-lg font-semibold tracking-tight text-balance",
                    urgencyLevel !== "clear" && "text-[var(--reminder-fg)]"
                  )}
                >
                  {payroll.payrollPeriodLabel}
                </p>
                {showCountBadge ? (
                  <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-[var(--reminder-accent)] px-2.5 py-0.5 text-sm font-semibold text-white tabular-nums">
                    {summary.reviewQueueCount}
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground">
                DTR cut-off:{" "}
                {formatDtrCutOffRange(
                  payroll.dtrCutOffStart,
                  payroll.dtrCutOffEnd
                )}
                <span className="mx-1">·</span>
                Payout: {formatDisplayDate(payroll.payoutDate)}
              </p>
            </div>
          </div>

          {daysUntilPayout !== null ? (
            <span
              className={cn(
                "shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium tabular-nums",
                urgencyLevel === "critical" || urgencyLevel === "soon"
                  ? "border-transparent bg-[var(--reminder-accent)] text-white"
                  : "border-border/60 bg-background/60 text-[var(--reminder-fg)]"
              )}
            >
              {formatPayoutCountdown(daysUntilPayout)}
            </span>
          ) : null}
        </div>

        {totalPayslips > 0 ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>Pipeline progress</span>
              <span className="font-medium tabular-nums text-foreground">
                {completionPercent}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-background/70 ring-1 ring-border/40">
              <div
                className="h-full rounded-full bg-[var(--reminder-accent)] transition-[width] duration-300 ease-out"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        ) : null}

        <div className="space-y-1">
          <p
            className={cn(
              "text-sm",
              emphasizeMessage
                ? "text-base font-semibold text-[var(--reminder-fg)]"
                : "font-medium text-foreground"
            )}
          >
            <span className="sr-only">{reminderTitle(urgencyLevel)}. </span>
            {reminderMessage(summary, role, daysUntilPayout)}
          </p>

          {isSuperAdmin && totalPayslips > 0 ? (
            <p className="text-sm text-muted-foreground">
              {summary.approvedCount} of {totalPayslips} available to employees
              {!allApproved
                ? " after superadmin approval."
                : " for PDF download from their payslip portal."}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {showPrimaryCta ? (
            <Button
              asChild
              className="bg-[var(--reminder-accent)] text-white hover:bg-[color-mix(in_oklab,var(--reminder-accent)_88%,black)]"
            >
              <Link href={reviewHref}>Go to review</Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href={reviewHref}>Open review</Link>
            </Button>
          )}
          <Button
            asChild
            variant={showPrimaryCta ? "ghost" : "outline"}
          >
            <Link href={payslipsHref}>Edit payslips</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
