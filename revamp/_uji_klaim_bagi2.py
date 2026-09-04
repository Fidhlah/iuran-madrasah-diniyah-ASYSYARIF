"""Uji klaim user: tiap bulan, tgl 5: gaji guru tetap, sisanya dibagi 2 (MDTA & Mesjid)."""
import json, re
from pathlib import Path
from collections import defaultdict

DATA = Path(r"D:\fidh\Coding\Madrasah\iuran-asysyarif\revamp\data")
with open(DATA / "backup-full-asysyarif.json", encoding="utf-8") as f:
    jdata = json.load(f)
finances = jdata["tables"]["finances"]["rows"]

monthly = defaultdict(lambda: {"income": 0.0, "gaji": 0.0, "mesjid": 0.0, "mdta": 0.0, "op": 0.0, "lain": 0.0, "rows": []})

def classify(tx):
    desc = (tx.get("description") or "").lower()
    amt = float(tx.get("amount") or 0)
    t = tx.get("type")
    if t == "income":
        return "income", amt
    if "diambil dari uang kas mdta" in desc or "diambil dari kas mdta" in desc:
        return "op", amt
    if "kas mdta" in desc:
        return "mdta", amt
    if "uang suka rela potongan tabungan" in desc:
        return "mdta", amt
    if "seragam" in desc:
        return "op", amt
    if any(w in desc for w in ["guru", "honor", "pembayaran guru"]):
        return "gaji", amt
    if "kas mesjid" in desc or "kas masjid" in desc:
        return "mesjid", amt
    if any(w in desc for w in ["beli", "membeli", "print", "fotocopy", "foto copy", "amplop", "brosur", "spidol", "pulpen", "buku", "copy", "bayar"]):
        return "op", amt
    return "lain", amt

for tx in finances:
    d = tx.get("date") or ""
    m = re.match(r"(\d{4}-\d{2})", d)
    if not m: continue
    mk = m.group(1)
    kind, amt = classify(tx)
    monthly[mk][kind] += amt
    monthly[mk]["rows"].append((d[:10], kind, amt, tx.get("description") or ""))

print(f"{'Bulan':8} {'Income':>10} {'Gaji':>10} {'Sisa':>10} {'Sisa/2':>9} | {'Mesjid':>9} {'MDTA':>9} {'Mesjid+MDTA':>12}")
print("-" * 100)
for mk in sorted(monthly):
    d = monthly[mk]
    income = d["income"]
    gaji = d["gaji"]
    sisa = income - gaji
    half = sisa / 2
    total_fund = d["mesjid"] + d["mdta"]
    print(f"{mk:8} {income:>10,.0f} {gaji:>10,.0f} {sisa:>10,.0f} {half:>9,.0f} | {d['mesjid']:>9,.0f} {d['mdta']:>9,.0f} {total_fund:>12,.0f}")

print("\n=== RINCIAN TRANSFER tgl 5-6 per bulan ===")
for mk in sorted(monthly):
    print(f"\n--- {mk} ---")
    for dt, kind, amt, desc in monthly[mk]["rows"]:
        if kind in ("gaji", "mesjid", "mdta"):
            print(f"  {dt} {kind:8} {amt:>10,.0f}  {desc[:55]}")