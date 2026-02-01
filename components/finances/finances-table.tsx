import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trash2, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"
import { Finance } from "@/types/models"
import { MONTHS } from "@/utils/months"
import { Skeleton } from "@/components/ui/skeleton"

interface FinancesTableProps {
    data: Finance[]
    loading: boolean
    onDelete: (id: string) => void
    sortField: "date" | "amount"
    sortDirection: "asc" | "desc"
    onSort: (field: "date" | "amount") => void
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    const day = String(d.getDate()).padStart(2, "0")
    const monthAbbr = MONTHS[d.getMonth()]?.name.substring(0, 3) || ""
    const yr = d.getFullYear()
    return `${day}/${monthAbbr}/${yr}`
}

export default function FinancesTable({
    data,
    loading,
    onDelete,
    sortField,
    sortDirection,
    onSort,
}: FinancesTableProps) {
    function getSortIcon(field: "date" | "amount") {
        if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />
        if (sortDirection === "asc") return <ArrowUp className="h-4 w-4" />
        return <ArrowDown className="h-4 w-4" />
    }

    if (loading) {
        return (
            <Table>
                <TableHeader>
                    <TableRow className="bg-secondary/30">
                        <TableHead className="font-semibold">Tanggal</TableHead>
                        <TableHead className="font-semibold">Jenis</TableHead>
                        <TableHead className="font-semibold">Deskripsi</TableHead>
                        <TableHead className="font-semibold text-right">Jumlah</TableHead>
                        <TableHead className="font-semibold text-center w-20">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        )
    }

    if (data.length === 0) {
        return (
            <Table>
                <TableHeader>
                    <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                        <TableHead className="font-semibold cursor-pointer select-none" onClick={() => onSort("date")}>
                            <span className="flex items-center gap-1">
                                Tanggal {getSortIcon("date")}
                            </span>
                        </TableHead>
                        <TableHead className="font-semibold">Jenis</TableHead>
                        <TableHead className="font-semibold">Deskripsi</TableHead>
                        <TableHead className="font-semibold text-right cursor-pointer select-none" onClick={() => onSort("amount")}>
                            <span className="flex items-center justify-end gap-1">
                                Jumlah {getSortIcon("amount")}
                            </span>
                        </TableHead>
                        <TableHead className="font-semibold text-center w-20">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Belum ada data keuangan
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        )
    }

    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                    <TableHead className="font-semibold cursor-pointer select-none" onClick={() => onSort("date")}>
                        <span className="flex items-center gap-1">
                            Tanggal {getSortIcon("date")}
                        </span>
                    </TableHead>
                    <TableHead className="font-semibold">Jenis</TableHead>
                    <TableHead className="font-semibold">Deskripsi</TableHead>
                    <TableHead className="font-semibold text-right cursor-pointer select-none" onClick={() => onSort("amount")}>
                        <span className="flex items-center justify-end gap-1">
                            Jumlah {getSortIcon("amount")}
                        </span>
                    </TableHead>
                    <TableHead className="font-semibold text-center w-20">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((finance) => (
                    <TableRow key={finance.id} className="hover:bg-secondary/20 transition-colors">
                        <TableCell className="font-medium">{formatDate(finance.date)}</TableCell>
                        <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${finance.type === "income"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                                : "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300"
                                }`}>
                                {finance.type === "income" ? "Pemasukan" : "Pengeluaran"}
                            </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate">
                            {finance.description || "-"}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${finance.type === "income" ? "text-emerald-600" : "text-rose-600"
                            }`}>
                            {finance.type === "income" ? "+" : "-"} Rp {Number(finance.amount).toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="text-center">
                            {!finance.payment_id && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDelete(finance.id)}
                                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
