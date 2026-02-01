"use client"

import { useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useFinances } from "@/hooks/swr-use-finances"
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
    const [monthFilter, setMonthFilter] = useState<number | null>(null)
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

            // Month filter
            if (monthFilter !== null && fDate.getMonth() + 1 !== monthFilter) return false

            // Search filter
            if (search && !(f.description || "").toLowerCase().includes(search.toLowerCase())) {
                return false
            }

            return true
        })
    }, [finances, typeFilter, yearFilter, monthFilter, search])

    // Calculate filtered summary
    const filteredSummary = useMemo(() => {
        const income = filteredData
            .filter((f) => f.type === "income")
            .reduce((sum, f) => sum + Number(f.amount), 0)
        const expense = filteredData
            .filter((f) => f.type === "expense")
            .reduce((sum, f) => sum + Number(f.amount), 0)
        return {
            totalIncome: income,
            totalExpense: expense,
            balance: income - expense,
        }
    }, [filteredData])

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

    return (
        <>
            <FinancesAnalyticCards
                totalIncome={summary.totalIncome}
                totalExpense={summary.totalExpense}
                balance={summary.balance}
            />

            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-0">
                    <CardTitle>Data Keuangan</CardTitle>
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
                            monthFilter={monthFilter}
                            setMonthFilter={setMonthFilter}
                            onReset={() => {
                                setSearch("")
                                setTypeFilter("all")
                                setYearFilter(new Date().getFullYear())
                                setMonthFilter(null)
                            }}
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
