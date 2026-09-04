#!/usr/bin/env python3
"""Fase 1: Dump LENGKAP Supabase Iuran Asysyarif → file SQL restore-able.

Membaca DIRTY/DATABASE_URL dari .env (project root), connect ke postgres,
dan tulis SATU file SQL yang bisa meng-create ulang seluruh DB:
schema + data + FK + index + function + trigger + RLS + realtime.

Sifat: READ-ONLY. Tidak menulis apa-apa ke DB. Aman dijalankan berulang.
"""

import json
import os
import re
import sys
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path
from decimal import Decimal
from uuid import UUID

try:
    from pg8000.native import Connection, literal
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pg8000", "--quiet"])
    from pg8000.native import Connection, literal

# ── Lokasi ──
PROJECT_ROOT = Path(r"D:\fidh\Coding\Madrasah\iuran-asysyarif")
OUT_DIR = PROJECT_ROOT / "revamp"
OUT_DIR.mkdir(exist_ok=True)
OUT_SQL = OUT_DIR / "backup-full-asysyarif.sql"
OUT_JSON = OUT_DIR / "backup-full-asysyarif.json"
OUT_SUMMARY = OUT_DIR / "backup-full-SUMMARY.md"

WIB = timezone.utc


# ── Env ──
def load_env(p):
    env = {}
    for line in Path(p).read_text(encoding="utf-8", errors="replace").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip().strip("'\"")
    return env


def get_url(env):
    return env.get("DIRECT_URL") or env.get("DATABASE_URL")


def parse_pg_url(url):
    m = re.match(r"postgresql://(.+?):(.+?)@(.+?):(\d+)/(.+?)(\?.*)?$", url)
    if not m:
        raise SystemExit("Gagal parse DATABASE_URL")
    return dict(
        user=urllib.parse.unquote(m.group(1)),
        password=urllib.parse.unquote(m.group(2)),
        host=m.group(3),
        port=int(m.group(4)),
        database=m.group(5).split("?")[0],
    )


# ── SQL value encoder ──
def sql_val(v):
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "TRUE" if v else "FALSE"
    if isinstance(v, (int, float, Decimal)):
        return str(v)
    if isinstance(v, UUID):
        return f"'{v}'::uuid"
    if isinstance(v, (datetime,)):
        s = v.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M:%S.%f") + "+00:00"
        return f"'{s}'::timestamp"
    if isinstance(v, (dict, list)):
        return literal(json.dumps(v, default=str))
    if isinstance(v, bytes):
        return f"'\\x{v.hex()}'"
    return literal(str(v))


# ── Type mapping ──
def map_type(udt):
    return {
        "varchar": "character varying",
        "bpchar": "character",
        "bool": "boolean",
        "int2": "smallint",
        "int4": "integer",
        "int8": "bigint",
        "float4": "real",
        "float8": "double precision",
        "numeric": "numeric",
        "text": "text",
        "uuid": "uuid",
        "jsonb": "jsonb",
        "json": "json",
        "timestamptz": "timestamp with time zone",
        "timestamp": "timestamp without time zone",
        "date": "date",
        "bytea": "bytea",
        "oid": "oid",
    }.get(udt, udt)


def q(s):
    return f'"{s}"'


