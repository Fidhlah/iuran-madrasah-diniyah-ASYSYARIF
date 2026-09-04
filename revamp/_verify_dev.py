"""Verifikasi project dev setelah migration 001 & 002: struktur, count, total uang."""
import re, urllib.parse, json
from pathlib import Path
from decimal import Decimal
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
print("Connected (project dev)\n")

# 1. count per tabel
print("=== COUNT per tabel ===")
for t in ["students","payments","finances","activity_logs","settings","profiles","tabungan","tabungan_transaksi"]:
    n = conn.run(f'SELECT count(*) FROM public."{t}"')[0][0]
    print(f"  {t:20} {n}")
nfin = conn.run('SELECT count(*) FROM public."finances"')[0][0]

# 2. sisa 'kas mdta' yang masih expense alokasi (harusnya cuma 3 belanja riil)
print("\n=== Sisa row 'kas mdta' (harusnya hanya 3 belanja riil) ===")
rows = conn.run("""SELECT id, date, type, amount, description FROM public."finances"
    WHERE description ILIKE '%kas mdta%' OR description ILIKE '%diambil dari%' OR description ILIKE '%brosur mdta%'
    ORDER BY date""")
for r in rows:
    print(f"  {r[1]} {r[2]:8} {float(r[3]):>10,.0f}  {str(r[4])[:60]}")

# 3. row 'uang pendaftaran' (harusnya 12 single, 0 multi)
print("\n=== Row 'uang pendaftaran' ===")
rows = conn.run("""SELECT date, type, amount, description FROM public."finances"
    WHERE description ILIKE '%pendaftaran%' AND type='income' ORDER BY date""")
tot_pendaftaran = 0.0
multi_count = 0
for r in rows:
    amt = float(r[2]); tot_pendaftaran += amt
    desc = r[3] or ""
    is_multi = "\n1." in desc or "\r\n1." in desc
    if is_multi: multi_count += 1
    print(f"  {r[0]}  {amt:>10,.0f}  {desc[:60]}  {'[MULTI!]' if is_multi else ''}")
print(f"  Total pendaftaran: {tot_pendaftaran:,.0f} | row MULTI-murid tersisa: {multi_count}")

# 4. seleksi: apakah sisa kas MDTA yang dihapus sudah tidak ada (cek by id)
deleted_5 = ['03273584-719e-4c6e-9890-8b6f2dde114c','ee016c13-e6c4-43d3-bc4b-3bc02a542f55',
             '4931941b-4312-4e1f-bc53-2138a9d8d374','b5bbc488-68c3-48f5-98aa-bc081b760718','f8cdda39-8681-4442-9223-1890244a3763']
print("\n=== Cek 5 id alokasi MDTA (harusnya 0 ada) ===")
for rid in deleted_5:
    x = conn.run(f"SELECT count(*) FROM public.\"finances\" WHERE id='{rid}'")[0][0]
    print(f"  {rid[:8]}...  {x} {'✅ dihapus' if x==0 else '⚠️ MASIH ADA'}")

conn.close()