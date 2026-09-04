import json
from collections import defaultdict

with open("isi-database-jan-jul.json", encoding="utf-8") as f:
    db = json.load(f)
tables = db["tables"]

students = tables["students"]["rows"]
payments = tables["payments"]["rows"]
finances = tables["finances"]["rows"]

# ── STUDENTS: distribusi per kelas ──
print("=" * 60)
print("1. JUMLAH MURID per KELAS (students table)")
print("=" * 60)
by_class = defaultdict(lambda: {"all": 0, "active": 0, "inactive": 0})
for s in students:
    cls = str(s.get("class", "")).strip()
    by_class[cls]["all"] += 1
    if s.get("status") == "active":
        by_class[cls]["active"] += 1
    else:
        by_class[cls]["inactive"] += 1
for cls in sorted(by_class, key=lambda c: (len(c) != 1, c)):
    d = by_class[cls]
    print(f"  Kelas {cls!r}: total={d['all']} active={d['active']} inactive={d['inactive']}")
tot_all = sum(d['all'] for d in by_class.values())
tot_active = sum(d['active'] for d in by_class.values())
print(f"  ALL: {tot_all} | ACTIVE: {tot_active}")

# ── PAYMENTS: siapa yang bayar iuran bulan Juli ∙ tahun 2026 ──
print("\n" + "=" * 60)
print("2. PAYMENTS bulan Juli (month=7, year=2026)")
print("=" * 60)
pay_jul = [p for p in payments if p.get("month") == 7 and p.get("year") == 2026]
paid = [p for p in pay_jul if p.get("is_paid")]
unpaid = [p for p in pay_jul if not p.get("is_paid")]
print(f"  Total payment records Juli: {len(pay_jul)}")
print(f"  is_paid=True : {len(paid)}")
print(f"  is_paid=False: {len(unpaid)}")

# map payment → student name
sid2name = {s["id"]: s["name"] for s in students}
sid2class = {s["id"]: s.get("class") for s in students}

print("\n  Daftar siswa dgn payment Juli 'is_paid':")
paid_names = {}
for p in paid:
    name = sid2name.get(p["student_id"], "??")
    paid_names[p["student_id"]] = name
for n in sorted(paid_names.values()):
    print(f"    - {n}")

# ── FINANCES: transaksi 'iuran bulan Juli 2026' ──
print("\n" + "=" * 60)
print("3. FINANCES: income 'iuran ... bulan Juli 2026'")
print("=" * 60)
fin_jul = [f for f in finances
           if f["type"] == "income" and "iuran" in f["description"].lower() and "bulan juli 2026" in f["description"].lower()]
print(f"  Jumlah transaksi income iuran Juli: {len(fin_jul)}")
print(f"  Total nominal: Rp {sum(int(float(f['amount'])) for f in fin_jul):,}")

# ── CATATAN tanggal 3/8 (Azril) ──
print("\n" + "=" * 60)
print("4. Anomali: iuran Juli tapi dibayar di bulan lain")
print("=" * 60)
for f in finances:
    d = f.get("description", "")
    if f["type"] == "income" and "iuran" in d.lower() and "bulan juli 2026" in d.lower():
        if (f.get("date") or "")[:7] != "2026-07":
            print(f"  ⚠️  {f['date'][:10]} | {d}")