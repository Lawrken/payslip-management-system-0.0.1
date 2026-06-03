import { logoutAction } from "@/app/payslip/actions"
import { Button } from "@/components/ui/button"

export default function PayslipLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <span className="text-sm font-medium">Payslip Portal</span>
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm">
            Logout
          </Button>
        </form>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4">{children}</main>
    </div>
  )
}
