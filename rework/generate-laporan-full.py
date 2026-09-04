#!/usr/bin/env python3
"""Generate laporan-keuangan-full.html from isi-database.json.

Pisah kas: Kas Besar (General Fund) vs Kas MDTA.
- Kas Besar: iuran siswa, gaji guru, kas mesjid, operasional
- Kas MDTA: alokasi dari kas besar + pemasukan langsung - belanja riil
"""

import json
import sys
from datetime import datetime
from collections import defaultdict
from pathlib import Path

DATA = Path(__file__).parent / (sys.argv[1] if len(sys.argv) > 1 else "isi-database.json")
OUT = Path(__file__).parent / (sys.argv[2] if len(sys.argv) > 2 else "laporan-keuangan-full.html")

with open(DATA) as f:
    db = json.load(f)

finances = db["tables"]["finances"]["rows"]
# Remove duplicates by id
seen_ids = set()
finances_uniq = []
for f in finances:
    if f["id"] not in seen_ids:
        seen_ids.add(f["id"])
        finances_uniq.append(f)
finances = finances_uniq

monthly_fee = 50000  # from settings


def parse_dt(field: str) -> datetime | None:
    raw = field or ""
    if raw:
        try:
            return datetime.fromisoformat(raw.replace("Z", ""))
        except Exception:
            return None
    return None


def classify(tx: dict) -> dict:
    """Classify a finance transaction into categories.

    Fund rules:
    - Kas Besar: receives all income (iuran, infaq), pays Gaji+Honor and Kas Mesjid.
      Also transfers budget to Kas MDTA (Alokasi Kas MDTA).
    - Kas MDTA: receives Alokasi from KB + direct income, pays ALL operational
      expenses (ATK, print, fotokopi, seragam, dll).
    """
    desc = (tx.get("description") or "").strip()
    desc_lower = desc.lower()
    amt = int(tx["amount"])
    ttype = tx["type"]
    dt = parse_dt(tx.get("date") or "")
    month_key = dt.strftime("%Y-%m") if dt else "unknown"
    date_str = dt.strftime("%d/%m") if dt else "??"

    result = {
        "id": tx["id"],
        "date": dt,
        "date_str": date_str,
        "month_key": month_key,
        "amount": amt,
        "description": desc,
        "type": ttype,
        "category": None,
        "fund": None,  # "kas_besar" or "kas_mdta"
        "is_transfer": False,  # True if it's a fund transfer (not real expense)
    }

    # ── INCOME ──
    if ttype == "income":
        # Direct MDTA income (e.g., potongan tabungan)
        if "kas mdta" in desc_lower:
            result["category"] = "Pemasukan Langsung MDTA"
            result["fund"] = "kas_mdta"
            return result

        # Regular income → Kas Besar
        if "infaq" in desc_lower or "shadaqah" in desc_lower or "suka rela" in desc_lower:
            result["category"] = "Infaq & Donasi"
        elif "pendaftaran" in desc_lower:
            result["category"] = "Pendaftaran"
        else:
            result["category"] = "Iuran Siswa"
        result["fund"] = "kas_besar"
        return result

    # ── EXPENSE ──
    if ttype == "expense":
        guru_keywords = ["guru", "honor", "mengajar"]
        mesjid_keywords = ["kas masjid", "kas mesjid"]

        # (1) Gaji & Honor Guru → Kas Besar
        if any(k in desc_lower for k in guru_keywords):
            result["category"] = "Gaji & Honor Guru"
            result["fund"] = "kas_besar"
            return result

        # (2) Kas Mesjid → Kas Besar
        if any(k in desc_lower for k in mesjid_keywords):
            result["category"] = "Kas Mesjid"
            result["fund"] = "kas_besar"
            return result

        # (3) "Diambil dari uang kas mdta" → Belanja MDTA (spending FROM MDTA)
        # Cek SEBELUM "kas mdta" karena deskripsinya juga mengandung "mdta"
        if "diambil dari uang kas mdta" in desc_lower or "diambil dari kas mdta" in desc_lower:
            result["category"] = "Belanja MDTA"
            result["fund"] = "kas_mdta"
            return result

        # (4) "Kas MDTA" di deskripsi → Alokasi (transfer ke MDTA)
        # Cek SEBELUM seragam, karena entry Maret "Kas MDTA (dipakai...seragam)"
        # sudah dikonfirmasi sebagai alokasi, bukan seragam
        if "kas mdta" in desc_lower:
            result["category"] = "Alokasi Kas MDTA"
            result["fund"] = "kas_mdta"
            result["is_transfer"] = True
            return result

        # (5) Seragam → Kas MDTA (real expense dari fund MDTA)
        if "seragam" in desc_lower:
            result["category"] = "Operasional (Seragam)"
            result["fund"] = "kas_mdta"
            return result

        # (6) Semua sisanya (print, fotokopi, ATK, dll) → Belanja MDTA
        result["category"] = "Belanja MDTA"
        result["fund"] = "kas_mdta"
        return result

    result["category"] = "Lain-lain"
    result["fund"] = "kas_besar"
    return result


