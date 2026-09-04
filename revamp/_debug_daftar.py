"""Debug: tampilkan deskripsi mentah + semua kolom untuk row yang mengandung 'pendaftaran'."""
import json
from pathlib import Path

d = json.load(open(r"D:/fidh/Coding/Madrasah/iuran-asysyarif/revamp/data/backup-project-baru-baseline.json", encoding="utf-8"))
fin = d["tables"]["finances"]["rows"]
print(f"Total finances rows: {len(fin)}")
print(f"Kolom sample row pertama: {list(fin[0].keys())}\n")

# cari semua row yang desc mengandung 'pendaftaran' (case insensitive)
print("=== Raw dump row 'pendaftaran' ===")
for i, r in enumerate(fin):
    desc = (r.get("description") or "")
    if "pendaftaran" in desc.lower():
        print(f"  [{i}] date={r.get('date')} type={r.get('type')} amount={r.get('amount')}")
        print(f"       id={r.get('id')} payment_id={r.get('payment_id')}")
        print(f"       desc={desc!r}")