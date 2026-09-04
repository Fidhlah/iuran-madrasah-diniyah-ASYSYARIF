#!/usr/bin/env python3
"""Generate laporan-keuangan-full.html from isi-database.json"""
import json, math
from datetime import datetime
from collections import defaultdict, OrderedDict
from pathlib import Path

DATA = Path(__file__).resolve().parent / "isi-database.json"
OUT  = Path(__file__).resolve().parent.parent / "laporan-keuangan-full.html"

with open(DATA, encoding="utf-8") as f:
    db = json.load(f)
finances = db["tables"]["finances"]["rows"]

def parse_dt(s):
    if s:
        try: return datetime.fromisoformat(s.replace("Z",""))
        except: return None
    return None

def classify(desc, typ):
    dl = desc.lower()
    if typ == "income":
        if "kas mdta" in dl: return "Pemasukan Langsung MDTA", "#059669"
        elif "infaq" in dl:  return "Infaq", "#7c3aed"
        else:                return "Iuran Siswa", "#2563eb"
    else:  # expense
        if "gaji" in dl or "honor" in dl or "pembayaran guru" in dl or dl.startswith("guru"):
            return "Gaji & Honor Guru", "#dc2626"
        elif "kas mesjid" in dl or "kas masjid" in dl:
            return "Kas Mesjid", "#d97706"
        elif "kas mdta" in dl and "diambil" not in dl:
            return "Alokasi Kas MDTA", "#10B981"
        elif "diambil" in dl:
            return "Belanja MDTA", "#ef4444"
        elif "seragam" in dl:
            return "Operasional (Seragam)", "#f97316"
        else:
            return "Operasional Lain", "#64748b"

def F(n):
    if n >= 0: return f"Rp {n:,}"
    else: return f"−Rp {abs(n):,}"

# ---- process ----
monthly = OrderedDict()
cats_inc = defaultdict(lambda: {"total": 0, "count": 0})
cats_exp = defaultdict(lambda: {"total": 0, "count": 0})
all_tx = []

for f in finances:
    dt = parse_dt(f.get("date"))
    if not dt: continue
    m = dt.strftime("%Y-%m")
    if m not in monthly:
        monthly[m] = {"label": dt.strftime("%B %Y"), "inc": 0, "exp": 0, "by_cat": defaultdict(lambda: 0)}
    desc = (f.get("description") or "").strip()
    amt = int(f["amount"])
    typ = f["type"]
    cat, col = classify(desc, typ)

    if typ == "income":
        monthly[m]["inc"] += amt
        cats_inc[cat]["total"] += amt
        cats_inc[cat]["count"] += 1
    else:
        monthly[m]["exp"] += amt
        cats_exp[cat]["total"] += amt
        cats_exp[cat]["count"] += 1

    monthly[m]["by_cat"][cat] += amt
    all_tx.append({"date": dt, "m": m, "desc": desc, "amt": amt, "typ": typ, "cat": cat, "col": col})

# Add Feb 350k allocation (user-confirmed)
feb_key = "2026-02"
if feb_key in monthly:
    monthly[feb_key]["exp"] += 350000
    monthly[feb_key]["by_cat"]["Alokasi Kas MDTA"] += 350000
    cats_exp["Alokasi Kas MDTA"]["total"] += 350000
    cats_exp["Alokasi Kas MDTA"]["count"] += 1
    all_tx.append({"date": datetime(2026,2,1), "m": feb_key, "desc": "Alokasi Kas MDTA Bulan Februari 2026 (dikonfirmasi admin)", "amt": 350000, "typ": "expense", "cat": "Alokasi Kas MDTA", "col": "#10B981"})

all_tx.sort(key=lambda x: x["date"])

# Running balance
run = 0
for m in monthly:
    monthly[m]["net"] = monthly[m]["inc"] - monthly[m]["exp"]
    run += monthly[m]["net"]
    monthly[m]["running"] = run

total_inc = sum(m["inc"] for m in monthly.values())
total_exp = sum(m["exp"] for m in monthly.values())
total_net_buku = total_inc - total_exp  # recorded balance (includes mdta_alloc as expense)

# True cash on hand: mdta_alloc should NOT be subtracted (it's a transfer, not expense)
total_mdta_alloc_val = cats_exp.get("Alokasi Kas MDTA", {}).get("total", 0)
total_cash = total_inc - (total_exp - total_mdta_alloc_val)  # cash excluding transfers

