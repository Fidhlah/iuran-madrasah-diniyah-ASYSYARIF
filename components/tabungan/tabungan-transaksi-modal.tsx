import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { CLASS_ORDER } from "@/utils/class-order"

type TabunganTransaksiModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  modalSantri: string
  setModalSantri: (value: string) => void
  modalKelas: string
  setModalKelas: (value: string) => void
  modalJenis: "setor" | "tarik"
  setModalJenis: React.Dispatch<React.SetStateAction<"setor" | "tarik">>
  modalNominal: number
  setModalNominal: React.Dispatch<React.SetStateAction<number>>
  modalKeterangan: string
  setModalKeterangan: (value: string) => void
  santriByKelas: Record<string, Santri[]>
  formatRupiah: (value: number) => string
  onSubmit: () => void
}
type Santri = {
  id: string
  name: string
  class: string
  saldo: number
  jumlahTransaksi: number
}

export default function TabunganTransaksiModal({
  open,
  onOpenChange,
  modalSantri,
  setModalSantri,
  modalKelas,
  setModalKelas,
  modalJenis,
  setModalJenis,
  modalNominal,
  setModalNominal,
  modalKeterangan,
  setModalKeterangan,
  santriByKelas,
  formatRupiah,
  onSubmit,
}: TabunganTransaksiModalProps) {
  // Handler: ketika nama santri dipilih, kelas otomatis ikut berubah
  function handleSantriChange(santriId: string) {
    setModalSantri(santriId)
    const found = Object.values(santriByKelas).flat().find((s: Santri) => s.id === santriId)
    if (found) setModalKelas(found.class)
  }

  // Cari saldo santri yang dipilih
  const selectedSantri =
    modalSantri &&
    Object.values(santriByKelas)
      .flat()
      .find((s: Santri) => s.id === modalSantri)
  const saldoSekarang = selectedSantri ? formatRupiah(selectedSantri.saldo) : "-"

  const isTarik = modalJenis === "tarik"
const saldoNumber = selectedSantri ? selectedSantri.saldo : 0
const nominalLebihBesar = isTarik && modalNominal > saldoNumber && saldoNumber > 0
const disableSubmit = isTarik && (modalNominal > saldoNumber || modalNominal === 0)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Transaksi Tabungan</DialogTitle>
          <DialogDescription>Isi data transaksi tabungan di bawah ini.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Nama Santri di kiri */}
            <div className="grid gap-2">
              <Label htmlFor="santri">Santri</Label>
              <Select value={modalSantri} onValueChange={handleSantriChange}>
                <SelectTrigger id="santri"><SelectValue placeholder="Pilih Santri" /></SelectTrigger>
                <SelectContent>
                  {(santriByKelas[modalKelas] || []).map((s: Santri) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Kelas di kanan */}
            <div className="grid gap-2">
              <Label htmlFor="kelas">Kelas</Label>
              <Select value={modalKelas} onValueChange={val => { setModalKelas(val); setModalSantri(""); }}>
                <SelectTrigger id="kelas"><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {CLASS_ORDER.map((kelas) => <SelectItem key={kelas} value={kelas}>{kelas}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Jenis Transaksi</Label>
            <div className="flex gap-4">
              {["setor", "tarik"].map((jenis) => (
                <label
                  key={jenis}
                  className={`flex items-center gap-2 cursor-pointer px-3 py-1 rounded-md border transition
                    ${modalJenis === jenis
                      ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary"
                      : "bg-muted text-muted-foreground border-border hover:border-primary"}`}
                >
                  <input
                    type="radio"
                    name="jenis"
                    value={jenis}
                    checked={modalJenis === jenis}
                    onChange={() => setModalJenis(jenis as "setor" | "tarik")}
                    className="accent-primary h-4 w-4"
                  />
                  <span className="font-medium capitalize">{jenis}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="nominal">Nominal</Label>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">Rp</span>
              <Input
                id="nominal"
                type="text"
                inputMode="numeric"
                value={formatRupiah(modalNominal)}
                onChange={e => setModalNominal(Number(e.target.value.replace(/\D/g, "")))}
              />
            </div>
            {modalJenis === "tarik" && (
              <div className="text-sm text-muted-foreground mt-1">
                Saldo sekarang: <span className="font-semibold">Rp. {saldoSekarang}</span>
                {nominalLebihBesar && (
                  <div className="text-xs text-red-600 flex items-center gap-1 mt-1">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Nominal penarikan melebihi saldo!
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="keterangan">Keterangan</Label>
            <Input id="keterangan" value={modalKeterangan} onChange={e => setModalKeterangan(e.target.value)} placeholder="Opsional" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button
            onClick={onSubmit}
            disabled={disableSubmit}
            className={disableSubmit ? "cursor-not-allowed opacity-60" : ""}
            title={disableSubmit ? "Nominal penarikan melebihi saldo" : ""}
          >
            Simpan Transaksi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}