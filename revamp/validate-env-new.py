"""Validasi .env-new: cek kredensial bisa beneran konek ke project baru."""
import json, os, re, sys
import urllib.request, urllib.error
from pathlib import Path

env = {}
for line in Path(r"D:\fidh\Coding\Madrasah\iuran-asysyarif\.env-new").read_text().splitlines():
    line = line.strip()
    if line and not line.startswith("#") and "=" in line:
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip().strip("'\"")
    elif line and not line.startswith("#"):
        print(f"  ⚠️ baris tanpa '=': {line[:40]}")
        sys.exit(2)

url = env.get("NEXT_PUBLIC_SUPABASE_URL", "")
anon = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
svc = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
db = env.get("DATABASE_URL", "")

# Cek placeholder
bad = []
for k, v in [("URL", url), ("ANON", anon), ("SERVICE", svc), ("DB", db)]:
    if "<" in v or "ISI_" in v:
        bad.append(k)
if bad:
    print(f"❌ Masih placeholder: {bad}")
    sys.exit(1)

# 1. test anon key (public, harus baca data)
def test_anon():
    try:
        req = urllib.request.Request(url.rstrip('/') + "/rest/v1/students?select=id&limit=1")
        req.add_header("apikey", anon)
        req.add_header("Authorization", "Bearer " + anon)
        with urllib.request.urlopen(req, timeout=20) as r:
            body = r.read().decode()
            return True, f"HTTP {r.status} → {body[:80]}"
    except urllib.error.HTTPError as e:
        return False, f"HTTP {e.code}: {e.read().decode()[:150]}"
    except Exception as e:
        return False, f"{type(e).__name__}: {e}"

# 2. test service_role key lewat /sql (echo 1)
def test_svc():
    try:
        payload = json.dumps({"query": "SELECT 1 AS ok"}).encode()
        req = urllib.request.Request(url.rstrip('/') + "/sql", data=payload,
            headers={"Content-Type": "application/json", "apikey": svc, "Authorization": f"Bearer {svc}"})
        with urllib.request.urlopen(req, timeout=20) as r:
            return True, f"HTTP {r.status} → {r.read().decode()[:80]}"
    except urllib.error.HTTPError as e:
        return False, f"HTTP {e.code}: {e.read().decode()[:200]}"
    except Exception as e:
        return False, f"{type(e).__name__}: {e}"

# 3. test database koneksi
def test_db():
    m = re.match(r"postgresql://(.+?):(.+?)@(.+?):(\d+)/(.+?)(\?.*)?$", db)
    if not m:
        return False, "format URL postgres tidak cocok"
    import urllib.parse
    cfg = dict(user=urllib.parse.unquote(m.group(1)), password=urllib.parse.unquote(m.group(2)),
               host=m.group(3), port=int(m.group(4)), database=m.group(5).split("?")[0])
    try:
        from pg8000.native import Connection
        c = Connection(user=cfg["user"], password=cfg["password"], host=cfg["host"],
                       port=cfg["port"], database=cfg["database"])
        r = c.run("SELECT 1")
        c.close()
        return True, f"pgsql OK host={cfg['host']}"
    except Exception as e:
        return False, f"{type(e).__name__}: {e}"

print("=== Anon key (read data) ===")
ok, msg = test_anon(); print(f"  {'✅' if ok else '❌'} {msg}")
print("\n=== service_role key (/sql) ===")
ok, msg = test_svc(); print(f"  {'✅' if ok else '❌'} {msg}")
print("\n=== DATABASE_URL ===")
ok, msg = test_db(); print(f"  {'✅' if ok else '❌'} {msg}")