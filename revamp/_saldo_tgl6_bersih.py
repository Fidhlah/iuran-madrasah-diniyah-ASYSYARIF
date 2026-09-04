"""Saldo kas MDTA & kas besar kumulatif — versi bersih + audit harian.

Model:
  income (iuran/infaq/daftar/lain)  → +Kas Besar
  expense gaji/mesjid/operasional   → -Kas Besar
  alokasi "kas mdta"                → +Kas MDTA (transfer; TIDAK mengurangi KB)
  belanja dari kas mdta (diambil)   → -Kas MDTA
  seragam                           → -Kas MDTA (spending dari MDTA)
"""
import json, re
from pathlib import Path
from collections import defaultdict

DATA = Path(r"D:\fidh\Coding\Madrasah\iuran-asysyarif\revamp\data")
with open(DATA / "backup-full-asysyarif.json", encoding="utf-8") as f:
    jdata = json.load(f)
finances = jdata["tables"]["finances"]["rows"]

def classify(tx):
    desc = (tx.get("description") or "").lower()
    t = tx.get("type")
    amt = float(tx.get("amount") or 0)
    if t == "income":
        return "kb_in", amt
    if "diambil dari uang kas mdta" in desc or "diambil dari kas mdta" in desc:
        return "md_out", amt
    if "kas mdta" in desc or "uang suka rela potongan tabungan" in desc:
        return "md_in", amt
    if "seragam" in desc:
        return "md_out", amt
    if any(w in desc for w in ["guru", "honor", "pembayaran guru"]):
        return "kb_out", amt
    if "kas mesjid" in desc or "kas masjid" in desc:
        return "kb_out", amt
    # expense lainnya → operasional kas besar
    return "kb_out", amt

events = []
for tx in finances:
    d = tx.get("date") or ""
    m = re.match(r"(\d{4}-\d{2})", d)
    if not m: continue
    kind, amt = classify(tx)
    events.append((d[:10], kind, amt, tx.get("description") or ""))
events.sort()
print(f"events: {len(events)}\n")

kb = 0.0; md = 0.0
# simulasi harian penuh
daily = defaultdict(lambda: {"kb": 0.0, "md": 0.0})
for day, kind, amt, desc in events:
    if kind == "kb_in": kb += amt
    elif kind == "kb_out": kb -= amt
    elif kind == "md_in": md += amt
    elif kind == "md_out": md -= amt
    daily[day]["kb"] = kb
    daily[day]["md"] = md

# snapshot akhir tgl 6 tiap bulan
print(f"{'Bulan':8} {'Kas Besar':>12} {'Kas MDTA':>12} {'Total':>12}")
print("-" * 48)
for day in sorted(daily):
    if day[8:10] == "06":
        kbv = daily[day]["kb"]; mdv = daily[day]["md"]
        print(f"{day[:7]:8} {kbv:>12,.0f} {mdv:>12,.0f} {kbv+mdv:>12,.0f}")

# audit Februari: tampilkan event harian tgl 1-7
print("\n=== AUDIT Februari (event per hari) ===")
for day, kind, amt, desc in events:
    if day.startswith("2026-02"):
        print(f"  {day} {kind:8} {amt:>10,.0f}  {desc[:50]}")