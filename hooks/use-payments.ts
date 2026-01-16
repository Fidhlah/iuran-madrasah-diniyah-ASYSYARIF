import { useState, useEffect, useCallback } from "react"

export interface Payment {
  id: string
  student_id: string
  month: number
  year: number
  amount: number
  is_paid: boolean
  paid_at: string | null
  created_at: string
  updated_at: string
  students?: {
    id: string
    name: string
    class: string
  }
}

export interface PaymentInput {
  studentId: string
  month: number
  year: number
  amount: number
  isPaid: boolean
  paidAt: string | null
}

export function usePayments(year?: number) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch semua payments
  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true)
      const params = year ? `?year=${year}` : ""
      const res = await fetch(`/api/payments${params}`)
      if (!res.ok) throw new Error("Gagal mengambil data pembayaran")
      const data = await res.json()
      setPayments(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }, [year])

  // Tandai pembayaran (bayar atau batal)
  const togglePayment = async (input: PaymentInput) => {
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    if (!res.ok) throw new Error("Gagal menyimpan pembayaran")
    const payment = await res.json()
    
    // Update local state
    setPayments((prev) => {
      const exists = prev.find(
        (p) =>
          p.student_id === input.studentId &&
          p.month === input.month &&
          p.year === input.year
      )
      if (exists) {
        return prev.map((p) =>
          p.student_id === input.studentId &&
          p.month === input.month &&
          p.year === input.year
            ? { ...p, ...payment }
            : p
        )
      }
      return [...prev, payment]
    })
    
    return payment
  }

  // Helper: Cek apakah sudah bayar
  const isPaid = (studentId: string, month: number, year: number): boolean => {
    const payment = payments.find(
      (p) =>
        p.student_id === studentId &&
        p.month === month &&
        p.year === year
    )
    return payment?.is_paid || false
  }

  // Helper: Ambil tanggal bayar
  const getPaidAt = (studentId: string, month: number, year: number): string | null => {
    const payment = payments.find(
      (p) =>
        p.student_id === studentId &&
        p.month === month &&
        p.year === year
    )
    return payment?.paid_at || null
  }

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  return {
    payments,
    loading,
    error,
    fetchPayments,
    togglePayment,
    isPaid,
    getPaidAt,
  }
}