-- MIGRATION 002: Pecah Uang Pendaftaran multi-murid jadi per-murid
-- Project: dev. Tanggal per row SAMA dengan row asli.
-- 4 row asli dihapus (total 900000) -> 12 row per murid @75000.
BEGIN;

DELETE FROM public."finances" WHERE id IN (
  '860e3e7b-223d-48b0-b86c-4e27a2906419',
  '54420e08-a441-4241-9e21-cb7d0cfe7c62',
  '2d17a334-ebc8-4d1e-b4c3-bcbe9e03cf36',
  'ac348ce1-12c7-496d-814c-24ef08bf6915'
);

INSERT INTO public."finances" (id, date, type, amount, description, payment_id, created_at, updated_at)
VALUES ('b1963a3c-6026-5e0a-998f-37cc1ba76be0', '2026-07-13', 'income', 75000, 'Uang pendaftaran : Atthaya Meilan Putri Hadian (1)', NULL, now(), now());
INSERT INTO public."finances" (id, date, type, amount, description, payment_id, created_at, updated_at)
VALUES ('a7cf6ef4-6bd2-5722-b239-6ae72bfe20d3', '2026-07-13', 'income', 75000, 'Uang pendaftaran : Shahida Delisha Hiza Asiah (PAUD)', NULL, now(), now());

INSERT INTO public."finances" (id, date, type, amount, description, payment_id, created_at, updated_at)
VALUES ('2f53426b-54ad-5be2-b1be-98e21917fb2b', '2026-07-14', 'income', 75000, 'Uang pendaftaran : Arya Haikal Rasyid (2)', NULL, now(), now());
INSERT INTO public."finances" (id, date, type, amount, description, payment_id, created_at, updated_at)
VALUES ('7508b313-7e03-5d6e-8d2b-b176139a052f', '2026-07-14', 'income', 75000, 'Uang pendaftaran : Bilal Putra Permana (1)', NULL, now(), now());
INSERT INTO public."finances" (id, date, type, amount, description, payment_id, created_at, updated_at)
VALUES ('ee762f8c-84c8-59a5-9e17-bd7ce2c27821', '2026-07-14', 'income', 75000, 'Uang pendaftaran : Mikhail Rasya Permana (1)', NULL, now(), now());
INSERT INTO public."finances" (id, date, type, amount, description, payment_id, created_at, updated_at)
VALUES ('904d095d-b06a-5d7d-9a02-7f7030ed5e7c', '2026-07-14', 'income', 75000, 'Uang pendaftaran : Alvino Sadega Saputra (1)', NULL, now(), now());
INSERT INTO public."finances" (id, date, type, amount, description, payment_id, created_at, updated_at)
VALUES ('f5a0f6a9-3247-5efa-a3a3-1a7c0a230bf3', '2026-07-14', 'income', 75000, 'Uang pendaftaran : Karrini Nurr Putri Khadijah (1)', NULL, now(), now());

INSERT INTO public."finances" (id, date, type, amount, description, payment_id, created_at, updated_at)
VALUES ('00ed7159-26cc-54e8-af6b-016ed089d7e3', '2026-07-21', 'income', 75000, 'Uang pendaftaran : Shifan Awal Khairan (1)', NULL, now(), now());
INSERT INTO public."finances" (id, date, type, amount, description, payment_id, created_at, updated_at)
VALUES ('7a07e159-282f-5237-a81c-42bd9c0abf80', '2026-07-21', 'income', 75000, 'Uang pendaftaran : Muhammad Zaki Rizki Ramadhan (1)', NULL, now(), now());

INSERT INTO public."finances" (id, date, type, amount, description, payment_id, created_at, updated_at)
VALUES ('f0f7140f-8039-5763-9576-d421ef3a7801', '2026-07-28', 'income', 75000, 'Uang pendaftaran : Shafia (1)', NULL, now(), now());
INSERT INTO public."finances" (id, date, type, amount, description, payment_id, created_at, updated_at)
VALUES ('05ff76a3-04e2-5a8b-a9dc-7e7c0ce09f1e', '2026-07-28', 'income', 75000, 'Uang pendaftaran : Yasmin (TK)', NULL, now(), now());
INSERT INTO public."finances" (id, date, type, amount, description, payment_id, created_at, updated_at)
VALUES ('2a7c88da-74d6-5eaa-a1f2-23d44cf77cb2', '2026-07-28', 'income', 75000, 'Uang pendaftaran : Muhammad Rafa Assyauqi (TK)', NULL, now(), now());

COMMIT;
