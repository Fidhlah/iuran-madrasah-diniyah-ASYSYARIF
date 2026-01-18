"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"


import { useStudents, usePayments, useSettings } from "@/hooks"


export default function AnalyticsCards() {
  const { students, loading:studentsLoading } = useStudents()
  const year = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const { payments, togglePayment,loading:paymentsLoading, fetchPayments } = usePayments()


  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ]

  const isLoading = studentsLoading || paymentsLoading

  const activeStudentsCount = students.filter((s) => s.status).length
  const unpaidCount = useMemo(() => {
    return students
      .filter((s) => s.status)
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -mr-10 -mt-10" />
        <CardContent className="pt-6 relative">
          <p className="text-sm font-medium text-muted-foreground">Total santri Aktif</p>
          {isLoading ? (
            <Skeleton className="h-10 w-24 mt-2 mb-1" />
          ) : (
            <p className="text-4xl font-bold text-foreground mt-2 tracking-tight">{activeStudentsCount}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">Terdaftar di sistem</p>
        </CardContent>
      </Card>
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
        <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -mr-10 -mt-10" />
        <CardContent className="pt-6 relative">
          <p className="text-sm font-medium text-muted-foreground">Belum Bayar</p>
          {isLoading ? (
              <Skeleton className="h-10 w-24 mt-2 mb-1" />
            ) : (
              <p className="text-4xl font-bold text-amber-600 dark:text-amber-400 mt-2 tracking-tight">{unpaidCount}</p>
            )}
          <p className="text-xs text-muted-foreground mt-1">
            {`Bulan ${monthNames[currentMonth - 1]} ${year}`}
          </p>
        </CardContent>
      </Card>
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10" />
        <CardContent className="pt-6 relative">
          <p className="text-sm font-medium text-muted-foreground">Sudah Bayar</p>
          {isLoading ? (
              <Skeleton className="h-10 w-24 mt-2 mb-1" />
            ) : (
              <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 tracking-tight">{paidCount}</p>
            )}          <p className="text-xs text-muted-foreground mt-1">
            {`Bulan ${monthNames[currentMonth - 1]} ${year}`}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
