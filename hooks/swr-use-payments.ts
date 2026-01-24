import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
// import type { Payment } from "./use-payments"

// swr-use-payments.ts
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
export function useSWRPayments(year?: number) {
  const key = year ? `/api/payments?year=${year}` : "/api/payments"
  const { data, error, isLoading, mutate } = useSWR<Payment[]>(key, fetcher)
  const payments = data ?? []

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
  const fetchPayments = async () => {
    await mutate()
  }

  const togglePayment = async (data: {
    studentId: string
    month: number
    year: number
    amount: number
    isPaid: boolean
    paidAt: string | null
  }) => {
    await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    await mutate()
  }


  return {
    payments,
    loading: isLoading,
    error,
    mutate,
    isPaid,
    getPaidAt,
    fetchPayments,
    togglePayment,
  }
}