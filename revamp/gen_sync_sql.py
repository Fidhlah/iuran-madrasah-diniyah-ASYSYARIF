#!/usr/bin/env python3
"""Generate SQL sinkronisasi lama -> baru, cutoff 1 Juli 2026 (read-only, tak konek DB).

Aturan (sesuai keputusan user):
- HANYA data efektif >= 2026-07-01. Juli di baru sudah 100% benar (terverifikasi
  vs laporan eksekutif), jadi praktisnya yg dibawa = Agustus + September
  (+ 6 payment bulan-Juli yg dibayar telat di Agustus).
- Kas MDTA = dihapus dari pengeluaran (melebur ke kas tunggal). 5 ID alokasi MDTA
  dari migrations/001_anulir_kas_mdta.sql TIDAK dibawa (termasuk yg 5 Jul).
- 4 income pendaftaran Jul yg duplikat semantik dgn 12 row per-santri di baru
  -> di-comment-out (opt-in).
- activity_logs / settings / profiles: TIDAK dibawa (sengaja).
- Kolom category dikosongkan (NULL) -> lanjutkan dgn 003_backfill_category.sql.
"""
import json
import sys
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from uuid import UUID

from pg8000.native import literal

LAMA_JSON = "data/fetch-project-lama-20260904-1501.json"
BARU_JSON = "data/fetch-project-baru-20260904-1508.json"
OUT_SQL = "data/sync-lama-ke-baru-20260904.sql"

CUTOFF = "2026-07-01"

# 5 ID alokasi Kas MDTA yg dianulir migration 001 -> JANGAN dibawa
MDTA_IDS = {
    "03273584-719e-4c6e-9890-8b6f2dde114c",  # 2026-03-05 400rb
    "ee016c13-e6c4-43d3-bc4b-3bc02a542f55",  # 2026-04-05 300rb
    "4931941b-4312-4e1f-bc53-2138a9d8d374",  # 2026-05-05 700rb
    "b5bbc488-68c3-48f5-98aa-bc081b760718",  # 2026-06-05 600rb
    "f8cdda39-8681-4442-9223-1890244a3763",  # 2026-07-05 750rb
}

# 4 income pendaftaran Jul duplikat dgn 12 row per-santri di baru -> SKIP
SKIP_FIN_DESC_PREFIX = ("Uang pendaftaran : \n1.", "Uang pendaftaran :\n1.")


def sql_val(v):
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "TRUE" if v else "FALSE"
    if isinstance(v, (int, float, Decimal)):
        return str(v)
    if isinstance(v, UUID):
        return f"'{v}'::uuid"
    if isinstance(v, datetime):
        s = v.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M:%S.%f") + "+00:00"
        return f"'{s}'::timestamp"
    if isinstance(v, (dict, list)):
        return literal(json.dumps(v, default=str))
    if isinstance(v, bytes):
        return f"'\\x{v.hex()}'"
    return literal(str(v))


def q(s):
    return f'"{s}"'


