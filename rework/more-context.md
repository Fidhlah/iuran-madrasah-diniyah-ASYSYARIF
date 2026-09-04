# Konteks Tambahan: Kas MDTA vs Biaya Operasional

## Masalah

Sistem pencatatan keuangan saat ini mencatat **Kas MDTA** sebagai pengeluaran (expense). Padahal semestinya Kas MDTA itu **alokasi dana** — uang yang disisihkan untuk kebutuhan MDTA, bukan pengeluaran riil.

## Cara Kerja yang Benar (Seharusnya)

```
Kas MDTA (alokasi)
  ↓
Biaya Operasional (pengeluaran riil)
    ├── Beli spidol
    ├── Beli pulpen
    ├── Fotokopi
    ├── Print
    └── dll.
```

- **Kas MDTA** = dana yang dialokasikan/disisihkan untuk keperluan madrasah (fund pool)
- **Biaya Operasional** = pengeluaran riil yang menggunakan dana dari Kas MDTA tersebut

Kas MDTA itu kayak "amplop" — uangnya disisihkan ke amplop itu, dan setiap kali beli spidol/fotokopi baru itu pengeluaran dari amplop.

## Kondisi Saat Ini (Di Sistem Sekarang)

Sistem mencatat **keduanya** sebagai pengeluaran:
1. ✅ `🔴 PENGELUARAN | 🕌 Kas Mesjid` — Rp xxx (kewajiban, benar sebagai expense)
2. ✅ `🔴 PENGELUARAN | 💼 Gaji Guru` — Rp xxx (kewajiban, benar sebagai expense)
3. ❌ `🔴 PENGELUARAN | 📚 Kas MDTA` — Rp xxx (seharusnya alokasi, bukan expense)
4. ❌ `🔴 PENGELUARAN | ✏️ Operasional` — Rp xxx (ini expense riil, tapi dobel karena Kas MDTA juga sudah dihitung)

**Akibat:** Pengeluaran bulanan terlihat lebih besar dari yang seharusnya.

## Ke Depan

- Perlu dipisahkan mana yang **alokasi** (transfer ke sub-fund) dan mana yang **pengeluaran riil** (pembelian barang/jasa)
- Kas MDTA perlu dipindah ke kategori yang berbeda atau tidak dihitung sebagai expense
- Biaya Operasional tetap sebagai expense — dan inilah yang seharusnya menjadi "isi" dari Kas MDTA

> **Catatan:** Perbaikan sistem ini belum dilakukan. Dokumen ini hanya mencatat pemahaman masalah untuk konteks AI agent.

---

## Info Mentah (Fakta dari User)

Kumpulan fakta mentah yang disampaikan user langsung — untuk referensi AI agent, bukan analisis.

### Seragam

- Seragam diambil dari **uang Kas MDTA, bukan Kas Besar**
- Ada transaksi Rp 400.000 awalnya dikasih keterangan "dipakai bayar seragam", tapi **tidak jadi** — akhirnya jadi alokasi Kas MDTA biasa

### Transaksi Alokasi Kas MDTA (Lengkap)

| Tanggal | Deskripsi | Jumlah | Catatan |
|---|---|---|---|
| 2026-02-05 | Alokasi Kas MDTA Bulan Februari 2026 (koreksi — lupa dicatat) | Rp 350.000 | Koreksi, seharusnya sudah dicatat dari awal |
| 2026-03-05 | Kas MDTA (dipakai buat nyicil bayar seragam murid ke Ibu Sri) | Rp 400.000 | **Tidak jadi** dipakai seragam — jadinya alokasi aja |
| 2026-04-16 | Kas MDTA Bulan April 2026 | Rp 300.000 | Alokasi rutin |
| 2026-05-05 | Kas MDTA Asysyarif | Rp 700.000 | Alokasi rutin |
| 2026-06-05 | Kas MDTA As Syarif | Rp 600.000 | Alokasi rutin |

**Total alokasi MDTA:** Rp 2.350.000

### Transaksi Operasional MDTA (Belanja Riil)

