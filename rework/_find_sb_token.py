"""Cari session token Supabase Dashboard di leveldb (localStorage supabase.com).

LevelDB menyimpan pasangan key-value. Supabase dashboard nyimpen:
  - key: sb-access-token  (JWT access token)
  - key: sb-refresh-token
Value biasanya mengikuti key dalam format binary.
"""
import glob, os, re, base64, json

LD = os.path.expandvars(r"%LOCALAPPDATA%\BraveSoftware\Brave-Browser\User Data\Default\Local Storage\leveldb")
KEYS = [b"sb-access-token", b"sb-refresh-token", b"supabase.auth.token", b"access_token", b"refresh_token"]

JWT_RE = re.compile(rb"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}")

def b64url_decode(s):
    s = s.rstrip("=") + "=" * ((4 - len(s.rstrip("=")) % 4) % 4)
    try:
        return base64.urlsafe_b64decode(s)
    except Exception:
        return b""

for f in glob.glob(os.path.join(LD, "*.ldb")) + glob.glob(os.path.join(LD, "*.log")):
    try:
        data = open(f, "rb").read()
    except Exception:
        continue
    for key in KEYS:
        idx = 0
        while True:
            idx = data.find(key, idx)
            if idx == -1:
                break
            chunk = data[idx: idx + 4000]
            # cari JWT di dekat key
            for m in JWT_RE.finditer(chunk):
                tok = m.group(0)
                parts = tok.split(b".")
                payload = b64url_decode(parts[1].decode())
                txt = payload.decode("utf-8", errors="ignore")
                emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', txt)
                if emails or "supabase" in txt:
                    print(f"[{os.path.basename(f)}] key={key.decode()} near JWT:")
                    print(f"    payload: {txt[:200]}")
                    print(f"    emails: {emails}")
            idx += len(key)
print("done")