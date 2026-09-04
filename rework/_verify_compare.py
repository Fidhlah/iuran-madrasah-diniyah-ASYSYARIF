import json
from collections import defaultdict

with open('isi-database-backup-janjun.json', 'r', encoding='utf-8') as f:
    old = json.load(f)
with open('isi-database.json', 'r', encoding='utf-8') as f:
    new = json.load(f)

def month_summary(rows):
    m = defaultdict(lambda: {'in': 0, 'out': 0})
    for r in rows:
        key = (r.get('date') or '')[:7]
        amt = int(float(r.get('amount') or 0))
        if r['type'] == 'income':
            m[key]['in'] += amt
        else:
            m[key]['out'] += amt
    return m

old_fin = old['tables']['finances']['rows']
new_fin = new['tables']['finances']['rows']

mo = month_summary(old_fin)
mn = month_summary(new_fin)

print("=== PEMASUKAN per bulan: OLD vs NEW ===")
for k in sorted(set(list(mo.keys()) + list(mn.keys()))):
    o, n = mo.get(k, {}), mn.get(k, {})
    match = "OK" if o == n else "DIFFER"
    print(f"  {k}: old {o.get('in',0):>10,} | new {n.get('in',0):>10,} | {match}")

print("\n=== PENGELUARAN per bulan: OLD vs NEW ===")
for k in sorted(set(list(mo.keys()) + list(mn.keys()))):
    o, n = mo.get(k, {}), mn.get(k, {})
    match = "OK" if o == n else "DIFFER"
    print(f"  {k}: old {o.get('out',0):>10,} | new {n.get('out',0):>10,} | {match}")

print("\n=== COUNT per table ===")
for t in ['activity_logs', 'settings', 'students', 'payments', 'finances', 'profiles']:
    o = len(old['tables'][t]['rows'])
    n = len(new['tables'][t]['rows'])
    print(f"  {t}: old {o} -> new {n} (+{n-o})")

# Cek format amount & date
print("\n=== FORMAT CHECK ===")
r_old = old['tables']['finances']['rows'][0]
r_new = new['tables']['finances']['rows'][0]
print(f"  old amount: {r_old['amount']!r} ({type(r_old['amount']).__name__})")
print(f"  new amount: {r_new['amount']!r} ({type(r_new['amount']).__name__})")
print(f"  old date:   {r_old['date']!r}")
print(f"  new date:   {r_new['date']!r}")
