"""Furniture, part six: what hangs on the walls. Each is made against the back wall: its middle at the origin, its back
on the wall (y 0), standing out toward -y, z up, as big as its picture (16 pixels to a tile; EnvRoom puts it where the
picture was on the wall and stretches it to the wall's height).

The shaped ones are models through and through (the clock, the window, the mirrors, curtains, the shelves and what's on
them, the life ring, the ladder, the gears...). What carries words or a painting (signs, posters, framed pictures, the
boards) is a real frame or board with the picture itself on its face: a quad named *_pic (or *_picglow for neon, drawn
unlit) exactly the picture's size, which the game paints with the piece's own picture, so the lettering and the art stay
as drawn."""
import math
from mathutils import Vector, Matrix, Euler, noise
from trees_ac import rgb
from kit import col_fn, shade, rbox, lathe, tube, xform, cyl, slab
from folks import ball
from furn_kit import *


def pic(mb, W, H, y):
    """the picture's quad: exactly W x H, its middle at the origin, facing the room at y"""
    mb.add([(-W / 2, y, -H / 2), (W / 2, y, -H / 2), (W / 2, y, H / 2), (-W / 2, y, H / 2)], [(1, 1, 1)] * 4, [(0, -1, 0)] * 4, [(0, 1, 2), (0, 2, 3)])


def circle(r, n=28, cx=0.0, cz=0.0, sx=1.0):
    return [(cx + math.cos(k / n * math.tau) * r * sx, cz + math.sin(k / n * math.tau) * r) for k in range(n)]


def rounded(W, H, r, n=5):
    """a rounded rectangle's outline (counter-clockwise), W x H about the middle"""
    r = min(r, W / 2 * 0.99, H / 2 * 0.99)
    out = []
    for cx, cz, a0 in ((W / 2 - r, -H / 2 + r, -90), (W / 2 - r, H / 2 - r, 0), (-W / 2 + r, H / 2 - r, 90), (-W / 2 + r, -H / 2 + r, 180)):
        for k in range(n + 1):
            a = math.radians(a0 + 90 * k / n)
            out.append((cx + math.cos(a) * r, cz + math.sin(a) * r))
    return out


def hoop(mb, R, r, color, y, cx=0.0, cz=0.0, sx=1.0, seg=32, ts=6):
    """a ring standing on the wall (a rim, a frame round a mirror), round or oval"""
    pts = [(cx + math.cos(k / seg * math.tau) * R * sx, y, cz + math.sin(k / seg * math.tau) * R) for k in range(seg + 1)]
    tube(mb, pts, r, color, seg=ts)


def framed(P, W, H, border, color, depth=0.06, glass=False):
    """a picture frame: four rounded bars round the edge, a backing, the picture inside (its own painted frame hidden
    under the bars)"""
    c = color if callable(color) else wood(color)
    for (x0, x1, z0, z1) in ((-W / 2, W / 2, H / 2 - border, H / 2), (-W / 2, W / 2, -H / 2, -H / 2 + border),
                             (-W / 2, -W / 2 + border, -H / 2, H / 2), (W / 2 - border, W / 2, -H / 2, H / 2)):
        rbox(P.main, x0, -depth, z0, x1, 0.0, z1, c, r=min(0.02, border * 0.4), mid=1)
    rbox(P.main, -W / 2 + border * 0.5, -0.012, -H / 2 + border * 0.5, W / 2 - border * 0.5, 0.0, H / 2 - border * 0.5, shade('#4a3a30'), r=0.004, mid=0)
    pic(P.pic, W, H, -0.016)


def board(P, W, H, rim, depth=0.06, r=0.16):
    """a sign board, its corners rounded, the picture on its face"""
    slab(P.main, rounded(W * 0.97, H * 0.95, r), depth, wood(rim), axis='y', at=-depth)
    pic(P.pic, W, H, -depth - 0.003)


def neon(P, W, H):
    """a neon sign: a dark box, the lettering glowing on its face"""
    slab(P.main, rounded(W * 0.97, H * 0.92, 0.06), 0.07, paint('#1c1c26'), axis='y', at=-0.07)
    pic(P.picglow, W, H, -0.073)


