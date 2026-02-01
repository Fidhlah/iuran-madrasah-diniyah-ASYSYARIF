import { Card, CardContent } from "@/components/ui/card"

type TabunganAnalyticCardsProps = {
  totalSaldo: number
  totalSantriAktif: number
  totalSetoranBulanIni: number
  totalPenarikanBulanIni: number
}

export default function TabunganAnalyticCards({
  totalSaldo,
  totalSantriAktif,
  totalSetoranBulanIni,
  totalPenarikanBulanIni,
}: TabunganAnalyticCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {/* Total Saldo */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -mr-10 -mt-10" />
        <CardContent className="pt-6 relative">
          <p className="text-sm font-medium text-muted-foreground">Total Saldo</p>
          <p className="text-4xl font-bold text-emerald-700 dark:text-emerald-400 mt-2 tracking-tight">
            Rp {totalSaldo.toLocaleString("id-ID")}
          </p>
        </CardContent>
      </Card>
      {/* Jumlah Santri Aktif */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
        <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -mr-10 -mt-10" />
        <CardContent className="pt-6 relative">
          <p className="text-sm font-medium text-muted-foreground">Jumlah Santri Aktif</p>
          <p className="text-4xl font-bold text-amber-600 dark:text-amber-400 mt-2 tracking-tight">
            {totalSantriAktif}
          </p>
        </CardContent>
      </Card>
      {/* Total Setoran Bulan Ini */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10" />
        <CardContent className="pt-6 relative">
          <p className="text-sm font-medium text-muted-foreground">Total Setoran Bulan Ini</p>
          <p className="text-4xl font-bold text-emerald-700 dark:text-emerald-400 mt-2 tracking-tight">
            {totalSetoranBulanIni.toLocaleString("id-ID")}
          </p>
        </CardContent>
      </Card>
      {/* Total Penarikan Bulan Ini */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950 dark:to-red-950">
        <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/10 rounded-full -mr-10 -mt-10" />
        <CardContent className="pt-6 relative">
          <p className="text-sm font-medium text-muted-foreground">Total Penarikan Bulan Ini</p>
          <p className="text-4xl font-bold text-rose-700 dark:text-rose-400 mt-2 tracking-tight">
            {totalPenarikanBulanIni.toLocaleString("id-ID")}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}