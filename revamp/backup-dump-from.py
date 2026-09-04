#!/usr/bin/env python3
"""Baseline backup PROJECT BARU (pkfouqetuofnvidvrfyn) — sebelum perubahan besar.

Clean adaptasi backup-dump-full.py yang baca .env (project baru) dari cmd arg,
dan output ke path yang ditentukan. READ-ONLY terhadap project baru.

Pakai: python backup-dump-from.py <path_env> <path_output_sql> <path_output_json>
"""
import json, os, re, sys, urllib.parse
from datetime import datetime, timezone
from pathlib import Path
from decimal import Decimal
from uuid import UUID
from pg8000.native import Connection, literal

def load_env(p):
    env = {}
    for line in Path(p).read_text(encoding="utf-8", errors="replace").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip().strip("'\"")
    return env

def parse_pg_url(url):
    m = re.match(r"postgresql://([^:/]+):([^@]+)@([^:/]+):(\d+)/([^?]+)(\?.*)?$", url)
    if not m:
        raise SystemExit("Gagal parse DATABASE_URL")
    return dict(user=urllib.parse.unquote(m.group(1)), password=urllib.parse.unquote(m.group(2)),
                host=m.group(3), port=int(m.group(4)), database=m.group(5).split("?")[0])

def sql_val(v):
    if v is None: return "NULL"
    if isinstance(v, bool): return "TRUE" if v else "FALSE"
    if isinstance(v, (int, float, Decimal)): return str(v)
    if isinstance(v, UUID): return f"'{v}'::uuid"
    if isinstance(v, (datetime,)):
        s = v.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M:%S.%f") + "+00:00"
        return f"'{s}'::timestamp"
    if isinstance(v, (dict, list)): return literal(json.dumps(v, default=str))
    if isinstance(v, bytes): return f"'\\x{v.hex()}'"
    return literal(str(v))

def map_type(udt):
    return {"varchar":"character varying","bpchar":"character","bool":"boolean","int2":"smallint",
            "int4":"integer","int8":"bigint","float4":"real","float8":"double precision",
            "numeric":"numeric","text":"text","uuid":"uuid","jsonb":"jsonb","json":"json",
            "timestamptz":"timestamp with time zone","timestamp":"timestamp without time zone",
            "date":"date","bytea":"bytea","oid":"oid"}.get(udt, udt)

def q(s): return f'"{s}"'

