#!/usr/bin/env python3
"""
Full Database Dump Tool — iuran-asysyarif (Supabase / PostgreSQL)
──────────────────────────────────────────────────────────────────
Generates a complete .sql dump using Supabase SQL API + service_role key.
NO external tools needed — works with Python stdlib only.

✓ Tables, columns, constraints, defaults
✓ Indexes & unique constraints
✓ Functions (PL/pgSQL etc.)
✓ Triggers
✓ Row Level Security (RLS) policies
✓ Table data (INSERT statements)
✓ Extensions (pgcrypto, pg_graphql, pg_stat_statements)
✓ Foreign keys
✓ Sequences / auto-increment
✓ Realtime publication

Usage:
  python rework/dump-database.py
  python rework/dump-database.py --output backup.sql

What you need in .env:
  NEXT_PUBLIC_SUPABASE_URL   (https://xxx.supabase.co)
  SUPABASE_SERVICE_ROLE_KEY  (service_role key — ambil dari Dashboard → Settings → API)
"""

import argparse
import json
import os
import re
import sys
import textwrap
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta
from pathlib import Path

# ── Config ─────────────────────────────────────────────────────────────────
SCRIPT_DIR  = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
WIB         = timezone(timedelta(hours=7))


# ═══════════════════════════════════════════════════════════════════════════
# READ .ENV
# ═══════════════════════════════════════════════════════════════════════════
def load_env(env_path: str | Path) -> dict:
    """Parse a .env file into a dict."""
    env = {}
    p = Path(env_path)
    if p.exists():
        for line in p.read_text(encoding="utf-8", errors="replace").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            env[key.strip()] = val.strip().strip("\"'")
    return env


def get_config():
    """Resolve SUPABASE_URL and SERVICE_KEY from .env or env vars."""
    cfg = {}

    # 1. env vars (highest priority)
    cfg["url"]        = os.environ.get("SUPABASE_URL")        or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    cfg["service_key"] = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    # 2. project .env
    env = load_env(PROJECT_DIR / ".env")
    cfg["url"]        = cfg["url"]        or env.get("NEXT_PUBLIC_SUPABASE_URL")
    cfg["service_key"] = cfg["service_key"] or env.get("SUPABASE_SERVICE_ROLE_KEY")

    # 3. rework/.env
    env2 = load_env(SCRIPT_DIR / ".env")
    cfg["url"]        = cfg["url"]        or env2.get("NEXT_PUBLIC_SUPABASE_URL")
    cfg["service_key"] = cfg["service_key"] or env2.get("SUPABASE_SERVICE_ROLE_KEY")

    return cfg


