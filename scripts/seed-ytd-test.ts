import { config } from "dotenv"

config()
config({ path: ".env.local", override: true })

import { ilike } from "drizzle-orm"

import { closeDb, db } from "@/db"
import {
  employees as employeesTable,
  payrolls,
  payslipInputs,
  payslips,
} from "@/db/schema"
import { normalizeEmployeeId } from "@/lib/auth-helpers"
import type { EmployeeDivisor } from "@/lib/employee-options"
import { formatPayrollPeriodLabel } from "@/lib/payroll-dates"
import {
  applyNonTaxableAttendanceAdjustments,
  calculatePayslipTotals,
  createEmptyPayslipInputs,
} from "@/lib/payroll-calculator"
import type { PayslipPayrollInputs } from "@/lib/types"
import { addEmployee } from "@/lib/employees"
import { createUserAccount } from "@/lib/users"

const TARGET_NAME = "France Larkien"
const DIVISOR: EmployeeDivisor = 261

type PeriodSpec = {
  start: string
  end: string
  payout: string
  overrides: Partial<PayslipPayrollInputs>
}

function buildYearPeriods(year: number): PeriodSpec[] {
  return [
    {
      start: `${year}-01-01`,
      end: `${year}-01-15`,
      payout: `${year}-01-20`,
      overrides: { regOt: 4, nd: 6, performanceIncentives: 0 },
    },
    {
      start: `${year}-01-16`,
      end: `${year}-01-31`,
      payout: `${year}-02-05`,
      overrides: { regOt: 0, absencesDays: 1, tardiness: 250 },
    },
    {
      start: `${year}-02-01`,
      end: `${year}-02-15`,
      payout: `${year}-02-20`,
      overrides: { regOt: 8, nd: 4 },
    },
    {
      start: `${year}-02-16`,
      end: `${year}-02-28`,
      payout: `${year}-03-05`,
      overrides: { regOt: 2, undertime: 180, performanceIncentives: 3000 },
    },
    {
      start: `${year}-03-01`,
      end: `${year}-03-15`,
      payout: `${year}-03-20`,
      overrides: { regOt: 6, nd: 2 },
    },
    {
      start: `${year}-03-16`,
      end: `${year}-03-31`,
      payout: `${year}-04-05`,
      overrides: { regOt: 0, absencesDays: 1, signingBonus: 0 },
    },
  ]
}

function buildInputs(overrides: Partial<PayslipPayrollInputs>) {
  const base: PayslipPayrollInputs = {
    ...createEmptyPayslipInputs(),
    basicPay: 18000,
    tax: 1500,
    sss: 900,
    sssMpf: 100,
    phic: 450,
    hdmf: 100,
    riceSubsidy: 1000,
    laundry: 150,
    ...overrides,
  }

  return applyNonTaxableAttendanceAdjustments(base, DIVISOR)
}

async function resolveEmployee() {
  const existing = await db.query.employees.findFirst({
    where: ilike(employeesTable.name, TARGET_NAME),
  })
  if (existing) {
    console.log(
      `Found existing employee "${existing.name}" (${existing.employeeId}).`
    )
    return existing
  }

  const employeeId = normalizeEmployeeId("FL-0001")
  const email = "france.larkien@helport.local"
  const created = await addEmployee({
    name: TARGET_NAME,
    employeeId,
    email,
    employeeStatus: "Active",
    positionTitle: "Software Support Specialist",
    department: "Software Support/Development",
    program: "Software Support/Development",
    account: "Software Support/Development",
    divisor: DIVISOR,
    basicPay: 36000,
    tin: "123-456-789-000",
    sssNo: "34-1234567-8",
    phicNo: "12-345678901-2",
    hdmfNo: "1234-5678-9012",
  })

  if ("error" in created) {
    throw new Error(`Failed to create employee: ${created.error}`)
  }

  console.log(`Created employee "${created.name}" (${created.employeeId}).`)

  const account = await createUserAccount({
    employeeId: created.employeeId,
    email,
    role: "employee",
  })
  if ("error" in account) {
    console.warn(`Could not create login: ${account.error}`)
  } else {
    console.log(
      `Created employee login: ${email} / ${account.initialPassword}`
    )
  }

  return created
}

async function main() {
  const employee = await resolveEmployee()
  const years = [2025, 2026]
  let payrollCount = 0
  let payslipCount = 0

  for (const year of years) {
    const periods = buildYearPeriods(year)
    for (let index = 0; index < periods.length; index += 1) {
      const period = periods[index]
      const payrollId = `seed-ytd-${year}-${String(index + 1).padStart(2, "0")}`
      const payslipId = `${payrollId}-${employee.employeeId}`

      await db
        .insert(payrolls)
        .values({
          id: payrollId,
          payrollPeriodLabel: formatPayrollPeriodLabel(
            period.start,
            period.end
          ),
          payrollPeriodStart: period.start,
          payrollPeriodEnd: period.end,
          dtrCutOffStart: period.start,
          dtrCutOffEnd: period.end,
          dtrDays: [],
          payoutDate: period.payout,
          updatedAt: new Date(),
        })
        .onConflictDoNothing()
      payrollCount += 1

      const inputs = buildInputs(period.overrides)
      const totals = calculatePayslipTotals(inputs, DIVISOR)

      await db
        .insert(payslips)
        .values({
          id: payslipId,
          payrollId,
          employeeId: employee.employeeId,
          status: "sent",
          updatedAt: new Date(),
        })
        .onConflictDoNothing()

      await db
        .insert(payslipInputs)
        .values({
          payslipId,
          inputs,
          totals: {
            taxableEarnings: totals.taxableEarnings,
            totalDeductions: totals.totalDeductions,
            nonTaxableEarnings: totals.nonTaxableEarnings,
            grossPay: totals.grossPay,
            netPay: totals.netPay,
          },
          updatedAt: new Date(),
        })
        .onConflictDoNothing()
      payslipCount += 1

      console.log(
        `  ${year} ${formatPayrollPeriodLabel(period.start, period.end)} → net ₱${totals.netPay.toLocaleString("en-PH")}`
      )
    }
  }

  console.log(
    `Done. Upserted ${payrollCount} payrolls and ${payslipCount} payslips for "${employee.name}".`
  )
}

main()
  .then(() => closeDb())
  .catch((error) => {
    console.error(error)
    closeDb().finally(() => process.exit(1))
  })
