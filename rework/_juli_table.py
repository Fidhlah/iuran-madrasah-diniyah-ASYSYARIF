import json
from collections import defaultdict

with open('isi-database-jan-jul.json', encoding='utf-8') as f:
    data = json.load(f)
fin = data['tables']['finances']['rows']

jul = [r for r in fin if (r.get('date') or '')[:7] == '2026-07']

# ── PEMASUKAN ──
spp_bulan_ini = 0
spp_tunggakan = 0
spp_bulan_count = 0
spp_tunggakan_count = 0
pemasukan_langsung_mdta = 0
pendaftaran = 0
for r in jul:
    if r['type'] != 'income':
        continue
    amt = int(float(r['amount']))
    desc = r['description'].lower()
    if 'uang suka rela' in desc or 'masuk ke kas mdta' in desc or 'potongan tabungan' in desc:
        pemasukan_langsung_mdta += amt
    elif 'pendaftaran' in desc:
        pendaftaran += amt
    elif 'iuran' in desc:
        if 'bulan juli 2026' in desc:
            spp_bulan_ini += amt
            spp_bulan_count += 1
        else:
            spp_tunggakan += amt
            spp_tunggakan_count += 1

total_pemasukan = sum(int(float(r['amount'])) for r in jul if r['type'] == 'income')

# ── PENGELUARAN RIIL ──
gaji = 0
kas_mesjid = 0
seragam = 0
belanja_mdta = 0
alokasi = 0
for r in jul:
    if r['type'] != 'expense':
        continue
    amt = int(float(r['amount']))
    desc = r['description'].lower()
    if 'honor' in desc or 'guru' in desc:
        gaji += amt
    elif 'mesjid' in desc or 'masjid' in desc:
        kas_mesjid += amt
    elif 'kas mdta' in desc:
        alokasi += amt
    elif 'seragam' in desc:
        seragam += amt
    else:
        belanja_mdta += amt

total_pengeluaran_riil = gaji + kas_mesjid + seragam + belanja_mdta
total_expense_system = sum(int(float(r['amount'])) for r in jul if r['type'] == 'expense')

# ── SALDO (pakai akumulasi dari laporan Jan-Jun) ──
kb_awal = 3200000
mdta_awal = 1681000
total_awal = kb_awal + mdta_awal

kb_akhir = 3950000
mdta_akhir = 1915100
total_akhir = kb_akhir + mdta_akhir

print("=" * 55)
print("TABEL EKSEKUTIF — JULI 2026")
print("=" * 55)
print(f"SALDO AWAL")
print(f"  Total:            Rp {total_awal:,}")
print(f"  Kas Besar:        Rp {kb_awal:,}")
print(f"  Kas MDTA:         Rp {mdta_awal:,}")
print()
print("PEMASUKAN")
print(f"  SPP Bulan Ini:    Rp {spp_bulan_ini:,}  ({spp_bulan_count}x)")
print(f"  SPP Tunggakan:    Rp {spp_tunggakan:,}  ({spp_tunggakan_count}x)")
print(f"  Uang Pendaftaran: Rp {pendaftaran:,}  (6x)")
print(f"  Pemasukan Langsung Kas MDTA: Rp {pemasukan_langsung_mdta:,}")
print(f"  Total Pemasukan:  Rp {total_pemasukan:,}")
print()
print("PENGELUARAN RIIL")
print(f"  Gaji & Honor Guru: Rp {gaji:,}")
print(f"  Kas Mesjid:        Rp {kas_mesjid:,}")
print(f"  Operasional (Seragam): Rp {seragam:,}")
print(f"  Belanja MDTA:      Rp {belanja_mdta:,}")
print(f"  Total Pengeluaran Riil: Rp {total_pengeluaran_riil:,}")
print()
print(f"ALOKASI KE KAS MDTA: Rp {alokasi:,}")
print()
print("SALDO AKHIR")
print(f"  Kas Besar:         Rp {kb_akhir:,}")
print(f"  Kas MDTA:          Rp {mdta_akhir:,}")
print(f"  TOTAL TUNAI AKHIR: Rp {total_akhir:,}")
print()
print("Cek silang:")
print(f"  KB: {kb_awal:,} + iuran_KB({spp_bulan_ini+spp_tunggakan+pendaftaran:,}) - gaji_mesjid({gaji+kas_mesjid:,}) - alokasi({alokasi:,}) = {kb_awal + spp_bulan_ini+spp_tunggakan+pendaftaran - gaji - kas_mesjid - alokasi:,}")
print(f"  MDTA: {mdta_awal:,} + alokasi({alokasi:,}) - belanja({belanja_mdta+seragam:,}) = {mdta_awal + alokasi - belanja_mdta - seragam:,}")
