"""Furniture, part three: Ginger's workshop and the museum's pieces, the diner's counter and stove, the farm and the mill,
the sewing table, and the lighthouse keeper's rooms (the spiral stair, desk, shelf, cot, stove, trunk, the great lens,
the hatch)."""
import math
from mathutils import Vector, Matrix, Euler, noise
from trees_ac import rgb
from kit import col_fn, shade, rbox, lathe, tube, xform, cyl
from folks import ball, surf, superq, revolve, mottle
from furn_kit import *


# ---------------------------------------------------------------- helpers for this batch
def seg_dist(px, py, ax, ay, bx, by):
    """How far a point is from a line segment (in the plane)."""
    dx, dy = bx - ax, by - ay
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / max(1e-9, dx * dx + dy * dy)))
    return math.hypot(px - (ax + dx * t), py - (ay + dy * t))


def wheel(mb, c, r, w, tire='#2a2a2e', hub='#e8c030', axis='y', hub_r=0.45):
    """A wheel turning on an axis along y (or x): a rounded tire with treads, a painted hub, a nut in the middle."""
    c = Vector(c)
    m = len(mb.v)
    tread = lambda p, n, z0=0, z1=1: rgb(tire) * (0.78 if int((math.atan2(p.y, p.x) / math.tau + 1) * 28) % 2 else 1.0)
    lathe(mb, [(r * 0.62, -w / 2), (r * 0.9, -w / 2), (r, -w * 0.32), (r, w * 0.32), (r * 0.9, w / 2), (r * 0.62, w / 2)], tread, seg=28, cap_top=False)
    for s in (-1, 1):
        lathe(mb, [(r * 0.64, s * w * 0.42), (r * hub_r, s * w * 0.46), (r * 0.18, s * w * 0.5), (0.0, s * w * 0.52)], col_fn(hub, under=0.0), seg=20, cap_top=False)
    xform(mb, m, Matrix.Translation(c) @ (Matrix.Rotation(math.pi / 2, 4, 'X') if axis == 'y' else Matrix.Rotation(math.pi / 2, 4, 'Y')))


def pumpkin(mb, c, r, col='#f08420', stem='#5a6a2a'):
    """A ribbed pumpkin with a curly stem."""
    c = Vector(c)
    base, groove = rgb(col), rgb(col) * 0.7

    def prof(v):
        a = v * math.pi
        return r * 1.15 * math.sin(a), c.z + r * 0.85 * (1 - math.cos(a))

    def rib(u, v):
        return 1 - 0.09 * (1 - abs(math.cos(u * math.tau * 4)) ** 0.5)

    def pc(p, n, u, v):
        k = abs(math.cos(u * math.tau * 4)) ** 0.4
        return groove.lerp(base, 0.4 + 0.6 * k) * (1 - 0.12 * max(0.0, -n.z))
    surf(mb, revolve(prof, cx=c.x, cy=c.y, mod=rib), pc, nu=32, nv=12)
    tube(mb, [(c.x, c.y, c.z + r * 1.6), (c.x + r * 0.08, c.y, c.z + r * 1.95), (c.x + r * 0.22, c.y + r * 0.05, c.z + r * 2.05)], r * 0.1, shade(stem), seg=6, r1=r * 0.06)


def sack(mb, c, rx, ry, h, col_f, tie='#c8a878', lean=0.0, yaw=0.0):
    """A filled sack: a soft rounded bag drawn in at a tied neck, a tuft above the tie."""
    c = Vector(c)
    m = len(mb.v)

    def mod(u, v):
        return 1.0 - 0.35 * max(0.0, (v - 0.72) / 0.28) ** 1.5
    surf(mb, superq(0, 0, h * 0.45, rx, ry, h * 0.48, 0.55, 0.7, mod=mod), col_f, nu=28, nv=22)
    lathe(mb, [(rx * 0.32, h * 0.86), (rx * 0.36, h * 0.9), (rx * 0.32, h * 0.94)], shade(tie), seg=14, cap_top=False)
    ball(mb, (0, 0, h * 0.98), (rx * 0.3, ry * 0.4, h * 0.08), col_f, sub=2)
    xform(mb, m, Matrix.Translation(c) @ Euler((lean, 0, yaw)).to_matrix().to_4x4())


def burlap(c, seed=0.0):
    a = rgb(c)

    def f(p, n, u=0, v=0):
        w = 0.9 + 0.1 * (0.5 + 0.5 * math.sin(p.x * 160) * math.sin(p.z * 160))
        return a * w * (0.94 + 0.08 * noise.noise(p * 6 + Vector((seed, 0, 0)))) * (1 - 0.15 * max(0.0, -n.z))
    return f


def straw(seed=0.0):
    def f(p, n, z0=0, z1=1):
        s = 0.5 + 0.5 * math.sin(p.x * 90 + noise.noise(p * 8 + Vector((seed, 0, 0))) * 6)
        return rgb('#e8c860').lerp(rgb('#c89a38'), 0.45 * s ** 3) * (1 - 0.18 * max(0.0, -n.z))
    return f


def jars_banded(mb, x0, x1, y, z, hh, rng, cols=('#3a6ac8', '#e8783a', '#4aa85a', '#f2f0e8')):
    """Jars along a shelf, each with a colored label round its middle and a lid."""
    x = x0 + 0.05
    while x < x1 - 0.05:
        r = rng.uniform(0.035, 0.05)
        h = hh * rng.uniform(0.4, 0.62)
        c = rng.choice(cols)
        lab = lambda p, n, z0=0, z1=1, c=c, h=h: rgb(c) if 0.28 < (p.z - z) / h < 0.72 else rgb('#e8f0f0')
        lathe(mb, [(r, z), (r, z + h * 0.26), (r, z + h * 0.3), (r, z + h * 0.7), (r, z + h * 0.74), (r, z + h)], lab, c=(x, y, 0), seg=14, cap_top=False, cap_bot=False)
        lathe(mb, [(r * 1.05, z + h), (r * 1.05, z + h + 0.02), (0.0, z + h + 0.022)], metal('#8a6a40'), c=(x, y, 0), seg=14)
        x += r * 2 + rng.uniform(0.02, 0.05)


