import { useState, useEffect, useCallback } from "react"

export interface Student {
  id: string
  name: string
  class: string
  year_enrolled: number
  status: string
  created_at: string
  updated_at: string
}

export interface StudentInput {
  name: string
  class: string
  yearEnrolled: number
  status: string
}

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch semua students
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/students")
      if (!res.ok) throw new Error("Gagal mengambil data")
      const data = await res.json()
      setStudents(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }, [])

  // Tambah student
  const addStudent = async (input: StudentInput) => {
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    if (!res.ok) throw new Error("Gagal menambah santri")
    const newStudent = await res.json()
    setStudents((prev) => [...prev, newStudent])
    return newStudent
  }

  // Update student
  const updateStudent = async (id: string, input: StudentInput) => {
    const res = await fetch(`/api/students/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    if (!res.ok) throw new Error("Gagal mengubah santri")
    const updatedStudent = await res.json()
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? updatedStudent : s))
    )
    return updatedStudent
  }

  // Hapus student
  const deleteStudent = async (id: string) => {
    const res = await fetch(`/api/students/${id}`, {
      method: "DELETE",
    })
    if (!res.ok) throw new Error("Gagal menghapus santri")
    setStudents((prev) => prev.filter((s) => s.id !== id))
  }

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  return {
    students,
    loading,
    error,
    fetchStudents,
    addStudent,
    updateStudent,
    deleteStudent,
  }
}