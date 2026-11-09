# Draft of Kilnridge (overworld block 0,2). Output pasted into src/46_kilnridge.js.
import random
random.seed(5)
W, H = 64, 40
g = [['.'] * W for _ in range(H)]
def R(x0, y0, x1, y1, c):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if 0 <= x < W and 0 <= y < H: g[y][x] = c
def P(x, y, c):
    if 0 <= x < W and 0 <= y < H: g[y][x] = c
# outer walls: cliffs all round; fog along the bottom and the west
R(0, 0, 63, 2, '#'); R(0, 0, 2, 39, '#'); R(0, 37, 63, 39, '#'); R(61, 0, 63, 39, '#')
R(0, 38, 63, 39, '%'); R(0, 0, 0, 39, '%')
# the canyon road from Meadowfold (east edge, row 23)
R(56, 22, 63, 24, '#'); R(56, 23, 63, 23, ':')
R(44, 21, 56, 25, '.'); R(44, 23, 56, 23, ':')
# the Kiln mesa: cliff ring, the door in its south face
R(12, 4, 32, 13, '#'); R(14, 5, 30, 11, '.')
R(21, 12, 23, 13, '#'); P(22, 13, ':')
R(16, 6, 18, 8, 'Y')   # a stand of dry trees on top
# a ramp up the mesa's east side (stairs)
R(33, 8, 33, 9, 'H'); R(32, 8, 32, 9, 'H')
# the potters' camp
R(38, 28, 54, 34, '.')
# the hawk's mesa (S20) with a winding path
R(46, 5, 58, 15, '#'); R(48, 6, 56, 13, '.')
R(47, 16, 47, 18, 'H'); R(48, 14, 48, 15, '#')
# ledges and boulders
for (x, y) in [(6, 20), (9, 30), (36, 17), (40, 8), (27, 30), (14, 25), (58, 30)]: P(x, y, 'r')
# dry grass and paths
R(22, 14, 22, 23, ':'); R(22, 23, 44, 23, ':')
R(30, 23, 30, 31, ':'); R(30, 31, 38, 31, ':')
# the north-west high mesa (the drop to Larkspur comes later): fenced
R(4, 3, 10, 9, '.'); R(3, 2, 11, 2, '#')
R(4, 10, 10, 10, '#'); P(7, 10, 'H')
for x in range(4, 11): P(x, 3, 'f')
random.seed(9)
for _ in range(220):
    x, y = random.randrange(3, 60), random.randrange(3, 37)
    if g[y][x] == '.': g[y][x] = random.choice(',,"')
for row in g:
    s = ''.join(row); assert len(s) == 64
    print("    '" + s + "',")