# ---------------------------------------------------------------- Ginger's workshop
@item('blueprint_table', 2, 1)
def blueprint_table(P):
    mb = P.main
    wd = wood('#9a6434', 'z')
    for x in (-0.72, 0.72):
        for y in (-0.28, 0.28):
            tube(mb, [(x * 1.08, y * 1.15, 0.0), (x, y, 0.68)], 0.03, wd, seg=6)
    rbox(mb, -0.8, -0.32, 0.64, 0.8, 0.32, 0.7, wd, r=0.015, mid=1)
    rbox(mb, -0.74, -0.03, 0.22, 0.74, 0.03, 0.26, wd, r=0.01, mid=0)

    # the board, tipped up at the back: a blueprint, faint grid, a house drawn in white lines
    def bp(p, n, z0=0, z1=1):
        if abs(n.z) < 0.5:
            return rgb('#6a4628')
        x, y = p.x, p.y
        lines = [(-0.42, -0.2, 0.18, -0.2), (-0.42, -0.2, -0.42, 0.06), (0.18, -0.2, 0.18, 0.06), (-0.5, 0.04, -0.12, 0.24), (-0.12, 0.24, 0.26, 0.04),
                 (-0.2, -0.2, -0.2, -0.06), (-0.08, -0.2, -0.08, -0.06), (-0.2, -0.06, -0.08, -0.06), (0.0, -0.1, 0.12, -0.1), (0.0, -0.02, 0.12, -0.02),
                 (0.0, -0.1, 0.0, -0.02), (0.12, -0.1, 0.12, -0.02)]
        d = min(seg_dist(x, y, *L) for L in lines)
        if d < 0.009:
            return rgb('#f4f8ff')
        g = min(abs((x * 10) % 1 - 0.5), abs((y * 10) % 1 - 0.5))
        return rgb('#2e5ab4') * (1.15 if g > 0.47 else 1.0)
    m = len(mb.v)
    rbox(mb, -0.78, -0.3, -0.02, 0.62, 0.3, 0.02, bp, r=0.012, mid=1)
    rbox(mb, 0.64, -0.3, -0.02, 0.76, 0.3, 0.025, shade('#f2c840'), r=0.01, mid=0)
    for k in range(6):
        rbox(mb, 0.66, -0.26 + k * 0.1, 0.024, 0.69, -0.255 + k * 0.1, 0.03, shade('#3a3020'), r=0.002, mid=0)
    xform(mb, m, Matrix.Translation((0, 0.02, 0.8)) @ Euler((0.32, 0, 0)).to_matrix().to_4x4())


@item('sawhorse', 1, 1)
def sawhorse(P):
    mb = P.main
    wd = wood('#c8925a')
    rbox(mb, -0.34, -0.06, 0.5, 0.34, 0.06, 0.6, wd, r=0.015, mid=1)
    rbox(mb, -0.2, -0.1, 0.6, 0.2, 0.1, 0.7, wood('#d8a46a', seed=2), r=0.02, mid=1)
    for x in (-0.26, 0.26):
        for s in (-1, 1):
            tube(mb, [(x + s * 0.0, s * 0.03, 0.55), (x * 1.1, s * 0.26, 0.0)], 0.025, wd, seg=6)
        rbox(mb, x - 0.015, -0.17, 0.22, x + 0.015, 0.17, 0.26, wd, r=0.008, mid=0)


@item('paint_cans', 1, 1)
def paint_cans(P):
    mb = P.main

    def can(x, y, z, r, h, col):
        body = lambda p, n, z0=0, z1=1: rgb(col) if 0.18 < (p.z - z) / h < 0.82 else rgb('#b8bcc4')
        lathe(mb, [(r, z), (r, z + h * 0.16), (r, z + h * 0.2), (r, z + h * 0.8), (r, z + h * 0.84), (r, z + h), (r * 1.03, z + h + 0.008), (r * 0.98, z + h + 0.016), (0.0, z + h + 0.016)], body, c=(x, y, 0), seg=22)
        tube(mb, [(x - r * 0.9, y, z + h * 0.7), (x, y - r * 0.2, z + h + 0.12), (x + r * 0.9, y, z + h * 0.7)], 0.006, metal('#8a8e96'), seg=4)
        drip = rgb(col)
        for k in range(3):
            a = -1.9 + k * 0.5
            tube(mb, [(x + math.cos(a) * r * 1.01, y + math.sin(a) * r * 1.01, z + h), (x + math.cos(a) * r * 1.02, y + math.sin(a) * r * 1.02, z + h * (0.8 - 0.1 * k))],
                 0.012, lambda p, n: drip, seg=5)
    can(-0.12, 0.06, 0.0, 0.13, 0.26, '#3a6ad0')
    can(0.15, 0.02, 0.0, 0.13, 0.26, '#d8383a')
    can(0.02, 0.06, 0.28, 0.12, 0.22, '#f2c830')
    # a brush across the top can, its bristles wet
    tube(mb, [(0.08, 0.02, 0.52), (0.18, -0.02, 0.84)], 0.014, wood('#9a6a3a', 'z'), seg=6)
    rbox(mb, 0.035, -0.0, 0.42, 0.105, 0.045, 0.52, shade('#a8a8b0'), r=0.01, mid=0)
    ball(mb, (0.07, 0.022, 0.41), (0.04, 0.025, 0.03), shade('#f2c830'), sub=1)


# ---------------------------------------------------------------- the museum
@item('museum_bench', 2, 1)
def museum_bench(P):
    mb = P.main
    dk = wood('#3a2418')
    legs(mb, -0.82, 0.82, -0.26, 0.26, 0.2, dk, r=0.04, turned=True, inset=0.06)
    rbox(mb, -0.84, -0.28, 0.18, 0.84, 0.28, 0.27, dk, r=0.02, mid=1)
    tuft = lambda p, n, z0=0, z1=1: rgb('#8e2440') * (0.82 if min(abs((p.x * 4.5) % 1 - 0.5), abs((p.y * 6) % 1 - 0.5)) > 0.44 else 1.0) * (1 - 0.15 * max(0.0, -n.z))
    rbox(mb, -0.8, -0.25, 0.26, 0.8, 0.25, 0.44, tuft, r=0.07, mid=3)
    for i in range(7):
        for j in range(2):
            ball(mb, (-0.66 + i * 0.22, -0.08 + j * 0.16, 0.44), 0.016, shade('#5a1428'), sub=1)


@item('velvet_rope', 2, 1)
def velvet_rope(P):
    mb = P.main
    gold = metal('#e8c048')
    for x in (-0.76, 0.76):
        lathe(mb, [(0.15, 0.0), (0.15, 0.03), (0.06, 0.07), (0.03, 0.09)], gold, c=(x, 0, 0), seg=20)
        cyl(mb, x, 0, 0.08, 0.86, 0.025, 0.025, gold, seg=10)
        ball(mb, (x, 0, 0.9), 0.055, gold, sub=2)
        ball(mb, (x * 0.96, 0, 0.8), 0.03, gold, sub=1)
    pts = [(-0.73 + 1.46 * t / 12, 0, 0.8 - 0.26 * math.sin(t / 12 * math.pi)) for t in range(13)]
    tube(mb, pts, 0.03, fabric('#c42838'), seg=8)