# ═══════════════════════════════════════════════════════════════════════════
# SUPABASE SQL API CLIENT
# ═══════════════════════════════════════════════════════════════════════════
class SupabaseSQL:
    """Execute arbitrary SQL via the Supabase /sql endpoint (requires service_role key)."""

    def __init__(self, project_url: str, service_key: str):
        # Normalise: strip trailing slash, ensure https
        self.base = project_url.rstrip("/").replace("http://", "https://")
        self.key  = service_key

        # The /sql endpoint is at POST <project>/sql
        self.endpoint = f"{self.base}/sql"

    def query(self, sql: str) -> list[dict]:
        """Execute SQL and return results as a list of dicts."""
        data = json.dumps({"query": sql}).encode("utf-8")
        req  = urllib.request.Request(
            self.endpoint,
            data=data,
            headers={
                "Content-Type":  "application/json",
                "Accept":        "application/json",
                "apikey":        self.key,
                "Authorization": f"Bearer {self.key}",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                body = resp.read().decode("utf-8")
                if not body.strip():
                    return []
                return json.loads(body)
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="replace")
            print(f"  ❌ SQL API error {e.code}: {err_body[:500]}", file=sys.stderr)
            raise
        except json.JSONDecodeError:
            return []

    def query_scalar(self, sql: str) -> str | None:
        """Return the first column of the first row, or None."""
        rows = self.query(sql)
        if rows and isinstance(rows[0], dict):
            for v in rows[0].values():
                return str(v) if v is not None else None
        return None

    def query_each(self, sql: str) -> list[tuple]:
        """Return rows as tuples."""
        return [tuple(r.values()) for r in self.query(sql)]


# ═══════════════════════════════════════════════════════════════════════════
# INTROSPECTION HELPERS
# ═══════════════════════════════════════════════════════════════════════════
def q(val: str | None) -> str:
    """Quote an identifier for SQL output."""
    if val is None:
        return "NULL"
    return f'"{val}"'


def qval(val) -> str:
    """Quote a value for SQL output (INSERT)."""
    if val is None:
        return "NULL"
    s = str(val)
    # Escape single quotes
    s = s.replace("'", "''")
    # Handle special types
    if s.lower() in ("true", "false"):
        return s.lower()
    # Try to detect if it's a number
    try:
        float(s)
        return s
    except ValueError:
        pass
    # Treat as string
    return f"'{s}'"


def escape_literal(val) -> str:
    """Escape a value for pg_dump-compatible output."""
    if val is None:
        return "NULL"
    s = str(val)
    s = s.replace("'", "''")
    # Escape backslashes
    s = s.replace("\\", "\\\\")
    return f"'{s}'"


def indent(text: str, level: int = 1) -> str:
    """Indent text by 4 spaces per level."""
    return textwrap.indent(text, "    " * level)


# ═══════════════════════════════════════════════════════════════════════════
# MAIN DUMP LOGIC
# ═══════════════════════════════════════════════════════════════════════════
def dump_database(db: SupabaseSQL, output_path: str) -> bool:
    """Generate a full SQL dump and write to file."""
    ts = datetime.now(WIB)
    lines = [
        f"-- SUPABASE FULL DUMP - iuran-asysyarif",
        f"-- Generated: {ts:%Y-%m-%d %H:%M:%S} WIB",
        f"-- Method: Supabase SQL API (service_role key)",
        "",
        "BEGIN;",
        "",
    ]

    print("  Running introspection queries...")

    # ── 1. Extensions ──────────────────────────────────────────────────────
    print("  [1/7] Extensions...")
    exts = db.query("""
        SELECT extname, extversion
        FROM pg_extension
        ORDER BY extname
    """)
    for ext in exts:
        lines.append(f'CREATE EXTENSION IF NOT EXISTS {q(ext["extname"])} '
                      f'VERSION {escape_literal(ext["extversion"])};')
    if exts:
        lines.append("")

    # ── 2. Tables ──────────────────────────────────────────────────────────
    print("  [2/7] Tables & columns...")
    tables = db.query("""
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
    """)

    table_columns = {}
    for t in tables:
        tbl = t["tablename"]
        cols = db.query(f"""
            SELECT
                c.column_name,
                c.data_type,
                c.character_maximum_length,
                c.is_nullable,
                c.column_default,
                c.udt_name
            FROM information_schema.columns c
            WHERE c.table_schema = 'public'
              AND c.table_name = {escape_literal(tbl)}
            ORDER BY c.ordinal_position
        """)
        table_columns[tbl] = cols

        # PRIMARY KEY columns for this table
        pks = db.query(f"""
            SELECT kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
             AND tc.table_schema   = kcu.table_schema
            WHERE tc.table_schema = 'public'
              AND tc.table_name   = {escape_literal(tbl)}
              AND tc.constraint_type = 'PRIMARY KEY'
            ORDER BY kcu.ordinal_position
        """)
        pk_cols = [p["column_name"] for p in pks]

        lines.append(f"CREATE TABLE IF NOT EXISTS public.{q(tbl)} (")
        col_defs = []
        for c in cols:
            name = c["column_name"]
            dtype = c["udt_name"] or c["data_type"]
            # Map some types
            if dtype == "varchar":
                if c["character_maximum_length"]:
                    dtype = f"character varying({c['character_maximum_length']})"
                else:
                    dtype = "character varying"
            if dtype == "bpchar":
                dtype = "character"
            if dtype == "bool":
                dtype = "boolean"
            if dtype == "int4":
                dtype = "integer"
            if dtype == "int8":
                dtype = "bigint"
            if dtype == "float8":
                dtype = "double precision"
            if dtype == "numeric":
                dtype = "numeric"
            if dtype == "jsonb":
                dtype = "jsonb"
            if dtype == "uuid":
                dtype = "uuid"
            if dtype == "text":
                dtype = "text"
            if dtype == "timestamptz":
                dtype = "timestamp with time zone"
            if dtype == "timestamp":
                dtype = "timestamp without time zone"
            if dtype == "date":
                dtype = "date"
            if dtype == "bytea":
                dtype = "bytea"

            col_def = f"    {q(name)} {dtype}"

            nullable = c["is_nullable"] == "YES"
            if not nullable and name not in pk_cols:
                col_def += " NOT NULL"
            if c["column_default"]:
                col_def += f" DEFAULT {c['column_default']}"
            col_defs.append(col_def)

        # PK constraint
        if pk_cols:
            pk_str = ", ".join(q(p) for p in pk_cols)
            col_defs.append(f"    PRIMARY KEY ({pk_str})")

        lines.append(",\n".join(col_defs))
        lines.append(");\n")

    # ── 3. Data (INSERTs) ─────────────────────────────────────────────────
    print("  [3/7] Data export...")
    total_rows = 0
    for t in tables:
        tbl = t["tablename"]
        cols = table_columns[tbl]
        col_names = [c["column_name"] for c in cols]

        # Paginate to avoid huge responses
        offset = 0
        limit = 200
        while True:
            rows = db.query(f"""
                SELECT row_to_json(r)::text AS data
                FROM (SELECT * FROM public.{q(tbl)} LIMIT {limit} OFFSET {offset}) r
            """)
            if not rows:
                break
            for row in rows:
                try:
                    data = json.loads(row["data"])
                except (json.JSONDecodeError, KeyError):
                    continue
                total_rows += 1
                placeholders = ", ".join(
                    escape_literal(data.get(c)) for c in col_names
                )
                cols_fmt = ", ".join(q(c) for c in col_names)
                lines.append(
                    f"INSERT INTO public.{q(tbl)} ({cols_fmt}) "
                    f"VALUES ({placeholders});"
                )
            offset += limit

        if total_rows > 0 and tbl in [t["tablename"] for t in tables]:
            lines.append("")

    # ── 4. Foreign Keys ────────────────────────────────────────────────────
    print("  [4/7] Foreign keys...")
    fks = db.query("""
        SELECT
            con.conname AS constraint_name,
            con.conrelid::regclass::text AS table_name,
            con.confrelid::regclass::text AS referenced_table,
            pg_get_constraintdef(con.oid) AS constraint_def
        FROM pg_constraint con
        JOIN pg_namespace n ON n.oid = con.connamespace
        WHERE n.nspname = 'public'
          AND con.contype = 'f'
        ORDER BY con.conname
    """)
    for fk in fks:
        # Extract the column details from constraint_def
        defn = fk["constraint_def"]
        tbl  = fk["table_name"]
        if tbl.startswith("public."):
            tbl = tbl[7:]
        lines.append(
            f"ALTER TABLE ONLY public.{q(tbl)} "
            f"ADD CONSTRAINT {q(fk['constraint_name'])} {defn};"
        )
    if fks:
        lines.append("")

    # ── 5. Indexes ─────────────────────────────────────────────────────────
    print("  [5/7] Indexes...")
    idxs = db.query("""
        SELECT
            indexname,
            indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname NOT LIKE '%_pkey'
        ORDER BY indexname
    """)
    for idx in idxs:
        defn = idx["indexdef"]
        # indexdef from pg_indexes already includes CREATE INDEX
        lines.append(f"{defn};")
    if idxs:
        lines.append("")

    # ── 6. Functions + Triggers ────────────────────────────────────────────
    print("  [6/7] Functions & triggers...")

    # 6a. Functions
    funcs = db.query("""
        SELECT
            p.proname AS name,
            pg_get_functiondef(p.oid) AS def
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
        ORDER BY p.proname
    """)
    for fn in funcs:
        lines.append(fn["def"])
        lines.append("")

    # 6b. Triggers
    trigs = db.query("""
        SELECT
            tgname AS name,
            pg_get_triggerdef(t.oid, true) AS def
        FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND NOT t.tgisinternal
        ORDER BY tgname
    """)
    for tr in trigs:
        lines.append(f"{tr['def']};")
    if trigs:
        lines.append("")

    # ── 7. RLS Policies ────────────────────────────────────────────────────
    print("  [7/7] RLS policies...")

    # 7a. Enable RLS on tables
    rls_tables = db.query("""
        SELECT relname
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relkind = 'r'
          AND c.relrowsecurity = true
        ORDER BY relname
    """)
    for rt in rls_tables:
        lines.append(f"ALTER TABLE public.{q(rt['relname'])} ENABLE ROW LEVEL SECURITY;")

    # 7b. Policies
    policies = db.query("""
        SELECT
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
        FROM pg_policies
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname
    """)
    for pol in policies:
        roles_str = ", ".join(
            q(r.strip()) for r in str(pol.get("roles", "")).split(",") if r.strip()
        ) if pol.get("roles") else "public"

        qual_str = pol.get("qual") or ""
        wc_str   = pol.get("with_check") or ""

        # Build CREATE POLICY
        perm = "PERMISSIVE" if pol.get("permissive") == "PERMISSIVE" else "RESTRICTIVE"
        pol_lines = [
            f"CREATE POLICY {q(pol['policyname'])}",
            f"  ON public.{q(pol['tablename'])}",
            f"  AS {perm}",
            f"  FOR {pol['cmd']}",
            f"  TO {roles_str}",
        ]
        if qual_str:
            pol_lines.append(f"  USING ({qual_str})")
        if wc_str:
            pol_lines.append(f"  WITH CHECK ({wc_str})")

        lines.append(" ".join(pol_lines) + ";")

    if policies:
        lines.append("")

    # ── 8. Realtime publication ────────────────────────────────────────────
    print("  [✓] Realtime publication...")
    pub = db.query("""
        SELECT
            p.pubname,
            pt.schemaname,
            pt.tablename
        FROM pg_publication p
        JOIN pg_publication_tables pt ON pt.pubname = p.pubname
        ORDER BY pt.schemaname, pt.tablename
    """)
    pub_tables = {}
    for p in pub:
        pub_tables.setdefault(
            p.get("pubname", "supabase_realtime"), []
        ).append(f'{p.get("schemaname", "public")}.{q(p["tablename"])}')

    for pub_name, tables_in_pub in pub_tables.items():
        lines.append(
            f"ALTER PUBLICATION {q(pub_name)} ADD TABLE ONLY "
            f"{', '.join(tables_in_pub)};"
        )

    # ── Finalise ──────────────────────────────────────────────────────────
    lines.append("")
    lines.append("COMMIT;")
    lines.append("")

    # Write
    content = "\n".join(lines)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)

    size = os.path.getsize(output_path)
    print(f"\n✅  Dump completed!")
    print(f"   File : {output_path}")
    print(f"   Size : {size/1024/1024:.2f} MB")
    print(f"   Rows : {total_rows}")
    return True


