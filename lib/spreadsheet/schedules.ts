import { formatLongDisplayDate } from "@/lib/payroll-dates"
import { mergeScheduleDays } from "@/lib/schedule-days"
import {
  isValidTimeValue,
  normalizeTimeValue,
  parseDisplayTime,
} from "@/lib/schedule-time"
import type { SpreadsheetRow } from "@/lib/spreadsheet/types"
import type {
  EmployeeSchedule,
  EmployeeScheduleDay,
  Payroll,
  Payslip,
} from "@/lib/types"

export type ScheduleSpreadsheetRow = SpreadsheetRow & {
  payrollId: string
  employeeId: string
  employeeName: string
  date: string
  shiftType: string
  shiftIn: string
  shiftOut: string
  logIn: string
  logOut: string
  holidayLocked: boolean
}

const SCHEDULE_TIME_FIELDS = [
  "shiftIn",
  "shiftOut",
  "logIn",
  "logOut",
] as const satisfies readonly (keyof Pick<
  ScheduleSpreadsheetRow,
  "shiftIn" | "shiftOut" | "logIn" | "logOut"
>)[]

export function parseScheduleSpreadsheetTime(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return ""
  }

  const fromDisplay = parseDisplayTime(trimmed)
  if (fromDisplay) {
    return fromDisplay
  }

  const normalized = normalizeTimeValue(trimmed)
  if (isValidTimeValue(normalized)) {
    return normalized
  }

  return null
}

export function resolveScheduleErrorRowId(
  employeeId: string,
  days: EmployeeScheduleDay[],
  error: string
): string {
  for (const day of days) {
    if (error.includes(formatLongDisplayDate(day.date))) {
      return `${employeeId}:${day.date}`
    }
  }

  return employeeId
}

export function scheduleDayToSpreadsheetRow(input: {
  payrollId: string
  employeeId: string
  employeeName: string
  day: EmployeeScheduleDay
  holidayLocked: boolean
}): ScheduleSpreadsheetRow {
  return {
    rowId: `${input.employeeId}:${input.day.date}`,
    payrollId: input.payrollId,
    employeeId: input.employeeId,
    employeeName: input.employeeName,
    date: input.day.date,
    shiftType: input.day.shiftType,
    shiftIn: input.day.shiftIn,
    shiftOut: input.day.shiftOut,
    logIn: input.day.logIn,
    logOut: input.day.logOut,
    holidayLocked: input.holidayLocked,
  }
}

export function buildScheduleSpreadsheetRows(input: {
  payroll: Payroll
  payslips: Payslip[]
  schedules: EmployeeSchedule[]
}): ScheduleSpreadsheetRow[] {
  const scheduleByEmployeeId = new Map(
    input.schedules.map((schedule) => [schedule.employeeId, schedule])
  )

  const rows: ScheduleSpreadsheetRow[] = []

  for (const payslip of input.payslips) {
    const existingSchedule = scheduleByEmployeeId.get(payslip.employeeId)
    const days = mergeScheduleDays(input.payroll, existingSchedule?.days)

    for (const day of days) {
      const holidayLocked =
        day.shiftType === "specialHoliday" || day.shiftType === "legalHoliday"

      rows.push(
        scheduleDayToSpreadsheetRow({
          payrollId: input.payroll.id,
          employeeId: payslip.employeeId,
          employeeName: payslip.employeeName,
          day,
          holidayLocked,
        })
      )
    }
  }

  return rows.sort((left, right) => {
    const nameCompare = left.employeeName.localeCompare(right.employeeName)
    if (nameCompare !== 0) {
      return nameCompare
    }
    return left.date.localeCompare(right.date)
  })
}

export function groupScheduleRowsByEmployee(
  rows: ScheduleSpreadsheetRow[]
): Map<string, ScheduleSpreadsheetRow[]> {
  const grouped = new Map<string, ScheduleSpreadsheetRow[]>()

  for (const row of rows) {
    const existing = grouped.get(row.employeeId) ?? []
    existing.push(row)
    grouped.set(row.employeeId, existing)
  }

  return grouped
}

export function scheduleRowsToDays(
  rows: ScheduleSpreadsheetRow[]
): EmployeeScheduleDay[] | { error: string; rowId: string } {
  const sortedRows = rows
    .slice()
    .sort((left, right) => left.date.localeCompare(right.date))

  const days: EmployeeScheduleDay[] = []

  for (const row of sortedRows) {
    const parsedTimes: Record<(typeof SCHEDULE_TIME_FIELDS)[number], string> = {
      shiftIn: "",
      shiftOut: "",
      logIn: "",
      logOut: "",
    }

    for (const field of SCHEDULE_TIME_FIELDS) {
      const rawValue = String(row[field] ?? "")
      if (!rawValue.trim()) {
        continue
      }

      const parsed = parseScheduleSpreadsheetTime(rawValue)
      if (parsed === null) {
        const label = field.replace(/([A-Z])/g, " $1").trim()
        return {
          error: `Invalid ${label} on ${row.date}. Use 24-hour format (09:30) or 9:30 AM.`,
          rowId: row.rowId,
        }
      }

      parsedTimes[field] = parsed
    }

    days.push({
      date: row.date,
      shiftType: row.shiftType as EmployeeScheduleDay["shiftType"],
      shiftIn: parsedTimes.shiftIn,
      shiftOut: parsedTimes.shiftOut,
      logIn: parsedTimes.logIn,
      logOut: parsedTimes.logOut,
    })
  }

  return days
}