def poster(P, W, H):
    """a poster on the wall: a sheet of thick paper"""
    rbox(P.main, -W / 2 * 0.94, -0.01, -H / 2 * 0.95, W / 2 * 0.94, 0.0, H / 2 * 0.95, shade('#f2ece0'), r=0.003, mid=0)
    pic(P.pic, W, H, -0.012)


def plank(P, W, z, d=0.2, col='#8a5a34', brackets=True):
    """a shelf plank on two brackets"""
    rbox(P.main, -W / 2, -d, z - 0.05, W / 2, 0.0, z, wood(col), r=0.012, mid=1)
    if brackets:
        for x in (-W / 2 + 0.2, W / 2 - 0.2):
            rbox(P.main, x - 0.018, -d * 0.7, z - 0.16, x + 0.018, 0.0, z - 0.05, wood(col), r=0.008, mid=0)


# ---------------------------------------------------------------- shaped
@item('clock_wall', 1, 1)
def clock_wall(P):
    slab(P.main, circle(0.4), 0.05, paint('#fbf6ea', under=0.0), axis='y', at=-0.055)
    hoop(P.main, 0.41, 0.05, wood('#9a6a3a'), -0.05)
    for k in range(12):
        a = k / 12 * math.tau
        x, z = math.cos(a) * 0.31, math.sin(a) * 0.31
        # (the quarters a longer mark across the rim's line, the hours a dot)
        dx, dz = (0.03, 0.012) if k in (0, 6) else (0.012, 0.03) if k in (3, 9) else (0.012, 0.012)
        rbox(P.main, x - dx, -0.066, z - dz, x + dx, -0.055, z + dz, shade('#3a2a24'), r=0.004, mid=0)
    # (the hands, each pointing at 12: the game turns them to the time of day)
    rbox(P.minute, -0.015, -0.075, -0.04, 0.015, -0.062, 0.27, shade('#2a2220'), r=0.006, mid=0)
    rbox(P.hour, -0.016, -0.082, -0.03, 0.016, -0.07, 0.18, shade('#2a2220'), r=0.006, mid=0)
    ball(P.gloss, (0, -0.085, 0), (0.025, 0.012, 0.025), shade('#c8a048'), sub=1)


@item('window_wall', 1, 1)
def window_wall(P):
    sky = lambda p, n, z0=0, z1=1: rgb('#7cc0e8').lerp(rgb('#c8eafa'), max(0.0, min(1.0, (p.z + 0.4) / 0.8))) * (1.06 if (p.x + p.z * 0.6) % 0.3 < 0.06 else 1.0)
    rbox(P.gloss, -0.4, -0.03, -0.38, 0.4, -0.01, 0.42, sky, r=0.004, mid=0)
    f = paint('#f4f2ee', under=0.05)
    for (x0, x1, z0, z1) in ((-0.45, 0.45, 0.38, 0.46), (-0.45, 0.45, -0.42, -0.34), (-0.45, -0.37, -0.42, 0.46), (0.37, 0.45, -0.42, 0.46),
                             (-0.03, 0.03, -0.36, 0.4), (-0.4, 0.4, 0.0, 0.05)):
        rbox(P.main, x0, -0.075, z0, x1, 0.0, z1, f, r=0.012, mid=1)
    rbox(P.main, -0.5, -0.15, -0.47, 0.5, 0.0, -0.4, f, r=0.015, mid=1)


@item('shell_mirror', 1, 1)
def shell_mirror(P):
    glassy = lambda p, n, z0=0, z1=1: rgb('#c8e4ee').lerp(rgb('#f2fafc'), max(0.0, min(1.0, 0.5 + (p.x + p.z) * 1.2)))
    slab(P.gloss, circle(0.28), 0.03, glassy, axis='y', at=-0.035)
    slab(P.main, circle(0.34), 0.03, paint('#f8e4d8'), axis='y', at=-0.03)
    for k in range(11):
        a = k / 11 * math.tau
        x, z = math.cos(a) * 0.35, math.sin(a) * 0.35
        ball(P.main, (x, -0.05, z), (0.075, 0.035, 0.07), shade('#f4a08a'), sub=2)
        ball(P.main, (x * 1.04, -0.08, z * 1.04), (0.02, 0.012, 0.02), shade('#fbf0e8'), sub=1)


