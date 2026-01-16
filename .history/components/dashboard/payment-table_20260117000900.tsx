"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useStudentStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { ArrowUpDown, ArrowUp, ArrowDown, Download } from "lucide-react"

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

export default function PaymentTable() {
  const router = useRouter()
  const { students, payments, addPayment, voidPayment, paymentConfig, updatePaymentConfig } = useStudentStore()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState("")
  const [monthRange, setMonthRange] = useState({ start: 1, end: 12 })
  const [year, setYear] = useState(new Date().getFullYear())
  const [sortField, setSortField] = useState<"nama" | "kelas">("nama")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [nominalInput, setNominalInput] = useState(paymentConfig.nominal_default.toString())
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0])

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
        if (sortField === "nama") {
          return sortOrder === "asc"
            ? a.nama_lengkap.localeCompare(b.nama_lengkap)
            : b.nama_lengkap.localeCompare(a.nama_lengkap)
        } else {
          const classCompare = a.kelas.localeCompare(b.kelas)
          if (classCompare !== 0) {
            return sortOrder === "asc" ? classCompare : -classCompare
          }
          return a.nama_lengkap.localeCompare(b.nama_lengkap)
        }
      })
  }, [students, searchTerm, selectedClass, sortField, sortOrder])

  const visibleMonths = MONTHS.filter((m) => m.num >= monthRange.start && m.num <= monthRange.end)

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
    setPaymentDate(new Date().toISOString().split("T")[0])
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
        tanggal_bayar: paymentDate,
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

  const handleExportAll = () => {
    toast({
      title: "Export Semua Data",
      description: "Fitur export semua data akan segera tersedia",
    })
  }

  const handleExportFiltered = () => {
    toast({
      title: "Export Data Tampil",
      description: `Fitur export ${filteredStudents.length} data yang ditampilkan akan segera tersedia`,
    })
  }

  const handleSort = (field: "nama" | "kelas") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const getSortIcon = (field: "nama" | "kelas") => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
    return sortOrder === "asc" 
      ? <ArrowUp className="w-3.5 h-3.5" /> 
      : <ArrowDown className="w-3.5 h-3.5" />
  }

  const handleStudentClick = (studentId: string) => {
    router.push(`/students/${studentId}`)
  }

  return (
    <>
      <Card className="border-0 shadow-sm">
        {/* Header with Title, Nominal, and Export */}
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <CardTitle className="text-lg tracking-tight">Daftar Pembayaran Iuran</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Menampilkan {filteredStudents.length} santri - Tahun Ajaran {year}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Iuran:</span>
                <Input
                  type="number"
                  value={nominalInput}
                  onChange={(e) => setNominalInput(e.target.value)}
                  className="w-28 h-9 text-sm"
                />
                <Button onClick={handleNominalUpdate} variant="outline" size="sm" className="h-9">
                  Simpan
                </Button>
                <span className="text-sm font-semibold text-primary whitespace-nowrap">
                  Rp {Number.parseInt(nominalInput).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Filter Section */}
        <CardContent className="pb-4 border-b border-border/50">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-8 gap-3">
            <div className="col-span-2">
              <Input
                placeholder="Cari nama santri..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 text-sm"
              />
            </div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="h-9 px-3 py-1 rounded-lg border border-border bg-card text-foreground text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Semua Kelas</option>
              {classes.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
            <select
              value={monthRange.start}
              onChange={(e) => setMonthRange({ ...monthRange, start: Number.parseInt(e.target.value) })}
              className="h-9 px-3 py-1 rounded-lg border border-border bg-card text-foreground text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {MONTHS.map((m) => (
                <option key={m.num} value={m.num}>{m.name.substring(0, 3)}</option>
              ))}
            </select>
            <select
              value={monthRange.end}
              onChange={(e) => setMonthRange({ ...monthRange, end: Number.parseInt(e.target.value) })}
              className="h-9 px-3 py-1 rounded-lg border border-border bg-card text-foreground text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {MONTHS.map((m) => (
                <option key={m.num} value={m.num}>{m.name.substring(0, 3)}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number.parseInt(e.target.value))}
              className="h-9 px-3 py-1 rounded-lg border border-border bg-card text-foreground text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {Array.from({ length: 5 }, (_, i) => year - 2 + i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <Button
              onClick={() => {
                setSearchTerm("")
                setSelectedClass("")
                setMonthRange({ start: 1, end: 12 })
                setYear(new Date().getFullYear())
                setSortField("nama")
                setSortOrder("asc")
              }}
              variant="ghost"
              size="sm"
              className="h-9"
            >
              Reset
            </Button>
          </div>
          {/* Export Buttons */}
          <div className="flex gap-2 mt-3">
            <Button onClick={handleExportAll} variant="outline" size="sm" className="h-8 gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Export Semua
            </Button>
            <Button onClick={handleExportFiltered} variant="outline" size="sm" className="h-8 gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Export Tampil ({filteredStudents.length})
            </Button>
          </div>
        </CardContent>

        {/* Table */}
        <CardContent className="pt-4 overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                <TableHead className="font-semibold sticky left-0 bg-secondary/30 z-20 min-w-[200px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  <button
                    onClick={() => handleSort("nama")}
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <span>Nama santri</span>
                    {getSortIcon("nama")}
                  </button>
                </TableHead>
                <TableHead className="font-semibold sticky left-[200px] bg-secondary/30 z-20 min-w-[80px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  <button
                    onClick={() => handleSort("kelas")}
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <span>Kelas</span>
                    {getSortIcon("kelas")}
                  </button>
                </TableHead>
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
                    <TableCell className="font-medium sticky left-0 bg-card z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <button
                        onClick={() => handleStudentClick(student.id)}
                        className="text-primary hover:underline cursor-pointer"
                      >
                        {student.nama_lengkap}
                      </button>
                    </TableCell>
                    <TableCell className="sticky left-[200px] bg-card z-10 text-muted-foreground shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
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
                            className="w-5 h-5 rounded border-emerald-500 text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
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

      {confirmPayment &&
        (() => {
          const student = students.find((s) => s.id === confirmPayment.studentId)
          const monthName = MONTHS.find((m) => m.num === confirmPayment.month)?.name
          const nominal = Number.parseInt(nominalInput) || paymentConfig.nominal_default

          return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-md border-0 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-lg">{confirmPayment.isPaid ? "Batalkan Pembayaran" : "Konfirmasi Pembayaran"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-secondary/50 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Nama santri</span>
                      <span className="font-semibold">{student?.nama_lengkap}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Kelas</span>
                      <span className="font-medium">{student?.kelas}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Bulan</span>
                      <span className="font-medium">{monthName} {year}</span>
                    </div>
                    {!confirmPayment.isPaid && (
                      <div className="flex justify-between items-center pt-3 border-t border-border">
                        <span className="text-sm text-muted-foreground">Nominal</span>
                        <span className="font-bold text-lg text-primary">Rp {nominal.toLocaleString("id-ID")}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Tanggal Bayar</span>
                      {!confirmPayment.isPaid ? (
                        <Input
                          type="date"
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                          className="w-40 h-8 text-sm"
                        />
                      ) : (
                        <span className="font-medium">{new Date().toLocaleDateString("id-ID")}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button onClick={confirmPaymentToggle} className="flex-1 h-11 shadow-lg shadow-primary/20">
                      {confirmPayment.isPaid ? "Ya, Batalkan" : "Catat Pembayaran"}
                    </Button>
                    <Button onClick={() => setConfirmPayment(null)} variant="outline" className="flex-1 h-11">
                      Kembali
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })()}
    </>
  )
}