# ---- highlights ----
max_inc_month = max(monthly, key=lambda m: monthly[m]["inc"])
max_exp_month = max(monthly, key=lambda m: monthly[m]["exp"])
avg_inc = total_inc // len(monthly)
avg_exp = total_exp // len(monthly)
top_exp_cat = max(cats_exp, key=lambda c: cats_exp[c]["total"])
top_inc_cat = max(cats_inc, key=lambda c: cats_inc[c]["total"])
pct_gaji = cats_exp.get("Gaji & Honor Guru", {}).get("total", 0) / total_exp * 100 if total_exp else 0
pct_mesjid = cats_exp.get("Kas Mesjid", {}).get("total", 0) / total_exp * 100 if total_exp else 0
pct_mdta_alloc = cats_exp.get("Alokasi Kas MDTA", {}).get("total", 0) / total_exp * 100 if total_exp else 0
pct_operasional = (cats_exp.get("Operasional Lain", {}).get("total", 0) + cats_exp.get("Operasional (Seragam)", {}).get("total", 0)) / total_exp * 100 if total_exp else 0

# ---- MDTA calc ----
total_mdta_alloc = cats_exp.get("Alokasi Kas MDTA", {}).get("total", 0)
total_mdta_spend = cats_exp.get("Belanja MDTA", {}).get("total", 0)
total_mdta_dinc = cats_inc.get("Pemasukan Langsung MDTA", {}).get("total", 0)
total_mdta_balance = total_mdta_alloc + total_mdta_dinc - total_mdta_spend

# ---- Build HTML ----

# Cards
cards_html = f"""<div class="cards">
  <div class="card"><div class="label">💰 Total Pemasukan</div><div class="value green">{F(total_inc)}</div></div>
  <div class="card"><div class="label">📤 Total Pengeluaran</div><div class="value red">{F(total_exp)}</div></div>
  <div class="card"><div class="label">📊 Saldo Akhir (Pembukuan)</div><div class="value blue">{F(total_net_buku)}</div></div>
  <div class="card"><div class="label">💵 Total Uang Tunai Riil</div><div class="value" style="color:#059669">{F(total_cash)}</div></div>
  <div class="card"><div class="label">📅 Rata-rata Pemasukan/Bulan</div><div class="value">{F(avg_inc)}</div></div>
  <div class="card"><div class="label">📅 Rata-rata Pengeluaran/Bulan</div><div class="value" style="color:#dc2626">{F(avg_exp)}</div></div>
</div>
<div class="cards">
  <div class="card"><div class="label">🏦 Kas Besar (General Fund)</div><div class="value purple">{F(total_cash - total_mdta_balance)}</div></div>
  <div class="card"><div class="label">📚 Kas MDTA</div><div class="value" style="color:#10B981">{F(total_mdta_balance)}</div></div>
  <div class="card"><div class="label">💳 Total Pemasukan</div><div class="value green">{F(total_inc)}</div></div>
</div>"""

# Monthly table
max_run = max(abs(monthly[m]["running"]) for m in monthly) or 1
month_rows = chart_rows = ""
for m in monthly:
    md = monthly[m]
    labs = md["label"][:3]
    pc = max(3, abs(md["running"])/max_run*100)
    cc = "#059669" if md["running"]>=0 else "#dc2626"
    chart_rows += f"""<div class="bar-row"><span class="bar-label">{labs}</span><div class="bar-track"><div class="bar-fill" style="width:{pc:.0f}%;background:{cc}"></div></div><span class="bar-amount">{F(md['running'])}</span></div>"""
    nc = "green" if md["net"]>=0 else "red"
    month_rows += f"""<tr><td>{md['label']}</td><td class="num">{F(md['inc'])}</td><td class="num">{F(md['exp'])}</td><td class="num {nc}">{'+' if md['net']>=0 else ''}{F(md['net'])}</td><td class="num running">{F(md['running'])}</td></tr>"""

# Category tables
def cat_table(data, typ):
    rows = ""
    sorted_cats = sorted(data.items(), key=lambda x: -x[1]["total"])
    total = sum(v["total"] for v in data.values())
    for cat, v in sorted_cats:
        pct = v["total"]/total*100 if total else 0
        bar = "█" * max(1, int(pct/5))
        rows += f"""<tr><td>{cat}</td><td class="num">{F(v['total'])}</td><td class="num">{v['count']}x</td><td class="num">{pct:.1f}%</td></tr>"""
    rows += f"""<tr class="total"><td><strong>TOTAL</strong></td><td class="num"><strong>{F(total)}</strong></td><td class="num"><strong>{sum(v['count'] for v in data.values())}x</strong></td><td class="num"><strong>100%</strong></td></tr>"""
    return rows

