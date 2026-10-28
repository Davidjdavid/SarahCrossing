"""Furniture, part four: the old trunk, Floss & Gloss's salon, Waffle's garden displays, the dining set, the easel, the
arcade's stool and snack machine."""
import math
from mathutils import Vector, Matrix, Euler, noise
from trees_ac import rgb
from kit import col_fn, shade, rbox, lathe, tube, xform, cyl
from folks import ball, surf, superq, revolve, mottle
from furn_kit import *
from furn_b import lbox, counter_body, panels     # (light shapes, the counters' body)


def stone(c, seed=0.0):
    return col_fn(c, mottle=0.1, seed=seed, under=0.2)


def chrome(c='#c8ccd4'):
    return col_fn(c, under=0.05)


def leafy(c='#3e8a34', c2='#5aa848'):
    """Clipped hedge: a bumpy mottle of greens, lighter on top."""
    a, b = rgb(c), rgb(c2)

    def f(p, n, u=0, v=0):
        k = 0.5 + 0.5 * noise.noise(p * 14)
        return a.lerp(b, 0.45 * k + 0.35 * max(0.0, n.z)) * (0.82 + 0.18 * (0.5 + 0.5 * noise.noise(p * 40)))
    return f


def sheet(mb, x0, x1, z0, z1, y, color, nx=20, nz=14, wave=0.0, back=None):
    """A thin upright sheet (a flag, a canvas) facing -y, painted by color(u, v) over it (u across, v up, 0..1), waving
    a little in y; its back faces +y, in back (or the same) colors."""
    def pt(i, j):
        u, v = i / nx, j / nz
        return Vector((x0 + (x1 - x0) * u, y + wave * math.sin(u * math.pi * 2.2) * u, z0 + (z1 - z0) * v)), u, v
    for side, dy, cf in ((-1, 0.0, color), (1, 0.004, back or color)):
        pts, cols, nrms, faces = [], [], [], []
        for j in range(nz + 1):
            for i in range(nx + 1):
                p, u, v = pt(i, j)
                pts.append(p + Vector((0, dy, 0)))
                cols.append(rgb(cf(u, v)) if isinstance(cf(u, v), str) else cf(u, v))
                nrms.append(Vector((0, float(side), 0)))
        for j in range(nz):
            for i in range(nx):
                a = j * (nx + 1) + i
                faces += [(a, a + 1, a + nx + 2), (a, a + nx + 2, a + nx + 1)]
        mb.add(pts, cols, nrms, faces)


def checks(mb, x0, y0, x1, y1, z, h, n, c1, c2, over=0.03):
    """A checked tablecloth: the top in squares (each its own, so the checks stay crisp), hanging down h all round."""
    A, B = rgb(c1), rgb(c2)
    s = (x1 - x0) / n
    m = max(1, round((y1 - y0) / s))
    sy = (y1 - y0) / m

    def quad(p0, p1, p2, p3, nrm, c):
        mb.add([p0, p1, p2, p3], [c] * 4, [nrm] * 4, [(0, 1, 2), (0, 2, 3)])
    up = Vector((0, 0, 1))
    for i in range(n):
        for j in range(m):
            c = A if (i + j) % 2 else B
            xa, xb, ya, yb = x0 + s * i, x0 + s * (i + 1), y0 + sy * j, y0 + sy * (j + 1)
            quad(Vector((xa, ya, z)), Vector((xb, ya, z)), Vector((xb, yb, z)), Vector((xa, yb, z)), up, c)
    rows = max(1, round(h / s))
    sh = h / rows
    for r in range(rows):
        za, zb = z - sh * (r + 1), z - sh * r
        for i in range(n):
            c = (A if (i + r) % 2 else B) * 0.92
            xa, xb = x0 + s * i, x0 + s * (i + 1)
            quad(Vector((xa, y0, za)), Vector((xb, y0, za)), Vector((xb, y0, zb)), Vector((xa, y0, zb)), Vector((0, -1, 0)), c)
            quad(Vector((xa, y1, za)), Vector((xa, y1, zb)), Vector((xb, y1, zb)), Vector((xb, y1, za)), Vector((0, 1, 0)), c * 0.9)
        for j in range(m):
            c = (A if (j + r) % 2 else B) * 0.88
            ya, yb = y0 + sy * j, y0 + sy * (j + 1)
            quad(Vector((x0, ya, za)), Vector((x0, ya, zb)), Vector((x0, yb, zb)), Vector((x0, yb, za)), Vector((-1, 0, 0)), c)
            quad(Vector((x1, ya, za)), Vector((x1, yb, za)), Vector((x1, yb, zb)), Vector((x1, ya, zb)), Vector((1, 0, 0)), c)


