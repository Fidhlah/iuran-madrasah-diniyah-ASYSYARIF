"""Bandingkan kandidat owner dengan bukti lain: git author, vercel, dan session terakhir."""
import os

print("=== BUkti 1: Git author (repo Asysyarif) ===")
# git log email
import subprocess
repo = r"D:\fidh\Coding\Madrasah\iuran-asysyarif"
r = subprocess.run(["git", "-C", repo, "log", "--format=%an <%ae>", "-5"],
                   capture_output=True, text=True)
print(r.stdout)

print("\n=== Bukti 2: Email di dalam repo (README/package/next config) ===")
import re
for fname in ["README.md", "package.json", "next.config.js", "vercel.json"]:
    p = os.path.join(repo, fname)
    if os.path.exists(p):
        txt = open(p, encoding="utf-8", errors="ignore").read()
        for m in re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', txt):
            print(f"  {fname}: {m}")

print("\n=== Bukti 3: Password tersimpan utk supabase (username + kapan terakhir dipakai) ===")
import sqlite3
db = os.path.expanduser('~/sb_login_tmp/login.db')
con = sqlite3.connect('file:' + db + '?mode=ro', uri=True)
cur = con.cursor()
cur.execute("SELECT username_value, origin_url, times_used, date_last_used FROM logins WHERE origin_url LIKE '%supabase%'")
import datetime
for r in cur.fetchall():
    du = datetime.datetime(1601,1,1) + datetime.timedelta(microseconds=r[3]) if r[3] else None
    print(f"  {r[0]:35} | used={r[2]}x | last={du.isoformat() if du else 'n/a'} | {r[1][:50]}")
con.close()