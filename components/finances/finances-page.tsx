"use client"

import { useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"
import { useFinances } from "@/hooks/swr-use-finances"
import { buildFinanceExportData, buildFinanceExportFilename, exportToExcel, buildFinanceAnalyticsSummary } from "@/utils/export-excel"
import { MONTHS } from "@/utils/months"
import { Download, RotateCcw } from "lucide-react"
import FinancesAnalyticCards from "./finances-analytic-cards"
import FinancesTable from "./finances-table"
import FinancesFormModal from "./finances-form-modal"
import type { Finance } from "@/types/models"

export default function FinancesPage() {
    // State
    const [search, setSearch] = useState("")
    const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all")
    const [yearFilter, setYearFilter] = useState(new Date().getFullYear())
    const [monthStart, setMonthStart] = useState<number | null>(null)
    const [monthEnd, setMonthEnd] = useState<number | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [showFilterModal, setShowFilterModal] = useState(false)
    const [sortField, setSortField] = useState<"date" | "amount">("date")
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: currentYear - 2024 + 2 }, (_, i) => 2025 + i)

    // Fetch data
    const { finances, loading, summary, createFinance, deleteFinance } = useFinances()

    // Filter data
    const filteredData = useMemo(() => {
        return finances.filter((f: Finance) => {
            // Type filter
            if (typeFilter !== "all" && f.type !== typeFilter) return false

            // Year filter
            const fDate = new Date(f.date)
            if (fDate.getFullYear() !== yearFilter) return false

            // Month range filter
            const fMonth = fDate.getMonth() + 1
            if (monthStart !== null && fMonth < monthStart) return false
            if (monthEnd !== null && fMonth > monthEnd) return false

            // Search filter
            if (search && !(f.description || "").toLowerCase().includes(search.toLowerCase())) {
                return false
            }

            return true
        })
    }, [finances, typeFilter, yearFilter, monthStart, monthEnd, search])

    // Sort data
    const sortedData = useMemo(() => {
        return [...filteredData].sort((a, b) => {
            let aVal: number
            let bVal: number

            if (sortField === "date") {
                aVal = new Date(a.date).getTime()
                bVal = new Date(b.date).getTime()
            } else {
                aVal = Number(a.amount)
                bVal = Number(b.amount)
            }

            return sortDirection === "asc" ? aVal - bVal : bVal - aVal
        })
    }, [filteredData, sortField, sortDirection])

    // Current month summary (for analytic cards)
    const currentMonth = new Date().getMonth() + 1
    const monthlySummary = useMemo(() => {
        // Current month data
        const thisMonthData = finances.filter((f: Finance) => {
            const fDate = new Date(f.date)
            return fDate.getMonth() + 1 === currentMonth && fDate.getFullYear() === currentYear
        })

        // All data BEFORE current month (cumulative previous balance)
        const beforeCurrentMonthData = finances.filter((f: Finance) => {
            const fDate = new Date(f.date)
            const fYear = fDate.getFullYear()
            const fMonth = fDate.getMonth() + 1
            // Before current year, or same year but before current month
            return fYear < currentYear || (fYear === currentYear && fMonth < currentMonth)
        })

        const thisIncome = thisMonthData.filter(f => f.type === "income").reduce((sum, f) => sum + Number(f.amount), 0)
        const thisExpense = thisMonthData.filter(f => f.type === "expense").reduce((sum, f) => sum + Number(f.amount), 0)
        const prevIncome = beforeCurrentMonthData.filter(f => f.type === "income").reduce((sum, f) => sum + Number(f.amount), 0)
        const prevExpense = beforeCurrentMonthData.filter(f => f.type === "expense").reduce((sum, f) => sum + Number(f.amount), 0)
        const previousMonthBalance = prevIncome - prevExpense

        return {
            totalIncome: thisIncome,
            totalExpense: thisExpense,
            balance: previousMonthBalance + thisIncome - thisExpense,
            previousMonthBalance: previousMonthBalance,
        }
    }, [finances, currentMonth, currentYear])

    // Handle sort
    const handleSort = (field: "date" | "amount") => {
        if (sortField === field) {
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
        } else {
            setSortField(field)
            setSortDirection("desc")
        }
    }

    // Handle submit
    const handleSubmit = async (data: {
        date: string
        type: "income" | "expense"
        amount: number
        description: string
    }) => {
        await createFinance(data)
    }

    // Handle delete
    const confirmDelete = async () => {
        if (!deletingId) return
        setIsDeleting(true)
        try {
            await deleteFinance(deletingId)
        } finally {
            setIsDeleting(false)
            setDeletingId(null)
        }
    }

    const handleDelete = (id: string) => {
        setDeletingId(id)
    }

    // Handle reset filters
    const handleReset = () => {
        setSearch("")
        setTypeFilter("all")
        setYearFilter(new Date().getFullYear())
        setMonthStart(null)
        setMonthEnd(null)
    }

    // Export handlers
    const handleExportAll = () => {
        const data = buildFinanceExportData(finances)
        const filename = buildFinanceExportFilename({ isFiltered: false, MONTHS })
        exportToExcel({ data, filename, sheetName: "Keuangan" })
    }

    const handleExportFiltered = () => {
        const data = buildFinanceExportData(sortedData)
        const filename = buildFinanceExportFilename({
            isFiltered: true,
            typeFilter,
            year: yearFilter,
            monthStart,
            monthEnd,
            MONTHS,
        })
        const analyticsSummary = buildFinanceAnalyticsSummary({
            allFinances: finances,
            filteredFinances: sortedData,
            year: yearFilter,
            monthStart,
            monthEnd,
            MONTHS,
        })
        exportToExcel({ data, filename, sheetName: "Keuangan", analyticsSummary })
    }

    return (
        <>
            <FinancesAnalyticCards
                totalIncome={monthlySummary.totalIncome}
                totalExpense={monthlySummary.totalExpense}
                balance={monthlySummary.balance}
                previousMonthBalance={monthlySummary.previousMonthBalance}
                currentMonth={currentMonth}
                currentYear={currentYear}
                loading={loading}
            />

            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <CardTitle>Data Keuangan</CardTitle>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleExportAll}>
                                <Download className="h-4 w-4 mr-1" />
                                Export Semua
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleExportFiltered}>
                                <Download className="h-4 w-4 mr-1" />
                                Export Filter
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Mobile: Search bar + Filter/Reset buttons */}
                    <div className="sm:hidden space-y-2 mb-4">
                        <Input
                            placeholder="Cari keterangan..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-9"
                        />
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setShowFilterModal(true)}
                            >
                                Filter
                            </Button>
                            <Button
                                variant="ghost"
                                className="flex-1"
                                onClick={handleReset}
                            >
                                Reset
                            </Button>
                            <Button onClick={() => setShowModal(true)} className="flex-1">
                                + Tambah
                            </Button>
                        </div>
                    </div>

                    {/* Desktop: Inline filters */}
                    <div className="hidden sm:flex flex-row items-center justify-between gap-4 mb-4">
                        <div className="flex flex-row gap-2 flex-wrap">
                            <Input
                                placeholder="Cari keterangan..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-48 h-9"
                            />
                            <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val as "all" | "income" | "expense")}>
                                <SelectTrigger className="w-36 h-9">
                                    <SelectValue placeholder="Semua Jenis" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Jenis</SelectItem>
                                    <SelectItem value="income">Pemasukan</SelectItem>
                                    <SelectItem value="expense">Pengeluaran</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={String(yearFilter)} onValueChange={(val) => setYearFilter(Number(val))}>
                                <SelectTrigger className="w-24 h-9">
                                    <SelectValue placeholder="Tahun" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map((y) => (
                                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={monthStart === null ? "all" : String(monthStart)}
                                onValueChange={(val) => setMonthStart(val === "all" ? null : Number(val))}
                            >
                                <SelectTrigger className="w-28 h-9">
                                    <SelectValue placeholder="Dari" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Dari</SelectItem>
                                    {MONTHS.map((m) => (
                                        <SelectItem key={m.num} value={String(m.num)}>{m.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={monthEnd === null ? "all" : String(monthEnd)}
                                onValueChange={(val) => setMonthEnd(val === "all" ? null : Number(val))}
                            >
                                <SelectTrigger className="w-28 h-9">
                                    <SelectValue placeholder="Sampai" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Sampai</SelectItem>
                                    {MONTHS.map((m) => (
                                        <SelectItem key={m.num} value={String(m.num)}>{m.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="sm" onClick={handleReset} className="h-9">
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button onClick={() => setShowModal(true)}>
                            + Tambah Data
                        </Button>
                    </div>

                    <FinancesTable
                        data={sortedData}
                        loading={loading}
                        onDelete={handleDelete}
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                    />
                </CardContent>
            </Card>

            {/* Mobile Filter Modal */}
            {showFilterModal && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
                    <div className="bg-white dark:bg-background rounded-xl p-6 w-[90vw] max-w-sm shadow-lg">
                        <div className="mb-4 font-semibold text-lg">Filter Data</div>
                        <div className="space-y-3">
                            {/* Filter Jenis */}
                            <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val as "all" | "income" | "expense")}>
                                <SelectTrigger className="w-full h-9">
                                    <SelectValue placeholder="Semua Jenis" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Jenis</SelectItem>
                                    <SelectItem value="income">Pemasukan</SelectItem>
                                    <SelectItem value="expense">Pengeluaran</SelectItem>
                                </SelectContent>
                            </Select>
                            {/* Filter Bulan Range */}
                            <div className="flex gap-2">
                                <Select
                                    value={monthStart === null ? "all" : String(monthStart)}
                                    onValueChange={(val) => setMonthStart(val === "all" ? null : Number(val))}
                                >
                                    <SelectTrigger className="flex-1 h-9">
                                        <SelectValue placeholder="Dari" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Dari</SelectItem>
                                        {MONTHS.map((m) => (
                                            <SelectItem key={m.num} value={String(m.num)}>{m.name.substring(0, 3)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={monthEnd === null ? "all" : String(monthEnd)}
                                    onValueChange={(val) => setMonthEnd(val === "all" ? null : Number(val))}
                                >
                                    <SelectTrigger className="flex-1 h-9">
                                        <SelectValue placeholder="Sampai" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Sampai</SelectItem>
                                        {MONTHS.map((m) => (
                                            <SelectItem key={m.num} value={String(m.num)}>{m.name.substring(0, 3)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {/* Filter Tahun */}
                            <Select value={String(yearFilter)} onValueChange={(val) => setYearFilter(Number(val))}>
                                <SelectTrigger className="w-full h-9">
                                    <SelectValue placeholder="Tahun" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map((y) => (
                                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="ghost" onClick={() => setShowFilterModal(false)}>
                                Tutup
                            </Button>
                            <Button onClick={() => setShowFilterModal(false)}>
                                Terapkan
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <FinancesFormModal
                open={showModal}
                onOpenChange={setShowModal}
                onSubmit={handleSubmit}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                open={!!deletingId}
                onOpenChange={(open) => !open && setDeletingId(null)}
                title={`Hapus ${finances.find(f => f.id === deletingId)?.type === "income" ? "Pemasukan" : "Pengeluaran"}?`}
                description="Tindakan ini tidak dapat dibatalkan. Data keuangan akan dihapus permanen."
                onConfirm={confirmDelete}
                loading={isDeleting}
            />
        </>
    )
}


