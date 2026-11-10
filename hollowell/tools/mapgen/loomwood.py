# Drafts the Loomwood (block 1,0: x 64..127, y 0..39): silver birches, the fog close on the north and west (the Frayed
# Edge), the north stone gate across the road up from town (rows 36-37), the Loom in the north, strays near the edge.
# Prints JS rows.
import random
random.seed(17)
W, H = 64, 40
g = [['.' for _ in range(W)] for _ in range(H)]
def rect(x0, y0, x1, y1, c):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if 0 <= x < W and 0 <= y < H: g[y][x] = c
# the edge of the valley: fog north and west; woods east
rect(0, 0, 63, 1, '%'); rect(0, 0, 2, 39, '%')
rect(60, 0, 63, 39, 'Y')
# the stone wall and the north gate across the road from town
rect(3, 36, 59, 37, '^'); rect(30, 36, 33, 37, '=')
rect(3, 38, 29, 39, 'Y'); rect(34, 38, 59, 39, 'Y'); rect(30, 38, 33, 39, '=')
# the road up through the birches to the Loom
rect(30, 26, 33, 35, ':'); rect(30, 11, 31, 25, ':'); rect(24, 10, 39, 10, ':')
# the Loom itself (a building: x 24..39, y 3..9)
rect(24, 3, 39, 9, 'X')
# the Frayed Edge path, west: from the road to the edge
rect(8, 20, 29, 21, ':'); rect(8, 8, 9, 21, ':')
# the Stray House (O1), up by the fog in the north-west
rect(4, 3, 11, 6, 'X')
# a stream from the north-east, under a log
rect(48, 2, 49, 35, '-'); rect(47, 2, 47, 35, '~'); rect(50, 2, 50, 35, '~')
rect(46, 18, 51, 18, '_')
rect(32, 18, 45, 18, ':')
# birch woods in clumps
for (x0, y0, x1, y1) in [(3, 24, 14, 34), (16, 26, 27, 34), (36, 26, 45, 34), (52, 20, 59, 34), (14, 2, 22, 8), (41, 3, 45, 14), (52, 3, 59, 16), (12, 11, 22, 17), (34, 12, 40, 16)]:
    rect(x0, y0, x1, y1, 'Y')
# clearings and the silk hollow (a nook behind a strand, east of the road)
rect(36, 21, 43, 24, '.'); rect(55, 8, 58, 12, '.')
# grass, flowers
for _ in range(240):
    x, y = random.randrange(3, 60), random.randrange(2, 36)
    if g[y][x] == '.': g[y][x] = random.choice([',', '"', '.', '.'])
for y in range(H):
    for x in range(W):
        if g[y][x] in ',"' and any(0 <= x+dx < W and 0 <= y+dy < H and g[y+dy][x+dx] in ':=X^' for dx in (-1,0,1) for dy in (-1,0,1)):
            g[y][x] = '.'
# forest blocks 2x2 for the painter; lone ones become bushes
for y in range(H):
    for x in range(W):
        if g[y][x] != 'Y': continue
        ok = any(all(0 <= x+dx+i < W and 0 <= y+dy+j < H and g[y+dy+j][x+dx+i] == 'Y' for i in (0,1) for j in (0,1)) for dx in (0,-1) for dy in (0,-1))
        if not ok: g[y][x] = 'b'
print("const LOOMWOOD_ROWS = ["); [print("    '" + ''.join(r) + "',") for r in g]; print("];")
