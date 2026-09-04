#!/usr/bin/env python3
"""Compare dump-manual.sql vs restore-iuran-full.sql — robust SQL INSERT parser."""

import re
import sys

# Normalize a value by stripping type casts and trimming whitespace
def norm_val(v):
    v = v.strip().strip('"')
    # Remove ::uuid, ::text, ::jsonb, ::timestamp, etc.
    v = re.sub(r'::\w+', '', v)
    # Strip surrounding single quotes
    if v.startswith("'") and v.endswith("'"):
        v = v[1:-1]
    return v


def extract_inserts(filepath):
    """Extract all INSERT INTO statements, separated by table, returning list of value tuples."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove comments and newlines within statements for easier processing
    # But careful with -- comments
    # First remove SQL comments
    content_no_comments = re.sub(r'--[^\n]*', '', content)
    
    tables = {}
    
    # Match: INSERT INTO [public.]"tablename" (columns) VALUES (values);
    # Handle multi-line - match until ;
    # Simpler: find all INSERT blocks between INSERT INTO and the final ;
    insert_blocks = re.findall(
        r"INSERT\s+INTO\s+(?:public\.)?\"?(\w+)\"?\s*\(([^)]+)\)\s*VALUES\s*(.*?);",
        content_no_comments, re.IGNORECASE | re.DOTALL
    )
    
    for table_name, columns_raw, values_block in insert_blocks:
        columns = [c.strip().strip('"') for c in columns_raw.split(',')]
        
        # Extract individual row tuples from VALUES block
        # Values can be multi-line, separated by ),(
        rows = []
        depth = 0
        current = ''
        for ch in values_block:
            if ch == '(':
                depth += 1
                if depth == 1:
                    current = ''
                    continue
            elif ch == ')':
                depth -= 1
                if depth == 0:
                    # End of this row
                    rows.append(current.strip())
                    # Skip comma/whitespace between rows
                    continue
            
            if ch == ';':
                break
            
            if depth >= 1:
                current += ch
            elif depth == 0 and ch == ',':
                continue  # between rows
        
        if table_name not in tables:
            tables[table_name] = {'columns': columns, 'rows': rows}
        else:
            tables[table_name]['rows'].extend(rows)
    
    return tables


def parse_row_into_dict(row_str, columns):
    """Parse a values row string into a dict keyed by column name.
    Handles ',' splitting carefully respecting quotes."""
    # Split by comma outside of quotes
    vals = []
    current = ''
    in_single = False
    in_double = False
    depth = 0
    
    i = 0
    while i < len(row_str):
        ch = row_str[i]
        
        if ch == "'" and not in_double:
            in_single = not in_single
            current += ch
        elif ch == '"' and not in_single:
            in_double = not in_double
            current += ch
        elif ch == '(' and not in_single and not in_double:
            depth += 1
            current += ch
        elif ch == ')' and not in_single and not in_double:
            depth -= 1
            current += ch
        elif ch == ',' and not in_single and not in_double and depth == 0:
            vals.append(current.strip())
            current = ''
        else:
            current += ch
        i += 1
    
    if current.strip():
        vals.append(current.strip())
    
    # Pad with None
    while len(vals) < len(columns):
        vals.append(None)
    
    return dict(zip(columns, vals[:len(columns)]))


def main():
    file1 = 'dump-manual.sql'
    file2 = 'restore-iuran-full.sql'
    
    print(f"Memproses {file1}...", file=sys.stderr)
    t1 = extract_inserts(file1)
    print(f"Memproses {file2}...", file=sys.stderr)
    t2 = extract_inserts(file2)
    
    print("=" * 70)
    print("PERBANDINGAN DATA: dump-manual.sql vs restore-iuran-full.sql")
    print("=" * 70)
    print()
    
    all_tables = sorted(set(list(t1.keys()) + list(t2.keys())))
    
    # Summary
    print(f"{'Tabel':<22} {'dump-manual':<14} {'restore-full':<14} {'Selisih':<10}")
    print("-" * 60)
    
    any_diff = False
    table_info = {}
    
    for t in all_tables:
        r1 = len(t1[t]['rows']) if t in t1 else 0
        r2 = len(t2[t]['rows']) if t in t2 else 0
        selisih = r1 - r2
        
        if selisih == 0:
            status = '✓ SAMA'
        else:
            status = f'✗ BEDA ({selisih:+d})'
            any_diff = True
        
        print(f"{t:<22} {r1:<14} {r2:<14} {status}")
        table_info[t] = (r1, r2, selisih)
    
    if not any_diff:
        print("\n✅ Semua tabel identik — tidak ada perbedaan sama sekali.")
        return
    
    # Detail per tabel yang beda
    for t in sorted(all_tables):
        r1_count, r2_count, selisih = table_info[t]
        if selisih == 0:
            continue
        
        cols = t1[t]['columns'] if t in t1 else t2[t]['columns']
        print(f"\n{'=' * 70}")
        print(f"TABEL: {t} ({r1_count} vs {r2_count}) — selisih {selisih:+d}")
        print(f"{'=' * 70}")
        print(f"  Kolom: {cols}")
        
        # Build PK-indexed records
        rows1 = []
        if t in t1:
            for row_str in t1[t]['rows']:
                d = parse_row_into_dict(row_str, cols)
                if d:
                    rows1.append(d)
        
        rows2 = []
        if t in t2:
            for row_str in t2[t]['rows']:
                d = parse_row_into_dict(row_str, cols)
                if d:
                    rows2.append(d)
        
        # Use first column (id/uuid) as PK if it looks like an id
        pk_col = cols[0]
        
        # Build dicts by PK (normalized)
        def build_pk_dict(rows):
            d = {}
            for r in rows:
                pk = r.get(pk_col, '')
                d[norm_val(pk)] = r
            return d
        
        d1 = build_pk_dict(rows1)
        d2 = build_pk_dict(rows2)
        
        only_in_1 = set(d1.keys()) - set(d2.keys())
        only_in_2 = set(d2.keys()) - set(d1.keys())
        
        if only_in_1:
            print(f"\n  ❌ HANYA DI dump-manual.sql ({len(only_in_1)} record):")
            for pk in sorted(only_in_1):
                r = d1[pk]
                # Show meaningful fields
                show = {k: v for k, v in r.items() if v is not None and v != ''}
                # Show id, name, date, amount, type etc
                filtered = {}
                for k, v in show.items():
                    filtered[k] = norm_val(v)
                print(f"    {filtered}")
        
        if only_in_2:
            print(f"\n  ❌ HANYA DI restore-iuran-full.sql ({len(only_in_2)} record):")
            for pk in sorted(only_in_2):
                r = d2[pk]
                show = {k: v for k, v in r.items() if v is not None and v != ''}
                filtered = {}
                for k, v in show.items():
                    filtered[k] = norm_val(v)
                print(f"    {filtered}")
    
    print("\n✅ SELESAI")


if __name__ == '__main__':
    main()
