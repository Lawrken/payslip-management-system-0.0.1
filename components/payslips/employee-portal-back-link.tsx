import Link from "next/link"

import { cn } from "@/lib/utils"

type EmployeePortalBackLinkProps = {
  className?: string
}

export function EmployeePortalBackLink({ className }: EmployeePortalBackLinkProps) {
  return (
    <Link
      href="/employee"
      className={cn(
        "text-sm text-muted-foreground transition-colors hover:text-foreground",
        className
      )}
    >
      ← Back to portal
    </Link>
  )
}
