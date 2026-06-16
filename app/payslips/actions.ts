"use server"

import { requireEmployeeSession } from "@/lib/authorization"
import { getVisibleEmployeePayslipDetailsByEmployeeAndId } from "@/lib/payslips"

export async function getEmployeePayslipDetailAction(payslipId: string) {
  const session = await requireEmployeeSession()
  if ("error" in session) {
    return session
  }

  const payslip = await getVisibleEmployeePayslipDetailsByEmployeeAndId(
    session.employeeId,
    payslipId
  )
  if (!payslip) {
    return { error: "Payslip not found." }
  }

  return { payslip }
}
