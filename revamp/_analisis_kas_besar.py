"""Analisis: saldo kas besar berjalan per bulan, cek klaim 'setelah tanggal 5 selalu bersisa 250k'."""
import json, re
from pathlib import Path
from collections import defaultdict

DATA = Path(r"D:\fidh\Coding\Madrasah\iuran-asysyarif\revamp\data")
with open(DATA / "backup-full-asysyarif.json", encoding="utf-8") as f:
    jdata = json.load(f)

finances = jdata["tables"]["finances"]["rows"]
print(f"Total transaksi finances: {len(finances)}\n")

# ── klasifikasi sama dengan generate-laporan-full.py ──
def classify(tx):
    desc = (tx.get("description") or "").lower()
    t = tx.get("type")
    result = {"type": t, "amount": float(tx.get("amount") or 0), "fund": None, "is_transfer": False}
    # income → kas besar
    if t == "income":
        result["fund"] = "kas_besar"
        return result
    # expense
    if "diambil dari uang kas mdta" in desc or "diambil dari kas mdta" in desc:
        result["fund"] = "kas_mdta"          # belanja dari MDTA → spending
        return result
    if "kas mdta" in desc:
        result["fund"] = "kas_mdta"
        result["is_transfer"] = True          # alokasi → transfer
        return result
    if "uang suka rela potongan tabungan masuk ke kas mdta" in desc:
        result["fund"] = "kas_mdta"
        result["is_transfer"] = True
        return result
    if "seragam" in desc:
        result["fund"] = "kas_mdta"
        return result
    result["fund"] = "kas_besar"
    return result

# ── per bulan: saldo kas besar berjalan ──
monthly = defaultdict(lambda: {"income": 0.0, "out_real": 0.0, "transfer_out": 0.0, "events": []})
for tx in finances:
    d = tx.get("date") or ""
    m = re.match(r"(\d{4}-\d{2})", d)
    if not m:
        continue
    key = m.group(1)
    r = classify(tx)
    if r["fund"] != "kas_besar":
        continue
    day = d[8:10]
    if r["type"] == "income":
        monthly[key]["income"] += r["amount"]
        monthly[key]["events"].append((day, f"+{r['amount']:,.0f} {tx.get('description','')[:40]}"))
    else:
        if r["is_transfer"]:
            monthly[key]["transfer_out"] += r["amount"]
            monthly[key]["events"].append((day, f"TRF {r['amount']:,.0f} {tx.get('description','')[:40]}"))
        else:
            monthly[key]["out_real"] += r["amount"]
            monthly[key]["events"].append((day, f"-{r['amount']:,.0f} {tx.get('description','')[:40]}"))

# urut bulan
months = sorted(monthly.keys())
print("=== PER BULAN — Kas Besar ===")
print(f"{'Bulan':8} {'Masuk':>12} {'Keluar Riil':>12} {'Transfer':>10} {'Saldo':>12}")
for k in months:
    d = monthly[k]
    saldo = d["income"] - d["out_real"]
    print(f"{k:8} {d['income']:>12,.0f} {d['out_real']:>12,.0f} {d['transfer_out']:>10,.0f} {saldo:>12,.0f}")

# ── simulasi saldo berjalan + posisi setelah tanggal 5 ──
print("\n=== SIMULASI: saldo kas besar setelah tgl 5 tiap bulan (dari awal) ===")
running = 0.0
print(f"{'Bulan':8} {'Saldo awal':>12} {'Saldo sblm 5':>12} {'Transaksi 5-6':>14} {'Saldo stlh 5':>12}")
for k in months:
    start = running
    before5 = running
    # urutkan event by day
    ev = sorted(monthly[k]["events"])
    day5_tx = []
    after5 = None
    for day, label in ev:
        if day <= "05":
            before5 += parse_amt(label)
        else:
            day5_tx.append((day, label))
    # hitung saldo setelah tgl 5 = total bulanan utk hari > 5
    after5_inc = sum(a for d_, a in ev if d_ > "05")
    # untuk saldo setelah 5: mulai dari 0 bulan ini? tidak — running kontinu
    running = start + d["income"] - d["out_real"]
    # cari nilai saldo persis setelah transaksi tanggal 5/6
    # ambil snapshot di hari terakhir <= 6
    snap = start
    for day, label in ev:
        snap += parse_amt(label)
        if day <= "06":
            pass
        else:
            break
    print(f"{k:8} {start:>12,.0f} {before5:>12,.0f} {str(len(day5_tx))+' tx':>14} {snap:>12,.0f}")

print("\nNOTE: angka = ribuan rupiah, transfer tidak mengurangi saldo kas besar (cuma pindah amplop)")