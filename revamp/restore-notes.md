# Restore Notes — Migrasi ke Project Supabase Baru (PROD)

> Tujuan: pindahin project `agslfqsiswrzqqzveifr` → project Supabase baru di akun lain.
> Backup sumber: `revamp/data/backup-full-asysyarif.sql` (sudah diverifikasi).

---

## A. Yang LO lakukan (dashboard akun baru)

1. **Buka** https://supabase.com → login ke akun Supabase lo yang lain
2. **New Project**
   - Name: `asysyarif-prod`
   - Database Password: isi & **SIMPEN** (dipakai DATABASE_URL)
   - Region: pilih Singapore (Southeast Asia) atau sesuaikan asli
   - Plan: Free
3. Tunggu selesai (~1-2 menit)

## B. Nilai yang LO copy dari dashboard project baru

> Sahkan: Dashboard → Project → ⚙️ **Settings**

| Nilai | Lokasi di dashboard | Disuruh |
|---|---|---|
| **URL** | Settings → API → Project URL | `https://xxxx.supabase.co` |
| **Anon key** | Settings → API → anon `public` | `sb_publishable_...` |
| **service_role key** | Settings → API → service_role | `sb_secret_...` |
| **Database password** | yang lo isi waktu bikin | `****` |

Kasih 4 nilai ini ke gue (rekam di chat).

## C. Yang GUE lakukan setelah terima kredensial

1. Isi `revamp/.env-new` dengan:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
   DATABASE_URL=postgres://postgres.xxxx:...[&password]
   ```
2. Jalanin `python revamp/restore-apply.py`
   → inject `backup-full-asysyarif.sql` ke project baru
3. Verifikasi count (8 tabel, 1.625 data, dst.)

---

## D. Checklist YANG TIDAK ikut backup (harus set manual)

Perlu lo lakukan di project baru (dashboard) karena tidak ada di SQL backup:

- [ ] **Realtime**: aktifkan Postgres Changes utk 6 tabel (students, payments, settings, tabungan, tabungan_transaksi, finances) — kalau belum otomatis
- [ ] **anon key / service_role**: sudah ikut project baru otomatis (beda dari lama)
- [ ] **Auth config**: app nggak pakai login → biasanya gak perlu; cek kalau ada pendaftaran validator
- [ ] **Vault/secrets**: extension `supabase_vault` ke-restore tapi isi secret terenkripsi — cek kalau dipakai (app nggak pakai)
- [ ] **Site URL / redirect**: di Authentication → URL Configuration (kalau diubah)

> Note: web app Asysyarif **tidak punya login**, tidak pakai storage, tidak pakai provider/SMTP custom → checklist di atas mayoritas N/A.

---

## E. Cutover (Fase 3) — SETELAH restore terverifikasi

1. Update **env di dashboard Vercel** (project `iuran-madrasah-diniyah-ASYSYARIF`):
   - `DATABASE_URL` + `DIRECT_URL` → project baru
   - `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` → project baru
2. Update `.env` lokal → nilai project baru
3. `git push` → Vercel redeploy → web pindah ke data baru
4. **JANGAN delete project Supabase lama** — biarkan (bahan rollback)

## F. Rollback (kalau cutover gagal)

- Web error? → **Kembalikan env Vercel ke nilai lama** (ada di `tmp/asysyarif/env-produksi-vercel-LAMA.md`) → redeploy
- URL project lama masih nyala → data lama aman
- backup `.sql` di `revamp/data/` = cadangan final