"""Cek status Supabase project: tambahan + database ping."""
import json
import os
import re
import urllib.request
from pathlib import Path

# baca .env
env = {}
for line in Path(r"D:\fidh\Coding\Madrasah\iuran-asysyarif\.env").read_text().splitlines():
    line = line.strip()
    if "=" in line and not line.startswith("#"):
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip().strip("'\"").strip()

anon = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
url = env.get("NEXT_PUBLIC_SUPABASE_URL", "https://agslfqsiswrzqqzveifr.supabase.co")

print(f"Project URL: {url}")
print(f"Anon key: {anon[:30]}...\n")

# 1. health & rest
for path in ["/auth/v1/health", "/rest/v1/"]:
    try:
        req = urllib.request.Request(url + path)
        if anon:
            req.add_header("apikey", anon)
            req.add_header("Authorization", "Bearer " + anon)
        with urllib.request.urlopen(req, timeout=20) as resp:
            body = resp.read().decode()[:200]
            print(f"[{path}] HTTP {resp.status} → {body}")
    except urllib.error.HTTPError as e:
        b = e.read().decode()[:150]
        print(f"[{path}] HTTP {e.code} → {b}")
    except Exception as e:
        print(f"[{path}] ❌ {type(e).__name__}: {e}")

# 2. test query rest (select count dari students)
print("\n=== Test query REST (students table) ===")
try:
    req = urllib.request.Request(url + "/rest/v1/students?select=id&limit=1")
    req.add_header("apikey", anon)
    req.add_header("Authorization", "Bearer " + anon)
    with urllib.request.urlopen(req, timeout=20) as resp:
        print(f"HTTP {resp.status} → {resp.read().decode()[:150]}")
except urllib.error.HTTPError as e:
    print(f"HTTP {e.code} → {e.read().decode()[:200]}")