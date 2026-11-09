# One-off helper: lays out Hollowell's first draft as ASCII (then hand-tuned in src/33_hub.js).
W, H = 64, 40
g = [['.'] * W for _ in range(H)]
def rect(x0, y0, x1, y1, ch):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if 0 <= x < W and 0 <= y < H: g[y][x] = ch
def put(x, y, ch):
    if 0 <= x < W and 0 <= y < H: g[y][x] = ch
# forest border
rect(0, 0, 63, 2, 'Y'); rect(0, 0, 2, 39, 'Y'); rect(61, 0, 63, 39, 'Y'); rect(0, 37, 63, 39, 'Y')
rect(3, 3, 6, 5, 'Y'); rect(55, 30, 60, 36, 'Y'); rect(3, 34, 4, 36, 'Y')
# river
rect(49, 0, 53, 39, '~'); rect(49, 0, 49, 39, '-'); rect(53, 0, 53, 39, '-')
# roads
rect(30, 0, 33, 13, ':'); rect(30, 26, 33, 39, ':')
rect(42, 19, 63, 20, ':'); rect(49, 19, 53, 20, '_')
rect(3, 19, 21, 20, ':')
# square
rect(21, 13, 42, 26, '=')
# buildings (X footprints)
rect(10, 7, 15, 10, 'X')   # Gran
rect(41, 8, 48, 12, 'X')   # inn
rect(5, 25, 11, 28, 'X')   # school
rect(16, 27, 21, 30, 'X')  # store
rect(36, 28, 41, 31, 'X')  # bakery
rect(36, 5, 40, 8, 'X')    # tailor
rect(22, 5, 27, 8, 'X')    # toys
rect(4, 15, 8, 17, 'X')    # lost & found
rect(16, 33, 20, 35, 'X')  # tuck
rect(55, 9, 60, 12, 'X')   # clinic
# paths to doors
rect(12, 11, 13, 18, ':'); rect(13, 18, 21, 18, ':')
rect(44, 13, 45, 13, '=')
rect(8, 29, 9, 30, ':'); rect(9, 29, 21, 29, ':')
rect(18, 31, 18, 32, ':'); rect(18, 31, 29, 31, ':')
rect(38, 27, 39, 27, '=')
rect(38, 9, 38, 12, ':'); rect(34, 12, 38, 12, ':')
rect(24, 9, 25, 12, ':'); rect(25, 12, 30, 12, ':')
rect(6, 18, 6, 18, ':')
rect(57, 13, 57, 18, ':')
for row in g: print(''.join(row))
# ---- decoration pass (second draft) ----
import sys
def dec(x, y, ch):
    if g[y][x] == '.': g[y][x] = ch
# Gran's garden: fence and flowers, an apple tree
for x in range(8, 18): put(x, 12, 'f')
put(12, 12, ':'); put(13, 12, ':')
for y in range(6, 12): put(8, y, 'l'); put(17, y, 'l')
for x in range(8, 18): put(x, 5, 'f')
put(9, 6, 'A'); put(16, 7, ','); put(16, 8, ','); put(9, 9, ','); put(9, 10, ',')
# trees about town
for (x, y) in [(4, 7), (18, 3), (44, 4), (46, 15), (5, 22), (12, 22), (24, 35), (44, 33), (57, 4), (58, 22), (56, 25), (27, 33), (40, 23)]:
    if g[y][x] in '.,' and g[y+1][x] in '.,' and g[y][x+1] in '.,' and g[y+1][x+1] in '.,': put(x, y, 'T')
for (x, y) in [(8, 3), (20, 4), (28, 4), (35, 3), (42, 6), (47, 26), (14, 24), (3, 31), (13, 36), (29, 37), (45, 36), (58, 14), (60, 26)]:
    dec(x, y, 'b')
for (x, y) in [(7, 33), (24, 22), (46, 30), (59, 16)]:
    dec(x, y, 'r')
# flowers and long grass
import random
random.seed(7)
for _ in range(140):
    x, y = random.randrange(3, 61), random.randrange(3, 37)
    if g[y][x] == '.': g[y][x] = random.choice(',,"')
# the playground sandbox
rect(5, 31, 10, 34, ';')
# flower beds in the square corners
for (x, y) in [(21, 13), (42, 13), (21, 26), (42, 26)]: put(x, y, 'm')
print('---')
for row in g: print("        '" + ''.join(row) + "',")