@item('museum_desk', 3, 1)
def museum_desk(P):
    counter(P, 2.8, 0.7, 1.0, wood('#6a3e24'), wood('#4a2a18', 'z'), panels=3)
    mb, w, d, h = P.main, 2.8, 0.7, 1.0
    gold = metal('#e0b040')
    pw = (w - 0.1) / 3
    for k in range(3):
        x0, x1 = -w / 2 + 0.05 + pw * k + 0.03, -w / 2 + 0.05 + pw * (k + 1) - 0.03
        z0, z1, y = 0.14, h - 0.13, -d / 2 - 0.028
        rbox(mb, x0 + 0.06, y + 0.004, z0 + 0.06, x1 - 0.06, y + 0.02, z1 - 0.06, wood('#3a2010', 'z'), r=0.006, mid=0)
        for (a, b, c, e) in ((x0, z0, x1, z0 + 0.04), (x0, z1 - 0.04, x1, z1), (x0, z0, x0 + 0.04, z1), (x1 - 0.04, z0, x1, z1)):
            rbox(mb, a, y - 0.004, b, c, y + 0.012, e, gold, r=0.006, mid=0)
    # a guest book and a little sign on top
    rbox(mb, 0.55, -0.18, h, 0.95, 0.12, h + 0.04, shade('#fbfaf2'), r=0.008, mid=0)
    rbox(mb, 0.55, -0.18, h + 0.035, 0.95, 0.12, h + 0.045, shade('#7a2a2a'), r=0.006, mid=0)
    m = len(mb.v)
    rbox(mb, -0.14, -0.01, 0.0, 0.14, 0.01, 0.14, shade('#f6f0de'), r=0.006, mid=0)
    xform(mb, m, Matrix.Translation((1.05, 0.05, h)) @ Euler((-0.3, 0, 0)).to_matrix().to_4x4())
    P.top(h)


# ---------------------------------------------------------------- the diner's kitchen
@item('counter_diner', 3, 1)
def counter_diner(P):
    counter(P, 2.8, 0.7, 1.0, paint('#f8f6f0', 0.02), paint('#8ed8c0'), panels=7, trim=metal('#c8ccd4'), kick='#b8bcc4')
    rbox(P.gloss, -1.41, -0.39, 0.0, 1.41, -0.33, 0.1, metal('#d8dce4'), r=0.012, mid=1)
    P.top(1.0)


