import { AnalyticCard } from "@/components/ui/analytic-card"
import { MONTHS } from "@/utils/months"
import { Info } from "lucide-react"
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"

interface FinancesAnalyticCardsProps {
    totalIncome: number
    totalExpense: number
    balance: number
    previousMonthBalance: number
    currentMonth: number
    currentYear: number
    loading?: boolean
    sppBulanIni?: number
    sppTitipan?: number
    sppTunggakan?: number
    infaqDanLainnya?: number
    prevIncome?: number
    prevExpense?: number
    prevSppTepatWaktu?: number
    prevSppTitipan?: number
    prevSppTunggakan?: number
    prevInfaqDanLainnya?: number
    olderBalance?: number
}

export default function FinancesAnalyticCards({
    totalIncome,
    totalExpense,
    balance,
    previousMonthBalance,
    currentMonth,
    currentYear,
    loading = false,
    sppBulanIni = 0,
    sppTitipan = 0,
    sppTunggakan = 0,
    infaqDanLainnya = 0,
    prevIncome = 0,
    prevExpense = 0,
    prevSppTepatWaktu = 0,
    prevSppTitipan = 0,
    prevSppTunggakan = 0,
    prevInfaqDanLainnya = 0,
    olderBalance = 0,
}: FinancesAnalyticCardsProps) {
    const monthName = MONTHS[currentMonth - 1]?.name || ""
    const prevMonthName = MONTHS[currentMonth - 2 >= 0 ? currentMonth - 2 : 11]?.name || ""
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear

    const saldoBulanLaluTooltip = (prevIncome > 0 || prevExpense > 0 || olderBalance !== 0) ? (
        <HoverCard>
            <HoverCardTrigger asChild>
                <div role="button" tabIndex={0} className="focus:outline-none">
                    <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 p-4 border shadow-md bg-popover" align="center" sideOffset={8}>
                <div className="space-y-3 relative z-50">
                    <h4 className="font-semibold text-sm">Rincian Akumulasi Kas Lama</h4>
                    <p className="text-xs text-muted-foreground">
                        Saldo ini adalah rincian pergerakan keuangan di bulan {prevMonthName} {prevYear} ditambah sisa kas bulan-bulan sebelumnya.
                    </p>
                    <div className="space-y-1 text-sm border-t pt-2">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Saldo S.d Sebelum {prevMonthName}</span>
                            <span className="font-mono">Rp {olderBalance.toLocaleString("id-ID")}</span>
                        </div>

                        {(prevSppTepatWaktu > 0 || prevSppTunggakan > 0 || prevSppTitipan > 0 || prevInfaqDanLainnya > 0) && (
                            <div className="pt-2 text-emerald-600 dark:text-emerald-400 font-medium">
                                + Pemasukan {prevMonthName}:
                            </div>
                        )}
                        {prevSppTepatWaktu > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground ml-2">↳ SPP Tepat Waktu</span>
                                <span className="font-mono">Rp {prevSppTepatWaktu.toLocaleString("id-ID")}</span>
                            </div>
                        )}
                        {prevSppTunggakan > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground ml-2">↳ SPP Tunggakan</span>
                                <span className="font-mono">Rp {prevSppTunggakan.toLocaleString("id-ID")}</span>
                            </div>
                        )}
                        {prevSppTitipan > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground ml-2">↳ SPP Titipan</span>
                                <span className="font-mono">Rp {prevSppTitipan.toLocaleString("id-ID")}</span>
                            </div>
                        )}
                        {prevInfaqDanLainnya > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground ml-2">↳ Infaq & Lainnya</span>
                                <span className="font-mono">Rp {prevInfaqDanLainnya.toLocaleString("id-ID")}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-rose-600 dark:text-rose-400 border-b pb-2 pt-1 mt-1">
                            <span>- Pengeluaran {prevMonthName}</span>
                            <span className="font-mono">Rp {prevExpense.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between font-bold pt-1">
                            <span>= Saldo Akhir {prevMonthName}</span>
                            <span className="font-mono">Rp {previousMonthBalance.toLocaleString("id-ID")}</span>
                        </div>
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    ) : undefined

    const pemasukanTooltip = (totalIncome > 0) ? (
        <HoverCard>
            <HoverCardTrigger asChild>
                <div role="button" tabIndex={0} className="focus:outline-none">
                    <Info className="h-4 w-4 text-emerald-600/70 hover:text-emerald-700 dark:text-emerald-400/70 dark:hover:text-emerald-300 transition-colors" />
                </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 p-4 border shadow-md bg-popover" align="center" sideOffset={8}>
                <div className="space-y-3 relative z-50">
                    <h4 className="font-semibold text-sm">Rincian Pemasukan {monthName}</h4>
                    <div className="space-y-1 text-sm border-t pt-2">
                        {sppBulanIni > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">SPP {monthName}</span>
                                <span className="font-mono">Rp {sppBulanIni.toLocaleString("id-ID")}</span>
                            </div>
                        )}
                        {sppTunggakan > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">SPP Tunggakan (Bulan Sebelumnya)</span>
                                <span className="font-mono">Rp {sppTunggakan.toLocaleString("id-ID")}</span>
                            </div>
                        )}
                        {sppTitipan > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">SPP Titipan (Bayar Lebih Awal)</span>
                                <span className="font-mono">Rp {sppTitipan.toLocaleString("id-ID")}</span>
                            </div>
                        )}
                        {infaqDanLainnya > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Infaq & Lainnya</span>
                                <span className="font-mono">Rp {infaqDanLainnya.toLocaleString("id-ID")}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold pt-1 border-t mt-1">
                            <span className="text-emerald-600 dark:text-emerald-400">Total Pemasukan</span>
                            <span className="font-mono text-emerald-600 dark:text-emerald-400">Rp {totalIncome.toLocaleString("id-ID")}</span>
                        </div>
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    ) : undefined

    const balanceTooltip = (
        <HoverCard>
            <HoverCardTrigger asChild>
                <div role="button" tabIndex={0} className="focus:outline-none">
                    <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 p-4 border shadow-md bg-popover" align="center" sideOffset={8}>
                <div className="space-y-3 relative z-50">
                    <h4 className="font-semibold text-sm">Rincian Saldo Saat Ini</h4>
                    <p className="text-xs text-muted-foreground">
                        Saldo adalah akumulasi total dari uang kas bulan sebelumnya ditambah pergerakan uang bulan ini.
                    </p>
                    <div className="space-y-1 text-sm border-t pt-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Sisa Kas Lama</span>
                            <span className="font-mono">Rp {previousMonthBalance.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                            <span>+ Pemasukan {monthName}</span>
                            <span className="font-mono">Rp {totalIncome.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between text-rose-600 dark:text-rose-400 border-b pb-2">
                            <span>- Pengeluaran {monthName}</span>
                            <span className="font-mono">Rp {totalExpense.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between font-bold pt-1">
                            <span>= Total Saldo</span>
                            <span className="font-mono">Rp {balance.toLocaleString("id-ID")}</span>
                        </div>
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    )

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
                infoTooltip={saldoBulanLaluTooltip}
            />
            <AnalyticCard
                title="Total Pemasukan"
                value={totalIncome}
                subtitle={`${monthName} ${currentYear}`}
                color="emerald"
                loading={loading}
                formatCurrency
                infoTooltip={pemasukanTooltip}
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
                infoTooltip={balanceTooltip}
            />
        </div>
    )
}
