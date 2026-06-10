const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const

export function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function formatIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function formatPayrollPeriodLabel(start: string, end: string): string {
  const startDate = parseIsoDate(start)
  const endDate = parseIsoDate(end)
  const startMonth = MONTH_NAMES[startDate.getMonth()]
  const endMonth = MONTH_NAMES[endDate.getMonth()]
  const year = endDate.getFullYear()

  if (startMonth === endMonth) {
    return `${startMonth} ${startDate.getDate()}-${endDate.getDate()}, ${year}`
  }

  return `${startMonth} ${startDate.getDate()}-${endMonth} ${endDate.getDate()}, ${year}`
}

export function formatDisplayDate(isoDate: string): string {
  const date = parseIsoDate(isoDate)
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const year = date.getFullYear()
  return `${month}/${day}/${year}`
}

export function formatLongDisplayDate(isoDate: string): string {
  const date = parseIsoDate(isoDate)
  const month = MONTH_NAMES[date.getMonth()]
  return `${month} ${date.getDate()}, ${date.getFullYear()}`
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

export function parseDisplayDate(value: string): Date | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split("-").map(Number)
    return isValidCalendarDate(year, month, day) ? parseIsoDate(trimmed) : null
  }

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!slashMatch) {
    return null
  }

  const month = Number(slashMatch[1])
  const day = Number(slashMatch[2])
  const year = Number(slashMatch[3])

  if (!isValidCalendarDate(year, month, day)) {
    return null
  }

  return new Date(year, month - 1, day)
}

export function formatDtrCutOffRange(start: string, end: string): string {
  return `${formatDisplayDate(start)}–${formatDisplayDate(end)}`
}

export function dateRangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA <= endB && startB <= endA
}

export function isValidDateRange(start: string, end: string): boolean {
  if (!start || !end) {
    return false
  }
  return end >= start
}

const DAY_OF_WEEK_NAMES = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const

export function formatDayOfWeek(isoDate: string): string {
  const date = parseIsoDate(isoDate)
  return DAY_OF_WEEK_NAMES[date.getDay()]
}

export function enumerateIsoDates(start: string, end: string): string[] {
  if (!isValidDateRange(start, end)) {
    return []
  }

  const dates: string[] = []
  const current = parseIsoDate(start)
  const endDate = parseIsoDate(end)

  while (current <= endDate) {
    dates.push(formatIsoDate(current))
    current.setDate(current.getDate() + 1)
  }

  return dates
}
