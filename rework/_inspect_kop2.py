import zipfile
from xml.etree import ElementTree as ET

path = r'D:\fidh\Asysyarif\Dokumen\KOP-MDTA.docx'
W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'

with zipfile.ZipFile(path) as z:
    names = z.namelist()
    print("=== FILE DALAM DOCX ===")
    for n in names:
        print(f"  {n}")
    print()
    # document.xml text content
    xml = z.read('word/document.xml').decode('utf-8')
    root = ET.fromstring(xml)
    texts = []
    for t in root.iter(W + 't'):
        texts.append(t.text or '')
    print("=== TEKS document.xml ===")
    print(repr(''.join(texts)))
    print()
    # any images / media?
    media = [n for n in names if 'media' in n or 'image' in n]
    print("=== MEDIA ===")
    for m in media:
        info = z.getinfo(m)
        print(f"  {m} ({info.file_size} bytes)")