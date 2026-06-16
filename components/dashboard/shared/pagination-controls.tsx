"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"

type PaginationControlsProps = {
  page: number
  pageCount: number
  total: number
  pageSize: number
  itemLabel: string
}

export function PaginationControls({
  page,
  pageCount,
  total,
  pageSize,
  itemLabel,
}: PaginationControlsProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const firstItem = total === 0 ? 0 : (page - 1) * pageSize + 1
  const lastItem = Math.min(total, page * pageSize)

  function hrefForPage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(nextPage))
    return `${pathname}?${params.toString()}`
  }

  if (pageCount <= 1 && total <= pageSize) {
    return null
  }

  return (
    <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <p className="tabular-nums">
        Showing {firstItem}-{lastItem} of {total} {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <Button
          asChild={page > 1}
          variant="outline"
          size="sm"
          disabled={page <= 1}
        >
          {page > 1 ? (
            <Link href={hrefForPage(page - 1)} scroll={false}>
              Previous
            </Link>
          ) : (
            <span>Previous</span>
          )}
        </Button>
        <span className="min-w-20 text-center tabular-nums">
          Page {page} of {pageCount}
        </span>
        <Button
          asChild={page < pageCount}
          variant="outline"
          size="sm"
          disabled={page >= pageCount}
        >
          {page < pageCount ? (
            <Link href={hrefForPage(page + 1)} scroll={false}>
              Next
            </Link>
          ) : (
            <span>Next</span>
          )}
        </Button>
      </div>
    </div>
  )
}
