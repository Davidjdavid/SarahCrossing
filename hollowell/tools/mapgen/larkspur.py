# Drafts Larkspur Fair (block 0,1: x 0..63, y 40..79). The valley's edge (the fog) on the west; Kilnridge's high
# mesa on the south (a cliff face: you come down off it into the straw); the road out to town on the east (a gate
# opened from this side). Prints JS rows.
import random
random.seed(9)
W, H = 64, 40
g = [['.' for _ in range(W)] for _ in range(H)]
def rect(x0, y0, x1, y1, c):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if 0 <= x < W and 0 <= y < H: g[y][x] = c
# borders: fog west, woods north and east, the mesa's cliff south
rect(0, 0, 2, 39, '%')
rect(3, 0, 63, 1, 'Y'); rect(60, 0, 63, 39, 'Y'); rect(3, 36, 59, 39, '#')
rect(60, 19, 63, 20, ':')
# the avenue in from the east gate to the plaza
rect(36, 19, 60, 20, ':')
# the plaza (cobbles) round the carousel
rect(22, 14, 40, 27, '=')
# the theatre: the Marionette Hall, door at (31,9)
rect(25, 3, 38, 9, 'X'); g[9][31] = ':'
rect(31, 10, 31, 13, ':')
# paths: plaza south to the straw and the lift; west to the fortune teller's; north-east to the pen
rect(17, 26, 21, 26, ':'); rect(17, 27, 17, 33, ':'); rect(12, 33, 17, 33, ':')
rect(30, 28, 30, 34, ':'); rect(24, 34, 30, 34, ':')
rect(8, 18, 21, 18, ':'); rect(8, 12, 8, 18, ':')
rect(41, 10, 52, 10, ':'); rect(41, 10, 41, 14, ':')
# the puppet pen (north-east): a fence all round, a little hole in its fence, spikes inside (a bed of nails)
rect(50, 3, 58, 9, '.'); rect(50, 3, 58, 3, 'f'); rect(50, 9, 58, 9, 'f'); rect(50, 3, 50, 9, 'l'); rect(58, 3, 58, 9, 'l')
g[9][54] = 'O'
rect(52, 5, 56, 7, '^')
# hedges and trees about the place
for (x0, y0, x1, y1) in [(3, 2, 6, 7), (13, 2, 22, 5), (42, 2, 47, 6), (3, 22, 6, 29), (50, 23, 57, 33), (33, 30, 41, 34)]:
    rect(x0, y0, x1, y1, 'Y')
# the hidden nook behind the painted hedge (north-west): walled by woods, its mouth a painted flat at (10,8)
rect(9, 3, 11, 6, '.'); rect(8, 2, 8, 7, 'Y'); rect(12, 2, 12, 7, 'Y'); rect(9, 2, 11, 2, 'Y'); g[7][9] = 'b'; g[7][11] = 'b'; g[7][10] = '.'
# grass and flowers
for _ in range(220):
    x, y = random.randrange(3, 60), random.randrange(2, 36)
    if g[y][x] == '.': g[y][x] = random.choice([',', ',', '"', '.', 'w'])
for y in range(H):
    for x in range(W):
        if (x, y) in [(9, 3), (10, 3), (11, 3), (9, 4), (10, 4), (11, 4), (9, 5), (10, 5), (11, 5), (9, 6), (10, 6), (11, 6)]: g[y][x] = '.'
        if g[y][x] in ',"w' and any(0 <= x+dx < W and 0 <= y+dy < H and g[y+dy][x+dx] in ':=X' for dx in (-1,0,1) for dy in (-1,0,1)):
            g[y][x] = '.'
# forest blocks 2x2 for the painter; lone ones become bushes
for y in range(H):
    for x in range(W):
        if g[y][x] != 'Y': continue
        ok = any(all(0 <= x+dx+i < W and 0 <= y+dy+j < H and g[y+dy+j][x+dx+i] == 'Y' for i in (0,1) for j in (0,1)) for dx in (0,-1) for dy in (0,-1))
        if not ok: g[y][x] = 'b'
print("LARKSPUR"); [print("    '" + ''.join(r) + "',") for r in g]
