"""Diff finances LAMA vs BARU per-id — cari baris beda presisi."""
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

# ambil id + semua kolom, key by id
def all_rows(c):
    rows = c.run('SELECT * FROM public."finances" ORDER BY id')
    cols = [d[0] for d in c.run("""SELECT column_name FROM information_schema.columns
        WHERE table_schema='public' AND table_name='finances' ORDER BY ordinal_position""")]
    d = {}
    for r in rows:
        d[str(r[0])] = dict(zip(cols, r))
    return d

old_rows = all_rows(old)
new_rows = all_rows(new)
old.close(); new.close()

old_ids = set(old_rows); new_ids = set(new_rows)
only_old = old_ids - new_ids
only_new = new_ids - old_ids
common = old_ids & new_ids
changed = [i for i in common if old_rows[i] != new_rows[i]]

print(f"finances: total LAMA={len(old_ids)}, BARU={len(new_ids)}")
print(f"  id hanya di LAMA : {len(only_old)}")
print(f"  id hanya di BARU : {len(only_new)}")
print(f"  id sama TAPI isi beda: {len(changed)}")

def conv(v):
    if hasattr(v,'isoformat'): return v.isoformat()
    if isinstance(v,bytes): return v.hex()
    return v

def show(tag, r):
    # kolom penting saja
    keys = ['id','date','type','amount','description','payment_id','created_at','updated_at']
    for k in keys:
        if k in r:
            v = conv(r[k])
            print(f"      {k:12} = {str(v)[:70]}")

for i in list(only_old)[:10]:
    print(f"\n— hanya di LAMA id={i}:")
    show("LAMA", old_rows[i])
for i in list(only_new)[:10]:
    print(f"\n— hanya di BARU id={i}:")
    show("BARU", new_rows[i])
for i in changed[:10]:
    print(f"\n— isi BEDA id={i}:")
    print("   LAMA:"); show("LAMA", old_rows[i])
    print("   BARU:"); show("BARU", new_rows[i])