def main():
    env = load_env(PROJECT_ROOT / ".env")
    url = get_url(env)
    if not url:
        raise SystemExit("Tidak ada DATABASE_URL/DIRECT_URL di .env")
    cfg = parse_pg_url(url)

    print(f"🔌 Connect {cfg['host']}:{cfg['port']}/{cfg['database']} ...")
    conn = Connection(user=cfg["user"], password=cfg["password"],
                      host=cfg["host"], port=cfg["port"], database=cfg["database"])
    print("✅ Connected")

    lines = []
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    lines.append(f"-- SUPABASE FULL BACKUP - iuran-asysyarif ({cfg['database']})")
    lines.append(f"-- Generated: {ts}")
    lines.append(f"-- Method: read-only via DATABASE_URL (pg8000)")
    lines.append("BEGIN;")
    lines.append("")

    # 1. Extensions
    exts = conn.run("SELECT extname, extversion FROM pg_extension ORDER BY extname")
    for e in exts:
        lines.append(f"CREATE EXTENSION IF NOT EXISTS {q(e[0])} VERSION '{e[1]}';")
    if exts:
        lines.append("")

    # 2. Tables (a.k.a. CREATE TABLE)
    tables = conn.run("""SELECT table_name FROM information_schema.tables
        WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name""")
    table_names = [t[0] for t in tables]
    print(f"📋 Tables ({len(table_names)}): {', '.join(table_names)}")

    # PK per table
    pk_map = {}
    for r in conn.run("""SELECT tc.table_name, kcu.column_name FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema
        WHERE tc.constraint_type='PRIMARY KEY' AND tc.table_schema='public' ORDER BY tc.table_name, kcu.ordinal_position"""):
        pk_map.setdefault(r[0], []).append(r[1])

    for t in table_names:
        cols = conn.run(f"""SELECT column_name, udt_name, character_maximum_length, is_nullable, column_default
            FROM information_schema.columns WHERE table_schema='public' AND table_name={literal(t)} ORDER BY ordinal_position""")
        pks = pk_map.get(t, [])
        defs = []
        for c in cols:
            name, udt, maxlen, nullable, default = c[0], c[1], c[2], c[3], c[4]
            dtype = map_type(udt)
            if udt == "varchar" and maxlen:
                dtype = f"character varying({maxlen})"
            d = f"    {q(name)} {dtype}"
            if nullable != "YES" and name not in pks:
                d += " NOT NULL"
            if default:
                d += f" DEFAULT {default}"
            defs.append(d)
        if pks:
            defs.append(f"    PRIMARY KEY ({', '.join(q(p) for p in pks)})")
        lines.append(f"CREATE TABLE IF NOT EXISTS public.{q(t)} (")
        lines.append(",\n".join(defs))
        lines.append(");")
        lines.append("")

    # 3. Data (INSERT)
    data_rows_total = 0
    for t in table_names:
        colnames = [c[0] for c in conn.run(
            f"SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name={literal(t)} ORDER BY ordinal_position")]
        # baca data
        offset = 0
        while True:
            rows = conn.run(f"SELECT * FROM public.{q(t)} LIMIT 200 OFFSET {offset}")
            if not rows:
                break
            for row in rows:
                vals = ", ".join(sql_val(v) for v in row)
                lines.append(f"INSERT INTO public.{q(t)} ({', '.join(q(c) for c in colnames)}) VALUES ({vals});")
                data_rows_total += 1
            offset += 200
        lines.append("")

    # 4. Foreign keys
    fks = conn.run("""SELECT con.conname, con.conrelid::regclass::text AS tbl, pg_get_constraintdef(con.oid) AS def
        FROM pg_constraint con JOIN pg_namespace n ON n.oid=con.connamespace
        WHERE n.nspname='public' AND con.contype='f' ORDER BY con.conname""")
    for fk in fks:
        tbl = fk[1]
        if tbl.startswith("public."):
            tbl = tbl[7:]
        lines.append(f"ALTER TABLE ONLY public.{q(tbl)} ADD CONSTRAINT {q(fk[0])} {fk[2]};")
    if fks:
        lines.append("")

    # 5. Indexes (non-PK)
    idxs = conn.run("""SELECT indexname, indexdef FROM pg_indexes
        WHERE schemaname='public' AND indexname NOT LIKE '%_pkey' ORDER BY indexname""")
    for ix in idxs:
        lines.append(f"{ix[1]};")
    if idxs:
        lines.append("")

    # 6. Functions
    funcs = conn.run("""SELECT p.proname, pg_get_functiondef(p.oid)::text AS def FROM pg_proc p
        JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prokind='f' ORDER BY p.proname""")
    for fn in funcs:
        lines.append(fn[1])
        lines.append("")

    # 7. Triggers
    trigs = conn.run("""SELECT tgname, pg_get_triggerdef(t.oid, true)::text AS def FROM pg_trigger t
        JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND NOT t.tgisinternal ORDER BY tgname""")
    for tr in trigs:
        lines.append(f"{tr[1]};")
    if trigs:
        lines.append("")

    # 8. RLS
    rls_tables = conn.run("""SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND relkind='r' AND relrowsecurity=true ORDER BY relname""")
    for rt in rls_tables:
        lines.append(f"ALTER TABLE public.{q(rt[0])} ENABLE ROW LEVEL SECURITY;")
    if rls_tables:
        lines.append("")
    policies = conn.run("""SELECT tablename, policyname, permissive, cmd, qual, with_check FROM pg_policies
        WHERE schemaname='public' ORDER BY tablename, policyname""")
    for pol in policies:
        p_lines = [f"CREATE POLICY {q(pol[1])}", f"  ON public.{q(pol[0])}",
                   f"  AS {pol[2]}", f"  FOR {pol[3]}", "  TO public"]
        if pol[4]:
            p_lines.append(f"  USING ({pol[4]})")
        if pol[5]:
            p_lines.append(f"  WITH CHECK ({pol[5]})")
        lines.append(" ".join(p_lines) + ";")
    if policies:
        lines.append("")

    # 9. Realtime publication
    realtime_tables = conn.run("""SELECT schemaname, tablename FROM pg_publication_tables
        WHERE pubname='supabase_realtime' ORDER BY tablename""")
    for rt in realtime_tables:
        lines.append(f"ALTER PUBLICATION supabase_realtime ADD TABLE {rt[0]}.{q(rt[1])};")
    if realtime_tables:
        lines.append("")

    lines.append("COMMIT;")

    sql_text = "\n".join(lines) + "\n"
    OUT_SQL.write_text(sql_text, encoding="utf-8")
    print(f"\n✅ SQL ditulis: {OUT_SQL}")
    print(f"   baris: {len(lines)}, bytes: {OUT_SQL.stat().st_size:,}")

    # juga tulis JSON data
    json_data = {"tables": {}}
    for t in table_names:
        rows = conn.run(f"SELECT * FROM public.{q(t)}")
        colnames = [c[0] for c in conn.run(
            f"SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name={literal(t)} ORDER BY ordinal_position")]
        dicts = []
        for row in rows:
            d = {}
            for i, cn in enumerate(colnames):
                v = row[i]
                if isinstance(v, (Decimal,)):
                    v = str(v)
                elif isinstance(v, UUID):
                    v = str(v)
                elif isinstance(v, (datetime,)):
                    v = v.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
                elif isinstance(v, bytes):
                    v = v.hex()
                d[cn] = v
            dicts.append(d)
        json_data["tables"][t] = {"count": len(dicts), "rows": dicts}
    OUT_JSON.write_text(json.dumps(json_data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"✅ JSON ditulis: {OUT_JSON} ({OUT_JSON.stat().st_size:,} bytes)")

    conn.close()

    # ringkas untuk console
    print(f"\nTotal INSERT: {data_rows_total:,}")
    print(f"Total function: {len(funcs)}, trigger: {len(trigs)}, index: {len(idxs)}, policy: {len(policies)}, realtime: {len(realtime_tables)}")


if __name__ == "__main__":
    main()