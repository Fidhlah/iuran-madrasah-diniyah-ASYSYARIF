#!/usr/bin/env python3
"""Generate laporan-kas-mdta.html from isi-database.json"""
import json
from datetime import datetime
from collections import defaultdict
from pathlib import Path

DATA = Path(__file__).resolve().parent / "isi-database.json"
OUT  = Path(__file__).resolve().parent.parent / "laporan-kas-mdta.html"

with open(DATA, encoding="utf-8") as f:
    db = json.load(f)

finances = db["tables"]["finances"]["rows"]

def parse_dt(s):
    if s:
        try: return datetime.fromisoformat(s.replace("Z",""))
        except: return None
    return None

tx_all = []
for f in finances:
    dt = parse_dt(f.get("date"))
    if not dt: continue
    desc = (f.get("description") or "").strip()
    dlow = desc.lower()
    amt = int(f["amount"])
    ttype = f["type"]
    m = dt.strftime("%Y-%m")
    ml = dt.strftime("%B %Y")
    is_mdta_alloc = "kas mdta" in dlow and ttype == "expense" and "diambil" not in dlow
    is_mdta_dinc = "kas mdta" in dlow and ttype == "income"
    is_mdta_spnd = "diambil dari uang kas mdta" in dlow or "diambil dari kas mdta" in dlow
    if is_mdta_spnd: cat = "mdta_spending"
    elif is_mdta_alloc: cat = "mdta_allocation"
    elif is_mdta_dinc: cat = "mdta_direct_income"
    elif ttype == "income": cat = "general_income"
    else: cat = "general_expense"
    tx_all.append({"date":dt,"month":m,"ml":ml,"desc":desc,"amt":amt,"ttype":ttype,"cat":cat})

months = sorted(set(t["month"] for t in tx_all))
monthly = {}
for m in months:
    tx = [t for t in tx_all if t["month"] == m]
    monthly[m] = {
        "label": tx[0]["ml"],
        "general_income": sum(t["amt"] for t in tx if t["cat"]=="general_income"),
        "general_expense": sum(t["amt"] for t in tx if t["cat"]=="general_expense"),
        "mdta_allocation": sum(t["amt"] for t in tx if t["cat"]=="mdta_allocation"),
        "mdta_direct_income": sum(t["amt"] for t in tx if t["cat"]=="mdta_direct_income"),
        "mdta_spending": sum(t["amt"] for t in tx if t["cat"]=="mdta_spending"),
    }

# Feb 350k allocation (user-confirmed, not in DB)
monthly["2026-02"]["mdta_allocation"] += 350000

# Running balances
rg = 0  # running general
rm = 0  # running mdta
for m in sorted(monthly):
    md = monthly[m]
    ng = md["general_income"] - md["general_expense"] - md["mdta_allocation"]
    rg += ng
    nm = md["mdta_allocation"] + md["mdta_direct_income"] - md["mdta_spending"]
    rm += nm
    md["total_income"] = md["general_income"] + md["mdta_direct_income"]
    md["total_expense_recorded"] = md["general_expense"] + md["mdta_allocation"] + md["mdta_spending"]
    md["true_expense"] = md["general_expense"] + md["mdta_spending"]
    md["net_general"] = ng
    md["running_general"] = rg
    md["net_mdta"] = nm
    md["running_mdta"] = rm

ti = sum(m["total_income"] for m in monthly.values())
te = sum(m["total_expense_recorded"] for m in monthly.values())
tt = sum(m["true_expense"] for m in monthly.values())
ta = sum(m["mdta_allocation"] for m in monthly.values())
td = sum(m["mdta_direct_income"] for m in monthly.values())
ts = sum(m["mdta_spending"] for m in monthly.values())
tb = ta + td - ts

def F(n): return f"Rp {n:,}"

month_rows = ""
for m in sorted(monthly):
    md = monthly[m]
    ngc = "net-surplus" if md["net_general"]>=0 else "net-deficit"
    nmc = "net-surplus" if md["net_mdta"]>=0 else "net-deficit"
    month_rows += f"""<tr>
  <td>{md['label']}</td>
  <td class="num">{F(md['total_income'])}</td>
  <td class="num">{F(md['general_expense'])}</td>
  <td class="num">{F(md['mdta_allocation'])}</td>
  <td class="num">{"−" if md['mdta_spending']>0 else ""}{F(md['mdta_spending'])}</td>
  <td class="num">{F(md['total_expense_recorded'])}</td>
  <td class="num {ngc}">{'+' if md['net_general']>=0 else ''}{F(md['net_general'])}</td>
  <td class="num {nmc}">{'+' if md['net_mdta']>=0 else ''}{F(md['net_mdta'])}</td>
  <td class="num running">{F(md['running_mdta'])}</td>
</tr>"""

max_rg = max(abs(m["running_general"]) for m in monthly.values()) or 1
max_rm = max(abs(m["running_mdta"]) for m in monthly.values()) or 1

