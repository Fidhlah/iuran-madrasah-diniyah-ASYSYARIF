import { Card, CardContent } from "@/components/ui/card"

interface FinancesAnalyticCardsProps {
    totalIncome: number
    totalExpense: number
    balance: number
}

export default function FinancesAnalyticCards({
    totalIncome,
    totalExpense,
    balance,
}: FinancesAnalyticCardsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {/* Total Pemasukan */}
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10" />
                <CardContent className="pt-6 relative">
                    <p className="text-sm font-medium text-muted-foreground">Total Pemasukan</p>
                    <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 mt-2 tracking-tight">
                        Rp {totalIncome.toLocaleString("id-ID")}
                    </p>
                </CardContent>
            </Card>
            {/* Total Pengeluaran */}
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950 dark:to-red-950">
                <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/10 rounded-full -mr-10 -mt-10" />
                <CardContent className="pt-6 relative">
                    <p className="text-sm font-medium text-muted-foreground">Total Pengeluaran</p>
                    <p className="text-3xl font-bold text-rose-700 dark:text-rose-400 mt-2 tracking-tight">
                        Rp {totalExpense.toLocaleString("id-ID")}
                    </p>
                </CardContent>
            </Card>
            {/* Saldo */}
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10" />
                <CardContent className="pt-6 relative">
                    <p className="text-sm font-medium text-muted-foreground">Saldo</p>
                    <p className={`text-3xl font-bold mt-2 tracking-tight ${balance >= 0 ? "text-blue-700 dark:text-blue-400" : "text-rose-700 dark:text-rose-400"}`}>
                        Rp {balance.toLocaleString("id-ID")}
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
