import type { PayrollRateKey } from "@/lib/payroll-rates"

type PayslipFieldInputKind = "peso" | "hours" | "days"

export type PayslipFieldDefinition = {
  key: string
  label: string
  inputKind: PayslipFieldInputKind
  rateKey?: PayrollRateKey
}

export const PAY_DETAILS_FIELDS: PayslipFieldDefinition[] = [
  { key: "basicPay", label: "Basic Pay", inputKind: "peso" },
  { key: "absencesDays", label: "Absences (Days)", inputKind: "days" },
  { key: "tardiness", label: "Tardiness", inputKind: "peso" },
  { key: "undertime", label: "Undertime", inputKind: "peso" },
  { key: "nd", label: "ND", inputKind: "hours", rateKey: "nd" },
  { key: "regOt", label: "Reg OT", inputKind: "hours", rateKey: "regOt" },
  { key: "rdOt", label: "RD_OT", inputKind: "hours", rateKey: "rdOt" },
  { key: "rdOtOver8", label: "RD_OT>8", inputKind: "hours", rateKey: "rdOtOver8" },
  { key: "rdotNd", label: "RDOT ND", inputKind: "hours", rateKey: "rdotNd" },
  { key: "legal", label: "Legal", inputKind: "hours", rateKey: "legal" },
  { key: "legalOver8", label: "Legal>8", inputKind: "hours", rateKey: "legalOver8" },
  { key: "lglNd", label: "Lgl_ND", inputKind: "hours", rateKey: "lglNd" },
  { key: "special", label: "Special", inputKind: "hours", rateKey: "special" },
  { key: "spclOver8", label: "Spcl>8", inputKind: "hours", rateKey: "spclOver8" },
  { key: "spclNd", label: "Spcl_ND", inputKind: "hours", rateKey: "spclNd" },
  { key: "spclRd", label: "Spcl_RD", inputKind: "hours", rateKey: "spclRd" },
  { key: "spclRdOver8", label: "Spcl_RD >8", inputKind: "hours", rateKey: "spclRdOver8" },
  { key: "addback", label: "Addback", inputKind: "peso" },
  { key: "addbackRegOt", label: "Addback Reg OT", inputKind: "peso" },
  { key: "addbackRdOt", label: "Addback RD_OT", inputKind: "peso" },
  { key: "addbackRdOtOver8", label: "Addback RD_OT>8", inputKind: "peso" },
  { key: "projectAllowance", label: "Project Allowance", inputKind: "peso" },
  {
    key: "performanceIncentives",
    label: "Performance Incentives",
    inputKind: "peso",
  },
  { key: "signingBonus", label: "Signing Bonus", inputKind: "peso" },
  {
    key: "referralIncentives",
    label: "Referral Incentives",
    inputKind: "peso",
  },
  { key: "salaryAdjustment", label: "Salary Adjustment", inputKind: "peso" },
]

export const DEDUCTION_FIELDS: PayslipFieldDefinition[] = [
  { key: "tax", label: "Tax", inputKind: "peso" },
  { key: "sss", label: "SSS", inputKind: "peso" },
  { key: "sssMpf", label: "SSS MPF", inputKind: "peso" },
  { key: "hdmf", label: "HDMF", inputKind: "peso" },
  { key: "phic", label: "PHIC", inputKind: "peso" },
  { key: "sssLoan", label: "SSS Loan", inputKind: "peso" },
  { key: "sssCalamityLoan", label: "SSS Calamity Loan", inputKind: "peso" },
  { key: "pagIbigLoan", label: "Pag-IBIG Loan", inputKind: "peso" },
  { key: "cashAdvance", label: "Cash Advance", inputKind: "peso" },
  { key: "taxPayable", label: "Tax Payable", inputKind: "peso" },
]

export const NON_TAXABLE_FIELDS: PayslipFieldDefinition[] = [
  { key: "cloth", label: "Cloth", inputKind: "peso" },
  { key: "emplach", label: "Emplach", inputKind: "peso" },
  { key: "holrep", label: "Holrep", inputKind: "peso" },
  { key: "laundry", label: "Laundry", inputKind: "peso" },
  { key: "medasst", label: "Medasst", inputKind: "peso" },
  { key: "medcash", label: "Medcash", inputKind: "peso" },
  { key: "otmeal", label: "Otmeal", inputKind: "peso" },
  { key: "riceSubsidy", label: "Rice Subsidy", inputKind: "peso" },
  { key: "dmbAdj", label: "DMB Adj.", inputKind: "peso" },
  { key: "taxRefund", label: "Tax Refund", inputKind: "peso" },
]

export const ALL_PAYSLIP_FIELD_KEYS = [
  ...PAY_DETAILS_FIELDS,
  ...DEDUCTION_FIELDS,
  ...NON_TAXABLE_FIELDS,
].map((field) => field.key)
