# Rework Plan: Fund Accounting untuk Kas MDTA

> **Masalah:** Sistem saat ini mencatat alokasi Kas MDTA sebagai pengeluaran (expense), padahal itu adalah transfer dana antar fund. Akibatnya terjadi double-counting karena biaya operasional (beli spidol, pulpen, fotokopi, dll) **juga** dicatat sebagai expense — padahal itu spending dari Kas MDTA.

---

## 1. Akar Masalah

Tabel `finances` sekarang cuma punya:

```
type:     "income" | "expense"
amount:   Decimal
description: String
```

- **Tidak ada kolom `category`** — kategorisasi selama ini ditebak dari `description` (pattern matching)
- **Tidak ada cara membedakan** transaksi expense riil vs alokasi dana antar fund
- Akibat: `Kas MDTA Rp 500.000` dan `Beli spidol Rp 73.800` **sama-sama** kehitung sebagai expense → laporan P&L overstatement

---

## 2. Solusi: 2 Kolom Baru di `finances`

### 2.1. Perubahan Database (Prisma)

```prisma
model finances {
  id              String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  date            DateTime  @db.Timestamptz(6)
  type            String    @db.VarChar(20)   // 'income' | 'expense'
  category        String?   @db.VarChar(50)   // BARU: untuk filter & grup
  is_fund_transfer Boolean  @default(false)   // BARU: true = alokasi dana, skip P&L
  amount          Decimal   @db.Decimal(12, 2)
  description     String?
  payment_id      String?   @db.Uuid
  payments        payments? @relation(fields: [payment_id], references: [id], onDelete: Cascade)
  created_at      DateTime? @default(now()) @db.Timestamptz(6)
  updated_at      DateTime? @default(now()) @db.Timestamptz(6)
}
```

### 2.2. Nilai `category`

```
income:  "iuran" | "infaq" | "lainnya"
expense: "gaji_guru" | "kas_mesjid" | "kas_mdta" | "operasional" | "lainnya"
```

### 2.3. Cara Kerja

| Transaksi | type | category | is_fund_transfer | Dampak P&L | Dampak Fund MDTA |
|---|---|---|---|---|---|
| Iuran santri | income | iuran | false | ✅ +Rp 50.000 | — |
| Infaq & Shadaqah | income | infaq | false | ✅ +Rp 150.000 | — |
| Gaji Guru | expense | gaji_guru | false | ✅ -Rp 2.000.000 | — |
| Kas Mesjid | expense | kas_mesjid | false | ✅ -Rp 300.000 | — |
| **Alokasi Kas MDTA** | **expense** | **kas_mdta** | **true** | **❌ di-skip** | **+ Rp 500.000** |
| Beli spidol (dari MDTA) | expense | operasional | false | ✅ -Rp 73.800 | - Rp 73.800 |
| Print & fotokopi soal | expense | operasional | false | ✅ -Rp 50.000 | - Rp 50.000 |

### 2.4. Rumus Perhitungan

```
Saldo Kas Utama    = SUM(income WHERE is_fund_transfer=false) - SUM(expense WHERE is_fund_transfer=false)
Saldo Kas MDTA     = SUM(expense WHERE category='kas_mdta' AND is_fund_transfer=true) 
                     - SUM(expense WHERE category='operasional')
```

---

## 3. Perubahan yang Diperlukan

### 3.1. Backend (Prisma + API)

| File | Perubahan |
|------|-----------|
| `prisma/schema.prisma` | Tambah `category String?` + `is_fund_transfer Boolean @default(false)` |
| `app/api/finances/route.ts` | Validasi input: `category` wajib, `is_fund_transfer` sesuai logika |
| Buat migration | `npx prisma migrate dev --name add_fund_accounting` |

### 3.2. Frontend — Form Tambah