inc_cat_html = cat_table(cats_inc, "income")
exp_cat_html = cat_table(cats_exp, "expense")

# All transactions
detail = ""
for t in all_tx:
    icon = {"Iuran Siswa":"💳","Infaq":"💰","Pemasukan Langsung MDTA":"💰",
            "Gaji & Honor Guru":"👨‍🏫","Kas Mesjid":"🕌","Alokasi Kas MDTA":"📥",
            "Belanja MDTA":"📤","Operasional (Seragam)":"👕","Operasional Lain":"📄"}
    ic = icon.get(t["cat"], "📄")
    sg = "+" if t["typ"]=="income" else "−"
    cls = "income" if t["typ"]=="income" else "expense"
    detail += f"""<tr><td>{t['date'].strftime('%d/%m')}</td><td><span class="badge" style="background:{t['col']}18;color:{t['col']}">{ic} {t['cat']}</span></td><td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{t['desc'][:60]}{'…' if len(t['desc'])>60 else ''}</td><td class="num {cls}">{sg}{F(t['amt'])}</td></tr>"""

# Highlights
highlights = f"""<div class="highlights">
  <div class="hl-item"><span class="hl-icon">📌</span><strong>Total Pemasukan</strong> {F(total_inc)} dari {sum(v['count'] for v in cats_inc.values())} transaksi. Rata-rata <strong>{F(avg_inc)}/bulan</strong>.</div>
  <div class="hl-item"><span class="hl-icon">📌</span><strong>Total Pengeluaran</strong> {F(total_exp)} dari {sum(v['count'] for v in cats_exp.values())} transaksi. Rata-rata <strong>{F(avg_exp)}/bulan</strong>.</div>
  <div class="hl-item"><span class="hl-icon">📌</span><strong>Pemasukan Tertinggi:</strong> {monthly[max_inc_month]['label']} ({F(monthly[max_inc_month]['inc'])})</div>
  <div class="hl-item"><span class="hl-icon">📌</span><strong>Pengeluaran Tertinggi:</strong> {monthly[max_exp_month]['label']} ({F(monthly[max_exp_month]['exp'])})</div>
  <div class="hl-item"><span class="hl-icon">📌</span><strong>Kategori Pengeluaran Terbesar:</strong> {top_exp_cat} — {F(cats_exp[top_exp_cat]['total'])} ({cats_exp[top_exp_cat]['total']/total_exp*100:.1f}% dari total)</div>
  <div class="hl-item"><span class="hl-icon">📌</span><strong>Gaji Guru</strong> mengambil {pct_gaji:.1f}% dari total pengeluaran ({F(cats_exp.get('Gaji & Honor Guru',{}).get('total',0))}).</div>
  <div class="hl-item"><span class="hl-icon">📌</span><strong>Kas Mesjid</strong> mengambil {pct_mesjid:.1f}% ({F(cats_exp.get('Kas Mesjid',{}).get('total',0))}).</div>
  <div class="hl-item"><span class="hl-icon">📌</span><strong>Alokasi Kas MDTA</strong> mengambil {pct_mdta_alloc:.1f}% ({F(total_mdta_alloc)}). Namun ini <em>bukan</em> pengeluaran riil — hanya transfer ke sub-fund.</div>
  <div class="hl-item"><span class="hl-icon">📌</span><strong>Belanja Riil dari Kas MDTA:</strong> {F(total_mdta_spend)} (spidol, fotokopi). Sisa Kas MDTA: <strong>{F(total_mdta_balance)}</strong>.</div>
  <div class="hl-item"><span class="hl-icon">📌</span><strong>Total Uang Tunai (Kas Besar + Kas MDTA):</strong> {F(total_cash)}</div>
  <div class="hl-item"><span class="hl-icon">⚠️</span><strong>Catatan:</strong> Alokasi MDTA ({F(total_mdta_alloc)}) bukan pengeluaran riil — hanya transfer antar fund. Saldo pembukuan ({F(total_net_buku)}) lebih kecil {F(total_mdta_alloc)} dari uang tunai riil ({F(total_cash)}).<br>Rumus: <em>Uang Tunai Riil = Saldo Pembukuan + Alokasi MDTA</em> = {F(total_net_buku)} + {F(total_mdta_alloc)} = {F(total_cash)}</div>
</div>"""

