"""S1: tambah kolom pribadi students + create table student_parents (dev)."""
import re, urllib.parse
from pathlib import Path
from pg8000.native import Connection

def load_env(p):
    env = {}
    for line in Path(p).read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip().strip("'\"")
    return env

env = load_env(r"D:\fidh\Coding\Madrasah\iuran-asysyarif\.env")
url = env.get("DATABASE_URL")
m = re.match(r"postgresql://([^:/]+):([^@]+)@([^:/]+):(\d+)/([^?]+)(\?.*)?$", url)
cfg = dict(user=urllib.parse.unquote(m.group(1)), password=urllib.parse.unquote(m.group(2)),
           host=m.group(3), port=int(m.group(4)), database=m.group(5).split("?")[0])
conn = Connection(user=cfg["user"], password=cfg["password"], host=cfg["host"],
                  port=cfg["port"], database=cfg["database"])
print("Connected (dev)")

def run(sql, label):
    try:
        conn.run(sql)
        print(f"  OK {label}")
    except Exception as e:
        print(f"  ERR {label}: {e}")

# students columns
for col, typ in [("nik","text"),("gender","text"),("birth_place","text"),
                 ("birth_date","timestamptz"),("address","text"),("phone","text")]:
    run(f'ALTER TABLE public."students" ADD COLUMN IF NOT EXISTS {col} {typ}', f"add students.{col}")

# student_parents table
run('''CREATE TABLE IF NOT EXISTS public."student_parents" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public."students"(id) ON DELETE CASCADE,
  relation text NOT NULL,
  nik text,
  name text,
  phone text,
  occupation text,
  email text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (student_id, relation)
)''', "create student_parents")

# verify student columns
print("\n=== Kolom students sekarang ===")
rows = conn.run("""SELECT column_name FROM information_schema.columns
    WHERE table_name='students' ORDER BY ordinal_position""")
print("  ", [r[0] for r in rows])

print("=== Kolom student_parents ===")
rows = conn.run("""SELECT column_name FROM information_schema.columns
    WHERE table_name='student_parents' ORDER BY ordinal_position""")
print("  ", [r[0] for r in rows])
conn.close()