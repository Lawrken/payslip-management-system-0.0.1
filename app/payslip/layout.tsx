import { PayslipSidebar } from "@/components/payslip/payslip-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function PayslipLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <SidebarProvider>
      <PayslipSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
