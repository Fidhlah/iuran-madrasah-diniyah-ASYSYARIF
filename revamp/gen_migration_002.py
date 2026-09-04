"""Generate sql migration 002 + rollback: pecah 4 row pendaftaran multi-murid jadi per-murid."""
import json, re, uuid
from pathlib import Path

DATA = Path(r"D:/fidh/Coding/Madrasah/iuran-asysyarif/revamp")
BASE = json.load(open(DATA / "data" / "backup-project-baru-baseline.json", encoding="utf-8"))
fin = BASE["tables"]["finances"]["rows"]

def esc(s):
    return (s or "").replace("'", "''")

split_rows = []   # (id_asli, tanggal, amt, [(nama,kelas),...])
for r in fin:
    desc = r.get("description") or ""
    if r.get("type") == "income" and "pendaftaran" in desc.lower() and re.search(r"^\s*\d+\.\s", desc, re.M):
        parts = re.findall(r"^\s*\d+\.\s+([^(\r\n]+?)\s*\(([^)]*)\)", desc, re.MULTILINE)
        parts = [(nm.strip(), kl.strip()) for nm, kl in parts]
        if len(parts) > 1:
            split_rows.append((r["id"], r["date"][:10], float(r["amount"]), parts))

ns = uuid.NAMESPACE_URL
def new_uuid(seed):
    return str(uuid.uuid5(ns, seed))

mig = ["-- MIGRATION 002: Pecah Uang Pendaftaran multi-murid jadi per-murid",
       "-- Project: dev. Tanggal per row SAMA dgn row asali.",
       "-- 4 row asli DEweDip (total 900000) -> 12 row per murid @75000.",
       "BEGIN;", ""]
del_ids = [s[0] for s in split_rows]
mig.append("DELETE FROM public.\"finances\" WHERE id IN (")
for i, rid in enumerate(del_ids):
    mig.append("  '" + rid + "'" + ("," if i < len(del_ids)-1 else ""))
mig.append(");")
mig.append("")
for rid, dt, amt, parts in split_rows:
    per = amt / len(parts)
    for nama, kelas in parts:
        nid = new_uuid(rid + "::" + nama)
        desc = "Uang pendaftaran : " + nama + ((" (" + kelas + ")") if kelas else "")
        mig.append("INSERT INTO public.\"finances\" (id, date, type, amount, description, payment_id, created_at, updated_at)")
        mig.append("VALUES ('" + nid + "', '" + dt + "', 'income', " + str(int(per)) + ", '" + esc(desc) + "', NULL, now(), now());")
    mig.append("")
mig.append("COMMIT;")
Path(DATA / "migrations" / "002_pisah_pendaftaran.sql").write_text("\n".join(mig) + "\n", encoding="utf-8")

# rollback
rb = ["-- ROLLBACK 002: balikin 12 pecahan -> 4 row multi", "BEGIN;"]
all_new = []
for rid, dt, amt, parts in split_rows:
    for nama, kelas in parts:
        all_new_ids_append = new_uuid(rid + "::" + nama)
        all_new.append(new_uuid(rid + "::" + nama))
rb.append("DELETE FROM public.\"finances\" WHERE id IN (")
for i, nid in enumerate(all_new):
    rb.append("  '" + nid + "'" + ("," if i < len(all_new)-1 else ""))
rb.append(");")
rb.append("")
orig = {r["id"]: r for r in fin}
for rid, dt, amt, parts in split_rows:
    rdesc = esc(orig[rid].get("description") or "")
    rb.append("INSERT INTO public.\"finances\" (id, date, type, amount, description, payment_id, created_at, updated_at)")
    rb.append("VALUES ('" + rid + "', '" + dt + "', 'income', " + str(int(amt)) + ", '" + rdesc + "', NULL, now(), now());")
    rb.append("")
rb.append("COMMIT;")
Path(DATA / "migrations" / "002_rollback.sql").write_text("\n".join(rb) + "\n", encoding="utf-8")

print("002_pisah_pendaftaran.sql + 002_rollback.sql ditulis")
print("  row dipecahkan:", len(split_rows))
for rid, dt, amt, parts in split_rows:
    print("   -", dt, amt, "->", len(parts), "murid,", "75000/murid" if amt/len(parts)==75000 else "per="+str(amt/len(parts)))