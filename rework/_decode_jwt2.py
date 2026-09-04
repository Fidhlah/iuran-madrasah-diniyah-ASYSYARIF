"""Debug: cek JWT di leveldb, tampilkan payload mentah."""
import base64, glob, os, re

LD = os.path.expandvars(r"%LOCALAPPDATA%\BraveSoftware\Brave-Browser\User Data\Default\Local Storage\leveldb")
JWT_RE = re.compile(r"eyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}")

def b64url_decode(s):
    s = s.rstrip("=") + "=" * ((4 - len(s.rstrip("=")) % 4) % 4)
    try:
        return base64.urlsafe_b64decode(s)
    except Exception as e:
        return b"<err:" + str(e).encode()

seen = set()
for f in glob.glob(os.path.join(LD, "*.ldb")) + glob.glob(os.path.join(LD, "*.log")):
    try:
        data = open(f, "rb").read()
    except Exception:
        continue
    for m in JWT_RE.finditer(data.decode("latin-1")):
        tok = m.group(0)
        parts = tok.split(".")
        payload = b64url_decode(parts[1])
        # print petunjuk email
        txt = payload.decode("utf-8", errors="ignore")
        if "@" in txt or "email" in txt or "upi" in txt or "gmail" in txt:
            sig = tok[:25] + "..."
            if sig not in seen:
                seen.add(sig)
                em = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', txt)
                print(f"TOKEN {os.path.basename(f)} | payload:{txt[:250]}")
                print(f"   emails dalam payload: {em}")
                print("   ---")