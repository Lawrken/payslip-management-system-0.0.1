import { isHolidayStatus, resolveDtrDays } from "@/lib/dtr-days"
import { enumerateIsoDates, formatLongDisplayDate } from "@/lib/payroll-dates"
import { isValidTimeValue, normalizeTimeValue } from "@/lib/schedule-time"
import type {
  DtrDayStatus,
  EmployeeScheduleDay,
  Payroll,
  ShiftType,
} from "@/lib/types"

export const SHIFT_TYPE_OPTIONS: { value: ShiftType; label: string }[] = [
  { value: "scheduledShift", label: "Scheduled Shift" },
  { value: "vacationLeave", label: "Vacation Leave" },
  { value: "sickLeave", label: "Sick Leave" },
  { value: "restDay", label: "Rest Day" },
  { value: "float", label: "Float" },
  { value: "notYetHired", label: "Not Yet Hired" },
  { value: "vacationLeaveWithoutPay", label: "Vacation Leave w/o Pay" },
  { value: "specialHoliday", label: "Special Holiday" },
  { value: "legalHoliday", label: "Legal Holiday" },
]

export const MANUAL_SHIFT_TYPE_OPTIONS = SHIFT_TYPE_OPTIONS.filter(
  (option) => !isHolidayShiftType(option.value)
)

const VALID_SHIFT_TYPES = new Set<ShiftType>(
  SHIFT_TYPE_OPTIONS.map((option) => option.value)
)

const EMPTY_SCHEDULE_DAY_TIMES = {
  shiftIn: "",
  shiftOut: "",
  logIn: "",
  logOut: "",
} as const

function isValidShiftType(value: string): value is ShiftType {
  return VALID_SHIFT_TYPES.has(value as ShiftType)
}

export function isHolidayShiftType(shiftType: ShiftType | ""): boolean {
  return shiftType === "specialHoliday" || shiftType === "legalHoliday"
}

export function isTimesRequired(shiftType: ShiftType | ""): boolean {
  return shiftType === "scheduledShift"
}

function dtrStatusToShiftType(status: DtrDayStatus): ShiftType | null {
  if (status === "specialHoliday") {
    return "specialHoliday"
  }
  if (status === "legalHoliday") {
    return "legalHoliday"
  }
  return null
}

function getPayrollDtrDayMap(payroll: Payroll) {
  return new Map(resolveDtrDays(payroll).map((day) => [day.date, day]))
}

function normalizeScheduleDay(
  day: Partial<EmployeeScheduleDay> & { date: string },
  payroll: Payroll
): EmployeeScheduleDay {
  const payrollDay = getPayrollDtrDayMap(payroll).get(day.date)
  const holidayShiftType = payrollDay
    ? dtrStatusToShiftType(payrollDay.status)
    : null

  if (holidayShiftType) {
    return {
      date: day.date,
      shiftType: holidayShiftType,
      ...EMPTY_SCHEDULE_DAY_TIMES,
    }
  }

  const shiftType: ShiftType | "" = isValidShiftType(String(day.shiftType ?? ""))
    ? (day.shiftType as ShiftType)
    : ""

  const times = isTimesRequired(shiftType)
    ? {
        shiftIn: normalizeTimeValue(String(day.shiftIn ?? "")),
        shiftOut: normalizeTimeValue(String(day.shiftOut ?? "")),
        logIn: normalizeTimeValue(String(day.logIn ?? "")),
        logOut: normalizeTimeValue(String(day.logOut ?? "")),
      }
    : { ...EMPTY_SCHEDULE_DAY_TIMES }

  return {
    date: day.date,
    shiftType,
    ...times,
  }
}

export function mergeScheduleDays(
  payroll: Payroll,
  existing?: EmployeeScheduleDay[]
): EmployeeScheduleDay[] {
  const dayByDate = new Map((existing ?? []).map((day) => [day.date, day]))

  return enumerateIsoDates(payroll.dtrCutOffStart, payroll.dtrCutOffEnd).map(
    (date) => normalizeScheduleDay(dayByDate.get(date) ?? { date }, payroll)
  )
}

