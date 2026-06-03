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
  onChange,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      inputMode="decimal"
      onChange={(event) => {
        const sanitized = sanitizeDecimal(event.target.value)
        if (sanitized !== event.target.value) {
          event.target.value = sanitized
        }
        onChange?.(event)
      }}
      {...props}
    />
  )
}
