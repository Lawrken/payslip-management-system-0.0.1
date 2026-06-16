import { redirect } from "next/navigation"

type SearchParamValue = string | string[] | undefined

export function redirectWithDefaultPayrollId(
  pathname: string,
  searchParams: Record<string, SearchParamValue>,
  defaultPayrollId: string | null
): void {
  if (searchParams.payrollId || !defaultPayrollId) {
    return
  }

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "payrollId" || value === undefined) {
      continue
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item)
      }
      continue
    }
    params.set(key, value)
  }
  params.set("payrollId", defaultPayrollId)
  redirect(`${pathname}?${params.toString()}`)
}