def main():
    lama = json.load(open(LAMA_JSON, encoding="utf-8"))["tables"]
    baru = json.load(open(BARU_JSON, encoding="utf-8"))["tables"]

    sl = {r["id"]: r for r in lama["students"]["rows"]}
    sb = {r["id"]: r for r in baru["students"]["rows"]}
    pl = {r["id"]: r for r in lama["payments"]["rows"]}
    pb = {r["id"]: r for r in baru["payments"]["rows"]}
    fl = {r["id"]: r for r in lama["finances"]["rows"]}
    fb = {r["id"]: r for r in baru["finances"]["rows"]}

    # ---- students baru ----
    new_students = [sl[i] for i in sorted(set(sl) - set(sb))]

    # ---- payments: missing + efektif >= cutoff ----
    # efektif = paid_at >= cutoff, atau belum-lunas dgn (year,month) >= (2026,7)
    def in_scope_pay(r):
        if r["paid_at"]:
            return str(r["paid_at"])[:10] >= CUTOFF
        return (r["year"], r["month"]) >= (2026, 7)

    miss_pay = [pl[i] for i in set(pl) - set(pb)]
    new_payments = sorted([r for r in miss_pay if in_scope_pay(r)],
                          key=lambda x: (str(x["paid_at"] or ""), x["year"], x["month"]))
    excluded_pay = [r for r in miss_pay if not in_scope_pay(r)]

    # ---- finances: missing + date >= cutoff, bukan MDTA, bukan duplikat ----
    def is_duplikat_daftar(r):
        return (r["description"] or "").startswith(SKIP_FIN_DESC_PREFIX)

    miss_fin = [fl[i] for i in set(fl) - set(fb)]
    skipped_mdta = [r for r in miss_fin if r["id"] in MDTA_IDS]
    skipped_dup = [r for r in miss_fin
                   if r["id"] not in MDTA_IDS and is_duplikat_daftar(r)]
    new_fin = sorted(
        [r for r in miss_fin
         if (r["date"] or "")[:10] >= CUTOFF
         and r["id"] not in MDTA_IDS and not is_duplikat_daftar(r)],
        key=lambda x: x["date"] or "")
    # yg miss tapi tak dibawa HARUS semuanya: sebelum-cutoff / MDTA / duplikat
    unexplained = [r for r in miss_fin
                   if r not in new_fin and r not in skipped_mdta and r not in skipped_dup]
    assert not unexplained, \
        f"ada finances-miss tak terjelaskan: {[(r['id'][:8], r['date']) for r in unexplained]}"

    # ---- validasi referensi ----
    sb_ids = set(sb) | {r["id"] for r in new_students}
    bad_pay = [r["id"][:8] for r in new_payments if r["student_id"] not in sb_ids]
    pb_ids = set(pb) | {r["id"] for r in new_payments}
    bad_fin = [r["id"][:8] for r in new_fin
               if r["payment_id"] and r["payment_id"] not in pb_ids]
    assert not bad_pay, f"payments dgn student tak dikenal: {bad_pay}"
    assert not bad_fin, f"finances dgn payment tak dikenal: {bad_fin}"
    print(f"students+{len(new_students)} payments+{len(new_payments)} "
          f"finances+{len(new_fin)} | skip-MDTA={len(skipped_mdta)} "
          f"skip-duplikat={len(skipped_dup)} pay-diluar-cutoff={len(excluded_pay)}")
    for r in excluded_pay:
        print(f"  pay excluded: {r['id'][:8]} {(r['year'], r['month'])} "
              f"paid={r['is_paid']} paid_at={r['paid_at']}")

    L = []
    L.append("-- ============================================================")
    L.append("-- SYNC: data efektif >= 1 Juli 2026, LAMA -> BARU")
    L.append("-- Dibuat: " + datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"))
    L.append("-- Sumber : fetch-project-lama-20260904-1501.json")
    L.append("-- Target : project BARU pkfouqetuofnvidvrfyn")
    L.append("-- Juli di BARU sudah 100% benar (cocok laporan eksekutif),")
    L.append("-- jadi isi file ini praktisnya = Agustus + September")
    L.append("-- (+ 6 payment Juli yg dibayar telat di Agustus).")
    L.append("-- Kas MDTA TIDAK dibawa (dianulir, melebur ke kas tunggal).")
    L.append("-- Cara pakai: jalankan SELURUH file di SQL Editor project BARU,")
    L.append("-- lalu jalankan migrations/003_backfill_category.sql.")
    L.append("-- File ini TIDAK menghapus / mengubah row yg sudah ada di BARU,")
    L.append("-- kecuali 1 UPDATE kelas yg ditandai (boleh dihapus barisnya).")
    L.append("-- ============================================================")
    L.append("")
    L.append("BEGIN;")
    L.append("")
    L.append("-- Matikan trigger sementara: payments lunas yg dibawa SUDAH punya")
    L.append("-- pasangan finances-nya di file ini (biar tidak dobel).")
    L.append("ALTER TABLE public.payments DISABLE TRIGGER payment_finance_sync;")
    L.append("")

    L.append(f"-- 1) STUDENTS baru (+{len(new_students)})")
    scol = ["id", "name", "class", "year_enrolled", "status",
            "created_at", "updated_at", "has_tabungan", "inactive_reason"]
    for r in new_students:
        vals = ", ".join(sql_val(r[c]) for c in scol)
        L.append(f"INSERT INTO public.students ({', '.join(q(c) for c in scol)}) "
                 f"VALUES ({vals}); -- {r['name']}")
    L.append("")

    L.append(f"-- 2) PAYMENTS baru (+{len(new_payments)})")
    pcol = ["id", "student_id", "month", "year", "amount", "is_paid",
            "paid_at", "created_at", "updated_at"]
    for r in new_payments:
        vals = ", ".join(sql_val(r[c]) for c in pcol)
        L.append(f"INSERT INTO public.payments ({', '.join(q(c) for c in pcol)}) "
                 f"VALUES ({vals});")
    L.append("")
    L.append("ALTER TABLE public.payments ENABLE TRIGGER payment_finance_sync;")
    L.append("")

    L.append("-- 3) FINANCES baru (category=NULL -> isi via 003_backfill_category.sql)")
    fcol = ["id", "date", "type", "amount", "description",
            "payment_id", "created_at", "updated_at"]
    for r in new_fin:
        vals = ", ".join(sql_val(r[c]) for c in fcol)
        L.append(f"INSERT INTO public.finances ({', '.join(q(c) for c in fcol)}) "
                 f"VALUES ({vals}); -- {(r['date'] or '')[:10]} {r['type']} {r['amount']}")
    L.append("")
    L.append("-- 3b) DILEWATI (commented-out).")
    L.append("-- MDTA: 5 alokasi Kas MDTA (Mar-Jul, total 2.750.000) -> dianulir,")
    L.append("--   melebur ke kas tunggal. JANGAN uncomment.")
    for r in sorted(skipped_mdta, key=lambda x: x["date"] or ""):
        vals = ", ".join(sql_val(r[c]) for c in fcol)
        L.append(f"--SKIP-MDTA INSERT INTO public.finances "
                 f"({', '.join(q(c) for c in fcol)}) VALUES ({vals}); "
                 f"-- {(r['date'] or '')[:10]} {r['amount']}")
    L.append("-- Duplikat: 4 income pendaftaran Jul yg ISINYA SAMA dgn 12 row")
    L.append("--   per-santri yg sudah ada di BARU. Inject = dobel ~Rp900rb.")
    L.append("--   Uncomment HANYA jika yakin beda.")
    for r in sorted(skipped_dup, key=lambda x: x["date"] or ""):
        vals = ", ".join(sql_val(r[c]) for c in fcol)
        L.append(f"--SKIP-DUPLIKAT INSERT INTO public.finances "
                 f"({', '.join(q(c) for c in fcol)}) VALUES ({vals}); "
                 f"-- {(r['date'] or '')[:10]} {r['amount']}")
    L.append("")

    L.append("-- 4) KOREKSI KELAS: Muhammad Zaki Rizki Ramadhan 1 -> 2")
    L.append("--   (di LAMA kelas 2, di BARU kelas 1. Hapus baris ini jika yg benar kelas 1.)")
    L.append("UPDATE public.students SET class = '2' "
             "WHERE id = '86cce048-250b-4e17-a3b7-3261e6335f40';")
    L.append("")
    L.append("COMMIT;")
    L.append("")
    L.append("-- 5) VERIFIKASI (jalankan terpisah setelah COMMIT + 003):")
    L.append("-- SELECT 'students', count(*) FROM public.students;      -- harap 86")
    L.append("-- SELECT 'payments', count(*) FROM public.payments;      -- harap 447")
    L.append("-- SELECT 'finances', count(*) FROM public.finances;      -- harap 500")
    L.append("-- SELECT type, count(*), sum(amount) FROM public.finances")
    L.append("--   WHERE date >= '2026-08-01' GROUP BY type;")
    L.append("")

    Path(OUT_SQL).write_text("\n".join(L) + "\n", encoding="utf-8")
    n_ins = sum(1 for x in L if x.startswith("INSERT INTO"))
    print(f"OK -> {OUT_SQL} ({Path(OUT_SQL).stat().st_size:,} bytes), "
          f"INSERT aktif: {n_ins}")


if __name__ == "__main__":
    sys.exit(main())