@item('stove_pro', 2, 1)
def stove_pro(P):
    mb = P.main
    steel = metal('#c4c8d0')
    rbox(mb, -0.86, -0.32, 0.0, 0.86, 0.32, 0.9, steel, r=0.025, mid=2)
    rbox(mb, -0.86, 0.22, 0.88, 0.86, 0.32, 1.12, steel, r=0.02, mid=1)
    rbox(mb, -0.87, -0.33, 0.86, 0.87, 0.3, 0.92, metal('#2a2a30'), r=0.015, mid=1)
    # the knob strip, two oven doors with windows and long handles
    rbox(mb, -0.84, -0.345, 0.72, 0.84, -0.31, 0.84, metal('#d4d8e0'), r=0.01, mid=0)
    for k in range(6):
        cyl(mb, -0.7 + k * 0.28, -0.35, 0.78, 0.78, 0.03, 0.03, shade('#d8282a'), seg=10)
        m = len(mb.v)
        lathe(mb, [(0.03, 0.0), (0.03, 0.025), (0.0, 0.03)], shade('#d8282a'), seg=10)
        xform(mb, m, Matrix.Translation((-0.7 + k * 0.28, -0.345, 0.78)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    for x in (-0.42, 0.42):
        rbox(mb, x - 0.38, -0.34, 0.1, x + 0.38, -0.31, 0.66, metal('#d0d4dc'), r=0.015, mid=1)
        rbox(P.gloss, x - 0.26, -0.35, 0.22, x + 0.26, -0.33, 0.5, metal('#3a3e48'), r=0.012, mid=0)
        tube(mb, [(x - 0.28, -0.37, 0.6), (x - 0.28, -0.4, 0.61), (x + 0.28, -0.4, 0.61), (x + 0.28, -0.37, 0.6)], 0.012, metal('#e8eaf0'), seg=6)
    # grates; a stock pot on the left, a pan with an egg on the right
    for x in (-0.5, -0.15, 0.2, 0.55):
        lathe(mb, [(0.1, 0.92), (0.1, 0.935), (0.0, 0.935)], metal('#1a1a1e'), c=(x, -0.05, 0), seg=14)
    lathe(mb, [(0.0, 0.94), (0.16, 0.94), (0.17, 1.2), (0.18, 1.21), (0.17, 1.22)], metal('#b8bcc8'), c=(-0.45, -0.02, 0), seg=24, cap_top=False)
    lathe(mb, [(0.172, 1.22), (0.12, 1.25), (0.02, 1.27), (0.0, 1.3)], metal('#a8acb8'), c=(-0.45, -0.02, 0), seg=24)
    for s in (-1, 1):
        rbox(mb, -0.45 + s * 0.2 - 0.025, -0.04, 1.12, -0.45 + s * 0.2 + 0.025, 0.0, 1.16, metal('#5a5e66'), r=0.01, mid=0)
    lathe(mb, [(0.0, 0.94), (0.14, 0.945), (0.15, 0.99)], metal('#3a3a40'), c=(0.4, -0.04, 0), seg=22, cap_top=False)
    lathe(mb, [(0.14, 0.95), (0.0, 0.95)], metal('#2a2a2e'), c=(0.4, -0.04, 0), seg=22, cap_top=False)
    tube(mb, [(0.54, -0.04, 0.98), (0.8, -0.04, 1.0)], 0.014, metal('#2a2a2e'), seg=6)
    ball(mb, (0.38, -0.05, 0.955), (0.08, 0.07, 0.012), shade('#fbfaf4'), sub=2)
    ball(mb, (0.39, -0.05, 0.965), (0.03, 0.03, 0.014), shade('#f6b820'), sub=2)


# ---------------------------------------------------------------- the farm
@item('tractor', 3, 2)
def tractor(P):
    mb = P.main
    green = paint('#3a9a3e')
    # (side on, its nose to the left as in the picture)
    rbox(mb, -1.0, -0.22, 0.32, 0.7, 0.22, 0.48, metal('#3a3a40'), r=0.03, mid=1)
    rbox(mb, -1.32, -0.3, 0.42, -0.12, 0.3, 0.98, green, r=0.09, mid=2)
    rbox(mb, -1.36, -0.24, 0.48, -1.3, 0.24, 0.9, metal('#2a2a2e'), r=0.02, mid=1)
    for k in range(5):
        rbox(mb, -1.37, -0.2, 0.54 + k * 0.07, -1.35, 0.2, 0.56 + k * 0.07, metal('#6a6e76'), r=0.005, mid=0)
    for s in (-1, 1):
        ball(P.glow, (-1.33, s * 0.2, 0.92), (0.03, 0.05, 0.04), '#fff4c0', sub=1)
        rbox(mb, -1.0, s * 0.3 - 0.01, 0.6, -0.4, s * 0.3 + 0.01, 0.8, paint('#2e8432'), r=0.008, mid=0)
    cyl(mb, -0.75, 0.0, 0.98, 1.62, 0.045, 0.04, metal('#2a2a2e'), seg=10)
    lathe(mb, [(0.06, 1.6), (0.07, 1.66), (0.0, 1.67)], metal('#1a1a1e'), c=(-0.75, 0, 0), seg=10)
    # the seat and its back, the wheel on its column, fenders over the big wheels
    rbox(mb, -0.1, -0.3, 0.46, 0.75, 0.3, 0.72, green, r=0.05, mid=1)
    rbox(mb, 0.25, -0.22, 0.72, 0.62, 0.22, 0.82, fabric('#7a4a2a'), r=0.04, mid=1)
    rbox(mb, 0.55, -0.22, 0.8, 0.65, 0.22, 1.1, fabric('#7a4a2a'), r=0.04, mid=1)
    tube(mb, [(-0.05, 0.0, 0.72), (0.12, 0.0, 1.1)], 0.025, metal('#2a2a2e'), seg=6)
    m = len(mb.v)
    tube(mb, [(math.cos(t / 20 * math.tau) * 0.14, math.sin(t / 20 * math.tau) * 0.14, 0) for t in range(21)], 0.018, metal('#2a2a2e'), seg=6)
    xform(mb, m, Matrix.Translation((0.13, 0.0, 1.12)) @ Euler((0, -0.9, 0)).to_matrix().to_4x4())
    for s in (-1, 1):
        # the fender: a curved strip over the big wheel, each piece turned along the curve
        n = 14
        for i in range(n):
            a = (i + 0.5) / n * math.pi
            m = len(mb.v)
            rbox(mb, -0.15, -0.17, -0.025, 0.15, 0.17, 0.025, green, r=0.012, mid=0)
            xform(mb, m, Matrix.Translation((0.48 + math.cos(a) * 0.64, s * 0.66, 0.55 + math.sin(a) * 0.64)) @ Matrix.Rotation(-(a - math.pi / 2), 4, 'Y'))
        wheel(mb, (0.48, s * 0.66, 0.55), 0.55, 0.3, hub='#f0c830')
        wheel(mb, (-1.0, s * 0.48, 0.28), 0.28, 0.18, hub='#f0c830')


@item('hay_stack', 2, 1)
def hay_stack(P):
    mb = P.main

    def bale(x, y, z, yaw, seed):
        m = len(mb.v)
        rbox(mb, -0.4, -0.25, 0.0, 0.4, 0.25, 0.4, straw(seed), r=0.05, mid=1)
        for bx in (-0.2, 0.2):
            rbox(mb, bx - 0.012, -0.257, -0.005, bx + 0.012, 0.257, 0.407, shade('#a87a3a'), r=0.006, mid=0)
        xform(mb, m, Matrix.Translation((x, y, z)) @ Matrix.Rotation(yaw, 4, 'Z'))
    bale(-0.42, 0.02, 0.0, 0.03, 1)
    bale(0.42, 0.0, 0.0, -0.04, 2)
    bale(0.02, 0.04, 0.4, 0.06, 3)
    rng = P.rng
    for k in range(14):
        x, y = rng.uniform(-0.8, 0.8), rng.uniform(-0.26, 0.26)
        z = 0.8 if abs(x) < 0.38 else 0.4
        tube(mb, [(x, y, z - 0.02), (x + rng.uniform(-0.06, 0.06), y + rng.uniform(-0.04, 0.04), z + rng.uniform(0.03, 0.08))], 0.005, shade('#e8c860'), seg=3)


@item('hay_pile', 2, 1)
def hay_pile(P):
    mb = P.main

    def mod(u, v):
        return 1 + 0.08 * noise.noise(Vector((math.cos(u * math.tau) * 2, math.sin(u * math.tau) * 2, v * 3)))
    surf(mb, superq(0, 0, 0.0, 0.82, 0.4, 0.4, 1.0, 1.0, mod=mod), lambda p, n, u=0, v=0: straw(0.5)(p, n), nu=40, nv=18, caps=(False, True))
    rng = P.rng
    for k in range(40):
        a = rng.uniform(0, math.tau)
        rr = math.sqrt(rng.random())
        x, y = math.cos(a) * rr * 0.75, math.sin(a) * rr * 0.36
        z = 0.38 * math.sqrt(max(0.0, 1 - rr * rr)) + 0.01
        d = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(0.2, 0.8))).normalized() * rng.uniform(0.06, 0.12)
        tube(mb, [(x, y, z - 0.02), (x + d.x, y + d.y, z + d.z)], 0.005, shade('#ecd070' if k % 2 else '#d4aa48'), seg=3)


@item('feed_sacks', 2, 1)
def feed_sacks(P):
    mb = P.main
    for (x, y, z, lean, yaw, s) in ((0.0, 0.18, 0.08, -0.12, 0.1, 2), (-0.4, -0.08, 0.0, 0.05, -0.2, 0), (0.4, -0.1, 0.0, 0.06, 0.25, 1)):
        m = len(mb.v)
        sack(mb, (0, 0, 0), 0.3, 0.22, 0.62, burlap('#b89a68', s))
        rbox(mb, -0.2, -0.235, 0.22, 0.2, -0.18, 0.36, shade('#4a9a44'), r=0.02, mid=0)
        xform(mb, m, Matrix.Translation((x, y, z)) @ Euler((lean, 0, yaw)).to_matrix().to_4x4())