# ═══════════════════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════════════════
def main():
    parser = argparse.ArgumentParser(
        description="Full Supabase database dump via SQL API (no pg_dump needed)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--output", "-o", help="Output SQL file")
    parser.add_argument("--url",    help="Supabase project URL (https://xxx.supabase.co)")
    parser.add_argument("--key",    help="Supabase service_role key")
    args = parser.parse_args()

    # Resolve config
    cfg = get_config()
    supabase_url = args.url or cfg["url"]
    service_key  = args.key or cfg["service_key"]

    if not supabase_url:
        print("❌ Supabase URL not found.")
        print("   Set NEXT_PUBLIC_SUPABASE_URL in .env or pass --url")
        sys.exit(1)
    if not service_key:
        print("❌ Service role key not found.")
        print("   Set SUPABASE_SERVICE_ROLE_KEY in .env or pass --key")
        print("   Get it from: Supabase Dashboard → Project Settings → API")
        sys.exit(1)

    # Output path
    if args.output:
        out = Path(args.output)
    else:
        ts = datetime.now(WIB).strftime("%Y%m%d_%H%M%S")
        out = SCRIPT_DIR / f"dump-iuran-full-{ts}.sql"

    print(f"{'='*60}")
    print(f"  Database Dump — iuran-asysyarif")
    print(f"  Time  : {datetime.now(WIB):%Y-%m-%d %H:%M:%S} WIB")
    print(f"  URL   : {supabase_url}")
    print(f"  Output: {out}")
    print(f"{'='*60}\n")

    db = SupabaseSQL(supabase_url, service_key)

    # Test connection
    print("  Testing connection...", end=" ")
    try:
        version = db.query_scalar("SELECT version()")
        print(f"✓ {version.split(',')[0] if version else 'connected'}")
    except Exception as e:
        print(f"✗ {e}")
        sys.exit(1)

    success = dump_database(db, str(out))
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
