"use client"

import { useState } from "react"
import { CLASS_ORDER } from "@/utils/class-order"
import TabunganAnalyticCards from "./tabungan-analytic-cards"
import TabunganFilter from "./tabungan-filter"
import TabunganRekapTable from "./tabungan-rekap-table"
import TabunganTransaksiTable from "./tabungan-transaksi-table"
import TabunganTransaksiModal from "./tabungan-transaksi-modal"
import { useTabungan } from "@/hooks/swr-use-tabungan"
import { useTabunganTransaksi } from "@/hooks/swr-use-tabungan-transaksi"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useSWRStudents } from "@/hooks/swr-use-students"
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"
import type { Tabungan, TabunganTransaksi, Student } from "@/types/models"

function groupByKelas<T extends { students?: { class?: string } }>(list: T[]): Record<string, T[]> {
  const grouped: Record<string, T[]> = {}
  for (const kelas of CLASS_ORDER) {
    grouped[kelas] = list.filter(s => s.students?.class === kelas)
  }
  grouped["all"] = list
  return grouped
}
function groupByKelasFlat<T extends { class?: string }>(list: T[]): Record<string, T[]> {
  const grouped: Record<string, T[]> = {}
  for (const kelas of CLASS_ORDER) {
    grouped[kelas] = list.filter(s => s.class === kelas)
  }
  grouped["all"] = list
  return grouped
}