def drape(mb, x0, x1, ztop, zbot, color, folds=5, depth=0.08, n=24, m=10):
    """a curtain panel hanging in soft folds: deeper shade in each fold"""
    P_, C, N, F = [], [], [], []
    for i in range(m + 1):
        z = ztop + (zbot - ztop) * i / m
        for j in range(n + 1):
            u = j / n
            x = x0 + (x1 - x0) * u
            ph = u * folds * math.tau
            y = -depth * 0.5 - depth * 0.5 * math.sin(ph) - 0.01
            dy = -depth * 0.5 * math.cos(ph) * folds * math.tau / (x1 - x0)
            nn = Vector((dy, -1, 0)).normalized()
            k = 0.78 + 0.22 * (0.5 + 0.5 * math.sin(ph))
            P_.append((x, y, z)); N.append(nn); C.append(rgb(color) * k * (1 - 0.08 * i / m))
    for i in range(m):
        for j in range(n):
            a = i * (n + 1) + j
            F += [(a, a + 1, a + n + 2), (a, a + n + 2, a + n + 1)]
    mb.add(P_, C, N, F)


@item('blackout_curtains', 2, 1)
def blackout_curtains(P):
    drape(P.main, -0.98, -0.03, 0.4, -0.5, '#2a3458', folds=4)
    drape(P.main, 0.03, 0.98, 0.4, -0.5, '#2a3458', folds=4)
    tube(P.gloss, [(-1.02, -0.1, 0.44), (1.02, -0.1, 0.44)], 0.022, metal('#5a4a3a'), seg=8)
    for x in (-1.04, 1.04):
        ball(P.gloss, (x, -0.1, 0.44), 0.035, shade('#c8a048'), sub=1)


@item('noren', 2, 1)
def noren(P):
    tube(P.main, [(-1.0, -0.05, 0.44), (1.0, -0.05, 0.44)], 0.025, wood('#6a4a32'), seg=8)
    for k in range(4):
        x0 = -0.96 + k * 0.485
        drape(P.main, x0, x0 + 0.46, 0.42, -0.46, '#2e4a7a', folds=1, depth=0.025, n=8, m=6)
    slab(P.main, circle(0.17), 0.01, shade('#fbf8f2'), axis='y', at=-0.05)
    slab(P.main, circle(0.07), 0.01, shade('#d8343a'), axis='y', at=-0.058)


@item('chili_lights', 2, 1)
def chili_lights(P):
    pts = [(-1.0 + 2.0 * t, -0.04, 0.34 - 0.12 * math.sin(t * math.pi)) for t in [i / 20 for i in range(21)]]
    tube(P.main, pts, 0.008, shade('#3a6a2a'), seg=5)
    for k in range(9):
        t = (k + 0.5) / 9
        x, z = -1.0 + 2.0 * t, 0.34 - 0.12 * math.sin(t * math.pi)
        ball(P.main, (x, -0.05, z - 0.02), (0.03, 0.025, 0.025), shade('#3a8a2a'), sub=1)
        tube(P.gloss, [(x, -0.05, z - 0.03), (x + 0.01, -0.055, z - 0.14), (x - 0.01, -0.05, z - 0.26)], 0.032, shade('#e8302a'), seg=8, r1=0.006)


@item('spice_rack', 2, 1)
def spice_rack(P):
    for z in (-0.38, 0.06):
        rbox(P.main, -0.98, -0.16, z - 0.04, 0.98, 0.0, z, wood('#a8743a'), r=0.01, mid=1)
    for x in (-0.98, 0.94):
        rbox(P.main, x, -0.16, -0.42, x + 0.04, 0.0, 0.46, wood('#8a5a2a'), r=0.01, mid=1)
    rbox(P.main, -0.98, -0.02, 0.4, 0.98, 0.0, 0.46, wood('#a8743a'), r=0.01, mid=1)
    cols = ('#c8302a', '#f0b030', '#7a4a2a', '#4a9a3a', '#e8803a', '#6a3a8a', '#d8c8a8')
    for row, z in enumerate((-0.38, 0.06)):
        for k in range(7):
            x = -0.8 + k * 0.265 + row * 0.05
            lathe(P.clear, [(0.07, z), (0.07, z + 0.24)], col_fn('#e8f4f8', under=0.0), seg=10, c=(x, -0.08, 0), cap_top=False)
            lathe(P.main, [(0.062, z + 0.005), (0.062, z + 0.16)], shade(cols[(k + row * 3) % 7]), seg=10, c=(x, -0.08, 0), cap_top=True)
            cyl(P.main, x, -0.08, z + 0.24, z + 0.28, 0.072, color=wood('#5a3a2a'), seg=10)


