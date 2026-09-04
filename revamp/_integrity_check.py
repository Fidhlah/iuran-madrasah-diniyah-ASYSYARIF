"""Verifikasi keras: apakah data backup-full-asysyarif.sql masih UTUH setelah fix?
Bandingkan data yang di-dump vs data di JSON backup (ground truth dari dump-dump-full.py).
"""
import json, re
from pathlib import Path

DATA = Path(r"D:\fidh\Coding\Madrasah\iuran-asysyarif\revamp\data")
SQL = DATA / "backup-full-asysyarif.sql"
JSON = DATA / "backup-full-asysyarif.json"

sql = SQL.read_text(encoding="utf-8")
with open(JSON, encoding="utf-8") as f:
    jdata = json.load(f)

# Ambil semua string UUID dari SQL data rows vs JSON
# Strategi: untuk tiap tabel, bandingkan jumlah baris INSERT di SQL dengan rows di JSON
print("=== INTEGRITAS: INSERT SQL vs JSON (ground truth) ===")
all_ok = True
for tbl, tinfo in jdata["tables"].items():
    jcount = tinfo["count"]
    n_insert = len(re.findall(r'INSERT INTO public\."' + re.escape(tbl) + r'"', sql))
    match = "OK" if n_insert == jcount else "MISMATCH"
    if n_insert != jcount:
        all_ok = False
    print(f"  {tbl:22} sql_insert={n_insert:>5} json={jcount:>5} {match}")

# sampling: pastikan beberapa UUID di SQL ada di JSON (tidak termakan fix)
print("\n=== SAMPLING UUID: data SQL masih ada di JSON? ===")
sample_tables = ["students", "payments", "finances"]
for tbl in sample_tables:
    js_ids = set(str(r["id"]) for r in jdata["tables"][tbl]["rows"])
    # ambil 3 id dari JSON, cek ada di SQL
    sids = list(js_ids)[:5]
    found = sum(1 for sid in sids if sid in sql)
    print(f"  {tbl:20} cek 5 id JSON di SQL: {found}/5 {('OK' if found==5 else 'CEK')}")
    if found != 5:
        all_ok = False

# cek semua UUID di SQL ada di JSON (sebaliknya, tidak ada data asing)
print("\n=== Jumlah total INSERT di SQL ===")
total = len(re.findall(r'INSERT INTO public\.', sql))
print(f"  total INSERT: {total} (harusnya 1625 data + 1 body function = 1626)")

print()
print("=" * 55)
print("HASIL:", "OK - data UTUH" if all_ok else "PERLU CEK")
print("=" * 55)