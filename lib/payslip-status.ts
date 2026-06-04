import type { PayslipStatus } from "@/lib/types"

export function formatPayslipStatus(status: PayslipStatus): string {
  switch (status) {
    case "draft":
      return "No data yet"
    case "pending":
      return "Ready for review"
    case "adminApproved":
      return "Checked"
    case "approved":
      return "Ready for email"
    case "returned":
      return "Returned"
    case "sent":
      return "Sent"
  }
}

export function isDraftStatus(status: PayslipStatus): boolean {
  return status === "draft"
}

export function isReturnedStatus(status: PayslipStatus): boolean {
  return status === "returned"
}

export const STATUS_SORT_RANK: Record<PayslipStatus, number> = {
  returned: 0,
  draft: 1,
  pending: 2,
  adminApproved: 3,
  approved: 4,
  sent: 5,
}

export function comparePayslipStatus(
  a: PayslipStatus,
  b: PayslipStatus,
  dir: "asc" | "desc"
): number {
  const diff = STATUS_SORT_RANK[a] - STATUS_SORT_RANK[b]
  return dir === "asc" ? diff : -diff
}
