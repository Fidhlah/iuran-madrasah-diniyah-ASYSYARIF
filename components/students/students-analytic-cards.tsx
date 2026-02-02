"use client"
import { Card, CardContent } from "@/components/ui/card"
import { AnalyticCard } from "@/components/ui/analytic-card"
import { useSWRStudents } from "@/hooks/swr-use-students"
import { CLASS_ORDER } from "@/utils/class-order"

export default function StudentsAnalyticCards() {
  const { students, loading } = useSWRStudents()
  const totalActive = students.filter(s => s.status === "active").length
  const totalAll = students.length
  const activeStudents = students.filter((s) => s.status === "active")

  // Hitung jumlah per kelas
  const perClass = CLASS_ORDER.map(cls => ({
    class: cls,
    count: activeStudents.filter(s => s.class === cls).length
  }))

  // Responsive: di mobile, 2 kolom x 3 baris (2 summary + 4 kelas)
  // di desktop, tetap 3 card (2 summary + 1 kelas gabungan)
  return (
    <>
      {/* Desktop */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <AnalyticCard
          title="Total Santri Aktif"
          value={totalActive}
          subtitle="Status aktif"
          color="slate"
          loading={loading}
        />
        <AnalyticCard
          title="Total Semua Santri"
          value={totalAll}
          subtitle="Aktif & Nonaktif"
          color="amber"
          loading={loading}
        />
        {/* Card jumlah per kelas - custom layout */}
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
      <div className="grid grid-cols-2 gap-4 md:hidden mb-4">
        <AnalyticCard
          title="Total Santri Aktif"
          value={totalActive}
          subtitle="Status aktif"
          color="slate"
          loading={loading}
        />
        <AnalyticCard
          title="Total Semua Santri"
          value={totalAll}
          subtitle="Aktif & Nonaktif"
          color="amber"
          loading={loading}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:hidden mb-8">
        {/* Card jumlah per kelas (persegi panjang, satu baris penuh) */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10" />
          <CardContent className="pt-6 relative flex flex-col items-center">
            <div className="flex justify-center w-full">
              {perClass.map(({ class: cls }, idx) => (
                <div
                  key={cls}
                  className={`flex-1 flex flex-col items-center ${idx !== perClass.length - 1 ? "border-r border-muted" : ""}`}
                >
                  <span className="text-base font-bold text-muted-foreground tracking-wide">
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
                  <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 tracking-wide">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}