# Profil MDTA Asy Syarif

> Dokumen ini berisi konteks bisnis untuk AI agent. Tujuannya agar agent paham latar belakang, sistem, dan entitas yang terlibat tanpa perlu baca ulang percakapan panjang.
> Sumber: folder `D:\fidh\Asysyarif\Dokumen`, database `iuran-asysyarif`, percakapan chat.

---

## 1. Identitas

| Atribut | Nilai |
|---------|-------|
| Nama resmi | **Madrasah Diniyah Takmiliyah Awwaliyah (MDTA) Asy Syarif** |
| Nama alternatif | MDTA Asy Syarif, Madrasah Diniyah Asy Syarif |
| Jenis | Pendidikan Diniyah Non-Formal (MDTA Ula) — setara SD |
| Status | Swasta, di bawah Yayasan/DKM |
| Pembina | Kemenag RI — Direktorat Pendidikan Diniyah dan Pondok Pesantren |
| Sistem Pendataan | EMIS PD Pontren (bukan EMIS Madrasah formal) |

### 1.1. Nama & Ejaan

| Konteks | Ejaan |
|---------|-------|
| Dokumen resmi Kemenag | ASY SYARIF |
| Kop DKM | ASY-SYARIF |
| Variasi | Asysyarif, Asy Syarif |
| Folder proyek | `asysyarif` (iuran-asysyarif) |

Semua merujuk ke entitas yang sama. Gunakan **Asy Syarif** untuk teks normal.

### 1.2. Penanggung Jawab (DKM)

| Atribut | Nilai |
|---------|-------|
| Badan Penyelenggara | **Dewan Kemakmuran Masjid (DKM) Masjid Jami Asy-Syarif** |
| Alamat | Jl Dewi Sri No. 25, Kelurahan Ancol, Kecamatan Regol, Kota Bandung, Provinsi Jawa Barat |
| Email | masjidasysyarif_dkm@gmail.com |
| Telepon | 0815 6086 410 |
| Ketua DKM | Muhamad Syukron (*merangkap Kepala MDTA*) |

---

## 2. Struktur Organisasi

| Jabatan | Nama | SK |
|---------|------|----|
| Kepala MDTA | **Muhamad Syukron** (S2) | 005/SK/MDTA/V/2026 — SK Pengangkatan dari DKM |
| Sekretaris / Guru | **Heni Nuryati** | 001/SK/MDTA/V/2026 |
| Guru | **Ai Hanisyah** | 002/SK/MDTA/V/2026 |
| Guru | **Sriyanti** | 003/SK/MDTA/V/2026 |
| Guru | **Neni Kusmiyati** | 004/SK/MDTA/V/2026 |

- Semua SK Tugas Mengajar ditandatangani oleh **Kepala MDTA (Muhamad Syukron)**
- SK Pengangkatan Kepala Madrasah diterbitkan oleh **Pengurus DKM Masjid Asy Syarif**
- Masa jabatan Kepala MDTA: **4 tahun** (PMA No. 58/2017 jo. PMA 24/2018)

---

## 3. Kelas & Santri

### 3.1. Kelas

| Kelas | Jenjang |
|-------|---------|
| PAUD | Pra-SD |
| TK | Taman Kanak-Kanak |
| 1 | Kelas 1 |
| 2 | Kelas 2 |

Jumlah santri total sekitar 60–70an, kelas PAUD dan TK lebih sedikit dari kelas 1 dan 2.

### 3.2. Status Santri

Santri memiliki dua status: **Aktif** (mayoritas) dan **Non-aktif** (minoritas). Santri non-aktif tetap muncul di tabel pembayaran tetapi digreyed-out dan ditaruh di bagian bawah.

---

## 4. Sistem Keuangan

### 4.1. Sumber Pemasukan

| Jenis | Keterangan | Nominal |
|-------|------------|---------|
| Iuran Bulanan (SPP) | Per santri per bulan | **Rp 50.000** |
| Infaq & Shadaqah | Sumbangan tidak tetap | Variatif |
| Lain-lain | Uang sukarela, potongan tabungan | Variatif |

### 4.2. Jenis Pengeluaran Rutin (3 Kewajiban Kas per Bulan)

| No | Item | Penerima | Keterangan |
|----|------|----------|------------|
| 1 | **Gaji Guru** | Guru MDTA | Honor mengajar, beban terbesar (50-70% total expense) |
| 2 | **Kas Mesjid** | DKM/Masjid | Sumbangan rutin ke masjid |
| 3 | **Kas MDTA** | Operasional MDTA | Keperluan belajar-mengajar |
| 4 | **Operasional** | MDTA | Beli alat tulis, fotokopi, dll |

**Pola pembayaran 3 kewajiban (Gaji, Kas Mesjid, Kas MDTA)** dilakukan setiap bulan di awal bulan (sekitar tanggal 5). Pola ini sudah berjalan konsisten.

### 4.3. Metode Pencatatan

- **Cash Flow (Laporan Keuangan)**: mencatat berdasarkan tanggal uang diterima/dikeluarkan
- **Accrual (Rekap Pembayaran)**: mencatat berdasarkan bulan iuran (siapa yang sudah bayar untuk bulan tertentu)
- Konsekuensi: terjadi *deferred revenue* (bayar lebih awal) dan *accounts receivable* (bayar telat)
- Uang fisik disimpan dalam **sistem amplop**: dipilah berdasarkan bulan iuran, bukan tanggal terima

---

## 5. Sistem Informasi (Aplikasi)

