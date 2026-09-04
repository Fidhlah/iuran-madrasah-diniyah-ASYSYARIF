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
        parents: true,
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

    // Update student (termasuk data pribadi opsional)
    const student = await prisma.students.update({
      where: { id },
      data: {
        name: body.name,
        class: body.class,
        year_enrolled: body.yearEnrolled,
        status: body.status,
        inactive_reason: body.status === "active" ? null : (body.inactiveReason || null),
        has_tabungan: body.has_tabungan,
        nik: body.nik ?? null,
        gender: body.gender ?? null,
        birth_place: body.birthPlace ?? null,
        birth_date: body.birthDate ? new Date(body.birthDate) : null,
        address: body.address ?? null,
        phone: body.phone ?? null,
      },
    })

    // Upsert / hapus orang tua (untuk tiap relation: ayah & ibu)
    const relations: ("ayah" | "ibu")[] = ["ayah", "ibu"]
    for (const rel of relations) {
      const payload = body.parents?.[rel]
      const hasValue = payload && Object.values(payload).some(v => v !== undefined && v !== null && v !== "")
      const where = { student_id_relation: { student_id: id, relation: rel } }
      const data = payload
        ? {
            nik: payload.nik ?? null,
            name: payload.name ?? null,
            phone: payload.phone ?? null,
            occupation: payload.occupation ?? null,
            email: payload.email ?? null,
            address: payload.address ?? null,
          }
        : null

      if (hasValue && data) {
        await prisma.student_parents.upsert({
          where: where,
          update: data,
          create: { student_id: id, relation: rel, ...data },
        })
      } else {
        // kosong → hapus baris parent kalau ada
        const existing = await prisma.student_parents.findUnique({ where: where })
        if (existing) {
          await prisma.student_parents.delete({ where: where })
        }
      }
    }

    // re-fetch dgn parents utk response
    const studentWithParents = await prisma.students.findUnique({
      where: { id },
      include: { parents: true },
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

    return NextResponse.json(studentWithParents)
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