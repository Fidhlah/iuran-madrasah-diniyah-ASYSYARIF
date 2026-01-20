"use client"

import { use } from "react"
import { StudentDetail } from "@/components/students"

interface StudentDetailPageProps {
  params: Promise<{ id: string }>
}

export default function StudentDetailPage({ params }: StudentDetailPageProps) {
  const { id } = use(params)
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <StudentDetail studentId={id} />
    </div>
  )
}
