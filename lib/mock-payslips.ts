import {
  calculatePayslipTotals,
  createEmptyPayslipInputs,
} from "@/lib/payroll-calculator"
import { seedEmployees } from "@/lib/mock-employees"
import type { Payslip } from "@/lib/types"

function createSeedInputs(index: number) {
  const basicPay = 26000 + (index % 10) * 1800
  const inputs = {
    ...createEmptyPayslipInputs(),
    basicPay,
    regOt: index % 5,
    rdOt: index % 4 === 0 ? 2 : 0,
    nd: index % 6 === 0 ? 1.5 : 0,
    absencesDays: index % 17 === 0 ? 1 : 0,
    tardiness: index % 7 === 0 ? 120 : 0,
    projectAllowance: index % 3 === 0 ? 1500 : 0,
    performanceIncentives: index % 4 === 0 ? 2500 : 0,
    tax: basicPay >= 35000 ? 1800 + (index % 6) * 250 : 900,
    sss: 1200 + (index % 5) * 100,
    phic: 450 + (index % 4) * 50,
    hdmf: 200,
    riceSubsidy: 1500,
    laundry: index % 2 === 0 ? 300 : 0,
    otmeal: index % 5 === 0 ? 250 : 0,
  }

  return inputs
}

const mariaInputs = {
  ...createEmptyPayslipInputs(),
  basicPay: 30000,
  sss: 1350,
  phic: 450,
  hdmf: 200,
}

export const seedPayslips: Payslip[] = seedEmployees.map((employee, index) => {
  const inputs =
    employee.employeeId === "1002" ? mariaInputs : createSeedInputs(index)

  return {
    id: `payslip-${index + 1}`,
    payrollId: "payroll-may-2026",
    employeeId: employee.employeeId,
    employeeName: employee.name,
    status: index % 3 === 1 ? "pending" : "sent",
    inputs,
    totals: calculatePayslipTotals(inputs),
  }
})
