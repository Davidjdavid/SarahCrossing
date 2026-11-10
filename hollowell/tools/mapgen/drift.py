# Drafts the Drift: the wide world past the fog. Open country, a deep stream with no bridge (a stray boulder fills it),
# the old valley edge's marker stones, Linnet's cottage and garden in the west, the road going on and on. Prints JS rows.
import random
random.seed(23)
W, H = 64, 40
g = [['.' for _ in range(W)] for _ in range(H)]
def rect(x0, y0, x1, y1, c):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if 0 <= x < W and 0 <= y < H: g[y][x] = c
rect(60, 0, 63, 39, '%')                         # the fog, behind you
rect(0, 0, 63, 1, 'Y'); rect(0, 38, 59, 39, 'Y')  # woods north and south
rect(52, 2, 52, 37, '^')                          # the old valley edge: a line of marker stones...
for y in range(4, 37, 5): g[y][52] = '.'          # ...with gaps between them
rect(40, 2, 40, 37, '~')                          # a deep stream, no bridge
rect(0, 18, 39, 19, ':'); rect(41, 18, 59, 19, ':')   # the road, west forever
rect(14, 12, 21, 16, 'X')                         # Linnet's cottage
rect(17, 17, 17, 17, ':')
rect(11, 20, 25, 25, ',')                         # her garden
for (x0, y0, x1, y1) in [(2, 3, 9, 10), (28, 3, 35, 9), (44, 24, 50, 33), (4, 27, 12, 35), (26, 27, 34, 34)]:
    rect(x0, y0, x1, y1, 'Y')
for _ in range(300):
    x, y = random.randrange(0, 60), random.randrange(2, 38)
    if g[y][x] == '.': g[y][x] = random.choice([',', ',', '"', '.'])
for y in range(H):
    for x in range(W):
        if g[y][x] != 'Y': continue
        ok = any(all(0 <= x+dx+i < W and 0 <= y+dy+j < H and g[y+dy+j][x+dx+i] == 'Y' for i in (0,1) for j in (0,1)) for dx in (0,-1) for dy in (0,-1))
        if not ok: g[y][x] = 'b'
print("const DRIFT_ROWS = ["); [print("    '" + ''.join(r) + "',") for r in g]; print("];")
