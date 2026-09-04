"""VERIFIKASI FINAL: bandingkan project LAMA vs project BARU baris-per-baris.

Konek ke dua DB via env masing-masing:
  - LAMA : .env (tapi nilai sekarang BARU), LAMA di .env.bak
  - BARU : .env (nilai sekarang)
Kita pakai .env.bak untuk LAMA, .env untuk BARU.

READ-ONLY terhadap kedua project.
"""
import re, urllib.parse, sys
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

def parse_pg_url(url):
    m = re.match(r"postgresql://([^:/]+):([^@]+)@([^:/]+):(\d+)/([^?]+)(\?.*)?$", url)
    if not m:
        raise SystemExit("gagal parse url: " + url[:40])
    return dict(user=urllib.parse.unquote(m.group(1)), password=urllib.parse.unquote(m.group(2)),
                host=m.group(3), port=int(m.group(4)), database=m.group(5).split("?")[0])

ROOT = Path(r"D:\fidh\Coding\Madrasah\iuran-asysyarif")
env_old = load_env(ROOT / ".env.bak")   # project LAMA (agslfqsiswrzqqzveifr)
env_new = load_env(ROOT / ".env")        # project BARU (pkfouqetuofnvidvrfyn)

def conn_of(env, label):
    url = env.get("DATABASE_URL")
    if not url:
        raise SystemExit(f"{label}: tidak ada DATABASE_URL")
    cfg = parse_pg_url(url)
    c = Connection(user=cfg["user"], password=cfg["password"], host=cfg["host"],
                   port=cfg["port"], database=cfg["database"])
    ref = re.search(r"([a-z0-9]{20})\.supabase", url)
    print(f"  {label}: {cfg['host']} ... ref={ref.group(1) if ref else '?'}")
    return c, ref.group(1) if ref else "?"

print("=== Koneksi ===")
old, old_ref = conn_of(env_old, "LAMA (.env.bak)")
new, new_ref = conn_of(env_new, "BARU (.env)")
print(f"  LAMA ref={old_ref}")
print(f"  BARU ref={new_ref}")

TABLES = ["students","payments","finances","activity_logs","settings","profiles","tabungan","tabungan_transaksi"]
print("\n=== 1. SKEMA: kolom per tabel ===")
schema_diff = 0
for t in TABLES:
    def cols(c):
        return sorted(str(r[0]) for r in c.run(
            f"SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='{t}'"))
    a = cols(old); b = cols(new)
    same = (a == b)
    if not same:
        schema_diff += 1
        print(f"  {t:20} ⚠️ BEDA kolom")
        print(f"     LAMA: {a}")
        print(f"     BARU: {b}")
    else:
        print(f"  {t:20} ✅ kolom sama ({len(a)})")
print(f"  -> skema beda: {schema_diff} tabel")

print("\n=== 2. JUMLAH BARIS per tabel (LAMA vs BARU) ===")
count_diff = 0
for t in TABLES:
    a = old.run(f'SELECT count(*) FROM public."{t}"')[0][0]
    b = new.run(f'SELECT count(*) FROM public."{t}"')[0][0]
    mark = "✅" if a == b else "⚠️ BEDA"
    if a != b:
        count_diff += 1
    print(f"  {t:20} LAMA={a:>5}  BARU={b:>5}  {mark}")
print(f"  -> jumlah baris beda: {count_diff} tabel")

print("\n=== 3. KOMPONEN (function, trigger, index, policy, realtime) ===")
def cnt(c, sql):
    return c.run(sql)[0][0]
cmp_items = [
    ("function public",  "SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prokind='f'"),
    ("trigger public",   "SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND NOT t.tgisinternal"),
    ("index non-PK",     "SELECT count(*) FROM pg_indexes WHERE schemaname='public' AND indexname NOT LIKE '%_pkey'"),
    ("RLS policies",     "SELECT count(*) FROM pg_policies WHERE schemaname='public'"),
    ("tabel realtime",   "SELECT count(*) FROM pg_publication_tables WHERE pubname='supabase_realtime'"),
]
comp_diff = 0
for label, sql in cmp_items:
    a = cnt(old, sql); b = cnt(new, sql)
    mark = "✅" if a == b else "⚠️ BEDA"
    if a != b:
        comp_diff += 1
    print(f"  {label:22} LAMA={a}  BARU={b}  {mark}")
print(f"  -> komponen beda: {comp_diff}")

print("\n=== 4. DATA SELENGKAPNYA: banding baris per tabel (row-by-row) ===")
row_diff = 0
for t in TABLES:
    # ambil semua data LAMA, hash per baris
    rows_old = old.run(f'SELECT * FROM public."{t}"')
    rows_new = new.run(f'SELECT * FROM public."{t}"')
    def normalize(rows):
        # urutkan & hash setiap baris
        out = set()
        for r in rows:
            out.add(str(sorted(map(conv, r))))
        return out
    def conv(v):
        if hasattr(v, 'isoformat'): 
            return v.isoformat()
        return str(v)
    set_old = normalize(rows_old)
    set_new = normalize(rows_new)
    # bandingkan
    only_old = set_old - set_new
    only_new = set_new - set_old
    # untuk lend, tampilkan selisih kuantitatif (jangan dump isi penuh)
    if only_old or only_new:
        row_diff += 1
        print(f"  {t:20} ⚠️ BEDA: LAMA punya {len(only_old)} baris unik, BARU punya {len(only_new)} baris unik")
        # sample salah satu selisih (dipotong)
        if only_old:
            s = only_old.pop()
            print(f"     sample LAMA-only: {s[:120]}")
        if only_new:
            s = only_new.pop()
            print(f"     sample BARU-only: {s[:120]}")
    else:
        print(f"  {t:20} ✅ IDENTIK ({len(rows_old)} baris, 0 selisih)")

old.close(); new.close()

print("\n" + "=" * 60)
print(f"HASIL AKHIR: skema_beda={schema_diff}, count_beda={count_diff}, komponen_beda={comp_diff}, row_beda={row_diff}")
if schema_diff == 0 and count_diff == 0 and comp_diff == 0 and row_diff == 0:
    print("✅✅ SEMUA IDENTIK — project baru sama persis dengan project lama")
else:
    print("⚠️ ADA PERBEDAAN (lihat detail) — profiles BARU sengaja kosong, sisanya cek")
print("=" * 60)