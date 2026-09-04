#!/usr/bin/env python3
"""BUKTI: mana transaksi Juli yang masuk SPP Tunggakan + perlakuan Kas MDTA sbg alokasi.

Logika (dari generate-docx-arus-kas.py, SAMA dgn generate-laporan-full.py classify()):
  - Income 'iuran' dgn deskripsi 'bulan juli 2026'  → SPP BULAN INI
  - Income 'iuran' selain itu                       → SPP TUNGGAKAN
  - Expense mengandung 'kas mdta'                    → ALOKASI (bukan pengeluaran riil)
"""

import json

with open("isi-database-jan-jul.json", encoding="utf-8") as f:
    db = json.load(f)
fin = db["tables"]["finances"]["rows"]

jul = [r for r in fin if (r.get("date") or "")[:7] == "2026-07"]

# ── 1. SPP TUNGGAKAN ──
print("=" * 70)
print("BUKTI 2: TRANSAKSI JULI YANG MASUK 'SPP TUNGGAKAN'")
print("=" * 70)
tunggakan = []
spp_bulan = []
for r in jul:
    if r["type"] != "income":
        continue
    d = r["description"].lower()
    if "iuran" in d:
        if "bulan juli 2026" in d:
            spp_bulan.append(r)
        else:
            tunggakan.append(r)

print(f"\nSPP BULAN INI (bulan Juli): {len(spp_bulan)} transaksi")
print(f"SPP TUNGGAKAN (selain Juli): {len(tunggakan)} transaksi\n")
for r in tunggakan:
    amt = int(float(r["amount"]))
    print(f"  [{r['date'][:10]}] Rp {amt:>7,} | {r['description']}")

tung_spp = sum(int(float(r["amount"])) for r in tunggakan)
print(f"\n>>> TOTAL SPP TUNGGAKAN: Rp {tung_spp:,} ({len(tunggakan)} tx)")

# ── 2. PERLAKUAN KAS MDTA sbg ALOKASI ──
print("\n" + "=" * 70)
print("BUKTI 1: KAS MDTA DIPERLAKUKAN SBG ALOKASI (transfer), BUKAN PENGELUARAN RIIL")
print("=" * 70)

# Mana expense Juli yang 'kas mdta' (jadi transfer, bukan pengeluaran riil)
expense_jul = [r for r in jul if r["type"] == "expense"]
print("\nExpense Juli (9 tx) — klasifikasi per logika script:")
for r in expense_jul:
    amt = int(float(r["amount"]))
    d = r["description"].lower()
    guru = any(k in d for k in ["guru", "honor", "mengajar"])
    mesjid = any(k in d for k in ["kas masjid", "kas mesjid"])
    diambil = "diambil dari uang kas mdta" in d or "diambil dari kas mdta" in d
    print(f"  Rp {amt:>9,} | {r['description'][:45]:45}")
    # tandai
    if "kas mdta" in d:
        print(f"             ⮕  mengandung 'kas mdta' → ALOKASI (transfer, BUKAN expense riil)")

alokasi_jul = sum(int(float(r["amount"])) for r in expense_jul if "kas mdta" in r["description"].lower())
print(f"\n>>> Total alokasi Kas MDTA Juli: Rp {alokasi_jul:,} → dipindah ke fund MDTA, TIDAK mengurangi Kas Besar sbg pengeluaran riil")

# ── 3. Dampak: Kas Besar ──
print("\n" + "=" * 70)
print("DAMPAK: apakah alokasi ini ngurangin 'pengeluaran riil'?")
print("=" * 70)
guru = sum(int(float(r["amount"])) for r in expense_jul if any(k in r["description"].lower() for k in ["guru","honor"]))
mesjid = sum(int(float(r["amount"])) for r in expense_jul if any(k in r["description"].lower() for k in ["kas mesjid","kas masjid"]))
belanja = sum(int(float(r["amount"])) for r in expense_jul if not any(k in r["description"].lower() for k in ["kas mdta"]) and not any(k in r["description"].lower() for k in ["guru","honor"]) and not any(k in r["description"].lower() for k in ["kas mesjid","kas masjid"]))

print(f"  Gaji guru (riil):        Rp {guru:,}")
print(f"  Kas mesjid (riil):       Rp {mesjid:,}")
print(f"  Belanja MDTA (riil):     Rp {belanja:,}")
print(f"  ALOKASI MDTA (transfer): Rp {alokasi_jul:,}  ← dikeluarkan dari 'pengeluaran riil'")
print(f"  ─────────────────────────────────")
print(f"  Pengeluaran RIIL Juli:   Rp {guru + mesjid + belanja:,}  (TANPA alokasi)")
print(f"  Total expense di sistem: Rp {sum(int(float(r['amount'])) for r in expense_jul):,}  (dengan alokasi)")