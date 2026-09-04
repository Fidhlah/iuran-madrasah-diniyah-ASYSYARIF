"""Detail fungsi & trigger — buat isi plan yang akurat."""
import os, re, sys
from pathlib import Path
import urllib.parse
from pg8000.native import Connection

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
cfg = dict(user=urllib.parse.unquote(m.group(1)), password=urllib.parse.unquote(m.group(2)),
           host=m.group(3), port=int(m.group(4)), database=m.group(5).split("?")[0])
conn = Connection(**cfg)

print("=== FUNGSI public ===")
for r in conn.run("SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prokind='f' ORDER BY p.proname"):
    print(f"  - {r[0]}")

print("\n=== TRIGGER public ===")
for r in conn.run("""SELECT tgname, c.relname FROM pg_trigger t
  JOIN pg_class c ON c.oid=t.tgrelid
  JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND NOT t.tgisinternal ORDER BY tgname"""):
    print(f"  - {r[0]}  (on {r[1]})")

print("\n=== RLS policies per tabel ===")
for r in conn.run("SELECT tablename, policyname FROM pg_policies WHERE schemaname='public' ORDER BY tablename"):
    print(f"  - {r[0]}: {r[1]}")

conn.close()