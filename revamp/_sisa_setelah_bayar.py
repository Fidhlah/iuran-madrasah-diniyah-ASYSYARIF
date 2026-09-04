"""Sisa kas besar setelah bayar gaji+mesjid+mdta di tgl 5, dihitung dengan iuran bulan itu s/d tgl 5.

Model (konteks saat ini: MDTA masih expense):
  saldo_awal_bulan = saldo kas besar akhir bulan sebelumnya (0 utk Jan)
  iuran_before_5   = income 'membayar iuran' dgn tanggal <= 5 di bulan itu
  expense_5        = gaji + kas mesjid + kas mdta (expense di tanggal 5)
  sisa             = saldo_awal + iuran_before_5 - expense_5

Juga tampilkan sisa TANPA iuran bulan itu (cuma saldo awal) buat perbandingan.
"""
import json, re
from pathlib import Path
from collections import defaultdict

DATA = Path(r"D:\fidh\Coding\Madrasah\iuran-asysyarif\revamp\data")
with open(DATA / "backup-full-asysyarif.json", encoding="utf-8") as f:
    jdata = json.load(f)
finances = jdata["tables"]["finances"]["rows"]

# semua event finance: (tanggal, kind, amt)
events = []
for tx in finances:
    d = tx.get("date") or ""
    m = re.match(r"(\d{4}-\d{2}-\d{2})", d)
    if not m: continue
    desc = (tx.get("description") or "").lower()
    t = tx.get("type")
    amt = float(tx.get("amount") or 0)
    if t == "income":
        kind = "iuran" if "membayar iuran" in desc else ("infaq" if "infaq" in desc or "shadaqah" in desc or "donasi" in desc else ("daftar" if "pendaftaran" in desc else "lain_in"))
        if kind == "infaq": kind = "kb_in_other"
        elif kind == "daftar": kind = "kb_in_other"
        elif kind == "lain_in": kind = "kb_in_other"
        else: kind = "iuran"
        events.append((d[:10], kind, amt))
    else:
        if "diambil dari uang kas mdta" in desc or "diambil dari kas mdta" in desc:
            kind = "md_spend"   # belanja dari MDTA (tidak sentuh KB di sini)
        elif "kas mdta" in desc or "uang suka rela potongan tabungan" in desc:
            kind = "mdta"       # alokasi MDTA sebagai expense (konteks saat ini)
        elif "seragam" in desc:
            kind = "md_spend"
        elif any(w in desc for w in ["guru", "honor", "pembayaran guru"]):
            kind = "gaji"
        elif "kas mesjid" in desc or "kas masjid" in desc:
            kind = "mesjid"
        else:
            kind = "op"         # operasional kas besar
        events.append((d[:10], kind, amt))

events.sort()

# simulasi saldo kas besar berjalan (hanya kb_in_other/iuran masuk KB; expense gaji/mesjid/mdta/op keluar KB)
kb_running = defaultdict(float)  # saldo per akhir hari
kb = 0.0
by_day = defaultdict(lambda: defaultdict(float))
for day, kind, amt in events:
    if kind == "iuran" or kind == "kb_in_other":
        kb += amt
    elif kind in ("gaji", "mesjid", "mdta", "op"):
        kb -= amt
    # md_spend tidak sentuh KB (spending dari MDTA)
    by_day[day][kind] += amt

# saldo akhir tiap bulan = saldo pada hari terakhir bulan itu
def kb_after(day, by_day, days_sorted):
    k = 0.0
    for d in days_sorted:
        if d > day: break
        for kind, amt in by_day[d].items():
            if kind in ("iuran", "kb_in_other"): k += amt
            elif kind in ("gaji", "mesjid", "mdta", "op"): k -= amt
    return k

days_sorted = sorted(by_day.keys())
month_end = {}
for day in days_sorted:
    y, mo, _ = day.split("-")
    month_end[y + "-" + mo] = kb_after(day, by_day, days_sorted)

# per bulan: hitung sisa setelah tgl 5
print(f"{'Bulan':8} {'SaldoAwal':>11} {'Iuran<5':>9} {'Gaji':>9} {'Mesjid':>8} {'MDTA':>8} {'SISA':>10} {'TanpaIuran':>11}")
print("-" * 95)
prev_month_key = None
for ymo in sorted(month_end):
    y, mo = ymo.split("-")
    # saldo awal bulan = saldo akhir bulan sebelumnya (0 utk Jan)
    first_day = f"{y}-{mo}-01"
    # saldo sebelum event bulan ini = kb_after(akhir bulan sebelumnya)
    saldo_awal = 0.0
    if prev_month_key:
        # cari hari terakhir bulan sebelumnya yg ada di data
        prev_days = [d for d in days_sorted if d.startswith(prev_month_key)]
        if prev_days:
            saldo_awal = kb_after(prev_days[-1], by_day, days_sorted)
    # iuran masuk <= tgl 5
    iuran5 = sum(amt for d, k, amt in events if d.startswith(ymo) and d[8:10] <= "05" and k == "iuran")
    # expense tgl 5 (gaji/mesjid/mdta) — ambil semua di tanggal <= 5 juga? pakai tanggal 5 saja
    gaji = sum(amt for d, k, amt in events if d.startswith(ymo) and d[8:10] <= "05" and k == "gaji")
    mesjid = sum(amt for d, k, amt in events if d.startswith(ymo) and d[8:10] <= "05" and k == "mesjid")
    mdta = sum(amt for d, k, amt in events if d.startswith(ymo) and d[8:10] <= "05" and k == "mdta")
    sisa = saldo_awal + iuran5 - gaji - mesjid - mdta
    print(f"{ymo:8} {saldo_awal:>11,.0f} {iuran5:>9,.0f} {gaji:>9,.0f} {mesjid:>8,.0f} {mdta:>8,.0f} {sisa:>10,.0f} {saldo_awal-gaji-mesjid-mdta:>11,.0f}")
    prev_month_key = ymo