import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { CLASS_ORDER } from "@/utils/class-order"

type TabunganFilterProps = {
  search: string
  setSearch: (value: string) => void
  kelasFilter: string
  setKelasFilter: (value: string) => void
}

export default function TabunganFilter({
  search,
  setSearch,
  kelasFilter,
  setKelasFilter,
}: TabunganFilterProps) {
  return (
    <div className="flex flex-col md:flex-row gap-2 mb-4">
      <Input placeholder="Cari nama santri..." value={search} onChange={e => setSearch(e.target.value)} className="w-full md:w-64" />
      <Select value={kelasFilter} onValueChange={setKelasFilter}>
        <SelectTrigger className="w-full md:w-40">
          <SelectValue placeholder="Semua Kelas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Kelas</SelectItem>
          {CLASS_ORDER.map((kelas) => <SelectItem key={kelas} value={kelas}>{kelas}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button variant="outline" onClick={() => { setSearch(""); setKelasFilter("all"); }}>Reset</Button>
    </div>
  )
}