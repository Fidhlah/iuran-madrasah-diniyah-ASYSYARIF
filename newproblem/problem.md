# Laporan Audit & Spesifikasi Rekonstruksi Sistem Keuangan Madrasah

## 1. Identifikasi Masalah (The 50k Discrepancy)

Terdapat ketidakcocokan data sebesar **Rp50.000** antara Laporan Kas Bulanan (Cash Flow) dan Rekap Status Pembayaran (Accrual) untuk periode Februari 2026.

### Temuan Audit:

* **Saldo Kas Februari:** Tercatat lebih tinggi Rp50.000 dibanding total lunas di rekap.
* **Penyebab A (Over-reporting):** Dua santri (**Nimisha Dwi Septiani** & **Mikaila Rizkya Nafeeza**) membayar iuran Maret pada 27 Februari. Uang masuk ke saldo kas Februari (+Rp100.000), tapi tidak terhitung sebagai pendapatan Februari di rekap iuran.
* **Penyebab B (Under-reporting):** Satu santri (**Mikha Syardana**) melunasi iuran Februari namun uang baru masuk pada 3 Maret. Status di rekap sudah "Lunas" Februari, namun uangnya tidak ada di laporan kas Februari (-Rp50.000).

**Net Error:** $+100.000 - 50.000 = \mathbf{+50.000}$.

---

## 2. Analisis Akar Masalah (Systematic Failure)

Sistem saat ini gagal karena menggunakan arsitektur data yang statis dan terfragmentasi:

1. **Pemisahan File Fisik:** Penggunaan file `.xlsx` yang terpisah per bulan menghalangi pelacakan transaksi lintas bulan (*cross-month tracking*).
2. **Dualisme Logika:** Mencampuradukkan metode *Cash Basis* (kapan uang masuk) dengan *Accrual* (status iuran per bulan) tanpa adanya jembatan data (*foreign key*).
3. **Human Error Risk:** Verifikasi status lunas dilakukan secara manual tanpa validasi otomatis dari log transaksi.

---

## 3. Solusi Rekonstruksi (Master Ledger Architecture)

Dibutuhkan transformasi dari sistem "Buku Catatan" ke sistem "Database Terpusat".

### A. Skema Tabel Master (Saran Struktur Data)

Hapus file bulanan. Gunakan satu tabel Master Transaction dengan kolom:

| Kolom                 | Deskripsi                                         |
| :-------------------- | :------------------------------------------------ |
| `tanggal_transaksi` | Tanggal uang fisik diterima.                      |
| `nama_santri`       | Identifier santri.                                |
| `kategori`          | Jenis pemasukan (SPP, Infaq, Sodaqoh).            |
| `periode_target`    | Bulan iuran yang dimaksud (contoh: "Maret 2026"). |
| `nominal`           | Jumlah uang.                                      |

### B. Logika Automasi (Requirements for AI/Developer)

Sistem harus mampu melakukan agregasi otomatis:

1. **Kas Bulanan:** `SUM(nominal)` berdasarkan `tanggal_transaksi`.
2. **Status Lunas:** `SUM(nominal)` berdasarkan `nama_santri` dan `periode_target`.

---

## 4. Instruksi Implementasi

1. Lakukan migrasi data dari file `keuangan_Februari` dan `keuangan_Maret` ke dalam satu Master Ledger.
2. Terapkan fungsi `SUMIFS` atau Pivot Table untuk memisahkan pelaporan berdasarkan "Waktu Masuk Uang" vs "Target Bulan Iuran".
3. Pastikan tidak ada input manual pada lembar Rekap Pembayaran; data harus ditarik otomatis dari Master Ledger.

---

**Status Audit:** Rekonsiliasi Selesai.
**Rekomendasi:** Hentikan sistem manual untuk menghindari *opportunity cost* pada pengelolaan data berskala besar.
