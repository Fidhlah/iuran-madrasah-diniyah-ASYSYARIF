#!/usr/bin/env python3
"""Baca isi-database.json → generate laporan Kas MDTA → single HTML file."""

import json
from datetime import datetime
from collections import defaultdict
from pathlib import Path

DATA = Path(__file__).parent / "isi-database.json"
OUT = Path(__file__).parent.parent / "laporan-kas-mdta.html"

with open(DATA) as f:
    db = json.load(f)

finances = db["tables"]["finances"]["rows"]


def parse_dt(field: str) -> datetime | None:
    """Parse iso date string from finance row."""
    raw = field
    if raw:
        try:
            return datetime.fromisoformat(raw.replace("Z", ""))
        except Exception:
            return None
    return None


# ── Classify MDTA-related transactions ──────────────────────────────
mdta_tx = []

for f in finances:
    desc = (f.get("description") or "").strip()
    desc_lower = desc.lower()
    amt = int(f["amount"])
    ttype = f["type"]
    dt = parse_dt(f.get("date") or "")
    if dt is None:
        continue
    month_key = dt.strftime("%Y-%m")
    date_str = dt.strftime("%d/%m/%Y")

    row = {
        "id": f["id"],
        "date": dt,
        "date_str": date_str,
        "month_key": month_key,
        "amount": amt,
        "description": desc,
        "type": ttype,
    }

    # ── Priority order: spending FROM MDTA first, then allocation INTO MDTA ──
    if "diambil dari uang kas mdta" in desc_lower or "diambil dari kas mdta" in desc_lower:
        # Actual spending FROM Kas MDTA fund
        row["mdta_type"] = "Belanja MDTA"
        row["color"] = "#EF4444"  # red
        row["sign"] = -1
        mdta_tx.append(row)

    elif "kas mdta" in desc_lower and ttype == "expense":
        # Fund transfer INTO Kas MDTA (currently mis-categorised as expense)
        row["mdta_type"] = "Alokasi Kas MDTA"
        row["color"] = "#10B981"  # green
        row["sign"] = +1
        mdta_tx.append(row)

    elif "kas mdta" in desc_lower and ttype == "income":
        # Direct income for Kas MDTA
        row["mdta_type"] = "Pemasukan Langsung MDTA"
        row["color"] = "#059669"  # darker green
        row["sign"] = +1
        mdta_tx.append(row)


# ── Sort by date ──
mdta_tx.sort(key=lambda r: r["date"])

# ── Aggregate by month ──
months = defaultdict(lambda: {"alokasi": 0, "pemasukan": 0, "belanja": 0, "items": []})

for r in mdta_tx:
    mk = r["month_key"]
    if r["mdta_type"] == "Alokasi Kas MDTA":
        months[mk]["alokasi"] += r["amount"]
    elif r["mdta_type"] == "Pemasukan Langsung MDTA":
        months[mk]["pemasukan"] += r["amount"]
    elif r["mdta_type"] == "Belanja MDTA":
        months[mk]["belanja"] += r["amount"]
    months[mk]["items"].append(r)

# Monthly net & running balance
running = 0
for mk in sorted(months):
    m = months[mk]
    m["total_in"] = m["alokasi"] + m["pemasukan"]
    m["net"] = m["total_in"] - m["belanja"]
    running += m["net"]
    m["running"] = running

total_alokasi = sum(m["alokasi"] for m in months.values())
total_pemasukan = sum(m["pemasukan"] for m in months.values())
total_belanja = sum(m["belanja"] for m in months.values())
total_mdta = total_alokasi + total_pemasukan - total_belanja

# ── Generate HTML ──
month_rows_html = ""
for mk in sorted(months):
    m = months[mk]
    nama_bulan = datetime.strptime(mk + "-01", "%Y-%m-%d").strftime("%B %Y")
    row_class = "surplus" if m["net"] >= 0 else "deficit"
    month_rows_html += f"""\
<tr class="{row_class}">
  <td>{nama_bulan}</td>
  <td class="num">Rp {m['alokasi']:,}</td>
  <td class="num">Rp {m['pemasukan']:,}</td>
  <td class="num">Rp {m['belanja']:,}</td>
  <td class="num">Rp {m['total_in']:,}</td>
  <td class="num net">{'+' if m['net'] >= 0 else ''}Rp {m['net']:,}</td>
  <td class="num running">Rp {m['running']:,}</td>
</tr>"""