| File | Perubahan |
|------|-----------|
| `components/finances/finances-form-modal.tsx` | Tambah dropdown `category` + toggle "Alokasi dana?" |
| Tambah `FinancesCategorySelect` | Dropdown kategori dependen `type` (income→iuran/infaq, expense→gaji/kas_mesjid/kas_mdta/operasional) |

**UX Flow di Form:**
1. Pilih `Jenis`: Pemasukan / Pengeluaran / Alokasi Dana
2. Pilih `Kategori`: muncul sesuai jenis
3. Kalau jenis "Alokasi Dana" → `is_fund_transfer=true`, category otomatis sesuai fund
4. Input nominal + deskripsi + tanggal → simpan

### 3.3. Frontend — Tabel & Filter

| File | Perubahan |
|------|-----------|
| `components/finances/finances-table.tsx` | Kolom kategori, bedain warna/icon antara transfer vs expense riil |
| `components/finances/finances-page.tsx` | Filter by category, filter show/hide fund transfers |
| `components/finances/finances-analytic-cards.tsx` | **Pisah P&L vs Fund Balance** — card baru "Saldo Kas MDTA" |

### 3.4. Frontend — Laporan & Export

| File | Perubahan |
|------|-----------|
| `components/finances/finances-page.tsx` (export) | Export Excel: filter `is_fund_transfer=false` untuk P&L, tambah sheet terpisah untuk fund balance |
| Halaman/fitur baru? | Bisa nanti — minimal liat di card analytic & filter dulu |

---

## 4. Prioritas Implementasi

### Phase 1: Database & API (Foundation)
- [ ] Tambah kolom `category` dan `is_fund_transfer` di Prisma
- [ ] Buat migration
- [ ] Update API route: validasi + simpan category + is_fund_transfer
- [ ] **Backfill data lama** — kategorikan dari `description` (lihat Lampiran)

### Phase 2: Form Input
- [ ] Redesign form: tambah dropdown category + toggle alokasi
- [ ] Simpan category + is_fund_transfer pas submit

### Phase 3: Tampilan & Filter
- [ ] Tabel: kolom kategori, icon fund transfer
- [ ] Filter: show/hide fund transfers, filter by category
- [ ] Analytic cards: P&L bersih (skip fund transfers), tambah card "Saldo Kas MDTA"

### Phase 4: Fix Notebook
- [ ] Update `rework/analisis-data.ipynb` — baca `category` dari DB, bukan tebak dari description
- [ ] P&L report: filter `is_fund_transfer=false`

---

## 5. Lampiran: Backfill Data Lama

Data lama 342 transaksi perlu dikategorikan otomatis berdasarkan `description`:

| Pattern di description | category | is_fund_transfer |
|---|---|---|
| "membayar iuran bulan ..." | iuran | false |
| "Infaq & Shadaqah" | infaq | false |
| "Guru", "Honor", "Pembayaran guru" (case-insensitive) | gaji_guru | false |
| "Kas Masjid", "Kas Mesjid" (case-insensitive) | kas_mesjid | false |
| "Kas MDTA" (case-insensitive) | kas_mdta | **true** |
| "uang suka rela potongan tabungan masuk ke kas MDTA" | kas_mdta | **true** |
| "Beli ...", "Membeli ...", "Foto copy ...", "Print ...", "Bayar ..." (operasional) | operasional | false |
| "seragam", "buku mewarnai", "spidol", "pulpen", "fotocopy", "print" (operasional keywords) | operasional | false |
| "Bap Aceng & Ibu Ai print dan fotocopy soal UAS" | operasional | false |
| "Enceng moto copy" | operasional | false |
| Sisanya (tidak terdeteksi) | lainnya | false |

> **Catatan:** Beberapa transaksi "Kas MDTA (dipakai buat nyicil bayar seragam murid ke Ibu Sri)" — ini deskripsinya dobel (alokasi + pemakaian). Untuk backfill, ikutin keyword "Kas MDTA" → `kas_mdta, is_fund_transfer=true`. Nanti pas user lihat, bisa diedit manual.
