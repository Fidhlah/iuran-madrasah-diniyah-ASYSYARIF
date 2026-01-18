import { create } from "zustand"
import type { Student, StudentInput } from "./use-students"
import { persist } from "zustand/middleware"

interface StudentsStore {
  students: Student[]
  loading: boolean
  error: string | null
  fetchStudents: () => Promise<void>
  addStudent: (input: StudentInput) => Promise<Student>
  updateStudent: (id: string, input: StudentInput) => Promise<Student>
  deleteStudent: (id: string) => Promise<void>
}

export const useStudentsStore = create<StudentsStore>()(
persist(
    (set, get) => ({
      students: [],
      loading: false,
      error: null,
      async fetchStudents() {
        set({ loading: true })
        try {
          const res = await fetch("/api/students")
          const data = await res.json()
          set({ students: data, loading: false, error: null })
        } catch (e) {
          set({ loading: false, error: "Gagal mengambil data" })
        }
      },
      async addStudent(input: StudentInput) {
        const res = await fetch("/api/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        })
        if (!res.ok) throw new Error("Gagal menambah santri")
        const newStudent = await res.json()
        set({ students: [...get().students, newStudent] })
        return newStudent
      },
      async updateStudent(id: string, input: StudentInput) {
        const res = await fetch(`/api/students/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        })
        if (!res.ok) throw new Error("Gagal mengubah santri")
        const updatedStudent = await res.json()
        set({
          students: get().students.map((s) => (s.id === id ? updatedStudent : s)),
        })
        return updatedStudent
      },
      async deleteStudent(id: string) {
        const res = await fetch(`/api/students/${id}`, { method: "DELETE" })
        if (!res.ok) throw new Error("Gagal menghapus santri")
        set({ students: get().students.filter((s) => s.id !== id) })
      },
    }),
    {
      name: "students-storage", // nama key di localStorage
      partialize: (state) => ({ students: state.students }), // hanya students yang dipersist
    }
  )

)