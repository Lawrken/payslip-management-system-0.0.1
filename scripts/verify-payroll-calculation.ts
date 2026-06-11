import "dotenv/config"

import assert from "node:assert/strict"

import { eq, inArray } from "drizzle-orm"

import { closeDb, db } from "@/db"
import {
  employees,
  employeeSchedules,
  payrolls,
  payslipInputs,
  payslips,
} from "@/db/schema"
import {
  calculatePayslipTotals,
  createPayslipInputsWithBasicPay,
} from "@/lib/payroll-calculator"
import { refreshPayslipFromSchedule } from "@/lib/payslips"
import type {
  Employee,
  EmployeeScheduleDay,
  Payroll,
  PayslipPayrollInputs,
} from "@/lib/types"

const PAYROLL_ID = "verify-payroll-night-differential"
const EMPLOYEE_ID = "990001"
const CONTROL_EMPLOYEE_ID = "990002"
const PAYSLIP_ID = "verify-payslip-night-differential"
const CONTROL_PAYSLIP_ID = "verify-payslip-control"
const SCHEDULE_ID = "verify-schedule-night-differential"

const verificationEmployee: Employee = {
  id: "verify-employee-night-differential",
  name: "Verification Night Differential",
  employeeId: EMPLOYEE_ID,
  email: "verify-night-differential@helport.local",
  employeeStatus: "Active",
  positionTitle: "Admin Assistant",
  department: "Human Resource",
  program: "Human Resource",
  account: "Human Resource",
  divisor: 261,
  basicPay: 23000,
  tin: "000000000",
  sssNo: "0000000000",
  phicNo: "000000000000",
  hdmfNo: "000000000000",
}

const controlEmployee: Employee = {
  ...verificationEmployee,
  id: "verify-employee-control",
  name: "Verification Control Employee",
  employeeId: CONTROL_EMPLOYEE_ID,
  email: "verify-control@helport.local",
  divisor: 313,
}

const verificationPayroll: Payroll = {
  id: PAYROLL_ID,
  payrollPeriodLabel: "Verification June 1-5, 2026",
  payrollPeriodStart: "2026-06-01",
  payrollPeriodEnd: "2026-06-05",
  dtrCutOffStart: "2026-06-01",
  dtrCutOffEnd: "2026-06-05",
  payoutDate: "2026-06-10",
  dtrDays: [
    { date: "2026-06-01", status: "regular", holidayName: "" },
    { date: "2026-06-02", status: "regular", holidayName: "" },
    { date: "2026-06-03", status: "regular", holidayName: "" },
    {
      date: "2026-06-04",
      status: "legalHoliday",
      holidayName: "Verification Legal Holiday",
    },
    {
      date: "2026-06-05",
      status: "specialHoliday",
      holidayName: "Verification Special Holiday",
    },
  ],
}

const verificationScheduleDays: EmployeeScheduleDay[] = [
  {
    date: "2026-06-01",
    shiftType: "scheduledShift",
    shiftIn: "21:00",
    shiftOut: "06:00",
    logIn: "21:30",
    logOut: "06:30",
  },
  {
    date: "2026-06-02",
    shiftType: "scheduledShift",
    shiftIn: "08:00",
    shiftOut: "17:00",
    logIn: "",
    logOut: "",
  },
  {
    date: "2026-06-03",
    shiftType: "scheduledShift",
    shiftIn: "08:00",
    shiftOut: "17:00",
    logIn: "08:00",
    logOut: "17:29",
  },
  {
    date: "2026-06-04",
    shiftType: "legalHoliday",
    shiftIn: "22:00",
    shiftOut: "06:00",
    logIn: "22:00",
    logOut: "07:00",
  },
  {
    date: "2026-06-05",
    shiftType: "specialHoliday",
    shiftIn: "",
    shiftOut: "",
    logIn: "23:00",
    logOut: "02:00",
  },
]

function buildInitialInputs(employee: Employee): PayslipPayrollInputs {
  return {
    ...createPayslipInputsWithBasicPay(employee.basicPay),
    tax: 100,
    riceSubsidy: 75,
  }
}

