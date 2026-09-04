"""Hitung ulang laporan tiap bulan dengan asumsi: ALOKASI KAS MDTA DIANULIR (=0).

Model:
  income_bulan  = semua income (iuran + infaq + pendaftaran + income lain)
  pengeluaran   = gaji + kas mesjid + operasional (beli/print/fotokopi/dll)
                  CASK MDTA expenses DIHAPUS → 0
  laba bulan    = income - pengeluaran
  saldo berjalan = laba + laba sebelumnya
"""
import json, re
from pathlib import Path
from collections import defaultdict

DATA = Path(r"D:\fidh\Coding\Madrasah\iuran-asysyarif\revamp\data")
with open(DATA / "backup-full-asysyarif.json", encoding="utf-8") as f:
    jdata = json.load(f)
finances = jdata["tables"]["finances"]["rows"]

mth = defaultdict(lambda: {"income": 0.0, "gaji": 0.0, "mesjid": 0.0, "op": 0.0, "mdta_cancel": 0.0})
for tx in finances:
    d = tx.get("date") or ""
    m = re.match(r"(\d{4}-\d{2})", d)
    if not m: continue
    mk = m.group(1)
    desc = (tx.get("description") or "").lower()
    t = tx.get("type")
    amt = float(tx.get("amount") or 0)
    if t == "income":
        mth[mk]["income"] += amt
    else:
        if "diambil dari uang kas mdta" in desc or "diambil dari kas mdta" in desc:
            mth[mk]["op"] += amt   # belanja dari mdta tetap pengeluaran op
        elif "kas mdta" in desc or "uang suka rela potongan tabungan" in desc:
            mth[mk]["mdta_cancel"] += amt   # alokasi mdta — DIANULIR
        elif "seragam" in desc:
            mth[mk]["op"] += amt
        elif any(w in desc for w in ["guru", "honor", "pembayaran guru"]):
            mth[mk]["gaji"] += amt
        elif "kas mesjid" in desc or "kas masjid" in desc:
            mth[mk]["mesjid"] += amt
        else:
            mth[mk]["op"] += amt

print(f"{'Bulan':8} {'Income':>10} {'Gaji':>9} {'Mesjid':>9} {'Operas':>9} {'Pgluaran':>10} {'LABA':>10} {'SaldoAkum':>11}")
print("-" * 90)
saldo = 0.0
tot = {"income":0.0,"gaji":0.0,"mesjid":0.0,"op":0.0,"laba":0.0}
for mk in sorted(mth):
    d = mth[mk]
    peng = d["gaji"] + d["mesjid"] + d["op"]
    laba = d["income"] - peng
    saldo += laba
    tot["income"]+=d["income"]; tot["gaji"]+=d["gaji"]; tot["mesjid"]+=d["mesjid"]; tot["op"]+=d["op"]; tot["laba"]+=laba
    print(f"{mk:8} {d['income']:>10,.0f} {d['gaji']:>9,.0f} {d['mesjid']:>9,.0f} {d['op']:>9,.0f} {peng:>10,.0f} {laba:>10,.0f} {saldo:>11,.0f} | MDTAnulir={d['mdta_cancel']:,.0f}")

print("-" * 90)
print(f"{'TOTAL':8} {tot['income']:>10,.0f} {tot['gaji']:>9,.0f} {tot['mesjid']:>9,.0f} {tot['op']:>9,.0f} {'':>10} {tot['laba']:>10,.0f} {saldo:>11,.0f}")