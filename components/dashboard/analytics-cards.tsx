"use client"

import { useMemo, useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
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

  // Desktop: 3 card
  // Mobile: 2 card (aktif & progress pembayaran)
  return (
    <>
      {/* Desktop */}
      <div className="hidden md:grid grid-cols-3 gap-6 mb-8">
        {/* Total santri aktif */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -mr-10 -mt-10" />
          <CardContent className="pt-6 relative">
            <p className="text-sm font-medium text-muted-foreground">Total Santri Aktif</p>
            {isLoading || !mounted ? (
              <Skeleton className="h-10 w-24 mt-2 mb-1" />
            ) : (
              <p className="text-4xl font-bold text-foreground mt-2 tracking-tight">{activeStudentsCount}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Status aktif</p>
          </CardContent>
        </Card>
        {/* Belum Bayar */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -mr-10 -mt-10" />
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
        {/* Sudah Bayar */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10" />
          <CardContent className="pt-6 relative flex flex-col items-center">
            <p className="text-sm font-medium text-muted-foreground">Sudah Bayar</p>
            {isLoading || !mounted ? (
              <Skeleton className="h-10 w-24 mt-2 mb-1" />
            ) : (
              <p className="text-4xl font-bold text-emerald-700 dark:text-emerald-400 mt-2 tracking-tight">{paidCount}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {`Bulan ${MONTHS[currentMonth - 1].name} ${year}`}
            </p>
          </CardContent>
        </Card>
      </div>
      {/* Mobile */}
      <div className="grid grid-cols-2 gap-4 md:hidden mb-4">
        {/* Total Aktif */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -mr-10 -mt-10" />
          <CardContent className="pt-6 relative">
            <p className="text-sm font-medium text-muted-foreground">Total Santri Aktif</p>
            {isLoading || !mounted ? (
              <Skeleton className="h-10 w-24 mt-2 mb-1" />
            ) : (
              <p className="text-4xl font-bold text-foreground mt-2 tracking-tight">{activeStudentsCount}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Status aktif</p>
          </CardContent>
        </Card>
        {/* Progress pembayaran */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10" />
          <CardContent className="pt-6 relative">
            <p className="text-sm font-medium text-muted-foreground">Sudah Bayar</p>
            {isLoading || !mounted ? (
              <Skeleton className="h-10 w-32 mt-2 mb-1" />
            ) : (
              <p className="text-4xl font-bold text-emerald-700 dark:text-emerald-400 mt-2 tracking-tight">
                {paidCount}/{activeStudentsCount}
              </p>
            )}
            
            <p className="text-xs text-muted-foreground mt-1">
              {`Bulan ${MONTHS[currentMonth - 1].name} ${year}`}
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}