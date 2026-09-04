"""Fix SQL: tambah ';' setelah terminator $function$ yang belum ada."""
from pathlib import Path
import re

DATA = Path(r"D:\fidh\Coding\Madrasah\iuran-asysyarif\revamp\data")
SQL = DATA / "backup-full-asysyarif.sql"

lines = SQL.read_text(encoding="utf-8").splitlines(keepends=True)
out = []
changed = 0
for i, line in enumerate(lines):
    stripped = line.rstrip("\n").rstrip("\r")
    # baris terminator $function$ / $tag$
    if re.fullmatch(r"[$][\w]*[$]", stripped.strip()):
        if not stripped.rstrip().endswith(";"):
            out.append(stripped.rstrip() + ";\n")
            changed += 1
            print("  +; line " + str(i + 1) + ": " + stripped.strip())
            continue
    out.append(line)

SQL.write_text("".join(out), encoding="utf-8")
print("")
print("Done. Ditambahkan ';' ke " + str(changed) + " terminator")
print("Total baris: " + str(len(out)))