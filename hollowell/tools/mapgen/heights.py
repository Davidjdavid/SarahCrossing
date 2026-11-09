# Drafts Belfry Heights (block 2,0) and the cliff stair through block 2,1. Prints JS rows for both.
import random
random.seed(11)
W, H = 64, 40
def grid(c): return [[c for _ in range(W)] for _ in range(H)]
def rect(g, x0, y0, x1, y1, c):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if 0 <= x < W and 0 <= y < H: g[y][x] = c
g = grid('.')
# borders: cliffs all round, fog off the east edge
rect(g, 0, 0, 63, 0, '#'); rect(g, 0, 0, 2, 39, '#'); rect(g, 61, 0, 63, 39, '#'); rect(g, 0, 39, 63, 39, '#')
# three terraces stepping up northward: cliff faces at rows 28, 18 and 9 (higher ground is north)
rect(g, 3, 28, 60, 29, '#'); rect(g, 3, 18, 60, 19, '#'); rect(g, 3, 9, 60, 10, '#')
# the way up from the ravine (south edge, x 42..44)
rect(g, 42, 39, 44, 39, ':'); rect(g, 43, 30, 43, 38, ':')
# terrace 1 (rows 30-38): stairs up at x 12 (blocked by a stuck boulder: ring the shrine bell)
rect(g, 12, 28, 12, 29, 'H'); rect(g, 12, 30, 43, 30, ':')
# terrace 2 (rows 20-27): a windy ledge west->east; stairs up at x 52
rect(g, 12, 20, 12, 27, ':'); rect(g, 12, 21, 52, 21, ':'); rect(g, 52, 18, 52, 19, 'H')
# a drop on the south side of the ledge (one-way back down): ledges
rect(g, 20, 27, 48, 27, 'v')
# terrace 3 (rows 11-17): eyelet cliff up at x 30 (Hookline: no stairs), a path to the tower
rect(g, 52, 11, 52, 17, ':'); rect(g, 30, 12, 52, 12, ':')
rect(g, 30, 9, 30, 10, 'H')
rect(g, 40, 11, 44, 17, 'o')
# the top (rows 1-8): the Belfry tower in the middle, its door at the bottom
rect(g, 26, 2, 35, 7, 'X')
rect(g, 30, 8, 31, 8, ':')
# heather and rocks
for _ in range(120):
    x, y = random.randrange(3, 61), random.randrange(1, 39)
    if g[y][x] == '.': g[y][x] = random.choice([',', ',', '"', 'r', '.', 'b'])
for y in range(H):
    for x in range(W):
        if g[y][x] in ',"rb' and any(0 <= x+dx < W and 0 <= y+dy < H and g[y+dy][x+dx] in ':H' for dx in (-1,0,1) for dy in (-1,0,1)): g[y][x] = '.'
print("HEIGHTS"); [print("    '" + ''.join(r) + "',") for r in g]
# block 2,1 for now: forest, with the cliff stair (a ravine) up its east side at x 42..44
h = grid('Y')
rect(h, 40, 0, 46, 39, '#'); rect(h, 42, 0, 44, 39, ':')
for y in range(0, 40, 6): rect(h, 43, y, 43, y, 'H')
print("RAVINE"); [print("    '" + ''.join(r) + "',") for r in h]