@item('milk_can', 1, 1)
def milk_can(P):
    mb = P.main
    band = lambda p, n, z0=0, z1=1: rgb('#9aa0aa') if 0.045 < p.z < 0.085 or 0.385 < p.z < 0.42 else rgb('#d4d8e0')
    lathe(mb, [(0.0, 0.0), (0.16, 0.0), (0.17, 0.02), (0.17, 0.04), (0.172, 0.05), (0.172, 0.08), (0.17, 0.09), (0.17, 0.38), (0.172, 0.39), (0.172, 0.415), (0.17, 0.425),
               (0.17, 0.44), (0.15, 0.5), (0.09, 0.58), (0.085, 0.64), (0.1, 0.65), (0.1, 0.68), (0.06, 0.7), (0.0, 0.72)], band, seg=28)
    for s in (-1, 1):
        tube(mb, [(s * 0.13, 0, 0.5), (s * 0.2, 0, 0.56), (s * 0.13, 0, 0.6)], 0.012, metal('#a8acb4'), seg=5)


@item('wheelbarrow', 2, 1)
def wheelbarrow(P):
    mb = P.main
    red = paint('#d8382e')
    # the tray, deeper at the back, pumpkins heaped in it; the wheel at the front, handles behind
    rbox(mb, -0.5, -0.3, 0.26, 0.4, 0.3, 0.58, red, r=0.06, mid=2)
    m = len(mb.v)
    rbox(mb, 0.3, -0.28, 0.0, 0.42, 0.28, 0.24, red, r=0.05, mid=1)
    xform(mb, m, Matrix.Translation((0.08, 0, 0.32)) @ Euler((0, 0.6, 0)).to_matrix().to_4x4())
    rbox(mb, -0.47, -0.27, 0.56, 0.37, 0.27, 0.59, shade('#5a3020'), r=0.02, mid=0)
    pumpkin(mb, (-0.22, -0.08, 0.5), 0.15)
    pumpkin(mb, (0.1, 0.06, 0.52), 0.14)
    pumpkin(mb, (-0.12, 0.14, 0.52), 0.12)
    pumpkin(mb, (0.06, -0.12, 0.66), 0.11)
    wheel(mb, (0.68, 0.0, 0.17), 0.17, 0.09, hub='#a8a8b0')
    for s in (-1, 1):
        tube(mb, [(0.68, s * 0.06, 0.17), (0.3, s * 0.22, 0.3), (-0.5, s * 0.26, 0.42), (-0.88, s * 0.28, 0.5)], 0.022, metal('#3a3a40'), seg=6)
        cyl(mb, -0.92, s * 0.28, 0.48, 0.48, 0.03, 0.03, shade('#2a2a2e'), seg=8)
        tube(mb, [(-0.85, s * 0.28, 0.48), (-0.95, s * 0.28, 0.52)], 0.032, fabric('#2a2a2e'), seg=8)
        tube(mb, [(-0.35, s * 0.24, 0.3), (-0.4, s * 0.24, 0.0)], 0.018, metal('#3a3a40'), seg=5)


@item('pumpkin_pile', 1, 1)
def pumpkin_pile(P):
    mb = P.main
    pumpkin(mb, (-0.16, 0.0, 0.0), 0.17)
    pumpkin(mb, (0.17, -0.04, 0.0), 0.16, col='#f29a2a')
    pumpkin(mb, (0.0, 0.12, 0.0), 0.14, col='#e87818')
    pumpkin(mb, (0.0, 0.02, 0.24), 0.14)


@item('millstone', 2, 2)
def millstone(P):
    mb = P.main
    stave = lambda p, n, z0=0, z1=1: rgb('#a87444') * (0.82 if abs(math.sin(math.atan2(p.y, p.x) * 18)) < 0.12 else 1.0) * (0.95 + 0.06 * noise.noise(p * 8))
    lathe(mb, [(0.72, 0.0), (0.76, 0.27), (0.72, 0.56)], stave, seg=48, cap_top=True)
    for z in (0.1, 0.44):
        lathe(mb, [(0.75, z - 0.025), (0.765, z), (0.75, z + 0.025)], metal('#3a3a40'), seg=48, cap_top=False)
    stone = lambda p, n, z0=0, z1=1: rgb('#9a9ca2') * (0.88 + 0.16 * (0.5 + 0.5 * noise.noise(p * 6))) * (0.85 if n.z > 0.6 and abs(math.sin(math.atan2(p.y, p.x) * 8)) < 0.08 else 1.0)
    lathe(mb, [(0.0, 0.56), (0.74, 0.56), (0.78, 0.6), (0.78, 0.74), (0.74, 0.78), (0.12, 0.8), (0.1, 0.78)], stone, seg=48, cap_top=False)
    post = wood('#5a3820', 'z')
    cyl(mb, 0, 0, 0.7, 1.6, 0.085, 0.08, post, seg=12)
    for z in (0.95, 1.25, 1.52):
        lathe(mb, [(0.09, z - 0.03), (0.1, z), (0.09, z + 0.03)], metal('#2a2a2e'), seg=14, cap_top=False)
    lathe(mb, [(0.08, 1.6), (0.05, 1.64), (0.0, 1.65)], post, seg=12)
    rbox(mb, -0.6, -0.04, 0.82, 0.0, 0.04, 0.9, post, r=0.02, mid=1)


@item('grain_hopper', 1, 1)
def grain_hopper(P):
    mb = P.main
    wd = wood('#c89a5a', 'z')
    for x in (-0.2, 0.2):
        for y in (-0.18, 0.18):
            rbox(mb, x - 0.025, y - 0.025, 0.0, x + 0.025, y + 0.025, 0.92, wd, r=0.01, mid=1)
    for z in (0.25, 0.72):
        rbox(mb, -0.22, -0.2, z - 0.025, 0.22, 0.2, z + 0.025, wd, r=0.01, mid=0)
    m = len(mb.v)
    lathe(mb, [(0.05, 0.62), (0.33, 1.08), (0.34, 1.12), (0.31, 1.12)], wood('#d8a868', 'z'), seg=4, cap_top=False, cap_bot=True)
    lathe(mb, [(0.31, 1.1), (0.0, 1.13)], shade('#f0d070'), seg=4, cap_top=False)
    xform(mb, m, Matrix.Rotation(math.pi / 4, 4, 'Z'))
    rbox(mb, -0.04, -0.04, 0.45, 0.04, 0.04, 0.64, wd, r=0.01, mid=0)
    rbox(mb, -0.15, -0.12, 0.0, 0.15, 0.12, 0.24, fabric('#f4f0e6'), r=0.04, mid=1)
    ball(mb, (0, 0, 0.24), (0.12, 0.09, 0.03), shade('#f0d070'), sub=2)


