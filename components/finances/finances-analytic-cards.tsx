import { AnalyticCard } from "@/components/ui/analytic-card"
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
            <AnalyticCard
                title="Saldo Bulan Lalu"
                value={previousMonthBalance}
                subtitle={`${prevMonthName} ${prevYear}`}
                color="slate"
                loading={loading}
                formatCurrency
                valueColorClass={previousMonthBalance >= 0 ? "text-foreground" : "text-rose-700 dark:text-rose-400"}
            />
            <AnalyticCard
                title="Total Pemasukan"
                value={totalIncome}
                subtitle={`${monthName} ${currentYear}`}
                color="emerald"
                loading={loading}
                formatCurrency
            />
            <AnalyticCard
                title="Total Pengeluaran"
                value={totalExpense}
                subtitle={`${monthName} ${currentYear}`}
                color="rose"
                loading={loading}
                formatCurrency
            />
            <AnalyticCard
                title="Saldo Saat Ini"
                value={balance}
                subtitle={`${monthName} ${currentYear}`}
                color="blue"
                loading={loading}
                formatCurrency
                valueColorClass={balance >= 0 ? "text-blue-700 dark:text-blue-400" : "text-rose-700 dark:text-rose-400"}
            />
        </div>
    )
}
