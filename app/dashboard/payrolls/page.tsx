import { PayrollsPageContent } from "@/components/dashboard/payrolls/payrolls-page-content"
import { getPayrolls } from "@/lib/payrolls"

export default function PayrollsPage() {
  const payrolls = getPayrolls()

  return <PayrollsPageContent payrolls={payrolls} />
}
