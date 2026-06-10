"use client"

import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  UnfoldMoreIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import * as React from "react"

import { TableHead } from "@/components/ui/table"
import type { SortDirection } from "@/lib/table-sort"

type TableSortIconProps = {
  active: boolean
  direction: SortDirection
}

function TableSortIcon({ active, direction }: TableSortIconProps) {
  const icon = active
    ? direction === "asc"
      ? ArrowUp01Icon
      : ArrowDown01Icon
    : UnfoldMoreIcon

  return (
    <HugeiconsIcon
      icon={icon}
      strokeWidth={2}
      className="size-3.5 shrink-0 opacity-50"
      aria-hidden="true"
    />
  )
}

type SortableTableHeadProps = {
  label: string
  active: boolean
  direction: SortDirection
  onSort: () => void
  className?: string
}

export function SortableTableHead({
  label,
  active,
  direction,
  onSort,
  className,
}: SortableTableHeadProps) {
  return (
    <TableHead
      className={className}
      aria-sort={
        active ? (direction === "asc" ? "ascending" : "descending") : "none"
      }
    >
      <button
        type="button"
        className="inline-flex items-center gap-1 font-medium hover:text-foreground"
        onClick={onSort}
      >
        {label}
        <TableSortIcon active={active} direction={direction} />
      </button>
    </TableHead>
  )
}

type UseTableSortOptions<T, K extends string> = {
  items: T[]
  defaultKey: K
  defaultDir?: SortDirection
  compare: (a: T, b: T, key: K, dir: SortDirection) => number
}

export function useTableSort<T, K extends string>({
  items,
  defaultKey,
  defaultDir = "asc",
  compare,
}: UseTableSortOptions<T, K>) {
  const [sortKey, setSortKey] = React.useState<K>(defaultKey)
  const [sortDir, setSortDir] = React.useState<SortDirection>(defaultDir)

  function handleSort(key: K) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"))
      return
    }
    setSortKey(key)
    setSortDir("asc")
  }

  const sortedItems = React.useMemo(() => {
    const copy = [...items]
    copy.sort((a, b) => compare(a, b, sortKey, sortDir))
    return copy
  }, [items, sortKey, sortDir, compare])

  return { sortKey, sortDir, handleSort, sortedItems }
}
