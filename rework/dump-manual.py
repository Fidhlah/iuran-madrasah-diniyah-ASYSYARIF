#!/usr/bin/env python3
"""
Dump manual database iuran-asysyarif via PostgreSQL langsung.
Membaca DATABASE_URL dari .env — tidak butuh SUPABASE_SERVICE_ROLE_KEY.

Usage:
    python rework/dump-manual.py
    python rework/dump-manual.py --output custom-name.sql

Output: rework/dump-manual.sql (default)
"""

import os
import re
import sys
import json
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from uuid import UUID

# ── Cek & install pg8000 ──────────────────────────────────────────────
def ensure_pg8000():
    try:
        from pg8000.native import Connection, literal
        return Connection, literal
    except ImportError:
        import subprocess
        print("📦 Menginstall pg8000...")
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", "pg8000", "--quiet"]
        )
        from pg8000.native import Connection, literal
        return Connection, literal


# ── Parse .env ────────────────────────────────────────────────────────
def load_env(env_path: Path) -> dict:
    env = {}
    if not env_path.exists():
        print(f"❌ File .env tidak ditemukan di {env_path}")
        sys.exit(1)
    with open(env_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            key, _, val = line.partition("=")
            key = key.strip()
            val = val.strip().strip("\"'").strip()
            env[key] = val
    return env


# ── Parse connection string ────────────────────────────────────────────
def parse_pg_url(url: str) -> dict:
    import urllib.parse

    m = re.match(
        r"postgresql://(.+?):(.+?)@(.+?):(\d+)/(.+?)(\?.*)?$", url
    )
    if not m:
        print("❌ Gagal parse URL")
        print(f"   URL: {url[:60]}...")
        sys.exit(1)
    dbname = m.group(5).split("?")[0]
    return {
        "user": urllib.parse.unquote(m.group(1)),
        "password": urllib.parse.unquote(m.group(2)),
        "host": m.group(3),
        "port": int(m.group(4)),
        "database": dbname,
    }


# ── Type → SQL value ──────────────────────────────────────────────────
def sql_val(v):
    """Convert Python value to SQL string using pg8000's literal()."""
    global _literal
    
    if v is None:
        return "NULL"

    if isinstance(v, bool):
        return "TRUE" if v else "FALSE"

    if isinstance(v, (int, float, Decimal)):
        return str(v)

    if isinstance(v, UUID):
        return f"'{v}'::uuid"

    if isinstance(v, datetime):
        if v.tzinfo:
            s = v.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M:%S.%f") + "+00:00"
            return f"'{s}'::timestamp"
        else:
            return f"'{v.strftime('%Y-%m-%d %H:%M:%S.%f')}'::timestamp"

    if isinstance(v, (dict, list)):
        return _literal(json.dumps(v, default=str))

    if isinstance(v, bytes):
        return f"'\\\\x{v.hex()}'"

    return _literal(str(v))


_literal = None  # set during main()


# ── Main ──────────────────────────────────────────────────────────────
def main():
    output_name = "dump-manual.sql"
    if len(sys.argv) > 2 and sys.argv[1] == "--output":
        output_name = sys.argv[2]

    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent
    env_path = project_root / ".env"
    output_path = script_dir / output_name

    pg = ensure_pg8000()
    global _literal
    Connection, _literal = pg

    env = load_env(env_path)

    url = env.get("DIRECT_URL") or env.get("DATABASE_URL")
    if not url:
        print("❌ DATABASE_URL atau DIRECT_URL tidak ditemukan di .env")
        sys.exit(1)

    cfg = parse_pg_url(url)

    print(f"🔌 Connecting to {cfg['host']}:{cfg['port']}/{cfg['database']} as {cfg['user']}...")
    conn = Connection(
        user=cfg["user"],
        password=cfg["password"],
        host=cfg["host"],
        port=cfg["port"],
        database=cfg["database"],
    )
    print("✅ Connected!")

    # Get all public tables
    tables = conn.run(
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_schema='public' AND table_type='BASE TABLE' "
        "ORDER BY table_name"
    )
    table_names = [t[0] for t in tables]
    print(f"📋 Tables ({len(table_names)}): {', '.join(table_names)}")

    # Get sequences
    seqs = conn.run(
        "SELECT sequence_name FROM information_schema.sequences "
        "WHERE sequence_schema='public'"
    )

    lines = []
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    lines.append("-- SUPABASE FULL DUMP - iuran-asysyarif")
    lines.append("-- Dibuat manual via PostgreSQL (dump-manual.py)")
    lines.append(f"-- Tanggal: {ts}")
    lines.append(f"-- Project: agslfqsiswrzqqzveifr")
    lines.append("")
    lines.append("BEGIN;")
    lines.append("")

    # Extensions
    exts = conn.run("SELECT extname FROM pg_extension ORDER BY extname")
    for e in exts:
        lines.append(f'CREATE EXTENSION IF NOT EXISTS "{e[0]}";')
    if exts:
        lines.append("")

    # Get column info for each table
    for tn in table_names:
        cols = conn.run(
            "SELECT column_name, data_type, is_nullable, column_default "
            "FROM information_schema.columns "
            f"WHERE table_schema='public' AND table_name='{tn}' "
            "ORDER BY ordinal_position",
        )
        col_names = [c[0] for c in cols]

        # Fetch all rows
        rows = conn.run(f'SELECT * FROM public."{tn}" ORDER BY 1')

        if not rows:
            # Still create the table (already exists from restore)
            continue

        for row in rows:
            vals = []
            for i, v in enumerate(row):
                vals.append(sql_val(v))

            quoted_cols = ", ".join(f'"{c}"' for c in col_names)
            quoted_vals = ", ".join(vals)
            lines.append(
                f'INSERT INTO public."{tn}" ({quoted_cols}) VALUES ({quoted_vals});'
            )

        lines.append("")

    lines.append("COMMIT;")
    lines.append("")

    output_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    total_inserts = sum(1 for l in lines if l.startswith("INSERT"))
    print(f"\n✅ Selesai!")
    print(f"   File: {output_path}")
    print(f"   Total INSERT: {total_inserts:,}")
    print(f"   Size: {output_path.stat().st_size:,} bytes")

    conn.close()


if __name__ == "__main__":
    main()
