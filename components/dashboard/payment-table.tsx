"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { ArrowUpDown, ArrowUp, ArrowDown, Download } from "lucide-react"

import { useStudents, usePayments, useSettings } from "@/hooks"

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
  const { students } = useStudents()
  const { payments, togglePayment } = usePayments()
  const { settings, updateSetting } = useSettings()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState("")
  const [monthRange, setMonthRange] = useState({ start: 1, end: 12 })
  const [year, setYear] = useState(new Date().getFullYear())
  const [sortField, setSortField] = useState<"nama" | "class">("nama")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [nominalInput, setNominalInput] = useState<string>("")
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0])

  const [showNonactive, setShowNonactive] = useState(false)

  const [confirmPayment, setConfirmPayment] = useState<{
    studentId: string
    month: number
    isPaid: boolean
  } | null>(null)

  const classes = useMemo(() => {
    return [...new Set(students.filter((s) => s.status).map((s) => s.class))].sort()
  }, [students])

  const filteredStudents = useMemo(() => {
  return students
    .filter((s) => showNonactive ? true : s.status === "active")
    .filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((s) => (selectedClass ? s.class === selectedClass : true))
    .sort((a, b) => {
      if (sortField === "nama") {
        return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      } else {
        const classCompare = a.class.localeCompare(b.class)
        if (classCompare !== 0) return sortOrder === "asc" ? classCompare : -classCompare
        return a.name.localeCompare(b.name)
      }
    })
}, [students, showNonactive, searchTerm, selectedClass, sortField, sortOrder])

  const visibleMonths = MONTHS.filter((m) => m.num >= monthRange.start && m.num <= monthRange.end)

  const hasPayment = (studentId: string, month: number, yr: number) => {
    return payments.some((p) => p.student_id === studentId && p.month === month && p.year === yr && p.is_paid === true)
  }

  const handlePaymentToggle = (studentId: string, month: number, currentState: boolean) => {
    setPaymentDate(new Date().toISOString().split("T")[0])
    setConfirmPayment({ studentId, month, isPaid: currentState })
  }

  const confirmPaymentToggle = async () => {
    if (!confirmPayment) return

    const student = students.find((s) => s.id === confirmPayment.studentId)
    const monthName = MONTHS.find((m) => m.num === confirmPayment.month)?.name
    const nominal = Number.parseInt(nominalInput) || Number.parseInt(settings.monthly_fee) || 50000

    try {
      if (confirmPayment.isPaid) {
        // Logika Pembatalan (Void)
        await togglePayment({
          studentId: confirmPayment.studentId,
          month: confirmPayment.month,
          year,
          amount: nominal,
          isPaid: false,
          paidAt: null,
        })
        toast({ title: "Berhasil", description: `Pembayaran ${student?.name} bulan ${monthName} dibatalkan` })
      } else {
        // Logika Simpan Pembayaran
        await togglePayment({
          studentId: confirmPayment.studentId,
          month: confirmPayment.month,
          year,
          amount: nominal,
          isPaid: true,
          paidAt: paymentDate,
        })
        toast({ title: "Berhasil", description: `Pembayaran ${student?.name} bulan ${monthName} tercatat` })
      }
    } catch (error) {
      toast({ title: "Error", description: "Gagal memproses data", variant: "destructive" })
    } finally {
      setConfirmPayment(null)
    }
  }

  const handleNominalUpdate = () => {
    const nominal = Number.parseInt(nominalInput) || Number.parseInt(settings.monthly_fee) || 50000
    if (nominal > 0) {
      updateSetting("monthly_fee", nominal.toString())
      toast({ title: "Berhasil", description: `Nominal diubah menjadi Rp ${nominal.toLocaleString("id-ID")}` })
    }
  }

  const handleSort = (field: "nama" | "class") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const getSortIcon = (field: "nama" | "class") => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
    return sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
  }

  return (
    <>
      <Card className="border-0 shadow-sm">
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
                <span className="text-sm text-muted-foreground">Iuran:</span>
                <Input
                  type="number"
                  placeholder={settings.monthly_fee}
                  value={nominalInput}
                  onChange={(e) => setNominalInput(e.target.value)}
                  className="w-28 h-9 text-sm"
                />
                <Button onClick={handleNominalUpdate} variant="outline" size="sm" className="h-9">Simpan</Button>
              </div>
            </div>
          </div>
        </CardHeader>

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
              className="h-9 px-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Semua Kelas</option>
              {classes.map((cls) => (<option key={cls} value={cls}>{cls}</option>))}
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
                setSearchTerm(""); setSelectedClass(""); setMonthRange({ start: 1, end: 12 });
                setYear(new Date().getFullYear()); setSortField("nama"); setSortOrder("asc");
              }}
              variant="ghost" size="sm" className="h-9"
            >
              Reset
            </Button>
          </div>
        </CardContent>

        <CardContent className="pt-4 overflow-x-auto">
          <div className="flex items-center mb-2">
          <input
            type="checkbox"
            id="show-nonactive"
            checked={showNonactive}
            onChange={(e) => setShowNonactive(e.target.checked)}
            className="mr-2 accent-emerald-500"
          />
          <label htmlFor="show-nonactive" className="text-sm select-none cursor-pointer">
            Tampilkan santri nonaktif
          </label>
        </div>
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead
                  className="bg-secondary/40 text-center font-bold text-lg"
                  colSpan={2 + visibleMonths.length}
                >
                  Tahun {year}
                </TableHead>
              </TableRow>
              <TableRow className="bg-secondary/30">
                <TableHead className="font-semibold min-w-[200px]">
                  <button onClick={() => handleSort("nama")} className="flex items-center gap-2">
                    <span>Nama santri</span> {getSortIcon("nama")}
                  </button>
                </TableHead>
                <TableHead className="font-semibold min-w-[80px]">
                  <span>Kelas</span>
                </TableHead>
                {visibleMonths.map((month) => (
                  <TableHead key={month.num} className="font-semibold text-center text-xs">
                    {month.name.substring(0, 3)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id} className="hover:bg-accent/5">
                  <TableCell className="font-medium ">
                    <button onClick={() => router.push(`/students/${student.id}`)} className="text-primary hover:underline">
                      {student.name}
                    </button>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {student.class}
                  </TableCell>
                  {visibleMonths.map((month) => {
                    const isPaid = hasPayment(student.id, month.num, year)
                    return (
                      <TableCell key={month.num} className="text-center">
                        <input
                          type="checkbox"
                          checked={isPaid}
                          onChange={() => handlePaymentToggle(student.id, month.num, isPaid)}
                          className="w-5 h-5 cursor-pointer accent-emerald-500"
                        />
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {confirmPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-0 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-lg">{confirmPayment.isPaid ? "Batalkan Pembayaran" : "Konfirmasi Pembayaran"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-secondary/50 p-4 rounded-xl space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Nama</span>
                  <span className="font-semibold">{students.find(s => s.id === confirmPayment.studentId)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Bulan</span>
                  <span className="font-medium">{MONTHS.find(m => m.num === confirmPayment.month)?.name} {year}</span>
                </div>
                {!confirmPayment.isPaid && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tanggal</span>
                    <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="w-40 h-8 text-sm" />
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={confirmPaymentToggle} className="flex-1">
                  {confirmPayment.isPaid ? "Ya, Batalkan" : "Catat Pembayaran"}
                </Button>
                <Button onClick={() => setConfirmPayment(null)} variant="outline" className="flex-1">Batal</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}