@item('flour_sacks', 2, 1)
def flour_sacks(P):
    mb = P.main

    def flour(p, n, u=0, v=0):
        c = rgb('#4a7ad0') if abs(p.z - 0.17) < 0.035 or abs(p.z - 0.47) < 0.035 else rgb('#f6f4ec')
        return c * (0.95 + 0.05 * noise.noise(p * 6)) * (1 - 0.12 * max(0.0, -n.z))
    for (x, y, z, lean, yaw) in ((-0.38, -0.04, 0.0, 0.04, -0.15), (0.38, -0.02, 0.0, 0.05, 0.2), (0.0, 0.12, 0.44, -0.1, 0.05)):
        m = len(mb.v)
        sack(mb, (0, 0, 0), 0.3, 0.22, 0.62, flour, tie='#d8c8a0')
        # the wheat stamped on the front
        rbox(mb, -0.012, -0.236, 0.26, 0.012, -0.22, 0.4, shade('#e0b030'), r=0.006, mid=0)
        for k in range(3):
            for s in (-1, 1):
                ball(mb, (s * 0.03, -0.232, 0.31 + k * 0.03), (0.02, 0.008, 0.012), shade('#e0b030'), sub=1)
        xform(mb, m, Matrix.Translation((x, y, z)) @ Euler((lean, 0, yaw)).to_matrix().to_4x4())


@item('sack_cart', 1, 1)
def sack_cart(P):
    mb = P.main
    frame = metal('#3a3a42')
    m = len(mb.v)
    for s in (-1, 1):
        tube(mb, [(s * 0.17, 0.0, 0.04), (s * 0.17, 0.0, 1.0)], 0.02, frame, seg=6)
    tube(mb, [(-0.17, 0.0, 1.0), (-0.12, 0.0, 1.1), (0.12, 0.0, 1.1), (0.17, 0.0, 1.0)], 0.022, frame, seg=6)
    for z in (0.35, 0.7):
        tube(mb, [(-0.17, 0.0, z), (0.17, 0.0, z)], 0.012, frame, seg=5)
    rbox(mb, -0.2, -0.22, 0.02, 0.2, 0.02, 0.05, frame, r=0.01, mid=0)
    sack(mb, (0, -0.1, 0.05), 0.17, 0.1, 0.5, lambda p, n, u=0, v=0: (rgb('#4a7ad0') if abs(p.z - 0.25) < 0.035 else rgb('#f4f2ea')) * (1 - 0.12 * max(0.0, -n.z)), tie='#d8c8a0')
    xform(mb, m, Matrix.Translation((0, 0.05, 0)) @ Euler((-0.12, 0, 0)).to_matrix().to_4x4())
    for s in (-1, 1):
        wheel(mb, (s * 0.24, 0.1, 0.1), 0.1, 0.06, hub='#a8a8b0', axis='x')


@item('flour_bin', 1, 1)
def flour_bin(P):
    mb = P.main
    stave = lambda p, n, z0=0, z1=1: rgb('#b8844a') * (0.84 if abs(math.sin(math.atan2(p.y, p.x) * 10)) < 0.1 else 1.0) * (0.95 + 0.06 * noise.noise(p * 9))
    lathe(mb, [(0.2, 0.0), (0.23, 0.28), (0.21, 0.54)], stave, seg=28, cap_top=True, cap_bot=True)
    for z in (0.08, 0.46):
        lathe(mb, [(0.215 + (0.01 if z < 0.2 else 0.0), z - 0.02), (0.235, z), (0.215, z + 0.02)], metal('#4a4a50'), seg=28, cap_top=False)
    ball(mb, (0, 0, 0.53), (0.19, 0.19, 0.09), col_fn('#fbfaf6', mottle=0.03, under=0.0), sub=3)
    tube(mb, [(0.04, 0.0, 0.58), (0.14, 0.02, 0.74)], 0.012, metal('#b8bcc4'), seg=5)
    m = len(mb.v)
    lathe(mb, [(0.0, -0.05), (0.04, -0.05), (0.045, 0.0)], metal('#c8ccd4'), seg=12, cap_top=False)
    xform(mb, m, Matrix.Translation((0.03, -0.01, 0.6)) @ Euler((0.3, -0.6, 0)).to_matrix().to_4x4())


