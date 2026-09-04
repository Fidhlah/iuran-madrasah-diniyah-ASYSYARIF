import json

with open('isi-database-backup-janjun.json', 'r', encoding='utf-8') as f:
    old = json.load(f)
with open('isi-database.json', 'r', encoding='utf-8') as f:
    new = json.load(f)

old_fin = old['tables']['finances']['rows']
new_fin = new['tables']['finances']['rows']

# Index by id
old_by_id = {r['id']: r for r in old_fin}
new_by_id = {r['id']: r for r in new_fin}

print("=== Transaksi di OLD tapi TIDAK di NEW (Feb & bulan lain) ===")
for rid in sorted(set(old_by_id) - set(new_by_id)):
    r = old_by_id[rid]
    print(f"  {r.get('date','')[:10]} | {r['type']:7} | {r['amount']:>10} | {r['description'][:80]}")

print("\n=== Transaksi di NEW tapi TIDAK di OLD (selain Juli) ===")
for rid in sorted(set(new_by_id) - set(old_by_id)):
    r = new_by_id[rid]
    dt = r.get('date', '')
    if dt[:7] == '2026-07':
        continue
    print(f"  {dt[:10]} | {r['type']:7} | {r['amount']:>10} | {r['description'][:80]}")

print("\n=== Perbedaan nilai untuk ID yang sama ===")
for rid in sorted(set(old_by_id) & set(new_by_id)):
    o = old_by_id[rid]
    n = new_by_id[rid]
    diffs = []
    for k in set(o) | set(n):
        if o.get(k) != n.get(k):
            diffs.append(f"{k}: old={o.get(k)!r} new={n.get(k)!r}")
    if diffs:
        print(f"  {rid[:8]} ({o.get('description','')[:50]}):")
        for d in diffs[:6]:
            print(f"     {d}")
