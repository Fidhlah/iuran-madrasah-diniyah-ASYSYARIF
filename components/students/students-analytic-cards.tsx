"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useStudents } from "@/hooks"
import { CLASS_ORDER } from "@/utils/class-order"

export default function StudentsAnalyticCards() {
  const { students, loading } = useStudents()
  const totalActive = students.filter(s => s.status === "active").length
  const totalAll = students.length

  // Hitung jumlah per kelas
  const perClass = CLASS_ORDER.map(cls => ({
    class: cls,
    count: students.filter(s => s.class === cls).length
  }))

  // Responsive: di mobile, 2 kolom x 3 baris (2 summary + 4 kelas)
  // di desktop, tetap 3 card (2 summary + 1 kelas gabungan)
  return (
    <>
      {/* Desktop */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -mr-10 -mt-10" />
          <CardContent className="pt-6 relative">
            <p className="text-sm font-medium text-muted-foreground">Total Santri Aktif</p>
            {loading ? (
              <Skeleton className="h-10 w-24 mt-2 mb-1" />
            ) : (
              <p className="text-4xl font-bold text-foreground mt-2 tracking-tight">{totalActive}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Status aktif</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -mr-10 -mt-10" />
          <CardContent className="pt-6 relative">
            <p className="text-sm font-medium text-muted-foreground">Total Semua Santri</p>
            {loading ? (
              <Skeleton className="h-10 w-24 mt-2 mb-1" />
            ) : (
              <p className="text-4xl font-bold text-amber-600 dark:text-amber-400 mt-2 tracking-tight">{totalAll}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Aktif & Nonaktif</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10" />
          <CardContent className="pt-6 relative flex flex-col items-center">
            <div className="flex justify-center w-full">
              {perClass.map(({ class: cls }, idx) => (
                <div
                  key={cls}
                  className={`flex-1 flex flex-col items-center ${idx !== perClass.length - 1 ? "border-r border-muted" : ""}`}
                >
                  <span className="text-base md:text-lg font-bold text-muted-foreground tracking-wide">
                    {cls}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-center w-full mt-3">
              {perClass.map(({ class: cls, count }, idx) => (
                <div
                  key={cls}
                  className={`flex-1 flex flex-col items-center ${idx !== perClass.length - 1 ? "border-r border-muted" : ""}`}
                >
                  <span className="text-2xl md:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 tracking-wide">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Mobile */}
      <div className="grid grid-cols-2 gap-4 md:hidden mb-8">
        {/* Total Aktif */}
        <Card className="aspect-square flex flex-col justify-center items-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0">
          <CardContent className="flex flex-col items-center justify-center pt-6">
            <p className="text-xs font-medium text-muted-foreground">Santri Aktif</p>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-2 mb-1" />
            ) : (
              <p className="text-3xl font-bold text-foreground mt-2 tracking-tight">{totalActive}</p>
            )}
          </CardContent>
        </Card>
        {/* Total Semua */}
        <Card className="aspect-square flex flex-col justify-center items-center bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-0">
          <CardContent className="flex flex-col items-center justify-center pt-6">
            <p className="text-xs font-medium text-muted-foreground">Semua Santri</p>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-2 mb-1" />
            ) : (
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2 tracking-tight">{totalAll}</p>
            )}
          </CardContent>
        </Card>
        {/* PAUD */}
        <Card className="aspect-square flex flex-col justify-center items-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-0">
          <CardContent className="flex flex-col items-center justify-center pt-6">
            <span className="text-base font-bold text-muted-foreground"> Kelas PAUD</span>
            {loading ? (
              <Skeleton className="h-8 w-10 mt-2 mb-1" />
            ) : (
              <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-2">{perClass[0]?.count ?? 0}</span>
            )}
          </CardContent>
        </Card>
        {/* TK */}
        <Card className="aspect-square flex flex-col justify-center items-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-0">
          <CardContent className="flex flex-col items-center justify-center pt-6">
            <span className="text-base font-bold text-muted-foreground"> Kelas TK</span>
            {loading ? (
              <Skeleton className="h-8 w-10 mt-2 mb-1" />
            ) : (
              <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-2">{perClass[1]?.count ?? 0}</span>
            )}
          </CardContent>
        </Card>
        {/* 1 */}
        <Card className="aspect-square flex flex-col justify-center items-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-0">
          <CardContent className="flex flex-col items-center justify-center pt-6">
            <span className="text-base font-bold text-muted-foreground"> Kelas 1</span>
            {loading ? (
              <Skeleton className="h-8 w-10 mt-2 mb-1" />
            ) : (
              <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-2">{perClass[2]?.count ?? 0}</span>
            )}
          </CardContent>
        </Card>
        {/* 2 */}
        <Card className="aspect-square flex flex-col justify-center items-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-0">
          <CardContent className="flex flex-col items-center justify-center pt-6">
            <span className="text-base font-bold text-muted-foreground"> Kelas 2</span>
            {loading ? (
              <Skeleton className="h-8 w-10 mt-2 mb-1" />
            ) : (
              <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-2">{perClass[3]?.count ?? 0}</span>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}