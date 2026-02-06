"use client"

import { useMemo, useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { AnalyticCard } from "@/components/ui/analytic-card"
import { Skeleton } from "@/components/ui/skeleton"
import { MONTHS } from "@/utils/months"
import { useSWRStudents } from "@/hooks/swr-use-students"
import { useSWRPayments } from "@/hooks/swr-use-payments"

import { CLASS_ORDER } from "@/utils/class-order"

export default function AnalyticsCards() {
  const { students, loading: studentsLoading } = useSWRStudents()
  const year = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const { payments, loading: paymentsLoading } = useSWRPayments(year)
  const isLoading = studentsLoading || paymentsLoading

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const activeStudentsCount = students.filter((s) => s.status === "active").length

  // Calculate total unpaid (global)
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

  // Calculate unpaid per class
  const classUnpaidCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    CLASS_ORDER.forEach(cls => {
      counts[cls] = students
        .filter(s => s.status === "active" && s.class === cls)
        .filter(s => {
          const isPaid = payments.some(
            p => p.student_id === s.id &&
              p.month === currentMonth &&
              p.year === year &&
              p.is_paid === true
          )
          return !isPaid
        }).length
    })
    return counts
  }, [students, payments, year, currentMonth])

  // Calculate total iuran
  const totalIuran = useMemo(() => {
    return payments
      .filter((p) => p.month === currentMonth && p.year === year && p.is_paid === true)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  }, [payments, year, currentMonth])

  const monthLabel = `Bulan ${MONTHS[currentMonth - 1].name} ${year}`
  const loading = isLoading || !mounted

  return (
    <>
      {/* Main Stats - Unified Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <AnalyticCard
          title="Total Santri Aktif"
          value={activeStudentsCount}
          subtitle="Status aktif"
          color="slate"
          loading={loading}
        />

        {/* Merged Progress Card (Paid/Total) */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10" />
          <CardContent className="pt-6 relative">
            <p className="text-sm font-medium text-muted-foreground">Progress Pembayaran</p>
            {loading ? (
              <Skeleton className="h-8 w-24 mt-2" />
            ) : (
              <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 mt-2 tracking-tight">
                {paidCount}/{activeStudentsCount}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{monthLabel}</p>
          </CardContent>
        </Card>

        <div className="col-span-2 lg:col-span-1">
          <AnalyticCard
            title="Total Iuran"
            value={totalIuran}
            subtitle={monthLabel}
            color="blue"
            loading={loading}
            formatCurrency
          />
        </div>

        {/* Class Monitoring Card - Compact */}
        <Card className="col-span-2 lg:col-span-1 relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -mr-10 -mt-10" />
          <CardContent className="pt-6 relative w-full">
            <p className="text-sm font-medium text-muted-foreground mb-3 w-full">Belum Bayar</p>
            {loading ? (
              <Skeleton className="h-12 w-full mt-2" />
            ) : (
              <div className="flex justify-between items-center w-full px-1">
                {CLASS_ORDER.map((cls, idx) => {
                  const count = classUnpaidCounts[cls] || 0
                  return (
                    <div key={cls} className={`flex-1 flex flex-col items-center ${idx < CLASS_ORDER.length - 1 ? "border-r border-amber-200/60 dark:border-amber-800/60" : ""}`}>
                      <span className="text-sm md:text-base font-bold text-muted-foreground tracking-wide mb-1">{cls}</span>
                      <span className={`text-2xl md:text-3xl font-extrabold leading-none ${count > 0 ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground/40"}`}>
                        {count}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}