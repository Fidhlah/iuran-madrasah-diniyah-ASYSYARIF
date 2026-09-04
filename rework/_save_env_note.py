"""Salin nilai env project lama ke file catatan di tmp/asysyarif (TANPA print ke stdout)."""
import re
from pathlib import Path

SRC = Path(r"D:\fidh\Coding\Madrasah\iuran-asysyarif\.env")
DEST = Path(r"C:\Users\Fidh\AppData\Local\hermes\tmp\asysyarif\env-produksi-vercel-LAMA.md")

env = {}
for line in SRC.read_text(encoding="utf-8", errors="replace").splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    k, _, v = line.partition("=")
    env[k.strip()] = v.strip().strip("'\"").strip()

# Simpan dalam file markdown, jangan di-print
content = """# ENV PRODUKSI — VERCELE (NILAI LAMA / PROJECT LAMA)

> **PENTING:** Ini adalah nilai env yang DIPAKAI PRODUKSI VERCELE SEKARANG (project `agslfqsiswrzqqzveifr`).
> Simpan baik-baik — ini bahan REVERT kalau migrasi gagal / mau balik ke project lama.
> **JANGAN commit ke git. JANGAN share.**
> Tanggal disimpan: {date}

## Cara revert
1. Buka dashboard Vercel → project `iuran-asysyarif` (atau nama project Vercel)
2. Settings → Environment Variables → ganti nilai di bawah dengan nilai lama ini
3. Redeploy (push / redeploy) → web balik ke project lama

---

""".replace("{date}", __import__("datetime").datetime.now().strftime("%Y-%m-%d %H:%M"))

for k, v in env.items():
    # sembunyikan nilai sensitif? Tidak — ini file pribadi lokal, tulis lengkap
    content += f"- `{k}` = `{v}`\n"

# Tambah catatan lokasi .env sumber
content += f"""

---
*Sumber: `D:\\fidh\\Coding\\Madrasah\\iuran-asysyarif\\.env` (lokal, tidak di-track git)*
*Project Supabase: `agslfqsiswrzqqzveifr` | URL: `https://agslfqsiswrzqqzveifr.supabase.co`*
"""

DEST.write_text(content, encoding="utf-8")
print(f"✅ Disimpan ke: {DEST}")
print(f"   ({len(env)} variabel env, {DEST.stat().st_size} bytes) — nilai TIDAK ditampilkan di chat.")