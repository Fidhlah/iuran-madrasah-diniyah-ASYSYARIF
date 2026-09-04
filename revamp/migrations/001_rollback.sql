-- ============================================================
-- ROLLBACK MIGRATION 001: Kembalikan 5 transaksi Alokasi Kas MDTA
-- (dipanggil kalau mau batalkan anulir)
-- ============================================================

BEGIN;

-- 2026-03-05 Kas MDTA (dipakai nyicil seragam) 400.000
INSERT INTO public."finances" (id, date, type, amount, description, payment_id, created_at, updated_at)
VALUES ('03273584-719e-4c6e-9890-8b6f2dde114c', '2026-03-05', 'expense', 400000,
        'Kas MDTA (dipakai buat nyicil bayar seragam murid ke Ibu Sri)', NULL, now(), now());

-- 2026-04-05 Kas MDTA Bulan April 2026 300.000
INSERT INTO public."finances" (id, date, type, amount, description, payment_id, created_at, updated_at)
VALUES ('ee016c13-e6c4-43d3-bc4b-3bc02a542f55', '2026-04-05', 'expense', 300000,
        'Kas MDTA Bulan April 2026', NULL, now(), now());

-- 2026-05-05 Kas MDTA Asysyarif 700.000
INSERT INTO public."finances" (id, date, type, amount, description, payment_id, created_at, updated_at)
VALUES ('4931941b-4312-4e1f-bc53-2138a9d8d374', '2026-05-05', 'expense', 700000,
        'Kas MDTA Asysyarif', NULL, now(), now());

-- 2026-06-05 Kas MDTA As Syarif 600.000
INSERT INTO public."finances" (id, date, type, amount, description, payment_id, created_at, updated_at)
VALUES ('b5bbc488-68c3-48f5-98aa-bc081b760718', '2026-06-05', 'expense', 600000,
        'Kas MDTA As Syarif', NULL, now(), now());

-- 2026-07-05 Kas MDTA 750.000
INSERT INTO public."finances" (id, date, type, amount, description, payment_id, created_at, updated_at)
VALUES ('f8cdda39-8681-4442-9223-1890244a3763', '2026-07-05', 'expense', 750000,
        'Kas MDTA', NULL, now(), now());

COMMIT;