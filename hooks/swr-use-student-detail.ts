import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
import { Student } from "@/types/models"

export function useSWRStudentDetail(studentId: string) {
  const { data, error, isLoading, mutate } = useSWR<Student>(
    `/api/students/${studentId}`,
    fetcher,
    { keepPreviousData: true }
  )
  return {
    student: data ?? null,
    parents: data?.parents ?? [],
    loading: isLoading,
    error,
    mutate,
  }
}