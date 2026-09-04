"""Identifikasi row 'Kas MDTA' yang tercatat sebagai expense di project baru (read-only)."""
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
print("Connected (project baru)\n")

# Semua expense yang deskripsinya mengandung 'mdta'
rows = conn.run("""SELECT id, date, type, amount, description FROM public."finances"
    WHERE type='expense' AND (description ILIKE '%mdta%' OR description ILIKE '%kas mdta%' OR description ILIKE '%diambil dari%')
    ORDER BY date""")

print(f"Expense yang menyebut mdta/diambil: {len(rows)}\n")
total = 0.0
for r in rows:
    total += float(r[3])
    print(f"  {r[1]}  {float(r[3]):>10,.0f}  {str(r[4])[:70]}")
print(f"\nTotal: {total:,.0f}")

conn.close()