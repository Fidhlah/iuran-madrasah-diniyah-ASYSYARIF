"""Eksekusi Step 1: ALTER TABLE finances ADD COLUMN category + index (dev)."""
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

# cek dulu apakah kolom sudah ada
has = conn.run("SELECT count(*) FROM information_schema.columns WHERE table_name='finances' AND column_name='category'")[0][0]
if has:
    print("Kolom category SUDAH ada — skip ALTER.")
else:
    conn.run('ALTER TABLE public."finances" ADD COLUMN category text')
    print("Kolom category DITAMBAHKAN")

# index
conn.run('CREATE INDEX IF NOT EXISTS idx_finances_category ON public."finances" (category)')
print("Index idx_finances_category dibuat/sudah ada")

# verifikasi
has = conn.run("SELECT count(*) FROM information_schema.columns WHERE table_name='finances' AND column_name='category'")[0][0]
nul = conn.run("SELECT count(*) FROM public.\"finances\" WHERE category IS NULL")[0][0]
print(f"\nVerifikasi: kolom ada={has}, total row finances category=NULL={nul}")
conn.close()