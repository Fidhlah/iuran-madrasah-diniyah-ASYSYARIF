"""Per-kolom diff untuk baris finances yang 'beda' — bukti kolom mana yang berubah."""
import re, urllib.parse
from pathlib import Path
from pg8000.native import Connection
import hashlib

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

cols = [d[0] for d in old.run("""SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='finances' ORDER BY ordinal_position""")]

def all_rows(c):
    d = {}
    for r in c.run('SELECT * FROM public."finances" ORDER BY id'):
        d[str(r[0])] = dict(zip(cols, r))
    return d

old_rows = all_rows(old); new_rows = all_rows(new)
old.close(); new.close()

common = set(old_rows) & set(new_rows)
changed = [i for i in common if old_rows[i] != new_rows[i]]

def show(r):
    # sosissikan nilai: pecahkan \r jadi visible
    s = str(r)
    s = s.replace('\r', '~CR~').replace('\n', '~LF~')
    return s

print(str(len(changed)) + " baris 'beda'. Analisis kolom mana yang beda:")
col_diff_count = {}
for i in changed:
    diffs = []
    for k in cols:
        ov, nv = old_rows[i][k], new_rows[i][k]
        if ov != nv:
            diffs.append(k)
            col_diff_count[k] = col_diff_count.get(k, 0) + 1
    only_cr = all(
        str(old_rows[i][k]).replace('\r','') == str(new_rows[i][k]).replace('\r','')
        for k in diffs if k != 'id'
    )
    flag = "[HANYA newline]" if only_cr else "[ADA BEDA LAIN!]"
    print("  id=" + str(i)[:8] + " kolom_beda=" + str(diffs) + " " + flag)

print("\n=== Kolom yang paling sering beda ===")
for k, c in sorted(col_diff_count.items(), key=lambda x:-x[1]):
    print(f"  {k:15} beda di {c} baris")

print("\n=== Verifikasi: kalau buang \\r, apakah jadi identik? ===")
still_diff = 0
for i in changed:
    a = {k: str(old_rows[i][k]).replace('\r','') for k in cols}
    b = {k: str(new_rows[i][k]).replace('\r','') for k in cols}
    if a != b:
        still_diff += 1
        print("  id=" + str(i)[:8] + " MASIH beda setelah buang CR")
identik = len(changed) - still_diff
print("  Setelah buang CR: " + str(identik) + "/" + str(len(changed)) + " jadi identik, " + str(still_diff) + " masih beda")