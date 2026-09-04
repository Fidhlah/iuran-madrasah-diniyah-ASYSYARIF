import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Trash2, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"
import { Finance } from "@/types/models"
import { MONTHS } from "@/utils/months"
import { Skeleton } from "@/components/ui/skeleton"
import { useState } from "react"

// Label kategori (expense: kas_mesjid|honor_guru|operasional|lainnya; income → tanpa kategori)
const CATEGORY_LABEL: Record<string, string> = {
    kas_mesjid: "Kas Mesjid",
    honor_guru: "Honor Guru",
    operasional: "Operasional",
    lainnya: "Lainnya",
}

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

    const totalPemasukan = data.filter(f => f.type === "income").reduce((acc, curr) => acc + Number(curr.amount), 0)
    const totalPengeluaran = data.filter(f => f.type === "expense").reduce((acc, curr) => acc + Number(curr.amount), 0)
    const totalSaldo = totalPemasukan - totalPengeluaran

    const [selected, setSelected] = useState<Finance | null>(null)

    if (loading) {
        return (
            <Table>
                <TableHeader>
                    <TableRow className="bg-secondary/30">
                        <TableHead className="font-semibold">Tanggal</TableHead>
                        <TableHead className="font-semibold">Jenis</TableHead>
                        <TableHead className="font-semibold">Kategori</TableHead>
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
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
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
                        <TableHead className="font-semibold">Kategori</TableHead>
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
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Belum ada data keuangan
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        )
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                        <TableHead className="font-semibold cursor-pointer select-none" onClick={() => onSort("date")}>
                            <span className="flex items-center gap-1">
                                Tanggal {getSortIcon("date")}
                            </span>
                        </TableHead>
                        <TableHead className="font-semibold">Jenis</TableHead>
                        <TableHead className="font-semibold">Kategori</TableHead>
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
                        <TableRow key={finance.id} className="hover:bg-secondary/20 transition-colors cursor-pointer" onClick={() => setSelected(finance)}>
                            <TableCell className="font-medium">{formatDate(finance.date)}</TableCell>
                            <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${finance.type === "income"
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                                    : "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300"
                                    }`}>
                                    {finance.type === "income" ? "Pemasukan" : "Pengeluaran"}
                                </span>
                            </TableCell>
                            <TableCell>
                                {finance.category ? (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                        {CATEGORY_LABEL[finance.category] || finance.category}
                                    </span>
                                ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                )}
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
                                        onClick={(e) => { e.stopPropagation(); onDelete(finance.id) }}
                                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow className="bg-secondary/10 hover:bg-secondary/10">
                        <TableCell colSpan={4} className="text-right font-bold text-muted-foreground">Total Pemasukan</TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">Rp {totalPemasukan.toLocaleString("id-ID")}</TableCell>
                        <TableCell></TableCell>
                    </TableRow>
                    <TableRow className="bg-secondary/10 hover:bg-secondary/10">
                        <TableCell colSpan={4} className="text-right font-bold text-muted-foreground">Total Pengeluaran</TableCell>
                        <TableCell className="text-right font-bold text-rose-600">Rp {totalPengeluaran.toLocaleString("id-ID")}</TableCell>
                        <TableCell></TableCell>
                    </TableRow>
                    <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                        <TableCell colSpan={4} className="text-right font-bold">Total Saldo</TableCell>
                        <TableCell className={`text-right font-bold ${totalSaldo >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            Rp {totalSaldo.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell></TableCell>
                    </TableRow>
                </TableFooter>
            </Table>

            <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null) }}>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Detail Keuangan</DialogTitle>
                                    <p className="text-sm text-muted-foreground">Rincian lengkap transaksi ini</p>
                                </DialogHeader>
                                {selected && (
                                    <div className="space-y-5">
                                        {/* Jumlah — hierarki paling atas */}
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="text-sm text-muted-foreground">Total Transaksi</span>
                                            <span className={`text-2xl font-bold tracking-tight ${selected.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                                                                                {selected.type === "income" ? "+" : "-"} Rp {Number(selected.amount).toLocaleString("id-ID")}
                                                                                            </span>
                                        </div>

                                        {/* Badge tipe & kategori */}
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${selected.type === "income" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300"}`}>
                                                {selected.type === "income" ? "Pemasukan" : "Pengeluaran"}
                                            </span>
                                            {selected.category && (
                                                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                    {CATEGORY_LABEL[selected.category] || selected.category}
                                                </span>
                                            )}
                                        </div>

                                        {/* Rincian field */}
                                        <div className="space-y-3 border-t pt-4">
                                            <div className="flex justify-between items-baseline text-sm">
                                                <span className="text-muted-foreground">Tanggal</span>
                                                <span className="font-medium">{formatDate(selected.date)}</span>
                                            </div>
                                            {selected.payment_id && (
                                                <div className="flex justify-between items-baseline text-sm">
                                                    <span className="text-muted-foreground">Sumber</span>
                                                    <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded-full">Otomatis dari iuran</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Deskripsi lengkap */}
                                        <div className="space-y-2">
                                            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Deskripsi</span>
                                            <div className="rounded-lg border bg-muted/40 p-3 text-sm whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
                                                {selected.description || "-"}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>
        </>
    )
}