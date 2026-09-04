import zipfile
from xml.etree import ElementTree as ET
import json

# ── Parse DOCX Lampiran ──
path = r'D:/fidh/Asysyarif/Dokumen/Keuangan/Laporan Keuangan Bulanan/Juni 2026/Laporan Keuangan Bulan Juni 2026.docx'
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with zipfile.ZipFile(path) as z:
    xml = z.read('word/document.xml').decode('utf-8')
root = ET.fromstring(xml)
tables = root.findall('.//w:tbl', ns)

# Tabel 1 = Lampiran transaksi
rows = tables[1].findall('.//w:tr', ns)
docx_tx = []
for r in rows[1:]:  # skip header
    cells = [''.join(t.text or '' for t in c.findall('.//w:t', ns)) for c in r.findall('.//w:tc', ns)]
    if len(cells) >= 5:
        no, tgl, jenis, ket, jumlah = cells[0], cells[1], cells[2], cells[3], cells[4]
        try:
            amt = int(jumlah)
        except ValueError:
            amt = 0
        docx_tx.append({'no': no, 'tgl': tgl, 'jenis': jenis, 'ket': ket, 'amt': amt})

print(f"DOCX Lampiran: {len(docx_tx)} transaksi")
docx_in = sum(t['amt'] for t in docx_tx if 'masuk' in t['jenis'].lower() or 'pemasukan' in t['jenis'].lower())
docx_out = sum(t['amt'] for t in docx_tx if 'keluar' in t['jenis'].lower() or 'pengeluaran' in t['jenis'].lower())
print(f"  Pemasukan: Rp {docx_in:,}")
print(f"  Pengeluaran: Rp {docx_out:,}")

# ── Data JSON Juni ──
with open('isi-database-backup-janjun.json', 'r', encoding='utf-8') as f:
    old = json.load(f)
fin = [r for r in old['tables']['finances']['rows'] if (r.get('date') or '')[:7] == '2026-06']
json_in = sum(int(float(r['amount'])) for r in fin if r['type'] == 'income')
json_out = sum(int(float(r['amount'])) for r in fin if r['type'] == 'expense')
print(f"\nJSON Juni: {len(fin)} transaksi")
print(f"  Pemasukan: Rp {json_in:,}")
print(f"  Pengeluaran: Rp {json_out:,}")

# ── Bandingkan per transaksi ──
print(f"\n=== BANDING PER TRANSAKSI ===")
json_desc = {}
for r in fin:
    key = r['description'].strip()
    json_desc.setdefault(key, []).append(int(float(r['amount'])))

docx_desc = {}
for t in docx_tx:
    docx_desc.setdefault(t['ket'].strip(), []).append(t['amt'])

all_keys = sorted(set(json_desc) | set(docx_desc))
mismatch = 0
for k in all_keys:
    j = json_desc.get(k)
    d = docx_desc.get(k)
    if j != d:
        mismatch += 1
        print(f"  DIFFER: {k[:60]}")
        print(f"    JSON: {j}")
        print(f"    DOCX: {d}")

print(f"\nTotal deskripsi beda: {mismatch}")
print(f"JSON unik: {len(json_desc)}, DOCX unik: {len(docx_desc)}")
