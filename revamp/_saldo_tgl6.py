"""Saldo kas MDTA & kas besar kumulatif di akhir tanggal 6 tiap bulan."""
import json, re
from pathlib import Path
from collections import defaultdict

DATA = Path(r"D:\fidh\Coding\Madrasah\iuran-asysyarif\revamp\data")
with open(DATA / "backup-full-asysyarif.json", encoding="utf-8") as f:
    jdata = json.load(f)
finances = jdata["tables"]["finances"]["rows"]

# klasifikasi
def classify(tx):
    desc = (tx.get("description") or "").lower()
    t = tx.get("type")
    amt = float(tx.get("amount") or 0)
    if t == "income":
        return ("kas_besar", amt, desc)   # income masuk kas besar
    if "diambil dari uang kas mdta" in desc or "diambil dari kas mdta" in desc:
        return ("mdta_spend", amt, desc)   # belanja dari MDTA
    if "kas mdta" in desc or "uang suka rela potongan tabungan" in desc:
        return ("mdta_in", amt, desc)      # alokasi ke MDTA
    if "seragam" in desc:
        return ("md_spend", amt, desc)
    # expense riil kas besar
    return ("kb_out", amt, desc)

# events with (date, type, amt)
events = []
for tx in finances:
    d = tx.get("date") or ""
    m = re.match(r"(\d{4}-\d{2})", d)
    if not m: continue
    kind, amt, desc = classify(tx)
    events.append((d[:10], kind, amt, desc))
events.sort()
print(f"events: {len(events)}\n")

# simulasi kumulatif
kb = 0.0   # kas besar balance
md = 0.0   # kas md balance (alokasi masuk - belanja)
snap = defaultdict(dict)  # month -> {kb6, md6}

for day, kind, amt, desc in events:
    if kind == "kas_besar": kb += amt
    elif kind == "mb_best": kb -= amt
    elif kind == "mdta_in": md += amt
    elif kind in ("md_spend"): md -= amt
    elif kind == "md_spend": md -= amt
    # snapshot akhir hari 6
    dd = day[8:10]
    mk = day[:7]
    if dd == "06":
        snap[mk] = {"kb": kb, "md": md}

print(f"{'Bulan':8} {'Kas Besar':>12} {'Kas MDTA':>12} {'Total':>12}")
print("-" * 48)
for mk in sorted(snap):
    kb = snap[mk]["kb"]; md = snap[mk]["md"]
    print(f"{mk:8} {kb:>12,.0f} {md:>12,.0f} {kb+md:>12,.0f}")