detail_rows_html = ""
for r in mdta_tx:
    icon = {"Alokasi Kas MDTA": "📥", "Pemasukan Langsung MDTA": "💰", "Belanja MDTA": "📤"}[r["mdta_type"]]
    sign_str = "+" if r["sign"] > 0 else "−"
    detail_rows_html += f"""\
<tr>
  <td>{r['date_str']}</td>
  <td><span class="badge" style="background:{r['color']}20;color:{r['color']}">{icon} {r['mdta_type']}</span></td>
  <td>{r['description'][:80]}{'…' if len(r['description'])>80 else ''}</td>
  <td class="num">{sign_str}Rp {r['amount']:,}</td>
</tr>"""

HTML = f"""<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Laporan Kas MDTA — Madrasah Asy Syarif</title>
<style>
*, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
body {{ font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #f1f5f9; color: #1e293b; padding: 24px; }}
h1 {{ font-size: 1.5rem; margin-bottom: 4px; }}
.subtitle {{ color: #64748b; font-size: 0.9rem; margin-bottom: 24px; }}

/* Cards */
.cards {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 28px; }}
.card {{ background: #fff; border-radius: 14px; border: 1px solid #e2e8f0; padding: 18px 20px; }}
.card .label {{ font-size: 0.78rem; text-transform: uppercase; letter-spacing: .05em; color: #64748b; margin-bottom: 6px; }}
.card .value {{ font-size: 1.6rem; font-weight: 700; }}
.card .value.green {{ color: #059669; }}
.card .value.red {{ color: #dc2626; }}
.card .value.blue {{ color: #2563eb; }}

/* Tables */
table {{ width: 100%; border-collapse: collapse; background: #fff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 28px; }}
th, td {{ text-align: left; padding: 10px 14px; border-bottom: 1px solid #f1f5f9; font-size: 0.88rem; }}
th {{ background: #f8fafc; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: .04em; color: #475569; }}
td.num {{ text-align: right; font-variant-numeric: tabular-nums; }}
td.net {{ font-weight: 600; }}
td.running {{ font-weight: 700; color: #2563eb; }}
tr.surplus td.net {{ color: #059669; }}
tr.deficit td.net {{ color: #dc2626; }}
.badge {{ display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 0.78rem; font-weight: 500; white-space: nowrap; }}
tr:last-child td {{ border-bottom: none; }}
h2 {{ font-size: 1.1rem; margin-bottom: 12px; margin-top: 8px; }}

/* Chart bar */
.chart {{ margin-bottom: 28px; }}
.bar-row {{ display: flex; align-items: center; gap: 12px; margin-bottom: 8px; font-size: 0.82rem; }}
.bar-label {{ width: 90px; text-align: right; flex-shrink: 0; color: #475569; }}
.bar-track {{ flex: 1; height: 24px; background: #e2e8f0; border-radius: 12px; overflow: hidden; position: relative; }}
.bar-fill {{ height: 100%; border-radius: 12px; transition: width 0.4s; }}
.bar-amount {{ width: 120px; text-align: right; flex-shrink: 0; font-weight: 600; font-size: 0.82rem; }}

footer {{ text-align: center; font-size: 0.78rem; color: #94a3b8; margin-top: 32px; }}
footer span {{ display: inline-block; margin: 0 8px; }}
</style>
</head>
<body>

<h1>📊 Laporan Kas MDTA</h1>
<p class="subtitle">Madrasah Asy Syarif · Berdasarkan data iuran periode Jan–Jun 2026 · Laporan sementara (heuristic-based)</p>

<!-- Summary Cards -->
<div class="cards">
  <div class="card">
    <div class="label">💰 Saldo Kas MDTA Saat Ini</div>
    <div class="value green">Rp {total_mdta:,}</div>
  </div>
  <div class="card">
    <div class="label">📥 Total Alokasi Masuk</div>
    <div class="value blue">Rp {total_alokasi + total_pemasukan:,}</div>
  </div>
  <div class="card">
    <div class="label">📤 Total Belanja MDTA</div>
    <div class="value red">Rp {total_belanja:,}</div>
  </div>
  <div class="card">
    <div class="label">📅 Bulan Aktif</div>
    <div class="value" style="color:#64748b">{len(months)}</div>
  </div>
</div>

<!-- Chart: Monthly Net -->
<div class="chart">
<h2>📈 Pergerakan Saldo per Bulan</h2>
{"".join(
  f'''<div class="bar-row">
    <span class="bar-label">{datetime.strptime(mk+"-01","%Y-%m-%d").strftime("%b %Y")}</span>
    <div class="bar-track">
      <div class="bar-fill" style="width:{max(1,abs(months[mk]['running'])/max_bal*100 if (max_bal:=max(abs(m["running"]) for m in months.values()) or 1) else 1):.1f}%;background:{'#059669' if months[mk]['running']>=0 else '#dc2626'}"></div>
    </div>
    <span class="bar-amount">Rp {months[mk]['running']:,}</span>
  </div>'''
  for mk in sorted(months)
)}
</div>

<!-- Monthly Table -->
<h2>📅 Rincian per Bulan</h2>
<table>
<thead>
  <tr>
    <th>Bulan</th>
    <th class="num">Alokasi</th>
    <th class="num">Pemasukan Langsung</th>
    <th class="num">Belanja</th>
    <th class="num">Total Masuk</th>
    <th class="num">Net Bulan Ini</th>
    <th class="num">Saldo Akhir</th>
  </tr>
</thead>
<tbody>
{month_rows_html}
</tbody>
</table>

<!-- Detail Transaksi -->
<h2>📋 Detail Transaksi Kas MDTA</h2>
<table>
<thead>
  <tr>
    <th>Tanggal</th>
    <th>Jenis</th>
    <th>Keterangan</th>
    <th class="num">Jumlah</th>
  </tr>
</thead>
<tbody>
{detail_rows_html}
</tbody>
</table>

<!-- Catatan -->
<h2>📝 Catatan</h2>
<table><tbody>
<tr><td style="font-size:0.85rem;line-height:1.6;padding:16px">
<strong>Bagaimana cara bacanya?</strong><br>
• <strong>Alokasi Kas MDTA</strong> — dana yang dialokasikan dari kas utama ke kas MDTA (dicatat sebagai "pengeluaran" di sistem saat ini, tapi sebenarnya hanya pindah amplop).<br>
• <strong>Pemasukan Langsung MDTA</strong> — uang yang masuk langsung ke kas MDTA (misal: potongan tabungan, infaq khusus).<br>
• <strong>Belanja MDTA</strong> — pengeluaran riil yang dibayar dari uang kas MDTA (misal: beli spidol, fotokopi, print soal).<br><br>
<strong>Keterbatasan laporan sementara ini:</strong><br>
• Hanya transaksi yang <em>eksplisit</em> menyebut "Kas MDTA" atau "diambil dari uang kas MDTA" yang masuk hitungan.<br>
• Beberapa transaksi operasional kecil (misal: beli buku mewarnai Rp 4.000 di Februari) tidak tertandai sumber dananya — mungkin dari kas MDTA, mungkin dari kas umum. Hitungan ini konservatif (tidak dianggap belanja MDTA).<br>
• Setelah <strong>rework fund accounting</strong> (dengan kolom <code>category</code> & <code>is_fund_transfer</code>), laporan ini akan jauh lebih akurat.
</td></tr>
</tbody></table>

<footer>
<span>Data: {db['exported_at'][:10]}</span>
<span>·</span>
<span>Madrasah Asy Syarif</span>
</footer>

</body>
</html>"""

OUT.write_text(HTML, encoding="utf-8")
print(f"✅ Generated: {OUT}")
print(f"  Total MDTA: Rp {total_mdta:,}")
print(f"  Alokasi masuk: Rp {total_alokasi:,}")
print(f"  Pemasukan langsung: Rp {total_pemasukan:,}")
print(f"  Belanja MDTA: Rp {total_belanja:,}")
print(f"  Bulan: {len(months)}")
