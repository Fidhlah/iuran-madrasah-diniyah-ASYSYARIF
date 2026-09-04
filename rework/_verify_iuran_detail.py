import json
from collections import defaultdict

with open("isi-database-jan-jul.json", encoding="utf-8") as f:
    db = json.load(f)
tables = db["tables"]

students = tables["students"]["rows"]
payments = tables["payments"]["rows"]
finances = tables["finances"]["rows"]

sid2name = {s["id"]: s["name"].strip() for s in students}
sid2class = {s["id"]: str(s.get("class", "")).strip() for s in students}

# ── Payments Juli per kelas ──
pay_jul = [p for p in payments if p.get("month") == 7 and p.get("year") == 2026 and p.get("is_paid")]

paid_by_class = defaultdict(list)
for p in pay_jul:
    cls = sid2class.get(p["student_id"], "?")
    paid_by_class[cls].append(sid2name.get(p["student_id"], "?"))

print("=" * 60)
print("PEMBAYAR Juli per KELAS (payments table)")
print("=" * 60)
for cls in ["PAUD", "TK", "1", "2"]:
    names = sorted(paid_by_class.get(cls, []))
    print(f"\n  Kelas {cls}: {len(names)} bayar")
    for n in names:
        print(f"    - {n}")

# ── Finances income iuran Juli per kelas ──
fin_jul = [f for f in finances
           if f["type"] == "income" and "iuran" in f["description"].lower() and "bulan juli 2026" in f["description"].lower()]
print("\n" + "=" * 60)
print("FINANCES iuran Juli: 51 transaksi — daftar")
print("=" * 60)
fin_names = []
for f in sorted(fin_jul, key=lambda x: x["date"]):
    # extract name from description "X membayar iuran bulan Juli 2026"
    desc = f["description"]
    name = desc.split(" membayar iuran")[0].strip()
    fin_names.append((name, f["date"][:10]))
    print(f"    {f['date'][:10]} | {name}")

# ── Bandingkan: siapa di payments tapi TIDAK di finances, dan sebaliknya ──
pay_names = set(sid2name.get(p["student_id"], "") for p in pay_jul)
fin_name_set = set(n for n, _ in fin_names)

print("\n" + "=" * 60)
print("BANDING payments vs finances")
print("=" * 60)
only_pay = sorted(pay_names - fin_name_set)
only_fin = sorted(fin_name_set - pay_names)
print(f"  Di PAYMENTS tapi TIDAK di FINANCES ({len(only_pay)}): {only_pay}")
print(f"  Di FINANCES tapi TIDAK di PAYMENTS ({len(only_fin)}): {only_fin}")

# ── Per kelas: belum bayar ──
print("\n" + "=" * 60)
print("BELUM BAYAR per kelas (active - paid)")
print("=" * 60)
active_by_class = defaultdict(int)
for s in students:
    if s.get("status") == "active":
        cls = str(s.get("class", "")).strip()
        active_by_class[cls] += 1
for cls in ["PAUD", "TK", "1", "2"]:
    active = active_by_class.get(cls, 0)
    paid = len(paid_by_class.get(cls, []))
    print(f"  Kelas {cls}: active={active} paid={paid} belum={active-paid}")

# ── Students yang belum bayar (active, no payment July) ──
print("\n  Daftar siswa BELUM bayar Juli (active, tidak ada payment July is_paid):")
paid_sids = set(p["student_id"] for p in pay_jul)
for s in students:
    if s.get("status") == "active":
        if s["id"] not in paid_sids:
            print(f"    - [{s.get('class')}] {s['name'].strip()}")