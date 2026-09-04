import json

# pakai data FRESH (isi-database.json) yang punya Agustus
with open("isi-database.json", encoding="utf-8") as f:
    db = json.load(f)
fin = db["tables"]["finances"]["rows"]

print("=== SEMUA income bulan AGUSTUS 2026 ===")
aug_income = [f for f in fin if (f.get("date") or "")[:7] == "2026-08" and f["type"] == "income"]
for f in sorted(aug_income, key=lambda x: x["date"]):
    marker = ""
    if "juli 2026" in f["description"].lower() and "iuran" in f["description"].lower():
        marker = "  ← TUNGGAKAN (bayar utk JULI di bulan Agustus)"
    print(f"  {f['date'][:10]} | Rp {f['amount']:>6} | {f['description'][:60]}{marker}")

print(f"\nTotal income Agustus: {len(aug_income)} transaksi")
print(f"  iuran 'bulan Juli' (tunggakan utk laporan Agustus): "
      f"{sum(1 for f in aug_income if 'bulan juli 2026' in f['description'].lower())}")