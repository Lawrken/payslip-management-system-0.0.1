"use client"

import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import * as React from "react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  formatTimeDisplay,
  formatTimeInput,
  getTimeInputValidationError,
  parseDisplayTime,
} from "@/lib/schedule-time"
import { cn } from "@/lib/utils"

type TimePickerProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  "aria-label"?: string
  className?: string
}

export function TimePicker({
  value,
  onChange,
  disabled = false,
  placeholder = "H:MM AM",
  "aria-label": ariaLabel,
  className,
}: TimePickerProps) {
  const [draft, setDraft] = React.useState<string | null>(null)
  const [inputError, setInputError] = React.useState<string | null>(null)
  const inputValue = draft ?? formatTimeDisplay(value)

  function clearTime() {
    onChange("")
    setDraft(null)
    setInputError(null)
  }

  function handleInputChange(raw: string) {
    setInputError(null)
    setDraft(formatTimeInput(raw))
  }

  function commitInput() {
    const trimmed = inputValue.trim()
    if (!trimmed) {
      clearTime()
      return
    }

    const validationError = getTimeInputValidationError(trimmed)
    if (validationError) {
      setInputError(validationError)
      setDraft(null)
      return
    }

    const parsed = parseDisplayTime(trimmed)
    if (parsed) {
      onChange(parsed)
      setDraft(null)
      setInputError(null)
      return
    }

    setInputError("Enter a valid time like 9:30 AM.")
    setDraft(null)
  }

  return (
    <div className={cn("flex min-w-32 flex-col gap-1", className)}>
      <InputGroup>
        <InputGroupInput
          value={inputValue}
          onChange={(event) => handleInputChange(event.target.value)}
          onFocus={() => {
            setDraft(formatTimeDisplay(value))
            setInputError(null)
          }}
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
          inputMode="text"
          aria-label={ariaLabel}
          aria-invalid={inputError ? true : undefined}
        />
        {value ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              type="button"
              onClick={clearTime}
              disabled={disabled}
              aria-label="Clear time"
            >
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
      </InputGroup>
      {inputError ? (
        <p className="text-xs text-destructive">{inputError}</p>
      ) : null}
    </div>
  )
}
