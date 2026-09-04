import json
import docx

# ── Ambil daftar dari DOCX Lampiran ──
doc = docx.Document(r"D:\fidh\Asysyarif\Dokumen\Keuangan\Iuran Bulanan\Juli 2026\Laporan Iuran Bulanan Juli 2026.docx")
# lampiran = tabel terakhir
lamp = doc.tables[-1]
docx_rows = []
for r in lamp.rows[1:]:
    cells = [c.text.strip() for c in r.cells]
    if len(cells) >= 5 and cells[0].isdigit():
        docx_rows.append({"no": cells[0], "nama": cells[1], "kelas": cells[2], "nominal": cells[3], "tgl": cells[4]})
print(f"DOCX Lampiran: {len(docx_rows)} siswa")

# ── Ambil daftar dari DB payments Juli ──
with open("isi-database-jan-jul.json", encoding="utf-8") as f:
    db = json.load(f)
tables = db["tables"]
students = tables["students"]["rows"]
payments = tables["payments"]["rows"]

sid2name = {s["id"]: s["name"].strip() for s in students}
sid2class = {s["id"]: str(s.get("class", "")).strip() for s in students}
pay_jul = [p for p in payments if p.get("month") == 7 and p.get("year") == 2026 and p.get("is_paid")]
db_names = sorted({sid2name.get(p["student_id"], "") for p in pay_jul})
print(f"DB payments Juli: {len(pay_jul)} siswa")

# ── Bandingkan NAMA ──
docx_names = sorted({r["nama"] for r in docx_rows})
only_docx = sorted(set(docx_names) - set(db_names))
only_db = sorted(set(db_names) - set(docx_names))
print(f"\n  Di DOCX tapi tidak di DB: {len(only_docx)}")
for n in only_docx:
    print(f"    ❌ {n!r}")
print(f"  Di DB tapi tidak di DOCX: {len(only_db)}")
for n in only_db:
    print(f"    ❌ {n!r}")

# ── Bandingkan per baris: kelas & nominal & jumlah ──
print("\n=== CEK KELAS + NOMINAL per siswa ===")
issues = 0
db_by_name = {}
for p in pay_jul:
    nm = sid2name.get(p["student_id"], "")
    db_by_name.setdefault(nm, {"class": sid2class.get(p["student_id"], ""), "amount": p.get("amount")})

for r in docx_rows:
    nm = r["nama"]
    if nm not in db_by_name:
        issues += 1
        print(f"  ❌ {nm}: tidak ada di DB payments")
        continue
    d = db_by_name[nm]
    if str(d["class"]) != r["kelas"]:
        issues += 1
        print(f"  ❌ {nm}: kelas DOCX={r['kelas']} DB={d['class']}")
    if str(d["amount"]).replace(".0","") != r["nominal"].replace(".0",""):
        issues += 1
        print(f"  ❌ {nm}: nominal DOCX={r['nominal']} DB={d['amount']}")

# jumlah transaksi DOCX vs DB
print(f"\n  Total DOCX: {len(docx_rows)} | Total DB: {len(pay_jul)} | Issue: {issues}")

# ── Ringkasan total ──
docx_total = sum(int(r["nominal"]) for r in docx_rows)
print(f"\n  Total nominal DOCX: Rp {docx_total:,} | DB: Rp {len(pay_jul)*50000:,}")
print(f"  Jumlah murid aktif: {sum(1 for s in students if s.get('status')=='active')}")

# ── Per kelas di DOCX ──
from collections import Counter
c_docx = Counter(r["kelas"] for r in docx_rows)
c_db = Counter(sid2class.get(p["student_id"],"") for p in pay_jul)
print("\n  Per kelas DOCX:", dict(sorted(c_docx.items(), key=lambda x: str(x[0]))))
print("  Per kelas DB:  ", dict(sorted(c_db.items(), key=lambda x: str(x[0]))))