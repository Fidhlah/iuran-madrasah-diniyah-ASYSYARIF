#!/usr/bin/env python3
"""Restore backup-full-asysyarif.sql ke project Supabase BARU — via DATABASE_URL langsung.

READ backup (lokal) → eksekusi per-statement ke project baru (pg8000).
READ/WRITE terhadap project BARU (bukan project lama).
"""
import re, sys
from pathlib import Path
import urllib.parse
from pg8000.native import Connection

SCRIPT_DIR = Path(__file__).resolve().parent
DATA_DIR = SCRIPT_DIR / "data"
# File restore TARGET (versi tanpa 2 baris profiles & FK ke auth.users)
SQL_FILE = DATA_DIR / "backup-restore-target.sql"


def load_env(p: Path):
    env = {}
    if p.exists():
        for line in p.read_text(encoding="utf-8", errors="replace").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                env[k.strip()] = v.strip().strip("'\"")
    return env


def parse_pg_url(url):
    m = re.match(r"postgresql://([^:/]+):([^@]+)@([^:/]+):(\d+)/([^?]+)(\?.*)?$", url)
    if not m:
        raise SystemExit("Gagal parse DATABASE_URL")
    return dict(
        user=urllib.parse.unquote(m.group(1)),
        password=urllib.parse.unquote(m.group(2)),
        host=m.group(3),
        port=int(m.group(4)),
        database=m.group(5).split("?")[0],
    )


def split_statements(sql_text):
    """Pisah SQL jadi statement. Handle $$...$$ (function body) & quotes."""
    stmts = []
    cur = []
    i = 0
    n = len(sql_text)
    dollar_tag = None
    while i < n:
        c = sql_text[i]
        # detect $$ or $tag$
        if c == "$":
            m = re.match(r"\$[A-Za-z_0-9]*\$", sql_text[i:])
            if m and dollar_tag is None:
                dollar_tag = m.group(0)
                cur.append(dollar_tag)
                i += len(dollar_tag)
                continue
            if m and dollar_tag and m.group(0) == dollar_tag:
                cur.append(dollar_tag)
                i += len(dollar_tag)
                dollar_tag = None
                continue
        # end of statement (pakai ';' di luar string & dollar)
        if c == ";" and dollar_tag is None:
            stmt = "".join(cur).strip()
            if stmt:
                stmts.append(stmt)
            cur = []
            i += 1
            continue
        cur.append(c)
        i += 1
    if "".join(cur).strip():
        stmts.append("".join(cur).strip())
    return stmts


def main():
    env = load_env(SCRIPT_DIR.parent / ".env-new")
    url = env.get("DATABASE_URL") or env.get("DIRECT_URL")
    if not url:
        raise SystemExit("Tidak ada DATABASE_URL/DIRECT_URL di .env-new")
    cfg = parse_pg_url(url)

    if not SQL_FILE.exists():
        raise SystemExit(f"{SQL_FILE} tidak ada")

    sql = SQL_FILE.read_text(encoding="utf-8")
    stmts = split_statements(sql)
    print(f"📄 {SQL_FILE.name}: {len(stmts)} statement")

    print(f"🔌 Connect {cfg['host']}:{cfg['port']} ...")
    conn = Connection(user=cfg["user"], password=cfg["password"],
                      host=cfg["host"], port=cfg["port"], database=cfg["database"])
    print("✅ Connected (project baru)\n")

    ok = 0
    fail = []
    for i, stmt in enumerate(stmts, 1):
        preview = stmt.splitlines()[0][:60] if stmt else ""
        try:
            conn.run(stmt)
            ok += 1
            if i % 200 == 0 or i == len(stmts):
                print(f"  progress {i}/{len(stmts)}")
        except Exception as e:
            fail.append((i, preview, str(e)))
            print(f"  ❌ statement #{i}: {preview}")
            print(f"     {str(e)[:200]}")
            # Berhenti di error pertama (karena BEGIN/COMMIT — kegagalan = batal)
            break

    conn.close()

    print(f"\n=== HASIL ===")
    print(f"Berhasil: {ok}/{len(stmts)}")
    if fail:
        print(f"❌ GAGAL di statement #{fail[0][0]}: {fail[0][1]}")
        print(f"   {fail[0][2][:300]}")
        sys.exit(1)
    print("✅ SEMUA STATEMENT BERHASIL — restore sukses")


if __name__ == "__main__":
    main()