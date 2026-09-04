"""Audit aktual DB sebelum finalisasi plan: cek jumlah komponen yang ada."""
import os, re, sys
from pathlib import Path

try:
    from pg8000.native import Connection
except ImportError:
    print("pg8000 tidak ada"); sys.exit(0)

from pg8000.native import literal

def load_env(p):
    env = {}
    for line in Path(p).read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip().strip("'\"")
    return env

env = load_env(r"D:\fidh\Coding\Madrasah\iuran-asysyarif\.env")
url = env.get("DIRECT_URL") or env.get("DATABASE_URL")
m = re.match(r"postgresql://(.+?):(.+?)@(.+?):(\d+)/(.+?)(\?.*)?$", url)
import urllib.parse
cfg = dict(user=urllib.parse.unquote(m.group(1)), password=urllib.parse.unquote(m.group(2)),
           host=m.group(3), port=int(m.group(4)), database=m.group(5).split("?")[0])
conn = Connection(**cfg)
print("✅ Connected\n")

def count(sql, label):
    try:
        r = conn.run(sql)
        print(f"  {label}: {r[0][0] if r else 0}")
    except Exception as e:
        print(f"  {label}: ERROR {str(e)[:80]}")

count("SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'", "Jumlah tabel public")
count("SELECT count(*) FROM information_schema.tables WHERE table_schema='auth'", "Jumlah tabel auth")
count("SELECT count(DISTINCT cl.relname) FROM pg_class cl JOIN pg_namespace n ON n.oid=cl.relnamespace WHERE n.nspname='public' AND cl.relkind='r'", "tabel public (pg_class)")
count("SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND NOT t.tgisinternal", "Trigger public")
count("SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prokind='f'", "Function public (FUNGSI)")
count("SELECT count(*) FROM pg_indexes WHERE schemaname='public' AND indexname NOT LIKE '%_pkey'", "Index (non-PK) public")
count("SELECT count(*) FROM pg_policies WHERE schemaname='public'", "RLS policies public")
count("SELECT count(*) FROM pg_publication_tables WHERE pubname='supabase_realtime'", "Tabel di realtime publication")
count("SELECT count(*) FROM pg_sequences WHERE schemaname='public'", "Sequence public")

print("\n=== Tabel realtime ===")
try:
    for r in conn.run("SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname='supabase_realtime'"):
        print(f"  {r[0]}.{r[1]}")
except Exception as e:
    print("  err", e)

print("\n=== RLS enabled tables ===")
try:
    for r in conn.run("SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND relrowsecurity=true"):
        print(f"  {r[0]}")
except Exception as e:
    print("  err", e)

print("\n=== Extensions ===")
try:
    for r in conn.run("SELECT extname FROM pg_extension ORDER BY extname"):
        print(f"  {r[0]}")
except Exception as e:
    print("  err", e)

conn.close()