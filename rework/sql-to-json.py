#!/usr/bin/env python3
"""Convert dump-manual.sql → isi-database.json (format kompatibel dgn laporan lama).

Pipeline:
  1. python dump-manual.py            → dump-manual.sql  (isi DB penuh, dari Supabase)
  2. python sql-to-json.py            → isi-database.json (format JSON yang sama persis
                                       dengan export lama: exported_at/source/tables/summary)

Format output mengikuti isi-database.json lama:
- amount           → string ("50000", bukan 50000.0)
- date/created_at  → ISO "2026-01-16T00:00:00.000Z"
- year/month/year_enrolled → int
- is_paid/has_tabungan      → bool
- old_data/new_data         → dict (JSONB)
- NULL                     → null
"""

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
SQL_PATH = SCRIPT_DIR / "dump-manual.sql"
OUT_PATH = SCRIPT_DIR / "isi-database.json"

TABLE_ORDER = [
    "activity_logs", "settings", "students", "payments",
    "finances", "tabungan", "tabungan_transaksi", "profiles",
]


# ─────────────────────────────────────────────────────────────────────────────
# PARSING SQL (string-aware)
# ─────────────────────────────────────────────────────────────────────────────
def split_top_level(s: str, sep: str = ","):
    """Split s by sep, ignoring sep inside single-quoted strings.

    Handles SQL escaped quotes ('') and multi-line strings.
    """
    parts = []
    cur = []
    i = 0
    n = len(s)
    in_str = False
    while i < n:
        c = s[i]
        if in_str:
            if c == "'":
                # escaped quote ''
                if i + 1 < n and s[i + 1] == "'":
                    cur.append("''")
                    i += 2
                    continue
                in_str = False
                cur.append(c)
                i += 1
                continue
            cur.append(c)
            i += 1
            continue

        # not in string
        if c == "'":
            in_str = True
            cur.append(c)
            i += 1
            continue
        if s.startswith(sep, i):
            parts.append("".join(cur))
            cur = []
            i += len(sep)
            continue
        cur.append(c)
        i += 1

    parts.append("".join(cur))
    return parts


def unescape_sql_string(raw: str) -> str:
    """Raw = value as it appears after parsing (still has surrounding quotes)."""
    if len(raw) >= 2 and raw.startswith("'") and raw.endswith("'"):
        inner = raw[1:-1]
    else:
        inner = raw
    return inner.replace("''", "'")


def strip_cast(raw: str) -> str:
    """Remove ::type cast suffix (e.g. 'abc'::uuid → 'abc')."""
    # find the :: that's outside string quotes
    in_str = False
    for i, ch in enumerate(raw):
        if ch == "'":
            in_str = not in_str
        if ch == ":" and not in_str and i + 1 < len(raw) and raw[i + 1] == ":":
            return raw[:i].strip()
    return raw.strip()


# ─────────────────────────────────────────────────────────────────────────────
# TYPE CONVERSION per column
# ─────────────────────────────────────────────────────────────────────────────
TIMESTAMP_COLS = {"date", "created_at", "updated_at", "paid_at"}
INT_COLS = {"month", "year", "year_enrolled"}
BOOL_COLS = {"is_paid", "has_tabungan"}
JSON_COLS = {"old_data", "new_data"}
UUID_COLS = {"id", "user_id", "entity_id", "payment_id", "student_id"}
AMOUNT_COLS = {"amount"}


def ts_to_iso(raw: str) -> str:
    """'2026-01-16 00:00:00.000000+00:00' → '2026-01-16T00:00:00.000Z'."""
    # raw already unquoted, e.g. 2026-01-16 00:00:00.000000+00:00
    s = raw.strip()
    # separate date + time
    m = re.match(
        r"^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})\.(\d{1,6})(?:[+-]\d{2}:?\d{2}|Z)?$",
        s,
    )
    if m:
        date_part, time_part, frac = m.group(1), m.group(2), m.group(3)
        frac3 = frac[:3].ljust(3, "0")
        return f"{date_part}T{time_part}.{frac3}Z"
    # fallback: replace space with T, normalize +00:00 → Z
    s2 = s.replace(" ", "T")
    if s2.endswith("+00:00"):
        s2 = s2[:-6] + "Z"
    elif s2.endswith("+00"):
        s2 = s2[:-3] + "Z"
    return s2


