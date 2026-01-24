# Tabungan Feature

## 1. Judul & Deskripsi
- **Judul halaman:** Tabungan Santri
- **Deskripsi singkat (opsional):** “Rekap saldo dan transaksi tabungan santri.”

## 2. Analytic Cards (Ringkasan)
- Total saldo tabungan semua santri
- Jumlah santri yang punya tabungan
- Total transaksi bulan ini (opsional)
- Saldo rata-rata per santri (opsional)

## 3. Navigasi & Penyajian Tabel
- **Nama tab di navbar:** Tabungan
- **Di halaman Tabungan:**  
  - Gunakan tab (tabs/segmented control) untuk berpindah antar tabel, baik di laptop maupun mobile.
    - **Tab 1:** Rekap Tabungan (per santri)
    - **Tab 2:** Riwayat Transaksi (per transaksi)
  - Tab tetap responsif dan mudah digunakan di semua perangkat.

## 4. Tabel Data Tabungan (Rekap per Santri)
- **Kolom:** 
  - Nama santri
  - Kelas
  - Saldo
  - Jumlah transaksi
  - Aksi (detail, tambah, tarik)
- Bisa pakai komponen tabel yang sudah ada

## 5. Tabel Riwayat Transaksi Tabungan (Per Transaksi)
- **Kolom:** 
  - Tanggal
  - Nama santri
  - Kelas
  - Transaksi (setor/tarik, nominal, ikon panah & warna)
  - Keterangan
  - Saldo Setelah
  - Aksi (edit/hapus, opsional)

## 6. Filter & Search
- Filter berdasarkan kelas, nama santri, atau saldo minimum
- Search box untuk cari santri

## 7. Aksi/Action
- Tombol tambah transaksi (setor/tarik)
- Tombol export data
- Tombol lihat detail tabungan santri

## 8. Modal/Form Transaksi
- Form untuk setor/tarik tabungan
- Validasi input (nominal, keterangan, dsb)

## 9. Responsive Design
- Tab dan tabel tetap responsif, mudah digunakan di laptop maupun mobile.
- Modal/drawer tetap nyaman digunakan di layar kecil.
- Pastikan tombol aksi mudah diakses dan tabel tetap terbaca.

## 10. Teknologi & Prinsip Pengembangan
- **Gunakan SWR** untuk fetching dan caching data tabungan.
- **Implementasikan realtime subscription** (Supabase Realtime) agar data tabungan otomatis update tanpa reload.
- **Setup database**:  
  - Buat tabel `tabungan` (rekap per santri) dan tabel `tabungan_transaksi` (riwayat transaksi).
  - Pastikan relasi dan index sudah optimal.
- **Gunakan prinsip DRY (Don't Repeat Yourself)**:  
  - Hindari duplikasi kode, gunakan helper dan utility function.
- **Modularisasi kode**:  
  - Pisahkan komponen, hooks, dan utilitas agar mudah di-maintain dan dikembangkan.

---

### Catatan:
- Tabel transaksi per santri: Tanggal, Jenis (setor/tarik), Nominal, Keterangan, Saldo Setelah, dsb.
- Kolom transaksi bisa digabung (nominal + jenis + ikon panah warna) agar lebih ringkas.