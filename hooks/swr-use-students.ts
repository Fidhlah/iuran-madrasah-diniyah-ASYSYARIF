import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
// import type { Student } from "./use-students"

export interface Student {
  id: string
  name: string
  class: string
  year_enrolled: number
  status: string
  created_at: string
  updated_at: string
}
// swr-use-students.ts
export interface StudentInput {
  name: string
  class: string
  yearEnrolled: number
  status: string
}
export function useSWRStudents() {
  const { data, error, isLoading, mutate } = useSWR<Student[]>("/api/students", fetcher)
  return {
    students: data ?? [],
    loading: isLoading,
    error,
    mutate,
  }
}