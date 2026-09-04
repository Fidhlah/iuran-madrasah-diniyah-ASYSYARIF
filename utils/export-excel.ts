import * as XLSX from "xlsx"
import { saveAs } from "file-saver"
import { CLASS_ORDER } from "@/utils/class-order"
import { INACTIVE_REASONS } from "@/types/models"

const CATEGORY_LABEL: Record<string, string> = {
    kas_mesjid: "Kas Mesjid",
    honor_guru: "Honor Guru",
    operasional: "Operasional",
    lainnya: "Lainnya",
}

export function exportToExcel({
  data,
  filename,
  sheetName = "Data",
  origin = "B2",
  analyticsSummary,
}: {
  data: any[]
  filename: string
  sheetName?: string
  origin?: string
  analyticsSummary?: any[]
}) {
  // Pastikan data selalu array
  const safeData = Array.isArray(data) ? data.filter(Boolean) : []

  const worksheet = XLSX.utils.json_to_sheet([])
  XLSX.utils.sheet_add_json(worksheet, safeData, { origin, skipHeader: false })

  // Add analytics summary below the main data if provided
  if (analyticsSummary && analyticsSummary.length > 0) {
    // Calculate where to place the summary (2 rows below the data table)
    const startRow = parseInt(origin.replace(/[A-Z]/g, "")) // Get row number from origin like "B2" -> 2
    const dataEndRow = startRow + safeData.length + 1 // +1 for header
    const summaryStartRow = dataEndRow + 3 // 2 empty rows gap

    XLSX.utils.sheet_add_json(worksheet, analyticsSummary, {
      origin: `B${summaryStartRow}`,
      skipHeader: false
    })
  }

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" })
  saveAs(blob, filename)
}

