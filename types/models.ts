export interface Student {
  id: string
  name: string
  class: string
  year_enrolled: number
  status: "active" | "nonactive"
  created_at: string
  updated_at: string
  has_tabungan?: boolean
}
export interface StudentInput {
  name: string
  class: string
  yearEnrolled: number
  status: string
}

export interface Payment {
  id: string
  student_id: string
  month: number
  year: number
  amount: number
  is_paid: boolean
  paid_at: string | null
  created_at: string
  updated_at: string
  students?: {
    id: string
    name: string
    class: string
  }
}

export interface Tabungan {
  id: string
  student_id: string
  saldo: number
  jumlah_transaksi: number
  updated_at: string
  students?: {
    id: string
    name: string
    class: string
  }
}

export interface TabunganTransaksi {
  id: string
  student_id: string
  tanggal: string
  jenis: "setor" | "tarik"
  nominal: number
  keterangan?: string | null
  saldo_setelah?: number | null
  created_at: string
  students?: {
    id: string
    name: string
    class: string
  }
}

export interface Setting {
  id: string
  key: string
  value: string
  description?: string | null
  updated_at: string
}

export interface Profile {
  id: string
  role: string
}

export interface ActivityLog {
  id: string
  user_id?: string | null
  user_name?: string | null
  action:
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "PAYMENT_MARK_PAID"
    | "PAYMENT_MARK_UNPAID"
    | "SETTING_UPDATE"
    | "EXPORT_DATA"
    | "LOGIN"
    | "LOGOUT"
  entity_type: "STUDENT" | "PAYMENT" | "SETTING" | "AUTH"
  entity_id?: string | null
  description: string
  old_data?: any
  new_data?: any
  ip_address?: string | null
  user_agent?: string | null
  created_at: string
}