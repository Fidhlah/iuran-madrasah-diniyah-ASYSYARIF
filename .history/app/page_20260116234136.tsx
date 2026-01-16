export { default as AnalyticsCards } from "./AnalyticsCards"
export { default as PaymentTable } from "./PaymentTable"
export default function DashboardPage() {
  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AnalyticsCards />
      <PaymentTable />
    </div>
  )
}
