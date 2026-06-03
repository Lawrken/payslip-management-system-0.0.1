"use client"

import * as React from "react"

import { Input } from "@/components/ui/input"

function stripNonDigits(value: string) {
  return value.replace(/\D/g, "")
}

export function NumericInput({
  onChange,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      inputMode="numeric"
      pattern="[0-9]+"
      onChange={(event) => {
        const digitsOnly = stripNonDigits(event.target.value)
        if (digitsOnly !== event.target.value) {
          event.target.value = digitsOnly
        }
        onChange?.(event)
      }}
      {...props}
    />
  )
}
