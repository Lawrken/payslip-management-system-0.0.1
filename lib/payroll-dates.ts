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

function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number)
  return new Date(year, month - 1, day)
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
