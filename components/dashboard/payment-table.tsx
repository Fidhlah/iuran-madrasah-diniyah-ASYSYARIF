"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { ArrowUpDown, ArrowUp, ArrowDown, Download } from "lucide-react"
import * as XLSX from "xlsx"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useEffect } from "react"
import { saveAs } from "file-saver"
import { buildPaymentExportData, exportToExcel, buildPaymentExportFilename } from "@/utils/export-excel"
import { useStudents, usePayments, useSettings } from "@/hooks"
import { MONTHS } from "@/utils/months"
import { CLASS_ORDER } from "@/utils/class-order"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

export default function PaymentTable() {
  const router = useRouter()
  const { students, loading:studentsLoading } = useStudents()
  const { settings, updateSetting } = useSettings()
  const [isConfirmLoading, setIsConfirmLoading] = useState(false)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState("all")
  const [monthRange, setMonthRange] = useState({ start: 1, end: 12 })
  const [year, setYear] = useState(new Date().getFullYear())
  const { payments,fetchPayments, togglePayment, loading:paymentsLoading } = usePayments(year)
  const isLoading = studentsLoading || paymentsLoading
  const { toast } = useToast()
  const [sortField, setSortField] = useState<"nama" | "class">("nama")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [nominalInput, setNominalInput] = useState<string>("")
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0])
  const [showFilter, setShowFilter] = useState(false)

  const [showNonactive, setShowNonactive] = useState(false)

  const [confirmPayment, setConfirmPayment] = useState<{
    studentId: string
    month: number
    isPaid: boolean
  } | null>(null)

  useEffect(() => {
    fetchPayments(year)
  }, [year, fetchPayments])

  const classes = useMemo(() => {
    return [...new Set(students.filter((s) => s.status).map((s) => s.class))].sort()
  }, [students])

  

  const filteredStudents = useMemo(() => {
  return students
    .filter((s) => showNonactive ? true : s.status === "active")
    .filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((s) => (selectedClass === "all" ? true : s.class === selectedClass))
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

const exportAll = () => {
  const data = buildPaymentExportData({students: filteredStudents, payments, visibleMonths, year, settings, classOrder: CLASS_ORDER,})
  exportToExcel({data, filename: `rekap_pembayaran_${year}.xlsx`, sheetName: "Rekap Pembayaran", origin: "B2"})
}

const exportFiltered = () => {
  const data = buildPaymentExportData({ students: filteredStudents, payments, visibleMonths, year, settings, classOrder: CLASS_ORDER,})
  exportToExcel({ data, filename: buildPaymentExportFilename({ monthRange, year, MONTHS }), sheetName: "Rekap Pembayaran", origin: "B2" })
}
  const confirmPaymentToggle = async () => {
    if (!confirmPayment) return
    setIsConfirmLoading(true)

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
      setIsConfirmLoading(false)
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
        {/* Search bar tetap di atas */}
        <div className="sm:hidden mb-2">
          <Input
            placeholder="Cari nama santri..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 text-sm"
          />
        </div>
        {/* Tombol Filter & Reset di bawah search bar */}
        <div className="flex sm:hidden gap-2 mb-3">
          <Button
            onClick={() => setShowFilter(true)}
            variant="outline"
            className="flex-1"
          >
            Filter
          </Button>
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
            className="flex-1"
          >
            Reset
          </Button>
        </div>
          <div className="hidden sm:grid grid-cols-3 md:grid-cols-8 gap-3 mb-3">
            <div className="col-span-2">
              <Input
                placeholder="Cari nama santri..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 text-sm"
              />
            </div>

            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="Semua Kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(monthRange.start)} onValueChange={val => setMonthRange({ ...monthRange, start: Number(val) })}>
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="Bulan Awal" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.num} value={String(m.num)}>{m.name.substring(0, 3)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(monthRange.end)}
              onValueChange={val => setMonthRange({ ...monthRange, end: Number(val) })}
            >
              <SelectTrigger className="flex-1 h-9">
                <SelectValue placeholder="Bulan Akhir" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.num} value={String(m.num)}>
                    {m.name.substring(0, 3)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
                value={String(year)}
                onValueChange={val => setYear(Number(val))}
              >
                <SelectTrigger className="w-full h-9">
                  <SelectValue placeholder="Tahun" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(
                    { length: (new Date().getFullYear() + 3) - 2025 + 1 },
                    (_, i) => 2025 + i
                  ).map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          <div className="flex flex-col sm:flex-row sm:items-center mb-2 gap-2 sm:gap-0 sm:justify-between">
            <div className="flex gap-2 order-2 sm:order-1">
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
            <div className="flex gap-2 order-1 sm:order-2">
              <Button onClick={exportAll} size="sm" variant="outline" className="gap-2">
                <Download className="w-4 h-4" /> Export 1 Tahun
              </Button>
              <Button onClick={exportFiltered} size="sm" variant="outline" className="gap-2">
                <Download className="w-4 h-4" /> Export Data Tampil
              </Button>
            </div>
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
            {isLoading ? (
              // Tampilkan 5 baris skeleton sebagai contoh
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  {visibleMonths.map((month) => (
                    <TableCell key={month.num}>
                      <Skeleton className="h-5 w-5 mx-auto" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              filteredStudents.map((student) => (
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
                    const payment = payments.find(
                      (p) =>
                        p.student_id === student.id &&
                        p.month === month.num &&
                        p.year === year &&
                        p.is_paid === true
                    )
                    const isPaid = !!payment

                    return (
                      <TableCell key={month.num} className="text-center">
                        {isPaid ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <input
                                  type="checkbox"
                                  checked
                                  readOnly
                                  className="w-5 h-5 cursor-pointer accent-emerald-500"
                                  onClick={() => handlePaymentToggle(student.id, month.num, isPaid)}

                                />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs bg-gray-200 dark:bg-gray-800 text-foreground border-none shadow-md">
                                <div>
                                  <div>
                                    <span className="font-semibold">Nominal:</span>{" "}
                                    Rp {payment.amount.toLocaleString("id-ID")}
                                  </div>
                                  <div>
                                    <span className="font-semibold">Tanggal:</span>{" "}
                                    {payment.paid_at
                                      ? new Date(payment.paid_at).toLocaleDateString("id-ID")
                                      : "-"}
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={() => handlePaymentToggle(student.id, month.num, isPaid)}
                            className="w-5 h-5 cursor-pointer accent-emerald-500"
                          />
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
          </Table>
        </CardContent>
        {showFilter && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
            <div className="bg-white dark:bg-background rounded-xl p-6 w-[90vw] max-w-sm shadow-lg">
              <div className="mb-4 font-semibold text-lg">Filter Data</div>
              <div className="space-y-3">
                {/* Filter Kelas */}
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Semua Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kelas</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Filter Bulan */}
                <div className="flex gap-2">
                  <Select
                    value={String(monthRange.start)}
                    onValueChange={val => setMonthRange({ ...monthRange, start: Number(val) })}
                  >
                    <SelectTrigger className="flex-1 h-9">
                      <SelectValue placeholder="Bulan Awal" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m.num} value={String(m.num)}>
                          {m.name.substring(0, 3)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={String(monthRange.end)}
                    onValueChange={val => setMonthRange({ ...monthRange, end: Number(val) })}
                  >
                    <SelectTrigger className="flex-1 h-9">
                      <SelectValue placeholder="Bulan Akhir" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m.num} value={String(m.num)}>
                          {m.name.substring(0, 3)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Filter Tahun */}
                <Select
                  value={String(year)}
                  onValueChange={val => setYear(Number(val))}
                >
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(
                      { length: (new Date().getFullYear() + 3) - 2025 + 1 },
                      (_, i) => 2025 + i
                    ).map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="ghost"
                  onClick={() => setShowFilter(false)}
                >
                  Tutup
                </Button>
                <Button
                  onClick={() => setShowFilter(false)}
                >
                  Terapkan
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {confirmPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-0 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-lg">{confirmPayment.isPaid ? "Batalkan Pembayaran" : "Konfirmasi Pembayaran"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-secondary/50 p-4 rounded-xl">
                <div className="flex justify-between mb-4">
                  <div>
                    <span className="block text-xs text-muted-foreground">Nama</span>
                    <span className="font-semibold">{students.find(s => s.id === confirmPayment.studentId)?.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs text-muted-foreground">Kelas</span>
                    <span className="font-semibold">{students.find(s => s.id === confirmPayment.studentId)?.class}</span>
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <span className="block text-xs text-muted-foreground">Bulan</span>
                    <span className="font-medium">{MONTHS.find(m => m.num === confirmPayment.month)?.name} {year}</span>
                  </div>
                  {!confirmPayment.isPaid && (
                    <div className="text-right">
                      <span className="block text-xs text-muted-foreground">Tanggal</span>
                      <Input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-40 h-8 text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={confirmPaymentToggle}
                  className="flex-1"
                  disabled={isConfirmLoading}
                >
                  {isConfirmLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Memproses...
                    </span>
                  ) : (
                    confirmPayment.isPaid ? "Ya, Batalkan" : "Catat Pembayaran"
                  )}
                </Button>
                <Button
                  onClick={() => setConfirmPayment(null)}
                  variant="outline"
                  className="flex-1"
                  disabled={isConfirmLoading}
                >
                  Batal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}