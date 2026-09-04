import json

with open("isi-database-jan-jul.json", encoding="utf-8") as f:
    db = json.load(f)
finances = db["tables"]["finances"]["rows"]

# Cari transaksi finance Azril
print("=== Transaksi finance Azril Shidqi Iskandad ===")
for f in finances:
    if "azril shidqi" in f["description"].lower():
        print(f"  db:date={f['date'][:10]} | type={f['type']} | Rp {f['amount']} | {f['description']}")

print("\n=== Semua income 'iuran bulan Juli' di finances merge (Juli) ===")
fin_jul = [f for f in finances if f["type"]=="income" and "iuran" in f["description"].lower() and "bulan juli 2026" in f["description"].lower()]
print(f"  Count: {len(fin_jul)}, Total: Rp {sum(int(float(f['amount'])) for f in fin_jul):,}")

# Cek anomali yang date-nya bukan Juli
print("\n=== Iuran Juli tapi date != 2026-07 (dari SEMUA data, bukan cuma merge) ===")
# pakai dump-manual.sql? atau cek di fresh isi-database.json (full)
with open("isi-database.json", encoding="utf-8") as f2:
    full = json.load(f2)
all_fin = full["tables"]["finances"]["rows"]
for f in all_fin:
    d = f.get("description","")
    if f["type"]=="income" and "iuran" in d.lower() and "bulan juli 2026" in d.lower():
        if (f.get("date") or "")[:7] != "2026-07":
            print(f"  date={f['date'][:10]} | Rp {f['amount']} | {d}")