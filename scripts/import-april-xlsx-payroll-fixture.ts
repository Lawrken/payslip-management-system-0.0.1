import "dotenv/config"

import bcrypt from "bcryptjs"
import { sql } from "drizzle-orm"
import XLSX from "xlsx"

import { closeDb, db } from "@/db"
import {
  employees,
  payrolls,
  payslipInputs,
  payslips,
  users,
} from "@/db/schema"
import type {
  Account,
  Department,
  EmployeeDivisor,
  EmployeeStatus,
  PositionTitle,
  Program,
} from "@/lib/employee-options"
import {
  calculatePayslipTotals,
  createEmptyPayslipInputs,
} from "@/lib/payroll-calculator"
import { seedUsers } from "@/lib/seed-users"
import { encryptInitialPassword } from "@/lib/users"
import type { PayrollDtrDay, PayslipPayrollInputs } from "@/lib/types"

const WORKBOOK_PATH =
  "/Users/jeiwinfrey/Downloads/CONFIDENTIAL - April 23, 2026 Payroll_for interns use.xlsx"
const PAYROLL_ID = "xlsx-fixture-2026-04-01-2026-04-15"
const PAYROLL_LABEL = "April 1-15, 2026"
const EXPECTED_DTR_DATES = [
  "2026-03-26",
  "2026-03-27",
  "2026-03-28",
  "2026-03-29",
  "2026-03-30",
  "2026-03-31",
  "2026-04-01",
  "2026-04-02",
  "2026-04-03",
  "2026-04-04",
  "2026-04-05",
  "2026-04-06",
  "2026-04-07",
  "2026-04-08",
  "2026-04-09",
  "2026-04-10",
]

type WorkbookEmployeeRow = {
  rowNumber: number
  employeeId: string
  employeeName: string
  sourceRow: unknown[]
}

function getSheet(workbook: XLSX.WorkBook, sheetName: string): XLSX.WorkSheet {
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) {
    throw new Error(`Missing worksheet: ${sheetName}`)
  }
  return sheet
}

function readSheetRows(sheet: XLSX.WorkSheet): unknown[][] {
  return XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: false,
  }) as unknown[][]
}

function textCell(row: unknown[], index: number): string {
  const value = row[index]
  if (value === null || value === undefined) {
    return ""
  }
  if (typeof value === "number" && Number.isInteger(value)) {
    return String(value)
  }
  return String(value).trim()
}

