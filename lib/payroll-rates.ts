/** Basic pay on each payslip is for one semi-monthly cutoff (15 days). */
export const CUTOFF_PERIOD_DAYS = 15
export const HOURS_PER_DAY = 8

export type PayrollRateKey =
  | "regOt"
  | "nd"
  | "ndOt"
  | "rdOt"
  | "rdOtOver8"
  | "rdotNd"
  | "legal"
  | "legalOver8"
  | "lglNd"
  | "special"
  | "spclOver8"
  | "spclNd"
  | "spclRd"
  | "spclRdOver8"

/** Multipliers applied to hourly rate × hours */
export const PAYROLL_RATE_MULTIPLIERS: Record<PayrollRateKey, number> = {
  regOt: 1.25,
  nd: 0.1,
  ndOt: 0.125,
  rdOt: 1.3,
  rdOtOver8: 1.69,
  rdotNd: 0.13,
  legal: 1.0,
  legalOver8: 2.6,
  lglNd: 0.2,
  special: 0.3,
  spclOver8: 1.69,
  spclNd: 0.13,
  spclRd: 1.5,
  spclRdOver8: 1.95,
}
