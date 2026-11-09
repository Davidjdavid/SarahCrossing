# Draft room layouts for the Tidyhouse (D1). Prints JS rows; the result lives in src/41_tidyhouse.js.
def room(n=False, s=False, w=False, e=False, floor='.'):
    g = [['#'] * 20 for _ in range(11)]
    for y in range(1, 10):
        for x in range(1, 19): g[y][x] = floor
    if n: g[0][9] = floor
    if s: g[10][9] = floor
    if w: g[5][0] = floor
    if e: g[5][19] = floor
    return g
def put(g, x, y, c): g[y][x] = c
def rect(g, x0, y0, x1, y1, c):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1): g[y][x] = c
R = {}
# Foyer (1,3): plate and the timed north gate
g = room(n=True, s=True, w=True, e=True)
rect(g, 2, 2, 17, 8, ','); rect(g, 3, 3, 16, 7, '.')
for (x, y) in [(3, 3), (16, 3), (3, 7), (16, 7)]: put(g, x, y, 'U')
put(g, 0, 5, '.'); put(g, 1, 5, '.'); put(g, 2, 5, '.'); put(g, 19, 5, '.'); put(g, 18, 5, '.')
R['foyer'] = g
# Kitchen (0,3): pots, a crystal behind a low counter
g = room(e=True, floor=':')
rect(g, 8, 1, 8, 3, '#'); rect(g, 1, 3, 7, 3, 'l')
R['kitchen'] = g
# Gallery (2,3): the bust that comes home in the way
g = room(w=True)
rect(g, 1, 1, 18, 1, '#'); rect(g, 1, 9, 18, 9, '#')
rect(g, 2, 3, 17, 3, '#'); rect(g, 2, 7, 17, 7, '#')
rect(g, 13, 4, 13, 6, '#'); put(g, 13, 5, '.')
rect(g, 14, 4, 17, 6, ',')
put(g, 9, 2, '.'); put(g, 9, 8, '.')
R['gallery'] = g
# Hall of Busts (1,2): lane shove; the north door far to the left
g = room(s=True, w=True, e=True, floor=',')
g[0][9] = '#'; g[0][3] = ','
rect(g, 1, 1, 18, 1, '.'); 
R['hall'] = g
# Pantry (0,2): throw a crate onto the island plate
g = room(e=True, floor=':')
rect(g, 3, 4, 5, 6, 'o'); put(g, 4, 5, ':')
rect(g, 12, 6, 12, 9, '#'); rect(g, 13, 6, 17, 6, '#'); put(g, 14, 6, ':')
R['pantry'] = g
# Parlor (2,2): the pulse plate; gate far away in the NE
g = room(w=True, e=True, floor=',')
g[0][16] = ','
rect(g, 1, 6, 12, 6, '#'); put(g, 0, 7, '#'); rect(g, 13, 6, 13, 6, ',')
rect(g, 1, 8, 12, 8, '#')
rect(g, 1, 7, 12, 7, '.')
R['parlor'] = g
for k, g in R.items():
    print(k)
    for r in g:
        s = ''.join(r); assert len(s) == 20
        print("            '" + s + "',")
