# Drafts Hushwood (block 2,1). The cliff stair ravine (x 40..46) stays as it is; Hushwood is x 0..39.
# Prints JS rows. Legend extras: M giant mushroom, k small mushrooms, q glow mushrooms.
import random
random.seed(5)
W, H = 64, 40
def grid(c): return [[c for _ in range(W)] for _ in range(H)]
def rect(g, x0, y0, x1, y1, c):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if 0 <= x < W and 0 <= y < H: g[y][x] = c
g = grid('Y')
# the ravine, as before
rect(g, 40, 0, 46, 39, '#'); rect(g, 42, 0, 44, 39, ':')
for y in range(0, 40, 6): rect(g, 43, y, 43, y, 'H')
# open woodland
rect(g, 1, 2, 38, 37, '.')
# the sleeping road, in from town at rows 19-20
rect(g, 0, 19, 14, 20, ':')
rect(g, 0, 16, 16, 23, '.'); rect(g, 0, 19, 14, 20, ':')
# north: the stream from a spring at the west, east along rows 12-13, then south along x 27-28 to the pond
rect(g, 3, 12, 28, 13, '~')
rect(g, 27, 12, 28, 26, '~')
# the pond and the channel south to Millwater (x 29-30), with banks
rect(g, 26, 26, 34, 31, '~')
rect(g, 29, 32, 30, 39, '~')
rect(g, 27, 32, 28, 39, 'Y'); rect(g, 31, 32, 32, 37, '.'); rect(g, 33, 32, 39, 39, 'Y'); rect(g, 31, 38, 32, 39, 'Y')
rect(g, 28, 32, 28, 37, '.')
# reeds round the pond
for (x, y) in [(25, 27), (25, 28), (35, 29), (35, 30), (26, 32), (33, 31)]:
    if g[y][x] == '.': g[y][x] = '-'
# a log bridge over the south-running stream at row 20
rect(g, 27, 20, 28, 20, '_')
# paths: road clearing north to the stream; past the stream to the Slumberhouse
rect(g, 12, 14, 12, 18, ':')
rect(g, 12, 9, 12, 11, ':'); rect(g, 12, 9, 19, 9, ':')
# the Slumberhouse (x 15-24, rows 3-8), door at (19,8)
rect(g, 15, 3, 24, 8, 'X'); g[8][19] = ':'
rect(g, 19, 9, 19, 9, ':')
# east of the road clearing: a path to the log bridge and the east bank
rect(g, 14, 20, 26, 20, ':'); rect(g, 29, 20, 34, 20, ':'); rect(g, 34, 13, 34, 20, ':')
# the east bank plateau (heart patch), raised, its edge a ledge at row 10
rect(g, 31, 3, 38, 9, '.'); rect(g, 31, 10, 38, 10, 'v')
rect(g, 30, 3, 30, 10, '#')
# the south: a trail from the road clearing down into Puffball Hollow, and on to the pond's west bank
rect(g, 8, 23, 8, 30, ':'); rect(g, 8, 30, 24, 30, ':'); rect(g, 24, 28, 24, 30, ':')
# Hettie's camp
rect(g, 2, 31, 7, 35, '.')
# the giant's own bed: a mossy hollow in the NW
rect(g, 2, 3, 9, 9, '.')
# thick woods breaking things up
for (x0, y0, x1, y1) in [(1, 2, 1, 37), (38, 2, 38, 37), (1, 36, 26, 37), (10, 2, 13, 7), (25, 2, 29, 9), (17, 24, 23, 27), (13, 32, 22, 35),
                         (1, 24, 4, 29), (31, 22, 38, 25), (36, 11, 38, 21), (20, 15, 25, 18), (2, 14, 6, 15)]:
    rect(g, x0, y0, x1, y1, 'Y')
rect(g, 0, 19, 14, 20, ':')
# keep the paths clear of the woods
for (x0, y0, x1, y1) in [(12, 14, 12, 18), (12, 9, 19, 11), (14, 20, 26, 20), (29, 20, 34, 20), (34, 13, 34, 20), (8, 23, 8, 30), (8, 30, 24, 30), (24, 28, 24, 30)]:
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if g[y][x] == 'Y': g[y][x] = ':'
# mushrooms and grass
for _ in range(150):
    x, y = random.randrange(1, 39), random.randrange(2, 37)
    if g[y][x] == '.': g[y][x] = random.choice([',', '"', '"', 'k', 'k', 'q', '.', 'b'])
for (x, y) in [(5, 22), (15, 23), (3, 30), (11, 27), (20, 22), (35, 6), (6, 7), (22, 11), (33, 15), (16, 31)]:
    g[y][x] = 'M'
# the giant sleeps across the road (x 1-5, rows 17-22): the woods close in north and south of him
rect(g, 0, 14, 1, 18, 'Y'); rect(g, 0, 21, 1, 25, 'Y'); rect(g, 2, 14, 6, 15, 'Y'); rect(g, 2, 24, 4, 25, 'Y')
rect(g, 2, 16, 6, 23, '.'); rect(g, 0, 19, 14, 20, ':')
# north and east only meet over the water
rect(g, 29, 10, 30, 11, 'Y')
# the channel runs south (a current), the weir where it leaves the pond
rect(g, 29, 32, 30, 39, 'V')
# nothing tall right by a path, a door or the water's edge where people step
for y in range(H):
    for x in range(W):
        if g[y][x] in ',"kqbM' and any(0 <= x+dx < W and 0 <= y+dy < H and g[y+dy][x+dx] in ':H_' for dx in (-1,0,1) for dy in (-1,0,1)):
            g[y][x] = '.'
# forest blocks must be 2x2 for the tree painter; lone Y tiles become bushes
def fix(g):
    for y in range(H):
        for x in range(40):
            if g[y][x] != 'Y': continue
            ok = False
            for dx in (0, -1):
                for dy in (0, -1):
                    if all(0 <= x+dx+i < W and 0 <= y+dy+j < H and g[y+dy+j][x+dx+i] == 'Y' for i in (0,1) for j in (0,1)): ok = True
            if not ok: g[y][x] = 'b'
fix(g)
print("HUSHWOOD"); [print("    '" + ''.join(r) + "',") for r in g]
