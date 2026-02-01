import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useState } from "react"

interface FinancesFormModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (data: {
        date: string
        type: "income" | "expense"
        amount: number
        description: string
    }) => Promise<void>
}

// Format number with thousand separators (dots)
function formatRupiah(value: number): string {
    if (!value) return ""
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

// Parse formatted string back to number
function parseRupiah(value: string): number {
    return Number(value.replace(/\./g, "")) || 0
}

export default function FinancesFormModal({
    open,
    onOpenChange,
    onSubmit,
}: FinancesFormModalProps) {
    const [type, setType] = useState<"income" | "expense">("expense")
    const [date, setDate] = useState(new Date().toISOString().split("T")[0])
    const [amount, setAmount] = useState<number>(0)
    const [amountDisplay, setAmountDisplay] = useState("")
    const [description, setDescription] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\./g, "") // Remove dots
        const numValue = Number(raw) || 0
        setAmount(numValue)
        setAmountDisplay(formatRupiah(numValue))
    }

    const handleSubmit = async () => {
        if (!date || !amount || !description.trim()) return
        setIsSubmitting(true)
        try {
            await onSubmit({
                date,
                type,
                amount,
                description,
            })
            // Reset form
            setType("expense")
            setDate(new Date().toISOString().split("T")[0])
            setAmount(0)
            setAmountDisplay("")
            setDescription("")
            onOpenChange(false)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Tambah Data Keuangan</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                    {/* Type - Styled Radio Buttons */}
                    <div className="space-y-2">
                        <Label>Jenis</Label>
                        <div className="flex gap-4">
                            <label
                                className={`flex items-center gap-2 cursor-pointer px-3 py-1 rounded-md border transition
                                    ${type === "expense"
                                        ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary"
                                        : "bg-muted text-muted-foreground border-border hover:border-primary"}`}
                            >
                                <input
                                    type="radio"
                                    name="type"
                                    value="expense"
                                    checked={type === "expense"}
                                    onChange={() => setType("expense")}
                                    className="accent-primary h-4 w-4"
                                />
                                <span className="font-medium">Pengeluaran</span>
                            </label>
                            <label
                                className={`flex items-center gap-2 cursor-pointer px-3 py-1 rounded-md border transition
                                    ${type === "income"
                                        ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary"
                                        : "bg-muted text-muted-foreground border-border hover:border-primary"}`}
                            >
                                <input
                                    type="radio"
                                    name="type"
                                    value="income"
                                    checked={type === "income"}
                                    onChange={() => setType("income")}
                                    className="accent-primary h-4 w-4"
                                />
                                <span className="font-medium">Pemasukan</span>
                            </label>
                        </div>
                    </div>
                    {/* Date */}
                    <div className="space-y-2">
                        <Label>Tanggal</Label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                    {/* Amount with thousand separator */}
                    <div className="space-y-2">
                        <Label>Jumlah (Rp)</Label>
                        <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={amountDisplay}
                            onChange={handleAmountChange}
                        />
                    </div>
                    {/* Description */}
                    <div className="space-y-2">
                        <Label>Deskripsi</Label>
                        <Textarea
                            placeholder="Contoh: Bayar listrik bulan Januari"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>
                    {/* Actions */}
                    <div className="flex gap-2 pt-4">
                        <Button
                            onClick={handleSubmit}
                            className="flex-1"
                            disabled={isSubmitting || !amount || !description.trim()}
                        >
                            {isSubmitting ? "Menyimpan..." : "Simpan"}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            Batal
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
