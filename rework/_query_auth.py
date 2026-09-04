"""Query auth.users & public dari koneksi postgres (DATABASE_URL) — cari email pemilik."""
import os
import re
import sys
from pathlib import Path

try:
    from pg8000.native import Connection, literal
except ImportError:
    print("pg8000 belum ada, install...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pg8000", "--quiet"])
    from pg8000.native import Connection, literal

def load_env(p):
    env = {}
    for line in Path(p).read_text(encoding="utf-8", errors="replace").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip().strip("'\"").strip()
    return env

root = Path(r"D:\fidh\Coding\Madrasah\iuran-asysyarif")
env = load_env(root / ".env")
url = env.get("DIRECT_URL") or env.get("DATABASE_URL")

import urllib.parse
m = re.match(r"postgresql://(.+?):(.+?)@(.+?):(\d+)/(.+?)(\?.*)?$", url)
cfg = {
    "user": urllib.parse.unquote(m.group(1)),
    "password": urllib.parse.unquote(m.group(2)),
    "host": m.group(3),
    "port": int(m.group(4)),
    "database": m.group(5).split("?")[0],
}

conn = Connection(user=cfg["user"], password=cfg["password"], host=cfg["host"],
                  port=cfg["port"], database=cfg["database"])

print("✅ Connected. Coba akses schema 'auth'...")

# 1. Apakah ada akses ke auth.users?
dbname_ok = role_in_auth = True
try:
    auth_rows = conn.run("""
        SELECT email, role, created_at, raw_app_meta_data->>'provider' AS provider
        FROM auth.users
        ORDER BY created_at
    """)
    print(f"\nAUTH.USERS — {len(auth_rows)} baris (email akun pengguna):")
    for r in auth_rows:
        print(f"  {r}")
except Exception as e:
    print(f"  ❌ Tidak bisa baca auth.users: {str(e)[:150]}")

# 2. jwts / keys / owner hints dari postgres role
print("\n=== Cek role & grant ===")
try:
    roles = conn.run("SELECT rolname FROM pg_roles WHERE rolsuper AND rolcanlogin")
    print("  Roles superuser/login:")
    for r in roles:
        print(f"    - {r[0]}")
except Exception as e:
    print(f"  {str(e)[:100]}")

conn.close()