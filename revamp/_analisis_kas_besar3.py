"""Cek: sisa per bulan setelah bayar gaji & kas mesjid (apakah selalu ~250k?)."""
import json, re
from pathlib import Path
from collections import defaultdict

DATA = Path(r"D:\fidh\Coding\Madrasah\iuran-asysyarif\revamp\data")
with open(DATA / "backup-full-asysyarif.json", encoding="utf-8") as f:
    jdata = json.load(f)
finances = jdata["tables"]["finances"]["rows"]

monthly = defaultdict(lambda: {"income": 0.0, "gaji": 0.0, "mesjid": 0.0, "operasional": 0.0, "transfer": 0.0, "lain": 0.0})

for tx in finances:
    d = tx.get("date") or ""
    m = re.match(r"(\d{4}-\d{2})", d)
    if not m: continue
    mk = m.group(1)
    desc = (tx.get("description") or "").lower()
    t = tx.get("type")
    amt = float(tx.get("amount") or 0)
    if t == "income":
        monthly[mk]["income"] += amt
        continue
    # expense
    if "kas mdta" in desc and "diambil" not in desc:
        monthly[mk]["transfer"] += amt
    elif any(w in desc for w in ["guru", "honor", "pembayaran guru"]):
        monthly[mk]["gaji"] += amt
    elif "kas mesjid" in desc or "kas masjid" in desc:
        monthly[mk]["mesjid"] += amt
    elif any(w in desc for w in ["beli", "membeli", "print", "fotocopy", "foto copy", "seragam", "amplop", "brosur", "spidol", "pulpen", "buku", "copy", "bayar"]):
        monthly[mk]["operasional"] += amt
    else:
        monthly[mk]["lain"] += amt

print(f"{'Bulan':8} {'Income':>10} {'Gaji':>10} {'Mesjid':>10} {'Sisa(G+M)':>10} {'Op':>9} {'Transfer':>9} {'Sisa semua':>11}")
for mk in sorted(monthly):
    d = monthly[mk]
    sisa_gm = d["income"] - d["gaji"] - d["mesjid"]
    sisa_all = d["income"] - d["gaji"] - d["mesjid"] - d["operasional"] - d["lain"]
    print(f"{mk:8} {d['income']:>10,.0f} {d['gaji']:>10,.0f} {d['mesjid']:>10,.0f} {sisa_gm:>10,.0f} {d['operasional']:>9,.0f} {d['transfer']:>9,.0f} {sisa_all:>11,.0f}")