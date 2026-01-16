import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"

// GET - Ambil student by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const student = await prisma.students.findUnique({
      where: { id },
      include: {
        payments: {
          orderBy: [{ year: "desc" }, { month: "desc" }],
        },
      },
    })

    if (!student) {
      return NextResponse.json(
        { error: "Santri tidak ditemukan" },
        { status: 404 }
      )
    }

    return NextResponse.json(student)
  } catch (error) {
    console.error("Error fetching student:", error)
    return NextResponse.json(
      { error: "Gagal mengambil data santri" },
      { status: 500 }
    )
  }
}

// PUT - Update student
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Ambil data lama untuk log
    const oldStudent = await prisma.students.findUnique({
      where: { id },
    })

    if (!oldStudent) {
      return NextResponse.json(
        { error: "Santri tidak ditemukan" },
        { status: 404 }
      )
    }

    const student = await prisma.students.update({
      where: { id },
      data: {
        name: body.name,
        class: body.class,
        year_enrolled: body.yearEnrolled,
        status: body.status,
      },
    })

    // Log aktivitas
    await logger.studentUpdated(
      { id: student.id, name: student.name },
      {
        name: oldStudent.name,
        class: oldStudent.class,
        yearEnrolled: oldStudent.year_enrolled,
        status: oldStudent.status,
      },
      {
        name: student.name,
        class: student.class,
        yearEnrolled: student.year_enrolled,
        status: student.status,
      }
    )

    return NextResponse.json(student)
  } catch (error) {
    console.error("Error updating student:", error)
    return NextResponse.json(
      { error: "Gagal mengubah data santri" },
      { status: 500 }
    )
  }
}

// DELETE - Hapus student
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Ambil data untuk log
    const student = await prisma.students.findUnique({
      where: { id },
    })

    if (!student) {
      return NextResponse.json(
        { error: "Santri tidak ditemukan" },
        { status: 404 }
      )
    }

    await prisma.students.delete({
      where: { id },
    })

    // Log aktivitas
    await logger.studentDeleted(
      { id: student.id, name: student.name },
      {
        name: student.name,
        class: student.class,
        yearEnrolled: student.year_enrolled,
        status: student.status,
      }
    )

    return NextResponse.json({ message: "Santri berhasil dihapus" })
  } catch (error) {
    console.error("Error deleting student:", error)
    return NextResponse.json(
      { error: "Gagal menghapus santri" },
      { status: 500 }
    )
  }
}