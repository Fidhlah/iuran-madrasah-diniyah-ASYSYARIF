"""Bandingkan total uang SEBELUM vs SESUDAH migration (dari backup JSON).
Harusnya perubahan hanya dari 2 migration; total income & expense konsisten."""
import json, re
from pathlib import Path

DATA = Path(r"D:/fidh/Coding/Madrasah/iuran-asysyarif/revamp/data")

def totals(path):
    d = json.load(open(path, encoding="utf-8"))
    fin = d["tables"]["finances"]["rows"]
    inc = sum(float(r["amount"]) for r in fin if r["type"]=="income")
    exp = sum(float(r["amount"]) for r in fin if r["type"]=="expense")
    return len(fin), inc, exp, inc-exp

# SEBELUM migration = backup-project-baru-baseline.json
before = totals(DATA/"backup-project-baru-baseline.json")
# SESUDAH = backup-dev-setelah-migration.json
after = totals(DATA/"backup-dev-setelah-migration.json")

print(f"{'':18} {'rows':>6} {'Income':>12} {'Expense':>12} {'Beda':>12}")
print(f"{'SEBELUM':18} {before[0]:>6} {before[1]:>12,.0f} {before[2]:>12,.0f} {before[3]:>12,.0f}")
print(f"{'SESUDAH':18} {after[0]:>6} {after[1]:>12,.0f} {after[2]:>12,.0f} {after[3]:>12,.0f}")

# Perbedaan yang diharapkan:
# Migration 001: hapus 5 expense alokasi MDTA -> expense turun 2.750.000, income tetap
# Migration 002: pecah income pendaftaran -> income tetap (900k), expense tetap
expected_exp_drop = 400000+300000+700000+600000+750000
print(f"\nEkspektasi: expense harus turun {expected_exp_drop:,.0f} (hapus 5 alokasi MDTA)")
print(f"  Expense turun      : {before[2]-after[2]:,.0f}")
print(f"  Income berubah     : {after[1]-before[1]:,.0f} (harus 0)")
print(f"  Beda kas berubah   : {after[3]-before[3]:,.0f} (harus +{expected_exp_drop:,.0f})")
ok = abs((before[2]-after[2]) - expected_exp_drop) < 1 and abs(after[1]-before[1]) < 1
print(f"\n{'✅ SESUAI' if ok else '⚠️ TIDAK SESUAI'}")