# Classify all transactions
classified = [classify(tx) for tx in finances]
classified.sort(key=lambda r: (r["date"] or datetime.min, r["id"]))

# === AGGREGATE: Overall ===
total_income = sum(r["amount"] for r in classified if r["type"] == "income")
total_expense = sum(r["amount"] for r in classified if r["type"] == "expense")
# total_balance = total_income - total_expense  # unused, removed

# === AGGREGATE: By fund ===
# === FUND ACCOUNTING ===
# Kas Besar: all income EXCEPT direct MDTA income
kas_besar_in = sum(r["amount"] for r in classified if r["fund"] == "kas_besar" and r["type"] == "income")
# Real expenses from Kas Besar (excludes transfers)
kas_besar_real_out = sum(r["amount"] for r in classified if r["fund"] == "kas_besar" and r["type"] == "expense" and not r["is_transfer"])
# Transfers OUT of Kas Besar (to MDTA)
kas_besar_transfer_out = sum(r["amount"] for r in classified if r["is_transfer"] and r["type"] == "expense")

# Kas MDTA
kas_mdta_in = sum(r["amount"] for r in classified if r["fund"] == "kas_mdta" and r["type"] == "income")
kas_mdta_transfer = sum(r["amount"] for r in classified if r["fund"] == "kas_mdta" and r["is_transfer"])
kas_mdta_spend = sum(r["amount"] for r in classified if r["fund"] == "kas_mdta" and not r["is_transfer"] and r["type"] == "expense")
kas_mdta_total_in = kas_mdta_in + kas_mdta_transfer
kas_mdta_balance = kas_mdta_total_in - kas_mdta_spend

# Kas Besar balance: income - real expenses - transfers out to MDTA
kas_besar_balance = kas_besar_in - kas_besar_real_out - kas_besar_transfer_out

total_cash = kas_besar_balance + kas_mdta_balance

# === BY MONTH ===
months_data = defaultdict(lambda: {
    "income": 0, "expense": 0, "expense_real": 0,
    "kb_income": 0, "kb_expense_real": 0,
    "mdta_income": 0, "mdta_transfer_in": 0, "mdta_spend": 0,
    "items": [],
})

for r in classified:
    mk = r["month_key"]
    if mk == "unknown":
        continue
    m = months_data[mk]
    m["items"].append(r)

    if r["type"] == "income":
        m["income"] += r["amount"]
        if r["fund"] == "kas_besar":
            m["kb_income"] += r["amount"]
        elif r["fund"] == "kas_mdta":
            m["mdta_income"] += r["amount"]
    elif r["type"] == "expense":
        m["expense"] += r["amount"]
        if not r["is_transfer"]:
            m["expense_real"] += r["amount"]
        if r["fund"] == "kas_besar" and not r["is_transfer"]:
            m["kb_expense_real"] += r["amount"]
        elif r["fund"] == "kas_mdta" and r["is_transfer"]:
            m["mdta_transfer_in"] += r["amount"]
        elif r["fund"] == "kas_mdta" and not r["is_transfer"]:
            m["mdta_spend"] += r["amount"]

