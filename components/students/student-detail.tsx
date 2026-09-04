"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "../ui/skeleton"
import { ArrowUpDown, ArrowUp, ArrowDown, Loader2, Pencil } from "lucide-react"
import { MONTHS } from "@/utils/months"
import { useSWRStudents } from "@/hooks/swr-use-students"
import { useSWRPayments } from "@/hooks/swr-use-payments"
import { useSWRStudentDetail } from "@/hooks/swr-use-student-detail"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { ParentPayload } from "@/types/models"

interface StudentDetailProps {
  studentId: string
}

const RELATIONS: ("ayah" | "ibu")[] = ["ayah", "ibu"]
const GENDERS = ["Laki-laki", "Perempuan"]

const EMPTY_PERSONAL = {
  nik: "",
  gender: "",
  birthPlace: "",
  birthDate: "",
  address: "",
  phone: "",
}

const EMPTY_PARENT = {
  name: "",
  nik: "",
  phone: "",
  occupation: "",
  email: "",
  address: "",
}

type PersonalForm = typeof EMPTY_PERSONAL
type ParentForm = typeof EMPTY_PARENT

const PARENT_PLACEHOLDER: Partial<Record<keyof ParentForm, string>> = {
  name: "Nama lengkap",
  nik: "Contoh: 3200xxxxxxxxxxxx (16 digit)",
  phone: "Contoh: 0812-3456-7890",
  occupation: "Contoh: Wiraswasta / Guru",
  email: "Contoh: nama@email.com",
  address: "Contoh: Kp. Malabar, RT 01/02 Kel. Padasuka",
}

