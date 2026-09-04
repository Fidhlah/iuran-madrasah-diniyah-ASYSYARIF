"""Uji: iuran bulanan harus HABIS dibagi 3 (gaji + mesjid + mdta). Sisa = ?"""
import json, re
from pathlib import Path
from collections import defaultdict

DATA = Path(r"D:\fidh\Coding\Madrasah\iuran-asysyarif\revamp\data")
with open(DATA / "backup-full-asysyarif.json", encoding="utf-8") as f:
    jdata = json.load(f)
finances = jdata["tables"]["finances"]["rows"]

monthly = defaultdict(lambda: {"iuran": 0.0, "gaji": 0.0, "mesjid": 0.0, "mdta": 0.0, "op": 0.0, "infaq": 0.0, "daftar": 0.0, "lain": 0.0})

for tx in finances:
    d = tx.get("date") or ""
    m = re.match(r"(\d{4}-\d{2})", d)
    if not m: continue
    mk = m.group(1)
    desc = (tx.get("description") or "").lower()
    amt = float(tx.get("amount") or 0)
    t = tx.get("type")
    if t == "income":
        if "membayar iuran" in desc: monthly[mk]["iuran"] += amt
        elif "infaq" in desc or "shadaqah" in desc: monthly[mk]["infaq"] += amt
        elif "pendaftaran" in desc: monthly[mk]["daftar"] += amt
        else: monthly[mk]["lain"] += amt
    else:
        if "diambil dari uang kas mdta" in desc or "diambil dari kas mdta" in desc: monthly[mk]["op"] += amt
        elif "kas mdta" in desc: monthly[mk]["mdta"] += amt
        elif "uang suka rela potongan tabungan" in desc: monthly[mk]["mdta"] += amt
        elif "seragam" in desc: monthly[mk]["op"] += amt
        elif any(w in desc for w in ["guru", "honor", "pembayaran guru"]): monthly[mk]["gaji"] += amt
        elif "kas mesjid" in desc or "kas masjid" in desc: monthly[mk]["mesjid"] += amt
        elif any(w in desc for w in ["beli", "membeli", "print", "fotocopy", "foto copy", "amplop", "brosur", "spidol", "pulpen", "buku", "copy", "bayar"]): monthly[mk]["op"] += amt
        else: monthly[mk]["lain"] += amt

print(f"{'Bln':6} {'Iuran':>9} {'Gaji':>9} {'Mesjid':>9} {'MDTA':>9} {'3-DIV':>9} {'Sisa(iuran-3div)':>14} {'Op':>9} {'Infaq':>8} {'Daftar':>8}")
print("-" * 105)
for mk in sorted(monthly):
    d = monthly[mk]
    sisa = d["iuran"] - d["gaji"] - d["mesjid"] - d["mdta"]
    print(f"{mk:6} {d['iuran']:>9,.0f} {d['gaji']:>9,.0f} {d['mesjid']:>9,.0f} {d['mdta']:>9,.0f} {d['gaji']+d['mesjid']+d['mdta']:>9,.0f} {sisa:>14,.0f} {d['op']:>9,.0f} {d['infaq']:>8,.0f} {d['daftar']:>8,.0f}")