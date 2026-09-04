"""Cek jumlah baris di project BARU yang description-nya punya \r\r\n."""
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

def parse(u):
    m = re.match(r"postgresql://([^:/]+):([^@]+)@([^:/]+):(\d+)/([^?]+)(\?.*)?$", u)
    return dict(user=urllib.parse.unquote(m.group(1)), password=urllib.parse.unquote(m.group(2)),
                host=m.group(3), port=int(m.group(4)), database=m.group(5).split("?")[0])

ROOT = Path(r"D:\fidh\Coding\Madrasah\iuran-asysyarif")
conn = Connection(**parse(load_env(ROOT/".env")["DATABASE_URL"]))

n = conn.run("SELECT count(*) FROM public.finances WHERE description LIKE E'%\\r\\r\\n%'")[0][0]
print(f"Baris dengan \\r\\r\\n di description (project BARU): {n}")
n2 = conn.run("SELECT count(*) FROM public.finances WHERE description LIKE E'%\\r\\n%'")[0][0]
print(f"Baris dengan \\r\\n (project BARU): {n2}")

# cek juga di tabel lain
for t in ["students","payments","activity_logs","settings"]:
    try:
        k = conn.run(f"SELECT count(*) FROM public.\"{t}\" WHERE description::text LIKE E'%\\r\\r\\n%' OR name::text LIKE E'%\\r\\r\\n%' OR notes::text LIKE E'%\\r\\r\\n%'")[0][0]
        print(f"{t}: {k} baris \\r\\r\\n")
    except Exception as e:
        # coba kolom text umum
        try:
            k = conn.run(f"SELECT count(*) FROM public.\"{t}\" WHERE description::text LIKE E'%\\r\\r\\n%'")[0][0]
            print(f"{t}: {k} baris \\r\\r\\n (description only)")
        except:
            print(f"{t}: (skip)")

conn.close()