export default function TabunganPage() {
  // RealtimeListener in layout.tsx already provides global subscription
  // Don't call useSupabaseSubscription here - it causes duplicate API calls

  // --- STATE UTAMA ---
  const [activeTab, setActiveTab] = useState<"rekap" | "transaksi">("rekap")
  const [searchRekap, setSearchRekap] = useState("")
  const [kelasFilterRekap, setKelasFilterRekap] = useState("all")
  const [searchTransaksi, setSearchTransaksi] = useState("")
  const [kelasFilterTransaksi, setKelasFilterTransaksi] = useState("all")

  // --- STATE MODAL ---
  const [showModal, setShowModal] = useState(false)
  const [modalSantri, setModalSantri] = useState("")
  const [modalKelas, setModalKelas] = useState("")
  const [modalJenis, setModalJenis] = useState<"setor" | "tarik">("setor")
  const [modalNominal, setModalNominal] = useState<number>(0)
  const [modalKeterangan, setModalKeterangan] = useState("")

  // --- FETCH DATA DARI API ---
  const { data: tabungan = [], isLoading: loadingTabungan } = useTabungan()
  const { data: transaksi = [], isLoading: loadingTransaksi, createTransaksi } = useTabunganTransaksi()
  const { students, loading: studentsLoading } = useSWRStudents()

  // SORTING
  const [sortField, setSortField] = useState<"name" | "class" | "saldo" | "jumlahTransaksi">("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // --- FILTER & GROUP REKAP ---
  const filteredTabungan = tabungan.filter((t: Tabungan) =>
    (t.students?.name ?? "").toLowerCase().includes(searchRekap.toLowerCase()) &&
    (kelasFilterRekap === "all" ? true : t.students?.class === kelasFilterRekap)
  )
  const tabunganByKelas = groupByKelas(filteredTabungan)
  // --- FILTER TRANSAKSI ---
  const filteredTransaksi = transaksi.filter((t: TabunganTransaksi) =>
    (t.students?.name ?? "").toLowerCase().includes(searchTransaksi.toLowerCase()) &&
    (kelasFilterTransaksi === "all" ? true : t.students?.class === kelasFilterTransaksi)
  )



  // --- SORTING REKAP ---
  const sortedTabungan = [...filteredTabungan].sort((a: Tabungan, b: Tabungan) => {
    let aVal: string | number = ""
    let bVal: string | number = ""
    switch (sortField) {
      case "name":
        aVal = (a.students?.name ?? "").toLowerCase()
        bVal = (b.students?.name ?? "").toLowerCase()
        break
      case "class":
        aVal = CLASS_ORDER.indexOf(a.students?.class ?? "")
        bVal = CLASS_ORDER.indexOf(b.students?.class ?? "")
        break
      case "saldo":
        aVal = a.saldo
        bVal = b.saldo
        break
      case "jumlahTransaksi":
        aVal = a.jumlah_transaksi ?? 0
        bVal = b.jumlah_transaksi ?? 0
        break
    }
    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  function getSortIcon(field: string) {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />
    if (sortDirection === "asc") return <ArrowUp className="h-4 w-4" />
    return <ArrowDown className="h-4 w-4" />
  }

  function handleSort(field: typeof sortField) {
    if (sortField === field) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  async function handleSubmitTransaksi() {
    if (!modalSantri || !modalJenis || !modalNominal) return
    await createTransaksi({
      student_id: modalSantri,
      jenis: modalJenis,
      nominal: modalNominal,
      keterangan: modalKeterangan,
    })
    // createTransaksi now handles mutate() internally - no need to call here

    setShowModal(false)
    setModalSantri("")
    setModalKelas("all")
    setModalJenis("setor")
    setModalNominal(0)
    setModalKeterangan("")
  }

  // --- STUDENTS WITH SALDO UNTUK MODAL ---
  const studentsWithSaldo = students.map((s: Student) => {
    const tab = tabungan.find((t: Tabungan) => t.students?.id === s.id)
    return {
      id: s.id,
      name: s.name,
      class: s.class,
      saldo: tab ? Number(tab.saldo) : 0,
      jumlahTransaksi: tab ? (tab.jumlah_transaksi ?? 0) : 0,
    }
  })
  const studentsWithSaldoByKelas = groupByKelasFlat(studentsWithSaldo)

  // --- ANALYTICS ---
  const totalSaldo = tabungan.reduce((a: number, b: Tabungan) => a + Number(b.saldo), 0)
  const totalSantriAktif = tabungan.filter((t: Tabungan) => Number(t.saldo) > 0).length

  // Hitung bulan & tahun sekarang
  const now = new Date()
  const bulanIni = now.getMonth()
  const tahunIni = now.getFullYear()
  const totalSetoranBulanIni = transaksi.filter((t: TabunganTransaksi) =>
    t.jenis === "setor" &&
    new Date(t.tanggal).getMonth() === bulanIni &&
    new Date(t.tanggal).getFullYear() === tahunIni
  ).length

  const totalPenarikanBulanIni = transaksi.filter((t: TabunganTransaksi) =>
    t.jenis === "tarik" &&
    new Date(t.tanggal).getMonth() === bulanIni &&
    new Date(t.tanggal).getFullYear() === tahunIni
  ).length

  // --- FORMAT RUPIAH ---
  function formatRupiah(value: number) {
    const str = value.toString()
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }

  // --- MODAL HANDLER ---
  function openTransaksiModal({ santriId = "", kelas = "", jenis = "setor" as "setor" | "tarik" }) {
    setShowModal(true)
    setModalSantri(santriId)
    setModalKelas(kelas)
    setModalJenis(jenis)
    setModalNominal(0)
    setModalKeterangan("")
  }

  return (
    <>
      <TabunganAnalyticCards
        totalSaldo={totalSaldo}
        totalSantriAktif={totalSantriAktif}
        totalSetoranBulanIni={totalSetoranBulanIni}
        totalPenarikanBulanIni={totalPenarikanBulanIni}
      />

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle>Data Tabungan Santri</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filter dan tambah transaksi */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <TabunganFilter
              search={activeTab === "rekap" ? searchRekap : searchTransaksi}
              setSearch={activeTab === "rekap" ? setSearchRekap : setSearchTransaksi}
              kelasFilter={activeTab === "rekap" ? kelasFilterRekap : kelasFilterTransaksi}
              setKelasFilter={activeTab === "rekap" ? setKelasFilterRekap : setKelasFilterTransaksi}
            />
            <Button
              onClick={() => {
                setModalSantri("")
                setModalKelas("all")
                setModalJenis("setor")
                setModalNominal(0)
                setModalKeterangan("")
                setShowModal(true)
              }}
            >
              + Tambah Transaksi
            </Button>
          </div>

          {/* Tab switcher di bawah filter, dengan garis bawah */}
          <div className="flex gap-2 border-b mb-4">
            <Button
              variant={activeTab === "rekap" ? "default" : "ghost"}
              size="sm"
              className={activeTab === "rekap" ? "border-b-2 border-primary rounded-none" : "rounded-none"}
              onClick={() => setActiveTab("rekap")}
            >
              Rekap Tabungan
            </Button>
            <Button
              variant={activeTab === "transaksi" ? "default" : "ghost"}
              size="sm"
              className={activeTab === "transaksi" ? "border-b-2 border-primary rounded-none" : "rounded-none"}
              onClick={() => setActiveTab("transaksi")}
            >
              Riwayat Transaksi
            </Button>
          </div>

          {activeTab === "rekap" ? (
            <TabunganRekapTable
              data={sortedTabungan}
              onSetor={t => openTransaksiModal({ santriId: t.students?.id ?? "", kelas: t.students?.class ?? "", jenis: "setor" })}
              onTarik={t => openTransaksiModal({ santriId: t.students?.id ?? "", kelas: t.students?.class ?? "", jenis: "tarik" })}
              onSort={handleSort}
              getSortIcon={getSortIcon}
            />
          ) : (
            <TabunganTransaksiTable data={filteredTransaksi} />
          )}
        </CardContent>
      </Card>

      <TabunganTransaksiModal
        open={showModal}
        onOpenChange={setShowModal}
        modalSantri={modalSantri}
        setModalSantri={setModalSantri}
        modalKelas={modalKelas}
        setModalKelas={setModalKelas}
        modalJenis={modalJenis}
        setModalJenis={setModalJenis}
        modalNominal={modalNominal}
        setModalNominal={setModalNominal}
        modalKeterangan={modalKeterangan}
        setModalKeterangan={setModalKeterangan}
        santriByKelas={studentsWithSaldoByKelas}
        formatRupiah={formatRupiah}
        onSubmit={handleSubmitTransaksi}
      />
    </>
  )
}