"""Selidiki 8 baris finances yang beda — apakah data BARU di project lama."""
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
old = Connection(**parse(load_env(ROOT/".env.bak")["DATABASE_URL"]))
new = Connection(**parse(load_env(ROOT/".env")["DATABASE_URL"]))

def dump(c, label):
    print(f"\n=== finances di {label} (semua {sum(1 for r in c.run('SELECT 1 FROM public.finances'))}) ===")
    rows = c.run('SELECT id, date, type, amount, description, created_at FROM public."finances" ORDER BY date, id')
    for r in rows:
        print(f"  date={r[1]} | {r[2]:8} | {r[3]:>10} | {str(r[4])[:45]} | created={str(r[5])[:19]}")

dump(old, "LAMA (.env.bak)")
dump(new, "BARU (.env)")
old.close(); new.close()