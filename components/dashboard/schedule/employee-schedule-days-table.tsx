"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TimePicker } from "@/components/ui/time-picker"
import {
  getHolidayNameForDate,
  isHolidayShiftType,
  isScheduleDayHolidayLocked,
  isTimesRequired,
  MANUAL_SHIFT_TYPE_OPTIONS,
  SHIFT_TYPE_OPTIONS,
} from "@/lib/schedule-days"
import { formatDayOfWeek, formatLongDisplayDate } from "@/lib/payroll-dates"
import type { EmployeeScheduleDay, Payroll, ShiftType } from "@/lib/types"

type EmployeeScheduleDaysTableProps = {
  payroll: Payroll
  value: EmployeeScheduleDay[]
  onChange: (days: EmployeeScheduleDay[]) => void
}

type ShiftTypeSelectProps = {
  value: ShiftType | ""
  dateLabel: string
  disabled: boolean
  onValueChange: (shiftType: ShiftType) => void
}

function ShiftTypeSelect({
  value,
  dateLabel,
  disabled,
  onValueChange,
}: ShiftTypeSelectProps) {
  const options = disabled ? SHIFT_TYPE_OPTIONS : MANUAL_SHIFT_TYPE_OPTIONS

  return (
    <Select
      value={value || undefined}
      onValueChange={(nextValue) => onValueChange(nextValue as ShiftType)}
      disabled={disabled}
    >
      <SelectTrigger
        size="sm"
        className="w-full min-w-44"
        aria-label={`Shift type for ${dateLabel}`}
      >
        <SelectValue placeholder="Select shift type" />
      </SelectTrigger>
      <SelectContent position="popper" className="z-[60]">
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export function EmployeeScheduleDaysTable({
  payroll,
  value,
  onChange,
}: EmployeeScheduleDaysTableProps) {
  function updateDay(
    date: string,
    updater: (day: EmployeeScheduleDay) => EmployeeScheduleDay
  ) {
    onChange(value.map((day) => (day.date === date ? updater(day) : day)))
  }

  function handleShiftTypeChange(date: string, shiftType: ShiftType) {
    updateDay(date, (day) => ({
      ...day,
      shiftType,
      shiftIn: isTimesRequired(shiftType) ? day.shiftIn : "",
      shiftOut: isTimesRequired(shiftType) ? day.shiftOut : "",
      logIn: isTimesRequired(shiftType) ? day.logIn : "",
      logOut: isTimesRequired(shiftType) ? day.logOut : "",
    }))
  }

  function handleTimeChange(
    date: string,
    field: "shiftIn" | "shiftOut" | "logIn" | "logOut",
    timeValue: string
  ) {
    updateDay(date, (day) => ({ ...day, [field]: timeValue }))
  }

  return (
    <div className="max-h-[min(60vh,32rem)] overflow-y-auto">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Day</TableHead>
            <TableHead>Shift Type</TableHead>
            <TableHead>Shift-In</TableHead>
            <TableHead>Shift-Out</TableHead>
            <TableHead>Log-In</TableHead>
            <TableHead>Log-Out</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {value.map((day) => {
            const dateLabel = formatLongDisplayDate(day.date)
            const isHolidayLocked = isScheduleDayHolidayLocked(payroll, day.date)
            const holidayName = getHolidayNameForDate(payroll, day.date)
            const timesEnabled = isTimesRequired(day.shiftType)

            return (
              <TableRow key={day.date}>
                <TableCell className="font-medium">
                  <div className="flex flex-col gap-0.5">
                    <span>{dateLabel}</span>
                    {holidayName ? (
                      <span className="text-xs text-muted-foreground">
                        {holidayName}
                      </span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>{formatDayOfWeek(day.date)}</TableCell>
                <TableCell>
                  <ShiftTypeSelect
                    value={day.shiftType}
                    dateLabel={dateLabel}
                    disabled={isHolidayLocked}
                    onValueChange={(shiftType) =>
                      handleShiftTypeChange(day.date, shiftType)
                    }
                  />
                </TableCell>
                <TableCell>
                  <TimePicker
                    value={day.shiftIn}
                    onChange={(timeValue) =>
                      handleTimeChange(day.date, "shiftIn", timeValue)
                    }
                    disabled={!timesEnabled || isHolidayShiftType(day.shiftType)}
                    aria-label={`Shift-in for ${dateLabel}`}
                  />
                </TableCell>
                <TableCell>
                  <TimePicker
                    value={day.shiftOut}
                    onChange={(timeValue) =>
                      handleTimeChange(day.date, "shiftOut", timeValue)
                    }
                    disabled={!timesEnabled || isHolidayShiftType(day.shiftType)}
                    aria-label={`Shift-out for ${dateLabel}`}
                  />
                </TableCell>
                <TableCell>
                  <TimePicker
                    value={day.logIn}
                    onChange={(timeValue) =>
                      handleTimeChange(day.date, "logIn", timeValue)
                    }
                    disabled={!timesEnabled || isHolidayShiftType(day.shiftType)}
                    aria-label={`Log-in for ${dateLabel}`}
                  />
                </TableCell>
                <TableCell>
                  <TimePicker
                    value={day.logOut}
                    onChange={(timeValue) =>
                      handleTimeChange(day.date, "logOut", timeValue)
                    }
                    disabled={!timesEnabled || isHolidayShiftType(day.shiftType)}
                    aria-label={`Log-out for ${dateLabel}`}
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
