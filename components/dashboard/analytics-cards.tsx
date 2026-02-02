"use client"

import { useMemo, useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { AnalyticCard } from "@/components/ui/analytic-card"
import { MONTHS } from "@/utils/months"
import { useSWRStudents } from "@/hooks/swr-use-students"
import { useSWRPayments } from "@/hooks/swr-use-payments"

export default function AnalyticsCards() {
  const { students, loading: studentsLoading } = useSWRStudents()
  const year = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const { payments, loading: paymentsLoading } = useSWRPayments(year)
  const isLoading = studentsLoading || paymentsLoading

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const activeStudentsCount = students.filter((s) => s.status === "active").length
  const unpaidCount = useMemo(() => {
    return students
      .filter((s) => s.status === "active")
      .filter((student) => {
        const isPaid = payments.some(
          (p) =>
            p.student_id === student.id &&
            p.month === currentMonth &&
            p.year === year &&
            p.is_paid === true,
        )
        return !isPaid
      }).length
  }, [students, payments, year, currentMonth])

  const paidCount = activeStudentsCount - unpaidCount

  // Calculate total iuran (sum of paid amounts) for current month
  const totalIuran = useMemo(() => {
    return payments
      .filter((p) => p.month === currentMonth && p.year === year && p.is_paid === true)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  }, [payments, year, currentMonth])

  const monthLabel = `Bulan ${MONTHS[currentMonth - 1].name} ${year}`
  const loading = isLoading || !mounted

  // Desktop: 4 cards
  // Mobile: 2 cards top row + 1 card full width below
  return (
    <>
      {/* Desktop */}
      <div className="hidden md:grid grid-cols-4 gap-6 mb-8">
        <AnalyticCard
          title="Total Santri Aktif"
          value={activeStudentsCount}
          subtitle="Status aktif"
          color="slate"
          loading={loading}
        />
        <AnalyticCard
          title="Belum Bayar"
          value={unpaidCount}
          subtitle={monthLabel}
          color="amber"
          loading={loading}
        />
        <AnalyticCard
          title="Sudah Bayar"
          value={paidCount}
          subtitle={monthLabel}
          color="emerald"
          loading={loading}
        />
        <AnalyticCard
          title="Total Iuran"
          value={totalIuran}
          subtitle={monthLabel}
          color="blue"
          loading={loading}
          formatCurrency
        />
      </div>
      {/* Mobile */}
      <div className="grid grid-cols-2 gap-4 md:hidden mb-4">
        <AnalyticCard
          title="Total Santri Aktif"
          value={activeStudentsCount}
          subtitle="Status aktif"
          color="slate"
          loading={loading}
        />
        {/* Progress pembayaran */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10" />
          <CardContent className="pt-6 relative">
            <p className="text-sm font-medium text-muted-foreground">Sudah Bayar</p>
            <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 mt-2 tracking-tight">
              {paidCount}/{activeStudentsCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{monthLabel}</p>
          </CardContent>
        </Card>
      </div>
      {/* Mobile: Total Iuran - full width */}
      <div className="grid grid-cols-1 gap-4 md:hidden mb-4">
        <AnalyticCard
          title="Total Iuran"
          value={totalIuran}
          subtitle={monthLabel}
          color="blue"
          loading={loading}
          formatCurrency
        />
      </div>
    </>
  )
}