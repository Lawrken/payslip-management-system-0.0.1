"use client"

import {
  ComputerActivityIcon,
  Moon02Icon,
  Sun03Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useTheme } from "next-themes"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const themes = [
  { value: "light", label: "Light", icon: Sun03Icon },
  { value: "dark", label: "Dark", icon: Moon02Icon },
  { value: "system", label: "System", icon: ComputerActivityIcon },
] as const

function subscribeToHydrationStore() {
  return () => {}
}

function getHydratedSnapshot() {
  return true
}

function getServerSnapshot() {
  return false
}

export function ThemeSelector() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const mounted = React.useSyncExternalStore(
    subscribeToHydrationStore,
    getHydratedSnapshot,
    getServerSnapshot
  )

  const triggerIcon =
    !mounted || resolvedTheme === "light" ? Sun03Icon : Moon02Icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Select theme"
        >
          <HugeiconsIcon icon={triggerIcon} strokeWidth={2} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={mounted ? theme : "system"}
          onValueChange={setTheme}
        >
          {themes.map((item) => (
            <DropdownMenuRadioItem key={item.value} value={item.value}>
              <HugeiconsIcon icon={item.icon} strokeWidth={2} />
              {item.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