def main():
    env_path, out_sql, out_json = sys.argv[1], sys.argv[2], sys.argv[3]
    env = load_env(env_path)
    url = env.get("DIRECT_URL") or env.get("DATABASE_URL")
    cfg = parse_pg_url(url)
    ref = re.search(r"([a-z0-9]{20})\.supabase", url)
    ref = ref.group(1) if ref else "?"
    print(f"🔌 Backup dari project {ref}")
    conn = Connection(user=cfg["user"], password=cfg["password"], host=cfg["host"],
                      port=cfg["port"], database=cfg["database"])
    lines = []
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    lines.append(f"-- SUPABASE BASELINE BACKUP - project {ref}")
    lines.append(f"-- Generated: {ts}")
    lines.append("BEGIN;"); lines.append("")

    exts = conn.run("SELECT extname, extversion FROM pg_extension ORDER BY extname")
    for e in exts:
        lines.append(f"CREATE EXTENSION IF NOT EXISTS {q(e[0])} VERSION '{e[1]}';")
    if exts: lines.append("")

    tables = [t[0] for t in conn.run(
        "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name")]
    pk_map = {}
    for r in conn.run("""SELECT tc.table_name, kcu.column_name FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema
        WHERE tc.constraint_type='PRIMARY KEY' AND tc.table_schema='public' ORDER BY tc.table_name, kcu.ordinal_position"""):
        pk_map.setdefault(r[0], []).append(r[1])

    for t in tables:
        cols = conn.run(f"""SELECT column_name, udt_name, character_maximum_length, is_nullable, column_default
            FROM information_schema.columns WHERE table_schema='public' AND table_name={literal(t)} ORDER BY ordinal_position""")
        pks = pk_map.get(t, [])
        defs = []
        for c in cols:
            name, udt, maxlen, nullable, default = c
            dtype = map_type(udt)
            if udt == "varchar" and maxlen: dtype = f"character varying({maxlen})"
            d = f"    {q(name)} {dtype}"
            if nullable != "YES" and name not in pks: d += " NOT NULL"
            if default: d += f" DEFAULT {default}"
            defs.append(d)
        if pks: defs.append(f"    PRIMARY KEY ({', '.join(q(p) for p in pks)})")
        lines.append(f"CREATE TABLE IF NOT EXISTS public.{q(t)} (")
        lines.append(",\n".join(defs)); lines.append(");"); lines.append("")

    data_total = 0
    for t in tables:
        colnames = [c[0] for c in conn.run(
            f"SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name={literal(t)} ORDER BY ordinal_position")]
        off = 0
        while True:
            rows = conn.run(f"SELECT * FROM public.{q(t)} LIMIT 200 OFFSET {off}")
            if not rows: break
            for row in rows:
                vals = ", ".join(sql_val(v) for v in row)
                lines.append(f"INSERT INTO public.{q(t)} ({', '.join(q(c) for c in colnames)}) VALUES ({vals});")
                data_total += 1
            off += 200
        lines.append("")

    fks = conn.run("""SELECT con.conname, con.conrelid::regclass::text, pg_get_constraintdef(con.oid)
        FROM pg_constraint con JOIN pg_namespace n ON n.oid=con.connamespace
        WHERE n.nspname='public' AND con.contype='f' ORDER BY con.conname""")
    for fk in fks:
        tbl = fk[1]; 
        if tbl.startswith("public."): tbl = tbl[7:]
        lines.append(f"ALTER TABLE ONLY public.{q(tbl)} ADD CONSTRAINT {q(fk[0])} {fk[2]};")
    if fks: lines.append("")

    idxs = conn.run("""SELECT indexname, indexdef FROM pg_indexes
        WHERE schemaname='public' AND indexname NOT LIKE '%_pkey' ORDER BY indexname""")
    for ix in idxs: lines.append(f"{ix[1]};")
    if idxs: lines.append("")

    funcs = conn.run("""SELECT proname, pg_get_functiondef(p.oid) FROM pg_proc p
        JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prokind='f' ORDER BY proname""")
    for fn in funcs:
        lines.append(fn[1].rstrip() + ";"); lines.append("")

    trigs = conn.run("""SELECT tgname, pg_get_triggerdef(t.oid, true) FROM pg_trigger t
        JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND NOT t.tgisinternal ORDER BY tgname""")
    for tr in trigs: lines.append(f"{tr[1]};")
    if trigs: lines.append("")

    rls_tables = conn.run("""SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND relkind='r' AND relrowsecurity=true ORDER BY relname""")
    for rt in rls_tables: lines.append(f"ALTER TABLE public.{q(rt[0])} ENABLE ROW LEVEL SECURITY;")
    if rls_tables: lines.append("")
    policies = conn.run("""SELECT tablename, policyname, permissive, cmd, qual, with_check FROM pg_policies
        WHERE schemaname='public' ORDER BY tablename, policyname""")
    for pol in policies:
        pl = [f"CREATE POLICY {q(pol[1])}", f"  ON public.{q(pol[0])}", f"  AS {pol[2]}",
              f"  FOR {pol[3]}", "  TO public"]
        if pol[4]: pl.append(f"  USING ({pol[4]})")
        if pol[5]: pl.append(f"  WITH CHECK ({pol[5]})")
        lines.append(" ".join(pl) + ";")
    if policies: lines.append("")

    rt = conn.run("""SELECT tablename FROM pg_publication_tables WHERE pubname='supabase_realtime' ORDER BY tablename""")
    for r in rt: lines.append(f"ALTER PUBLICATION supabase_realtime ADD TABLE public.{q(r[0])};")
    if rt: lines.append("")

    lines.append("COMMIT;")
    Path(out_sql).write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"✅ SQL: {out_sql} ({Path(out_sql).stat().st_size:,} bytes)")

    # JSON
    jd = {"tables": {}}
    for t in tables:
        rows = conn.run(f"SELECT * FROM public.{q(t)}")
        cols = [c[0] for c in conn.run(
            f"SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name={literal(t)} ORDER BY ordinal_position")]
        dicts = []
        for row in rows:
            d = {}
            for i, cn in enumerate(cols):
                v = row[i]
                if isinstance(v, Decimal): v = str(v)
                elif isinstance(v, UUID): v = str(v)
                elif isinstance(v, datetime): v = v.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3]+"Z"
                elif isinstance(v, bytes): v = v.hex()
                d[cn] = v
            dicts.append(d)
        jd["tables"][t] = {"count": len(dicts), "rows": dicts}
    Path(out_json).write_text(json.dumps(jd, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"✅ JSON: {out_json} ({Path(out_json).stat().st_size:,} bytes)")
    conn.close()
    print(f"\nTotal INSERT: {data_total}")

if __name__ == "__main__":
    main()