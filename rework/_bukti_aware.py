#!/usr/bin/env python3
"""BUKTI: Di DATABASE Kas MDTA masih 'expense', di LAPORAN HARUS jadi alokasi.

Pertanyaan user: apakah laporan Juli aware bahwa di database Kas MDTA masih
dicatat sebagai expense, padahal di laporan SEHARUSNYA alokasi?

Dua kondisi dibanding:
  A. RAW DATABASE  → type='expense', TANPA reklasifikasi  → Kas MDTA dihitung expense
  B. LAPORAN       → classify() ubah 'Kas MDTA' (expense) jadi alokasi → BUKAN expense riil
"""

import json

with open("isi-database-jan-jul.json", encoding="utf-8") as f:
    db = json.load(f)
fin = db["tables"]["finances"]["rows"]
jul = [r for r in fin if (r.get("date") or "")[:7] == "2026-07"]

# ── Tampilkan RECORD MENTAH di database untuk transaksi Kas MDTA Juli ──
print("=" * 72)
print("RAW DATABASE — transaksi 'Kas MDTA' Juli (isi-database-jan-jul.json)")
print("=" * 72)
for r in jul:
    if "kas mdta" in r["description"].lower():
        print(json.dumps(r, indent=2, ensure_ascii=False))

print("\n⚠️  Perhatikan: type = 'expense'  →  di DATABASE, Kas MDTA masih tercatat sbg PENGELUARAN.")

# ── A. Kalau DIHITUNG apa adanya (expense) → hitungan ngaco ──
print("\n" + "=" * 72)
print("KONDISI A: KALAU DIHITUNG APA ADANYA DI DATABASE (SALAH)")
print("=" * 72)
expense_jul_raw = [r for r in jul if r["type"] == "expense"]
total_expense_raw = sum(int(float(r["amount"])) for r in expense_jul_raw)
print(f"  Total expense Juli (di DB): Rp {total_expense_raw:,}  ← TERMASUK Kas MDTA 750rb")
print(f"  → Kalau gini, Kas MDTA ikut dihitung sbg pengeluaran riil. SALAH.")

# ── B. Laporan: classify() reklasifikasi ──
print("\n" + "=" * 72)
print("KONDISI B: LAPORAN — classify() ubah 'Kas MDTA' jadi ALOKASI (BENAR)")
print("=" * 72)
def box_classify(d):
    d = d.lower()
    guru = any(k in d for k in ["guru", "honor", "mengajar"])
    mesjid = any(k in d for k in ["kas masjid", "kas mesjid"])
    diambil = "diambil dari uang kas mdta" in d or "diambil dari kas mdta" in d
    kas_mdta = "kas mdta" in d
    if guru:
        return ("kas_besar", "Gaji & Honor Guru", False)
    if mesjid:
        return ("kas_besar", "Kas Mesjid", False)
    if diambil:
        return ("kas_mdta", "Belanja MDTA", False)
    if kas_mdta:
        return ("kas_mdta", "Alokasi Kas MDTA", True)   # <-- is_transfer=True
    if "seragam" in d:
        return ("kas_mdta", "Operasional (Seragam)", False)
    return ("kas_mdta", "Belanja MDTA", False)

print("\n  Klasifikasi laporan untuk semua expense Juli:")
gaji = mesjid = alokasi = belanja = 0
for r in expense_jul_raw:
    amt = int(float(r["amount"]))
    fund, cat, is_transfer = box_classify(r["description"])
    tag = "   ← ALOKASI (bukan expense!)" if is_transfer else ""
    print(f"    Rp {amt:>9,} | {cat:24} | is_transfer={is_transfer}{tag}")
    if is_transfer:
        alokasi += amt
    elif cat == "Gaji & Honor Guru":
        gaji += amt
    elif cat == "Kas Mesjid":
        mesjid += amt
    else:
        belanja += amt

print("\n  Rekap laporan:")
print(f"    Gaji & Honor Guru (riil):       Rp {gaji:,}")
print(f"    Kas Mesjid (riil):              Rp {mesjid:,}")
print(f"    Belanja MDTA (riil):            Rp {belanja:,}")
print(f"    ALOKASI Kas MDTA (transfer):    Rp {alokasi:,}  ← DIKELUARKAN dari pengeluaran riil")
print(f"    ─────────────────────────────────────────")
print(f"    Pengeluaran RIIL laporan:       Rp {gaji+mesjid+belanja:,}")
print(f"    (di DB di-simpan sbg expense:   Rp {total_expense_raw:,})")

# ── Kegagalan jika salah paham ──
print("\n" + "=" * 72)
print("KENAPA KALAU SALAH PAHAM → HITUNGAN NGACO")
print("=" * 72)
print(f"  Kas MDTA Juli di DB: Rp {alokasi:,} (type='expense')")

print("""
  Dua cara baca yang BEDA:

  (B) LAPORAN BENAR — 'Kas MDTA' = alokasi (transfer):
      • Pengeluaran RIIL          = Rp 2,715,900  (tanpa alokasi)
      • Alokasi → masuk fund MDTA = +Rp 750,000
      • Kas MDTA bisa dibelanjakan / jadi saldo fund

  (A) SALAH — 'Kas MDTA' dianggap expense riil:
      • Pengeluaran RIIL disangka = Rp 3,465,900  (gaji + mesjid + BELANJA SMUA)
        → keliatan bulan Juli sangat boros, padahal 750rb cuma PINDAH KAS
      • Kas MDTA fund-nya = Rp 0  → padahal ada Rp 750rb + saldo sebelumnya
        → trus belanja MDTA (515rb) dari mana? Jadi 'uang hantu'

  Contoh numbers: Juni (laporan yg udah lo setujui):
      • Pengeluaran RIIL di laporan = Rp 2,715,900
      • Expense di DB                = Rp 3,465,900
      • Selisih = Rp 750,000 = persis alokasi Juli  ← ini yg bikin laporan 'bersih'
""")