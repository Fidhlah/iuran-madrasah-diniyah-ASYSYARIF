import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
import type { Student } from "./use-students"

export function useSWRStudents() {
  const { data, error, isLoading, mutate } = useSWR<Student[]>("/api/students", fetcher)
  return {
    students: data ?? [],
    loading: isLoading,
    error,
    mutate,
  }
}