async function insertVerificationData() {
  await db.transaction(async (tx) => {
    await tx.delete(payrolls).where(eq(payrolls.id, PAYROLL_ID))
    await tx
      .delete(employees)
      .where(inArray(employees.employeeId, [EMPLOYEE_ID, CONTROL_EMPLOYEE_ID]))

    await tx.insert(employees).values([
      { ...verificationEmployee, updatedAt: new Date() },
      { ...controlEmployee, updatedAt: new Date() },
    ])
    await tx.insert(payrolls).values({
      ...verificationPayroll,
      updatedAt: new Date(),
    })
    await tx.insert(payslips).values([
      {
        id: PAYSLIP_ID,
        payrollId: PAYROLL_ID,
        employeeId: EMPLOYEE_ID,
        status: "draft",
        updatedAt: new Date(),
      },
      {
        id: CONTROL_PAYSLIP_ID,
        payrollId: PAYROLL_ID,
        employeeId: CONTROL_EMPLOYEE_ID,
        status: "draft",
        updatedAt: new Date(),
      },
    ])

    const inputs = buildInitialInputs(verificationEmployee)
    const controlInputs = buildInitialInputs(controlEmployee)
    await tx.insert(payslipInputs).values([
      {
        payslipId: PAYSLIP_ID,
        inputs,
        totals: calculatePayslipTotals(inputs, verificationEmployee.divisor),
        updatedAt: new Date(),
      },
      {
        payslipId: CONTROL_PAYSLIP_ID,
        inputs: controlInputs,
        totals: calculatePayslipTotals(controlInputs, controlEmployee.divisor),
        updatedAt: new Date(),
      },
    ])
    await tx.insert(employeeSchedules).values({
      id: SCHEDULE_ID,
      payrollId: PAYROLL_ID,
      employeeId: EMPLOYEE_ID,
      days: verificationScheduleDays,
      updatedAt: new Date(),
    })

    const refreshed = await refreshPayslipFromSchedule(
      PAYROLL_ID,
      EMPLOYEE_ID,
      tx
    )
    if ("error" in refreshed) {
      throw new Error(refreshed.error)
    }
  })
}

async function assertVerificationData() {
  const payslip = await db.query.payslipInputs.findFirst({
    where: eq(payslipInputs.payslipId, PAYSLIP_ID),
  })
  const controlPayslip = await db.query.payslipInputs.findFirst({
    where: eq(payslipInputs.payslipId, CONTROL_PAYSLIP_ID),
  })

  assert.ok(payslip, "Verification payslip inputs should exist.")
  assert.ok(controlPayslip, "Control payslip inputs should exist.")

  assert.equal(payslip.inputs.basicPay, 23000)
  assert.equal(payslip.inputs.absencesDays, 1)
  assert.equal(payslip.inputs.tardiness, 132.3)
  assert.equal(payslip.inputs.undertime, 0)
  assert.equal(payslip.inputs.regOt, 0.5)
  assert.equal(payslip.inputs.nd, 8)
  assert.equal(payslip.inputs.legal, 8)
  assert.equal(payslip.inputs.legalOver8, 1)
  assert.equal(payslip.inputs.lglNd, 8)
  assert.equal(payslip.inputs.special, 3)
  assert.equal(payslip.inputs.spclOver8, 0)
  assert.equal(payslip.inputs.spclNd, 3)
  assert.equal(payslip.inputs.tax, 100)
  assert.equal(payslip.inputs.riceSubsidy, 75)

  const lineAmounts = calculatePayslipTotals(
    payslip.inputs,
    verificationEmployee.divisor
  ).lineAmounts
  assert.equal(lineAmounts.absencesDays, -2114.94)
  assert.equal(lineAmounts.tardiness, -132.3)
  assert.equal(lineAmounts.nd, 264.37)
  assert.equal(lineAmounts.regOt, 165.23)
  assert.equal(lineAmounts.legal, 2114.96)
  assert.equal(lineAmounts.legalOver8, 687.36)
  assert.equal(lineAmounts.lglNd, 422.99)
  assert.equal(lineAmounts.special, 237.93)
  assert.equal(lineAmounts.spclNd, 103.1)

  assert.equal(payslip.totals.totalDeductions, 100)
  assert.equal(payslip.totals.nonTaxableEarnings, 75)
  assert.equal(payslip.totals.netPay, 24723.7)

  assert.equal(controlPayslip.inputs.basicPay, 23000)
  assert.equal(controlPayslip.inputs.absencesDays, 0)
  assert.equal(controlPayslip.inputs.nd, 0)
  assert.equal(controlPayslip.inputs.tax, 100)
  assert.equal(controlPayslip.inputs.riceSubsidy, 75)
}

async function main() {
  await insertVerificationData()
  await assertVerificationData()
  console.log("Payroll verification data created and assertions passed.")
  console.log(`Payroll ID: ${PAYROLL_ID}`)
  console.log(`Employee ID: ${EMPLOYEE_ID}`)
}

main()
  .then(() => closeDb())
  .catch((error) => {
    console.error(error)
    closeDb().finally(() => process.exit(1))
  })