function numberCell(row: unknown[], index: number): number {
  const value = row[index]
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (typeof value !== "string") {
    return 0
  }
  const normalized = value.trim().replaceAll(",", "")
  if (!normalized || normalized === "-" || normalized === "#REF!") {
    return 0
  }
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeEmployeeId(value: string): string {
  return value.trim().replace(/\.0$/, "").toUpperCase()
}

function normalizeStatus(value: string): EmployeeStatus {
  if (value === "New Hire") {
    return "New Hire"
  }
  if (value === "Re-active") {
    return "Re-active"
  }
  return "Active"
}

function normalizeLabel(value: string): string {
  if (value === "Software Support / Development") {
    return "Software Support/Development"
  }
  if (value === "Jewerly Outreach") {
    return "Jewelry Outreach"
  }
  return value || "Admin Department"
}

function buildDtrDays(): PayrollDtrDay[] {
  return EXPECTED_DTR_DATES.map((date) => ({
    date,
    status: date === "2026-04-09" ? "legalHoliday" : "regular",
    holidayName: date === "2026-04-09" ? "Araw ng Kagitingan" : "",
  }))
}

function addCells(row: unknown[], indexes: number[]): number {
  return indexes.reduce((sum, index) => sum + numberCell(row, index), 0)
}

function buildPayslipInputs(row: unknown[]): PayslipPayrollInputs {
  return {
    ...createEmptyPayslipInputs(),
    basicPay: numberCell(row, 24),
    absencesDays: numberCell(row, 26),
    tardiness: numberCell(row, 29),
    undertime: numberCell(row, 31),
    nd: numberCell(row, 32),
    regOt: numberCell(row, 34),
    rdOt: numberCell(row, 36),
    rdOtOver8: numberCell(row, 38),
    rdotNd: numberCell(row, 40),
    legal: numberCell(row, 42),
    lglNd: numberCell(row, 44),
    legalOver8: numberCell(row, 46),
    special: numberCell(row, 52),
    spclNd: numberCell(row, 54),
    spclOver8: numberCell(row, 56),
    spclRd: numberCell(row, 58),
    spclRdOver8: numberCell(row, 60),
    addback: numberCell(row, 63),
    addbackRegOt: numberCell(row, 65),
    addbackRdOt: numberCell(row, 67),
    addbackRdOtOver8: numberCell(row, 69),
    salaryAdjustment: numberCell(row, 70),
    projectAllowance: numberCell(row, 71),
    signingBonus: numberCell(row, 72),
    performanceIncentives: numberCell(row, 73),
    cloth: addCells(row, [75, 76]),
    emplach: addCells(row, [77, 78]),
    holrep: addCells(row, [79, 80]),
    laundry: addCells(row, [81, 82]),
    medasst: addCells(row, [83, 84]),
    medcash: addCells(row, [85, 86]),
    otmeal: addCells(row, [87, 88]),
    riceSubsidy: addCells(row, [89, 90]),
    dmbAdj: numberCell(row, 91),
    tax: numberCell(row, 95),
    sss: numberCell(row, 96),
    sssMpf: numberCell(row, 99),
    hdmf: numberCell(row, 101),
    phic: numberCell(row, 103),
    sssLoan: numberCell(row, 105),
    sssCalamityLoan: numberCell(row, 106),
    pagIbigLoan: numberCell(row, 107),
    cashAdvance: numberCell(row, 108),
    taxPayable: numberCell(row, 109),
  }
}

function buildPayslipTotals(totals: ReturnType<typeof calculatePayslipTotals>) {
  return {
    taxableEarnings: totals.taxableEarnings,
    totalDeductions: totals.totalDeductions,
    nonTaxableEarnings: totals.nonTaxableEarnings,
    grossPay: totals.grossPay,
    netPay: totals.netPay,
  }
}

function diff(actual: number, expected: number): number {
  return Math.round((actual - expected) * 100) / 100
}

function getPayrollRows(rows: unknown[][]): WorkbookEmployeeRow[] {
  return rows
    .map((row, index) => ({ row, rowNumber: index + 1 }))
    .filter(({ rowNumber }) => rowNumber >= 5 && rowNumber <= 269)
    .filter(({ row }) => normalizeEmployeeId(textCell(row, 1)))
    .filter(({ row }) => numberCell(row, 24) > 0)
    .map(({ row, rowNumber }) => ({
      rowNumber,
      employeeId: normalizeEmployeeId(textCell(row, 1)),
      employeeName: textCell(row, 2),
      sourceRow: row,
    }))
}

async function resetDatabase() {
  await db.execute(
    sql`TRUNCATE audit_logs, payslip_inputs, payslips, employee_schedules, payrolls, employees, users CASCADE`
  )
  await db.insert(users).values(
    await Promise.all(
      seedUsers.map(async (user) => ({
        employeeId: user.employeeId,
        email: user.email,
        passwordHash: await bcrypt.hash(user.password, 10),
        initialPasswordCiphertext: encryptInitialPassword(user.password),
        passwordChangedAt: null,
        role: user.role,
      }))
    )
  )
}

function buildReportRow(employee: WorkbookEmployeeRow) {
  const row = employee.sourceRow
  const divisor = numberCell(row, 7)
  const inputs = buildPayslipInputs(row)
  const calculation = calculatePayslipTotals(inputs, divisor)
  const totals = buildPayslipTotals(calculation)
  const expectedNetPay = numberCell(row, 111)
  const expectedHqCollection = numberCell(row, 112)
  const expectedEmployerContributions = addCells(row, [97, 98, 100, 102, 104])
  const appHqCollection = diff(
    totals.grossPay + expectedEmployerContributions,
    0
  )

  return {
    employeeId: employee.employeeId,
    employeeName: employee.employeeName,
    rowNumber: employee.rowNumber,
    expectedNetPay,
    appNetPay: totals.netPay,
    netPayVariance: diff(totals.netPay, expectedNetPay),
    expectedTaxableEarnings: numberCell(row, 74),
    appTaxableEarnings: totals.taxableEarnings,
    taxableVariance: diff(totals.taxableEarnings, numberCell(row, 74)),
    expectedNonTaxableEarnings: numberCell(row, 92),
    appNonTaxableEarnings: totals.nonTaxableEarnings,
    nonTaxableVariance: diff(totals.nonTaxableEarnings, numberCell(row, 92)),
    expectedGrossPay: numberCell(row, 93),
    appGrossPay: totals.grossPay,
    grossPayVariance: diff(totals.grossPay, numberCell(row, 93)),
    expectedNetTaxableIncome: numberCell(row, 94),
    expectedTotalDeductions: numberCell(row, 110),
    appTotalDeductions: totals.totalDeductions,
    deductionsVariance: diff(totals.totalDeductions, numberCell(row, 110)),
    expectedEmployerSss: numberCell(row, 97),
    expectedEcc: numberCell(row, 98),
    expectedEmployerMpf: numberCell(row, 100),
    expectedEmployerPagIbig: numberCell(row, 102),
    expectedEmployerPhic: numberCell(row, 104),
    expectedHqCollection,
    appHqCollection,
    hqCollectionVariance: diff(appHqCollection, expectedHqCollection),
    expectedEmployeePayout: numberCell(row, 113),
    appEmployeePayout: totals.netPay,
    employeePayoutVariance: diff(totals.netPay, numberCell(row, 113)),
  }
}

async function main() {
  const workbook = XLSX.readFile(WORKBOOK_PATH, {
    cellDates: false,
    cellFormula: true,
    cellNF: false,
    cellStyles: false,
  })
  const sheet = getSheet(workbook, "PAYROLL SUMMARY")
  const rows = readSheetRows(sheet)
  const payrollRows = getPayrollRows(rows)

  await resetDatabase()

  await db.transaction(async (tx) => {
    await tx.insert(employees).values(
      payrollRows.map((employee) => {
        const row = employee.sourceRow
        return {
          id: crypto.randomUUID(),
          name: employee.employeeName,
          employeeId: employee.employeeId,
          email: `${employee.employeeId.toLowerCase()}@helport.local`,
          employeeStatus: normalizeStatus(textCell(row, 0)),
          positionTitle: normalizeLabel(textCell(row, 3)) as PositionTitle,
          department: normalizeLabel(textCell(row, 4)) as Department,
          program: normalizeLabel(textCell(row, 5)) as Program,
          account: normalizeLabel(textCell(row, 5)) as Account,
          divisor: numberCell(row, 7) as EmployeeDivisor,
          basicPay: numberCell(row, 24),
          tin: "",
          sssNo: "",
          phicNo: "",
          hdmfNo: "",
          updatedAt: new Date(),
        }
      })
    )

    await tx.insert(payrolls).values({
      id: PAYROLL_ID,
      payrollPeriodLabel: PAYROLL_LABEL,
      payrollPeriodStart: "2026-04-01",
      payrollPeriodEnd: "2026-04-15",
      dtrCutOffStart: "2026-03-26",
      dtrCutOffEnd: "2026-04-10",
      dtrDays: buildDtrDays(),
      payoutDate: "2026-04-23",
      updatedAt: new Date(),
    })

    const payslipRows = payrollRows.map((employee) => ({
      id: crypto.randomUUID(),
      payrollId: PAYROLL_ID,
      employeeId: employee.employeeId,
      status: "pending" as const,
      updatedAt: new Date(),
    }))
    await tx.insert(payslips).values(payslipRows)
    await tx.insert(payslipInputs).values(
      payslipRows.map((payslip, index) => {
        const sourceRow = payrollRows[index].sourceRow
        const inputs = buildPayslipInputs(sourceRow)
        const totals = calculatePayslipTotals(inputs, numberCell(sourceRow, 7))
        return {
          payslipId: payslip.id,
          inputs,
          totals: buildPayslipTotals(totals),
          updatedAt: new Date(),
        }
      })
    )
  })

  const reportRows = payrollRows
    .map(buildReportRow)
    .sort((a, b) => Math.abs(b.netPayVariance) - Math.abs(a.netPayVariance))

  const exactMatches = reportRows.filter(
    (row) => row.netPayVariance === 0
  ).length
  const nearMatches = reportRows.filter(
    (row) => Math.abs(row.netPayVariance) <= 0.01
  ).length
  const roundingMatches = reportRows.filter(
    (row) => Math.abs(row.netPayVariance) <= 0.15
  ).length

  console.log("April XLSX payroll fixture imported.")
  console.log(`Payroll rows processed: ${payrollRows.length}`)
  console.log(`Exact net-pay matches: ${exactMatches}`)
  console.log(`Near net-pay matches (+/- 0.01): ${nearMatches}`)
  console.log(`Rounding-tolerance matches (+/- 0.15): ${roundingMatches}`)
  console.log("Top 10 net-pay variances:")
  for (const row of reportRows.slice(0, 10)) {
    console.log(
      `${row.employeeId} ${row.employeeName}: workbook ${row.expectedNetPay}, app ${row.appNetPay}, variance ${row.netPayVariance}`
    )
  }
}

main()
  .then(() => closeDb())
  .catch((error) => {
    console.error(error)
    closeDb().finally(() => process.exit(1))
  })
