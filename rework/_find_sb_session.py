"""Cari session Supabase Dashboard spesifik: key 'sb-access-token' / 'sb-refresh-token'."""
import base64, glob, os, re, json

LD = os.path.expandvars(r"%LOCALAPPDATA%\BraveSoftware\Brave-Browser\User Data\Default\Local Storage\leveldb")

# Cari semua token yang issuernya supabase (dashboard server)
print("=== Token dengan issuer Supabase ===")
JWT_RE = re.compile(r"eyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}")
def b64url_decode(s):
    s = s.rstrip("=") + "=" * ((4 - len(s.rstrip("=")) % 4) % 4)
    try:
        return base64.urlsafe_b64decode(s)
    except Exception:
        return b""

for f in glob.glob(os.path.join(LD, "*.ldb")) + glob.glob(os.path.join(LD, "*.log")):
    try:
        data = open(f, "rb").read().decode("latin-1")
    except Exception:
        continue
    # cari referensi supabase dashboard
    for m in re.finditer(r'sb-(access|refresh)-token[^\"]*\"([^\"]{20,})\"', data):
        print(f"  [{os.path.basename(f)}] sb-token -> {m.group(2)[:20]}...")
    # cari pola 'supabase' + email di sekitarnya
    for m in re.finditer(r'.{80}email.{0,80}@[a-z0-9.]+.{0,40}supabase.{0,40}', data, re.DOTALL):
        print(f"  [{os.path.basename(f)}] ctx: ...{m.group(0)[:180]}...")

print("\n=== Token JWT yang dikeluarkan oleh provider login.supabase.com / api.supabase ===")
for f in glob.glob(os.path.join(LD, "*.ldb")) + glob.glob(os.path.join(LD, "*.log")):
    try:
        data = open(f, "rb").read().decode("latin-1")
    except Exception:
        continue
    for m in JWT_RE.finditer(data):
        tok = m.group(0)
        parts = tok.split(".")
        try:
            payload = json.loads(b64url_decode(parts[1]).decode("utf-8"))
        except Exception:
            continue
        iss = str(payload.get("aud") or payload.get("iss") or "")
        if "supabase" in iss or payload.get("email") in ("hafidh@upi.edu",):
            print(f"  [{os.path.basename(f)}] issuer={iss} | email={payload.get('email')} | keys={list(payload.keys())[:8]}")