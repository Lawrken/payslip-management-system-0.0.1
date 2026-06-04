import { PayrollsPageContent } from "@/components/dashboard/payrolls/payrolls-page-content"
import { getPayrolls } from "@/lib/payrolls"

export const dynamic = "force-dynamic"

export default async function PayrollsPage() {
  const payrolls = await getPayrolls()

  return <PayrollsPageContent payrolls={payrolls} />
}
