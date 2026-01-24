import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
import type { Payment } from "./use-payments"

export function useSWRPayments(year?: number) {
  const key = year ? `/api/payments?year=${year}` : "/api/payments"
  const { data, error, isLoading, mutate } = useSWR<Payment[]>(key, fetcher)
  return {
    payments: data ?? [],
    loading: isLoading,
    error,
    mutate,
  }
}