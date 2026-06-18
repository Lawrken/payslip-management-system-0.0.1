"use client"

import * as React from "react"

import { Input } from "@/components/ui/input"

function sanitizeDecimal(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, "")
  const parts = cleaned.split(".")
  if (parts.length <= 1) {
    return cleaned
  }
  return `${parts[0]}.${parts.slice(1).join("")}`
}

export function DecimalInput({
  maxLength,
  onChange,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      inputMode="decimal"
      maxLength={maxLength}
      onChange={(event) => {
        let sanitized = sanitizeDecimal(event.target.value)
        if (maxLength !== undefined) {
          sanitized = sanitized.slice(0, maxLength)
        }
        if (sanitized !== event.target.value) {
          event.target.value = sanitized
        }
        onChange?.(event)
      }}
      {...props}
    />
  )
}
