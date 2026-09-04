-- ============================================================
-- MIGRATION 003: Backfill kategori pengeluaran (expense only)
-- Project: dev (pkfouqetuofnvidvrfyn)
-- Tujuan: Isi kolom category untuk data expense lama dari deskripsi.
--         Income dibiarkan NULL (keputusan: pemasukan tanpa kategori).
-- Idempotent: bisa dijalankan ulang.
-- ============================================================

BEGIN;

-- 1) Honor Guru
UPDATE public."finances" SET category='honor_guru'
WHERE type='expense' AND category IS NULL
  AND (description ILIKE '%guru%' OR description ILIKE '%honor%' OR description ILIKE '%pembayaran guru%');

-- 2) Kas Masjid
UPDATE public."finances" SET category='kas_mesjid'
WHERE type='expense' AND category IS NULL
  AND (description ILIKE '%kas masjid%' OR description ILIKE '%kas mesjid%');

-- 3) Operasional (beli/ATK/print/fotokopi/dll)
UPDATE public."finances" SET category='operasional'
WHERE type='expense' AND category IS NULL
  AND (description ILIKE '%beli%' OR description ILIKE '%spidol%' OR description ILIKE '%pulpen%'
       OR description ILIKE '%buku%' OR description ILIKE '%fotokopi%' OR description ILIKE '%foto copy%'
       OR description ILIKE '%print%' OR description ILIKE '%copy%' OR description ILIKE '%brosur%'
       OR description ILIKE '%amplop%' OR description ILIKE '%formulir%');

-- 4) Sisa expense -> lainnya
UPDATE public."finances" SET category='lainnya'
WHERE type='expense' AND category IS NULL;

COMMIT;