#!/usr/bin/env python3
"""Bandingkan isi-database.json vs restore-iuran-full.sql — cari perbedaan AKURAT.
Hanya bandingkan PRIMARY KEY ID (UUID pertama di setiap row)."""
import json, re
from pathlib import Path
from collections import defaultdict

BASE = Path(__file__).resolve().parent

# ── 1. Load JSON ──────────────────────────────────────────────────
with open(BASE / "isi-database.json", encoding="utf-8") as f:
    js = json.load(f)

json_tables = {}
for tname, tdata in js["tables"].items():
    rows = tdata["rows"]
    json_tables[tname] = {row["id"]: row for row in rows if row.get("id")}

# ── 2. Extract primary-key IDs from SQL (FIRST UUID per row only) ──
sql_path = BASE / "restore-iuran-full.sql"
sql = sql_path.read_text(encoding="utf-8")

UUID_RE = re.compile(r"'([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'")

sql_pk = defaultdict(set)  # table_name → {pk_id, ...}

for m in re.finditer(
    r"INSERT INTO\s+public\.\"?(\w+)\"?\s*\(([^)]+)\)\s*VALUES\s*(.*?);",
    sql, re.DOTALL | re.IGNORECASE
):
    tname = m.group(1)
    val_block = m.group(3)
    
    # Parse individual rows by tracking parenthesis depth
    rows_text = []
    depth = 0
    buf = ""
    for ch in val_block:
        if ch == '(' and depth == 0:
            buf = ""
            depth = 1
        elif ch == '(' and depth > 0:
            buf += ch
            depth += 1
        elif ch == ')' and depth > 1:
            buf += ch
            depth -= 1
        elif ch == ')' and depth == 1:
            rows_text.append(buf)
            buf = ""
            depth = 0
        elif depth > 0:
            buf += ch
    
    for row_text in rows_text:
        # Extract FIRST UUID — that's the primary key
        first_uuid = UUID_RE.search(row_text)
        if first_uuid:
            sql_pk[tname].add(first_uuid.group(1))

# ── 3. COMPARE ────────────────────────────────────────────────────
print("=" * 72)
print("INTEGRITY CHECK: isi-database.json vs restore-iuran-full.sql")
print("(Hanya Primary Key IDs yang dibandingkan - akurat)")
print("=" * 72)

tables_to_check = ["students", "payments", "finances", "activity_logs", "settings", "profiles", "tabungan", "tabungan_transaksi"]

for tname in tables_to_check:
    jrows = json_tables.get(tname, {})
    sids = sql_pk.get(tname, set())
    jids = set(jrows.keys())
    
    only_in_json = jids - sids
    only_in_sql = sids - jids
    common = jids & sids
    
    print(f"\n{'─'*60}")
    print(f"📋 {tname}")
    print(f"   JSON: {len(jids)} records  |  SQL: {len(sids)} records  |  Cocok: {len(common)}")
    
    if only_in_json:
        print(f"\n   🔶 Hanya di JSON (+{len(only_in_json)}):")
        for rid in sorted(only_in_json)[:20]:
            row = jrows[rid]
            if tname == "students":
                print(f"      · {rid[:8]}…  {row.get('name','?'):<35} kelas={row.get('class','?'):<5} status={row.get('status','?')}")
            elif tname == "payments":
                print(f"      · {rid[:8]}…  siswa={str(row.get('student_id','?'))[:8]}…  {row.get('month','?')}/{row.get('year','?')}  {'LUNAS' if row.get('is_paid') else 'BELUM'}")
            elif tname == "finances":
                d = row.get('date','') or ''
                print(f"      · {rid[:8]}…  {str(d)[:10]:<10} {str(row.get('type','?')):<7} Rp {int(row.get('amount',0)):>8,}  {row.get('description','')[:55]}")
            elif tname == "activity_logs":
                print(f"      · {rid[:8]}…  {str(row.get('action',''))[:30]} → {str(row.get('description',''))[:50]}")
            else:
                print(f"      · {rid[:8]}…")
        if len(only_in_json) > 20:
            print(f"      … (+{len(only_in_json)-20} more)")
    
    if only_in_sql:
        print(f"\n   🔶 Hanya di SQL (+{len(only_in_sql)}):")
        for rid in sorted(only_in_sql)[:20]:
            print(f"      · {rid[:8]}…")
        if len(only_in_sql) > 20:
            print(f"      … (+{len(only_in_sql)-20} more)")
    
    if not only_in_json and not only_in_sql:
        print(f"   ✅ IDENTIK")

# ── 4. Summary ─────────────────────────────────────────────────────
print(f"\n{'='*72}")
print("RINGKASAN PERBEDAAN")
print("=" * 72)

total_diff = 0
for tname in tables_to_check:
    jrows = json_tables.get(tname, {})
    sids = sql_pk.get(tname, set())
    jids = set(jrows.keys())
    
    diff_json = len(jids - sids)
    diff_sql = len(sids - jids)
    if diff_json or diff_sql:
        total_diff += diff_json + diff_sql
        if diff_json and diff_sql:
            print(f"  ❌ {tname}: +{diff_json} di JSON, +{diff_sql} di SQL")
        elif diff_json:
            print(f"  ❌ {tname}: +{diff_json} di JSON")
        elif diff_sql:
            print(f"  ❌ {tname}: +{diff_sql} di SQL")
    else:
        print(f"  ✅ {tname}: identik")

print(f"\n  {'─'*40}")
if total_diff == 0:
    print(f"  ✅ TIDAK ADA PERBEDAAN — kedua database identik")
else:
    print(f"  ⚠️  DITEMUKAN {total_diff} PERBEDAAN ID")

# ── 5. Timestamps & sumber ────────────────────────────────────────
sql_ts_match = re.search(r"-- Tanggal:\s*(.*?)\n", sql)
sql_ts = sql_ts_match.group(1).strip() if sql_ts_match else "N/A"
json_ts = js.get("exported_at", "N/A")

print(f"\n📅 Timeline:")
print(f"   SQL dump:    {sql_ts}")
print(f"   JSON export: {json_ts}")
print("=" * 72)
