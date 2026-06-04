"use client"

import {
  Activity01Icon,
  Calendar03Icon,
  CheckListIcon,
  DashboardSquare01Icon,
  Invoice01Icon,
  SquareLock01Icon,
  UserGroupIcon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { logoutAction } from "@/app/dashboard/actions"
import { ThemeSelector } from "@/components/theme-selector"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navItems = [
  { label: "Overview", href: "/dashboard", icon: DashboardSquare01Icon },
  { label: "Employees", href: "/dashboard/employees", icon: UserGroupIcon },
  { label: "Payrolls", href: "/dashboard/payrolls", icon: Calendar03Icon },
  { label: "Payslips", href: "/dashboard/payslips", icon: Invoice01Icon },
  { label: "Review", href: "/dashboard/review", icon: CheckListIcon },
  { label: "Users", href: "/dashboard/users", icon: UserMultipleIcon },
  { label: "Logs", href: "/dashboard/logs", icon: Activity01Icon },
] as const

const accountItems = [
  {
    label: "Change Password",
    href: "/dashboard/account/password",
    icon: SquareLock01Icon,
  },
] as const

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="none">
      <SidebarHeader>
        <span className="px-2 text-sm font-medium">Payslip Admin</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActivePath(pathname, item.href)}
                  >
                    <Link href={item.href}>
                      <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActivePath(pathname, item.href)}
                  >
                    <Link href={item.href}>
                      <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2">
          <form action={logoutAction} className="min-w-0 flex-1">
            <Button type="submit" variant="outline" className="w-full">
              Logout
            </Button>
          </form>
          <ThemeSelector />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