@item('old_trunk', 1, 1)
def old_trunk(P):
    mb = P.main
    board = lambda p, n, z0=0, z1=1: rgb('#5e5238') * (0.8 + 0.25 * (0.5 + 0.5 * noise.noise(Vector((p.x * 3, p.y * 3, p.z * 22))))) * (0.82 if abs(math.sin(p.z * 34)) < 0.12 else 1.0)
    rbox(mb, -0.36, -0.25, 0.0, 0.36, 0.25, 0.4, board, r=0.025, mid=2)
    rbox(mb, -0.37, -0.26, 0.4, 0.37, 0.26, 0.56, board, r=0.07, mid=2)
    iron = shade('#34302c')
    for x in (-0.24, 0.24):
        rbox(mb, x - 0.03, -0.27, 0.0, x + 0.03, -0.24, 0.55, iron, r=0.008, mid=0)
        rbox(mb, x - 0.03, -0.26, 0.545, x + 0.03, 0.26, 0.575, iron, r=0.008, mid=0)
    for s in (-1, 1):
        rbox(mb, s * 0.36 - 0.015, -0.26, 0.0, s * 0.36 + 0.015, 0.26, 0.05, iron, r=0.006, mid=0)
    rbox(mb, -0.05, -0.285, 0.33, 0.05, -0.25, 0.45, metal('#c8a040'), r=0.01, mid=0)
    ball(mb, (0, -0.29, 0.37), 0.014, shade('#3a2a1a'), sub=1)


@item('salon_chair', 1, 1)
def salon_chair(P):
    mb = P.main
    pink = fabric('#ec5a9a')
    lathe(mb, [(0.23, 0.0), (0.24, 0.02), (0.2, 0.04), (0.05, 0.05)], chrome('#7a7e88'), seg=28)
    cyl(mb, 0, 0, 0.04, 0.36, 0.045, 0.04, chrome(), seg=12)
    lathe(mb, [(0.06, 0.34), (0.1, 0.37), (0.0, 0.38)], chrome(), seg=12)
    rbox(mb, -0.25, -0.24, 0.36, 0.25, 0.22, 0.5, pink, r=0.06, mid=2)
    rbox(mb, -0.23, 0.1, 0.42, 0.23, 0.26, 1.02, pink, r=0.09, mid=2)
    rbox(mb, -0.18, 0.08, 0.6, 0.18, 0.12, 0.92, fabric('#f27ab0'), r=0.04, mid=1)
    for s in (-1, 1):
        tube(mb, [(s * 0.27, 0.12, 0.48), (s * 0.29, -0.02, 0.62), (s * 0.28, -0.18, 0.62), (s * 0.27, -0.2, 0.5)], 0.018, chrome(), seg=6)
        rbox(mb, s * 0.27 - 0.035, -0.2, 0.6, s * 0.27 + 0.035, 0.08, 0.65, fabric('#d84a8a'), r=0.02, mid=1)
    tube(mb, [(-0.12, -0.3, 0.16), (0.12, -0.3, 0.16)], 0.016, chrome(), seg=6)
    tube(mb, [(0, -0.04, 0.2), (0, -0.3, 0.16)], 0.014, chrome(), seg=6)


@item('salon_desk', 2, 1)
def salon_desk(P):
    """The salon's front desk: a purple top with a rounded lip, lilac trim, the front a padded panel tufted with buttons in
    diamonds, round purple columns at its front corners and a little gilt plate with a pair of scissors on it."""
    mb, w, d, h = P.main, 1.8, 0.62, 1.0
    purple, lilac, gold = paint('#9a6ae0'), paint('#b890ec'), metal('#e0b040')
    z0, z1 = counter_body(P, w, d, h, purple, paint('#efe2fa'), lilac, '#7a54c0', top_t=0.06)
    y = -d / 2
    # the padded panel and its buttons
    lbox(mb, -0.76, y - 0.035, z0 + 0.03, 0.76, y + 0.01, z1 - 0.03, fabric('#f6ecfc'), r=0.035)
    rows = 4
    for r in range(rows):
        z = z0 + 0.1 + r * (z1 - z0 - 0.2) / (rows - 1)
        for k in range(8 if r % 2 == 0 else 7):
            x = -0.63 + k * 0.18 + (0.09 if r % 2 else 0.0)
            ball(mb, (x, y - 0.038, z), (0.016, 0.01, 0.016), lilac, sub=1)
    # the corner columns, with a ring at foot and head
    for s in (-1, 1):
        c = (s * (w / 2 - 0.02), y + 0.03, 0)
        lathe(mb, [(0.07, 0.075), (0.07, 0.12), (0.055, 0.14), (0.055, z1 - 0.04), (0.07, z1 - 0.02), (0.07, z1 + 0.04)], purple, c=c, seg=14, cap_top=False)
    # the plate with the scissors
    lbox(mb, -0.14, y - 0.05, z1 - 0.13, 0.14, y - 0.03, z1 - 0.05, gold, r=0.01)
    for sx in (-1, 1):
        ball(mb, (sx * 0.035, y - 0.054, z1 - 0.1), (0.018, 0.006, 0.018), shade('#7a54c0'), sub=1)
        tube(mb, [(sx * 0.03, y - 0.054, z1 - 0.09), (-sx * 0.04, y - 0.054, z1 - 0.065)], 0.005, shade('#7a54c0'), seg=4)


