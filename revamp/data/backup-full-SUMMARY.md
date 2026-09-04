# Backup Full — Iuran Asysyarif (Fase 1)

> **Project:** Supabase `agslfqsiswrzqqzveifr` | URL: `https://agslfqsiswrzqqzveifr.supabase.co`
> **Dibuat:** 2026-08-04 (via `backup-dump-full.py`, `backup-verify.py`)
> **Status:** ✅ LENGKAP & TERVERIFIKASI

---

## Ringkasan Isi Backup

| Komponen | Jumlah | Status vs DB Live |
|---|---|---|
| Tabel (public) | 8 | ✅ |
| Function | 4 | ✅ |
| Trigger | 4 | ✅ |
| Index (non-PK) | 21 | ✅ |
| FK (ALTER) | 5 | ✅ |
| RLS policies | 12 | ✅ |
| Tabel realtime | 6 | ✅ |
| Extensions | 5 | ✅ |

## Jumlah Data per Tabel (verified = cocok dengan DB live)

| Tabel | Baris |
|---|---:|
| activity_logs | 734 |
| finances | 423 |
| payments | 379 |
| profiles | 2 |
| settings | 3 |
| students | 84 |
| tabungan | 0 |
| tabungan_transaksi | 0 |
| **Total INSERT** | **1,626** |

## Komponen penting yang ikut (jangan sampai hilang saat restore)

**4 Function:**
- `insert_tabungan_on_has_tabungan_true`
- `set_has_tabungan_false`
- `set_has_tabungan_true`
- `sync_payment_to_finances` ← auto-sync pembayaran → keuangan

**4 Trigger:**
- `payment_finance_sync` (on payments)
- `trg_insert_tabungan_on_has_tabungan_true` (on students)
- `trg_set_has_tabungan_false` (on tabungan)
- `trg_set_has_tabungan_true` (on tabungan)

**12 RLS policies** — di 6 tabel (finances, payments, settings, students, tabungan, tabungan_transaksi)

**6 Tabel realtime** — students, payments, settings, tabungan, tabungan_transaksi, finances

---

## File yang dihasilkan

| File | Isi | Peran |
|---|---|---|
| `data/backup-full-asysyarif.sql` | schema+data+FK+index+function+trigger+RLS+realtime | **FILE UTAMA — dibuang ke project baru** |
| `data/backup-full-asysyarif.json` | data 8 tabel dalam JSON | Cadangan data + verifikasi |
| `data/cadangan-manual.sql` | INSERT data mentah | Jaring pengaman |
| `data/cadangan-isi-database.json` | data JSON (dari pipeline rework) | Jaring pengaman |
| `backup-dump-full.py` | script dump | bisa dijalankan ulang |
| `backup-verify.py` | script verifikasi | buktikan dump cocok |

## Bukti Kecocokan (hasil `backup-verify.py`)

```
CREATE TABLE (8)    ✅   Function (4)   ✅   Trigger (4)   ✅
Index (21)          ✅   Policy (12)    ✅   Realtime (6)   ✅
activity_logs=734 ✅   finances=423 ✅   payments=379 ✅
profiles=2 ✅   settings=3 ✅   students=84 ✅   tabungan=0 ✅
HASIL: ✅ LENGKAP & COCOK
```

---

## Catatan Restore (buat Fase 2)

- File `.sql` dibungkus `BEGIN; ... COMMIT;` → kalau gagal di tengah, auto-rollback (tidak ada sampah parsial)
- Semua `CREATE` pakai `IF NOT EXISTS` → bisa dijalankan ulang aman
- **auth.users TIDAK ikut** (web app tidak ada login — view/edit bisa dibuat ulang kalau perlu)
- **service_role key** TIDAK ikut — project baru bikin sendiri. App hanya butuh anon key (ada di `.env` / lingkungan Vercel)

## Keamanan

- Script **read-only** — tidak menulis apa pun ke DB live
- Kredensial tidak pernah dicetak ke output
- Nilai env lama produksi disimpan terpisah di `tmp/asysyarif/env-produksi-vercel-LAMA.md` (bahan revert)