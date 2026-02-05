import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"

// GET - Ambil semua students
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const classFilter = searchParams.get("class") || ""
    const yearFilter = searchParams.get("year") || ""
    const statusFilter = searchParams.get("status") || ""

    const students = await prisma.students.findMany({
      where: {
        AND: [
          search ? { name: { contains: search, mode: "insensitive" } } : {},
          classFilter ? { class: classFilter } : {},
          yearFilter ? { year_enrolled: parseInt(yearFilter) } : {},
          statusFilter ? { status: statusFilter } : {},
        ],
      },
      orderBy: [{ class: "asc" }, { name: "asc" }],
    })

    return NextResponse.json(students)
  } catch (error) {
    console.error("Error fetching students:", error)
    return NextResponse.json(
      { error: "Gagal mengambil data santri" },
      { status: 500 }
    )
  }
}

// POST - Tambah student baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const student = await prisma.students.create({
      data: {
        name: body.name,
        class: body.class,
        year_enrolled: body.yearEnrolled,
        status: body.status || "active",
        inactive_reason: body.status === "active" ? null : (body.inactiveReason || null),
        has_tabungan: body.has_tabungan ?? false, // tambahkan ini
      },
    })

    // Log aktivitas
    await logger.studentCreated(
      { id: student.id, name: student.name },
      {
        name: student.name,
        class: student.class,
        yearEnrolled: student.year_enrolled,
        status: student.status,
      }
    )

    return NextResponse.json(student, { status: 201 })
  } catch (error) {
    console.error("Error creating student:", error)
    return NextResponse.json(
      { error: "Gagal menambah santri" },
      { status: 500 }
    )
  }
}