def bottles(mb, x0, x1, y0, y1, z, hh, rng, cols=('#f06aa0', '#5ac87a', '#5aa8e8', '#f2c840', '#e83a48', '#fbf6f0', '#b07ae8')):
    """Salon bottles on a shelf: round and square bottles with caps, in bright colors."""
    x = x0 + 0.04
    while x < x1 - 0.04:
        r = rng.uniform(0.028, 0.042)
        h = hh * rng.uniform(0.42, 0.66)
        c = rng.choice(cols)
        y = (y0 + y1) / 2 + rng.uniform(-0.03, 0.03)
        lathe(mb, [(r, z), (r, z + h * 0.72), (r * 0.45, z + h * 0.84), (r * 0.45, z + h * 0.9)], col_fn(c, under=0.05), c=(x, y, 0), seg=10)
        lathe(mb, [(r * 0.55, z + h * 0.9), (r * 0.55, z + h), (0.0, z + h)], shade('#fbfaf6' if c != '#fbf6f0' else '#e06aa0'), c=(x, y, 0), seg=8)
        x += r * 2 + rng.uniform(0.02, 0.045)


@item('salon_shelf', 2, 1)
def salon_shelf(P):
    shelf(P, 1.7, 0.4, 1.62, paint('#a27ce8'), rows=3, fill=bottles, back_col=paint('#f2eafc', 0.0))


@item('salon_sink', 2, 1)
def salon_sink(P):
    mb = P.main
    cabinet(P, 1.8, 0.6, 0.62, paint('#fbfaf6'), doors=4, knob='#a8a8b0', top_col=paint('#eeeae4'))
    # the basin on the left, the tap over it
    lathe(mb, [(0.0, 0.62), (0.2, 0.64), (0.25, 0.72), (0.26, 0.76), (0.24, 0.76)], paint('#fbfaf6'), c=(-0.48, -0.02, 0), seg=28, cap_top=False, sx=1.0, sy=0.8)
    lathe(P.gloss, [(0.0, 0.66), (0.2, 0.67), (0.235, 0.745)], col_fn('#a8d8ee', under=0.0), c=(-0.48, -0.02, 0), seg=28, cap_top=False, sx=1.0, sy=0.8)
    tube(mb, [(-0.48, 0.24, 0.62), (-0.48, 0.24, 0.9), (-0.48, 0.12, 0.95), (-0.48, 0.06, 0.88)], 0.018, chrome(), seg=8)
    for x in (-0.6, -0.36):
        cyl(mb, x, 0.22, 0.62, 0.68, 0.022, 0.022, chrome(), seg=8)
    # the washing chair on the right: a pink seat and a back leaning toward the basin
    pink = fabric('#e8508e')
    rbox(mb, 0.12, -0.26, 0.62, 0.84, 0.26, 0.78, pink, r=0.05, mid=2)
    rbox(mb, 0.16, 0.0, 0.76, 0.8, 0.26, 1.08, fabric('#f06aa2'), r=0.07, mid=2)
    P.top(0.62)


@item('salon_dryer', 1, 1)
def salon_dryer(P):
    mb = P.main
    lathe(mb, [(0.2, 0.0), (0.21, 0.02), (0.17, 0.04), (0.04, 0.05)], chrome('#7a7e88'), seg=24)
    cyl(mb, 0, 0, 0.04, 1.02, 0.026, 0.024, chrome(), seg=10)
    # the hood: a purple dome, darker inside its rim
    hood = lambda p, n, z0=0, z1=1: rgb('#9a70e0').lerp(rgb('#c4a6f2'), max(0.0, n.z) * 0.6) * (0.75 if n.z < -0.3 else 1.0)
    m = len(mb.v)
    lathe(mb, [(0.26, 0.0), (0.28, 0.03), (0.28, 0.08), (0.27, 0.1)], shade('#6a48b4'), seg=32, cap_top=False, cap_bot=False)
    lathe(mb, [(0.27, 0.1), (0.27, 0.18), (0.23, 0.28), (0.14, 0.35), (0.0, 0.37)], hood, seg=32, cap_top=False, cap_bot=False)
    lathe(mb, [(0.0, 0.1), (0.25, 0.01)], shade('#4a3488'), seg=32, cap_top=False)
    xform(mb, m, Matrix.Translation((0, 0.02, 1.0)) @ Euler((0.18, 0, 0)).to_matrix().to_4x4())
    lathe(mb, [(0.05, 0.98), (0.07, 1.02), (0.0, 1.04)], chrome(), seg=10)