# Running balances
kb_running = 0
mdta_running = 0
month_order = sorted(months_data)

for mk in month_order:
    m = months_data[mk]
    # KB net = KB income - KB real expense - transfer out to MDTA
    m["kb_net"] = m["kb_income"] - m["kb_expense_real"] - m["mdta_transfer_in"]
    # MDTA net = MDTA direct income + transfer from KB - MDTA spending
    m["mdta_net"] = m["mdta_income"] + m["mdta_transfer_in"] - m["mdta_spend"]
    kb_running += m["kb_net"]
    mdta_running += m["mdta_net"]
    m["kb_running"] = kb_running
    m["mdta_running"] = mdta_running
    m["total_running"] = kb_running + mdta_running

# Charts: find max for scaling
all_kb = [m["kb_running"] for m in months_data.values()]
max_kb = max(all_kb) if all_kb else 1
all_mdta = [m["mdta_running"] for m in months_data.values()]
max_mdta = max(all_mdta) if all_mdta else 1

# === CATEGORY BREAKDOWN ===
income_by_cat = defaultdict(lambda: {"total": 0, "count": 0})
expense_by_cat = defaultdict(lambda: {"total": 0, "count": 0})

for r in classified:
    if r["type"] == "income":
        income_by_cat[r["category"]]["total"] += r["amount"]
        income_by_cat[r["category"]]["count"] += 1
    elif r["type"] == "expense":
        if r["is_transfer"]:
            # Transfers aren't real expenses, skip in expense breakdown
            continue
        expense_by_cat[r["category"]]["total"] += r["amount"]
        expense_by_cat[r["category"]]["count"] += 1

# === HIGHLIGHTS ===
# max_income_month & unused highlight computations removed
max_income_month = max(month_order, key=lambda mk: months_data[mk]["income"])
# highest_income_month_val, total_guru, guru_pct etc were used by Highlights section (removed)

num_income_tx = sum(1 for r in classified if r["type"] == "income")
num_expense_tx = sum(1 for r in classified if r["type"] == "expense" and not r["is_transfer"])
num_expense_all_tx = sum(1 for r in classified if r["type"] == "expense")


# === HTML GENERATION ===

def rp(n):
    """Format as Rupiah."""
    return f"Rp {n:,}"

def rp_class(n, css_class=""):
    sign = "+" if n >= 0 else ""
    cls = f' class="num {css_class}"'.rstrip()
    return f'<td{cls}>{sign}{rp(n)}</td>'

def income_td(n):
    return f'<td class="num income">+{rp(n)}</td>'

def expense_td(n):
    return f'<td class="num expense">−{rp(n)}</td>'

def net_td(n):
    if n >= 0:
        return f'<td class="num green">+{rp(n)}</td>'
    return f'<td class="num red">−{rp(abs(n))}</td>'

def badge(category):
    colors = {
        "Iuran Siswa": "#2563eb",
        "Infaq & Donasi": "#8b5cf6",
        "Pendaftaran": "#f59e0b",
        "Pemasukan Langsung MDTA": "#059669",
        "Gaji & Honor Guru": "#dc2626",
        "Kas Mesjid": "#d97706",
        "Alokasi Kas MDTA": "#10B981",
        "Belanja MDTA": "#ef4444",
        "Operasional (Seragam)": "#f97316",
    }
    icons = {
        "Iuran Siswa": "💳",
        "Infaq & Donasi": "🤲",
        "Pendaftaran": "📝",
        "Pemasukan Langsung MDTA": "💰",
        "Gaji & Honor Guru": "👨‍🏫",
        "Kas Mesjid": "🕌",
        "Alokasi Kas MDTA": "📥",
        "Belanja MDTA": "📤",
        "Operasional (Seragam)": "👕",
    }
    color = colors.get(category, "#64748b")
    icon = icons.get(category, "📋")
    return f'<span class="badge" style="background:{color}18;color:{color}">{icon} {category}</span>'

