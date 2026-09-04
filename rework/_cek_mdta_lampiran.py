import json

with open("isi-database-jan-jul.json", encoding="utf-8") as f:
    db = json.load(f)
fin = db["tables"]["finances"]["rows"]
jul = [r for r in fin if (r.get("date") or "")[:7] == "2026-07"]

# Cari transaksi Kas MDTA di Juli
print("=== SEMUA transaksi Juli yang mengandung 'Kas MDTA' / alokasi ===")
for r in jul:
    d = r["description"]
    if "kas mdta" in d.lower() or "alokasi" in d.lower():
        print(f"  id={r['id'][:8]} | {r['date'][:10]} | type={r['type']} | Rp {r['amount']} | {d}")

# Total jumlah transaksi Juli
print(f"\nTotal transaksi Juli: {len(jul)}")
print(f"  income: {sum(1 for r in jul if r['type']=='income')}")
print(f"  expense: {sum(1 for r in jul if r['type']=='expense')}")

# Hitung ulang yang harus tampil di Lampiran (harusnya 68)
print("\n=== Semua transaksi Juli (yang tampil di Lampiran) ===")
for i, r in enumerate(sorted(jul, key=lambda x: (x['date'][:10], 0 if x['type']=='expense' else 1), reverse=True), 1):
    tipe = "Pemasukan" if r["type"] == "income" else "Pengeluaran"
    marker = "  <<< KAS MDTA ALOKASI" if "kas mdta" in r["description"].lower() else ""
    print(f"  {i:2}. {r['date'][:10]} | {tipe:10} | Rp {int(float(r['amount'])):>9,} | {r['description'][:45]}{marker}")