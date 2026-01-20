import { StudentManagement } from "@/components/students"
import StudentsAnalyticCards from "@/components/students/students-analytic-cards"


export default function StudentsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <StudentsAnalyticCards />

      <StudentManagement />
    </div>
  )
}
