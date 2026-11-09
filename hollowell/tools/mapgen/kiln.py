# Room drafts for the Kiln (D2): prints rows to paste into src/45_kiln.js
def room(n=None, s=None, w=None, e=None, floor='.'):
    g = [['#'] * 20 for _ in range(11)]
    for y in range(1, 10):
        for x in range(1, 19): g[y][x] = floor
    if n is not None: g[0][n] = floor
    if s is not None: g[10][s] = floor
    if w is not None: g[w][0] = floor
    if e is not None: g[e][19] = floor
    return g
def R(g, x0, y0, x1, y1, c):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1): g[y][x] = c
def P(g, x, y, c): g[y][x] = c
rooms = {}
# 1 Entrance (1,3)
g = room(n=9, s=9)
R(g, 5, 4, 14, 6, 'o')
R(g, 15, 1, 15, 3, '#'); R(g, 16, 3, 18, 3, '#'); P(g, 17, 3, '.')
rooms['entrance'] = g
# 2 Charm Hall (1,2): three pulse charms far apart; gate north
g = room(n=9, s=9, w=5, e=5)
R(g, 4, 3, 6, 3, '#'); R(g, 13, 3, 15, 3, '#'); R(g, 4, 7, 6, 7, '#'); R(g, 13, 7, 15, 7, '#')
R(g, 8, 4, 11, 6, ',')
rooms['charmhall'] = g
# 3 Crock pen (2,3)
g = room(w=5)
R(g, 3, 3, 4, 4, '#'); R(g, 15, 3, 16, 4, '#'); R(g, 3, 7, 4, 7, '#'); R(g, 15, 7, 16, 7, '#')
rooms['crocks'] = g
# 4 Sun-Moon-Star (2,2): a horseshoe corridor; the mural on the north wall
g = room(w=5, n=16)
R(g, 3, 3, 15, 7, '#')
R(g, 5, 5, 13, 5, '.')
R(g, 3, 5, 4, 5, '.')
rooms['sms'] = g
# 5 Doubling back (0,2): a spur with a charm
g = room(e=5, n=9)
R(g, 2, 2, 17, 2, '#'); R(g, 2, 8, 17, 8, '#')
R(g, 2, 3, 2, 7, '#'); R(g, 17, 3, 17, 7, '#')
R(g, 3, 3, 16, 7, ',')
R(g, 9, 3, 9, 4, '#'); R(g, 9, 6, 9, 7, '#')
P(g, 2, 5, ','); P(g, 9, 2, '.'); P(g, 17, 5, ',')
rooms['doubling'] = g
for k, g in rooms.items():
    print(k)
    for r in g: print("                '" + ''.join(r) + "',")
