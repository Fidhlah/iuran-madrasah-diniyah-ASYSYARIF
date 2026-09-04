import json

with open("isi-database.json", encoding="utf-8") as f:
    db = json.load(f)
tables = db["tables"]

# 1. profiles table
print("=== PROFILES ===")
for p in tables.get("profiles", {}).get("rows", []):
    print(f"  {p}")

# 2. settings table
print("\n=== SETTINGS ===")
for s in tables.get("settings", {}).get("rows", []):
    print(f"  {s}")

# 3. activity_logs — user_name yang muncul
print("\n=== ACTIVITY_LOGS: user_name unik ===")
unames = {}
for a in tables.get("activity_logs", {}).get("rows", []):
    un = a.get("user_name")
    unames[un] = unames.get(un, 0) + 1
for u, c in sorted(unames.items(), key=lambda x: -x[1]):
    print(f"  {c:4}x  {u}")

# 4. Cari string email di seluruh data
print("\n=== Cari EMAIL di seluruh DB ===")
import re
emails = set()
for tbl, t in tables.items():
    for row in t.get("rows", []):
        for k, v in row.items():
            if isinstance(v, str):
                for m in re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', v):
                    emails.add(m)
for e in sorted(emails):
    print(f"  {e}")