@item('salon_sofa', 2, 1)
def salon_sofa(P):
    sofa(P, 1.82, 0.78, '#ec5a9e', cushion='#f47cb4', back=0.78, arm=0.56, feet='#c8ccd4')


@item('disp_counter', 3, 1)
def disp_counter(P):
    """Waffle's counter at the garden shop: a plank front like a potting bench, battens across it and posts at its
    corners, its lower front an open shelf with little pots of seedlings on it, the top with a lip."""
    mb, w, d, h = P.main, 2.8, 0.7, 1.0
    body, plank, dark = wood('#b47a46', 'z'), '#c08850', wood('#8a5a32')
    z0, z1 = counter_body(P, w, d, h, wood('#c88a50'), body, dark, '#5a3a22', recess=(-1.3, 1.3, 0.44, 0.17))
    y = -d / 2
    # the planks above the shelf, each its own shade, two battens across them
    rng = P.rng
    n = 14
    for k in range(n):
        x0 = -1.3 + k * 2.6 / n
        tone = rgb(plank) * rng.uniform(0.88, 1.08)
        lbox(mb, x0 + 0.006, y - 0.016, 0.44, x0 + 2.6 / n - 0.006, y + 0.01, z1, col_fn(tuple(tone), under=0.08), r=0.008)
    for zz in (0.5, z1 - 0.06):
        lbox(mb, -1.3, y - 0.034, zz - 0.025, 1.3, y - 0.012, zz + 0.025, dark, r=0.008)
    for s in (-1, 1):
        lbox(mb, s * w / 2 - 0.07, y - 0.03, 0.0, s * w / 2 + 0.01, y + 0.08, z1, dark, r=0.014)
    # the shelf and its pots of seedlings
    lbox(mb, -1.3, y + 0.0, 0.12, 1.3, y + 0.17, 0.15, dark, r=0.008)
    leaf_c = ('#5aa83a', '#7ac860', '#4a9a3a')
    for k in range(6):
        x = -1.08 + k * 0.43
        lathe(mb, [(0.0, 0.15), (0.042, 0.15), (0.054, 0.24), (0.062, 0.245), (0.062, 0.27), (0.052, 0.27)], col_fn('#c8643a', under=0.2), c=(x, y + 0.085, 0), seg=10, cap_top=False)
        lathe(mb, [(0.052, 0.262), (0.0, 0.258)], shade('#5a3a20'), c=(x, y + 0.085, 0), seg=10, cap_top=False)
        for j in range(3):
            a = j / 3 * math.tau + k
            ball(mb, (x + math.cos(a) * 0.03, y + 0.085 + math.sin(a) * 0.03, 0.3 + 0.02 * (j == 0)), (0.035, 0.022, 0.012), shade(leaf_c[(j + k) % 3]), sub=1)
        tube(mb, [(x, y + 0.085, 0.26), (x, y + 0.085, 0.3)], 0.006, shade('#4a8a2a'), seg=4)


@item('disp_lantern', 1, 1)
def disp_lantern(P):
    mb = P.main
    g = stone('#a8a6a2')
    rbox(mb, -0.2, -0.2, 0.0, 0.2, 0.2, 0.1, g, r=0.02, mid=1)
    rbox(mb, -0.13, -0.13, 0.1, 0.13, 0.13, 0.18, g, r=0.02, mid=1)
    rbox(mb, -0.07, -0.07, 0.18, 0.07, 0.07, 0.56, g, r=0.015, mid=1)
    rbox(mb, -0.18, -0.18, 0.56, 0.18, 0.18, 0.63, g, r=0.02, mid=1)
    # the firebox: four corner posts round a lit window on each side
    for x in (-0.13, 0.13):
        for y in (-0.13, 0.13):
            rbox(mb, x - 0.025, y - 0.025, 0.63, x + 0.025, y + 0.025, 0.86, g, r=0.008, mid=0)
    rbox(P.glow, -0.11, -0.11, 0.65, 0.11, 0.11, 0.84, col_fn('#ffe49a', under=0.0), r=0.01, mid=0)
    # the roof: wide, its corners turned up, a knob on top
    m = len(mb.v)
    lathe(mb, [(0.32, 0.86), (0.33, 0.9), (0.24, 0.95), (0.08, 1.04), (0.0, 1.06)], g, seg=4, cap_top=False, cap_bot=True)
    xform(mb, m, Matrix.Rotation(math.pi / 4, 4, 'Z'))
    for a in range(4):
        ang = math.pi / 4 + a * math.pi / 2
        ball(mb, (math.cos(ang) * 0.32, math.sin(ang) * 0.32, 0.92), 0.025, g, sub=1)
    lathe(mb, [(0.03, 1.04), (0.06, 1.08), (0.04, 1.13), (0.0, 1.16)], g, seg=12)


