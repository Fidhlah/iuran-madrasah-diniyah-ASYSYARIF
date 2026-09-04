"""Test split_statements dari restore-apply.py (tanpa jalankan main)."""
import sys
import importlib.util
from pathlib import Path

# load restore-apply sebagai modul
spec = importlib.util.spec_from_file_location("ra", "restore-apply.py")
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

for name in ["backup-restore-target.sql", "backup-full-asysyarif.sql"]:
    sql = Path("data") / name
    text = sql.read_text(encoding="utf-8")
    stmts = m.split_statements(text)
    print(f"=== {name} ===")
    print(f"  Jumlah statement: {len(stmts)}")
    print(f"  Pertama: {stmts[0][:70]!r}")
    print(f"  Terakhir: {stmts[-1][:70]!r}")
    # cek BEGIN di awal, COMMIT di akhir
    print(f"  statement[0] == 'BEGIN': {stmts[0]=='BEGIN'}")
    print(f"  statement[-1] == 'COMMIT': {stmts[-1]=='COMMIT'}")
    print()