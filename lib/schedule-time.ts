const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

export function isValidTimeValue(value: string): boolean {
  return TIME_PATTERN.test(value.trim())
}

function parseTimeValue(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }
  return isValidTimeValue(trimmed) ? trimmed : null
}

export function normalizeTimeValue(value: string): string {
  return value.trim()
}

type TimePeriod = "AM" | "PM"

function to24Hour(hour12: number, period: TimePeriod): number {
  if (period === "AM") {
    return hour12 === 12 ? 0 : hour12
  }
  return hour12 === 12 ? 12 : hour12 + 12
}

function to12Hour(hour24: number): { hour: string; period: TimePeriod } {
  const period: TimePeriod = hour24 >= 12 ? "PM" : "AM"
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return { hour: String(hour12), period }
}

function split12HourTimeValue(value: string): {
  hour: string
  minute: string
  period: TimePeriod | ""
} {
  const parsed = parseTimeValue(value)
  if (!parsed) {
    return { hour: "", minute: "", period: "" }
  }

  const [hourPart, minute] = parsed.split(":")
  const hour24 = Number(hourPart)
  const { hour, period } = to12Hour(hour24)
  return { hour, minute, period }
}

function combine12HourTimeValue(
  hour: string,
  minute: string,
  period: TimePeriod
): string | null {
  const hour12 = Number(hour)
  const minuteValue = Number(minute)
  if (
    !Number.isInteger(hour12) ||
    hour12 < 1 ||
    hour12 > 12 ||
    !Number.isInteger(minuteValue) ||
    minuteValue < 0 ||
    minuteValue > 59
  ) {
    return null
  }

  const hour24 = to24Hour(hour12, period)
  const combined = `${String(hour24).padStart(2, "0")}:${String(minuteValue).padStart(2, "0")}`
  return isValidTimeValue(combined) ? combined : null
}

export function formatTimeDisplay(value: string): string {
  const { hour, minute, period } = split12HourTimeValue(value)
  if (!hour || !minute || !period) {
    return ""
  }
  return `${hour}:${minute} ${period}`
}

export function formatScheduleTimeForExcel(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return ""
  }
  return formatTimeDisplay(trimmed) || trimmed
}

export function coerceScheduleTimeCell(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return ""
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const timeFraction = value >= 1 ? value % 1 : value
    if (timeFraction >= 0 && timeFraction < 1) {
      const totalSeconds = Math.round(timeFraction * 24 * 60 * 60)
      const hours = Math.floor(totalSeconds / 3600) % 24
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
    }
  }

  return String(value).trim()
}

export function scheduleTimesEqual(left: unknown, right: unknown): boolean {
  const leftRaw = coerceScheduleTimeCell(left)
  const rightRaw = coerceScheduleTimeCell(right)

  if (!leftRaw && !rightRaw) {
    return true
  }

  const leftParsed = parseScheduleTimeValue(leftRaw)
  const rightParsed = parseScheduleTimeValue(rightRaw)

  if (leftParsed === null || rightParsed === null) {
    return leftRaw === rightRaw
  }

  return leftParsed === rightParsed
}

export function parseScheduleTimeValue(value: string): string | null {
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

export function parseDisplayTime(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) {
    return null
  }

  const hour = Number(match[1])
  const minute = Number(match[2])
  const period = match[3].toUpperCase() as TimePeriod

  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) {
    return null
  }

  return combine12HourTimeValue(String(hour), String(minute).padStart(2, "0"), period)
}

function parsePeriodLetters(letters: string): {
  period: TimePeriod | ""
  partialPeriod: string
} {
  const upper = letters.toUpperCase()
  if (upper === "AM") {
    return { period: "AM", partialPeriod: "" }
  }
  if (upper === "PM") {
    return { period: "PM", partialPeriod: "" }
  }
  if (upper === "A") {
    return { period: "", partialPeriod: "A" }
  }
  if (upper === "P") {
    return { period: "", partialPeriod: "P" }
  }
  return { period: "", partialPeriod: "" }
}

