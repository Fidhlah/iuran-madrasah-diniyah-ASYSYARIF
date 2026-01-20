import { useEffect } from "react"
import { AnalyticsCards, PaymentTable } from "@/components/dashboard"
import { usePaymentsStore } from "@/hooks/payments-store"
import { useSettingsStore } from "@/hooks/settings-store"
import { useStudentsStore } from "@/hooks/students-store"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default function DashboardPage() {
    const router = useRouter()

  const year = new Date().getFullYear()
  
  const fetchPayments = usePaymentsStore((s) => s.fetchPayments)
  const fetchSettings = useSettingsStore((s) => s.fetchSettings)
  const fetchStudents = useStudentsStore((s) => s.fetchStudents)

  const paymentsByYear = usePaymentsStore((s) => s.paymentsByYear)
  const payments = paymentsByYear[year] || [] 
  const students = useStudentsStore((s) => s.students)
  const settings = useSettingsStore((s) => s.settings)

  // Bisa dihapus, atau cukup listen perubahan auth saja untuk UX lebih baik
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        router.replace("/")
      }
    })
    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [router])

  useEffect(() => {
    if (payments.length === 0) fetchPayments(year)
    if (!settings || Object.keys(settings).length === 0) fetchSettings()
    if (students.length === 0) fetchStudents()
  }, [fetchPayments, fetchSettings, fetchStudents, year, payments.length, students.length, settings])

  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AnalyticsCards />
      <PaymentTable />
    </div>
  )
}