@item('disp_fountain', 2, 1)
def disp_fountain(P):
    mb = P.main
    g = stone('#bab8b4')
    # the wide basin (an oval, the footprint is twice as wide as deep) and its water
    lathe(mb, [(0.62, 0.0), (0.82, 0.06), (0.9, 0.18), (0.92, 0.28), (0.86, 0.3), (0.84, 0.22)], g, seg=48, cap_top=False, cap_bot=True, sx=1.0, sy=0.48)
    lathe(P.gloss, [(0.85, 0.22), (0.0, 0.22)], col_fn('#78c4ec', under=0.0), seg=48, cap_top=False, sx=1.0, sy=0.48)
    # the column, the little top bowl, the spout and the water falling from it
    lathe(mb, [(0.12, 0.2), (0.08, 0.3), (0.07, 0.6), (0.1, 0.66)], g, seg=16, cap_top=False)
    lathe(mb, [(0.06, 0.64), (0.26, 0.7), (0.28, 0.76), (0.25, 0.77), (0.0, 0.72)], g, seg=24, cap_top=False)
    lathe(P.gloss, [(0.25, 0.75), (0.0, 0.75)], col_fn('#8ad0f2', under=0.0), seg=24, cap_top=False)
    lathe(mb, [(0.04, 0.74), (0.035, 0.92), (0.05, 0.95), (0.0, 0.96)], g, seg=10)
    water = col_fn('#bfe6fa', under=0.0)
    ball(P.gloss, (0, 0, 0.99), (0.05, 0.05, 0.06), water, sub=2)
    for k in range(5):
        a = k / 5 * math.tau + 0.3
        tube(P.gloss, [(0, 0, 0.98), (math.cos(a) * 0.1, math.sin(a) * 0.1, 1.02), (math.cos(a) * 0.2, math.sin(a) * 0.2, 0.9), (math.cos(a) * 0.24, math.sin(a) * 0.24, 0.78)], 0.016, water, seg=6, r1=0.01)
        tube(P.gloss, [(math.cos(a) * 0.28, math.sin(a) * 0.28, 0.75), (math.cos(a) * 0.34, math.sin(a) * 0.26, 0.5), (math.cos(a) * 0.36, math.sin(a) * 0.26, 0.24)], 0.012, water, seg=6, r1=0.008)


@item('disp_gnome', 1, 1)
def disp_gnome(P):
    mb = P.main
    m0 = len(mb.v)
    for s in (-1, 1):
        ball(mb, (s * 0.06, -0.03, 0.035), (0.05, 0.075, 0.04), shade('#5a3a22'), sub=2)
    lathe(mb, [(0.0, 0.05), (0.1, 0.06), (0.12, 0.16), (0.1, 0.28), (0.06, 0.32)], fabric('#3a6ac8'), seg=20)
    rbox(mb, -0.12, -0.115, 0.13, 0.12, 0.1, 0.16, shade('#5a3a22'), r=0.01, mid=0)
    for s in (-1, 1):
        ball(mb, (s * 0.12, -0.02, 0.22), (0.035, 0.035, 0.06), fabric('#3a6ac8'), sub=2)
        ball(mb, (s * 0.12, -0.04, 0.16), 0.03, shade('#f2c4a8'), sub=1)
    ball(mb, (0, 0, 0.38), (0.085, 0.08, 0.08), shade('#f6c8ac'), sub=2)
    ball(mb, (0, -0.06, 0.3), (0.085, 0.06, 0.1), col_fn('#fbfaf6', mottle=0.05, under=0.0), sub=2)
    ball(mb, (0, -0.08, 0.37), (0.02, 0.018, 0.018), shade('#f0a090'), sub=1)
    for s in (-1, 1):
        ball(mb, (s * 0.03, -0.075, 0.395), 0.009, shade('#2a1c1e'), sub=1)
    lathe(mb, [(0.095, 0.41), (0.09, 0.45), (0.06, 0.53), (0.025, 0.6), (0.0, 0.64)], fabric('#d8303a'), seg=20)
    xform(mb, m0, Matrix.Scale(1.35, 4))


