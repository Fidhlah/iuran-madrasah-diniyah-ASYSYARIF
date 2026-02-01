import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"
import type { Tabungan } from "@/types/models"

interface TabunganRekapTableProps {
  data: Tabungan[]
  onSetor: (t: Tabungan) => void
  onTarik: (t: Tabungan) => void
  onSort: (field: "name" | "class" | "saldo" | "jumlahTransaksi") => void
  getSortIcon: (field: string) => React.ReactNode
}

export default function TabunganRekapTable({ data, onSetor, onTarik, onSort, getSortIcon }: TabunganRekapTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead
            className="cursor-pointer select-none"
            onClick={() => onSort?.("name")}
          >
            <div className="flex items-center gap-1">
              Nama Santri
              {getSortIcon?.("name")}
            </div>
          </TableHead>
          <TableHead
            className="cursor-pointer select-none"
            onClick={() => onSort?.("class")}
          >
            <div className="flex items-center gap-1">
              Kelas
              {getSortIcon?.("class")}
            </div>
          </TableHead>
          <TableHead
            className="cursor-pointer select-none"
            onClick={() => onSort?.("saldo")}
          >
            <div className="flex items-center gap-1">
              Saldo
              {getSortIcon?.("saldo")}
            </div>
          </TableHead>
          <TableHead
            className="cursor-pointer select-none"
            onClick={() => onSort?.("jumlahTransaksi")}
          >
            <div className="flex items-center gap-1">
              Jumlah Transaksi
              {getSortIcon?.("jumlahTransaksi")}
            </div>
          </TableHead>
          <TableHead>Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((t) => (
          <TableRow key={t.id}>
            <TableCell>{t.students?.name ?? "-"}</TableCell>
            <TableCell>{t.students?.class ?? "-"}</TableCell>
            <TableCell>{t.saldo}</TableCell>
            <TableCell>{t.jumlah_transaksi ?? 0}</TableCell>
            <TableCell>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSetor(t)}
              >
                Setor
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="ml-2"
                onClick={() => onTarik(t)}
              >
                Tarik
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}