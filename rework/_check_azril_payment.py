import json

with open("isi-database-jan-jul.json", encoding="utf-8") as f:
    db = json.load(f)
students = db["tables"]["students"]["rows"]
payments = db["tables"]["payments"]["rows"]

sid2name = {s["id"]: s["name"] for s in students}

print("=== SEMUA PAYMENT Azril Shidqi Iskandad ===")
for p in payments:
    name = sid2name.get(p["student_id"], "?")
    if "azril shidqi" in name.lower():
        status = "LUNAS" if p.get("is_paid") else "BELUM"
        paid_at = (p.get("paid_at") or "")[:10]
        print(f"  Bulan {p.get('month')}/{p.get('year')} | amount=Rp {p.get('amount')} | {status} | paid_at={paid_at}")

print("\n=== Alur pembayaran Azril Juli ===")
# payment Juli exists & is_paid?
pay_jul = [p for p in payments if sid2name.get(p["student_id"],"").lower().startswith("azril shidqi")
           and p.get("month")==7 and p.get("year")==2026]
for p in pay_jul:
    print(f"  Payment Juli: is_paid={p.get('is_paid')} paid_at={(p.get('paid_at') or '')[:10]}")