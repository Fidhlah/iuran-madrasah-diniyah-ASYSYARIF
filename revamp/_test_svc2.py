"""Test service_role dengan endpoint yang benar (REST + pg/query)."""
import json
import urllib.request, urllib.error
from pathlib import Path

env = {}
for line in Path(r"D:\fidh\Coding\Madrasah\iuran-asysyarif\.env-new").read_text().splitlines():
    line = line.strip()
    if line and not line.startswith("#") and "=" in line:
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip().strip("'\"")
url = env.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
svc = env.get("SUPABASE_SERVICE_ROLE_KEY", "")

# Endpoint resmi buat run SQL saat ini:
#   - /rest/v1  (REST, butuh tabel ada)
#   - /pg/query (PostgREST raw sql, pakai service role)  [ini yang bener utk SQL]
candidates = [
    ("/pg/query",      {"query": "SELECT 1 AS ok"}),
    ("/rest/v1/rpc/-", None),
]
print("=== service_role: cek endpoint /pg/query (raw SQL) ===")
for path, payload in [("/pg/query", {"query": "SELECT count(*) AS n FROM pg_catalog.pg_tables WHERE schemaname='public'"})]:
    try:
        data = json.dumps(payload).encode()
        req = urllib.request.Request(url + path, data=data,
            headers={"Content-Type": "application/json", "apikey": svc,
                     "Authorization": "Bearer " + svc})
        with urllib.request.urlopen(req, timeout=20) as r:
            body = r.read().decode()
            print(f"  ✅ HTTP {r.status}: {body[:200]}")
    except urllib.error.HTTPError as e:
        print(f"  HTTP {e.code}: {e.read().decode()[:200]}")
    except Exception as e:
        print(f"  ❌ {type(e).__name__}: {e}")

# Cek juga anon via /pg/query (kalau boleh)
print("\n=== anon via /pg/query ===")
anon = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
try:
    data = json.dumps({"query": "SELECT 1 AS ok"}).encode()
    req = urllib.request.Request(url + "/pg/query", data=data,
        headers={"Content-Type": "application/json", "apikey": anon, "Authorization": "Bearer " + anon})
    with urllib.request.urlopen(req, timeout=20) as r:
        print(f"  ✅ HTTP {r.status}: {r.read().decode()[:150]}")
except urllib.error.HTTPError as e:
    print(f"  HTTP {e.code}: {e.read().decode()[:150]}")