# --- Monthly table rows ---
month_rows = ""
for mk in month_order:
    m = months_data[mk]
    nama_bulan = datetime.strptime(mk + "-01", "%Y-%m-%d").strftime("%B %Y")
    net_real = m["income"] - m["expense_real"]
    total_running = m["kb_running"] + m["mdta_running"]

    month_rows += f"""<tr>
  <td>{nama_bulan}</td>
  <td class="num">{rp(m['income'])}</td>
  <td class="num">{rp(m['expense_real'])}</td>
  {net_td(net_real)}
  <td class="num running">{rp(total_running)}</td>
  <td class="num running" style="color:#059669">{rp(m['kb_running'])}</td>
  <td class="num running" style="color:#10B981">{rp(m['mdta_running'])}</td>
</tr>"""

# --- MDTA section in monthly table ---
mdta_month_rows = ""
mdta_running = 0
for mk in month_order:
    m = months_data[mk]
    nama_bulan = datetime.strptime(mk + "-01", "%Y-%m-%d").strftime("%B %Y")
    mdta_running += m["mdta_net"]
    m["mdta_running_display"] = mdta_running

    mdta_month_rows += f"""<tr>
  <td>{nama_bulan}</td>
  <td class="num">{rp(m['mdta_transfer_in'])}</td>
  <td class="num">{rp(m['mdta_income'])}</td>
  <td class="num">{rp(m['mdta_spend'])}</td>
  <td class="num">{rp(m['mdta_transfer_in'] + m['mdta_income'])}</td>
  {net_td(m['mdta_net'])}
  <td class="num running">{rp(mdta_running)}</td>
</tr>"""

# --- Income breakdown ---
income_rows = ""
for cat in sorted(income_by_cat, key=lambda c: income_by_cat[c]["total"], reverse=True):
    d = income_by_cat[cat]
    pct = d["total"] / total_income * 100 if total_income else 0
    income_rows += f"""<tr>
  <td>{badge(cat)}</td>
  <td class="num">{rp(d['total'])}</td>
  <td class="num">{d['count']}x</td>
  <td class="num">{pct:.1f}%</td>
</tr>"""

income_rows += f"""<tr class="total">
  <td><strong>TOTAL</strong></td>
  <td class="num"><strong>{rp(total_income)}</strong></td>
  <td class="num"><strong>{num_income_tx}x</strong></td>
  <td class="num"><strong>100%</strong></td>
</tr>"""

# --- Expense breakdown ---
expense_rows = ""
expense_total_real = sum(d["total"] for d in expense_by_cat.values())
for cat in sorted(expense_by_cat, key=lambda c: expense_by_cat[c]["total"], reverse=True):
    d = expense_by_cat[cat]
    pct = d["total"] / expense_total_real * 100 if expense_total_real else 0
    expense_rows += f"""<tr>
  <td>{badge(cat)}</td>
  <td class="num">{rp(d['total'])}</td>
  <td class="num">{d['count']}x</td>
  <td class="num">{pct:.1f}%</td>
</tr>"""

expense_rows += f"""<tr class="total">
  <td><strong>TOTAL</strong></td>
  <td class="num"><strong>{rp(expense_total_real)}</strong></td>
  <td class="num"><strong>{num_expense_tx}x</strong></td>
  <td class="num"><strong>100%</strong></td>
</tr>"""

# --- Expense distribution bar ---
expense_dist_html = ""
category_colors_expense = {
    "Gaji & Honor Guru": "#dc2626",
    "Kas Mesjid": "#d97706",
    "Belanja MDTA": "#ef4444",
    "Operasional (Seragam)": "#f97316",
}
for cat in sorted(expense_by_cat, key=lambda c: expense_by_cat[c]["total"], reverse=True):
    d = expense_by_cat[cat]
    pct = d["total"] / expense_total_real * 100 if expense_total_real else 0
    if pct < 2:
        pct_display = max(2.0, pct)
    else:
        pct_display = pct
    color = category_colors_expense.get(cat, "#64748b")
    expense_dist_html += f"""<div style="margin-bottom:6px">
  <div style="display:flex;justify-content:space-between;font-size:.78rem;margin-bottom:2px">
    <span>{cat}</span><span>{pct:.1f}%</span>
  </div>
  <div style="height:18px;background:#e2e8f0;border-radius:9px;overflow:hidden">
    <div style="height:100%;width:{pct_display:.1f}%;background:{color};border-radius:9px"></div>
  </div>
</div>"""