@item('disco_ball', 1, 1)
def disco_ball(P):
    tube(P.main, [(0, -0.2, 0.5), (0, -0.2, 0.3)], 0.006, shade('#8a8a92'), seg=4)

    def tiles(p, n, z0=0, z1=1):
        a, b = math.atan2(n.y, n.x), math.asin(max(-1.0, min(1.0, n.z)))
        k = (int((a + math.pi) * 5) + int((b + 2) * 6)) % 3
        return rgb(('#e8eef4', '#a8b8c8', '#c8d8f0')[k]) * (0.8 + 0.4 * max(0.0, n.dot(Vector((0.3, -0.6, 0.7)).normalized())))
    ball(P.gloss, (0, -0.2, 0.05), 0.25, tiles, sub=3)


@item('pride_flag', 1, 1)
def pride_flag(P):
    tube(P.main, [(-0.4, -0.04, -0.5), (-0.4, -0.04, 0.48)], 0.02, metal('#8a8a92'), seg=8)
    ball(P.gloss, (-0.4, -0.04, 0.5), 0.03, shade('#c8a048'), sub=1)
    stripes_ = ('#e8303a', '#f08a2a', '#f4d03a', '#3aa84a', '#3a6ad8', '#8a3ab8')
    P_, C, N, F = [], [], [], []
    n, m = 14, 12
    for i in range(m + 1):
        v = i / m
        for j in range(n + 1):
            u = j / n
            x = -0.38 + 0.84 * u
            z = 0.45 - 0.62 * v - 0.04 * u
            y = -0.05 - 0.05 * math.sin(u * 5 + 0.5) * u
            P_.append((x, y, z)); N.append((-0.25 * math.cos(u * 5 + 0.5) * u, -1, 0))
            C.append(rgb(stripes_[min(5, int(v * 6))]) * (0.85 + 0.15 * math.sin(u * 5 + 0.5)))
    for i in range(m):
        for j in range(n):
            a = i * (n + 1) + j
            F += [(a, a + 1, a + n + 2), (a, a + n + 2, a + n + 1)]
    P.main.add(P_, C, N, F)


def plaque(P, metal_c):
    rbox(P.main, -0.42, -0.06, -0.42, 0.42, 0.0, 0.42, wood('#7a4a2a'), r=0.04, mid=1)
    rbox(P.gloss, -0.3, -0.09, -0.3, 0.3, -0.05, 0.3, metal(metal_c), r=0.03, mid=1)
    # (the council's broccoli in relief)
    for (x, z, r) in ((0.0, 0.1, 0.09), (-0.09, 0.04, 0.07), (0.09, 0.04, 0.07), (0.0, 0.0, 0.08)):
        ball(P.gloss, (x, -0.09, z), (r, 0.03, r), metal(metal_c), sub=1)
    rbox(P.gloss, -0.03, -0.11, -0.2, 0.03, -0.08, 0.0, metal(metal_c), r=0.01, mid=0)


@item('plaque_bronze', 1, 1)
def plaque_bronze(P):
    plaque(P, '#c8864a')


@item('plaque_silver', 1, 1)
def plaque_silver(P):
    plaque(P, '#c8ccd4')


@item('shelf_wall', 2, 1)
def shelf_wall(P):
    plank(P, 1.7, -0.26, col='#9a6a3a')
    x = -0.75
    for k, (c, h) in enumerate((('#f0b030', 0.3), ('#e8443a', 0.46), ('#3a6ac8', 0.42), ('#4aa85a', 0.36), ('#f4c84a', 0.3), ('#9a5ad8', 0.44))):
        w = 0.19 if k % 2 else 0.22
        rbox(P.main, x, -0.18, -0.26, x + w, -0.03, -0.26 + h, paint(c), r=0.014, mid=1)
        rbox(P.main, x + 0.02, -0.185, -0.26 + h * 0.7, x + w - 0.02, -0.17, -0.26 + h * 0.76, shade('#fbf6ea'), r=0.004, mid=0)
        x += w + 0.03