@item('disp_topiary', 1, 1)
def disp_topiary(P):
    mb = P.main
    pot(mb, 0.13, 0.17, 0.26, '#cc6e3a', rim='#bc5e2e')
    cyl(mb, 0, 0, 0.24, 0.36, 0.022, 0.02, shade('#6a4228'), seg=8)
    # a big clipped ball, then a bunny's head with its two long ears
    surf(mb, superq(0, 0, 0.52, 0.22, 0.2, 0.19, 1.0, 1.0), leafy(), nu=28, nv=16)
    cyl(mb, 0, 0, 0.68, 0.76, 0.03, 0.03, shade('#6a4228'), seg=8)
    surf(mb, superq(0, 0, 0.86, 0.13, 0.12, 0.12, 1.0, 1.0), leafy(), nu=24, nv=14)
    for s in (-1, 1):
        m = len(mb.v)
        surf(mb, superq(0, 0, 0.12, 0.045, 0.04, 0.13, 1.0, 1.0), leafy(), nu=14, nv=10)
        xform(mb, m, Matrix.Translation((s * 0.06, 0, 0.92)) @ Euler((0, s * 0.18, 0)).to_matrix().to_4x4())


@item('disp_hedge', 1, 1)
def disp_hedge(P):
    surf(P.main, superq(0, 0, 0.34, 0.38, 0.36, 0.34, 1.0, 1.0, mod=lambda u, v: 1 + 0.02 * math.sin(u * math.tau * 9) * math.sin(v * math.pi * 6)), leafy('#2e7a2e', '#4a9a3e'), nu=36, nv=20)


@item('disp_flamingo', 1, 1)
def disp_flamingo(P):
    mb = P.main
    pink = col_fn('#f27aac', under=0.05)
    for x in (-0.03, 0.03):
        tube(mb, [(x, 0.02, 0.0), (x, 0.02, 0.24), (x * 1.5, 0.03, 0.46)], 0.01, shade('#2a2224'), seg=5)
    tube(mb, [(0.03, 0.02, 0.3), (0.08, 0.04, 0.34), (0.03, 0.03, 0.38)], 0.008, shade('#2a2224'), seg=4)
    surf(mb, superq(0, 0.06, 0.54, 0.09, 0.15, 0.09, 1.0, 1.0), pink, nu=24, nv=14)
    ball(mb, (0, 0.2, 0.58), (0.05, 0.06, 0.03), pink, sub=2)
    # the neck curving up in an S, the head, the beak tipped in black
    tube(mb, [(0, -0.05, 0.6), (0, -0.1, 0.68), (0, -0.04, 0.78), (0, -0.07, 0.88), (0, -0.12, 0.92)], 0.025, pink, seg=10, r1=0.022)
    ball(mb, (0, -0.13, 0.93), (0.04, 0.05, 0.04), pink, sub=2)
    tube(mb, [(0, -0.17, 0.93), (0, -0.21, 0.91), (0, -0.22, 0.87)], 0.014, lambda p, n: rgb('#2a2224') if p.z < 0.9 else rgb('#f6e8e0'), seg=6, r1=0.006)
    for s in (-1, 1):
        ball(mb, (s * 0.032, -0.15, 0.945), 0.007, shade('#2a1c1e'), sub=1)


@item('disp_stonebench', 2, 1)
def disp_stonebench(P):
    mb = P.main
    g = stone('#b6b8c0')
    rbox(mb, -0.82, -0.22, 0.38, 0.82, 0.22, 0.48, g, r=0.025, mid=2)
    for s in (-1, 1):
        rbox(mb, s * 0.6 - 0.1, -0.17, 0.0, s * 0.6 + 0.1, 0.17, 0.39, stone('#a8aab2', s), r=0.02, mid=1)
        rbox(mb, s * 0.6 - 0.13, -0.2, 0.0, s * 0.6 + 0.13, 0.2, 0.05, g, r=0.015, mid=0)
    for x in (-0.3, 0.0, 0.3):
        ball(mb, (x, -0.222, 0.43), (0.05, 0.006, 0.018), shade('#9a9ca4'), sub=1)


@item('disp_umbrella', 2, 1)
def disp_umbrella(P):
    mb = P.main
    lathe(mb, [(0.22, 0.0), (0.23, 0.04), (0.2, 0.08), (0.05, 0.1)], stone('#8a8c94'), seg=24)
    cyl(mb, 0, 0, 0.08, 2.0, 0.025, 0.022, chrome('#b8bcc4'), seg=10)
    can = lambda p, n, z0=0, z1=1: (rgb('#e2343e') if int((math.atan2(p.y, p.x) / math.tau + 1) * 8) % 2 else rgb('#fbf8f2')) * (1 - 0.18 * max(0.0, -n.z))
    lathe(mb, [(0.92, 1.66), (0.9, 1.69), (0.6, 1.84), (0.0, 1.98)], can, seg=48, cap_top=False, cap_bot=False)
    lathe(mb, [(0.0, 1.96), (0.9, 1.665)], can, seg=48, cap_top=False)
    # the valance: a scalloped band hanging round the edge
    for k in range(16):
        a = (k + 0.5) / 16 * math.tau
        ball(mb, (math.cos(a) * 0.9, math.sin(a) * 0.9, 1.64), (0.1, 0.1, 0.05), shade('#e2343e' if k % 2 else '#fbf8f2'), sub=1)
    ball(mb, (0, 0, 2.01), 0.035, shade('#e2343e'), sub=1)


