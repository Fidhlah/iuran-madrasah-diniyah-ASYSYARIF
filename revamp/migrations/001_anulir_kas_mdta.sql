-- ============================================================
-- MIGRATION 001: Anulir Alokasi Kas MDTA (project dev)
-- Project: pkfouqetuofnvidvrfyn (project baru / dev)
-- Tujuan: Menghapus 5 transaksi "Alokasi Kas MDTA" yang dicatat
--         sebagai expense, karena keputusan bisnis: alokasi MDTA
--         TIDAK ADA — semua uang dianggap satu kas besar.
--         (Disamakan dengan Februari yang tidak ada alokasi MDTA.)
-- Konsekuensi: Kas Besar naik 2.750.000 (uang MDTA kembali ke kas besar)
-- 3 transaksi belanja riil MDTA (spidol, fotokopi, brosur) TETAP expense.
-- Rollback: jalankan 001_rollback.sql
-- ============================================================

BEGIN;

DELETE FROM public."finances"
WHERE id IN (
  '03273584-719e-4c6e-9890-8b6f2dde114c',  -- 2026-03-05 Kas MDTA (400.000)
  'ee016c13-e6c4-43d3-bc4b-3bc02a542f55',  -- 2026-04-05 Kas MDTA Bulan April (300.000)
  '4931941b-4312-4e1f-bc53-2138a9d8d374',  -- 2026-05-05 Kas MDTA Asysyarif (700.000)
  'b5bbc488-68c3-48f5-98aa-bc081b760718',  -- 2026-06-05 Kas MDTA As Syarif (600.000)
  'f8cdda39-8681-4442-9223-1890244a3763'   -- 2026-07-05 Kas MDTA (750.000)
);

COMMIT;

-- Verifikasi setelah jalan:
-- SELECT date, type, amount, description FROM public."finances"
-- WHERE description ILIKE '%kas mdta%' ORDER BY date;
-- Harusnya tersisa hanya 3 row belanja riil (spidol, fotokopi, brosur).