export function buildPaymentAnalyticsSummary({
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
  const monthlyFee = Number(settings?.monthly_fee) || 50000

  // Separate active and nonactive students
  const activeStudents = students.filter(s => s.status === "active")
  const nonactiveStudents = students.filter(s => s.status !== "active")

  // Group ACTIVE students by class
  const classSummary = classOrder
    .filter(cls => activeStudents.some(s => s.class === cls))
    .map(cls => {
      const classStudents = activeStudents.filter(s => s.class === cls)
      const studentCount = classStudents.length

      let paidCount = 0
      let unpaidCount = 0

      classStudents.forEach(student => {
        visibleMonths.forEach(month => {
          const hasPaid = payments.some(
            p => p.student_id === student.id &&
              p.month === month.num &&
              p.year === year &&
              p.is_paid === true
          )
          if (hasPaid) {
            paidCount++
          } else {
            unpaidCount++
          }
        })
      })

      const totalPaid = paidCount * monthlyFee

      return {
        "Kelas": cls,
        "Jumlah Murid": studentCount,
        "Iuran/Siswa (Rp)": monthlyFee,
        "Sudah Bayar": paidCount,
        "Belum Bayar": unpaidCount,
        "Total (Rp)": totalPaid,
      }
    })

  // Add TOTAL row (active only)
  const totalRow = {
    "Kelas": "TOTAL:",
    "Jumlah Murid": classSummary.reduce((sum, row) => sum + row["Jumlah Murid"], 0),
    "Iuran/Siswa (Rp)": "",
    "Sudah Bayar": classSummary.reduce((sum, row) => sum + row["Sudah Bayar"], 0),
    "Belum Bayar": classSummary.reduce((sum, row) => sum + row["Belum Bayar"], 0),
    "Total (Rp)": classSummary.reduce((sum, row) => sum + row["Total (Rp)"], 0),
  }

  const result: any[] = [...classSummary, totalRow]

  // Count payments from NONACTIVE students
  let nonactivePaidCount = 0
  nonactiveStudents.forEach(student => {
    visibleMonths.forEach(month => {
      const hasPaid = payments.some(
        p => p.student_id === student.id &&
          p.month === month.num &&
          p.year === year &&
          p.is_paid === true
      )
      if (hasPaid) nonactivePaidCount++
    })
  })

  // Add reconciliation rows only if nonactive students have paid
  if (nonactivePaidCount > 0) {
    const nonactiveTotalPaid = nonactivePaidCount * monthlyFee

    result.push({
      "Kelas": "+ Nonaktif",
      "Jumlah Murid": "",
      "Iuran/Siswa (Rp)": "",
      "Sudah Bayar": nonactivePaidCount,
      "Belum Bayar": "",
      "Total (Rp)": nonactiveTotalPaid,
    })

    result.push({
      "Kelas": "GRAND TOTAL:",
      "Jumlah Murid": "",
      "Iuran/Siswa (Rp)": "",
      "Sudah Bayar": (totalRow["Sudah Bayar"] as number) + nonactivePaidCount,
      "Belum Bayar": "",
      "Total (Rp)": (totalRow["Total (Rp)"] as number) + nonactiveTotalPaid,
    })
  }

  return result
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
        "Status": s.status === "active"
          ? "Aktif"
          : `Nonaktif${s.inactive_reason ? ` (${INACTIVE_REASONS.find(r => r.value === s.inactive_reason)?.label || s.inactive_reason})` : ""}`,
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

// ===== FINANCE EXPORT =====

export function buildFinanceExportData(finances: any[]) {
  // Sort by date descending
  const sorted = [...finances].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return sorted.map((f, idx) => ({
    No: idx + 1,
    Tanggal: new Date(f.date).toLocaleDateString("id-ID"),
    Jenis: f.type === "income" ? "Pemasukan" : "Pengeluaran",
    Kategori: (f.category && CATEGORY_LABEL[f.category]) || f.category || "—",
    Keterangan: f.description || "-",
    Jumlah: Number(f.amount),
  }))
}

export function buildFinanceExportFilename({
  isFiltered,
  typeFilter,
  year,
  monthStart,
  monthEnd,
  MONTHS,
}: {
  isFiltered: boolean
  typeFilter?: "all" | "income" | "expense"
  year?: number
  monthStart?: number | null
  monthEnd?: number | null
  MONTHS: { num: number; name: string }[]
}) {
  if (!isFiltered) {
    return `keuangan_semua.xlsx`
  }

  // Get month names (default to Jan-Des if not specified)
  const startName = monthStart
    ? MONTHS.find(m => m.num === monthStart)?.name || "Jan"
    : "Jan"
  const endName = monthEnd
    ? MONTHS.find(m => m.num === monthEnd)?.name || "Des"
    : "Des"

  // Build month part
  const monthPart = startName === endName ? startName : `${startName}-${endName}`

  // Build year part
  const yearPart = year || new Date().getFullYear()

  // Format: keuangan_[bulan awal]-[bulan akhir]_[tahun]
  return `keuangan_${monthPart}_${yearPart}.xlsx`
}

export function buildFinanceAnalyticsSummary({
  allFinances,
  filteredFinances,
  year,
  monthStart,
  monthEnd,
  MONTHS,
}: {
  allFinances: any[]
  filteredFinances: any[]
  year: number
  monthStart: number | null
  monthEnd: number | null
  MONTHS: { num: number; name: string }[]
}) {
  // Calculate "Saldo Awal" - all income-expenses BEFORE the filter period
  const filterStartMonth = monthStart || 1
  const beforeFilterData = allFinances.filter((f: any) => {
    const fDate = new Date(f.date)
    const fYear = fDate.getFullYear()
    const fMonth = fDate.getMonth() + 1
    // Before filter year, OR same year but before filter start month
    return fYear < year || (fYear === year && fMonth < filterStartMonth)
  })

  const saldoAwalIncome = beforeFilterData
    .filter(f => f.type === "income")
    .reduce((sum, f) => sum + Number(f.amount), 0)
  const saldoAwalExpense = beforeFilterData
    .filter(f => f.type === "expense")
    .reduce((sum, f) => sum + Number(f.amount), 0)
  const saldoAwal = saldoAwalIncome - saldoAwalExpense

  // Calculate totals from filtered data
  let totalPemasukan = 0
  let totalPengeluaran = 0

  let sppBulanIni = 0
  let sppTitipan = 0
  let sppTunggakan = 0
  let infaqDanLainnya = 0

  // Breakdown pengeluaran per kategori
  const expenseByCategory: Record<string, number> = {
    kas_mesjid: 0,
    honor_guru: 0,
    operasional: 0,
    lainnya: 0,
  }

  // Build target month names and indices for comparison
  const targetMonths: string[] = []
  const targetMonthIndices: number[] = []

  if (monthStart && monthEnd) {
    for (let i = monthStart; i <= monthEnd; i++) {
      const m = MONTHS.find(m => m.num === i)
      if (m) {
        targetMonths.push(m.name.toLowerCase())
        targetMonthIndices.push(i)
      }
    }
  } else if (monthStart) {
    const m = MONTHS.find(m => m.num === monthStart)
    if (m) {
      targetMonths.push(m.name.toLowerCase())
      targetMonthIndices.push(monthStart)
    }
  } else {
    MONTHS.forEach(m => {
      targetMonths.push(m.name.toLowerCase())
      targetMonthIndices.push(m.num)
    })
  }

  // Get the primary target month index (used as a baseline if it's a single month)
  // If viewing "All months", we won't try to guess Titipan vs Tunggakan cleanly inside the loop 
  // without looking at the transaction date, but we'll do our best based on the text.
  // The most common use case is pulling a single month report like "Februari".
  const primaryTargetMonthIndex = monthStart || 1

  filteredFinances.forEach(f => {
    const amount = Number(f.amount)
    if (f.type === "income") {
      totalPemasukan += amount

      const desc = (f.description || "").toLowerCase()
      // Rule 1: Infaq / Shadaqah -> Lainnya
      if (desc.includes("infaq") || desc.includes("shadaqah") || desc.includes("sodaqoh") || desc.includes("donasi")) {
        infaqDanLainnya += amount
      }
      // Rule 2: Pembayaran SPP -> cek apakah untuk bulan target atau bukan
      else if (desc.includes("membayar iuran bulan")) {
        // Check if any of the target months are mentioned in the description
        const isBulanIni = targetMonths.some(m => desc.includes(m)) && desc.includes(year.toString())

        if (isBulanIni) {
          sppBulanIni += amount
        } else {
          // Determine if Titipan (Future) or Tunggakan (Past)
          // Find which month is mentioned in the description
          let mentionedMonthIndex = -1
          MONTHS.forEach(m => {
            if (desc.includes(m.name.toLowerCase())) {
              mentionedMonthIndex = m.num
            }
          })

          if (mentionedMonthIndex !== -1) {
            // Compare mentioned month to the primary reporting month
            // Example: Reporting Feb (2). Payment for Mar (3). 3 > 2 => Titipan
            if (mentionedMonthIndex > primaryTargetMonthIndex) {
              sppTitipan += amount
            } else {
              sppTunggakan += amount
            }
          } else {
            // If we can't parse the month name, safely put it in Tunggakan
            sppTunggakan += amount
          }
        }
      }
      // Rule 3: Uncategorized income -> Lainnya
      else {
        infaqDanLainnya += amount
      }
    } else if (f.type === "expense") {
      totalPengeluaran += amount
      const cat = f.category || "lainnya"
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + amount
    }
  })

  const saldoAkhir = saldoAwal + totalPemasukan - totalPengeluaran

  // Build period label
  const startName = monthStart ? MONTHS.find(m => m.num === monthStart)?.name || "" : "Jan"
  const endName = monthEnd ? MONTHS.find(m => m.num === monthEnd)?.name || "" : "Des"
  const periodLabel = startName === endName
    ? `${startName} ${year}`
    : `${startName}-${endName} ${year}`

  const result = [
    { "Keterangan": `Saldo Awal (sebelum ${startName} ${year})`, "Jumlah (Rp)": saldoAwal },
  ]

  // Only show breakdown if there's actually Pemasukan to breakdown, making it cleaner
  if (totalPemasukan > 0) {
    if (sppBulanIni > 0) result.push({ "Keterangan": `  ↳ SPP Bulan Ini (${periodLabel})`, "Jumlah (Rp)": sppBulanIni })
    if (sppTunggakan > 0) result.push({ "Keterangan": `  ↳ SPP Tunggakan (Bayar cicilan/tunggakan pelunasan bulan lalu)`, "Jumlah (Rp)": sppTunggakan })
    if (sppTitipan > 0) result.push({ "Keterangan": `  ↳ SPP Titipan (Bayar lebih awal untuk bulan depan)`, "Jumlah (Rp)": sppTitipan })
    if (infaqDanLainnya > 0) result.push({ "Keterangan": `  ↳ Infaq & Pemasukan Lainnya`, "Jumlah (Rp)": infaqDanLainnya })
  }

  result.push(
    { "Keterangan": `Total Pemasukan (${periodLabel})`, "Jumlah (Rp)": totalPemasukan },
    { "Keterangan": `Total Pengeluaran (${periodLabel})`, "Jumlah (Rp)": totalPengeluaran },
    { "Keterangan": `Saldo Akhir`, "Jumlah (Rp)": saldoAkhir }
  )

  // Rincian pengeluaran per kategori (hanya bila ada)
  const CATEGORY_LABEL_rincian: Record<string, string> = {
    kas_mesjid: "Kas Mesjid",
    honor_guru: "Honor Guru",
    operasional: "Operasional",
    lainnya: "Lainnya",
  }
  const EXPENSE_ORDER = ["kas_mesjid", "honor_guru", "operasional", "lainnya"]
  const expenseRows = EXPENSE_ORDER
    .filter(c => (expenseByCategory[c] || 0) > 0)
    .map(c => ({ "Keterangan": `  ↳ ${CATEGORY_LABEL_rincian[c] || c}`, "Jumlah (Rp)": expenseByCategory[c] }))
  result.splice(result.length - 1, 0, ...expenseRows)

  return result

  return result
}