@item('boston_sign', 1, 1)
def boston_sign(P):
    slab(P.main, [(-0.36, 0.42), (0.48, 0.15), (-0.36, -0.12)], 0.025, paint('#c82a3a'), axis='y', at=-0.04)
    pic(P.pic, 1.0, 1.0, -0.043)
    tube(P.gloss, [(-0.4, -0.06, -0.5), (-0.4, -0.06, 0.46)], 0.022, metal('#8a8a92'), seg=8)


@item('pottery_shelf', 2, 1)
def pottery_shelf(P):
    plank(P, 1.7, -0.36, col='#9a6a3a')
    for k, (c, prof) in enumerate((('#3a5ac8', [(0.06, 0), (0.1, 0.1), (0.05, 0.22), (0.05, 0.26)]),
                                   ('#e07a3a', [(0.05, 0), (0.12, 0.12), (0.1, 0.3), (0.04, 0.4), (0.05, 0.44)]),
                                   ('#5ab8a8', [(0.06, 0), (0.09, 0.08), (0.07, 0.2), (0.07, 0.26)]),
                                   ('#f2ece0', [(0.05, 0), (0.08, 0.15), (0.04, 0.32), (0.035, 0.36)]),
                                   ('#9a6ad8', [(0.06, 0), (0.1, 0.06), (0.1, 0.16), (0.06, 0.2)]))):
        x = -0.65 + k * 0.33
        lathe(P.gloss, [(r, z - 0.36) for r, z in prof], col_fn(c, under=0.1), seg=14, c=(x, -0.1, 0), cap_top=True)


@item('pegboard', 2, 1)
def pegboard(P):
    H = 1.25
    rbox(P.main, -0.98, -0.04, -H / 2, 0.98, 0.0, H / 2, wood('#d8b47a'), r=0.02, mid=1)
    for (x0, x1, z0, z1) in ((-1.0, 1.0, H / 2 - 0.06, H / 2), (-1.0, 1.0, -H / 2, -H / 2 + 0.06), (-1.0, -0.94, -H / 2, H / 2), (0.94, 1.0, -H / 2, H / 2)):
        rbox(P.main, x0, -0.06, z0, x1, 0.0, z1, wood('#9a6a3a'), r=0.012, mid=1)
    for i in range(9):
        for j in range(6):
            x, z = -0.86 + i * 0.215, -0.5 + j * 0.2
            slab(P.main, circle(0.014, 6, x, z), 0.002, shade('#7a5a3a'), axis='y', at=-0.042)
    # a hammer, a wrench, a saw, a tape measure, a screwdriver, a roll of tape: as big and bright as the picture's
    rbox(P.main, -0.79, -0.09, -0.3, -0.71, -0.04, 0.24, wood('#b07a48'), r=0.02, mid=1)
    rbox(P.gloss, -0.92, -0.12, 0.18, -0.6, -0.05, 0.34, metal('#9a9ea8'), r=0.025, mid=1)
    tube(P.gloss, [(-0.46, -0.07, -0.32), (-0.44, -0.07, 0.16)], 0.035, metal('#b8bcc4'), seg=8)
    hoop(P.gloss, 0.075, 0.028, metal('#b8bcc4'), -0.07, cx=-0.44, cz=0.25, seg=16)
    rbox(P.gloss, -0.27, -0.07, -0.18, 0.12, -0.045, 0.22, metal('#d0d4dc'), r=0.015, mid=0)
    rbox(P.main, -0.33, -0.1, 0.04, -0.2, -0.04, 0.26, wood('#9a5a2a'), r=0.03, mid=1)
    rbox(P.main, 0.16, -0.12, -0.12, 0.34, -0.04, 0.18, paint('#d0443a'), r=0.035, mid=1)
    tube(P.main, [(0.52, -0.07, -0.34), (0.52, -0.07, 0.08)], 0.035, paint('#3a6ad8'), seg=8)
    tube(P.gloss, [(0.52, -0.07, 0.08), (0.52, -0.07, 0.32)], 0.012, metal('#c8ccd4'), seg=6)
    hoop(P.main, 0.08, 0.04, paint('#f0c030'), -0.08, cx=0.78, cz=-0.22, seg=18)


