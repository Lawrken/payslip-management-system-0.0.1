import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"

import { cn } from "@/lib/utils"

type EmployeePortalSiblingLinkProps = {
  href: string
  children: React.ReactNode
  className?: string
}

export function EmployeePortalSiblingLink({
  href,
  children,
  className,
}: EmployeePortalSiblingLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
        className
      )}
    >
      {children}
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        strokeWidth={2}
        className="size-4 shrink-0"
      />
    </Link>
  )
}
