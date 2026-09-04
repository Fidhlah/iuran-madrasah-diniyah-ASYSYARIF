#!/usr/bin/env python3
"""Fase 1 verifikasi: cek backup-full-asysyarif.sql benar/lengkap.

Bandingkan isi file dump dengan DB live + hitung komponen. Baca-only.
"""
import os, re, sys
from pathlib import Path
import urllib.parse
from pg8000.native import Connection

PROJECT_ROOT = Path(r"D:\fidh\Coding\Madrasah\iuran-asysyarif")
REV = PROJECT_ROOT / "revamp"
SQL = REV / "backup-full-asysyarif.sql"

def load_env(p):
    env = {}
    for line in Path(p).read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip().strip("'\"")
    return env

# ── hitung isi file SQL ──
sql = SQL.read_text(encoding="utf-8")

stat = {
    "CREATE TABLE": len(re.findall(r"CREATE TABLE IF NOT EXISTS", sql)),
    "INSERT INTO": len(re.findall(r"INSERT INTO public\.", sql)),
    "FOREIGN KEY (ALTER)": len(re.findall(r"ALTER TABLE ONLY public\.\S+ ADD CONSTRAINT \S+ FOREIGN KEY", sql)),
    "CREATE INDEX": len(re.findall(r"CREATE (?:UNIQUE )?INDEX", sql)),
    "CREATE FUNCTION/OR REPLACE": len(re.findall(r"CREATE OR REPLACE FUNCTION", sql)),
    "CREATE TRIGGER": len(re.findall(r"CREATE TRIGGER", sql)),
    "ENABLE ROW LEVEL SECURITY": len(re.findall(r"ENABLE ROW LEVEL SECURITY", sql)),
    "CREATE POLICY": len(re.findall(r"CREATE POLICY", sql)),
    "ALTER PUBLICATION": len(re.findall(r"ALTER PUBLICATION", sql)),
    "CREATE EXTENSION": len(re.findall(r"CREATE EXTENSION IF NOT EXISTS", sql)),
}

print("=== ISI FILE backup-full-asysyarif.sql ===")
for k, v in stat.items():
    print(f"  {k:35} {v}")

# ── bandingkan dengan DB live ──
print("\n=== BANDING dengan DB LIVE ===")
env = load_env(PROJECT_ROOT / ".env")
url = env.get("DIRECT_URL") or env.get("DATABASE_URL")
m = re.match(r"postgresql://(.+?):(.+?)@(.+?):(\d+)/(.+?)(\?.*)?$", url)
cfg = dict(user=urllib.parse.unquote(m.group(1)), password=urllib.parse.unquote(m.group(2)),
           host=m.group(3), port=int(m.group(4)), database=m.group(5).split("?")[0])
conn = Connection(**cfg)

checks = {
    "CREATE TABLE": conn.run("SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'")[0][0],
}
funcs = conn.run("SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prokind='f'")[0][0]
trigs = conn.run("SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND NOT t.tgisinternal")[0][0]
idx = conn.run("SELECT count(*) FROM pg_indexes WHERE schemaname='public' AND indexname NOT LIKE '%_pkey'")[0][0]
pol = conn.run("SELECT count(*) FROM pg_policies WHERE schemaname='public'")[0][0]
rt = conn.run("SELECT count(*) FROM pg_publication_tables WHERE pubname='supabase_realtime'")[0][0]

compare = [
    ("CREATE TABLE (8)", stat["CREATE TABLE"], "8" ),
    ("Function (4)", stat["CREATE FUNCTION/OR REPLACE"], str(funcs)),
    ("Trigger (4)", stat["CREATE TRIGGER"], str(trigs)),
    ("Index non-PK (21)", stat["CREATE INDEX"], str(idx)),
    ("Policy RLS (12)", stat["CREATE POLICY"], str(pol)),
    ("Realtime (6)", stat["ALTER PUBLICATION"], str(rt)),
]

ok_all = True
for label, dumpval, liveval in compare:
    match = "✅" if str(dumpval) == str(liveval) else "❌"
    if str(dumpval) != str(liveval):
        ok_all = False
    print(f"  {label:25} dump={dumpval} live={liveval} {match}")

# data count per tabel (dump vs live)
print("\n=== Jumlah INSERT per tabel (dump) vs COUNT (live) ===")
tables = ["activity_logs", "finances", "payments", "profiles", "settings", "students", "tabungan", "tabungan_transaksi"]
all_rows_ok = True
for t in tables:
    n_dump = len(re.findall(rf"INSERT INTO public\.\"{re.escape(t)}\"", sql))
    n_live = conn.run(f"SELECT count(*) FROM public.\"{t}\"")[0][0]
    match = "✅" if n_dump == n_live else "❌"
    if n_dump != n_live:
        all_rows_ok = False
    print(f"  {t:20} dump={n_dump:>5} live={n_live:>5} {match}")

conn.close()

print()
print("=" * 50)
print("HASIL VERIFIKASI:", "✅ LENGKAP & COCOK" if ok_all and all_rows_ok else "❌ ADA YANG TIDAK COCOK")
print("=" * 50)