export default function StudentDetail({ studentId }: StudentDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { students, loading: studentsLoading } = useSWRStudents()
  const { student: fetched, loading: detailLoading, error: detailError, mutate: mutateDetail } = useSWRStudentDetail(studentId)
  const { payments, loading: paymentsLoading } = useSWRPayments()
  const isLoading = studentsLoading || paymentsLoading || detailLoading

  const [sortField, setSortField] = useState<"year" | "paid_at">("year")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Form state data pribadi & orang tua (inline edit)
  const [personal, setPersonal] = useState<typeof EMPTY_PERSONAL>({ ...EMPTY_PERSONAL })
  const [parentAyah, setParentAyah] = useState<ParentForm>({ ...EMPTY_PARENT })
  const [parentIbu, setParentIbu] = useState<ParentForm>({ ...EMPTY_PARENT })
  const [savingPersonal, setSavingPersonal] = useState(false)
  const [savingParents, setSavingParents] = useState(false)
  // Mode edit: default false → tampilan read-only, form hanya muncul saat klik Edit
  const [editPersonal, setEditPersonal] = useState(false)
  const [editParents, setEditParents] = useState(false)

  const handleSort = (field: "year" | "paid_at") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("desc")
    }
  }

  const getSortIcon = (field: "year" | "paid_at") => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
    return sortOrder === "asc"
      ? <ArrowUp className="w-3.5 h-3.5" />
      : <ArrowDown className="w-3.5 h-3.5" />
  }

  const student = useMemo(() => students.find((s) => s.id === studentId), [students, studentId])

  const studentPayments = useMemo(() => {
    return payments
      .filter((p) => p.student_id === studentId && p.is_paid === true)
      .sort((a, b) => {
        if (sortField === "year") {
          if (a.year !== b.year) return sortOrder === "asc" ? a.year - b.year : b.year - a.year
          if (a.month !== b.month) return sortOrder === "asc" ? a.month - b.month : b.month - a.month
          const dateA = new Date(a.paid_at ?? 0)
          const dateB = new Date(b.paid_at ?? 0)
          return sortOrder === "asc" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
        } else if (sortField === "paid_at") {
          const dateA = new Date(a.paid_at ?? 0)
          const dateB = new Date(b.paid_at ?? 0)
          return sortOrder === "asc" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
        }
        return 0
      })
  }, [payments, studentId, sortField, sortOrder])

  const handleBack = () => router.back()

  // Inisialisasi form ketika data santri (termasuk parents) sudah termuat
  useEffect(() => {
    if (fetched) {
      setPersonal({
        nik: fetched.nik ?? "",
        gender: fetched.gender ?? "",
        birthPlace: fetched.birth_place ?? "",
        birthDate: fetched.birth_date ? String(fetched.birth_date).slice(0, 10) : "",
        address: fetched.address ?? "",
        phone: fetched.phone ?? "",
      })
    }
    const pAyah = fetched?.parents?.find((p) => p.relation === "ayah")
    const pIbu = fetched?.parents?.find((p) => p.relation === "ibu")
    const toForm = (p?: { name?: string | null; nik?: string | null; phone?: string | null; occupation?: string | null; email?: string | null; address?: string | null }): ParentForm => ({
      name: p?.name ?? "",
      nik: p?.nik ?? "",
      phone: p?.phone ?? "",
      occupation: p?.occupation ?? "",
      email: p?.email ?? "",
      address: p?.address ?? "",
    })
    setParentAyah(toForm(pAyah))
    setParentIbu(toForm(pIbu))
  }, [fetched])

  const baseStudent = {
    name: student?.name,
    class: student?.class,
    yearEnrolled: student?.year_enrolled,
    status: student?.status,
  }

  const toParentPayload = (f: ParentForm): ParentPayload =>
    Object.fromEntries(
      Object.entries(f).map(([k, v]) => [k, v.trim() ? v.trim() : null])
    ) as unknown as ParentPayload

  const savePersonal = async () => {
    setSavingPersonal(true)
    try {
      await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...baseStudent,
          nik: personal.nik || null,
          gender: personal.gender || null,
          birthPlace: personal.birthPlace || null,
          birthDate: personal.birthDate || null,
          address: personal.address || null,
          phone: personal.phone || null,
        }),
      })
      await mutateDetail()
      setEditPersonal(false)
      toast({ title: "Berhasil", description: "Data pribadi tersimpan" })
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Terjadi kesalahan", variant: "destructive" })
    } finally {
      setSavingPersonal(false)
    }
  }

  const cancelEditPersonal = () => {
    if (fetched) {
      setPersonal({
        nik: fetched.nik ?? "",
        gender: fetched.gender ?? "",
        birthPlace: fetched.birth_place ?? "",
        birthDate: fetched.birth_date ? String(fetched.birth_date).slice(0, 10) : "",
        address: fetched.address ?? "",
        phone: fetched.phone ?? "",
      })
    }
    setEditPersonal(false)
  }

  const cancelEditParents = () => {
    const pAyah = fetched?.parents?.find((p) => p.relation === "ayah")
    const pIbu = fetched?.parents?.find((p) => p.relation === "ibu")
    const toForm = (p?: { name?: string | null; nik?: string | null; phone?: string | null; occupation?: string | null; email?: string | null; address?: string | null }): ParentForm => ({
      name: p?.name ?? "",
      nik: p?.nik ?? "",
      phone: p?.phone ?? "",
      occupation: p?.occupation ?? "",
      email: p?.email ?? "",
      address: p?.address ?? "",
    })
    setParentAyah(toForm(pAyah))
    setParentIbu(toForm(pIbu))
    setEditParents(false)
  }

  const saveParents = async () => {
    setSavingParents(true)
    try {
      await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...baseStudent,
          parents: {
            ayah: toParentPayload(parentAyah),
            ibu: toParentPayload(parentIbu),
          },
        }),
      })
      await mutateDetail()
      setEditParents(false)
      toast({ title: "Berhasil", description: "Data orang tua tersimpan" })
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Terjadi kesalahan", variant: "destructive" })
    } finally {
      setSavingParents(false)
    }
  }

  // SKELETON LOADING
  if (isLoading) {
    return (
      <div className="w-full">
        <Button onClick={handleBack} variant="ghost" className="mb-6 gap-2 hover:bg-secondary/80">
          <ChevronLeft className="w-4 h-4" /> Kembali
        </Button>
        {[0, 1].map((i) => (
          <Card key={i} className="mb-8 border-0 shadow-sm">
            <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j}><Skeleton className="h-10 w-full" /></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (detailError) {
    return (
      <div className="w-full">
        <Button onClick={handleBack} variant="ghost" className="mb-6"><ChevronLeft className="w-4 h-4" /> Kembali</Button>
        <Card><CardContent className="pt-6 text-center text-muted-foreground">Gagal mengambil data santri</CardContent></Card>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="w-full">
        <Button onClick={handleBack} variant="ghost" className="mb-6"><ChevronLeft className="w-4 h-4" /> Kembali</Button>
        <Card><CardContent className="pt-6 text-center text-muted-foreground">Data santri tidak ditemukan</CardContent></Card>
      </div>
    )
  }

  const isActive = student.status === "active"
  const statusClass = isActive ? "bg-emerald-500/90 text-white" : "bg-red-500/90 text-white"

  const ParentFields = ({ label, rel, form, setForm }: {
    label: string
    rel: "ayah" | "ibu"
    form: ParentForm
    setForm: React.Dispatch<React.SetStateAction<ParentForm>>
  }) => {
    const fields: { key: keyof ParentForm; labelForm: string; type?: string }[] = [
      { key: "name", labelForm: "Nama" },
      { key: "nik", labelForm: "NIK" },
      { key: "phone", labelForm: "No. HP" },
      { key: "occupation", labelForm: "Pekerjaan" },
      { key: "email", labelForm: "Email", type: "email" },
      { key: "address", labelForm: "Alamat" },
    ]
    return (
      <div className="rounded-lg border p-4">
        <div className="mb-4 pb-3 border-b text-center">
          <span className="text-base font-semibold text-foreground capitalize tracking-wide">{label}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.key} className={`grid gap-2 ${f.key === "address" ? "sm:col-span-2" : ""}`}>
              <Label htmlFor={`${label}-${f.key}`}>{f.labelForm}</Label>
              <Input
                id={`${label}-${f.key}`}
                type={f.type}
                value={form[f.key]}
                placeholder={PARENT_PLACEHOLDER[f.key] || ""}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <Button onClick={handleBack} variant="ghost" className="mb-2 gap-2 hover:bg-secondary/80">
        <ChevronLeft className="w-4 h-4" /> Kembali
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informasi Santri */}
        <Card className="border-0 shadow-sm h-fit">
          <CardHeader><CardTitle className="text-xl tracking-tight">Informasi santri</CardTitle></CardHeader>
          <CardContent>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Nama Lengkap</p>
              <p className="text-lg font-semibold text-foreground">{student.name}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Kelas</p>
                <p className="text-lg font-semibold text-foreground">{student.class}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Tahun Masuk</p>
                <p className="text-lg font-semibold text-foreground">{student.year_enrolled}</p>
              </div>
            </div>
            <div className="flex justify-center mt-6">
              <span className={`inline-block w-full sm:w-2/3 md:w-1/2 text-center px-3 py-2 rounded-lg font-bold text-base tracking-wide shadow ${statusClass}`}>
                {isActive ? "Aktif" : "Nonaktif"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Riwayat Pembayaran */}
        <Card className="border-0 shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-xl tracking-tight">Riwayat Pembayaran</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Total pembayaran: <span className="font-semibold text-foreground">{studentPayments.length}</span> transaksi
            </p>
          </CardHeader>
          <CardContent>
            {studentPayments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                    <TableHead className="font-semibold">Bulan</TableHead>
                    <TableHead className="font-semibold cursor-pointer select-none" onClick={() => handleSort("year")}>
                      <span className="flex items-center gap-1">Tahun {getSortIcon("year")}</span>
                    </TableHead>
                    <TableHead className="font-semibold cursor-pointer select-none" onClick={() => handleSort("paid_at")}>
                      <span className="flex items-center gap-1">Tanggal Pembayaran {getSortIcon("paid_at")}</span>
                    </TableHead>
                    <TableHead className="font-semibold text-right">Nominal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentPayments.map((payment) => {
                    const monthName = MONTHS.find((m) => m.num === payment.month)?.name
                    return (
                      <TableRow key={payment.id} className="hover:bg-secondary/20 transition-colors">
                        <TableCell className="font-medium">{monthName}</TableCell>
                        <TableCell className="text-muted-foreground">{payment.year}</TableCell>
                        <TableCell className="text-muted-foreground">{new Date(payment.paid_at ?? 0).toLocaleDateString("id-ID")}</TableCell>
                        <TableCell className="text-right font-semibold text-primary">Rp {payment.amount.toLocaleString("id-ID")}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground"><p>Belum ada riwayat pembayaran untuk santri ini</p></div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Pribadi — read-only default, form saat Edit */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-xl tracking-tight">Data Pribadi</CardTitle>
          {!editPersonal && (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditPersonal(true)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!editPersonal ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { label: "NIK", value: personal.nik },
                { label: "Jenis Kelamin", value: personal.gender },
                { label: "Tempat, Tanggal Lahir", value: [personal.birthPlace, personal.birthDate ? new Date(personal.birthDate).toLocaleDateString("id-ID") : null].filter(Boolean).join(", ") },
                { label: "Alamat", value: personal.address },
                { label: "No. HP", value: personal.phone },
              ].map((f) => (
                <div key={f.label}>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{f.label}</p>
                  <p className="text-base font-semibold text-foreground">{f.value || "—"}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="nik">NIK</Label>
                  <Input id="nik" value={personal.nik} onChange={(e) => setPersonal({ ...personal, nik: e.target.value })} placeholder="Contoh: 3200xxxxxxxxxxxx (16 digit)" />
                </div>
                <div className="grid gap-2">
                  <Label>Jenis Kelamin</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {GENDERS.map((g) => (
                      <label
                        key={g}
                        className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-md border transition whitespace-nowrap
                          ${personal.gender === g
                            ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary"
                            : "bg-muted text-muted-foreground border-border hover:border-primary"}`}
                      >
                        <input
                          type="radio"
                          name="gender"
                          value={g}
                          checked={personal.gender === g}
                          onChange={() => setPersonal({ ...personal, gender: g })}
                          className="accent-primary h-4 w-4"
                        />
                        <span className="font-medium">{g}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="birthPlace">Tempat Lahir</Label>
                  <Input id="birthPlace" value={personal.birthPlace} onChange={(e) => setPersonal({ ...personal, birthPlace: e.target.value })} placeholder="Contoh: Bandung" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="birthDate">Tanggal Lahir</Label>
                  <Input id="birthDate" type="date" value={personal.birthDate} onChange={(e) => setPersonal({ ...personal, birthDate: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Alamat</Label>
                <Input id="address" value={personal.address} onChange={(e) => setPersonal({ ...personal, address: e.target.value })} placeholder="Contoh: Kp. Malabar, RT 01/02 Kel. Padasuka" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">No. HP</Label>
                <Input id="phone" value={personal.phone} onChange={(e) => setPersonal({ ...personal, phone: e.target.value })} placeholder="Contoh: 0812-3456-7890" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={cancelEditPersonal}>Batal</Button>
                <Button onClick={savePersonal} disabled={savingPersonal}>
                  {savingPersonal && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Data Pribadi
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orang Tua — read-only default, form saat Edit */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-xl tracking-tight">Orang Tua</CardTitle>
          {!editParents && (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditParents(true)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!editParents ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {RELATIONS.map((rel) => {
                const p = rel === "ayah" ? parentAyah : parentIbu
                const rows = [
                  { label: "Nama", value: p.name },
                  { label: "NIK", value: p.nik },
                  { label: "No. HP", value: p.phone },
                  { label: "Pekerjaan", value: p.occupation },
                  { label: "Email", value: p.email },
                  { label: "Alamat", value: p.address },
                ]
                return (
                  <div key={rel} className="rounded-lg border p-4">
                    <div className="mb-4 pb-3 border-b text-center">
                      <span className="text-base font-semibold text-foreground capitalize tracking-wide">{rel}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {rows.map((r) => (
                        <div key={r.label}>
                          <p className="text-xs text-muted-foreground">{r.label}</p>
                          <p className="text-sm font-medium text-foreground">{r.value || "—"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ParentFields label="Ayah" rel="ayah" form={parentAyah} setForm={setParentAyah} />
                <ParentFields label="Ibu" rel="ibu" form={parentIbu} setForm={setParentIbu} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={cancelEditParents}>Batal</Button>
                <Button onClick={saveParents} disabled={savingParents}>
                  {savingParents && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Orang Tua
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}