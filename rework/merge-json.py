#!/usr/bin/env python3
"""Merge isi-database.json untuk laporan Juli.

Sumber:
  - BASE  = isi-database-backup-janjun.json  (Jan–Jun, sudah + koreksi Feb 350rb — dipakai HTML lama)
  - FRESH = isi-database.json                (dump terbaru dari DB, ada Juli + Agustus)

Hasil:
  - finances: BASE Jan–Jun (343 tx) + FRESH Juli (68 tx) — Agustus di-exclude
  - tabel lain: pakai FRESH (data terbaru: students 84, payments 374, dst.)
  - summary dihitung ulang
"""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
BASE = SCRIPT_DIR / "isi-database-backup-janjun.json"
FRESH = SCRIPT_DIR / "isi-database.json"
OUT = SCRIPT_DIR / "isi-database-jan-jul.json"

TABLE_ORDER = [
    "activity_logs", "settings", "students", "payments",
    "finances", "tabungan", "tabungan_transaksi", "profiles",
]


def main():
    with open(BASE, encoding="utf-8") as f:
        base = json.load(f)
    with open(FRESH, encoding="utf-8") as f:
        fresh = json.load(f)

    base_fin = base["tables"]["finances"]["rows"]
    fresh_fin = fresh["tables"]["finances"]["rows"]

    # finances: base (semua, karena base cuma Jan–Jun) + fresh Juli only
    jul_fin = [r for r in fresh_fin if (r.get("date") or "")[:7] == "2026-07"]
    merged_fin = list(base_fin) + jul_fin

    print(f"Base finances: {len(base_fin)} (Jan–Jun, with Feb correction)")
    print(f"Fresh finances: {len(fresh_fin)} (incl. {sum(1 for r in fresh_fin if (r.get('date') or '')[:7]=='2026-08')} Agustus)")
    print(f"  → Juli: {len(jul_fin)}")
    print(f"Merged finances: {len(merged_fin)}")

    # Tabel lain: pakai fresh (data terbaru)
    merged_tables = {}
    for t in TABLE_ORDER:
        rows = fresh["tables"][t]["rows"] if t != "finances" else merged_fin
        merged_tables[t] = {"count": len(rows), "rows": rows}

    # Summary
    total_rows = sum(len(t["rows"]) for t in merged_tables.values())
    table_counts = {t: len(merged_tables[t]["rows"]) for t in TABLE_ORDER}

    fin_summary = {"total_income": 0, "total_expense": 0, "balance": 0}
    for r in merged_fin:
        amt = int(float(r.get("amount") or 0))
        if r.get("type") == "income":
            fin_summary["total_income"] += amt
        elif r.get("type") == "expense":
            fin_summary["total_expense"] += amt
    fin_summary["balance"] = fin_summary["total_income"] - fin_summary["total_expense"]

    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

    data = {
        "exported_at": now,
        "source": "Supabase - agslfqsiswrzqqzveifr (merge Jan–Jun corrected + Jul fresh)",
        "tables": merged_tables,
        "summary": {
            "total_rows": total_rows,
            "table_counts": table_counts,
            "finance_summary": fin_summary,
        },
    }

    OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n✅ Merge selesai → {OUT}")
    print(f"   Total rows: {total_rows:,}")
    print(f"   Finance: in {fin_summary['total_income']:,} out {fin_summary['total_expense']:,} balance {fin_summary['balance']:,}")

    # Verifikasi singkat
    kor = [r for r in merged_fin if "koreksi" in r.get("description", "").lower()]
    aug = [r for r in merged_fin if (r.get("date") or "")[:7] == "2026-08"]
    print(f"   Koreksi Feb: {len(kor)} ✅" if kor else "   Koreksi Feb: 0 ❌")
    print(f"   Agustus di-finances: {len(aug)} (harusnya 0)")


if __name__ == "__main__":
    main()