| Tanggal | Deskripsi | Jumlah |
|---|---|---|
| 2026-02-05 | Membeli spidol white board 1 dus (12 buah) = 73800 + Membeli penghapus white board 1 bungkus (12 buah) = 53000 | Rp 127.000 |
| 2026-02-05 | Foto copy gambar mewarnai 9 x 22 lembar = 33000 | Rp 33.000 |
| 2026-03-05 | Foto copy buku mewarnai 6 gambar x 22 salinan | Rp 20.000 |
| 2026-04-16 | Beli pulpen Standard Gel 4 buah | Rp 12.000 |
| 2026-05-07 | Bp Aceng & Ibu Ai print dan fotocopy soal UAS | Rp 70.000 |
| 2026-05-07 | Bp Jajang & Ibu Sri print dan fotocopy soal UAS | Rp 88.000 |
| 2026-05-07 | Bp Nana & Ibu Rifa print dan fotocopy soal UAS | Rp 71.000 |
| 2026-05-07 | Ibu Heni print & fotocopy soal UAS | Rp 32.000 |
| 2026-05-19 | Enceng moto copy | Rp 9.000 |
| 2026-06-05 | Beli buku mewarnai Binatang Air | Rp 4.000 |
| 2026-06-23 | Bayar seragam ke Ibu Sri | Rp 800.000 |
| 2026-06-23 | Print Warna SK | Rp 11.000 |
| 2026-06-23 | Print Warna BAP Emis | Rp 2.000 |

### Aturan Prioritas (Urutan dari User)

1. **Guru** — gaji + honor, prioritas #1
2. **Kas Mesjid** — prioritas #2
3. **"Diambil dari"** — belanja langsung dari Kas Besar untuk MDTA (kalau alokasi belum cukup)
4. **Alokasi Kas MDTA** — transfer dana ke fund MDTA
5. **Seragam** — prioritas paling akhir, dan ini dari MDTA, bukan KB
6. **Sisanya** — sisa Kas Besar dipakai buat belanja MDTA

### Pemisahan Fund (Dari User)

| Fund | Sumber | Dipakai Untuk |
|---|---|---|
| **Kas Besar (KB)** | Semua pemasukan iuran & infaq | Gaji guru, honor, kas mesjid, alokasi MDTA, seragam (via MDTA) |
| **Kas MDTA** | Transfer/alokasi dari KB | Print, fotokopi, ATK, spidol, buku mewarnai, seragam |

### Data Keuangan

- **Iuran:** Rp 50.000/santri/bulan
- **Infaq/Shadaqah:** income tersendiri (misal Rp 150.000 dari Bp. H.Dedi)
- **Total kas per Juni 2026:** Rp 4.881.000
  - Kas Besar: ±Rp 2.400.000
  - Kas MDTA: ±Rp 2.481.000
- **Transaksi khusus:** "uang suka rela potongan tabungan masuk ke kas MDTA" — Rp 610.000 (26 Juni 2026)

### Dataset

- Supabase project: `agslfqsiswrzqqzveifr`
- Tables (8): `students`, `payments`, `finances`, `activity_logs`, `settings`, `profiles`, `tabungan`, `tabungan_transaksi`
- Pemilik: kemungkinan `dompetguava@gmail.com`

### Concern User

- **"Jangan sampai bocor"** — angka sistem harus cocok sama uang fisik. Kalau ada selisih, berarti ada masalah.
- Data di sistem saat ini **dobel hitung** antara alokasi MDTA (yang seharusnya transfer) vs expense riil (belanja dari MDTA)
- Transaksi "Kas MDTA (dipakai buat nyicil bayar seragam ke Ibu Sri)" — deskripsi dobel artinya (alokasi + pemakaian)

### Ekspektasi Laporan

- Saldo awal + breakdown SPP per santri + breakdown expense per fund (KB vs MDTA) + breakdown alokasi & transfer
- Output nyata: **HTML atau DOCX** (bisa dibaca orang awam)
- Bahasa Indonesia
- **"Bahasa bayi"** untuk angka-angka penting — di-highlight, dengan penjelasan sederhana
