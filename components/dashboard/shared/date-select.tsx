"use client"

import { Calendar03Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import * as React from "react"

import { Calendar } from "@/components/ui/calendar"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  formatDisplayDate,
  formatIsoDate,
  parseDisplayDate,
  parseIsoDate,
} from "@/lib/payroll-dates"
import { cn } from "@/lib/utils"

type DateSelectProps = {
  name: string
  id: string
  label: string
  defaultValue?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

function parseDefaultDate(value?: string): Date | undefined {
  if (!value) {
    return undefined
  }
  return parseIsoDate(value)
}

function formatDateInput(date: Date): string {
  return formatDisplayDate(formatIsoDate(date))
}

export function DateSelect({
  name,
  id,
  label,
  defaultValue,
  placeholder = "MM/DD/YYYY",
  required = false,
  disabled = false,
  className,
}: DateSelectProps) {
  const initialDate = parseDefaultDate(defaultValue)
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(initialDate)
  const [inputValue, setInputValue] = React.useState(() =>
    initialDate ? formatDateInput(initialDate) : ""
  )

  const isoValue = date ? formatIsoDate(date) : ""

  function clearDate() {
    setDate(undefined)
    setInputValue("")
  }

  function commitInput() {
    const trimmed = inputValue.trim()
    if (!trimmed) {
      clearDate()
      return
    }

    const parsed = parseDisplayDate(trimmed)
    if (parsed) {
      setDate(parsed)
      setInputValue(formatDateInput(parsed))
      return
    }

    if (date) {
      setInputValue(formatDateInput(date))
      return
    }

    setInputValue("")
  }

  function handleCalendarSelect(selectedDate: Date | undefined) {
    if (!selectedDate) {
      return
    }
    setDate(selectedDate)
    setInputValue(formatDateInput(selectedDate))
    setOpen(false)
  }

  return (
    <Field className={cn("min-w-0", className)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input type="hidden" name={name} value={isoValue} required={required} />
      <InputGroup>
        <InputGroupInput
          id={id}
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onBlur={commitInput}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              commitInput()
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          inputMode="numeric"
        />
        <InputGroupAddon align="inline-end" className="gap-0">
          {date ? (
            <InputGroupButton
              type="button"
              onClick={clearDate}
              disabled={disabled}
              aria-label={`Clear ${label.toLowerCase()}`}
            >
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
            </InputGroupButton>
          ) : null}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <InputGroupButton
                type="button"
                disabled={disabled}
                aria-label={`Open calendar for ${label.toLowerCase()}`}
              >
                <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} />
              </InputGroupButton>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleCalendarSelect}
              />
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  )
}
