"""Bandingkan 2 cara hitung pengeluaran/pemasukan utk Juni & Juli:
A) CARA EXPORT (mentah): semua type=expense = pengeluaran; semua income = pemasukan
B) CARA LAPORAN (classify): alokasi MDTA di-skip dari pengeluaran, jadi kategori sendiri
"""
import json, re
from pathlib import Path

# data dev SETELAH migration (kondisi saat ini — 5 alokasi sudah dihapus)
DATA = Path(r"D:\fidh\Coding\Madrasah\iuran-asysyarif\revamp\data")
d = json.load(open(DATA / "backup-dev-setelah-migration.json", encoding="utf-8"))
fin = d["tables"]["finances"]["rows"]

def classify(tx):
    desc = (tx.get("description") or "").lower()
    t = tx.get("type")
    if t == "income":
        if "infaq" in desc or "shadaqah" in desc or "donasi" in desc:
            return ("income", "infaq")
        if "membayar iuran" in desc:
            return ("income", "spp")
        if "pendaftaran" in desc:
            return ("income", "daftar")
        return ("income", "lain")
    # expense
    if "diambil dari uang kas mdta" in desc or "diambil dari kas mdta" in desc:
        return ("expense", "mdta_spend")
    if "kas mdta" in desc or "uang suka rela" in desc:
        return ("expense", "alokasi_mdta")   # kalau masih ada
    if "seragam" in desc:
        return ("expense", "seragam")
    if any(w in desc for w in ["guru", "honor", "pembayaran guru"]):
        return ("expense", "gaji")
    if "kas mesjid" in desc or "kas masjid" in desc:
        return ("expense", "mesjid")
    return ("expense", "op")

def month_totals(ym):
    cara = {"mentah": {"income":0,"expense":0}, "laporan": {"income":0,"expense_riil":0,"alokasi":0}}
    breakdown = {"income": {"spp":0,"infaq":0,"daftar":0,"lain":0}, "expense": {"gaji":0,"mesjid":0,"op":0,"seragam":0,"mdta_spend":0}}
    for tx in fin:
        if (tx.get("date") or "")[:7] != ym:
            continue
        cat, sub = classify(tx)
        amt = float(tx["amount"])
        if cat == "income":
            cara["mentah"]["income"] += amt
            cara["laporan"]["income"] += amt
            breakdown["income"][sub] += amt
        else:
            cara["mentah"]["expense"] += amt
            if sub == "alokasi_mdta":
                cara["laporan"]["alokasi"] += amt
            else:
                cara["laporan"]["expense_riil"] += amt
                breakdown["expense"][sub] += amt
    return cara, breakdown

for ym in ["2026-06", "2026-07"]:
    cara, bd = month_totals(ym)
    print(f"\n{'='*60}\n{ym}\n{'='*60}")
    print("PEMASUKAN:")
    for k, v in bd["income"].items():
        print(f"  {k:12} {v:>12,.0f}")
    print(f"  {'TOTAL (sama)':12} {cara['mentah']['income']:>12,.0f}")
    print("PENGELUARAN:")
    print(f"  [CARA EXPORT] semua expense     = {cara['mentah']['expense']:>12,.0f}")
    for k, v in bd["expense"].items():
        print(f"    - {k:12} {v:>12,.0f}")
    print(f"  [CARA LAPORAN] riil (skip alokasi) = {cara['laporan']['expense_riil']:>12,.0f}  (+ alokasi MDTA {cara['laporan']['alokasi']:>10,.0f})")