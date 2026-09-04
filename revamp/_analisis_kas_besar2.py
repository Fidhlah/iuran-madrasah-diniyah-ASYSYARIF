"""Analisis: saldo kas besar berjalan harian, cek 'setelah tgl 5 sisa 250k'."""
import json, re
from pathlib import Path

DATA = Path(r"D:\fidh\Coding\Madrasah\iuran-asysyarif\revamp\data")
with open(DATA / "backup-full-asysyarif.json", encoding="utf-8") as f:
    jdata = json.load(f)
finances = jdata["tables"]["finances"]["rows"]
print(f"Total transaksi finances: {len(finances)}\n")

def classify(tx):
    desc = (tx.get("description") or "").lower()
    t = tx.get("type")
    amt = float(tx.get("amount") or 0)
    if t == "income":
        return ("kas_besar", False, amt)
    if "diambil dari uang kas mdta" in desc or "diambil dari kas mdta" in desc:
        return ("kas_mdta", False, amt)   # spending from MDTA
    if "kas mdta" in desc or "uang suka rela potongan tabungan masuk ke kas mdta" in desc:
        return ("kas_mdta", True, amt)     # alokasi → transfer
    if "seragam" in desc:
        return ("kas_mdta", False, amt)
    return ("kas_besar", False, amt)

# kumpulkan semua tx kas besar: (date, amount dengan tanda, label)
events = []
for tx in finances:
    d = tx.get("date") or ""
    m = re.match(r"(\d{4})-(\d{2})-(\d{2})", d)
    if not m:
        continue
    fund, is_trf, amt = classify(tx)
    if fund != "kas_besar":
        continue
    key = m.group(1) + "-" + m.group(2) + "-" + m.group(3)
    signed = amt if tx.get("type") == "income" else -amt
    label = tx.get("description") or ""
    events.append((key, signed, label))

events.sort()
print(f"Event kas besar: {len(events)}\n")

# simulasi saldo berjalan + snapshot tiap akhir hari; kumpulkan per bulan
from collections import defaultdict
daily = defaultdict(float)
for key, signed, label in events:
    daily[key] += signed

all_days = sorted(daily.keys())
running = 0.0
snapshots = {}   # month -> (saldo pada akhir hari ke-5, saldo pada akhir hari ke-6)
month_final = {}
for day in all_days:
    running += daily[day]
    y, m, dd = day.split("-")
    mk = y + "-" + m
    if dd == "05":
        snapshots.setdefault(mk, {})["d5"] = running
    if dd == "06":
        snapshots.setdefault(mk, {})["d6"] = running
    month_final[mk] = running

def fmt(v):
    return "-" if v is None else f"{v:,.0f}"

print(f"{'Bulan':8} {'Akhir tgl 5':>14} {'Akhir tgl 6':>14} {'Akhir bulan':>14}")
for mk in sorted(snapshots):
    d5 = snapshots[mk].get("d5")
    d6 = snapshots[mk].get("d6")
    end = month_final.get(mk)
    print(f"{mk:8} {fmt(d5):>14} {fmt(d6):>14} {fmt(end):>14}")

# cek klaim: setiap bulan saldo setelah tgl 5 = 250.000?
print("\n=== CEK KLAIM: setelah tgl 5 = 250.000? ===")
for mk in sorted(snapshots):
    d5 = snapshots[mk].get("d5")
    d6 = snapshots[mk].get("d6")
    val = d6 if d6 is not None else d5
    if val is None:
        print(f"  {mk}: tidak ada data")
        continue
    status = "✅ 250.000" if abs(val - 250000) < 1 else "❌ BEDA"
    print(f"  {mk}: saldo setelah tgl 5-6 = {val:,.0f}  {status}")