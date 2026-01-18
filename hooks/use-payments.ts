import { useState, useEffect, useCallback } from "react"
import { usePaymentsStore } from "./payments-store"

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
  const {
    paymentsByYear,
    loading,
    error,
    fetchPayments,
    togglePayment,
    hasHydrated
  } = usePaymentsStore()

const payments = paymentsByYear[year ?? new Date().getFullYear()] || []

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