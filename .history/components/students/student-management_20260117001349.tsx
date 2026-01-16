"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useStudentStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

type SortField = "nama" | "kelas" | "tahun" | "status"

export default function StudentManagement() {
  const router = useRouter()
  const { students, addStudent, updateStudent, deleteStudent, initializeSampleData } = useStudentStore()
  const { toast } = useToast()

  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedYear, setSelectedYear] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [sortField, setSortField] = useState<SortField>("nama")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [formData, setFormData] = useState({
    nama_lengkap: "",
    kelas: "",
    tahun_masuk: new Date().getFullYear(),
    status_aktif: true,
  })

  // Initialize sample data on first load
  useEffect(() => {
    if (students.length === 0) {
      initializeSampleData()
    }
  }, [])

  const resetForm = () => {
    setFormData({
      nama_lengkap: "",
      kelas: "",
      tahun_masuk: new Date().getFullYear(),
      status_aktif: true,
    })
    setEditingId(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nama_lengkap.trim() || !formData.kelas.trim()) {
      toast({
        title: "Error",
        description: "Semua field harus diisi",
        variant: "destructive",
      })
      return
    }

    if (editingId) {
      updateStudent(editingId, formData)
      toast({
        title: "Berhasil",
        description: "Data santri berhasil diperbarui",
      })
    } else {
      addStudent(formData)
      toast({
        title: "Berhasil",
        description: "Data santri berhasil ditambahkan",
      })
    }

    resetForm()
    setIsOpen(false)
  }

  const handleEdit = (student: any) => {
    setFormData({
      nama_lengkap: student.nama_lengkap,
      kelas: student.kelas,
      tahun_masuk: student.tahun_masuk,
      status_aktif: student.status_aktif,
    })
    setEditingId(student.id)
    setIsOpen(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data santri ini?")) {
      deleteStudent(id)
      toast({
        title: "Berhasil",
        description: "Data santri berhasil dihapus",
      })
    }
  }

  const handleViewDetail = (studentId: string) => {
    router.push(`/students/${studentId}`)
  }

  // Get unique values for filters
  const classes = useMemo(() => {
    return [...new Set(students.map((s) => s.kelas))].sort()
  }, [students])

  const years = useMemo(() => {
    return [...new Set(students.map((s) => s.tahun_masuk))].sort((a, b) => b - a)
  }, [students])

  // Sorting logic
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
    return sortOrder === "asc" 
      ? <ArrowUp className="w-3.5 h-3.5" /> 
      : <ArrowDown className="w-3.5 h-3.5" />
  }

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => s.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter((s) => (selectedClass ? s.kelas === selectedClass : true))
      .filter((s) => (selectedYear ? s.tahun_masuk === Number.parseInt(selectedYear) : true))
      .filter((s) => {
        if (!selectedStatus) return true
        if (selectedStatus === "aktif") return s.status_aktif
        if (selectedStatus === "alumni") return !s.status_aktif
        return true
      })
      .sort((a, b) => {
        let compare = 0
        switch (sortField) {
          case "nama":
            compare = a.nama_lengkap.localeCompare(b.nama_lengkap)
            break
          case "kelas":
            compare = a.kelas.localeCompare(b.kelas)
            break
          case "tahun":
            compare = a.tahun_masuk - b.tahun_masuk
            break
          case "status":
            compare = (a.status_aktif ? 1 : 0) - (b.status_aktif ? 1 : 0)
            break
        }
        return sortOrder === "asc" ? compare : -compare
      })
  }, [students, searchTerm, selectedClass, selectedYear, selectedStatus, sortField, sortOrder])

  const resetFilters = () => {
    setSearchTerm("")
    setSelectedClass("")
    setSelectedYear("")
    setSelectedStatus("")
    setSortField("nama")
    setSortOrder("asc")
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl tracking-tight">Manajemen Data santri</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Kelola informasi santri aktif dan arsip</p>
          </div>
          <Button
            onClick={() => {
              resetForm()
              setIsOpen(true)
            }}
            className="gap-2 shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Tambah santri
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          <div className="col-span-2">
            <Input
              placeholder="Cari nama santri..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 text-sm"
            />
          </div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="h-9 px-3 py-1 rounded-lg border border-border bg-card text-foreground text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Semua Kelas</option>
            {classes.map((cls) => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="h-9 px-3 py-1 rounded-lg border border-border bg-card text-foreground text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Semua Tahun</option>
            {years.map((yr) => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 px-3 py-1 rounded-lg border border-border bg-card text-foreground text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="alumni">Alumni</option>
          </select>
          <Button onClick={resetFilters} variant="ghost" size="sm" className="h-9">
            Reset
          </Button>
        </div>

        {/* Form Modal */}
        {isOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 mb-6">
            <Card className="w-full max-w-md border-0 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-lg">{editingId ? "Edit Data santri" : "Tambah Data santri"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Nama Lengkap</label>
                    <Input
                      placeholder="Masukkan nama lengkap"
                      value={formData.nama_lengkap}
                      onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Kelas</label>
                    <select
                      value={formData.kelas}
                      onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                      className="w-full h-11 px-3 py-2 rounded-xl border border-border bg-card text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    >
                      <option value="">Pilih Kelas</option>
                      <option value="1A">1A</option>
                      <option value="1B">1B</option>
                      <option value="2A">2A</option>
                      <option value="2B">2B</option>
                      <option value="3A">3A</option>
                      <option value="3B">3B</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Tahun Masuk</label>
                    <Input
                      type="number"
                      value={formData.tahun_masuk}
                      onChange={(e) => setFormData({ ...formData, tahun_masuk: Number.parseInt(e.target.value) })}
                      className="h-11"
                    />
                  </div>

                  <div className="flex items-center gap-3 py-2">
                    <input
                      type="checkbox"
                      checked={formData.status_aktif}
                      onChange={(e) => setFormData({ ...formData, status_aktif: e.target.checked })}
                      className="w-5 h-5 rounded-md border-2 border-primary text-primary focus:ring-primary focus:ring-offset-0"
                    />
                    <label className="text-sm font-medium">santri Aktif</label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="flex-1 h-11 shadow-lg shadow-primary/20">
                      {editingId ? "Simpan Perubahan" : "Tambah santri"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        resetForm()
                        setIsOpen(false)
                      }}
                      className="flex-1 h-11"
                    >
                      Batal
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/30 hover:bg-secondary/30">
              <TableHead className="font-semibold">Nama santri</TableHead>
              <TableHead className="font-semibold">Kelas</TableHead>
              <TableHead className="font-semibold">Tahun Masuk</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <TableRow key={student.id} className="hover:bg-secondary/20 transition-colors">
                  <TableCell className="font-medium">{student.nama_lengkap}</TableCell>
                  <TableCell className="text-muted-foreground">{student.kelas}</TableCell>
                  <TableCell className="text-muted-foreground">{student.tahun_masuk}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        student.status_aktif 
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {student.status_aktif ? "Aktif" : "Alumni"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleViewDetail(student.id)} className="h-8 w-8 p-0">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(student)} className="h-8 w-8 p-0">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(student.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Tidak ada data santri</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
