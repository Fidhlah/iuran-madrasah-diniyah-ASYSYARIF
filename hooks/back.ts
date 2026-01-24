// import { useState, useEffect, useCallback } from "react"

// export interface Student {
//   id: string
//   name: string
//   class: string
//   year_enrolled: number
//   status: string
//   created_at: string
//   updated_at: string
// }

// export interface StudentInput {
//   name: string
//   class: string
//   yearEnrolled: number
//   status: string
// }

// import { useStudentsStore } from "./students-store"

// export function useStudents() {
//   const {
//     students,
//     loading,
//     error,
//     fetchStudents,
//     addStudent,
//     updateStudent,
//     deleteStudent,
//   } = useStudentsStore()


//   return {
//     students,
//     loading,
//     error,
//     fetchStudents,
//     addStudent,
//     updateStudent,
//     deleteStudent,
//   }
// }