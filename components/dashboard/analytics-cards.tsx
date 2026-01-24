"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { MONTHS } from "@/utils/months"
import { useEffect, useState } from "react"



import { useSWRStudents } from "@/hooks/swr-use-students"
import { useSWRPayments } from "@/hooks/swr-use-payments"



export default function AnalyticsCards() {
  const { students, loading:studentsLoading } = useSWRStudents()

  const year = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const { payments, loading:paymentsLoading } = useSWRPayments(year)
  const isLoading = studentsLoading || paymentsLoading

  // Tambahkan state untuk cek apakah sudah di-mount di client
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

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
      {/* Card 1: Total santri aktif (selalu tampil) */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* ... */}
        <CardContent className="pt-6 relative">
          <p className="text-sm font-medium text-muted-foreground">Total santri Aktif</p>
          {isLoading || !mounted ? (
            <Skeleton className="h-10 w-24 mt-2 mb-1" />
          ) : (
            <p className="text-4xl font-bold text-foreground mt-2 tracking-tight">{activeStudentsCount}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">Terdaftar di sistem</p>
        </CardContent>
      </Card>

      {/* Card 2: Progress pembayaran (hanya di mobile) */}
      <Card className="block md:hidden relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
        <CardContent className="pt-6 relative">
          <p className="text-sm font-medium text-muted-foreground">Jumlah Pembayaran</p>
          {isLoading || !mounted ? (
            <Skeleton className="h-10 w-32 mt-2 mb-1" />
          ) : (
            <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 tracking-tight">
              {paidCount}/{activeStudentsCount}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {`Bulan ${MONTHS[currentMonth - 1].name} ${year}`}
          </p>
        </CardContent>
      </Card>

      {/* Card 2: Belum Bayar (hanya di desktop) */}
      <Card className="hidden md:block relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
        <CardContent className="pt-6 relative">
          <p className="text-sm font-medium text-muted-foreground">Belum Bayar</p>
          {isLoading || !mounted ? (
            <Skeleton className="h-10 w-24 mt-2 mb-1" />
          ) : (
            <p className="text-4xl font-bold text-amber-600 dark:text-amber-400 mt-2 tracking-tight">{unpaidCount}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {`Bulan ${MONTHS[currentMonth - 1].name} ${year}`}
          </p>
        </CardContent>
      </Card>

      {/* Card 3: Sudah Bayar (hanya di desktop) */}
      <Card className="hidden md:block relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
        <CardContent className="pt-6 relative">
          <p className="text-sm font-medium text-muted-foreground">Sudah Bayar</p>
          {isLoading || !mounted ? (
            <Skeleton className="h-10 w-24 mt-2 mb-1" />
          ) : (
            <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 tracking-tight">{paidCount}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {`Bulan ${MONTHS[currentMonth - 1].name} ${year}`}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