@item('sewing_table', 2, 1)
def sewing_table(P):
    table(P, 1.7, 0.64, 0.72, wood('#c08a52'), wood('#9a6434', 'z'))
    mb, h = P.main, 0.72
    # purple cloth under the needle, the white machine: its base, pillar, arm and head, the wheel
    rbox(mb, -0.42, -0.24, h, 0.12, 0.12, h + 0.01, fabric('#9a5ac8'), r=0.008, mid=1)
    white = paint('#f4f0e8', 0.05)
    rbox(mb, -0.3, -0.12, h + 0.01, 0.34, 0.12, h + 0.07, white, r=0.025, mid=1)
    rbox(mb, 0.16, -0.08, h + 0.06, 0.32, 0.08, h + 0.32, white, r=0.04, mid=1)
    rbox(mb, -0.28, -0.08, h + 0.24, 0.32, 0.08, h + 0.36, white, r=0.05, mid=1)
    rbox(mb, -0.3, -0.07, h + 0.12, -0.18, 0.07, h + 0.34, white, r=0.03, mid=1)
    cyl(mb, -0.24, -0.02, h + 0.06, h + 0.13, 0.006, 0.006, metal('#a8acb4'), seg=4)
    rbox(mb, -0.12, -0.085, h + 0.27, 0.12, -0.075, h + 0.33, shade('#e87aa0'), r=0.008, mid=0)
    m = len(mb.v)
    lathe(mb, [(0.0, -0.02), (0.07, -0.02), (0.075, 0.0), (0.07, 0.02), (0.0, 0.02)], metal('#c8ccd4'), seg=16)
    xform(mb, m, Matrix.Translation((0.34, 0.0, h + 0.26)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
    cyl(mb, 0.0, 0.0, h + 0.36, h + 0.42, 0.012, 0.012, metal('#a8acb4'), seg=6)
    lathe(mb, [(0.03, h + 0.4), (0.03, h + 0.45), (0.0, h + 0.45)], shade('#e8c050'), seg=12)


# ---------------------------------------------------------------- the lighthouse keeper's rooms
@item('lh_stairs', 2, 2)
def lh_stairs(P):
    mb = P.main
    iron = metal('#2a2a30')
    lathe(mb, [(0.5, 0.0), (0.5, 0.05), (0.42, 0.08), (0.0, 0.08)], iron, seg=32)
    cyl(mb, 0, 0, 0.05, 2.25, 0.07, 0.07, iron, seg=14)
    step = metal('#8a9098')
    n = 11
    for k in range(n):
        a = k / n * math.tau * 1.25 - 0.6
        z = 0.24 + k * 0.18
        m = len(mb.v)
        rbox(mb, 0.05, -0.1, -0.02, 0.72, 0.1, 0.02, step, r=0.012, mid=1)
        rbox(mb, 0.62, -0.11, -0.025, 0.74, 0.11, 0.025, step, r=0.012, mid=0)
        xform(mb, m, Matrix.Translation((0, 0, z)) @ Matrix.Rotation(a, 4, 'Z'))
        tube(mb, [(math.cos(a) * 0.72, math.sin(a) * 0.72, z), (math.cos(a) * 0.72, math.sin(a) * 0.72, z + 0.7)], 0.01, iron, seg=4)
    pts = [(math.cos(k / n * math.tau * 1.25 - 0.6) * 0.72, math.sin(k / n * math.tau * 1.25 - 0.6) * 0.72, 0.24 + k * 0.18 + 0.7) for k in range(n)]
    tube(mb, pts, 0.018, iron, seg=6)
    rbox(mb, -0.75, -0.06, 2.22, 0.75, 0.06, 2.3, iron, r=0.02, mid=1)


@item('lh_desk', 2, 1)
def lh_desk(P):
    table(P, 1.6, 0.62, 0.74, wood('#7a4a28'), wood('#5a3420', 'z'))
    mb, h = P.main, 0.74
    rbox(mb, -0.3, -0.32, h - 0.17, 0.3, -0.28, h - 0.07, wood('#8a5632'), r=0.012, mid=1)
    ball(mb, (0, -0.335, h - 0.12), 0.018, metal('#e0b048'), sub=1)
    # two blue books and a brass lantern
    for k, c in enumerate(('#2e4a9a', '#3a5ab0')):
        rbox(mb, -0.6 + k * 0.17, -0.06, h, -0.46 + k * 0.17, 0.16, h + 0.26 - k * 0.03, paint(c, 0.05), r=0.01, mid=0)
    brass = metal('#d8a838')
    lathe(mb, [(0.1, h), (0.1, h + 0.04), (0.06, h + 0.06)], brass, c=(0.45, 0.02, 0), seg=16)
    for a in range(4):
        x, y = 0.45 + math.cos(a * math.pi / 2 + 0.78) * 0.07, 0.02 + math.sin(a * math.pi / 2 + 0.78) * 0.07
        cyl(mb, x, y, h + 0.05, h + 0.24, 0.008, 0.008, brass, seg=4)
    lathe(P.clear, [(0.065, h + 0.06), (0.065, h + 0.23)], col_fn('#f2ead0', under=0.0), c=(0.45, 0.02, 0), seg=16, cap_top=False)
    ball(P.glow, (0.45, 0.02, h + 0.14), (0.025, 0.025, 0.04), '#ffd070', sub=2)
    lathe(mb, [(0.09, h + 0.23), (0.05, h + 0.29), (0.0, h + 0.31)], brass, c=(0.45, 0.02, 0), seg=16)
    tube(mb, [(0.41, 0.02, h + 0.31), (0.45, 0.02, h + 0.36), (0.49, 0.02, h + 0.31)], 0.007, brass, seg=4)


@item('lh_shelf', 2, 1)
def lh_shelf(P):
    shelf(P, 1.7, 0.42, 1.36, wood('#5a3420', 'z'), rows=2, fill=None)
    mb, rng = P.main, P.rng
    hh = (1.36 - 0.08) / 2
    z1, z0 = 0.04 + hh, 0.04
    # the top shelf: a ship in a bottle, a woven plate standing; the bottom: jars and a small crate
    m = len(P.clear.v)
    lathe(P.clear, [(0.0, -0.24), (0.1, -0.22), (0.11, -0.1), (0.11, 0.12), (0.05, 0.18), (0.035, 0.26), (0.0, 0.27)], col_fn('#d8eef0', under=0.0), seg=18)
    xform(P.clear, m, Matrix.Translation((-0.35, 0.0, z1 + 0.11)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
    rbox(mb, -0.52, -0.04, z1 + 0.04, -0.2, 0.04, z1 + 0.08, wood('#7a4a28'), r=0.015, mid=0)
    tube(mb, [(-0.38, 0.0, z1 + 0.08), (-0.38, 0.0, z1 + 0.18)], 0.005, wood('#6a4020', 'z'), seg=4)
    rbox(mb, -0.37, -0.004, z1 + 0.1, -0.29, 0.004, z1 + 0.17, shade('#fbfaf2'), r=0.003, mid=0)
    cyl(mb, -0.6, 0.0, z1 + 0.11, z1 + 0.11, 0.02, 0.02, wood('#c8a060'), seg=6)
    m = len(mb.v)
    lathe(mb, [(0.0, -0.012), (0.17, -0.01), (0.19, 0.012), (0.0, 0.0)], lambda p, n, z0=0, z1=1: rgb('#d8b070') * (0.85 + 0.2 * (0.5 + 0.5 * math.sin(math.hypot(p.x, p.y) * 160))), seg=24)
    xform(mb, m, Matrix.Translation((0.35, 0.08, z1 + 0.2)) @ Euler((math.pi / 2 - 0.15, 0, 0)).to_matrix().to_4x4())
    jars_banded(mb, -0.75, 0.15, 0.0, z0, hh, rng)
    rbox(mb, 0.3, -0.12, z0, 0.7, 0.14, z0 + 0.16, wood('#a87a48'), r=0.012, mid=0)
    rbox(mb, 0.36, -0.125, z0 + 0.04, 0.64, -0.12, z0 + 0.12, shade('#3a5aa8'), r=0.004, mid=0)


@item('lh_cot', 2, 1)
def lh_cot(P):
    # a narrow bed lying along the width, its head to the left as in the picture
    mb = P.main
    fr = wood('#7a5032')
    legs(mb, -0.86, 0.86, -0.36, 0.36, 0.08, fr, r=0.035, inset=0.04)
    rbox(mb, -0.86, -0.36, 0.06, 0.86, 0.36, 0.26, fr, r=0.025, mid=1)
    rbox(mb, -0.9, -0.38, 0.0, -0.82, 0.38, 0.62, fr, r=0.03, mid=1)
    rbox(mb, 0.82, -0.38, 0.0, 0.9, 0.38, 0.42, fr, r=0.03, mid=1)
    rbox(mb, -0.82, -0.32, 0.24, 0.82, 0.32, 0.38, fabric('#f4f0e6'), r=0.04, mid=1)
    rbox(mb, -0.42, -0.35, 0.2, 0.83, 0.35, 0.42, fabric('#3a5aa8'), r=0.05, mid=2)
    rbox(mb, -0.5, -0.34, 0.37, -0.36, 0.34, 0.43, fabric('#f4f0e6'), r=0.025, mid=1)
    ball(mb, (-0.64, 0.0, 0.45), (0.15, 0.24, 0.07), fabric('#fbf8f2'), sub=3)


@item('lh_stove', 1, 1)
def lh_stove(P):
    mb = P.main
    iron = metal('#2a2a30')
    for k in range(4):
        a = k / 4 * math.tau + 0.78
        tube(mb, [(math.cos(a) * 0.14, math.sin(a) * 0.14, 0.12), (math.cos(a) * 0.19, math.sin(a) * 0.19, 0.0)], 0.022, iron, seg=5)
    lathe(mb, [(0.0, 0.1), (0.17, 0.1), (0.2, 0.14), (0.25, 0.32), (0.24, 0.46), (0.17, 0.58), (0.2, 0.6), (0.2, 0.64), (0.07, 0.66)], iron, seg=28)
    for z in (0.14, 0.6):
        lathe(mb, [(0.2, z - 0.015), (0.215, z), (0.2, z + 0.015)], metal('#4a4a52'), seg=28, cap_top=False)
    cyl(mb, 0, 0, 0.64, 1.8, 0.055, 0.055, iron, seg=12)
    rbox(mb, -0.12, -0.255, 0.22, 0.12, -0.2, 0.44, metal('#3a3a42'), r=0.02, mid=1)
    for k in range(4):
        rbox(P.glow, -0.085 + k * 0.05, -0.262, 0.26, -0.065 + k * 0.05, -0.25, 0.4, '#ff9a3a', r=0.004, mid=0)
    ball(mb, (0.1, -0.27, 0.33), 0.015, metal('#c8a048'), sub=1)


@item('lh_trunk', 1, 1)
def lh_trunk(P):
    mb = P.main
    rbox(mb, -0.28, -0.2, 0.0, 0.28, 0.2, 0.3, wood('#7a5030'), r=0.02, mid=1)
    surf(mb, superq(0, 0, 0.3, 0.28, 0.2, 0.12, 0.3, 1.0), lambda p, n, u=0, v=0: wood('#8a5a34')(p, n), nu=24, nv=12, caps=(False, True))
    brass = metal('#d8a840')
    for x in (-0.16, 0.16):
        rbox(mb, x - 0.025, -0.21, 0.0, x + 0.025, 0.21, 0.31, brass, r=0.008, mid=0)
        pts = [(x, -0.205 * math.cos(a), 0.3 + 0.122 * math.sin(a)) for a in [k / 8 * math.pi for k in range(9)]]
        tube(mb, pts, 0.014, brass, seg=4)
    rbox(mb, -0.05, -0.215, 0.2, 0.05, -0.2, 0.32, brass, r=0.01, mid=0)
    ball(mb, (0, -0.22, 0.25), 0.012, shade('#2a2a2e'), sub=1)


@item('lh_lens', 2, 2)
def lh_lens(P):
    mb = P.main
    iron = metal('#26262c')
    brass = metal('#c8a048')
    lathe(mb, [(0.58, 0.0), (0.58, 0.08), (0.42, 0.14), (0.24, 0.18), (0.24, 0.62), (0.4, 0.66), (0.4, 0.72), (0.0, 0.72)], iron, seg=36)
    # the lens: stacked rings of glass in brass bands, the middle ring clear so its light shows
    prof = [(0.36, 0.72), (0.44, 0.9), (0.5, 1.1), (0.52, 1.3), (0.5, 1.5), (0.44, 1.7), (0.34, 1.88)]
    for k in range(len(prof) - 1):
        (r0, z0), (r1, z1) = prof[k], prof[k + 1]
        part = P.clear if k in (2, 3) else P.gloss
        col = col_fn('#e8f6fc', under=0.0) if k in (2, 3) else col_fn('#b8dcf0' if k % 2 else '#d8eef8', under=0.0)
        lathe(part, [(r0 - 0.005, z0), ((r0 + r1) / 2 + 0.02, (z0 + z1) / 2), (r1 - 0.005, z1)], col, seg=36, cap_top=False)
        lathe(mb, [(r1 - 0.01, z1 - 0.012), (r1 + 0.012, z1), (r1 - 0.01, z1 + 0.012)], brass, seg=36, cap_top=False)
    for k in range(8):
        a = k / 8 * math.tau
        pts = [(math.cos(a) * (r + 0.015), math.sin(a) * (r + 0.015), z) for r, z in prof]
        tube(mb, pts, 0.008, brass, seg=4)
    ball(P.glow, (0, 0, 1.3), 0.15, '#fff0b8', sub=3)
    cyl(mb, 0, 0, 0.72, 1.2, 0.04, 0.04, brass, seg=10)
    lathe(mb, [(0.36, 1.88), (0.38, 1.92), (0.28, 2.02), (0.1, 2.08), (0.06, 2.16), (0.0, 2.18)], iron, seg=36)


@item('lh_hatch', 1, 1)
def lh_hatch(P):
    mb = P.main
    iron = metal('#2a2a30')
    rbox(mb, -0.32, -0.32, 0.0, 0.32, 0.32, 0.012, shade('#0e0e12'), r=0.004, mid=0)
    for (a, b, c, d) in ((-0.36, -0.36, 0.36, -0.28), (-0.36, 0.28, 0.36, 0.36), (-0.36, -0.36, -0.28, 0.36), (0.28, -0.36, 0.36, 0.36)):
        rbox(mb, a, b, 0.0, c, d, 0.06, iron, r=0.012, mid=0)
    for x in (-0.16, 0.16):
        rbox(mb, x - 0.02, -0.28, 0.006, x + 0.02, 0.28, 0.02, metal('#6a6e78'), r=0.004, mid=0)
    for k in range(4):
        rbox(mb, -0.16, -0.22 + k * 0.145, 0.01, 0.16, -0.2 + k * 0.145, 0.024, metal('#7a7e88'), r=0.004, mid=0)
    tube(mb, [(-0.06, -0.36, 0.06), (-0.06, -0.4, 0.09), (0.06, -0.4, 0.09), (0.06, -0.36, 0.06)], 0.01, metal('#8a8e96'), seg=4)