function extractTimeAndPeriod(raw: string): {
  period: TimePeriod | ""
  partialPeriod: string
  timeBody: string
} {
  const trimmed = raw.trimEnd()
  if (!trimmed) {
    return { period: "", partialPeriod: "", timeBody: "" }
  }

  const periodSuffixMatch = trimmed.match(/^(.+?)(?:\s+)?([AaPp][Mm]?)$/i)
  if (periodSuffixMatch) {
    const parsed = parsePeriodLetters(periodSuffixMatch[2])
    if (parsed.period || parsed.partialPeriod) {
      return {
        timeBody: periodSuffixMatch[1],
        period: parsed.period,
        partialPeriod: parsed.partialPeriod,
      }
    }
  }

  return { period: "", partialPeriod: "", timeBody: trimmed }
}

function usesTwoDigitHour(digits: string): boolean {
  if (digits.length < 2) {
    return false
  }
  const hour = Number(digits.slice(0, 2))
  return hour >= 1 && hour <= 12
}

function getMinuteValue(digits: string): number | null {
  if (digits.length < 3) {
    return null
  }
  if (usesTwoDigitHour(digits)) {
    return Number(digits.slice(2).padEnd(2, "0").slice(0, 2))
  }
  return Number(digits.slice(1).padEnd(2, "0").slice(0, 2))
}

function canAppendTimeDigit(digits: string, digit: string): boolean {
  if (!/^\d$/.test(digit)) {
    return false
  }

  const next = digits + digit

  if (next.length === 1) {
    return digit >= "0" && digit <= "9"
  }

  if (next.length === 2) {
    const hour = Number(next)
    if (hour >= 1 && hour <= 12) {
      return true
    }
    if (Number(next[0]) >= 1 && Number(next[0]) <= 9 && Number(next[1]) <= 5) {
      return true
    }
    return false
  }

  if (next.length === 3) {
    if (usesTwoDigitHour(next)) {
      return Number(digit) <= 5
    }
    return Number(digit) <= 5
  }

  const minute = getMinuteValue(next)
  return minute !== null && minute <= 59
}

function extractValidatedTimeDigits(raw: string): string {
  const { timeBody } = extractTimeAndPeriod(raw)
  const digitChars = timeBody.replace(/\D/g, "")
  let result = ""

  for (const digit of digitChars) {
    if (result.length >= 4) {
      break
    }
    if (canAppendTimeDigit(result, digit)) {
      result += digit
    }
  }

  return result
}

function formatDigitsWithAutoColon(digits: string): string {
  if (digits.length === 0) {
    return ""
  }
  if (digits.length === 1) {
    return digits
  }
  if (digits.length === 2) {
    if (usesTwoDigitHour(digits)) {
      return `${digits}:`
    }
    return `${digits[0]}:${digits[1]}`
  }
  if (digits.length === 3) {
    if (usesTwoDigitHour(digits)) {
      return `${digits.slice(0, 2)}:${digits[2]}`
    }
    return `${digits[0]}:${digits.slice(1, 3)}`
  }
  if (usesTwoDigitHour(digits)) {
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`
  }
  return `${digits[0]}:${digits.slice(1, 3)}`
}

export function formatTimeInput(raw: string): string {
  const { period, partialPeriod } = extractTimeAndPeriod(raw)
  const digits = extractValidatedTimeDigits(raw)
  const time = formatDigitsWithAutoColon(digits)

  if (period) {
    return time ? `${time} ${period}` : period
  }
  if (partialPeriod) {
    return time ? `${time} ${partialPeriod}` : partialPeriod
  }
  return time
}

export function getTimeInputValidationError(display: string): string | null {
  const trimmed = display.trim()
  if (!trimmed) {
    return null
  }

  if (parseDisplayTime(trimmed)) {
    return null
  }

  const timeMatch = trimmed.match(/^(\d{1,2}):(\d{1,2})/)
  if (timeMatch) {
    const hour = Number(timeMatch[1])
    const minute = Number(timeMatch[2])

    if (hour < 1 || hour > 12) {
      return "Hour must be between 1 and 12."
    }
    if (minute > 59) {
      return "Minutes must be between 00 and 59."
    }
  }

  if (!/\b(AM|PM)\b/i.test(trimmed)) {
    return "Include AM or PM."
  }

  return "Enter a valid time like 9:30 AM."
}
