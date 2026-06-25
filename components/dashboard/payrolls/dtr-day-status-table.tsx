"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DTR_DAY_STATUS_OPTIONS,
  isHolidayStatus,
} from "@/lib/dtr-days"
import { formatDayOfWeek, formatLongDisplayDate } from "@/lib/payroll-dates"
import type { DtrDayStatus, PayrollDtrDay } from "@/lib/types"

type DtrDayStatusTableProps = {
  value: PayrollDtrDay[]
  onChange: (days: PayrollDtrDay[]) => void
}

type DtrDayStatusSelectProps = {
  value: DtrDayStatus
  dateLabel: string
  onValueChange: (status: DtrDayStatus) => void
}

function DtrDayStatusSelect({
  value,
  dateLabel,
  onValueChange,
}: DtrDayStatusSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        size="sm"
        className="w-full min-w-40"
        aria-label={`Day status for ${dateLabel}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectGroup>
          {DTR_DAY_STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export function DtrDayStatusTable({ value, onChange }: DtrDayStatusTableProps) {
  function handleStatusChange(date: string, status: DtrDayStatus) {
    onChange(
      value.map((day) =>
        day.date === date
          ? {
              ...day,
              status,
              holidayName: isHolidayStatus(status) ? day.holidayName : "",
            }
          : day
      )
    )
  }

  function handleHolidayNameChange(date: string, holidayName: string) {
    onChange(
      value.map((day) =>
        day.date === date ? { ...day, holidayName } : day
      )
    )
  }

  return (
    <div className="max-h-[min(60vh,32rem)] overflow-y-auto">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Day</TableHead>
            <TableHead>Day Status</TableHead>
            <TableHead>Holiday Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {value.map((day) => {
            const dateLabel = formatLongDisplayDate(day.date)
            const isHoliday = isHolidayStatus(day.status)

            return (
              <TableRow key={day.date}>
                <TableCell className="font-medium">{dateLabel}</TableCell>
                <TableCell>{formatDayOfWeek(day.date)}</TableCell>
                <TableCell>
                  <DtrDayStatusSelect
                    value={day.status}
                    dateLabel={dateLabel}
                    onValueChange={(status) =>
                      handleStatusChange(day.date, status)
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={day.holidayName}
                    onChange={(event) =>
                      handleHolidayNameChange(day.date, event.target.value)
                    }
                    placeholder="Holiday name"
                    disabled={!isHoliday}
                    aria-label={`Holiday name for ${dateLabel}`}
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
