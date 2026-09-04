"""Decode semua JWT di Local Storage — lihat claim lengkap + korelasikan dgn project."""
import base64
import glob
import os
import re
import json

LD = os.path.expandvars(
    r"%LOCALAPPDATA%\BraveSoftware\Brave-Browser\User Data\Default\Local Storage\leveldb"
)
JWT_RE = re.compile(r"eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*")

def b64pad(s):
    s = s.rstrip("=")
    return s + "=" * ((4 - len(s) % 4) % 4)

def b64url(s):
    return b64pad(s).replace("-", "+").replace("_", "/")

tokens = {}
for f in glob.glob(os.path.join(LD, "*.ldb")) + glob.glob(os.path.join(LD, "*.log")):
    try:
        blob = open(f, "rb").read()
    except Exception:
        continue
    for m in JWT_RE.finditer(blob.decode("latin-1")):
        tok = m.group(0)
        parts = tok.split(".")
        if len(parts) < 2:
            continue
        try:
            payload = json.loads(b64url(parts[1]))
        except Exception:
            continue
        pid = os.path.basename(f)
        key = (payload.get("email") or payload.get("sub") or "noemail")
        tokens.setdefault(key, {"files": set(), "claims": set()})
        tokens[key]["files"].add(pid)
        # kumpulkan claim menarik
        claims = []
        for k in ["email", "sub", "aud", "role", "exp", "organization_id", "project_ref", "team_id", "workspace_id", "is_impersonating"]:
            if k in payload:
                claims.append(f"{k}={payload[k]}")
        tokens[key]["claims"].add("|".join(sorted(claims)))

print("=== JWT TOKENS di Local Storage (grouped by email) ===")
for email, info in tokens.items():
    print(f"\n  EMAIL: {email}")
    print(f"    dari file: {sorted(info['files'])}")
    for c in sorted(info["claims"]):
        print(f"    claim: {c[:200]}")