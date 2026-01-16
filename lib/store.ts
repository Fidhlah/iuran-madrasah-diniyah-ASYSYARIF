import { create } from "zustand"
import { persist } from "zustand/middleware"

interface Student {
  id: string
  nama_lengkap: string
  kelas: string
  tahun_masuk: number
  status_aktif: boolean
}

interface PaymentTransaction {
  id: string
  student_id: string
  bulan_tagihan: number
  tahun_tagihan: number
  tanggal_bayar: string
  jumlah_bayar: number
  status_transaksi: "Lunas" | "Dibatalkan"
}

interface StoreState {
  students: Student[]
  payments: PaymentTransaction[]
  paymentConfig: { nominal_default: number; tahun_ajaran: string }

  // Student actions
  addStudent: (student: Omit<Student, "id">) => void
  updateStudent: (id: string, student: Partial<Student>) => void
  deleteStudent: (id: string) => void

  // Payment actions
  addPayment: (payment: Omit<PaymentTransaction, "id">) => void
  voidPayment: (id: string) => void

  // Config actions
  updatePaymentConfig: (nominal: number) => void

  // Initialize with sample data
  initializeSampleData: () => void
}

export const useStudentStore = create<StoreState>()(
  persist(
    (set, get) => ({
      students: [],
      payments: [],
      paymentConfig: { nominal_default: 100000, tahun_ajaran: "2024/2025" },

      addStudent: (student) =>
        set((state) => ({
          students: [...state.students, { ...student, id: Date.now().toString() }],
        })),

      updateStudent: (id, updates) =>
        set((state) => ({
          students: state.students.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),

      deleteStudent: (id) =>
        set((state) => ({
          students: state.students.filter((s) => s.id !== id),
          payments: state.payments.filter((p) => p.student_id !== id),
        })),

      addPayment: (payment) =>
        set((state) => ({
          payments: [...state.payments, { ...payment, id: Date.now().toString() }],
        })),

      voidPayment: (id) =>
        set((state) => ({
          payments: state.payments.map((p) => (p.id === id ? { ...p, status_transaksi: "Dibatalkan" as const } : p)),
        })),

      updatePaymentConfig: (nominal) =>
        set((state) => ({
          paymentConfig: { ...state.paymentConfig, nominal_default: nominal },
        })),

      initializeSampleData: () =>
        set({
          students: [
            {
              id: "1",
              nama_lengkap: "Muhammad Rizki Pratama",
              kelas: "1A",
              tahun_masuk: 2023,
              status_aktif: true,
            },
            {
              id: "2",
              nama_lengkap: "Siti Nurhaliza",
              kelas: "2B",
              tahun_masuk: 2022,
              status_aktif: true,
            },
            {
              id: "3",
              nama_lengkap: "Ahmad Fauzan",
              kelas: "3A",
              tahun_masuk: 2021,
              status_aktif: true,
            },
            {
              id: "4",
              nama_lengkap: "Fatimah Azzahra",
              kelas: "1B",
              tahun_masuk: 2024,
              status_aktif: true,
            },
            {
              id: "5",
              nama_lengkap: "Bayu Hermawan",
              kelas: "2A",
              tahun_masuk: 2023,
              status_aktif: true,
            },
          ],
          payments: [
            {
              id: "1",
              student_id: "1",
              bulan_tagihan: 1,
              tahun_tagihan: 2025,
              tanggal_bayar: "2025-01-05",
              jumlah_bayar: 100000,
              status_transaksi: "Lunas",
            },
            {
              id: "2",
              student_id: "2",
              bulan_tagihan: 1,
              tahun_tagihan: 2025,
              tanggal_bayar: "2025-01-10",
              jumlah_bayar: 100000,
              status_transaksi: "Lunas",
            },
          ],
        }),
    }),
    {
      name: "student-store",
    },
  ),
)
