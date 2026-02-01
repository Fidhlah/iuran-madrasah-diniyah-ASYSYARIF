"use client"

import { useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useFinances } from "@/hooks/swr-use-finances"
import { buildFinanceExportData, buildFinanceExportFilename, exportToExcel } from "@/utils/export-excel"
import { MONTHS } from "@/utils/months"
import { Download } from "lucide-react"
import FinancesAnalyticCards from "./finances-analytic-cards"
import FinancesFilter from "./finances-filter"
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
    const [sortField, setSortField] = useState<"date" | "amount">("date")
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

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
    const handleDelete = async (id: string) => {
        if (confirm("Yakin ingin menghapus data ini?")) {
            await deleteFinance(id)
        }
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
        exportToExcel({ data, filename, sheetName: "Keuangan" })
    }

    return (
        <>
            <FinancesAnalyticCards
                totalIncome={summary.totalIncome}
                totalExpense={summary.totalExpense}
                balance={summary.balance}
            />

            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-0 flex flex-row items-center justify-between">
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
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <FinancesFilter
                            search={search}
                            setSearch={setSearch}
                            typeFilter={typeFilter}
                            setTypeFilter={setTypeFilter}
                            yearFilter={yearFilter}
                            setYearFilter={setYearFilter}
                            monthStart={monthStart}
                            setMonthStart={setMonthStart}
                            monthEnd={monthEnd}
                            setMonthEnd={setMonthEnd}
                            onReset={handleReset}
                        />
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

            <FinancesFormModal
                open={showModal}
                onOpenChange={setShowModal}
                onSubmit={handleSubmit}
            />
        </>
    )
}

