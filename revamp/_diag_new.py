"""Diagnosa state project baru setelah run SQL editor (partial)."""
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
print("Connected\n")

print("=== Tabel yang ADA di project baru sekarang ===")
for r in conn.run("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name"):
    print("  -", r[0])

print("\n=== Jumlah baris per tabel (kalau ada) ===")
for t in ["students","payments","finances","activity_logs","settings","profiles","tabungan","tabungan_transaksi"]:
    try:
        n = conn.run(f'SELECT count(*) FROM public."{t}"')[0][0]
        print(f"  {t:20} {n}")
    except Exception as e:
        print(f"  {t:20} ERROR: {str(e)[:60]}")

print("\n=== FK constraints yang ADA ===")
for r in conn.run("""SELECT con.conname, con.conrelid::regclass::text FROM pg_constraint con
    JOIN pg_namespace n ON n.oid=con.connamespace
    WHERE n.nspname='public' AND con.contype='f' ORDER BY con.conname"""):
    print("  -", r[0], "on", r[1])

conn.close()