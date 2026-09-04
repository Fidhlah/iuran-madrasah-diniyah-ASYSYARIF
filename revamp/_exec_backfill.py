"""Eksekusi backfill kategori — statement demi statement (robust)."""
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
print("Connected (dev)")

def run(sql, label):
    try:
        conn.run(sql)
        print(f"  OK {label}")
    except Exception as e:
        print(f"  ERR {label}: {e}")

run("""UPDATE public."finances" SET category='honor_guru'
WHERE type='expense' AND category IS NULL
 AND (description ILIKE '%guru%' OR description ILIKE '%honor%' OR description ILIKE '%pembayaran guru%')""", "honor_guru")

run("""UPDATE public."finances" SET category='kas_mesjid'
WHERE type='expense' AND category IS NULL
  AND (description ILIKE '%kas masjid%' OR description ILIKE '%kas mesjid%')""", "kas_mesjid")

run("""UPDATE public."finances" SET category='operasional'
WHERE type='expense' AND category IS NULL
  AND (description ILIKE '%beli%' OR description ILIKE '%spidol%' OR description ILIKE '%pulpen%'
       OR description ILIKE '%buku%' OR description ILIKE '%fotokopi%' OR description ILIKE '%foto copy%'
       OR description ILIKE '%print%' OR description ILIKE '%copy%' OR description ILIKE '%brosur%'
       OR description ILIKE '%amplop%' OR description ILIKE '%formulir%')""", "operasional")

run("UPDATE public.\"finances\" SET category='lainnya' WHERE type='expense' AND category IS NULL", "lainnya")

# verifikasi
rows = conn.run('SELECT category, count(*) FROM public."finances" GROUP BY category ORDER BY category')
print("\n=== Sebaran category ===")
for r in rows:
    print(f"  {r[0]!r}: {r[1]}")
conn.close()