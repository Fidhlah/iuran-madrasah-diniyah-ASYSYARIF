import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
import {Payment} from "@/types/models"

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