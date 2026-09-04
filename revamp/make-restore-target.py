"""Buat backup-restore-target.sql dari backup-full-asysyarif.sql:
- Hapus 2 INSERT profiles (view/edit) — legacy login, nggak dipakai
- Hapus FK profiles_id_fkey (arah ke auth.users kosong)
- CREATE TABLE profiles + RLS policies DI-PERTAHANKAN (struktur tetap 8 tabel)
File backup utama TIDAK diubah.
"""
import re
from pathlib import Path

DATA = Path(r"D:\fidh\Coding\Madrasah\iuran-asysyarif\revamp\data")
SRC = DATA / "backup-full-asysyarif.sql"
DST = DATA / "backup-restore-target.sql"

lines = SRC.read_text(encoding="utf-8").splitlines(keepends=True)
out = []
removed = []

for line in lines:
    s = line.strip()

    # 1. Hapus INSERT profiles (2 baris)
    if s.startswith("INSERT INTO public.\"profiles\""):
        removed.append("INSERT profiles: " + s[:60])
        continue

    # 2. Hapus FK profiles_id_fkey
    if "ALTER TABLE ONLY public.\"profiles\"" in s and "profiles_id_fkey" in s:
        removed.append("FK profiles_id_fkey")
        continue

    out.append(line)

DST.write_text("".join(out), encoding="utf-8")

print("Dihapus dari file restore target:")
for r in removed:
    print("  -", r)
print()
print(f"File baru: {DST}")
print(f"  baris: {len(out)} (dari {len(lines)})")
print(f"  bytes: {DST.stat().st_size:,}")

# Verifikasi: pastikan tidak ada lagi INSERT profiles / FK profiles_id_fkey
text = DST.read_text(encoding="utf-8")
print()
print("Verifikasi:")
print("  INSERT profiles tersisa:", text.count('INSERT INTO public."profiles"'))
print("  FK profiles_id_fkey tersisa:", text.count("profiles_id_fkey"))
print("  CREATE TABLE profiles ada:", "CREATE TABLE IF NOT EXISTS public.\"profiles\"" in text)
print("  RLS policy profiles ref ada:", "FROM profiles" in text)