"""Identifikasi semua income 'uang pendaftaran' + jumlah murid di deskripsi."""
import json, re
from pathlib import Path

d = json.load(open(r"D:/fidh/Coding/Madrasah/iuran-asysyarif/revamp/data/backup-project-baru-baseline.json", encoding="utf-8"))
fin = d["tables"]["finances"]["rows"]

rows = []
for r in fin:
    desc = r.get("description") or ""
    if "pendaftaran" in desc.lower():
        rows.append(r)

print(f"Row 'uang pendaftaran': {len(rows)}\n")
tot = 0
for r in sorted(rows, key=lambda x: x["date"]):
    amt = float(r["amount"])
    tot += amt
    # cari nomor-nomor "N. Nama ... (kelas)" di deskripsi
    nums = re.findall(r"(\d+)\.\s+([^\n(]+?)\s*\(([^)]*)\)", desc)
    print(f"  {r['date'][:10]}  {amt:>10,.0f}  jumlah_murid_terdeteksi={len(nums)}")
    print(f"      desc: {desc[:120]}")
    for n in nums:
        print(f"        - {n[1].strip()} (kelas {n[2]})")
print(f"\nTotal pendaftaran: {tot:,.0f}")