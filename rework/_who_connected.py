"""Siapa yang benar-benar terhubung ke project ini — dari sisi DB & auth."""
import json, re

with open("D:/fidh/Coding/Madrasah/iuran-asysyarif/rework/isi-database.json", encoding="utf-8") as f:
    db = json.load(f)

# 1. auth users (via query langsung sdh dilakukan: view/edit)
print("=== AUTH USERS (dari query langsung) ===")
print("  view@asysyarif-tools.vercel.app")
print("  edit@asysyarif-tools.vercel.app")

# 2. profiles di DB app
print("\n=== PROFILES (DB app) ===")
for p in db["tables"]["profiles"]["rows"]:
    print(f"  {p}")

# 3. activity_logs user_name
print("\n=== ACTIVITY_LOGS user_name ===")
u = {}
for a in db["tables"]["activity_logs"]["rows"]:
    un = a.get("user_name")
    u[un] = u.get(un, 0) + 1
for k, v in u.items():
    print(f"  {v:4}x  {k}")

# 4. Identitas di seluruh data (email/ext)
print("\n=== EMAIL/alamat di seluruh DB ===")
emails = set()
for t, tbl in db["tables"].items():
    for row in tbl["rows"]:
        for k, v in row.items():
            if isinstance(v, str):
                for m in re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', v):
                    emails.add(m)
print("  (kosong)" if not emails else "\n".join(f"  {e}" for e in sorted(emails)))