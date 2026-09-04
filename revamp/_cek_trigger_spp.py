"""Cek trigger sync_payment_to_finances di DB dev: apakah sudah set category='spp'?"""
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

env = load_env(r"D:\fidh\Coding\Madrasah\iuran-asysyarif\.env")
url = env.get("DATABASE_URL")
m = re.match(r"postgresql://([^:/]+):([^@]+)@([^:/]+):(\d+)/([^?]+)(\?.*)?$", url)
cfg = dict(user=urllib.parse.unquote(m.group(1)), password=urllib.parse.unquote(m.group(2)),
           host=m.group(3), port=int(m.group(4)), database=m.group(5).split("?")[0])
conn = Connection(user=cfg["user"], password=cfg["password"], host=cfg["host"],
                  port=cfg["port"], database=cfg["database"])
print("Connected (dev)\n")

# 1. Apakah kolom category sudah ada?
try:
    has = conn.run("SELECT count(*) FROM information_schema.columns WHERE table_name='finances' AND column_name='category'")[0][0]
    print(f"Kolom 'category' di finances: {'ADA' if has else 'BELUM ADA'}")
except Exception as e:
    print("cek kolom error", e)

# 2. Isi function trigger sync_payment_to_finances
print("\n=== Function sync_payment_to_finances (isi SQL di dev) ===")
rows = conn.run("""SELECT pg_get_functiondef(p.oid) FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE p.proname='sync_payment_to_finances' AND n.nspname='public'""")
if rows:
    print(rows[0][0])
else:
    print("(function tidak ditemukan)")

# 3. Data income SPP terkini: apakah category terisi?
print("\n=== Sample income dari payment (cek category) ===")
try:
    rows = conn.run("""SELECT category, count(*) FROM public."finances"
        WHERE type='income' AND payment_id IS NOT NULL GROUP BY category""")
    for r in rows:
        print(f"  category={r[0]!r} count={r[1]}")
except Exception as e:
    print("err:", e)

conn.close()