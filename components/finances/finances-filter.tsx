import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { MONTHS } from "@/utils/months"
import { RotateCcw } from "lucide-react"

interface FinancesFilterProps {
    search: string
    setSearch: (val: string) => void
    typeFilter: "all" | "income" | "expense"
    setTypeFilter: (val: "all" | "income" | "expense") => void
    yearFilter: number
    setYearFilter: (val: number) => void
    monthStart: number | null
    setMonthStart: (val: number | null) => void
    monthEnd: number | null
    setMonthEnd: (val: number | null) => void
    onReset: () => void
}

export default function FinancesFilter({
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    yearFilter,
    setYearFilter,
    monthStart,
    setMonthStart,
    monthEnd,
    setMonthEnd,
    onReset,
}: FinancesFilterProps) {
    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: currentYear - 2024 + 2 }, (_, i) => 2025 + i)

    return (
        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
            <Input
                placeholder="Cari keterangan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-48 h-9"
            />
            <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val as "all" | "income" | "expense")}>
                <SelectTrigger className="w-full sm:w-36 h-9">
                    <SelectValue placeholder="Semua Jenis" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Semua Jenis</SelectItem>
                    <SelectItem value="income">Pemasukan</SelectItem>
                    <SelectItem value="expense">Pengeluaran</SelectItem>
                </SelectContent>
            </Select>
            <Select value={String(yearFilter)} onValueChange={(val) => setYearFilter(Number(val))}>
                <SelectTrigger className="w-full sm:w-24 h-9">
                    <SelectValue placeholder="Tahun" />
                </SelectTrigger>
                <SelectContent>
                    {years.map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {/* Month Range: Start */}
            <Select
                value={monthStart === null ? "all" : String(monthStart)}
                onValueChange={(val) => setMonthStart(val === "all" ? null : Number(val))}
            >
                <SelectTrigger className="w-full sm:w-28 h-9">
                    <SelectValue placeholder="Dari" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Dari</SelectItem>
                    {MONTHS.map((m) => (
                        <SelectItem key={m.num} value={String(m.num)}>{m.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {/* Month Range: End */}
            <Select
                value={monthEnd === null ? "all" : String(monthEnd)}
                onValueChange={(val) => setMonthEnd(val === "all" ? null : Number(val))}
            >
                <SelectTrigger className="w-full sm:w-28 h-9">
                    <SelectValue placeholder="Sampai" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Sampai</SelectItem>
                    {MONTHS.map((m) => (
                        <SelectItem key={m.num} value={String(m.num)}>{m.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={onReset} className="h-9">
                <RotateCcw className="h-4 w-4" />
            </Button>
        </div>
    )
}