def convert_value(raw: str, col: str):
    """Convert a parsed SQL value string into Python type per column."""
    raw = strip_cast(raw).strip()

    if raw.upper() == "NULL":
        return None
    if raw.upper() == "TRUE":
        return True
    if raw.upper() == "FALSE":
        return False

    # string literal (with quotes)
    if raw.startswith("'"):
        s = unescape_sql_string(raw)
        if col in TIMESTAMP_COLS:
            return ts_to_iso(s)
        if col in JSON_COLS:
            try:
                return json.loads(s)
            except Exception:
                return s
        return s

    # numeric / other
    if col in INT_COLS:
        try:
            return int(float(raw))
        except ValueError:
            return raw
    if col in AMOUNT_COLS:
        try:
            f = float(raw)
            if f == int(f):
                return str(int(f))
            return f"{f:.2f}"
        except ValueError:
            return raw
    if col in BOOL_COLS:
        return raw.upper() == "TRUE"
    # default: keep as string
    return raw


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────
def parse_inserts(sql_text: str):
    """Parse all INSERT INTO public."table" (...) VALUES (...); statements.

    Returns dict: table → list of row dicts.
    """
    tables = {}

    # find all insert blocks (multi-line safe)
    pattern = re.compile(
        r'INSERT INTO public\.("([^"]+)") \((.*?)\) VALUES \((.*?)\);',
        re.DOTALL,
    )

    for m in pattern.finditer(sql_text):
        table = m.group(2)
        cols_raw = m.group(3)
        vals_raw = m.group(4)

        cols = [c.strip().strip('"') for c in split_top_level(cols_raw)]
        values = split_top_level(vals_raw)

        if len(cols) != len(values):
            print(f"  ⚠️  Mismatch cols/values in {table}: {len(cols)} vs {len(values)}", file=sys.stderr)
            continue

        row = {}
        for col, val in zip(cols, values):
            row[col] = convert_value(val, col)

        tables.setdefault(table, []).append(row)

    return tables


def build_summary(tables):
    """Build summary section identical to old format."""
    total_rows = sum(len(rows) for rows in tables.values())
    table_counts = {t: len(tables.get(t, [])) for t in TABLE_ORDER}

    finance_summary = {"total_income": 0, "total_expense": 0, "balance": 0}
    for r in tables.get("finances", []):
        amt = int(float(r.get("amount") or 0))
        if r.get("type") == "income":
            finance_summary["total_income"] += amt
        elif r.get("type") == "expense":
            finance_summary["total_expense"] += amt
    finance_summary["balance"] = (
        finance_summary["total_income"] - finance_summary["total_expense"]
    )

    return {
        "total_rows": total_rows,
        "table_counts": table_counts,
        "finance_summary": finance_summary,
    }


def main():
    if not SQL_PATH.exists():
        print(f"❌ {SQL_PATH} tidak ditemukan. Jalankan dump-manual.py dulu.")
        sys.exit(1)

    sql_text = SQL_PATH.read_text(encoding="utf-8")
    print(f"📄 Membaca {SQL_PATH.name} ({SQL_PATH.stat().st_size:,} bytes)")

    tables = parse_inserts(sql_text)
    print("✅ INSERT parsed:")
    for t in TABLE_ORDER:
        print(f"   {t}: {len(tables.get(t, []))} rows")

    # pastikan semua tabel ada (yang kosong → count 0, rows [])
    for t in TABLE_ORDER:
        tables.setdefault(t, [])

    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

    data = {
        "exported_at": now,
        "source": "Supabase - agslfqsiswrzqqzveifr",
        "tables": {t: {"count": len(tables[t]), "rows": tables[t]} for t in TABLE_ORDER},
        "summary": build_summary(tables),
    }

    OUT_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n✅ Selesai → {OUT_PATH}")
    print(f"   Total rows: {data['summary']['total_rows']:,}")
    print(f"   Finance: in {data['summary']['finance_summary']['total_income']:,} "
          f"out {data['summary']['finance_summary']['total_expense']:,} "
          f"balance {data['summary']['finance_summary']['balance']:,}")


if __name__ == "__main__":
    main()
