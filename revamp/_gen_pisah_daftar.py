"""Generate migration 002: pecah row pendaftaran multi-murid menjadi per-murid."""
import json, re
from pathlib import Path

DATA = Path(r"D:/fidh/Coding/Madrasah/iuran-asysyarif/revamp/data")
d = json.load(open(DATA / "backup-project-baru-baseline.json", encoding="utf-8"))
fin = d["tables"]["finances"]["rows"]

rows = []
for r in fin:
    desc = r.get("description") or ""
    has_list = bool(re.search(r"^\s*\d+\.\s+\S", desc, re.M))
    if r.get("type") == "income" and "pendaftaran" in desc.lower() and has_list:
        rows.append(r)

print(f"Row pendaftaran MULTI-murid: {len(rows)}\n")
for r in rows:
    desc = r.get("description") or ""
    items = re.findall(r"^\s*\d+\.\s+([^(\r\n]+?)\s*\(([^)]*)\)", desc, re.MULTILINE)
    amt = float(r["amount"])
    n = len(items)
    per = amt / n if n else 0
    print(f"  {r['id']}  {r['date'][:10]}  {amt:,.0f}  n={n} per={per:,.0f}")
    for name, kelas in items:
        print(f"      - {name.strip()} (kelas {kelas.strip()})")