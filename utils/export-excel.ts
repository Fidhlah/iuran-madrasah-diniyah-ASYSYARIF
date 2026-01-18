import * as XLSX from "xlsx"
import { saveAs } from "file-saver"
import { CLASS_ORDER } from "@/utils/class-order"

export function exportToExcel({
  data,
  filename,
  sheetName = "Data",
  origin = "B2"
}: {
  data: any[]
  filename: string
  sheetName?: string
  origin?: string
}) {
  // Pastikan data selalu array
  const safeData = Array.isArray(data) ? data.filter(Boolean) : []

  const worksheet = XLSX.utils.json_to_sheet([])
  XLSX.utils.sheet_add_json(worksheet, safeData, { origin, skipHeader: false })
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" })
  saveAs(blob, filename)
}

export function buildPaymentExportData({
  students,
  payments,
  visibleMonths,
  year,
  settings,
  classOrder,
}: {
  students: any[]
  payments: any[]
  visibleMonths: { num: number; name: string }[]
  year: number
  settings: any
  classOrder: string[]
}) {
  const sortedStudents = [...students].sort((a, b) => {
    const classA = classOrder.indexOf(a.class)
    const classB = classOrder.indexOf(b.class)
    if (classA !== classB) return classA - classB
    return a.name.localeCompare(b.name)
  })

  const rows = sortedStudents.flatMap((s) =>
    visibleMonths.map((month) => {
      const payment = payments.find(
        (p) =>
          p.student_id === s.id &&
          p.month === month.num &&
          p.year === year &&
          p.is_paid === true
      )
      if (!payment) return null
      return {
        "Nama Santri": s.name,
        "Kelas": s.class,
        "Bulan": month.name,
        "Tahun": year,
        "Nominal": payment?.amount || settings.monthly_fee || 0,
        "Tanggal Bayar": payment?.paid_at
          ? new Date(payment.paid_at).toLocaleDateString("id-ID")
          : "",
      }
    })
  ).filter(Boolean)
   .map((row, idx) => ({ No: idx + 1, ...row }))

  return rows
}

export function buildPaymentExportFilename({
  monthRange,
  year,
  MONTHS,
}: {
  monthRange: { start: number; end: number }
  year: number
  MONTHS: { num: number; name: string }[]
}) {
  const startMonthName = MONTHS.find(m => m.num === monthRange.start)?.name || ""
  const endMonthName = MONTHS.find(m => m.num === monthRange.end)?.name || ""
  if (monthRange.start === monthRange.end) {
    return `rekap_pembayaran_${startMonthName}_${year}.xlsx`
  } else {
    return `rekap_pembayaran_${startMonthName}-${endMonthName}_${year}.xlsx`
  }
}

export function buildStudentListExportData(students: any[]) {
  // Urutkan: tahun masuk, kelas (PAUD, TK, 1, 2), nama
  const sorted = [...students].sort((a, b) => {
    if (a.year_enrolled !== b.year_enrolled) return a.year_enrolled - b.year_enrolled
    const classA = CLASS_ORDER.indexOf(a.class)
    const classB = CLASS_ORDER.indexOf(b.class)
    if (classA !== classB) return classA - classB
    return a.name.localeCompare(b.name)
  })
  // Mapping ke format export
  return sorted.map((s, idx) => ({
    No: idx + 1,
    Nama: s.name,
    Kelas: s.class,
    "Tahun Masuk": s.year_enrolled,
  }))
}