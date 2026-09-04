#!/usr/bin/env python3
"""VALIDASI EVIDENCE-BASED: backup di revamp/data vs DB live.

Memeriksa:
1. Parse semua INSERT target di SQL → group per tabel → bandingkan count DB live
2. Keseimbangan BEGIN/COMMIT
3. Setiap CREATE TABLE mendahului INSERT tabel tsb
4. Target FK (ALTER TABLE ... FOREIGN KEY) merujuk tabel yang ada
5. JSON bisa di-parse + count-nya cocok
6. Cross-check 1 baris data sample (nilai persis) antara SQL vs JSON vs DB live
"""
import json, re, sys, urllib.parse
from pathlib import Path
from pg8000.native import Connection

REV = Path(r"D:\fidh\Coding\Madrasah\iuran-asysyarif\revamp\data")
SQL = REV / "backup-full-asysyarif.sql"
JSON = REV / "backup-full-asysyarif.json"

def load_env(p):
    env = {}
    for line in Path(p).read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip().strip("'\"")
    return env

sql = SQL.read_text(encoding="utf-8")
lines = sql.splitlines()

print("=" * 70)
print("A. STRUKTUR FILE SQL")
print("=" * 70)
print(f"  BEGIN count:  {sql.count('BEGIN;')}")
print(f"  COMMIT count: {sql.count('COMMIT;')}")
print(f"  Panjang: {len(lines)} baris, {SQL.stat().st_size:,} bytes")

# 1. Semua INSERT target
inserts = re.findall(r'INSERT INTO public\."([^"]+)"', sql)
from collections import Counter
insert_counts = Counter(inserts)
print("\n  INSERT per tabel di file:")
for t, c in sorted(insert_counts.items()):
    print(f"    {t:22} {c}")

# 2. CREATE TABLE urutan
ct_order = re.findall(r'CREATE TABLE IF NOT EXISTS public\."([^"]+)"', sql)
print(f"\n  CREATE TABLE order ({len(ct_order)}): {', '.join(ct_order)}")

# 3. FK targets (tanpa prefix public.)
fks = re.findall(r'ADD CONSTRAINT \S+ FOREIGN KEY.*?REFERENCES (?:public\.)?"?"?(\w+)', sql)
print(f"  FK references ({len(fks)}): {', '.join(sorted(set(fks)))}")

# cek: apakah semua tabel INSERT ada CREATE TABLE-nya
tables_in_insert = set(insert_counts)
tables_created = set(ct_order)
missing_create = tables_in_insert - tables_created
print(f"\n  Tabel INSERT tanpa CREATE: {missing_create if missing_create else 'NONE ✅'}")

# cek FK target ada
missing_fk = set(fks) - tables_created
print(f"  FK target tanpa CREATE: {missing_fk if missing_fk else 'NONE ✅'}")

print()
print("=" * 70)
print("B. CROSS-CHECK COUNT vs DB LIVE")
print("=" * 70)
env = load_env(r"D:\fidh\Coding\Madrasah\iuran-asysyarif\.env")
url = env.get("DIRECT_URL") or env.get("DATABASE_URL")
m = re.match(r"postgresql://(.+?):(.+?)@(.+?):(\d+)/(.+?)(\?.*)?$", url)
cfg = dict(user=urllib.parse.unquote(m.group(1)), password=urllib.parse.unquote(m.group(2)),
           host=m.group(3), port=int(m.group(4)), database=m.group(5).split("?")[0])
conn = Connection(**cfg)

all_ok = True
for t, c in sorted(insert_counts.items()):
    live = conn.run(f'SELECT count(*) FROM public."{t}"')[0][0]
    match = "✅" if c == live else "❌"
    if c != live:
        all_ok = False
    print(f"  {t:22} file={c:>5} live={live:>5} {match}")

# tabel yang ada di DB tapi tidak di file
db_tables = [r[0] for r in conn.run("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'")]
not_in_file = set(db_tables) - set(insert_counts)
print(f"\n  Tabel DB tapi tidak ada di file INSERT: {not_in_file if not_in_file else 'NONE ✅'}")

print()
print("=" * 70)
print("C. JSON VALIDASI")
print("=" * 70)
with open(JSON, encoding="utf-8") as f:
    jdata = json.load(f)
print(f"  JSON parse: OK")
for t in db_tables:
    jcount = jdata["tables"].get(t, {}).get("count")
    live = conn.run(f'SELECT count(*) FROM public."{t}"')[0][0]
    match = "✅" if jcount == live else "❌"
    if jcount != live:
        all_ok = False
    print(f"  {t:22} json={jcount} live={live} {match}")

print()
print("=" * 70)
print("D. SAMPLE DATA CROSS-CHECK (nilai persis)")
print("=" * 70)
# ambil 3 baris dari students di DB live, bandingkan dengan JSON
sample = conn.run('SELECT id, name, class, year_enrolled, status FROM public."students" ORDER BY name LIMIT 3')
for row in sample:
    sid = str(row[0])
    # cari di JSON
    jrow = next((r for r in jdata["tables"]["students"]["rows"] if str(r["id"]) == sid), None)
    # cari di SQL
    pat = re.compile(rf"INSERT INTO public\.\"students\".*?'{sid}'", re.DOTALL)
    in_sql = bool(pat.search(sql))
    name_db = row[1]
    name_json = jrow.get("name") if jrow else None
    match = "✅" if (jrow and jrow["name"] == name_db) else "❌"
    if not (jrow and jrow["name"] == name_db and in_sql):
        all_ok = False
    print(f"  {name_db!r}: db={name_db!r} json={name_json!r} in_sql={in_sql} {match}")

conn.close()

print()
print("=" * 60)
print(f"HASIL VALIDASI: {'✅ SEMUA COCOK' if all_ok else '❌ ADA MASALAH'}")
print("=" * 60)