@item('tool_wall', 2, 1)
def tool_wall(P):
    H = 1.5
    for k in range(4):
        x0 = -1.0 + k * 0.5
        rbox(P.main, x0 + 0.01, -0.05, -H / 2, x0 + 0.49, 0.0, H / 2, wood('#8a5a34', grain='z', seed=k), r=0.012, mid=1)
    # a lantern on a hook, a coil of rope, a pitchfork's and a rake's heads
    tube(P.gloss, [(-0.5, -0.06, 0.4), (-0.5, -0.12, 0.4)], 0.01, metal('#4a4a52'), seg=4)
    rbox(P.gloss, -0.58, -0.2, 0.0, -0.42, -0.06, 0.32, metal('#3a3a44'), r=0.02, mid=1)
    rbox(P.glow, -0.55, -0.205, 0.05, -0.45, -0.19, 0.27, shade('#ffd27a'), r=0.01, mid=0)
    for k in range(3):
        hoop(P.main, 0.14 - k * 0.025, 0.025, col_fn('#c8a878', mottle=0.15), -0.08 - k * 0.02, cx=0.3, cz=0.1, seg=20)
    for (x, n) in ((-0.6, 4), (0.3, 6)):
        rbox(P.gloss, x - 0.22, -0.08, -0.55, x + 0.22, -0.05, -0.5, metal('#8a8e98'), r=0.01, mid=0)
        for k in range(n):
            xx = x - 0.2 + k * 0.4 / (n - 1)
            rbox(P.gloss, xx - 0.012, -0.08, -0.72, xx + 0.012, -0.05, -0.5, metal('#8a8e98'), r=0.006, mid=0)


@item('hayloft_ladder', 1, 2)
def hayloft_ladder(P):
    H = 1.625
    for x in (-0.3, 0.3):
        rbox(P.main, x - 0.04, -0.09, -H / 2, x + 0.04, -0.02, H / 2 - 0.08, wood('#a8743a', grain='z'), r=0.015, mid=1)
    for k in range(8):
        z = -H / 2 + 0.12 + k * 0.19
        rbox(P.main, -0.3, -0.075, z - 0.025, 0.3, -0.035, z + 0.025, wood('#b88448'), r=0.012, mid=1)
    rbox(P.gloss, -0.4, -0.06, H / 2 - 0.1, 0.4, 0.0, H / 2, metal('#e8c040'), r=0.015, mid=1)


def cog(mb, cx, cz, R, teeth, color, y=-0.06, depth=0.05):
    pts = []
    for k in range(teeth * 4):
        a = k / (teeth * 4) * math.tau
        r = R if (k % 4) in (1, 2) else R * 0.82
        pts.append((cx + math.cos(a) * r, cz + math.sin(a) * r))
    slab(mb, pts, depth, color, axis='y', at=y)
    slab(mb, circle(R * 0.25, 12, cx, cz), 0.02, shade('#4a3a2a'), axis='y', at=y - 0.015)


@item('gear_wall', 2, 1)
def gear_wall(P):
    cog(P.main, -0.32, -0.12, 0.62, 12, wood('#9a6a3a'))
    cog(P.main, 0.55, 0.32, 0.36, 9, wood('#8a5a2a'), y=-0.08)
    for (x, z, r) in ((-0.32, -0.12, 0.38), (0.55, 0.32, 0.2)):
        for k in range(4):
            a = k / 4 * math.tau + 0.4
            rbox(P.main, x + math.cos(a) * r - 0.025, -0.07, z + math.sin(a) * r - 0.025, x + math.cos(a) * r + 0.025, -0.05, z + math.sin(a) * r + 0.025, shade('#4a3a2a'), r=0.01, mid=0)


