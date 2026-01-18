import { create } from "zustand"
import type { Payment, PaymentInput } from "./use-payments"
import { persist } from "zustand/middleware"

interface PaymentsStore {
  paymentsByYear: { [year: number]: Payment[] }
  loading: boolean
  error: string | null
  hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
  fetchPayments: (year: number) => Promise<void>
  togglePayment: (input: PaymentInput) => Promise<Payment>
}

export const usePaymentsStore = create<PaymentsStore>()(
    persist(
    (set, get) => ({
    paymentsByYear: {},
    loading: false,
    error: null,
    hasHydrated: false,
    setHasHydrated: (state: boolean) => set({ hasHydrated: state }),
    async fetchPayments(year: number) {
        // Jika sudah ada di cache, tidak perlu fetch
        if (get().paymentsByYear[year]) return
        set({ loading: true })
        try {
            const res = await fetch(`/api/payments?year=${year}`)
            if (!res.ok) throw new Error("Gagal mengambil data pembayaran")
            const data = await res.json()
            set((state) => ({
            paymentsByYear: { ...state.paymentsByYear, [year]: data },
            loading: false,
            error: null,
            }))
        } catch (err) {
            set({ loading: false, error: err instanceof Error ? err.message : "Terjadi kesalahan" })
        }
    },
  async togglePayment(input: PaymentInput) {
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    if (!res.ok) throw new Error("Gagal menyimpan pembayaran")
    const payment = await res.json()
    // Update state payments
    set((state) => {
        const year = payment.year
        const payments = state.paymentsByYear[year] || []
        const exists = payments.find(
            (p) =>
            p.student_id === input.studentId &&
            p.month === input.month &&
            p.year === input.year
        )
        let newPayments
        if (exists) {
            newPayments = payments.map((p) =>
            p.student_id === input.studentId &&
            p.month === input.month &&
            p.year === input.year
                ? { ...p, ...payment }
                : p
            )
        } else {
            newPayments = [...payments, payment]
        }
        return {
            paymentsByYear: { ...state.paymentsByYear, [year]: newPayments }
        }
        })
    return payment
  },
    }),
    {
        name: "payments-storage", // nama key di localStorage
        partialize: (state) => ({ paymentsByYear: state.paymentsByYear }),      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)