@item('disp_birdbath', 1, 1)
def disp_birdbath(P):
    mb = P.main
    g = stone('#b8b6b0')
    lathe(mb, [(0.18, 0.0), (0.18, 0.05), (0.11, 0.08), (0.07, 0.14), (0.06, 0.38), (0.08, 0.5), (0.12, 0.56)], g, seg=20, cap_top=False, cap_bot=True)
    lathe(mb, [(0.1, 0.55), (0.3, 0.6), (0.33, 0.66), (0.3, 0.68), (0.28, 0.65), (0.0, 0.62)], g, seg=28, cap_top=False)
    lathe(P.gloss, [(0.29, 0.655), (0.0, 0.655)], col_fn('#9ad4f0', under=0.0), seg=28, cap_top=False)


@item('disp_flag', 2, 1)
def disp_flag(P):
    mb = P.main
    rbox(mb, -0.58, -0.18, 0.0, -0.22, 0.18, 0.14, stone('#8a8c96'), r=0.02, mid=1)
    cyl(mb, -0.4, 0, 0.12, 2.0, 0.025, 0.02, chrome('#d0d4dc'), seg=10)
    ball(mb, (-0.4, 0, 2.03), 0.045, metal('#e8c040'), sub=2)

    def flag(u, v):
        # pale blue with a gold star in its middle
        x, y = (u - 0.5) * 1.6, (v - 0.5)
        r, a = math.hypot(x, y), math.atan2(y, x)
        R = 0.2 * (0.5 + 0.5 * (0.5 + 0.5 * math.cos(5 * (a - math.pi / 2))) ** 2)
        if r < R + 0.04:
            return rgb('#f2c840')
        return rgb('#8ad0ee').lerp(rgb('#b8e4f6'), 0.3 * v)
    sheet(mb, -0.38, 0.62, 1.42, 1.96, 0.0, flag, nx=26, nz=16, wave=0.06)


@item('dining_table', 2, 1)
def dining_table(P):
    table(P, 1.78, 0.84, 0.73, wood('#c08a52'), wood('#5a3a22', 'z'))
    checks(P.main, -0.92, -0.45, 0.92, 0.45, 0.742, 0.15, 14, '#e23a48', '#fbf8f2')
    P.top(0.742)


@item('dining_chair', 1, 1)
def dining_chair(P):
    chair(P, 0.46, 0.44, 0.48, 1.02, wood('#6a3c22', 'z'), seat_col=fabric('#d8343a'), back_style='pad', cushion='#e2443e')


@item('easel', 1, 1)
def easel(P):
    mb = P.main
    w = wood('#b47a40', 'z')
    for s in (-1, 1):
        tube(mb, [(s * 0.22, -0.12, 0.0), (s * 0.06, -0.04, 1.2), (s * 0.03, -0.03, 1.35)], 0.022, w, seg=8)
    tube(mb, [(0, 0.3, 0.0), (0, 0.0, 1.25)], 0.02, w, seg=8)
    rbox(mb, -0.3, -0.18, 0.62, 0.3, -0.06, 0.66, w, r=0.01, mid=0)
    rbox(mb, -0.05, -0.08, 1.2, 0.05, -0.02, 1.26, w, r=0.01, mid=0)

    def paint_(u, v):
        # a little landscape: sky, a sun, green hills, a path
        if math.hypot(u - 0.72, v - 0.72) < 0.11:
            return rgb('#f6d040')
        hill = 0.38 + 0.08 * math.sin(u * 5.5)
        if v < hill:
            return rgb('#5aa84a').lerp(rgb('#7ac460'), v / hill) if abs(u - 0.4 - (0.38 - v) * 0.6) > 0.05 or v > 0.3 else rgb('#e8d4a0')
        return rgb('#8ad0f2').lerp(rgb('#c4e8fa'), (1 - v) * 0.8)
    m = len(mb.v)
    rbox(mb, -0.27, -0.035, 0.0, 0.27, 0.0, 0.5, shade('#f6f2ea'), r=0.008, mid=0)
    sheet(mb, -0.25, 0.25, 0.02, 0.48, -0.04, paint_, nx=24, nz=22, back=lambda u, v: rgb('#e8e2d6'))
    xform(mb, m, Matrix.Translation((0, -0.07, 0.66)) @ Euler((-0.12, 0, 0)).to_matrix().to_4x4())