@item('fabric_shelf', 2, 1)
def fabric_shelf(P):
    H = 1.375
    for z in (-H / 2, -0.02, H / 2 - 0.06):
        rbox(P.main, -1.0, -0.22, z, 1.0, 0.0, z + 0.06, wood('#8a5a34'), r=0.01, mid=1)
    for x in (-1.0, -0.51, -0.02, 0.47, 0.94):
        rbox(P.main, x, -0.22, -H / 2, x + 0.06, 0.0, H / 2, wood('#7a4a2a'), r=0.01, mid=1)
    rbox(P.main, -1.0, -0.01, -H / 2, 1.0, 0.0, H / 2, wood('#5a3a24'), r=0.004, mid=0)
    cols = (('#e85a7a', 'dots'), ('#f4d040', None), ('#3ab8c8', 'dots'), ('#5aa850', None), ('#9a6ad8', None), ('#f0903a', 'dots'), ('#f49ac0', None), ('#3a6ac8', 'dots'))
    for k, (c, pat) in enumerate(cols):
        x0 = -0.94 + (k % 4) * 0.49
        z0 = (0.04 if k < 4 else -H / 2 + 0.06)
        for j in range(3):
            def fn(p, n, z0_=0, z1_=1, c=c, pat=pat):
                base = rgb(c) * (0.9 + 0.08 * j)
                if pat and (int(p.x * 40) + int(p.z * 40)) % 4 == 0:
                    base = rgb('#fbf8f2')
                return base * (1 - 0.1 * max(0.0, -n.z))
            rbox(P.main, x0 + 0.03, -0.2, z0 + j * 0.17, x0 + 0.41, -0.03, z0 + j * 0.17 + 0.15, fn, r=0.03, mid=1)


@item('lh_barometer', 1, 1)
def lh_barometer(P):
    slab(P.main, circle(0.36), 0.04, paint('#fbf6ea', under=0.0), axis='y', at=-0.05)
    hoop(P.gloss, 0.38, 0.05, metal('#d8b048'), -0.05)
    for k in range(16):
        a = math.radians(210 - k * 16)
        x, z = math.cos(a) * 0.28, math.sin(a) * 0.28
        rbox(P.main, x - 0.008, -0.058, z - 0.008, x + 0.008, -0.05, z + 0.008, shade('#3a2a24'), r=0.003, mid=0)
    a = math.radians(70)
    tube(P.main, [(0, -0.07, 0), (math.cos(a) * 0.26, -0.07, math.sin(a) * 0.26)], 0.01, shade('#2a2220'), seg=4, r1=0.003)
    tube(P.main, [(0, -0.072, 0), (0.22, -0.072, -0.08)], 0.008, shade('#c83a3a'), seg=4, r1=0.003)
    ball(P.gloss, (0, -0.08, 0), (0.025, 0.012, 0.025), metal('#d8b048'), sub=1)


@item('lh_lifering', 1, 1)
def lh_lifering(P):
    seg, R, r = 40, 0.3, 0.11
    pts = [(math.cos(k / seg * math.tau) * R, -0.12, math.sin(k / seg * math.tau) * R) for k in range(seg + 1)]
    tube(P.main, pts, r, lambda p, n: rgb('#e8343a' if int((math.atan2(p.z, p.x) / math.tau + 1.0625) * 4) % 2 == 0 else '#fbf8f2') * (0.84 + 0.24 * max(0.0, n.dot(Vector((0.3, -0.7, 0.6)).normalized()))), seg=10)
    for k in range(4):
        a = (k + 0.5) / 4 * math.tau
        x, z = math.cos(a) * R, math.sin(a) * R
        hoop(P.main, r * 1.05, 0.012, col_fn('#e8d8b0'), -0.12, cx=x, cz=z, sx=0.25, seg=12, ts=4)


@item('salon_mirror', 1, 2)
def salon_mirror(P):
    glassy = lambda p, n, z0=0, z1=1: rgb('#c8e4ee').lerp(rgb('#f2fafc'), max(0.0, min(1.0, 0.5 + (p.x + p.z) * 1.5)))
    pts = circle(0.62, 32)
    slab(P.gloss, [(x * 0.42, z) for x, z in pts], 0.03, glassy, axis='y', at=-0.04)
    hoop(P.gloss, 0.66, 0.05, metal('#e8c040'), -0.04, sx=0.45, seg=40)
    ball(P.gloss, (0, -0.06, 0.72), (0.06, 0.03, 0.05), metal('#e8c040'), sub=1)


