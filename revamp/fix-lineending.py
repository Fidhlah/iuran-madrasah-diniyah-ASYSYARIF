from pathlib import Path

DATA = Path(r"D:\fidh\Coding\Madrasah\iuran-asysyarif\revamp\data")
SQL = DATA / "backup-full-asysyarif.sql"

raw = SQL.read_bytes()
print(f"Sebelum: {len(raw)} bytes")
n_crlf = raw.count(b"\r\n")
print(f"  CRLF: {n_crlf} baris")
print(f"  LF: {raw.count(bytes([10]))} baris")

fixed = raw.replace(b"\r\n", b"\n")
SQL.write_bytes(fixed)

remain = fixed.count(b"\r\n")
print(f"\nSesudah: {len(fixed)} bytes")
crlf_name = "CRLF"
print(f"  {crlf_name} tersisa: {remain}")
print("done")