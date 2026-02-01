"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "../ui/skeleton"
import { useState } from "react"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { MONTHS } from "@/utils/months"
import { useSWRStudents } from "@/hooks/swr-use-students"
import { useSWRPayments } from "@/hooks/swr-use-payments"



interface StudentDetailProps {
  studentId: string
}

export default function StudentDetail({ studentId }: StudentDetailProps) {
  const router = useRouter()
  const { students, loading: studentsLoading, error, mutate } = useSWRStudents()

  const { payments, loading: paymentsLoading } = useSWRPayments()
  const isLoading = studentsLoading || paymentsLoading

  const [sortField, setSortField] = useState<"year" | "paid_at">("year")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const handleSort = (field: "year" | "paid_at") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("desc")
    }
  }

  const getSortIcon = (field: "year" | "paid_at") => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
    return sortOrder === "asc"
      ? <ArrowUp className="w-3.5 h-3.5" />
      : <ArrowDown className="w-3.5 h-3.5" />
  }
  const student = useMemo(() => {
    return students.find((s) => s.id === studentId)
  }, [students, studentId])

  const studentPayments = useMemo(() => {
    return payments
      .filter((p) => p.student_id === studentId && p.is_paid === true)
      .sort((a, b) => {
        if (sortField === "year") {
          if (a.year !== b.year) return sortOrder === "asc" ? a.year - b.year : b.year - a.year
          if (a.month !== b.month) return sortOrder === "asc" ? a.month - b.month : b.month - a.month
          // fallback ke tanggal pembayaran
          const dateA = new Date(a.paid_at ?? 0)
          const dateB = new Date(b.paid_at ?? 0)
          return sortOrder === "asc"
            ? dateA.getTime() - dateB.getTime()
            : dateB.getTime() - dateA.getTime()
        } else if (sortField === "paid_at") {
          const dateA = new Date(a.paid_at ?? 0)
          const dateB = new Date(b.paid_at ?? 0)
          return sortOrder === "asc"
            ? dateA.getTime() - dateB.getTime()
            : dateB.getTime() - dateA.getTime()
        }
        return 0
      })
  }, [payments, studentId, sortField, sortOrder])

  const handleBack = () => {
    router.back()
  }

  const isActive = student?.status === "active"
  const statusTextValue = student
    ? (student.status === "active" ? "Aktif" : "Nonaktif")
    : "Status tidak diketahui";
  const statusClass = isActive
    ? "bg-emerald-500/90 text-white"
    : "bg-red-500/90 text-white"
  // SKELETON LOADING
  if (isLoading) {
    return (
      <div className="w-full">
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
      <div className="w-full">
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


  return (
    <div className="w-full">
      <Button onClick={handleBack} variant="ghost" className="mb-6 gap-2 hover:bg-secondary/80">
        <ChevronLeft className="w-4 h-4" />
        Kembali
      </Button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informasi Santri */}
        <Card className="border-0 shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-xl tracking-tight">Informasi santri</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Nama lengkap */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Nama Lengkap</p>
              <p className="text-lg font-semibold text-foreground">{student.name}</p>
            </div>
            {/* Kelas & Tahun Masuk */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Kelas</p>
                <p className="text-lg font-semibold text-foreground">{student.class}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Tahun Masuk</p>
                <p className="text-lg font-semibold text-foreground">{student.year_enrolled}</p>
              </div>
            </div>
            {/* Status */}
            <div className="flex justify-center mt-6">
              <span className={`inline-block w-full sm:w-2/3 md:w-1/2 text-center px-3 py-2 rounded-lg font-bold text-base tracking-wide shadow ${statusClass}`}>
                {statusTextValue}
              </span>
            </div>
          </CardContent>
        </Card>
        {/* Riwayat Pembayaran */}
        <Card className="border-0 shadow-sm h-fit">
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
                    <TableHead className="font-semibold cursor-pointer select-none" onClick={() => handleSort("year")}>
                      <span className="flex items-center gap-1">
                        Tahun {getSortIcon("year")}
                      </span>
                    </TableHead>
                    <TableHead className="font-semibold cursor-pointer select-none" onClick={() => handleSort("paid_at")}>
                      <span className="flex items-center gap-1">
                        Tanggal Pembayaran {getSortIcon("paid_at")}
                      </span>
                    </TableHead>
                    <TableHead className="font-semibold text-right">
                      Nominal
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentPayments.map((payment) => {
                    const monthName = MONTHS.find((m) => m.num === payment.month)?.name
                    return (
                      <TableRow key={payment.id} className="hover:bg-secondary/20 transition-colors">
                        <TableCell className="font-medium">{monthName}</TableCell>
                        <TableCell className="text-muted-foreground">{payment.year}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {(() => {
                            const d = new Date(payment.paid_at ?? 0)
                            const day = String(d.getDate()).padStart(2, '0')
                            const monthAbbr = MONTHS[d.getMonth()]?.name.substring(0, 3) || ''
                            const yr = d.getFullYear()
                            return `${day}/${monthAbbr}/${yr}`
                          })()}
                        </TableCell>
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
    </div>
  )
  // ...existing code...
}