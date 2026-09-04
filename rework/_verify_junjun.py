import json
from collections import defaultdict

with open('isi-database-backup-janjun.json', 'r', encoding='utf-8') as f:
    old = json.load(f)
with open('isi-database.json', 'r', encoding='utf-8') as f:
    new = json.load(f)

old_fin = old['tables']['finances']['rows']
new_fin = new['tables']['finances']['rows']

def txn_map(rows):
    """Return {id: row, ...} dan daftar transaksi Jan-Jun"""
    return {r['id']: r for r in rows}

old_m = txn_map(old_fin)
new_m = txn_map(new_fin)

# Bandingkan Jan-Jun saja (date 2026-01 s.d 2026-06)
def jan_jun(rows):
    return [r for r in rows if (r.get('date') or '')[:7] in [f'2026-{m:02d}' for m in range(1,7)]]

old_jj = jan_jun(old_fin)
new_jj = jan_jun(new_fin)

print(f"Jan-Jun: old {len(old_jj)} transaksi, new {len(new_jj)} transaksi")

# ID di old tapi tidak di new (Jan-Jun)
old_ids = set(old_m.keys())
new_ids = set(new_m.keys())
only_old = sorted(old_ids - new_ids)
only_new = sorted(new_ids - old_ids)

print(f"\nID hanya di OLD (Jan-Jun): {len(only_old)}")
for rid in only_old:
    r = old_m[rid]
    print(f"   {r.get('date','')[:10]} | {r['type']:7} | {r['amount']:>10} | {r['description'][:70]}")

print(f"\nID hanya di NEW tapi bulan Jan-Jun: {len([r for r in only_new if new_m[r].get('date','')[:7] in [f'2026-{m:02d}' for m in range(1,7)]])}")
for rid in sorted([r for r in only_new if new_m[r].get('date','')[:7] in [f'2026-{m:02d}' for m in range(1,7)]]):
    r = new_m[rid]
    print(f"   {r.get('date','')[:10]} | {r['type']:7} | {r['amount']:>10} | {r['description'][:70]}")

# Perbedaan nilai utk ID yg sama di Jan-Jun
print("\nPerbedaan nilai (ID sama, Jan-Jun):")
count = 0
for rid in sorted(old_ids & new_ids):
    o = old_m[rid]
    n = new_m[rid]
    if (o.get('date') or '')[:7] not in [f'2026-{m:02d}' for m in range(1,7)]:
        continue
    diffs = []
    for k in set(o) | set(n):
        if o.get(k) != n.get(k):
            diffs.append(k)
    if diffs:
        count += 1
        print(f"   {rid[:8]} {o.get('description','')[:40]}: {diffs}")
print(f"   → {count} transaksi punya beda nilai")