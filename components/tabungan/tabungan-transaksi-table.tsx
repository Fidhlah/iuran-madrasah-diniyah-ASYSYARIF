import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowDown, ArrowUp } from "lucide-react"
import type { TabunganTransaksi } from "@/types/models"

type Transaksi = {
  id: string
  tanggal: string
  name: string
  class: string
  jenis: "setor" | "tarik"
  nominal: number
  keterangan: string
  saldoSetelah: number
}

type TabunganTransaksiTableProps = {
  data: TabunganTransaksi[]
}

function formatTanggal(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
}

function formatRupiah(value: number) {
  return value.toLocaleString("id-ID", { style: "currency", currency: "IDR" })
}

export default function TabunganTransaksiTable({ data }: TabunganTransaksiTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tanggal</TableHead>
          <TableHead>Nama</TableHead>
          <TableHead>Kelas</TableHead>
          <TableHead>Transaksi</TableHead>
          <TableHead>Keterangan</TableHead>
          <TableHead>Saldo Setelah</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((t: TabunganTransaksi) => (
          <TableRow key={t.id}>
            <TableCell>{formatTanggal(t.tanggal)}</TableCell>
            <TableCell>{t.students?.name ?? "-"}</TableCell>
            <TableCell>{t.students?.class ?? "-"}</TableCell>
            <TableCell>
              <span
                className={`inline-flex items-center gap-1 font-semibold ${
                  t.jenis === "setor" ? "text-green-600" : "text-red-600"
                }`}
              >
                {t.jenis === "setor" ? (
                  <ArrowDown size={16} />
                ) : (
                  <ArrowUp size={16} />
                )}
                {formatRupiah(t.nominal)}
              </span>
            </TableCell>
            <TableCell>{t.keterangan ?? ""}</TableCell>
            <TableCell>{formatRupiah(t.saldo_setelah ?? 0)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}