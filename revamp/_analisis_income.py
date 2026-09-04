"""Bongkar income kas besar per bulan: dari mana aja? iuran vs donasi vs lain."""
import json, re
from pathlib import Path
from collections import defaultdict

DATA = Path(r"D:\fidh\Coding\Madrasah\iuran-asysyarif\revamp\data")
with open(DATA / "backup-full-asysyarif.json", encoding="utf-8") as f:
    jdata = json.load(f)
finances = jdata["tables"]["finances"]["rows"]

# income per bulan + breakdown kategori
monthly = defaultdict(lambda: {"total": 0.0, "iuran": 0.0, "infaq": 0.0, "daftar": 0.0, "lain": 0.0, "detail": []})

for tx in finances:
    if tx.get("type") != "income":
        continue
    d = tx.get("date") or ""
    m = re.match(r"(\d{4}-\d{2})", d)
    if not m: continue
    mk = m.group(1)
    desc = (tx.get("description") or "").lower()
    amt = float(tx.get("amount") or 0)
    monthly[mk]["total"] += amt
    if "membayar iuran" in desc:
        monthly[mk]["iuran"] += amt
    elif "infaq" in desc or "shadaqah" in desc or "donasi" in desc:
        monthly[mk]["infaq"] += amt
    elif "pendaftaran" in desc:
        monthly[mk]["daftar"] += amt
    else:
        monthly[mk]["lain"] += amt
    monthly[mk]["detail"].append((d[:10], amt, tx.get("description") or ""))

print(f"{'Bulan':8} {'TOTAL':>10} {'Iuran':>10} {'Infaq/Donasi':>12} {'Pendaftaran':>12} {'Lain':>8}")
for mk in sorted(monthly):
    d = monthly[mk]
    print(f"{mk:8} {d['total']:>10,.0f} {d['iuran']:>10,.0f} {d['infaq']:>12,.0f} {d['daftar']:>12,.0f} {d['lain']:>8,.0f}")

print("\n=== Income NON-iuran (donasi & pendaftaran) detail ===")
for mk in sorted(monthly):
    d = monthly[mk]
    for dt, amt, desc in d["detail"]:
        if "membayar iuran" not in desc:
            print(f"  {mk} {dt}  {amt:>10,.0f}  {desc[:60]}")

print("\n=== Jumlah santri bayar per bulan (iuran 50k) ===")
for mk in sorted(monthly):
    d = monthly[mk]
    n = d["iuran"] / 50000
    print(f"  {mk}: {d['iuran']:>10,.0f} = {n:.0f} santri x 50k")