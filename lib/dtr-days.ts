import { enumerateIsoDates, formatLongDisplayDate } from "@/lib/payroll-dates"
import type { DtrDayStatus, PayrollDtrDay } from "@/lib/types"

export const DTR_DAY_STATUS_OPTIONS: {
  value: DtrDayStatus
  label: string
}[] = [
  { value: "regular", label: "Regular Day" },
  { value: "specialHoliday", label: "Special Holiday" },
  { value: "legalHoliday", label: "Legal Holiday" },
]

const VALID_DTR_DAY_STATUSES = new Set<DtrDayStatus>(
  DTR_DAY_STATUS_OPTIONS.map((option) => option.value)
)

function isValidDtrDayStatus(status: string): status is DtrDayStatus {
  return VALID_DTR_DAY_STATUSES.has(status as DtrDayStatus)
}

export function isHolidayStatus(status: DtrDayStatus): boolean {
  return status === "specialHoliday" || status === "legalHoliday"
}

function normalizePayrollDtrDay(day: Partial<PayrollDtrDay> & { date: string; status: DtrDayStatus }): PayrollDtrDay {
  const holidayName =
    typeof day.holidayName === "string" ? day.holidayName : ""

  return {
    date: day.date,
    status: day.status,
    holidayName: isHolidayStatus(day.status) ? holidayName : "",
  }
}

function buildDefaultDtrDays(
  start: string,
  end: string
): PayrollDtrDay[] {
  return enumerateIsoDates(start, end).map((date) => ({
    date,
    status: "regular",
    holidayName: "",
  }))
}

export function mergeDtrDays(
  start: string,
  end: string,
  existing?: PayrollDtrDay[]
): PayrollDtrDay[] {
  const dayByDate = new Map((existing ?? []).map((day) => [day.date, day]))

  return enumerateIsoDates(start, end).map((date) => {
    const existingDay = dayByDate.get(date)
    if (!existingDay) {
      return {
        date,
        status: "regular",
        holidayName: "",
      }
    }

    return normalizePayrollDtrDay(existingDay)
  })
}

export function resolveDtrDays(payroll: {
  dtrCutOffStart: string
  dtrCutOffEnd: string
  dtrDays: PayrollDtrDay[]
}): PayrollDtrDay[] {
  if (payroll.dtrDays.length > 0) {
    return payroll.dtrDays.map((day) => normalizePayrollDtrDay(day))
  }

  return buildDefaultDtrDays(payroll.dtrCutOffStart, payroll.dtrCutOffEnd)
}

export function parseDtrDaysFromFormData(
  formData: FormData
): PayrollDtrDay[] | { error: string } {
  const raw = String(formData.get("dtrDays") ?? "").trim()
  if (!raw) {
    return { error: "DTR day statuses are required." }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { error: "Invalid DTR day statuses." }
  }

  if (!Array.isArray(parsed)) {
    return { error: "Invalid DTR day statuses." }
  }

  const days: PayrollDtrDay[] = []
  for (const item of parsed) {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof (item as PayrollDtrDay).date !== "string" ||
      typeof (item as PayrollDtrDay).status !== "string"
    ) {
      return { error: "Invalid DTR day statuses." }
    }

    const { date, status } = item as PayrollDtrDay
    if (!isValidDtrDayStatus(status)) {
      return { error: "Invalid DTR day status." }
    }

    days.push(
      normalizePayrollDtrDay({
        date,
        status,
        holidayName:
          typeof (item as PayrollDtrDay).holidayName === "string"
            ? (item as PayrollDtrDay).holidayName
            : "",
      })
    )
  }

  return days
}

export function validateDtrDays(
  start: string,
  end: string,
  days: PayrollDtrDay[]
): { error: string } | null {
  const expectedDates = enumerateIsoDates(start, end)
  if (expectedDates.length === 0) {
    return { error: "Invalid DTR cut-off date range." }
  }

  if (days.length !== expectedDates.length) {
    return {
      error: "DTR day statuses must include every date in the cut-off range.",
    }
  }

  const dayByDate = new Map(days.map((day) => [day.date, day]))
  for (const date of expectedDates) {
    const day = dayByDate.get(date)
    if (!day || !isValidDtrDayStatus(day.status)) {
      return {
        error: "DTR day statuses must include every date in the cut-off range.",
      }
    }

    if (isHolidayStatus(day.status)) {
      if (!day.holidayName.trim()) {
        return {
          error: `Holiday name is required for ${formatLongDisplayDate(date)}.`,
        }
      }
    } else if (day.holidayName.trim()) {
      return {
        error: `Holiday name must be empty for regular days (${formatLongDisplayDate(date)}).`,
      }
    }
  }

  return null
}