# --- Fund recap ---
kb_transfer_total = sum(r["amount"] for r in classified if r["is_transfer"])
kas_besar_total_out_real = kas_besar_real_out  # already excludes transfers

fund_rows = f"""<tr>
  <td>🏦 Kas Besar (General Fund)</td>
  <td class="num">{rp(kas_besar_in)}</td>
  <td class="num">{rp(kas_besar_real_out)}</td>
  <td class="num running">{rp(kas_besar_balance)}</td>
</tr>
<tr>
  <td style="padding-left:24px;font-size:.75rem;color:#64748b">📤 Transfer ke Kas MDTA</td>
  <td class="num"></td>
  <td class="num expense">{rp(kas_besar_transfer_out)}</td>
  <td class="num"></td>
</tr>
<tr>
  <td>📚 Kas MDTA</td>
  <td class="num">{rp(kas_mdta_total_in)}</td>
  <td class="num">{rp(kas_mdta_spend)}</td>
  <td class="num running" style="color:#10B981">{rp(kas_mdta_balance)}</td>
</tr>
<tr class="total">
  <td><strong>💵 TOTAL UANG TUNAI</strong></td>
  <td class="num"><strong>{rp(total_income)}</strong></td>
  <td class="num"><strong>{rp(kas_besar_real_out + kas_mdta_spend)}</strong></td>
  <td class="num running"><strong>{rp(kas_besar_balance + kas_mdta_balance)}</strong></td>
</tr>"""

# --- Chart bars ---
chart_bars = ""
for mk in month_order:
    m = months_data[mk]
    nama_pendek = datetime.strptime(mk + "-01", "%Y-%m-%d").strftime("%b")
    pct_kb = m["kb_running"] / max_kb * 100 if max_kb else 0
    chart_bars += f"""<div class="bar-row"><span class="bar-label">{nama_pendek}</span><div class="bar-track"><div class="bar-fill" style="width:{pct_kb:.1f}%;background:#059669"></div></div><span class="bar-amount">{rp(m['kb_running'])}</span></div>"""

# --- MDTA chart ---
mdta_chart_bars = ""
for mk in month_order:
    m = months_data[mk]
    nama_pendek = datetime.strptime(mk + "-01", "%Y-%m-%d").strftime("%b")
    pct_mdta = m["mdta_running"] / max_mdta * 100 if max_mdta else 0
    mdta_chart_bars += f"""<div class="bar-row"><span class="bar-label">{nama_pendek}</span><div class="bar-track"><div class="bar-fill" style="width:{pct_mdta:.1f}%;background:#10B981"></div></div><span class="bar-amount">{rp(m['mdta_running'])}</span></div>"""

# --- Full transaction list ---
tx_rows = ""
for r in classified:
    if r["date"] is None:
        continue
    date_display = r["date_str"]
    if r["type"] == "income":
        amount_display = f'+{rp(r["amount"])}'
        cls = "income"
    else:
        amount_display = f'−{rp(r["amount"])}'
        cls = "expense"

    # Truncate description
    desc = r["description"]
    if len(desc) > 60:
        desc = desc[:57] + "…"

    tx_rows += f"""<tr>
  <td>{date_display}</td>
  <td>{badge(r['category'])}</td>
  <td style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{desc}</td>
  <td class="num {cls}">{amount_display}</td>
</tr>"""

