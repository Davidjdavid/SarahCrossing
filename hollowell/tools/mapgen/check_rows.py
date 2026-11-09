# Prints each room's rows with a ruler and flags wrong widths (used while writing Houses by hand).
import re, sys
src = open(sys.argv[1]).read()
for m in re.finditer(r"'(\d,\d)': \{\s*name: '([^']*)',\s*rows: \[(.*?)\]", src, re.S):
    rows = re.findall(r"'([^']*)'", m.group(3))
    bad = [(i, len(r)) for i, r in enumerate(rows) if len(r) != 20]
    print(m.group(1), m.group(2), 'rows', len(rows), 'BAD' if bad or len(rows) != 11 else 'ok', bad)
