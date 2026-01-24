

# Sistem Iuran Madrasah — ASY SYARIF

Sistem Iuran Madrasah adalah aplikasi web modern untuk manajemen data santri dan pencatatan pembayaran iuran bulanan di lingkungan madrasah. Proyek ini dirancang untuk memudahkan pengelolaan data siswa, status pembayaran, serta pelaporan analitik secara real-time dengan antarmuka yang intuitif dan responsif.

## Fitur Utama

- **Manajemen Data Santri**: Tambah, edit, hapus, dan filter data santri (aktif/nonaktif, kelas, tahun masuk).
- **Pencatatan Pembayaran**: Tracking pembayaran bulanan tiap santri, status lunas/belum, dan riwayat transaksi.
- **Dashboard Analitik**: Visualisasi statistik jumlah santri, status pembayaran, dan rekap per kelas.
- **Export Data**: Ekspor data pembayaran dan daftar santri ke format Excel.
- **Log Aktivitas**: Setiap perubahan data penting (tambah, edit, hapus, pembayaran) tercatat di backend untuk audit.
- **Pengaturan Dinamis**: Konfigurasi nominal iuran, tahun ajaran, dan nama madrasah langsung dari dashboard admin.

## Cara Install & Jalankan

1. **Clone repository**
   ```sh
   git clone https://github.com/username/iuran-asysyarif.git
   cd iuran-asysyarif
   ```

2. **Install dependencies**
   ```sh
   pnpm install
   # atau
   npm install
   ```

3. **Setup environment**
   - Salin file `.env.example` menjadi `.env` dan sesuaikan konfigurasi database (PostgreSQL).
   - Jalankan migrasi database:
     ```sh
     pnpm prisma migrate dev
     # atau
     npx prisma migrate dev
     ```

4. **Jalankan aplikasi**
   ```sh
   pnpm dev
   # atau
   npm run dev
   ```

5. **Akses aplikasi**
   - Buka browser di `http://localhost:3000`

## Struktur Folder

- `app/` — Routing dan halaman utama Next.js
- `components/` — Komponen UI dan dashboard
- `hooks/` — Custom hooks untuk state dan data fetching
- `lib/` — Store, logger, dan utilitas backend
- `prisma/` — Skema database dan migrasi
- `public/` — Asset statis
- `styles/` — Global CSS dan konfigurasi Tailwind

---
