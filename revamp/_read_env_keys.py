"""Baca .env asli: tampilkan KEY + apakah nilainya kosong/punya nilai (nilai di-blur)."""
from pathlib import Path
import re

env = {}
for line in Path(r"D:\fidh\Coding\Madrasah\iuran-asysyarif\.env").read_text(encoding="utf-8", errors="replace").splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    k, _, v = line.partition("=")
    env[k.strip()] = v.strip().strip("'\"")
    # blur nilai
    if v.strip():
        shown = v.strip()[:15] + "..." 
    else:
        shown = "KOSONG"
    print(f"  {k.strip():<38} {shown}")

print(f"\nTotal key: {len(env)}")