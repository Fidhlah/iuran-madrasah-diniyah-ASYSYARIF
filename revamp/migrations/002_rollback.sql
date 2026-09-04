-- ROLLBACK 002: balikin 12 pecahan -> 4 row multi
BEGIN;
DELETE FROM public."finances" WHERE id IN (
  'b1963a3c-6026-5e0a-998f-37cc1ba76be0',
  'a7cf6ef4-6bd2-5722-b239-6ae72bfe20d3',
  '2f53426b-54ad-5be2-b1be-98e21917fb2b',
  '7508b313-7e03-5d6e-8d2b-b176139a052f',
  'ee762f8c-84c8-59a5-9e17-bd7ce2c27821',
  '904d095d-b06a-5d7d-9a02-7f7030ed5e7c',
  'f5a0f6a9-3247-5efa-a3a3-1a7c0a230bf3',
  '00ed7159-26cc-54e8-af6b-016ed089d7e3',
  '7a07e159-282f-5237-a81c-42bd9c0abf80',
  'f0f7140f-8039-5763-9576-d421ef3a7801',
  '05ff76a3-04e2-5a8b-a9dc-7e7c0ce09f1e',
  '2a7c88da-74d6-5eaa-a1f2-23d44cf77cb2'
);

INSERT INTO public."finances" (id, date, type, amount, description, payment_id, created_at, updated_at)
VALUES ('860e3e7b-223d-48b0-b86c-4e27a2906419', '2026-07-13', 'income', 150000, 'Uang pendaftaran : 
1. Atthaya Meilan Putri Hadian (1)
2. Shahida Delisha Hiza Asiah (PAUD) 

', NULL, now(), now());

INSERT INTO public."finances" (id, date, type, amount, description, payment_id, created_at, updated_at)
VALUES ('54420e08-a441-4241-9e21-cb7d0cfe7c62', '2026-07-14', 'income', 375000, 'Uang pendaftaran :
1. Arya Haikal Rasyid (2)
2. Bilal Putra Permana (1)
3. Mikhail Rasya Permana (1)
4. Alvino Sadega Saputra (1)
5. Karrini Nurr Putri Khadijah (1)', NULL, now(), now());

INSERT INTO public."finances" (id, date, type, amount, description, payment_id, created_at, updated_at)
VALUES ('2d17a334-ebc8-4d1e-b4c3-bcbe9e03cf36', '2026-07-21', 'income', 150000, 'Uang pendaftaran :
1. Shifan Awal Khairan (1)
2. Muhammad Zaki Rizki Ramadhan (1)', NULL, now(), now());

INSERT INTO public."finances" (id, date, type, amount, description, payment_id, created_at, updated_at)
VALUES ('ac348ce1-12c7-496d-814c-24ef08bf6915', '2026-07-28', 'income', 225000, 'Uang pendaftaran :
1. Shafia (1)
2. Yasmin (TK)
3. Muhammad Rafa Assyauqi (TK)', NULL, now(), now());

COMMIT;