# === FULL HTML ===
HTML = f"""<!DOCTYPE html>
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
.bar-row {{ display:flex; align-items:center; gap:6px; margin-bottom:3px; font-size:.75rem; }}
.bar-label {{ width:55px; flex-shrink:0; color:#475569; }}
.bar-track {{ flex:1; height:18px; background:#e2e8f0; border-radius:9px; overflow:hidden; }}
.bar-fill {{ height:100%; border-radius:9px; transition:width .4s; min-width:3px; }}
.bar-amount {{ width:120px; text-align:right; flex-shrink:0; font-weight:600; font-size:.75rem; }}
.highlights {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:6px; }}
.hl-item {{ font-size:.8rem; padding:6px 8px; background:#f8fafc; border-radius:8px; line-height:1.5; }}

footer {{ text-align:center; font-size:.7rem; color:#94a3b8; margin-top:20px; }}
.row2 {{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }}
@media (max-width:700px) {{ .row2 {{ grid-template-columns:1fr; }} }}
</style>
</head>
<body>

<h1>📊 Laporan Keuangan Lengkap</h1>
<p class="subtitle">Madrasah Asy Syarif · Periode Jan–Jul 2026 · Data: {db['exported_at'][:10]} · Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}</p>

<!-- === Summary Cards === -->
<div class="cards">
  <div class="card"><div class="label">💰 Total Pemasukan</div><div class="value green">{rp(total_income)}</div></div>
  <div class="card"><div class="label">📤 Total Pengeluaran Riil*</div><div class="value red">{rp(expense_total_real)}</div></div>
  <div class="card"><div class="label">💵 Total Uang Tunai Riil</div><div class="value" style="color:#059669">{rp(total_cash)}</div></div>
</div>
<div class="cards">
  <div class="card"><div class="label">🏦 Kas Besar (General Fund)</div><div class="value purple">{rp(kas_besar_balance)}</div></div>
  <div class="card"><div class="label">📚 Kas MDTA (Akumulatif)</div><div class="value" style="color:#10B981">{rp(kas_mdta_balance)}</div></div>
  <div class="card"><div class="label">💳 Total Pemasukan</div><div class="value green">{rp(total_income)}</div></div>
</div>

<!-- === Highlights (angka sistem — termasuk alokasi MDTA sbg pengeluaran) === -->
<h2>📌 Highlights & Insight</h2>
<div class="section">
<div class="highlights">
  <div class="hl-item"><span class="hl-icon">📌</span><strong>Total Pemasukan</strong> {rp(total_income)} dari {num_income_tx} transaksi iuran & infaq.</div>
  <div class="hl-item"><span class="hl-icon">📌</span><strong>Total Pengeluaran (di sistem):</strong> {rp(total_expense)} dari {num_expense_all_tx} transaksi — <strong>termasuk</strong> {rp(kas_mdta_transfer)} alokasi ke Kas MDTA.</div>
  <div class="hl-item"><span class="hl-icon">📌</span><strong>Pengeluaran Riil (tanpa transfer):</strong> {rp(expense_total_real)} — gaji, mesjid, seragam, belanja MDTA.</div>
  <div class="hl-item"><span class="hl-icon">📌</span><strong>Alokasi ke Kas MDTA:</strong> {rp(kas_mdta_transfer)} — cuma pindah buku antar fund, bukan uang keluar beneran.</div>
  <div class="hl-item"><span class="hl-icon">📌</span><strong>Sisa Uang Tunai Riil:</strong> {rp(total_cash)} (Kas Besar {rp(kas_besar_balance)} + Kas MDTA {rp(kas_mdta_balance)}).</div>
</div>
</div>

<!-- === Chart: Kas Besar Balance === -->
<h2>📈 Pergerakan Saldo Kas Besar per Bulan</h2>
<div class="section chart">
{chart_bars}
</div>

<!-- === Chart: Kas MDTA Balance === -->
<h2>📈 Pergerakan Saldo Kas MDTA per Bulan</h2>
<div class="section chart">
{mdta_chart_bars}
</div>

<!-- === Monthly Table: Keseluruhan === -->
<h2>📅 Rincian per Bulan — Keseluruhan</h2>
<div class="section">
<div class="table-wrap">
<table>
<thead><tr><th>Bulan</th><th class="num">💰 Pemasukan</th><th class="num">📤 Pengeluaran</th><th class="num">🔄 Net Total</th><th class="num">🏦 Total Tunai</th><th class="num">🏦 Kas Besar</th><th class="num">📚 Kas MDTA</th></tr></thead>
<tbody>
{month_rows}
</tbody>
</table>
<p style="font-size:.72rem;color:#94a3b8;margin-top:6px">* Pengeluaran = pengeluaran riil (tidak termasuk alokasi transfer ke MDTA). Net Total = Pemasukan − Pengeluaran Riil = perubahan total uang tunai bulan ini.</p>
</div>
</div>

<!-- === Monthly Table: Kas MDTA === -->
<h2>📅 Rincian Kas MDTA per Bulan</h2>
<div class="section">
<div class="table-wrap">
<table>
<thead><tr><th>Bulan</th><th class="num">📥 Alokasi Masuk</th><th class="num">💰 Pemasukan Langsung</th><th class="num">📤 Belanja</th><th class="num">📊 Total Masuk</th><th class="num">🔄 Net</th><th class="num">📚 Sisa MDTA</th></tr></thead>
<tbody>
{mdta_month_rows}
</tbody>
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
<tbody>
{income_rows}
</tbody>
</table>
</div>
</div>
</div>
<div>
<h2>📤 Rincian Pengeluaran Riil</h2>
<div class="section">
<div class="table-wrap">
<table>
<thead><tr><th>Kategori</th><th class="num">Total</th><th class="num">Jumlah</th><th class="num">%</th></tr></thead>
<tbody>
{expense_rows}
</tbody>
</table>
</div>
</div>
</div>
</div>

<!-- === Expense Distribution === -->
<h2>📊 Distribusi Pengeluaran per Kategori</h2>
<div class="section">
{expense_dist_html}
<p style="font-size:.72rem;color:#94a3b8;margin-top:8px">* Alokasi Kas MDTA tidak termasuk karena hanya transfer antar fund.</p>
</div>

<!-- === Fund Breakdown === -->
<h2>🏦 Rekap Kas</h2>
<div class="section">
<table>
<thead><tr><th>Fund</th><th class="num">Total Masuk</th><th class="num">Total Keluar</th><th class="num">Saldo</th></tr></thead>
<tbody>
{fund_rows}
</tbody>
</table>
<div style="font-size:.72rem;color:#94a3b8;margin-top:8px">
* Total keluar Kas Besar sudah tidak termasuk alokasi ke MDTA ({rp(kb_transfer_total)}) — karena itu hanya transfer, bukan pengeluaran riil.<br>
* Kas MDTA menerima {rp(kas_mdta_transfer)} dari alokasi + {rp(kas_mdta_in)} pemasukan langsung. Belanja riil dari MDTA: {rp(kas_mdta_spend)}.
</div>
</div>

<!-- === Transaction Detail === -->
<h2>📋 Daftar Semua Transaksi</h2>
<div class="section">
<div class="table-wrap" style="max-height:500px;overflow-y:auto">
<table>
<thead><tr><th>Tgl</th><th>Kategori</th><th>Keterangan</th><th class="num">Jumlah</th></tr></thead>
<tbody>
{tx_rows}
</tbody>
</table>
</div>
</div>

<footer>
<span>Data: {db['exported_at'][:10]}</span><span> · </span><span>Madrasah Asy Syarif</span>
</footer>
</body>
</html>"""

OUT.write_text(HTML, encoding="utf-8")
print(f"✅ Generated: {OUT}")
print(f"  Total Pemasukan: {rp(total_income)}")
print(f"  Total Pengeluaran Riil: {rp(expense_total_real)}")
print(f"  Kas Besar: {rp(kas_besar_balance)}")
print(f"  Kas MDTA: {rp(kas_mdta_balance)}")
print(f"  Total Uang Tunai: {rp(total_cash)}")
print(f"  Transaksi Income: {num_income_tx}x, Expense (riil): {num_expense_tx}x")