| Atribut | Nilai |
|---------|-------|
| Nama proyek | **iuran-asysyarif** |
| Path | `D:\fidh\Coding\Madrasah\iuran-asysyarif\` |
| Tech Stack | Next.js 14 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui |
| Database | Supabase PostgreSQL + Prisma ORM |
| Data Fetching | SWR + Realtime subscriptions |
| Auth | **Tidak ada** — akses terbuka (internal) |
| Fitur utama | Manajemen santri, pembayaran iuran, tabungan, laporan keuangan, export Excel |

### 5.1. Database Schema (Prisma)

| Tabel | Fungsi |
|-------|--------|
| `students` | Data santri (nama, kelas, status aktif/non-aktif, tahun masuk) |
| `payments` | Pembayaran iuran per (student_id, month, year) — amount, is_paid, paid_at |
| `finances` | Transaksi kas — type (income/expense), date, amount, description, category |
| `tabungan` | Saldo tabungan santri (belum terpakai) |
| `tabungan_transaksi` | Riwayat debit/kredit tabungan (belum terpakai) |
| `activity_logs` | Riwayat aksi (PAYMENT_MARK_PAID, CREATE, DELETE, UPDATE) |
| `settings` | Konfigurasi (monthly_fee) |
| `profiles` | User role |

### 5.2. Catatan Penting dari Aplikasi

- **Tipe data `amount`** di export JSON Supabase adalah **string**, bukan integer. Kode harus konversi paksa dengan `int()`.
- Tidak ada duplikasi pembayaran per (student_id, month, year)
- Tidak ada orphan payment (semua payment punya student_id valid)
- Tidak ada transaksi dengan amount negatif atau nol

### 5.3. Fitur Export & Laporan

- Aplikasi bisa **export Excel** laporan keuangan dan rekap pembayaran
- Laporan keuangan (cash flow) menampilkan pemasukan dan pengeluaran per bulan
- Rekap pembayaran menampilkan status santri per bulan (lunas/belum)

---

## 6. Dokumen & Surat

### 6.1. Format Kop Surat

**Kop DKM (DEWAN KEMAKMURAN MASJID):**
```
DEWAN KEMAKMURAN MASJID
MASJID JAMI ASY-SYARIF
Jl Dewi Sri No. 25 Kelurahan Ancol Kecamatan Regol Kota Bandung Prov. Jawa Barat
Telp. 0815 6086 410. Email masjidasysyarif_dkm@gmail.com
```

**Kop MDTA (pengumuman):**
```
PEMERINTAH KABUPATEN BANDUNG
MADRASAH DINIYAH TAKMILIYAH ASY SYARIF
[alamat]
```

### 6.2. Format Surat yang Biasa Digunakan

| Jenis | Kode | Contoh Nomor |
|-------|------|-------------|
| SK Kepala MDTA | SK/MDTA | 001/SK/MDTA/V/2026 |
| Surat Undangan | SU | — |
| Surat Tugas | ST | — |

### 6.3. Template Pengumuman

1. Header: **PEMERINTAH KABUPATEN BANDUNG** (10pt, bold, center)
2. **MADRASAH DINIYAH TAKMILIYAH ASY SYARIF** (12pt, bold, center)
3. Alamat (8pt, center)
4. Separator: `=` repeated
5. Title: **SURAT PEMBERITAHUAN** (14pt, bold, center)
6. Perihal + Nomor
7. Yth + Assalamu'alaikum
8. Body content (12pt, justify)
9. Wassalamu'alaikum
10. Signature: Sekretaris, nama

### 6.4. Daftar SK yang Terbit

| No. SK | Nama | Perihal |
|--------|------|---------|
| 001/SK/MDTA/V/2026 | Heni Nuryati | Tugas Mengajar |
| 002/SK/MDTA/V/2026 | Ai Hanisyah | Tugas Mengajar |
| 003/SK/MDTA/V/2026 | Sriyanti | Tugas Mengajar |
| 004/SK/MDTA/V/2026 | Neni Kusmiyati | Tugas Mengajar |
| 005/SK/MDTA/V/2026 | Muhamad Syukron | Pengangkatan Kepala MDTA |

### 6.5. Penomoran Surat

Format nomor surat: `NoUrut/KodeJenis/KodeUnit/BulanRomawi/Tahun`
- Nomor urut reset setiap tahun (mulai 001)
- Bulan pakai angka Romawi (I–XII)
- Tahun 4 digit

---

## 7. Kebijakan Pencatatan & Analisis

1. **Semua analisis keuangan harus menyertakan kode Python** yang tersimpan di notebook `rework/analisis-data.ipynb` sebagai bukti — tidak boleh hanya teks hasil di chat.
2. Format label output wajib: `🟢 PEMASUKAN` / `🔴 PENGELUARAN` + emoji kategori.
3. Data `amount` dari export Supabase JSON adalah string — wajib konversi `int()`.
4. Bahasa: _Indonesia_ untuk konten lokal, _Inggris_ untuk teknis/dokumentasi.
5. Uang fisik disimpan per bulan iuran (sistem amplop), sistem mencatat per tanggal transaksi (cash flow) — dua pendekatan ini bisa berbeda angkanya untuk bulan yang sama.

---

## 8. Arus Kas Operasional (Gambaran Umum)

- **Pemasukan rutin**: dari iuran santri (Rp 50.000/santri/bulan) — jumlah bervariasi tergantung jumlah santri aktif per bulan
- **Pengeluaran rutin**: 3 kewajiban kas per bulan (Gaji Guru + Kas Mesjid + Kas MDTA) + Operasional
- **Beban terbesar**: Gaji Guru
- **Margin**: tipis — beberapa bulan bisa defisit

> ⚠️ Angka spesifik (total pemasukan, pengeluaran, saldo per bulan) ada di notebook `rework/analisis-data.ipynb`. Dokumen ini hanya untuk gambaran umum bisnis.
