"""Validasi .env-newest: cek semua key + nilai nyambung ke project baru (bukan lama)."""
from pathlib import Path
import re

env = {}
for line in Path(r"D:\fidh\Coding\Madrasah\iuran-asysyarif\.env-newest").read_text(encoding="utf-8").splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    k, _, v = line.partition("=")
    env[k.strip()] = v.strip().strip("'\"")

print("=== .env-newest: key & pengecekan target ===")
checks = {
    "DATABASE_URL": lambda v: "agslfqsiswrzqqzveifr" not in v and "pkfouqetuofnvidvrfyn" in v and ":6543" in v,
    "DIRECT_URL":    lambda v: "agslfqsiswrzqqzveifr" not in v and "pkfouqetuofnvidvrfyn" in v and ":5432" in v,
    "NEXT_PUBLIC_SUPABASE_URL": lambda v: v == "https://pkfouqetuofnvidvrfyn.supabase.co",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": lambda v: v.startswith("sb_publishable_") and "Yzh" in v,
    "NEXT_PUBLIC_FEATURE_TABUNGAN": lambda v: v in ("true", "false"),
}
ok = True
for k, fn in checks.items():
    v = env.get(k)
    good = (v is not None) and fn(v)
    if not good:
        ok = False
    print(f"  {k:<32} {'OK' if good else 'PERLU CEK'}")
    if v and "agslfqsiswrz" in v:
        print(f"     ⚠️ masih nunjuk project LAMA!")

print(f"\nJumlah key: {len(env)} (harus 5)")
print(f"Hasil: {'ALL OK - semua nunjuk project baru' if ok else 'ADA MASALAH'}")