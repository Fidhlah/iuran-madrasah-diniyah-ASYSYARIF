"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useStudents } from "@/hooks"
import { usePayments } from "@/hooks"
import { Skeleton } from "../ui/skeleton"

const MONTHS = [
  { num: 1, name: "Januari" },
  { num: 2, name: "Februari" },
  { num: 3, name: "Maret" },
  { num: 4, name: "April" },
  { num: 5, name: "Mei" },
  { num: 6, name: "Juni" },
  { num: 7, name: "Juli" },
  { num: 8, name: "Agustus" },
  { num: 9, name: "September" },
  { num: 10, name: "Oktober" },
  { num: 11, name: "November" },
  { num: 12, name: "Desember" },
]

interface StudentDetailProps {
  studentId: string
}

export default function StudentDetail({ studentId }: StudentDetailProps) {
  const router = useRouter()
  const { students, loading: studentsLoading } = useStudents()
  const { payments, loading: paymentsLoading } = usePayments()
  const isLoading = studentsLoading || paymentsLoading

  const student = useMemo(() => {
    return students.find((s) => s.id === studentId)
  }, [students, studentId])

  const studentPayments = useMemo(() => {
    return payments
      .filter((p) => p.student_id === studentId && p.is_paid === true)
      .sort((a, b) => {
        const dateA = new Date(a.paid_at ?? 0)
        const dateB = new Date(b.paid_at ?? 0)
        return dateB.getTime() - dateA.getTime()
      })
  }, [payments, studentId])

  const handleBack = () => {
    router.push("/")
  }

  // SKELETON LOADING
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Button onClick={handleBack} variant="ghost" className="mb-6 gap-2 hover:bg-secondary/80">
          <ChevronLeft className="w-4 h-4" />
          Kembali
        </Button>
        {/* Info Santri */}
        <Card className="mb-8 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl tracking-tight">Informasi santri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Nama Lengkap</p>
                <Skeleton className="h-6 w-40" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Kelas</p>
                <Skeleton className="h-6 w-32" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Tahun Masuk</p>
                <Skeleton className="h-6 w-24" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Riwayat Pembayaran */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
          <CardTitle className="text-xl tracking-tight">Riwayat Pembayaran</CardTitle>
          <div className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
            <span>Total pembayaran:</span>
            <Skeleton className="h-5 w-16" />
          </div>
        </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                  <TableHead className="font-semibold">Bulan</TableHead>
                  <TableHead className="font-semibold">Tahun</TableHead>
                  <TableHead className="font-semibold">Tanggal Pembayaran</TableHead>
                  <TableHead className="font-semibold text-right">Nominal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    )
  }

  // DATA TIDAK DITEMUKAN
  if (!student) {
    return (
      <div className="max-w-4xl mx-auto">
        <Button onClick={handleBack} variant="ghost" className="mb-6 gap-2 hover:bg-secondary/80">
          <ChevronLeft className="w-4 h-4" />
          Kembali
        </Button>
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">Data santri tidak ditemukan</CardContent>
        </Card>
      </div>
    )
  }

  const statusText = student.status ? "Aktif" : "Nonaktif"
  const statusColor = student.status === "Aktif"
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"

  return (
    <div className="max-w-4xl mx-auto">
      <Button onClick={handleBack} variant="ghost" className="mb-6 gap-2 hover:bg-secondary/80">
        <ChevronLeft className="w-4 h-4" />
        Kembali
      </Button>

      {/* Student Info Card */}
      <Card className="mb-8 border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl tracking-tight">Informasi santri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Nama Lengkap</p>
              <p className="text-lg font-semibold text-foreground">{student.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Kelas</p>
              <p className="text-lg font-semibold text-foreground">{student.class}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Tahun Masuk</p>
              <p className="text-lg font-semibold text-foreground">{student.year_enrolled}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
              <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium ${statusColor}`}>
                {statusText}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl tracking-tight">Riwayat Pembayaran</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Total pembayaran: <span className="font-semibold text-foreground">{studentPayments.length}</span> transaksi
          </p>
        </CardHeader>
        <CardContent>
          {studentPayments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                  <TableHead className="font-semibold">Bulan</TableHead>
                  <TableHead className="font-semibold">Tahun</TableHead>
                  <TableHead className="font-semibold">Tanggal Pembayaran</TableHead>
                  <TableHead className="font-semibold text-right">Nominal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentPayments.map((payment) => {
                  const monthName = MONTHS.find((m) => m.num === payment.month)?.name
                  return (
                    <TableRow key={payment.id} className="hover:bg-secondary/20 transition-colors">
                      <TableCell className="font-medium">{monthName}</TableCell>
                      <TableCell className="text-muted-foreground">{payment.year}</TableCell>
                      <TableCell className="text-muted-foreground">{new Date(payment.paid_at ?? 0).toLocaleDateString("id-ID")}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        Rp {payment.amount.toLocaleString("id-ID")}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Belum ada riwayat pembayaran untuk santri ini</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}