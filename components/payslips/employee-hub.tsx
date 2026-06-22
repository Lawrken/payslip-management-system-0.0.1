import {
  Calendar03Icon,
  Invoice01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

const hubItems = [
  {
    title: "Payslips",
    description: "View payslip by payroll period and download PDF.",
    href: "/employee/payslips",
    icon: Invoice01Icon,
  },
  {
    title: "Year to Date",
    description: "Money totals and 13th month estimate from released payslips.",
    href: "/employee/year-to-date",
    icon: Calendar03Icon,
  },
] as const

export function EmployeeHub() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Employee Portal
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose what you would like to view.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {hubItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group block rounded-xl outline-none transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
          >
            <Card className="h-full transition-colors group-hover:bg-muted/40 group-focus-visible:bg-muted/40">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <span className="rounded-lg bg-muted p-2 text-muted-foreground">
                    <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription className="text-pretty">
                      {item.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
