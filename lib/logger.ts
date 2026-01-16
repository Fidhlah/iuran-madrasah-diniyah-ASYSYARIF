import { prisma } from "./prisma"
import { Prisma } from "@prisma/client"

type ActionType = 
  | "CREATE" 
  | "UPDATE" 
  | "DELETE" 
  | "PAYMENT_MARK_PAID" 
  | "PAYMENT_MARK_UNPAID"
  | "SETTING_UPDATE"
  | "EXPORT_DATA"

type EntityType = "STUDENT" | "PAYMENT" | "SETTING"

interface LogParams {
  action: ActionType
  entityType: EntityType
  entityId?: string
  description: string
  oldData?: Record<string, unknown> | null
  newData?: Record<string, unknown> | null
}

export async function createLog(params: LogParams) {
  try {
    await prisma.activity_logs.create({
      data: {
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId,
        description: params.description,
        old_data: params.oldData as Prisma.InputJsonValue ?? undefined,
        new_data: params.newData as Prisma.InputJsonValue ?? undefined,
        user_name: "System",
      },
    })
  } catch (error) {
    console.error("Failed to create log:", error)
  }
}

export const logger = {
  studentCreated: (student: { id: string; name: string }, data: Record<string, unknown>) =>
    createLog({
      action: "CREATE",
      entityType: "STUDENT",
      entityId: student.id,
      description: `Menambahkan santri baru: ${student.name}`,
      newData: data,
    }),

  studentUpdated: (
    student: { id: string; name: string },
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>
  ) =>
    createLog({
      action: "UPDATE",
      entityType: "STUDENT",
      entityId: student.id,
      description: `Mengubah data santri: ${student.name}`,
      oldData,
      newData,
    }),

  studentDeleted: (student: { id: string; name: string }, data: Record<string, unknown>) =>
    createLog({
      action: "DELETE",
      entityType: "STUDENT",
      entityId: student.id,
      description: `Menghapus santri: ${student.name}`,
      oldData: data,
    }),

  paymentMarkedPaid: (
    paymentId: string,
    studentName: string,
    month: string,
    year: number,
    paidAt: string
  ) =>
    createLog({
      action: "PAYMENT_MARK_PAID",
      entityType: "PAYMENT",
      entityId: paymentId,
      description: `Pembayaran ${studentName} bulan ${month} ${year} ditandai lunas`,
      oldData: { isPaid: false },
      newData: { isPaid: true, paidAt },
    }),

  paymentMarkedUnpaid: (
    paymentId: string,
    studentName: string,
    month: string,
    year: number
  ) =>
    createLog({
      action: "PAYMENT_MARK_UNPAID",
      entityType: "PAYMENT",
      entityId: paymentId,
      description: `Pembayaran ${studentName} bulan ${month} ${year} dibatalkan`,
      oldData: { isPaid: true },
      newData: { isPaid: false, paidAt: null },
    }),

  settingUpdated: (key: string, oldValue: string, newValue: string) =>
    createLog({
      action: "SETTING_UPDATE",
      entityType: "SETTING",
      description: `Mengubah pengaturan: ${key}`,
      oldData: { key, value: oldValue },
      newData: { key, value: newValue },
    }),

  dataExported: (type: "all" | "filtered", count: number) =>
    createLog({
      action: "EXPORT_DATA",
      entityType: "SETTING",
      description: `Export data ${type === "all" ? "semua" : "yang ditampilkan"} (${count} santri)`,
      newData: { type, count, exportedAt: new Date().toISOString() },
    }),
}