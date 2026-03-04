# Penjelasan Profesional (Cash vs Accrual) untuk Awam

Masalah yang kamu hadapi ini sangat umum di dunia IT dan Akuntansi. Di perusahaan besar, ini disebut tarik-menarik antara **Laporan Arus Kas (Cash Flow)** dan **Laporan Pendapatan (Income Statement / Accrual)**.

Biar mudah dijelaskan ke atasan awam, ibaratkan Madrasah itu jualan **"Kue Bulanan"**.

### 1. Masalah "Uang Muka" (Bayar Lebih Awal)
* **Kasus:** 2 anak bayar SPP Maret di bulan Februari (Total 100k).
* **Di Laci Kasir (Cash Flow / Keuangan Feb):** Ada tambahan uang fisik 100k. Laci kasir nggak peduli uang itu buat kue bulan apa, pokoknya hari ini dapet 100k.
* **Di Daftar Pesanan (Rekap Pembayaran Feb):** Nama 2 anak ini belum dicentang "Terima Kue Februari" dari uang 100k itu, karena uang itu memang buat jatah kue bulan depan.
* **Istilah Profesional:** Ini disebut *Deferred Revenue* (Pendapatan Diterima Dimuka). Uang sudah dipegang, tapi kewajiban (ngajar di bulan Maret) belum dijalankan.

### 2. Masalah "Nunggak" (Bayar Terlambat)
* **Kasus:** 1 anak bayar SPP Februari di bulan Maret (Total 50k).
* **Di Laci Kasir (Cash Flow / Keuangan Feb):** Uangnya nggak ada di laci Februari (-50k).
* **Di Daftar Pesanan (Rekap Pembayaran Feb):** Nama anak ini tetap dicentang "Terima Kue Februari" karena dia memang menuhin kewajiban bayar jatah Februari (meski telat bayar di bulan Maret).
* **Istilah Profesional:** Ini disebut *Accounts Receivable* (Piutang). Kita sudah ngajar di Februari, tapi belum terima uangnya di bulan itu.

---

## Solusi Profesional yang Mudah Dimengerti Awam (Rekomendasi)

Seorang "Professional System Analyst" **TIDAK AKAN** memanipulasi laci kasir (Laporan Keuangan). Laporan Keuangan (uang kas fisik) *harus* sama dengan uang kertas yang dipegang kasir hari itu. Kalau laporan bilang 2,55 juta, isi laci *harus* 2,55 juta.

Yang dilakukan profesional adalah **A. Memberi label yang jelas di Laporan Keuangan**, dan **B. Membuat Tabel Rekonsiliasi**.

Berikut rancangan fitur yang bisa kita buatkan di aplikasi (Export Excel-nya):

### 1. Perbaikan Laporan Keuangan (Cash Flow)
Kita ubah hasil Export Excel `keuangan_` di bagian bawah agar atasan gampang bacanya:

**Total Pemasukan Februari: Rp 2.550.000**
*Berdiri dari:*
- SPP Februari (Tepat Waktu): Rp 2.300.000
- Titipan SPP Maret (Bayar Lebih Awal): Rp 100.000
- Infaq & Shadaqah: Rp 150.000

*Dengan begini, atasan lgsg manggut-manggut: "Oh pantesan 2,55 juta, karena ada 100rb uang SPP bulan depan masuk bulan ini".*

### 2. Perbaikan Rekap Pembayaran (Accrual)
Di dokumen "Rekap Pembayaran", atasan hanya peduli: *"Untuk jatah pendidikan bulan Februari, total uangnya berapa yang udah lunas?"*

Di bagian bawah tabel Rekap Pembayaran Februari, kita tulis:
**Total Nilai SPP Februari yang Lunas: Rp 2.350.000 (47 Anak)**
*Berdiri dari:*
- Dibayar di bulan Februari: Rp 2.300.000
- Dibayar telat (Susulan di bulan Maret): Rp 50.000

### Kesimpulan
Dengan model ini, kamu **nggak perlu bohong** atau muter-muter data.
- Kalau kasir ngitung uang fisik di akhir Februari, total uang *Cash* pasti persis **2.550.000**.
- Kalau atasan tanya "Total duit SPP buat jatah ngajar di bulan Februari ada berapa?", jawabannya pasti persis **2.350.000**.

Bagaimana menurutmu rancangan laporan seperti ini? Ini adalah "Best Practice" software keuangan yang paling jujur dan transparan. Kalau setuju, saya bisa langsung buat Rencana Implementasinya (`implementation_plan.md`) untuk ngubah struktur Export Excel kamu!
