"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useStudentStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"

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

interface DashboardProps {
  onStudentClick?: (studentId: string) => void
}

export default function Dashboard({ onStudentClick }: DashboardProps) {
  const { students, payments, addPayment, voidPayment, paymentConfig, updatePaymentConfig } = useStudentStore()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState("")
  const [monthRange, setMonthRange] = useState({ start: 1, end: 12 })
  const [year, setYear] = useState(new Date().getFullYear())
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [nominalInput, setNominalInput] = useState(paymentConfig.nominal_default.toString())

  const [confirmPayment, setConfirmPayment] = useState<{
    studentId: string
    month: number
    isPaid: boolean
  } | null>(null)

  const classes = useMemo(() => {
    return [...new Set(students.filter((s) => s.status_aktif).map((s) => s.kelas))].sort()
  }, [students])

  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => s.status_aktif)
      .filter((s) => s.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter((s) => (selectedClass ? s.kelas === selectedClass : true))
      .sort((a, b) => {
        return sortOrder === "asc"
          ? a.nama_lengkap.localeCompare(b.nama_lengkap)
          : b.nama_lengkap.localeCompare(a.nama_lengkap)
      })
  }, [students, searchTerm, selectedClass, sortOrder])

  const visibleMonths = MONTHS.filter((m) => m.num >= monthRange.start && m.num <= monthRange.end)

  const currentMonth = new Date().getMonth() + 1
  const unpaidCount = useMemo(() => {
    return students
      .filter((s) => s.status_aktif)
      .filter((student) => {
        const isPaid = payments.some(
          (p) =>
            p.student_id === student.id &&
            p.bulan_tagihan === currentMonth &&
            p.tahun_tagihan === year &&
            p.status_transaksi === "Lunas",
        )
        return !isPaid
      }).length
  }, [students, payments, year])

  const hasPayment = (studentId: string, month: number, yr: number) => {
    return payments.some(
      (p) =>
        p.student_id === studentId &&
        p.bulan_tagihan === month &&
        p.tahun_tagihan === yr &&
        p.status_transaksi === "Lunas",
    )
  }

  const handlePaymentToggle = (studentId: string, month: number, currentState: boolean) => {
    setConfirmPayment({ studentId, month, isPaid: currentState })
  }

  const confirmPaymentToggle = () => {
    if (!confirmPayment) return

    const student = students.find((s) => s.id === confirmPayment.studentId)
    const monthName = MONTHS.find((m) => m.num === confirmPayment.month)?.name

    if (confirmPayment.isPaid) {
      const payment = payments.find(
        (p) =>
          p.student_id === confirmPayment.studentId &&
          p.bulan_tagihan === confirmPayment.month &&
          p.tahun_tagihan === year &&
          p.status_transaksi === "Lunas",
      )
      if (payment) {
        voidPayment(payment.id)
        toast({
          title: "Berhasil",
          description: `Pembayaran ${student?.nama_lengkap} bulan ${monthName} dibatalkan`,
        })
      }
    } else {
      addPayment({
        student_id: confirmPayment.studentId,
        bulan_tagihan: confirmPayment.month,
        tahun_tagihan: year,
        tanggal_bayar: new Date().toISOString().split("T")[0],
        jumlah_bayar: Number.parseInt(nominalInput) || paymentConfig.nominal_default,
        status_transaksi: "Lunas",
      })
      toast({
        title: "Berhasil",
        description: `Pembayaran ${student?.nama_lengkap} bulan ${monthName} tercatat`,
      })
    }
    setConfirmPayment(null)
  }

  const handleNominalUpdate = () => {
    const nominal = Number.parseInt(nominalInput)
    if (nominal > 0) {
      updatePaymentConfig(nominal)
      toast({
        title: "Berhasil",
        description: `Nominal diubah menjadi Rp ${nominal.toLocaleString("id-ID")}`,
      })
    }
  }

  const activeStudentsCount = students.filter((s) => s.status_aktif).length
  const paidCount = activeStudentsCount - unpaidCount

  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -mr-10 -mt-10" />
          <CardContent className="pt-6 relative">
            <p className="text-sm font-medium text-muted-foreground">Total santri Aktif</p>
            <p className="text-4xl font-bold text-foreground mt-2 tracking-tight">{activeStudentsCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Terdaftar di sistem</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -mr-10 -mt-10" />
          <CardContent className="pt-6 relative">
            <p className="text-sm font-medium text-muted-foreground">Belum Bayar</p>
            <p className="text-4xl font-bold text-amber-600 dark:text-amber-400 mt-2 tracking-tight">{unpaidCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Bulan ini</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10" />
          <CardContent className="pt-6 relative">
            <p className="text-sm font-medium text-muted-foreground">Sudah Bayar</p>
            <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 tracking-tight">{paidCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Bulan ini</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filter & Pencarian</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Cari Nama</label>
            <Input
              placeholder="Ketik nama santri..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Kelas</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
            >
              <option value="">Semua Kelas</option>
              {classes.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Bulan Mulai</label>
            <select
              value={monthRange.start}
              onChange={(e) => setMonthRange({ ...monthRange, start: Number.parseInt(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
            >
              {MONTHS.map((m) => (
                <option key={m.num} value={m.num}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Bulan Akhir</label>
            <select
              value={monthRange.end}
              onChange={(e) => setMonthRange({ ...monthRange, end: Number.parseInt(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
            >
              {MONTHS.map((m) => (
                <option key={m.num} value={m.num}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Tahun</label>
            <select
              value={year}
              onChange={(e) => setYear(Number.parseInt(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
            >
              {Array.from({ length: 5 }, (_, i) => year - 2 + i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <Button
              onClick={() => {
                setSearchTerm("")
                setSelectedClass("")
                setMonthRange({ start: 1, end: 12 })
                setYear(new Date().getFullYear())
                setSortOrder("asc")
              }}
              variant="outline"
              className="flex-1"
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Nominal Section */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 max-w-md">
              <label className="block text-sm font-medium text-foreground mb-2">Nominal Iuran Bulanan</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={nominalInput}
                  onChange={(e) => setNominalInput(e.target.value)}
                  placeholder="100000"
                  className="flex-1"
                />
                <Button onClick={handleNominalUpdate} variant="default">
                  Simpan
                </Button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Nilai saat ini</p>
              <p className="text-2xl font-bold text-primary">Rp {Number.parseInt(nominalInput).toLocaleString("id-ID")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar santri & History Pembayaran</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Centang untuk mencatat pembayaran, acentang untuk membatalkan
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-secondary/30">
                <TableHead className="font-semibold sticky left-0 bg-secondary/30 z-10 min-w-[200px]">
                  <div className="flex items-center justify-between gap-2">
                    <span>Nama santri</span>
                    <button
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                      className="text-xs bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded transition-colors"
                      title={sortOrder === "asc" ? "A-Z" : "Z-A"}
                    >
                      {sortOrder === "asc" ? "A-Z" : "Z-A"}
                    </button>
                  </div>
                </TableHead>
                <TableHead className="font-semibold sticky left-[220px] bg-secondary/30 z-10 min-w-[80px]">
                  Kelas
                </TableHead>
                <TableHead
                  colSpan={visibleMonths.length}
                  className="font-semibold text-center text-xs text-muted-foreground"
                >
                  Tahun {year}
                </TableHead>
              </TableRow>
              <TableRow className="bg-secondary/10">
                <TableHead className="font-semibold sticky left-0 bg-secondary/10 z-10 min-w-[200px]" />
                <TableHead className="font-semibold sticky left-[220px] bg-secondary/10 z-10 min-w-[80px]" />
                {visibleMonths.map((month) => (
                  <TableHead key={month.num} className="font-semibold text-center min-w-[60px] text-xs">
                    {month.name.substring(0, 3)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <TableRow key={student.id} className="hover:bg-accent/5 transition-colors">
                    <TableCell className="font-medium sticky left-0 bg-card z-10 text-foreground">
                      <button
                        onClick={() => onStudentClick?.(student.id)}
                        className="text-primary hover:underline cursor-pointer"
                      >
                        {student.nama_lengkap}
                      </button>
                    </TableCell>
                    <TableCell className="sticky left-[220px] bg-card z-10 text-muted-foreground">
                      {student.kelas}
                    </TableCell>
                    {visibleMonths.map((month) => {
                      const isPaid = hasPayment(student.id, month.num, year)
                      return (
                        <TableCell key={month.num} className="text-center">
                          <input
                            type="checkbox"
                            checked={isPaid}
                            onChange={() => handlePaymentToggle(student.id, month.num, isPaid)}
                            className="w-5 h-5 rounded border-primary text-primary cursor-pointer"
                          />
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2 + visibleMonths.length} className="text-center py-8 text-muted-foreground">
                    Tidak ada data santri sesuai filter
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Info Card */}
      <div className="mt-6 flex items-center justify-between px-4 py-3 rounded-xl bg-secondary/50">
        <p className="text-sm text-muted-foreground">
          Menampilkan <span className="font-semibold text-foreground">{filteredStudents.length}</span> santri
        </p>
        <p className="text-xs text-muted-foreground">
          Tahun Ajaran {year}
        </p>
      </div>

      {confirmPayment &&
        (() => {
          const student = students.find((s) => s.id === confirmPayment.studentId)
          const monthName = MONTHS.find((m) => m.num === confirmPayment.month)?.name
          const nominal = Number.parseInt(nominalInput) || paymentConfig.nominal_default

          return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>{confirmPayment.isPaid ? "Batalkan Pembayaran?" : "Konfirmasi Pembayaran"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-secondary/30 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nama santri:</span>
                      <span className="font-medium">{student?.nama_lengkap}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kelas:</span>
                      <span className="font-medium">{student?.kelas}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bulan:</span>
                      <span className="font-medium">{monthName}</span>
                    </div>
                    {!confirmPayment.isPaid && (
                      <div className="flex justify-between pt-2 border-t border-border">
                        <span className="text-muted-foreground">Nominal:</span>
                        <span className="font-medium">Rp {nominal.toLocaleString("id-ID")}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tanggal:</span>
                      <span className="font-medium">{new Date().toLocaleDateString("id-ID")}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={confirmPaymentToggle} className="flex-1">
                      {confirmPayment.isPaid ? "Batalkan Pembayaran" : "Catat Pembayaran"}
                    </Button>
                    <Button onClick={() => setConfirmPayment(null)} variant="outline" className="flex-1">
                      Batal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })()}
    </div>
  )
}