# Insight bars
def insight_bar(label, pct, color):
    return f"""<div style="margin-bottom:6px"><div style="display:flex;justify-content:space-between;font-size:.78rem;margin-bottom:2px"><span>{label}</span><span>{pct:.1f}%</span></div><div style="height:18px;background:#e2e8f0;border-radius:9px;overflow:hidden"><div style="height:100%;width:{max(3,pct)}%;background:{color};border-radius:9px"></div></div></div>"""

html = f"""<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Laporan Keuangan Lengkap — Asy Syarif</title>
<style>
*,*::before,*::after {{ box-sizing:border-box; margin:0; padding:0; }}
body {{ font-family:'Segoe UI',system-ui,-apple-system,sans-serif; background:#f1f5f9; color:#1e293b; padding:20px; }}
h1 {{ font-size:1.35rem; margin-bottom:2px; }}
.subtitle {{ color:#64748b; font-size:.82rem; margin-bottom:16px; }}
h2 {{ font-size:1rem; margin-bottom:8px; margin-top:20px; }}
.section {{ background:#fff; border-radius:12px; border:1px solid #e2e8f0; padding:16px; margin-bottom:16px; }}
.cards {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(155px,1fr)); gap:8px; margin-bottom:12px; }}
.card {{ background:#fff; border-radius:12px; border:1px solid #e2e8f0; padding:12px 14px; }}
.card .label {{ font-size:.68rem; text-transform:uppercase; letter-spacing:.04em; color:#64748b; margin-bottom:3px; }}
.card .value {{ font-size:1.2rem; font-weight:700; }}
.green {{ color:#059669; }} .red {{ color:#dc2626; }} .blue {{ color:#2563eb; }} .purple {{ color:#7c3aed; }}
.table-wrap {{ overflow-x:auto; }}
table {{ width:100%; border-collapse:collapse; font-size:.8rem; }}
th,td {{ text-align:left; padding:6px 8px; border-bottom:1px solid #f1f5f9; }}
th {{ background:#f8fafc; font-weight:600; font-size:.68rem; text-transform:uppercase; color:#475569; white-space:nowrap; }}
td.num {{ text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }}
td.income {{ color:#059669; }} td.expense {{ color:#dc2626; }}
td.green {{ color:#059669; font-weight:600; }} td.red {{ color:#dc2626; font-weight:600; }}
td.running {{ font-weight:700; color:#2563eb; }}
tr.total td {{ border-top:2px solid #cbd5e1; font-weight:600; }}
.badge {{ display:inline-block; padding:1px 7px; border-radius:999px; font-size:.68rem; font-weight:500; white-space:nowrap; }}
.chart {{  }}
.bar-row {{ display:flex; align-items:center; gap:6px; margin-bottom:3px; font-size:.75rem; }}
.bar-label {{ width:55px; flex-shrink:0; color:#475569; }}
.bar-track {{ flex:1; height:18px; background:#e2e8f0; border-radius:9px; overflow:hidden; }}
.bar-fill {{ height:100%; border-radius:9px; transition:width .4s; min-width:3px; }}
.bar-amount {{ width:120px; text-align:right; flex-shrink:0; font-weight:600; font-size:.75rem; }}
.highlights {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:6px; }}
.hl-item {{ font-size:.8rem; padding:6px 8px; background:#f8fafc; border-radius:8px; line-height:1.5; }}
.hl-icon {{ margin-right:4px; }}
footer {{ text-align:center; font-size:.7rem; color:#94a3b8; margin-top:20px; }}
.row2 {{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }}
@media (max-width:700px) {{ .row2 {{ grid-template-columns:1fr; }} }}
</style>
</head>
<body>

<h1>📊 Laporan Keuangan Lengkap</h1>
<p class="subtitle">Madrasah Asy Syarif · Periode Jan–Jun 2026 · Data: {db['exported_at'][:10]}</p>

<!-- === Summary Cards === -->
{cards_html}

<!-- === Highlights === -->
<h2>📌 Highlights & Insight</h2>
<div class="section">
{highlights}
</div>

<!-- === Chart === -->
<h2>📈 Pergerakan Saldo Keseluruhan</h2>
<div class="section chart">
{chart_rows}
</div>

<!-- === Monthly Table === -->
<h2>📅 Rincian per Bulan</h2>
<div class="section">
<div class="table-wrap">
<table>
<thead><tr><th>Bulan</th><th class="num">💰 Pemasukan</th><th class="num">📤 Pengeluaran</th><th class="num">🔄 Net</th><th class="num">🏦 Saldo Akhir</th></tr></thead>
<tbody>{month_rows}</tbody>
</table>
</div>
</div>

<!-- === Category Breakdown === -->
<div class="row2">
<div>
<h2>💳 Rincian Pemasukan</h2>
<div class="section">
<div class="table-wrap">
<table>
<thead><tr><th>Kategori</th><th class="num">Total</th><th class="num">Jumlah</th><th class="num">%</th></tr></thead>
<tbody>{inc_cat_html}</tbody>
</table>
</div>
</div>
</div>
<div>
<h2>📤 Rincian Pengeluaran</h2>
<div class="section">
<div class="table-wrap">
<table>
<thead><tr><th>Kategori</th><th class="num">Total</th><th class="num">Jumlah</th><th class="num">%</th></tr></thead>
<tbody>{exp_cat_html}</tbody>
</table>
</div>
</div>
</div>
</div>

<!-- === Expense Distribution === -->
<h2>📊 Distribusi Pengeluaran per Kategori</h2>
<div class="section" style="padding:16px">
{''.join(insight_bar(cat, v['total']/total_exp*100,
  {"Gaji & Honor Guru":"#dc2626","Kas Mesjid":"#d97706","Alokasi Kas MDTA":"#10B981",
   "Belanja MDTA":"#ef4444","Operasional (Seragam)":"#f97316","Operasional Lain":"#64748b"}.get(cat,"#94a3b8"))
  for cat, v in sorted(cats_exp.items(), key=lambda x:-x[1]['total']))}
</div>

<!-- === Fund Breakdown === -->
<h2>🏦 Rekap Kas</h2>
<div class="section">
<table>
<thead><tr><th>Fund</th><th class="num">Total Masuk</th><th class="num">Total Keluar</th><th class="num">Saldo</th></tr></thead>
<tbody>
<tr><td>🏦 Kas Besar (General Fund)</td><td class="num">{F(total_inc - total_mdta_dinc)}</td><td class="num">{F(total_exp - total_mdta_alloc - total_mdta_spend)}</td><td class="num running">{F(total_cash - total_mdta_balance)}</td></tr>
<tr><td>📚 Kas MDTA</td><td class="num">{F(total_mdta_alloc + total_mdta_dinc)}</td><td class="num">{F(total_mdta_spend)}</td><td class="num running" style="color:#10B981">{F(total_mdta_balance)}</td></tr>
<tr class="total"><td><strong>💵 TOTAL UANG TUNAI</strong></td><td class="num"><strong>{F(total_inc)}</strong></td><td class="num"><strong>{F(total_exp - total_mdta_alloc)}</strong></td><td class="num running"><strong>{F(total_cash)}</strong></td></tr>
</tbody>
</table>
<div style="font-size:.72rem;color:#94a3b8;margin-top:8px">
* Total keluar Kas Besar sudah tidak termasuk alokasi ke MDTA ({F(total_mdta_alloc)}) — karena itu hanya transfer, bukan pengeluaran riil.
</div>
</div>

<!-- === Transaction Detail === -->
<h2>📋 Daftar Semua Transaksi</h2>
<div class="section">
<div class="table-wrap" style="max-height:500px;overflow-y:auto">
<table>
<thead><tr><th>Tgl</th><th>Kategori</th><th>Keterangan</th><th class="num">Jumlah</th></tr></thead>
<tbody>{detail}</tbody>
</table>
</div>
</div>

<footer>
<span>Dibuat: 2026-07-04</span><span> · </span><span>Madrasah Asy Syarif</span>
</footer>
</body>
</html>"""

OUT.write_text(html, encoding="utf-8")
print(f"✅ {OUT}")
print(f"Total Pemasukan:  {F(total_inc)}")
print(f"Total Pengeluaran: {F(total_exp)}")
print(f"Saldo Pembukuan:   {F(total_net_buku)}")
print(f"Kas Besar:         {F(total_cash - total_mdta_balance)}")
print(f"Kas MDTA:          {F(total_mdta_balance)}")
print(f"Total Uang Tunai:  {F(total_cash)}")