chart_rows = ""
for m in sorted(monthly):
    md = monthly[m]
    ls = md["label"][:3]
    wg = max(3, abs(md["running_general"])/max_rg*100)
    wm = max(3, abs(md["running_mdta"])/max_rm*100)
    gc = "#059669" if md["running_general"]>=0 else "#dc2626"
    mc = "#10B981" if md["running_mdta"]>=0 else "#dc2626"
    chart_rows += f"""<div class="bar-row">
  <span class="bar-label">{ls}</span>
  <div class="bar-track"><div class="bar-fill" style="width:{wg:.0f}%;background:{gc}"></div></div>
  <span class="bar-amount">{F(md['running_general'])}</span>
</div>
<div class="bar-row" style="opacity:.8">
  <span class="bar-label" style="font-size:.68rem">{ls}</span>
  <div class="bar-track" style="height:16px"><div class="bar-fill" style="width:{wm:.0f}%;background:{mc};height:16px"></div></div>
  <span class="bar-amount" style="color:{mc}">{F(md['running_mdta'])}</span>
</div>"""

detail_rows = ""
for t in sorted(tx_all, key=lambda x: x["date"]):
    ci = {"general_income":"💳","general_expense":"📄","mdta_allocation":"📥","mdta_spending":"📤","mdta_direct_income":"💰"}
    cl = {"general_income":"Pemasukan","general_expense":"Operasional","mdta_allocation":"Alokasi MDTA","mdta_spending":"Belanja MDTA","mdta_direct_income":"Pemasuk. MDTA"}
    cc = {"general_income":"#2563eb","general_expense":"#64748b","mdta_allocation":"#10B981","mdta_spending":"#EF4444","mdta_direct_income":"#059669"}
    ic = ci.get(t["cat"],"📄"); lb = cl.get(t["cat"],t["cat"]); co = cc.get(t["cat"],"#64748b")
    sg = "+" if t["ttype"]=="income" else "−"
    detail_rows += f"""<tr>
  <td>{t['date'].strftime('%d/%m')}</td>
  <td><span class="badge" style="background:{co}18;color:{co}">{ic} {lb}</span></td>
  <td style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{t['desc'][:55]}{'…' if len(t['desc'])>55 else ''}</td>
  <td class="num {'income' if t['ttype']=='income' else 'expense'}">{sg}{F(t['amt'])}</td>
</tr>"""

# Add Feb allocation to detail
feb_alloc = {"date":datetime(2026,2,1),"cat":"mdta_allocation","desc":"Alokasi Kas MDTA Bulan Februari 2026 (dikonfirmasi admin)","amt":350000,"ttype":"expense"}
detail_rows = f"""<tr>
  <td>01/02</td>
  <td><span class="badge" style="background:#10B98118;color:#10B981">📥 Alokasi MDTA</span></td>
  <td style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Alokasi Kas MDTA Bulan Februari 2026 (dikonfirmasi admin)</td>
  <td class="num expense">−Rp 350,000</td>
</tr>""" + detail_rows