@item('arcade_stool', 1, 1)
def arcade_stool(P):
    mb = P.main
    lathe(mb, [(0.2, 0.0), (0.21, 0.02), (0.17, 0.04), (0.04, 0.05)], chrome('#7a7e88'), seg=24)
    cyl(mb, 0, 0, 0.04, 0.6, 0.028, 0.026, chrome(), seg=10)
    ring = [(math.cos(k / 24 * math.tau) * 0.15, math.sin(k / 24 * math.tau) * 0.15, 0.24) for k in range(25)]
    tube(mb, ring, 0.012, chrome(), seg=6)
    for a in (0.0, math.pi / 2, math.pi, 3 * math.pi / 2):
        tube(mb, [(0, 0, 0.24), (math.cos(a) * 0.15, math.sin(a) * 0.15, 0.24)], 0.008, chrome(), seg=4)
    lathe(mb, [(0.05, 0.58), (0.19, 0.6), (0.21, 0.63), (0.2, 0.68), (0.14, 0.7), (0.0, 0.705)], col_fn('#f05aa0', mottle=0.03, under=0.15), seg=28)
    P.top(0.7)


def snacks(mb, x0, x1, y, z, rng):
    """A row of snack packets standing in a vending machine's spiral."""
    x = x0 + 0.025
    cols = ('#e8483a', '#f2c840', '#5aaa48', '#4a7ad8', '#f08ab0', '#f2902a')
    k = 0
    while x < x1 - 0.06:
        c = cols[(k + int(z * 10)) % len(cols)]
        rbox(mb, x, y - 0.03, z, x + 0.075, y + 0.03, z + rng.uniform(0.1, 0.13), paint(c, 0.05), r=0.01, mid=0)
        tube(mb, [(x + 0.0375, y + 0.04, z + 0.01), (x + 0.0375, y - 0.04, z + 0.01)], 0.004, chrome('#a8acb4'), seg=4)
        x += 0.095
        k += 1


@item('snack_machine', 1, 1)
def snack_machine(P):
    mb = P.main
    red = paint('#d8303a')
    w, d, h = 0.78, 0.62, 1.78
    rbox(mb, -w / 2, -d / 2, 0.0, w / 2, d / 2, h, red, r=0.035, mid=2)
    # the window on the left with three rows of snacks behind it, the keypad and the coin slot on the right
    rbox(mb, -w / 2 + 0.05, -d / 2 - 0.005, 0.5, w / 2 - 0.22, -d / 2 + 0.02, h - 0.12, shade('#2a2a32'), r=0.015, mid=0)
    for k, z in enumerate((0.58, 0.9, 1.22)):
        rbox(mb, -w / 2 + 0.06, -d / 2 + 0.02, z - 0.02, w / 2 - 0.23, -d / 2 + 0.2, z, chrome('#9aa0aa'), r=0.004, mid=0)
        snacks(mb, -w / 2 + 0.06, w / 2 - 0.23, -d / 2 + 0.1, z, P.rng)
    rbox(P.clear, -w / 2 + 0.06, -d / 2 - 0.03, 0.52, w / 2 - 0.23, -d / 2 - 0.01, h - 0.14, col_fn('#e4f4fa', under=0.0), r=0.01, mid=0)
    rbox(mb, w / 2 - 0.19, -d / 2 - 0.012, 0.9, w / 2 - 0.05, -d / 2 + 0.01, 1.5, shade('#f4f0e8'), r=0.012, mid=0)
    rbox(P.gloss, w / 2 - 0.17, -d / 2 - 0.02, 1.36, w / 2 - 0.07, -d / 2, 1.46, col_fn('#5ac8e8', under=0.0), r=0.006, mid=0)
    for r_ in range(3):
        for c in range(2):
            rbox(mb, w / 2 - 0.165 + c * 0.05, -d / 2 - 0.025, 1.0 + r_ * 0.1, w / 2 - 0.13 + c * 0.05, -d / 2 - 0.005, 1.06 + r_ * 0.1, shade('#3a3a44'), r=0.006, mid=0)
    rbox(mb, w / 2 - 0.15, -d / 2 - 0.02, 0.8, w / 2 - 0.09, -d / 2, 0.86, shade('#2a2a30'), r=0.006, mid=0)
    rbox(mb, -w / 2 + 0.07, -d / 2 - 0.02, 0.16, w / 2 - 0.07, -d / 2 + 0.02, 0.34, shade('#1e1e24'), r=0.02, mid=0)
    rbox(mb, -w / 2 + 0.04, -d / 2 - 0.01, h - 0.11, w / 2 - 0.04, -d / 2 + 0.01, h - 0.03, paint('#f2ece0'), r=0.01, mid=0)
