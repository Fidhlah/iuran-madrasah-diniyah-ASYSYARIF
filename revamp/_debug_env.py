"""Debug lanjutan: service_role & DATABASE_URL — bedakan key-salah vs endpoint-salah."""
import json, re
import urllib.request, urllib.error
from pathlib import Path

env = {}
for line in Path(r"D:\fidh\Coding\Madrasah\iuran-asysyarif\.env-new").read_text().splitlines():
    line = line.strip()
    if line and not line.startswith("#") and "=" in line:
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip().strip("'\"")
url = env.get("NEXT_PUBLIC_SUPABASE_URL", "")
svc = env.get("SUPABASE_SERVICE_ROLE_KEY", "")

# Test 1: service key lewat REST (kalau key valid tapi tabel belum ada → 404 PGRST205;
# kalau key salah → 401)
def rest_with_key(key, label):
    try:
        req = urllib.request.Request(url.rstrip('/') + "/rest/v1/students?select=id&limit=1")
        req.add_header("apikey", key)
        req.add_header("Authorization", "Bearer " + key)
        with urllib.request.urlopen(req, timeout=20) as r:
            return f"✅ {label} OK: HTTP {r.status}"
    except urllib.error.HTTPError as e:
        return f"HTTP {e.code}: {e.read().decode()[:120]}"

print("=== service_role via REST ===")
print(" ", rest_with_key(svc, "service_role"))

# Test 2: koneksi langsung coba beberapa format host
import socket
db = env.get("DATABASE_URL", "")
print("\n=== DATABASE_URL format ===")
print("  string (blur):", re.sub(r'(:[^@]+@)', r':***@', db))

# coba resolve host
m = re.search(r"@([^:/\s]+):(\d+)", db)
if m:
    host, port = m.group(1), m.group(2)
    print(f"  host={host} port={port}")
    try:
        ip = socket.gethostbyname(host)
        print(f"  resolve → {ip} ✅")
        # tes TCP
        s = socket.create_connection((host, int(port)), timeout=10)
        print(f"  TCP connect port {port} ✅")
        s.close()
    except Exception as e:
        print(f"  ❌ {type(e).__name__}: {e}")

# Test 3: cek DNS host pooler supabase (format yang umum)
for cand in ["aws-0-ap-southeast-1.pooler.supabase.com", "db.pkfouqetuofnvidvrfyn.supabase.co"]:
    try:
        socket.gethostbyname(cand)
        print(f"  host {cand} → resolve OK")
    except Exception as e:
        print(f"  host {cand} → ❌ {e}")