export function getHolidayNameForDate(
  payroll: Payroll,
  date: string
): string | null {
  const payrollDay = getPayrollDtrDayMap(payroll).get(date)
  if (!payrollDay || !isHolidayStatus(payrollDay.status)) {
    return null
  }
  return payrollDay.holidayName.trim() || null
}

export function isScheduleDayHolidayLocked(
  payroll: Payroll,
  date: string
): boolean {
  const payrollDay = getPayrollDtrDayMap(payroll).get(date)
  return payrollDay ? isHolidayStatus(payrollDay.status) : false
}

export function parseScheduleDaysFromFormData(
  formData: FormData
): EmployeeScheduleDay[] | { error: string } {
  const raw = String(formData.get("days") ?? "").trim()
  if (!raw) {
    return { error: "Schedule days are required." }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { error: "Invalid schedule days." }
  }

  if (!Array.isArray(parsed)) {
    return { error: "Invalid schedule days." }
  }

  const days: EmployeeScheduleDay[] = []
  for (const item of parsed) {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof (item as EmployeeScheduleDay).date !== "string"
    ) {
      return { error: "Invalid schedule days." }
    }

    const row = item as Partial<EmployeeScheduleDay> & { date: string }
    if (!isValidShiftType(String(row.shiftType ?? ""))) {
      return { error: "Invalid shift type." }
    }

    days.push({
      date: row.date,
      shiftType: row.shiftType as ShiftType,
      shiftIn: normalizeTimeValue(String(row.shiftIn ?? "")),
      shiftOut: normalizeTimeValue(String(row.shiftOut ?? "")),
      logIn: normalizeTimeValue(String(row.logIn ?? "")),
      logOut: normalizeTimeValue(String(row.logOut ?? "")),
    })
  }

  return days
}

export function validateScheduleDays(
  payroll: Payroll,
  days: EmployeeScheduleDay[]
): { error: string } | null {
  const expectedDates = enumerateIsoDates(
    payroll.dtrCutOffStart,
    payroll.dtrCutOffEnd
  )
  if (expectedDates.length === 0) {
    return { error: "Invalid DTR cut-off date range." }
  }

  if (days.length !== expectedDates.length) {
    return {
      error: "Schedule must include every date in the DTR cut-off range.",
    }
  }

  const dtrDayMap = getPayrollDtrDayMap(payroll)
  const dayByDate = new Map(days.map((day) => [day.date, day]))

  for (const date of expectedDates) {
    const day = dayByDate.get(date)
    if (!day || !isValidShiftType(day.shiftType)) {
      return {
        error: `Shift type is required for ${formatLongDisplayDate(date)}.`,
      }
    }

    const payrollDay = dtrDayMap.get(date)
    const expectedHolidayShift = payrollDay
      ? dtrStatusToShiftType(payrollDay.status)
      : null

    if (expectedHolidayShift) {
      if (day.shiftType !== expectedHolidayShift) {
        return {
          error: `Holiday shift type must match payroll for ${formatLongDisplayDate(date)}.`,
        }
      }
      if (
        day.shiftIn ||
        day.shiftOut ||
        day.logIn ||
        day.logOut
      ) {
        return {
          error: `Time fields must be empty for holidays (${formatLongDisplayDate(date)}).`,
        }
      }
      continue
    }

    if (isHolidayShiftType(day.shiftType)) {
      return {
        error: `Holiday shift types are only allowed on payroll holiday dates (${formatLongDisplayDate(date)}).`,
      }
    }

    if (isTimesRequired(day.shiftType)) {
      for (const field of ["shiftIn", "shiftOut", "logIn", "logOut"] as const) {
        if (!isValidTimeValue(day[field])) {
          return {
            error: `All time fields are required for scheduled shifts on ${formatLongDisplayDate(date)}.`,
          }
        }
      }
    } else if (
      day.shiftIn ||
      day.shiftOut ||
      day.logIn ||
      day.logOut
    ) {
      return {
        error: `Time fields must be empty when shift type is not Scheduled Shift (${formatLongDisplayDate(date)}).`,
      }
    }
  }

  return null
}

export function isScheduleComplete(
  payroll: Payroll,
  days: EmployeeScheduleDay[]
): boolean {
  return validateScheduleDays(payroll, days) === null
}
