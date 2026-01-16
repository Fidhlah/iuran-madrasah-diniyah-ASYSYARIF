import { AnalyticsCards from "@/components/dashboard"
import { AnalyticsCards, PaymentTable } from "@/components/dashboard"

export default function DashboardPage() {
  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AnalyticsCards />
      <PaymentTable />
    </div>
  )
}