html = f"""<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Laporan Keuangan + Kas MDTA — Asy Syarif</title>
<style>
*,*::before,*::after {{ box-sizing:border-box; margin:0; padding:0; }}
body {{ font-family:'Segoe UI',system-ui,-apple-system,sans-serif; background:#f1f5f9; color:#1e293b; padding:20px; }}
h1 {{ font-size:1.35rem; margin-bottom:2px; }}
.subtitle {{ color:#64748b; font-size:.82rem; margin-bottom:18px; }}
h2 {{ font-size:1rem; margin-bottom:8px; margin-top:18px; }}
.cards {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(155px,1fr)); gap:8px; margin-bottom:20px; }}
.card {{ background:#fff; border-radius:12px; border:1px solid #e2e8f0; padding:12px 14px; }}
.card .label {{ font-size:.68rem; text-transform:uppercase; letter-spacing:.04em; color:#64748b; margin-bottom:3px; }}
.card .value {{ font-size:1.3rem; font-weight:700; }}
.green {{ color:#059669; }} .red {{ color:#dc2626; }} .blue {{ color:#2563eb; }} .purple {{ color:#7c3aed; }} .amber {{ color:#d97706; }}
.table-wrap {{ overflow-x:auto; margin-bottom:18px; }}
table {{ width:100%; border-collapse:collapse; background:#fff; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden; }}
th,td {{ text-align:left; padding:7px 9px; border-bottom:1px solid #f1f5f9; font-size:.8rem; }}
th {{ background:#f8fafc; font-weight:600; font-size:.7rem; text-transform:uppercase; letter-spacing:.04em; color:#475569; white-space:nowrap; }}
td.num {{ text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }}
td.income {{ color:#059669; }} td.expense {{ color:#dc2626; }}
td.green {{ color:#059669; font-weight:600; }} td.red {{ color:#dc2626; font-weight:600; }}
td.running {{ font-weight:700; color:#2563eb; }}
tr:last-child td {{ border-bottom:none; }}
.badge {{ display:inline-block; padding:1px 7px; border-radius:999px; font-size:.7rem; font-weight:500; white-space:nowrap; }}
.bar-row {{ display:flex; align-items:center; gap:6px; margin-bottom:3px; font-size:.75rem; }}
.bar-label {{ width:55px; flex-shrink:0; color:#475569; }}
.bar-track {{ flex:1; height:18px; background:#e2e8f0; border-radius:9px; overflow:hidden; }}
.bar-fill {{ height:100%; border-radius:9px; transition:width .4s; min-width:4px; }}
.bar-amount {{ width:125px; text-align:right; flex-shrink:0; font-weight:600; font-size:.75rem; }}
footer {{ text-align:center; font-size:.7rem; color:#94a3b8; margin-top:20px; }}
.notes {{ background:#fff; border-radius:12px; border:1px solid #e2e8f0; padding:12px 14px; font-size:.8rem; line-height:1.6; }}
</style>
</head>
<body>

<h1>📊 Laporan Keuangan + Kas MDTA</h1>
<p class="subtitle">Madrasah Asy Syarif · Periode Jan–Jun 2026</p>

<div class="cards">
  <div class="card"><div class="label">💵 Total Uang Tunai</div><div class="value blue">{F(rg+rm)}</div></div>
  <div class="card"><div class="label">🏦 Kas Besar</div><div class="value green">{F(rg)}</div></div>
  <div class="card"><div class="label">📚 Kas MDTA</div><div class="value purple">{F(rm)}</div></div>
  <div class="card"><div class="label">📤 Belanja dari MDTA</div><div class="value red">{F(ts)}</div></div>
  <div class="card"><div class="label">📥 Alokasi ke MDTA</div><div class="value amber">{F(ta+td)}</div></div>
</div>

<h2>📈 Pergerakan Saldo</h2>
<div class="table-wrap" style="padding:0 4px">
<div style="display:flex;gap:12px;margin-bottom:4px;font-size:.7rem;color:#94a3b8">
  <span>▬ <span style="color:#059669">Kas Besar</span></span>
  <span>▬ <span style="color:#10B981">Kas MDTA</span></span>
</div>
{chart_rows}
</div>

<h2>📅 Rincian per Bulan</h2>
<div class="table-wrap">
<table>
<thead><tr>
  <th>Bulan</th><th class="num">💳 Pemasukan</th><th class="num">📄 Operasional</th>
  <th class="num">📥 Alokasi MDTA</th><th class="num">📤 Belanja MDTA</th>
  <th class="num">📊 Total Pengeluaran*</th><th class="num">🔄 Kas Besar</th>
  <th class="num">🔄 Kas MDTA</th><th class="num">📚 Sisa MDTA</th>
</tr></thead>
<tbody>{month_rows}</tbody>
</table>
</div>

<p style="font-size:.72rem;color:#94a3b8;margin-top:-14px;margin-bottom:18px">* Total Pengeluaran = Operasional + Alokasi MDTA + Belanja MDTA (angka di sistem)</p>

<h2>📋 Semua Transaksi</h2>
<div class="table-wrap">
<table>
<thead><tr><th>Tgl</th><th>Kategori</th><th>Keterangan</th><th class="num">Jumlah</th></tr></thead>
<tbody>{detail_rows}</tbody>
</table>
</div>

<h2>📝 Catatan</h2>
<div class="notes">
• <strong>Alokasi MDTA</strong> = dana dipindah dari Kas Besar ke Kas MDTA — <em>bukan</em> pengeluaran riil.<br>
• <strong>Belanja MDTA</strong> = pengeluaran riil yang dibayar dari Kas MDTA (spidol, fotokopi, dll).<br>
• <strong>Total Uang Tunai</strong> = Kas Besar + Kas MDTA = {F(rg)} + {F(rm)} = <strong>{F(rg+rm)}</strong><br>
• Alokasi Februari 2026 (Rp 350.000) tidak tercatat di sistem — dikonfirmasi oleh admin.<br>
• Alokasi Maret 2026 (Rp 400.000) untuk seragam — seragam batal, dana tetap utuh di Kas MDTA.<br>
• Pengeluaran operasional Februari (buku mewarnai, pulpen, fotokopi — Rp 45.000) tidak jelas sumber dananya — dianggap dari Kas Besar (konservatif).<br>
• Laporan sementara — setelah <code>category</code> & <code>is_fund_transfer</code> akan lebih akurat.
</div>

<footer><span>Data: {db['exported_at'][:10]}</span><span> · </span><span>Madrasah Asy Syarif</span></footer>
</body>
</html>"""

OUT.write_text(html, encoding="utf-8")
print(f"✅ {OUT.name}")
print(f"Total uang tunai:  {F(rg+rm)}")
print(f"  Kas Besar:       {F(rg)}")
print(f"  Kas MDTA:        {F(rm)}")
print(f"  Belanja MDTA:    {F(ts)}")
print(f"  Alokasi masuk:   {F(ta+td)}")
