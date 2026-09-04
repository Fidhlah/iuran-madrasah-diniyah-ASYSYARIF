"""Verifikasi mendalam project baru vs backup target: count + komponen + realtime + RLS."""
import re, urllib.parse
from pathlib import Path
from pg8000.native import Connection

def load_env(p):
    env = {}
    for line in Path(p).read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip().strip("'\"")
    return env

env = load_env(r"D:\fidh\Coding\Madrasah\iuran-asysyarif\.env-new")
url = env.get("DATABASE_URL")
m = re.match(r"postgresql://([^:/]+):([^@]+)@([^:/]+):(\d+)/([^?]+)(\?.*)?$", url)
cfg = dict(user=urllib.parse.unquote(m.group(1)), password=urllib.parse.unquote(m.group(2)),
           host=m.group(3), port=int(m.group(4)), database=m.group(5).split("?")[0])
conn = Connection(user=cfg["user"], password=cfg["password"], host=cfg["host"],
                  port=cfg["port"], database=cfg["database"])
print("Connected (project baru)\n")

def count(sql, label):
    try:
        r = conn.run(sql)
        print(f"  {label:28} {r[0][0] if r else 0}")
    except Exception as e:
        print(f"  {label:28} ERROR {str(e)[:80]}")

print("=== KOMPONEN project baru ===")
count("SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'", "tabel public")
count("SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prokind='f'", "function public")
count("SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND NOT t.tgisinternal", "trigger public")
count("SELECT count(*) FROM pg_indexes WHERE schemaname='public' AND indexname NOT LIKE '%_pkey'", "index non-PK")
count("SELECT count(*) FROM pg_policies WHERE schemaname='public'", "RLS policies")
count("SELECT count(*) FROM pg_publication_tables WHERE pubname='supabase_realtime'", "tabel realtime")
count("SELECT count(*) FROM pg_extension", "extensions")

print("\n=== DATA (count per tabel) ===")
for t in ["students","payments","finances","activity_logs","settings","profiles","tabungan","tabungan_transaksi"]:
    try:
        n = conn.run(f'SELECT count(*) FROM public."{t}"')[0][0]
        print(f"  {t:20} {n}")
    except Exception as e:
        print(f"  {t:20} ERROR {str(e)[:60]}")

print("\n=== REALTIME: tabel mana yang di-subscribe ===")
try:
    for r in conn.run("SELECT tablename FROM pg_publication_tables WHERE pubname='supabase_realtime' ORDER BY tablename"):
        print(f"  - {r[0]}")
except Exception as e:
    print("  err", e)

conn.close()