# Drafts the Millwater block (64x40). Run: python3 tools/mapgen/millwater.py  (prints JS rows)
import random
random.seed(7)
W, H = 64, 40
g = [['.' for _ in range(W)] for _ in range(H)]
def put(x, y, c):
    if 0 <= x < W and 0 <= y < H: g[y][x] = c
def rect(x0, y0, x1, y1, c):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1): put(x, y, c)
# borders: forest north/south, cliffs east; fog under the very bottom rows
rect(0, 0, W - 1, 1, 'Y')
rect(0, 38, W - 1, 39, '%')
rect(0, 36, W - 1, 37, 'Y')
rect(0, 0, 2, 39, 'Y'); rect(61, 0, 63, 39, '#')
# the lake (north), an irregular shore
for y in range(3, 18):
    for x in range(5, 59):
        dx = (x - 32) / 27.0; dy = (y - 10) / 7.6
        if dx * dx + dy * dy < 1.0 + random.uniform(-0.05, 0.05): put(x, y, '~')
# shallow rim and reeds
for y in range(2, 20):
    for x in range(3, 61):
        if g[y][x] == '.':
            n = sum(1 for (a, b) in ((1,0),(-1,0),(0,1),(0,-1)) if 0 <= x+a < W and 0 <= y+b < H and g[y+b][x+a] == '~')
            if n: put(x, y, '-' if random.random() < 0.55 else '"')
# the outlet: the river runs south from the lake (x 39..41) to the falls (rows 30..31) and on
rect(39, 16, 41, 35, 'V')
# the ferry crossing (row 26): the current sets east across the river; landings either side
put(38, 26, '_'); rect(39, 26, 41, 26, '>'); put(42, 26, '~')
# the falls lip and the hidden pool behind the falls (S19): the east column turns into the cliff
put(41, 30, '>'); put(42, 30, '>'); put(43, 30, '~'); put(43, 31, '~'); put(42, 31, '#'); put(44, 30, '.'); put(44, 31, '#')
rect(42, 29, 45, 29, '#'); rect(45, 30, 45, 31, '#'); rect(42, 32, 45, 32, '#')
# the falls drop: cliffs either side of the river at rows 30-31 (the gorge)
rect(33, 30, 38, 31, '#'); rect(46, 30, 60, 31, '#')
# west bank road from Meadowfold (rows 26-27) to the ferry dock
rect(0, 26, 37, 27, ':')
put(38, 27, '_')
# east bank: the Millrace's yard, a path from the landing to its door
rect(43, 26, 50, 27, ':'); rect(47, 27, 47, 28, ':')
# Dad's mill on a mill stream (west bank): a stream from the lake down to the river
pass
# a little footbridge over the mill stream on the road... the stream joins at row 25 above the road
# sand and piers on the lake's south shore
rect(14, 19, 22, 20, ';'); put(18, 18, '|'); put(18, 17, '|'); put(18, 16, '|')
# the north shore pier (for later: the cliff stair)
put(32, 3, '|'); put(32, 2, 'H')
# trees, rocks, flowers
for _ in range(70):
    x, y = random.randrange(3, 60), random.randrange(18, 36)
    if g[y][x] == '.': put(x, y, random.choice(['T', 'T', 'b', 'r', ',', ',', '"']))
for _ in range(30):
    x, y = random.randrange(3, 60), random.randrange(2, 18)
    if g[y][x] == '.': put(x, y, random.choice(['T', 'b', ',', ',']))
# keep clear: roads, landings, mill yards, the Millrace footprint
def clear(x0, y0, x1, y1):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if g[y][x] in 'Tbr,"': g[y][x] = '.'
clear(0, 24, 38, 29); clear(42, 18, 60, 29); clear(25, 18, 34, 25); clear(13, 18, 23, 22)
# the Millrace building footprint (built by an ent; X marks the roof)
rect(44, 22, 51, 25, 'X')
# Dad's mill footprint
rect(26, 19, 31, 21, 'X')
# a cliff south of the east yard (the gorge), the lower basin below
rect(46, 32, 60, 35, '#')
rect(33, 32, 38, 35, '#')
# the lake runs right up to the east cliffs: no way round to the far bank but by water
for y in range(2, 18):
    for x in range(44, 61):
        if y >= 3 or x >= 45: put(x, y, '~' if y >= 3 else '#')
rect(45, 2, 60, 2, '#')
# the lower basin below the falls: a little beach with a chest (reached by riding over the falls)
rect(42, 33, 45, 35, '.')
for row in g: print("    '" + ''.join(row) + "',")
