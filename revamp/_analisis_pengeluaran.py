"""Analisis distribusi pengeluaran nyata per bulan & pola deskripsi — basis untuk kategori."""
import json, re
from pathlib import Path
from collections import defaultdict

d = json.load(open(r"D:/fidh/Coding/Madrasah/iuran-asysyarif/revamp/data/backup-dev-setelah-migration.json", encoding="utf-8"))
fin = d["tables"]["finances"]["rows"]

exp = [f for f in fin if f["type"]=="expense"]
print(f"Total expense: {len(exp)}\n")

# group by deskripsi inti
buckets = defaultdict(lambda: {"count":0,"total":0.0,"months":set(),"samples":[]})
for f in exp:
    desc = (f.get("description") or "").lower()
    amt = float(f["amount"])
    ym = (f.get("date") or "")[:7]
    if any(w in desc for w in ["guru","honor","pembayaran guru"]):
        k="Gaji/Honor Guru"; v="honor"
    elif "kas masjid" in desc or "kas mesjid" in desc:
        k="Kas Masjid"; v="mesjid"
    elif any(w in desc for w in ["spidol","pulpen","buku","fotocopy","photo copy","print","brosur","amplop","formulir","kwarto"]):
        k="Operasional (ATK/print/fotokopi)"
        v="operasional"
    elif "seragam" in desc:
        k="Seragam"
        v="seragam"
    elif "mdta" in desc:
        k="MDTA"
        v="mdta"
    else:
        k="Operasional/Lain"
        v="lain"
    buckets[k]["count"]+=1; buckets[k]["total"]+=amt; buckets[k]["months"].add(ym)
    if len(buckets[k]["samples"])<3: buckets[k]["samples"].append(f["description"])

for k, b in sorted(buckets.items(), key=lambda x:-x[1]["total"]):
    print(f"{k:22} | {b['count']:>3} trans | {b['total']:>12,.0f} | bulan={len(b['months'])} | {sorted(b['months'])}")
    for s in b["samples"]:
        print(f"      ex: {s[:50]}")