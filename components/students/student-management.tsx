"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useStudents, type StudentInput } from "@/hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { buildStudentListExportData, exportToExcel } from "@/utils/export-excel"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead,TableHeader,TableRow, } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog"
import { AlertDialog,AlertDialogAction,AlertDialogCancel,AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogTitle, } from "@/components/ui/alert-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Search, Pencil, Trash2, RotateCcw, ArrowUpDown, Loader2, DownloadIcon} from "lucide-react"

export default function StudentManagement() {
  const router = useRouter()
  const { toast } = useToast()
  const { students, loading, error, addStudent, updateStudent, deleteStudent } = useStudents()
  const classOptions = ["PAUD", "TK", "1", "2"]

  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingStudent, setEditingStudent] = useState<string | null>(null)
  const [deletingStudent, setDeletingStudent] = useState<string | null>(null)

  // Form input
  const [formData, setFormData] = useState<StudentInput>({
    name: "",
    class: "",
    yearEnrolled: new Date().getFullYear(),
    status: "active",
  })

  // Filter & Sort state
  const [searchQuery, setSearchQuery] = useState("")
  const [classFilter, setClassFilter] = useState("")
  const [yearFilter, setYearFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [sortField, setSortField] = useState<string>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Get unique values for filters
  const uniqueClasses = [...new Set(students.map((s) => s.class))].sort()
  const uniqueYears = [...new Set(students.map((s) => s.year_enrolled))].sort((a, b) => b - a)

  // Filter & Sort students
  const filteredStudents = students
    .filter((student) => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesClass = !classFilter || student.class === classFilter
      const matchesYear = !yearFilter || student.year_enrolled.toString() === yearFilter
      const matchesStatus = !statusFilter || student.status === statusFilter
      return matchesSearch && matchesClass && matchesYear && matchesStatus
    })
    .sort((a, b) => {
      let aVal: string | number = ""
      let bVal: string | number = ""

      switch (sortField) {
        case "name":
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
          break
        case "class":
          aVal = a.class
          bVal = b.class
          break
        case "year_enrolled":
          aVal = a.year_enrolled
          bVal = b.year_enrolled
          break
        case "status":
          aVal = a.status
          bVal = b.status
          break
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1
      return 0
    })

  // Handlers
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleResetFilters = () => {
    setSearchQuery("")
    setClassFilter("")
    setYearFilter("")
    setStatusFilter("")
  }

  const handleOpenDialog = (studentId?: string) => {
    if (studentId) {
      const student = students.find((s) => s.id === studentId)
      if (student) {
        setEditingStudent(studentId)
        setFormData({
          name: student.name,
          class: student.class,
          yearEnrolled: student.year_enrolled,
          status: student.status,
        })
      }
    } else {
      setEditingStudent(null)
      setFormData({
        name: "",
        class: "",
        yearEnrolled: new Date().getFullYear(),
        status: "active",
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.class) {
      toast({
        title: "Error",
        description: "Nama dan kelas harus diisi",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      if (editingStudent) {
        await updateStudent(editingStudent, formData)
        toast({
          title: "Berhasil",
          description: "Data santri berhasil diubah",
        })
      } else {
        await addStudent(formData)
        toast({
          title: "Berhasil",
          description: "Santri baru berhasil ditambahkan",
        })
      }
      setIsDialogOpen(false)
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingStudent) return

    setIsSubmitting(true)
    try {
      await deleteStudent(deletingStudent)
      toast({
        title: "Berhasil",
        description: "Santri berhasil dihapus",
      })
      setIsDeleteDialogOpen(false)
      setDeletingStudent(null)
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRowClick = (studentId: string) => {
    router.push(`/students/${studentId}`)
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="order-1">Data Santri</CardTitle>
          <div className="flex gap-2 order-2">
            <Button
              onClick={() => {
                const year = new Date().getFullYear()
                const data = buildStudentListExportData(students)
                exportToExcel({
                  data,
                  filename: `daftar_santri_${year}.xlsx`,
                  sheetName: "Daftar Santri",
                  origin: "B2"
                })
              }}
              variant="outline"
              className="gap-2"
            >
              <DownloadIcon className="h-4 w-4" />
              Export Santri
            </Button>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah Santri
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama santri..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {uniqueClasses.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tahun Masuk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tahun</SelectItem>
                {uniqueYears.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="nonactive">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleResetFilters} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-2">
                      Nama
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("class")}
                  >
                    <div className="flex items-center gap-2">
                      Kelas
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("year_enrolled")}
                  >
                    <div className="flex items-center gap-2">
                      Tahun Masuk
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {loading ? (
                // Tampilkan 5 baris skeleton sebagai contoh
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Tidak ada data santri
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow
                    key={student.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(student.id)}
                  >
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.class}</TableCell>
                    <TableCell>{student.year_enrolled}</TableCell>
                    <TableCell>
                      <Badge variant={student.status === "active" ? "default" : "secondary"}>
                        {student.status === "active" ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenDialog(student.id)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeletingStudent(student.id)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <div className="mt-4 text-sm text-muted-foreground">
            Menampilkan {filteredStudents.length} dari {students.length} santri
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStudent ? "Edit Santri" : "Tambah Santri Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingStudent
                ? "Ubah data santri di bawah ini"
                : "Isi data santri baru di bawah ini"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nama</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Masukkan nama santri"
              />
            </div>
            <div className="grid gap-2">
              <Label>Kelas</Label>
              <div className="flex gap-4">
                {classOptions.map((kelas) => (
                  <label
                    key={kelas}
                    className={`flex items-center gap-2 cursor-pointer px-3 py-1 rounded-md border transition
                      ${formData.class === kelas
                        ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary"
                        : "bg-muted text-muted-foreground border-border hover:border-primary"}`}
                  >
                    <input
                      type="radio"
                      name="class"
                      value={kelas}
                      checked={formData.class === kelas}
                      onChange={() => setFormData({ ...formData, class: kelas })}
                      className="accent-primary h-4 w-4"
                    />
                    <span className="font-medium">{kelas}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="yearEnrolled">Tahun Masuk</Label>
              <Input
                id="yearEnrolled"
                type="number"
                value={formData.yearEnrolled}
                onChange={(e) =>
                  setFormData({ ...formData, yearEnrolled: parseInt(e.target.value) })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="nonactive">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingStudent ? "Simpan" : "Tambah"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Santri?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data santri dan semua riwayat pembayarannya akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}