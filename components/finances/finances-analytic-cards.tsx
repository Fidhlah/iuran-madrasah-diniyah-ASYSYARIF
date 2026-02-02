import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { MONTHS } from "@/utils/months"

interface FinancesAnalyticCardsProps {
    totalIncome: number
    totalExpense: number
    balance: number
    previousMonthBalance: number
    currentMonth: number
    currentYear: number
    loading?: boolean
}

export default function FinancesAnalyticCards({
    totalIncome,
    totalExpense,
    balance,
    previousMonthBalance,
    currentMonth,
    currentYear,
    loading = false,
}: FinancesAnalyticCardsProps) {
    const monthName = MONTHS[currentMonth - 1]?.name || ""
    const prevMonthName = MONTHS[currentMonth - 2 >= 0 ? currentMonth - 2 : 11]?.name || ""
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {/* Saldo Bulan Kemarin */}
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <div className="absolute top-0 right-0 w-20 h-20 bg-slate-500/10 rounded-full -mr-10 -mt-10" />
                <CardContent className="pt-6 relative">
                    <p className="text-sm font-medium text-muted-foreground">Saldo Bulan Lalu</p>
                    {loading ? (
                        <Skeleton className="h-9 w-32 mt-2 mb-1" />
                    ) : (
                        <p className={`text-3xl font-bold mt-2 tracking-tight ${previousMonthBalance >= 0 ? "text-foreground" : "text-rose-700 dark:text-rose-400"}`}>
                            Rp {previousMonthBalance.toLocaleString("id-ID")}
                        </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{prevMonthName} {prevYear}</p>
                </CardContent>
            </Card>
            {/* Total Pemasukan */}
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10" />
                <CardContent className="pt-6 relative">
                    <p className="text-sm font-medium text-muted-foreground">Total Pemasukan</p>
                    {loading ? (
                        <Skeleton className="h-9 w-32 mt-2 mb-1" />
                    ) : (
                        <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 mt-2 tracking-tight">
                            Rp {totalIncome.toLocaleString("id-ID")}
                        </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{monthName} {currentYear}</p>
                </CardContent>
            </Card>
            {/* Total Pengeluaran */}
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950 dark:to-red-950">
                <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/10 rounded-full -mr-10 -mt-10" />
                <CardContent className="pt-6 relative">
                    <p className="text-sm font-medium text-muted-foreground">Total Pengeluaran</p>
                    {loading ? (
                        <Skeleton className="h-9 w-32 mt-2 mb-1" />
                    ) : (
                        <p className="text-3xl font-bold text-rose-700 dark:text-rose-400 mt-2 tracking-tight">
                            Rp {totalExpense.toLocaleString("id-ID")}
                        </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{monthName} {currentYear}</p>
                </CardContent>
            </Card>
            {/* Saldo */}
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10" />
                <CardContent className="pt-6 relative">
                    <p className="text-sm font-medium text-muted-foreground">Saldo Saat Ini</p>
                    {loading ? (
                        <Skeleton className="h-9 w-32 mt-2 mb-1" />
                    ) : (
                        <p className={`text-3xl font-bold mt-2 tracking-tight ${balance >= 0 ? "text-blue-700 dark:text-blue-400" : "text-rose-700 dark:text-rose-400"}`}>
                            Rp {balance.toLocaleString("id-ID")}
                        </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{monthName} {currentYear}</p>
                </CardContent>
            </Card>
        </div>
    )
}
