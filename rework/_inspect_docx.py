import docx
from docx.shared import Pt

path = r'D:/fidh/Asysyarif/Dokumen/Keuangan/Laporan Keuangan Bulanan/Juni 2026/Laporan Keuangan Bulan Juni 2026.docx'
doc = docx.Document(path)

print("=== BODY ELEMENTS (urutan) ===")
body = doc.element.body
for child in body.iterchildren():
    tag = child.tag.split('}')[-1]
    if tag == 'p':
        text = ''.join(t.text or '' for t in child.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'))
        if text.strip():
            # get alignment & style
            pPr = child.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}pPr')
            style = ''
            align = ''
            if pPr is not None:
                st = pPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}pStyle')
                if st is not None:
                    style = st.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val')
                jc = pPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}jc')
                if jc is not None:
                    align = jc.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val')
            print(f"  [P style={style!r} align={align!r}] {text[:80]}")
    elif tag == 'tbl':
        rows = child.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tr')
        print(f"  [TABLE: {len(rows)} rows]")