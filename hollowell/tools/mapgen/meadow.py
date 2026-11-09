# Draft of Meadowfold (overworld block 1,2). Hand-tuned afterwards in src/43_meadowfold.js.
import random
random.seed(11)
W, H = 64, 40
g = [['.'] * W for _ in range(H)]
def rect(x0, y0, x1, y1, ch):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if 0 <= x < W and 0 <= y < H: g[y][x] = ch
def put(x, y, ch):
    if 0 <= x < W and 0 <= y < H: g[y][x] = ch
# edges: forest, the south edge fog beyond trees
rect(0, 0, 3, 39, 'Y'); rect(0, 36, 63, 39, 'Y'); rect(60, 0, 63, 39, 'Y')
rect(0, 0, 29, 1, 'Y'); rect(34, 0, 48, 1, 'Y'); rect(54, 0, 63, 1, 'Y')
rect(0, 38, 63, 39, '%')
# river N-S, into the fog at the bottom
rect(49, 0, 53, 39, '~'); rect(49, 0, 49, 39, '-'); rect(53, 0, 53, 39, '-')
rect(49, 37, 53, 39, '%')
# roads
rect(30, 0, 33, 19, ':')
rect(4, 22, 33, 23, ':'); rect(30, 19, 33, 23, ':')
rect(34, 18, 48, 19, ':'); rect(43, 13, 45, 18, ':')
rect(34, 26, 48, 27, ':'); rect(30, 23, 33, 27, ':')
rect(49, 26, 53, 27, '_'); rect(50, 26, 52, 27, '~')
rect(54, 26, 63, 27, ':'); rect(60, 26, 63, 27, ':')
# the canyon pass: a rock corridor in the west forest
rect(0, 20, 7, 25, '#'); rect(0, 23, 7, 23, ':'); rect(4, 21, 5, 22, ':'); put(5, 21, '#')
# Tidyhouse footprint
rect(40, 8, 48, 12, 'X'); put(44, 12, ':')
# windmill footprint
rect(19, 6, 21, 8, 'X')
# sheep pen
for x in range(8, 19): put(x, 27, 'f'); put(x, 34, 'f')
for y in range(28, 34): put(8, y, 'l'); put(18, y, 'l')
put(13, 27, '.')
# pond
rect(24, 30, 28, 34, '~'); rect(24, 30, 28, 30, '-'); rect(23, 31, 23, 33, '-'); rect(29, 31, 29, 33, '-')
# hedges
for x in range(35, 40): put(x, 3, 'b')
for x in range(10, 16): put(x, 14, 'b')
# trees
for (x, y) in [(6, 4), (10, 8), (26, 3), (36, 6), (55, 5), (57, 12), (56, 20), (6, 30), (37, 32), (44, 33), (57, 32), (24, 12), (14, 18), (40, 22)]:
    if all(g[y + dy][x + dx] in '.' for dx in (0, 1) for dy in (0, 1)): put(x, y, 'T')
for (x, y) in [(28, 14), (47, 30), (55, 15), (5, 16), (22, 25), (38, 35)]:
    if g[y][x] == '.': put(x, y, 'r')
for _ in range(260):
    x, y = random.randrange(4, 60), random.randrange(2, 36)
    if g[y][x] == '.': g[y][x] = random.choice(',,,""')
for row in g:
    s = ''.join(row); assert len(s) == 64
    print("        '" + s + "',")