@item('prize_shelf', 2, 1)
def prize_shelf(P):
    rbox(P.main, -0.98, -0.2, -0.45, 0.98, 0.0, -0.36, paint('#8a5ad8'), r=0.015, mid=1)
    pic(P.pic, 2.0, 1.0, -0.12)


# ---------------------------------------------------------------- what carries words or a painting
@item('diploma', 1, 1)
def diploma(P):
    framed(P, 1.0, 1.0, 0.1, '#8a5a34')


@item('chalkboard', 2, 1)
def chalkboard(P):
    framed(P, 2.0, 1.0, 0.1, '#8a6a3a')
    rbox(P.main, -0.9, -0.12, -0.5, 0.9, 0.0, -0.44, wood('#8a6a3a'), r=0.015, mid=1)
    rbox(P.main, 0.4, -0.1, -0.44, 0.52, -0.06, -0.41, shade('#fbf8f2'), r=0.01, mid=0)


@item('framed_poem', 1, 1)
def framed_poem(P):
    framed(P, 1.0, 1.0, 0.08, '#c8a060')


@item('contract_frame', 1, 1)
def contract_frame(P):
    framed(P, 1.0, 1.0, 0.08, paint('#2a2a32'))


@item('firework_poster', 1, 1)
def firework_poster(P):
    poster(P, 1.0, 1.0)


@item('poster_blocks', 1, 1)
def poster_blocks(P):
    poster(P, 1.0, 1.0)


@item('poster_capsules', 1, 1)
def poster_capsules(P):
    poster(P, 1.0, 1.0)


@item('poster_fruit', 1, 1)
def poster_fruit(P):
    poster(P, 1.0, 1.0)


@item('poster_stack', 1, 1)
def poster_stack(P):
    poster(P, 1.0, 1.0)


@item('glaze_chart', 2, 1)
def glaze_chart(P):
    poster(P, 2.0, 1.0)


@item('menu_board', 2, 1)
def menu_board(P):
    framed(P, 2.0, 1.25, 0.08, '#5a3a2a')


@item('swatch_board', 2, 1)
def swatch_board(P):
    framed(P, 2.0, 1.25, 0.08, '#c8a878')


@item('lh_map', 2, 1)
def lh_map(P):
    framed(P, 2.0, 1.0, 0.08, '#7a5a3a')


@item('empty_frame', 2, 1)
def empty_frame(P):
    framed(P, 2.0, 1.625, 0.13, metal('#d8b048'))


@item('art_stilllife', 2, 1)
def art_stilllife(P):
    framed(P, 2.0, 1.625, 0.12, metal('#d8b048'))


@item('art_seaside', 2, 1)
def art_seaside(P):
    framed(P, 2.0, 1.625, 0.12, '#9a6a3a')


@item('art_goat', 2, 1)
def art_goat(P):
    framed(P, 2.0, 1.625, 0.12, metal('#d8b048'))


@item('hiscore_board', 2, 1)
def hiscore_board(P):
    neon(P, 2.0, 1.0)


@item('neon_sign', 2, 1)
def neon_sign(P):
    neon(P, 2.0, 1.0)


@item('neon_game', 2, 1)
def neon_game(P):
    neon(P, 2.0, 1.0)


@item('dnd_sign', 1, 1)
def dnd_sign(P):
    board(P, 1.0, 1.0, '#c8303a', depth=0.04, r=0.1)
    tube(P.main, [(-0.25, -0.03, 0.3), (0.0, -0.03, 0.48), (0.25, -0.03, 0.3)], 0.008, shade('#5a4a3a'), seg=4)
    ball(P.gloss, (0, -0.02, 0.48), 0.02, metal('#8a8e98'), sub=1)


SIGNS = {'sign_shop': '#8a5a34', 'sign_boutique': '#f2e4e8', 'studio_sign': '#8a5a34', 'sign_builder': '#8a5a34',
         'sign_museum': '#6a5a8a', 'sign_restaurant': '#3a7a4a', 'sign_salon': '#9a6ad8', 'sign_displays': '#3a8a4a'}
SIGN_H = {'sign_salon': 1.375, 'sign_displays': 1.375}
for _id, _c in SIGNS.items():
    item(_id, 2, 1)(lambda P, c=_c, h=SIGN_H.get(_id, 1.0): board(P, 2.0, h, c, depth=0.07, r=0.2))
