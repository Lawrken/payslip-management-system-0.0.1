import type { Payroll } from "@/lib/types"

export const seedPayrolls: Payroll[] = [
  {
    id: "payroll-march-2026",
    payrollPeriodLabel: "March 16-31, 2026",
    payrollPeriodStart: "2026-03-16",
    payrollPeriodEnd: "2026-03-31",
    dtrCutOffStart: "2026-03-11",
    dtrCutOffEnd: "2026-03-25",
    payoutDate: "2026-04-05",
  },
  {
    id: "payroll-may-2026",
    payrollPeriodLabel: "May 1-15, 2026",
    payrollPeriodStart: "2026-05-01",
    payrollPeriodEnd: "2026-05-15",
    dtrCutOffStart: "2026-04-26",
    dtrCutOffEnd: "2026-05-10",
    payoutDate: "2026-05-20",
  },
]
