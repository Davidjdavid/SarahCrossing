"""Furniture, part two: the club and the night-sky pieces, the holiday lanterns, Fortune's shop and Clementine's
boutique fixtures, the pottery studio, the prize counter and Ginger's workshop."""
import math
from mathutils import Vector, Matrix, Euler, noise
from trees_ac import rgb
from kit import col_fn, shade, rbox, lathe, tube, xform, cyl
from folks import ball, surf, superq, revolve, mottle
from furn_kit import *


def face_front(mb, m, at):
    """Turn what was added since m (built round the z axis) to face the front (-y), then move it to at."""
    xform(mb, m, Matrix.Translation(at) @ Matrix.Rotation(math.pi / 2, 4, 'X'))


def bricks(c='#b4483a', mortar='#d8c8b0', bw=0.22, bh=0.08):
    """Red bricks in a running bond, the mortar pale between them (on whichever face a point is on)."""
    a, m = rgb(c), rgb(mortar)

    def f(p, n, z0=0.0, z1=1.0):
        along = p.x if abs(n.x) < 0.7 else p.y
        row = math.floor(p.z / bh)
        u = along / bw + (0.5 if row % 2 else 0.0)
        fu, fz = u - math.floor(u), p.z / bh - row
        if abs(n.z) > 0.7:
            fu, fz = 0.5, 0.5
        line = fu < 0.06 or fz < 0.12
        k = 0.88 + 0.2 * (0.5 + 0.5 * noise.noise(Vector((math.floor(u), row, 0.3)) * 1.7))
        return (m if line else a * k) * (1 - 0.12 * max(0.0, -n.z))
    return f


def marble(c='#fbf8f2', vein='#b8b4b0'):
    a, v = rgb(c), rgb(vein)

    def f(p, n, z0=0.0, z1=1.0):
        t = abs(math.sin(p.x * 9 + p.y * 4 + 3 * noise.noise(p * 3)))
        return a.lerp(v, 0.5 * max(0.0, 1 - t * 12))
    return f


def torus(mb, cx, cy, z, R, r, col, sx=1.0, sy=1.0, nu=40, nv=14):
    """A ring (a cushion's rolled rim, a wheel's tyre) lying flat round (cx, cy) at height z, oval with sx, sy."""
    fn = col if callable(col) else (lambda p, n, u=0, v=0, c=rgb(col): c)

    def P(u, v):
        th, ph = u * math.tau, v * math.tau
        rr = R + r * math.cos(ph)
        return Vector((cx + rr * math.cos(th) * sx, cy + rr * math.sin(th) * sy, z + r * math.sin(ph)))
    surf(mb, P, fn, nu=nu, nv=nv, caps=(False, False))


def sv(f):
    """A kit paint (col_fn: point, normal, the piece's bottom and top) for surf, which hands over u, v instead."""
    return lambda p, n, u=0, v=0: f(p, n)


def can(mb, x, y, z, r, h, bands, top='#d8dce0', seg=16):
    """A jar or tin in bands of color from the bottom up (bands: [(t0, t1, color), ...]), each band its own ring so
    the colors stay sharp, a lid on top."""
    for t0, t1, c in bands:
        lathe(mb, [(r, z + t0 * h), (r, z + t1 * h)], shade(c), c=(x, y, 0), seg=seg, cap_top=False)
    lathe(mb, [(r, z + h), (r * 0.94, z + h + 0.008), (0.0, z + h + 0.009)], shade(top), c=(x, y, 0), seg=seg)


def brick_face(mb, o, u, n, width, height, bw=0.2, bh=0.075, gap=0.014, seed=1, c='#b4483a'):
    """Bricks in a running bond over a face: o its bottom corner, u the way along it, n the way it faces; each brick a
    quad a little proud of the mortar behind it."""
    o, u, n = Vector(o), Vector(u).normalized(), Vector(n).normalized()
    up = Vector((0, 0, 1))
    base = rgb(c)
    rows = int(height / bh)
    k = 0
    for r in range(rows):
        z0, z1 = r * bh + gap / 2, (r + 1) * bh - gap / 2
        s = -(bw / 2 if r % 2 else 0.0)
        while s < width:
            a, b = max(0.0, s) + gap / 2, min(width, s + bw) - gap / 2
            if b - a > 0.02:
                k += 1
                tone = base * (0.86 + 0.24 * (0.5 + 0.5 * math.sin(k * 12.9898 + seed * 78.233)))
                q = [o + u * a + up * z0 + n * 0.006, o + u * b + up * z0 + n * 0.006, o + u * b + up * z1 + n * 0.006, o + u * a + up * z1 + n * 0.006]
                mb.add(q, [tone] * 4, [n] * 4, [(0, 1, 2), (0, 2, 3)])
            s += bw


# ---------------------------------------------------------------- the club
@item('turntables', 2, 1)
def turntables(P):
    mb = P.main
    rbox(mb, -0.84, -0.32, 0.0, 0.84, 0.3, 0.86, paint('#2c2c34'), r=0.03, mid=2)
    rbox(mb, -0.8, -0.335, 0.1, 0.8, -0.3, 0.72, paint('#3a3a44'), r=0.02, mid=1)
    for x in (-0.6, -0.2, 0.2, 0.6):
        ball(P.glow, (x, -0.34, 0.66), 0.014, '#ff3a3a', sub=1)
    for s in (-1, 1):
        x = s * 0.5
        rbox(mb, x - 0.27, -0.27, 0.86, x + 0.27, 0.26, 0.9, paint('#46464e'), r=0.015, mid=1)
        lathe(mb, [(0.21, 0.9), (0.215, 0.915), (0.0, 0.915)], metal('#16161a'), c=(x, -0.01, 0), seg=28)
        lathe(mb, [(0.06, 0.915), (0.06, 0.92), (0.0, 0.92)], shade('#d83a3a'), c=(x, -0.01, 0), seg=16)
        cyl(mb, x + 0.21, 0.18, 0.9, 0.95, 0.025, 0.025, metal('#b8bcc4'), seg=8)
        tube(mb, [(x + 0.21, 0.18, 0.95), (x + 0.17, 0.02, 0.94), (x + 0.08, -0.08, 0.93)], 0.008, metal('#c8ccd4'), seg=5)
    # the mixer between them: knobs, two faders
    rbox(mb, -0.17, -0.2, 0.86, 0.17, 0.2, 0.93, paint('#3a3a42'), r=0.015, mid=1)
    for k in range(3):
        for s in (-1, 1):
            cyl(mb, s * 0.07, 0.12 - k * 0.07, 0.93, 0.955, 0.018, 0.016, metal('#d8d8dc'), seg=8)
    for s in (-1, 1):
        rbox(mb, s * 0.07 - 0.008, -0.17, 0.93, s * 0.07 + 0.008, -0.07, 0.935, shade('#16161a'), r=0.003, mid=0)
        rbox(mb, s * 0.07 - 0.02, -0.14, 0.93, s * 0.07 + 0.02, -0.11, 0.96, shade('#f2f2f2'), r=0.006, mid=0)


@item('speaker', 1, 1)
def speaker(P):
    mb = P.main
    rbox(mb, -0.26, -0.24, 0.0, 0.26, 0.24, 1.15, paint('#26262c'), r=0.03, mid=2)
    for z, R in ((0.82, 0.13), (0.38, 0.17)):
        m = len(mb.v)
        lathe(mb, [(R, 0.0), (R * 1.05, 0.015), (R * 0.95, 0.03), (R * 0.75, 0.025), (R * 0.3, 0.0), (0.0, 0.005)], metal('#3c3c44'), seg=28)
        face_front(mb, m, Vector((0, -0.24, z)))
        m = len(mb.v)
        lathe(mb, [(R * 0.32, 0.0), (R * 0.22, 0.035), (0.0, 0.045)], metal('#16161a'), seg=16)
        face_front(mb, m, Vector((0, -0.24, z)))


@item('skates_display', 1, 1)
def skates_display(P):
    mb = P.main
    rbox(mb, -0.28, -0.22, 0.0, 0.28, 0.22, 0.3, wood('#8a5a32'), r=0.02, mid=2)
    rbox(mb, -0.27, -0.225, 0.04, 0.27, -0.2, 0.08, wood('#6a4224'), r=0.008, mid=0)
    for s, wc in ((-1, ('#e83a4a', '#f2c840')), (1, ('#3a8ad8', '#4ab05a'))):
        x = s * 0.11
        rbox(mb, x - 0.055, -0.13, 0.33, x + 0.055, 0.12, 0.38, paint('#f6f4f0'), r=0.025, mid=1)
        rbox(mb, x - 0.055, 0.02, 0.36, x + 0.055, 0.12, 0.56, paint('#f6f4f0'), r=0.03, mid=1)
        rbox(mb, x - 0.058, 0.0, 0.5, x + 0.058, 0.125, 0.53, shade('#e870a0'), r=0.01, mid=0)
        for k, y in enumerate((-0.09, -0.03, 0.03, 0.09)):
            m = len(mb.v)
            lathe(mb, [(0.035, -0.02), (0.035, 0.02), (0.0, 0.02)], shade(wc[k % 2]), seg=12, cap_bot=True)
            xform(mb, m, Matrix.Translation((x, y, 0.33)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
        ball(mb, (x, -0.15, 0.34), (0.02, 0.025, 0.02), shade('#e870a0'), sub=1)


@item('golf_bag', 1, 1)
def golf_bag(P):
    mb = P.main
    m = len(mb.v)
    bag = lambda p, n, z0=0, z1=1: rgb('#f4f2ec') if 0.62 < p.z < 0.68 else rgb('#2e8a4a') * (1 - 0.12 * max(0.0, -n.y) + 0.06 * max(0.0, n.z))
    lathe(mb, [(0.13, 0.0), (0.15, 0.03), (0.15, 0.82), (0.16, 0.84), (0.16, 0.88), (0.13, 0.88)], bag, seg=24, cap_bot=True)
    rbox(mb, -0.08, -0.19, 0.2, 0.08, -0.12, 0.55, fabric('#267a40'), r=0.03, mid=1)
    tube(mb, [(-0.14, 0.02, 0.75), (-0.2, 0.08, 0.5), (-0.14, 0.04, 0.25)], 0.012, shade('#1e5a30'), seg=5)
    for k, (x, y, h, c) in enumerate(((-0.05, 0.03, 1.12, '#c8ccd4'), (0.05, -0.03, 1.18, '#c8ccd4'), (0.0, 0.06, 1.08, '#8a5a32'))):
        cyl(mb, x, y, 0.8, h, 0.012, 0.012, metal('#a8acb4'), seg=6)
        rbox(mb, x - 0.03, y - 0.06, h - 0.03, x + 0.03, y + 0.02, h + 0.02, metal(c), r=0.015, mid=1)
    xform(mb, m, Matrix.Translation((0, 0.03, 0)) @ Euler((-0.1, 0.05, 0)).to_matrix().to_4x4())


@item('goat_statue', 1, 1)
def goat_statue(P):
    mb = P.main
    stone = mottle('#c8c4bc', 0.08, 6.0)
    rbox(mb, -0.27, -0.22, 0.0, 0.27, 0.22, 0.06, col_fn('#a8a49c', mottle=0.06), r=0.015, mid=1)
    rbox(mb, -0.23, -0.18, 0.06, 0.23, 0.18, 0.46, col_fn('#bcb8b0', mottle=0.07), r=0.02, mid=2)
    rbox(mb, -0.27, -0.22, 0.44, 0.27, 0.22, 0.5, col_fn('#a8a49c', mottle=0.06), r=0.015, mid=1)
    # the goat, side on (the head to the right), all one grey stone
    surf(mb, superq(0.0, 0.0, 0.7, 0.19, 0.09, 0.09, 1.0, 1.0), stone, nu=24, nv=14)
    for (x, y) in ((-0.13, -0.05), (-0.13, 0.05), (0.12, -0.05), (0.12, 0.05)):
        cyl(mb, x, y, 0.5, 0.66, 0.025, 0.025, stone, seg=8)
    tube(mb, [(0.15, 0, 0.74), (0.2, 0, 0.84)], 0.05, stone, seg=10)
    ball(mb, (0.24, 0, 0.88), (0.07, 0.055, 0.055), stone, sub=2)
    ball(mb, (0.3, 0, 0.86), (0.04, 0.04, 0.035), stone, sub=2)
    for s in (-1, 1):
        tube(mb, [(0.21, s * 0.03, 0.92), (0.19, s * 0.04, 0.99), (0.15, s * 0.045, 1.02)], 0.012, col_fn('#a8a49c'), seg=5, r1=0.006)
        ball(mb, (0.22, s * 0.06, 0.9), (0.03, 0.012, 0.015), stone, sub=1)
    tube(mb, [(0.28, 0, 0.83), (0.28, 0, 0.79)], 0.015, stone, seg=5, r1=0.004)
    tube(mb, [(-0.18, 0, 0.74), (-0.22, 0, 0.8)], 0.02, stone, seg=5, r1=0.008)


# ---------------------------------------------------------------- holiday lanterns
@item('pumpkin_lantern', 1, 1)
def pumpkin_lantern(P):
    mb = P.main
    R = 0.27

    def rib(p, n, u=0, v=0):
        a = math.atan2(p.y, p.x)
        return rgb('#f08a20').lerp(rgb('#c05a10'), 0.6 * max(0.0, math.cos(a * 8)) ** 6) * (1 - 0.15 * max(0.0, -n.z))
    surf(mb, superq(0, 0, 0.22, R, R * 0.92, 0.21, 1.0, 1.0, mod=lambda u, v: 1 - 0.06 * max(0.0, math.cos(u * math.tau * 8)) ** 4), rib, nu=48, nv=18)
    tube(mb, [(0, 0, 0.41), (0.01, 0, 0.47), (0.04, 0.01, 0.5)], 0.025, shade('#5a6a2a'), seg=8, r1=0.018)
    # the carved face lit from inside: two triangle eyes, a nose, a toothy grin
    def tri(cx, cz, w, h, up=True):
        pts = [(cx - w, cz - h / 2), (cx + w, cz - h / 2), (cx, cz + h / 2)] if up else [(cx - w, cz + h / 2), (cx, cz - h / 2), (cx + w, cz + h / 2)]
        slab(P.glow, pts, 0.03, '#ffcc40', axis='y', at=-R * 0.92 + 0.005)
    tri(-0.09, 0.3, 0.05, 0.07)
    tri(0.09, 0.3, 0.05, 0.07)
    tri(0.0, 0.23, 0.025, 0.04)
    slab(P.glow, [(-0.13, 0.17), (-0.06, 0.12), (0.0, 0.14), (0.06, 0.12), (0.13, 0.17), (0.08, 0.12), (0.0, 0.09), (-0.08, 0.12)], 0.03, '#ffb030', axis='y', at=-R * 0.92 + 0.005)


@item('lunar_lantern', 1, 1)
def lunar_lantern(P):
    mb = P.main
    gold = metal('#e8b830')
    lathe(mb, [(0.17, 0.0), (0.17, 0.05), (0.07, 0.08)], wood('#4a2a1a'), seg=24)
    cyl(mb, 0, 0, 0.06, 0.72, 0.022, 0.022, wood('#4a2a1a'), seg=8)
    rib = lambda p, n, z0=0, z1=1: rgb('#d8282a') * (0.8 if abs(math.sin(math.atan2(p.y, p.x) * 8)) < 0.12 else 1.0)
    lathe(mb, [(0.12, 0.76), (0.24, 0.82), (0.28, 0.98), (0.24, 1.14), (0.12, 1.2)], rib, seg=36, cap_top=False, cap_bot=False)
    for z in (0.74, 1.22):
        lathe(mb, [(0.15, z - 0.04), (0.17, z), (0.15, z + 0.04)], gold, seg=24)
    lathe(mb, [(0.08, 1.26), (0.03, 1.32), (0.0, 1.33)], gold, seg=12)
    torus(mb, 0, 0, 0.98, 0.28, 0.012, '#e8b830', nu=40, nv=6)
    # a gold medallion on the front, a tassel underneath
    m = len(mb.v)
    lathe(mb, [(0.075, 0.0), (0.08, 0.01), (0.0, 0.012)], gold, seg=20)
    face_front(mb, m, Vector((0, -0.275, 0.98)))
    ball(P.glow, (0, -0.29, 0.98), (0.03, 0.006, 0.03), '#fff0a0', sub=1)
    tube(mb, [(0, 0, 0.7), (0, 0, 0.56)], 0.02, shade('#e8b830'), seg=6, r1=0.03)
    ball(P.glow, (0, 0, 0.98), 0.09, '#ffb070', sub=2)


# ---------------------------------------------------------------- shells and treasure
@item('shell_display', 2, 1)
def shell_display(P):
    mb = P.main
    rbox(mb, -0.86, -0.36, 0.0, 0.86, 0.36, 0.72, wood('#d8b888'), r=0.025, mid=2)
    rbox(mb, -0.8, -0.378, 0.1, 0.8, -0.355, 0.62, wood('#c8a474'), r=0.015, mid=1)
    glass_box(P, -0.84, -0.34, 0.72, 0.84, 0.34, 1.08, frame='#f4ecdc')
    rbox(mb, -0.8, -0.3, 0.72, 0.8, 0.3, 0.75, fabric('#fbf2e2'), r=0.01, mid=1)
    # shells: a pink conch, a scallop, a little red one, a teal one, a spiral
    m = len(mb.v)
    lathe(mb, [(0.0, -0.1), (0.05, -0.06), (0.07, 0.0), (0.05, 0.05), (0.0, 0.1)], lambda p, n, z0=0, z1=1: rgb('#f4a0a8') * (0.85 + 0.2 * abs(math.sin(p.z * 60))), seg=16)
    xform(mb, m, Matrix.Translation((-0.55, 0.0, 0.8)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
    for x, c in ((-0.18, '#f2a050'), (0.55, '#4ac0b8')):
        m = len(mb.v)
        for k in range(7):
            a = (k - 3) * 0.22
            ball(mb, (math.sin(a) * 0.05, 0, math.cos(a) * 0.05), (0.022, 0.012, 0.055), shade(c), sub=1)
        xform(mb, m, Matrix.Translation((x, -0.02, 0.77)) @ Euler((-1.1, 0, 0)).to_matrix().to_4x4())
    ball(mb, (0.18, 0.05, 0.79), (0.05, 0.045, 0.04), shade('#e04848'), sub=2)
    m = len(mb.v)
    for k in range(10):
        t = k / 9
        ball(mb, (math.cos(t * 9) * 0.05 * (1 - t * 0.6), math.sin(t * 9) * 0.05 * (1 - t * 0.6), t * 0.06), 0.022 * (1 - t * 0.5), shade('#e8d8b8'), sub=1)
    xform(mb, m, Matrix.Translation((0.32, -0.12, 0.77)))
    P.top(1.08)


@item('treasure_chest', 1, 1)
def treasure_chest(P):
    mb = P.main
    w, d, h = 0.6, 0.42, 0.34
    rbox(mb, -w / 2, -d / 2, 0.0, w / 2, d / 2, h, wood('#8a5228'), r=0.02, mid=1)
    # the domed lid
    lid = wood('#9a5e30')

    def P_(u, v):
        th = (u - 0.5) * math.pi
        return Vector((-w / 2 + w * v, math.sin(th) * d / 2, h + math.cos(th) * 0.13))
    pts, nrm = [], []
    m = len(mb.v)
    nu, nv = 14, 8
    grid = [[P_(i / nu, j / nv) for i in range(nu + 1)] for j in range(nv + 1)]
    P2, N2, F2 = [], [], []
    for j in range(nv + 1):
        for i in range(nu + 1):
            p = grid[j][i]
            th = (i / nu - 0.5) * math.pi
            P2.append(p); N2.append(Vector((0, math.sin(th), math.cos(th))))
    for j in range(nv):
        for i in range(nu):
            a = j * (nu + 1) + i
            F2 += [(a, a + 1, a + nu + 2), (a, a + nu + 2, a + nu + 1)]
    mb.add(P2, [lid(p, n) for p, n in zip(P2, N2)], N2, F2)
    for s in (-1, 1):
        ring = [Vector((s * w / 2, math.sin((i / nu - 0.5) * math.pi) * d / 2, h + math.cos((i / nu - 0.5) * math.pi) * 0.13)) for i in range(nu + 1)]
        cen = Vector((s * w / 2, 0, h))
        mb.add([cen] + ring, [lid(cen, Vector((s, 0, 0)))] * (nu + 2), [Vector((s, 0, 0))] * (nu + 2), [(0, 1 + i, 2 + i) for i in range(nu)])
    gold = metal('#e8b838')
    for x in (-w / 2 + 0.06, w / 2 - 0.06):
        rbox(mb, x - 0.025, -d / 2 - 0.012, 0.0, x + 0.025, d / 2 + 0.012, h, gold, r=0.008, mid=0)
        tube(mb, [Vector((x, math.sin((i / 10 - 0.5) * math.pi) * (d / 2 + 0.012), h + math.cos((i / 10 - 0.5) * math.pi) * 0.142)) for i in range(11)], 0.02, gold, seg=5)
    rbox(mb, -w / 2 - 0.01, -d / 2 - 0.012, h - 0.03, w / 2 + 0.01, d / 2 + 0.012, h + 0.005, gold, r=0.008, mid=0)
    rbox(mb, -0.05, -d / 2 - 0.03, h - 0.1, 0.05, -d / 2, h + 0.03, gold, r=0.012, mid=1)
    ball(mb, (0, -d / 2 - 0.035, h - 0.04), (0.012, 0.006, 0.02), shade('#3a2a10'), sub=1)


@item('star_telescope', 1, 1)
def star_telescope(P):
    mb = P.main
    dark = metal('#2e2e36')
    top = Vector((0, 0.02, 0.95))
    for k in range(3):
        a = k / 3 * math.tau + 0.5
        tube(mb, [top, Vector((math.cos(a) * 0.3, math.sin(a) * 0.3, 0.0))], 0.016, dark, seg=6)
    ball(mb, top, 0.045, dark, sub=2)
    # the brass tube pointing up at the sky to the right, the eyepiece at its lower end
    m = len(mb.v)
    brass = metal('#d8a840')
    lathe(mb, [(0.045, -0.35), (0.05, -0.3), (0.05, 0.25), (0.065, 0.28), (0.07, 0.42), (0.0, 0.42)], brass, seg=20, cap_bot=True)
    lathe(mb, [(0.025, -0.45), (0.025, -0.35)], dark, seg=10, cap_bot=True)
    rbox(mb, -0.052, -0.06, -0.06, 0.052, 0.06, 0.06, dark, r=0.02, mid=0)
    M = Matrix.Translation(top + Vector((0, 0, 0.04))) @ Euler((0, 0.95, 0.5)).to_matrix().to_4x4()
    xform(mb, m, M)
    g = len(P.gloss.v)
    ball(P.gloss, (0, 0, 0.422), (0.062, 0.062, 0.008), col_fn('#5a7aa8', under=0.0), sub=2)
    xform(P.gloss, g, M)


# ---------------------------------------------------------------- Fortune's shop
@item('counter_shop', 3, 1)
def counter_shop(P):
    counter(P, 2.8, 0.7, 1.0, wood('#ecd09a'), wood('#c8935a', 'z'), panels=4, trim=wood('#a87040'))


@item('rack_tools', 1, 1)
def rack_tools(P):
    mb = P.main
    fr = wood('#a87444', 'z')
    for s in (-1, 1):
        rbox(mb, s * 0.33 - 0.035, -0.04, 0.0, s * 0.33 + 0.035, 0.06, 1.5, fr, r=0.012, mid=1)
        rbox(mb, s * 0.33 - 0.05, -0.18, 0.0, s * 0.33 + 0.05, 0.18, 0.05, fr, r=0.015, mid=1)
    cork = lambda p, n, z0=0, z1=1: rgb('#d0a874') * (0.88 + 0.15 * noise.noise(p * 40)) * (0.85 if (math.fmod(abs(p.x) * 20, 1) < 0.18 and math.fmod(p.z * 20, 1) < 0.18) else 1.0)
    rbox(mb, -0.3, 0.0, 0.1, 0.3, 0.03, 1.45, cork, r=0.008, mid=1)
    rbox(mb, -0.33, -0.02, 1.42, 0.33, 0.06, 1.5, fr, r=0.012, mid=1)
    # a rake, a spade, a trowel and a watering can hung on it
    wd = wood('#9a6a3a', 'z')
    cyl(mb, -0.17, -0.02, 0.18, 1.3, 0.014, 0.014, wd, seg=6)
    rbox(mb, -0.27, -0.035, 1.26, -0.07, -0.01, 1.3, metal('#8a9098'), r=0.006, mid=0)
    for k in range(6):
        rbox(mb, -0.26 + k * 0.036, -0.035, 1.21, -0.25 + k * 0.036, -0.012, 1.27, metal('#8a9098'), r=0.003, mid=0)
    cyl(mb, 0.04, -0.02, 0.5, 1.32, 0.014, 0.014, wd, seg=6)
    rbox(mb, -0.02, -0.03, 0.28, 0.1, -0.012, 0.5, metal('#a8b0b8'), r=0.02, mid=1)
    rbox(mb, 0.01, -0.032, 1.3, 0.07, -0.012, 1.36, wd, r=0.01, mid=0)
    m = len(mb.v)
    lathe(mb, [(0.06, 0.0), (0.065, 0.02), (0.065, 0.12), (0.05, 0.13), (0.0, 0.13)], metal('#4a9ad0'), seg=16, cap_bot=True)
    tube(mb, [(0.05, 0, 0.06), (0.12, 0, 0.14), (0.14, 0, 0.16)], 0.012, metal('#4a9ad0'), seg=6)
    tube(mb, [(-0.06, 0, 0.1), (-0.08, 0, 0.16), (0.0, 0, 0.18), (0.06, 0, 0.13)], 0.008, metal('#3a8ac0'), seg=5)
    xform(mb, m, Matrix.Translation((0.2, -0.08, 0.72)))


def grocery(mb, x0, x1, y0, y1, z, hh, rng, cols=('#e8484a', '#f2c040', '#4aa85a', '#4a7ad8', '#e87ac0', '#f08a30')):
    """Jars and tins along a shelf: a colored label round the middle of each, a lid."""
    x = x0 + 0.05
    while x < x1 - 0.05:
        r, h = rng.uniform(0.04, 0.055), hh * rng.uniform(0.45, 0.7)
        c = rng.choice(cols)
        glass = rng.random() < 0.5
        can(mb, x, (y0 + y1) / 2, z, r, h, [(0, 0.22, '#f4f0e6' if glass else '#c8ccd0'), (0.22, 0.78, c), (0.78, 1, '#f4f0e6' if glass else '#c8ccd0')], top=rng.choice(('#d8dce0', '#c8383a', '#e8c040')), seg=10)
        x += r * 2 + rng.uniform(0.02, 0.05)


@item('shelf_grocery', 2, 1)
def shelf_grocery(P):
    shelf(P, 1.7, 0.45, 1.55, wood('#a46c3c', 'z'), rows=3, fill=grocery)


# ---------------------------------------------------------------- Clementine's boutique
@item('pedestal', 1, 1)
def pedestal(P):
    mb = P.main
    stone = col_fn('#f2efe8', mottle=0.03, under=0.12)
    rbox(mb, -0.24, -0.22, 0.0, 0.24, 0.22, 0.08, stone, r=0.015, mid=1)
    rbox(mb, -0.2, -0.18, 0.08, 0.2, 0.18, 0.13, stone, r=0.012, mid=1)
    flute = lambda p, n, z0=0, z1=1: rgb('#f4f1ea') * (0.88 if abs(math.sin(math.atan2(p.y, p.x) * 10)) < 0.25 else 1.0)
    lathe(mb, [(0.13, 0.13), (0.12, 0.2), (0.11, 0.8), (0.12, 0.84)], flute, seg=32, cap_top=False)
    rbox(mb, -0.2, -0.18, 0.84, 0.2, 0.18, 0.89, stone, r=0.012, mid=1)
    rbox(mb, -0.24, -0.22, 0.89, 0.24, 0.22, 0.95, stone, r=0.015, mid=1)
    P.top(0.95)


@item('counter_boutique', 3, 1)
def counter_boutique(P):
    counter(P, 2.8, 0.7, 1.0, col_fn('#fbf8f2', mottle=0.03, under=0.0), paint('#f08a28'), panels=0, kick='#c06a1a', top_t=0.07)
    for k in range(13):
        x = -1.3 + k * (2.6 / 12)
        rbox(P.main, x - 0.022, -0.365, 0.12, x + 0.022, -0.34, 0.9, paint('#f8ae58'), r=0.01, mid=0)
    # grey veins over the marble top
    for (x0, y0, x1, y1) in ((-1.2, -0.3, -0.7, 0.2), (0.1, -0.25, 0.6, 0.3), (0.8, 0.1, 1.3, -0.2)):
        tube(P.main, [(x0, y0, 1.002), ((x0 + x1) / 2 + 0.08, (y0 + y1) / 2, 1.002), (x1, y1, 1.002)], 0.006, shade('#c8c4c0'), seg=4)


@item('clothes_rack', 2, 1)
def clothes_rack(P):
    mb = P.main
    steel = metal('#b8bcc4')
    for s in (-1, 1):
        x = s * 0.78
        tube(mb, [(x, -0.24, 0.03), (x, 0.24, 0.03)], 0.025, steel, seg=8)
        for y in (-0.24, 0.24):
            ball(mb, (x, y, 0.03), 0.035, metal('#3a3a40'), sub=1)
        cyl(mb, x, 0, 0.03, 1.48, 0.02, 0.02, steel, seg=8)
    tube(mb, [(-0.8, 0, 1.48), (0.8, 0, 1.48)], 0.018, steel, seg=8)
    for s in (-1, 1):
        ball(mb, (s * 0.78, 0, 1.48), 0.028, steel, sub=1)
    # shirts and dresses on hangers along it
    cols = ['#e8509a', '#3a6ac8', '#f2c840', '#4ab070', '#2ab0b0', '#f08a30', '#c84ac0']
    for k, c in enumerate(cols):
        x = -0.6 + k * 0.2
        tube(mb, [(x - 0.07, 0, 1.4), (x, 0, 1.45), (x + 0.07, 0, 1.4)], 0.006, metal('#8a8a90'), seg=4)
        ln = 0.55 + 0.12 * ((k * 3) % 4) / 3
        rbox(mb, x - 0.085, -0.13, 1.4 - ln, x + 0.085, 0.13, 1.41, fabric(c, k), r=0.04, mid=1)
        for s in (-1, 1):
            rbox(mb, x + s * 0.085 - 0.02, -0.11, 1.26, x + s * 0.085 + 0.02, 0.11, 1.4, fabric(c, k), r=0.02, mid=0)


@item('acc_table', 2, 1)
def acc_table(P):
    mb = P.main
    gold = metal('#e0b448')
    w, d, h = 1.72, 0.66, 0.74
    for x in (-w / 2 + 0.06, w / 2 - 0.06):
        for y in (-d / 2 + 0.06, d / 2 - 0.06):
            cyl(mb, x, y, 0.0, h - 0.03, 0.022, 0.022, gold, seg=8)
    for y in (-d / 2 + 0.06, d / 2 - 0.06):
        tube(mb, [(-w / 2 + 0.06, y, 0.12), (w / 2 - 0.06, y, 0.12)], 0.015, gold, seg=6)
        tube(mb, [(-w / 2 + 0.06, y, h - 0.04), (w / 2 - 0.06, y, h - 0.04)], 0.018, gold, seg=6)
    for x in (-w / 2 + 0.06, w / 2 - 0.06):
        tube(mb, [(x, -d / 2 + 0.06, h - 0.04), (x, d / 2 - 0.06, h - 0.04)], 0.018, gold, seg=6)
    rbox(P.gloss, -w / 2, -d / 2, h - 0.03, w / 2, d / 2, h, col_fn('#b8e2f0', under=0.0), r=0.012, mid=1)
    P.top(h)


@item('goat_bed', 1, 1)
def goat_bed(P):
    mb = P.main

    def dots(p, n, u=0, v=0):
        return rgb('#f6d040') if noise.noise(p * 26) > 0.55 else rgb('#a68ce6') * (1 - 0.12 * max(0.0, -n.z))
    torus(mb, 0, 0, 0.1, 0.27, 0.09, dots, sx=1.0, sy=0.75, nu=40, nv=14)
    surf(mb, superq(0, 0, 0.09, 0.24, 0.17, 0.05, 1.0, 1.0), lambda p, n, u=0, v=0: rgb('#cdbdf4') * (0.9 + 0.1 * max(0.0, n.z)), nu=32, nv=12)


@item('shoe_rack', 1, 1)
def shoe_rack(P):
    mb = P.main
    w, d, h, t = 0.62, 0.36, 0.6, 0.035
    fr = wood('#9a6438')
    # an open cubby: sides, a middle board, three shelves, a dark back; a pair of shoes in each of the four
    for x in (-w / 2, -t / 2, w / 2 - t):
        rbox(mb, x, -d / 2, 0, x + t, d / 2, h, fr, r=0.008, mid=0)
    for z in (0.0, (h - t) / 2, h - t):
        rbox(mb, -w / 2, -d / 2, z, w / 2, d / 2, z + t, fr, r=0.008, mid=0)
    rbox(mb, -w / 2 + 0.01, d / 2 - 0.02, 0.0, w / 2 - 0.01, d / 2, h, shade('#5a3820'), r=0.004, mid=0)
    shoes = (('#e04048', '#f6f6f2'), ('#3ab0b8', '#f6f6f2'), ('#f2c040', '#3a3a40'), ('#4aa858', '#f6f6f2'))
    for r in range(2):
        for c in range(2):
            up, sole = shoes[r * 2 + c]
            cx = (-w / 2 + t + (w - 3 * t) / 4) if c == 0 else (t / 2 + (w - 3 * t) / 4)
            z0 = t + r * (h - t) / 2
            for s in (-1, 1):
                x = cx + s * 0.055
                rbox(mb, x - 0.045, -d / 2 + 0.03, z0, x + 0.045, d / 2 - 0.06, z0 + 0.02, shade(sole), r=0.012, mid=0)
                rbox(mb, x - 0.04, -d / 2 + 0.06, z0 + 0.015, x + 0.04, d / 2 - 0.07, z0 + 0.07, fabric(up), r=0.025, mid=0)
                rbox(mb, x - 0.035, d / 2 - 0.16, z0 + 0.05, x + 0.035, d / 2 - 0.07, z0 + 0.11, fabric(up), r=0.02, mid=0)
    P.top(h)


# ---------------------------------------------------------------- the pottery studio
@item('potters_wheel', 2, 1)
def potters_wheel(P):
    mb = P.main
    grey = metal('#5a626c')
    rbox(mb, -0.6, -0.26, 0.0, 0.2, 0.26, 0.42, grey, r=0.04, mid=2)
    lathe(mb, [(0.34, 0.42), (0.36, 0.44), (0.36, 0.52), (0.33, 0.53), (0.31, 0.47), (0.0, 0.46)], metal('#7a828c'), c=(-0.2, 0, 0), seg=36)
    lathe(mb, [(0.2, 0.47), (0.2, 0.5), (0.0, 0.5)], metal('#9aa2aa'), c=(-0.2, 0, 0), seg=28)
    clay = col_fn('#a86a44', mottle=0.06, under=0.1)
    lathe(mb, [(0.09, 0.5), (0.13, 0.56), (0.12, 0.65), (0.07, 0.72), (0.08, 0.76), (0.06, 0.765)], clay, c=(-0.2, 0, 0), seg=24, cap_top=False)
    lathe(mb, [(0.055, 0.765), (0.0, 0.7)], shade('#6a3a22'), c=(-0.2, 0, 0), seg=16, cap_top=False)
    # the stool to work from, a pedal
    rbox(mb, 0.38, -0.2, 0.0, 0.8, 0.2, 0.42, wood('#9a6438'), r=0.03, mid=2)
    rbox(mb, 0.36, -0.22, 0.42, 0.82, 0.22, 0.46, wood('#a87040'), r=0.02, mid=1)
    rbox(mb, -0.12, -0.42, 0.0, 0.04, -0.3, 0.05, metal('#3a3a40'), r=0.015, mid=0)


def glaze_jars(mb, x0, x1, y, z, rng, cols=('#3a6ad8', '#d83a4a', '#f2c040', '#3ab0a8', '#e870b0', '#4aa84a')):
    x, k = x0, 0
    while x < x1 - 0.06:
        c, r, h = cols[k % len(cols)], 0.045, rng.uniform(0.13, 0.17)
        can(mb, x + r, y, z, r, h, [(0, 0.35, c), (0.35, 0.6, '#f4f0e6'), (0.6, 1, c)], top='#3a3a40', seg=14)
        x += r * 2 + 0.03
        k += 1


@item('glaze_table', 2, 1)
def glaze_table(P):
    table(P, 1.75, 0.7, 0.72, wood('#c87e44'), wood('#a0602e', 'z'), leg_r=0.04)
    glaze_jars(P.main, -0.8, 0.8, 0.05, 0.72, P.rng)


@item('work_table', 2, 1)
def work_table(P):
    table(P, 1.75, 0.7, 0.72, wood('#c08048'), wood('#9a6234', 'z'), leg_r=0.04)
    mb = P.main
    surf(mb, superq(-0.35, 0.02, 0.79, 0.15, 0.12, 0.08, 1.0, 1.0, mod=lambda u, v: 1 + 0.06 * math.sin(u * 17) * math.sin(v * 5)), sv(col_fn('#9a5e3e', mottle=0.08, under=0.0)), nu=24, nv=12)
    rbox(mb, 0.0, -0.08, 0.72, 0.22, 0.08, 0.78, col_fn('#c84a3a', mottle=0.04), r=0.015, mid=1)
    tube(mb, [(0.32, -0.12, 0.735), (0.58, 0.04, 0.735)], 0.008, wood('#7a4a2a'), seg=5)
    tube(mb, [(0.58, 0.04, 0.735), (0.64, 0.08, 0.735)], 0.004, metal('#c8ccd4'), seg=4)


@item('kiln', 2, 2)
def kiln(P):
    mb = P.main
    w, d, h = 1.6, 1.5, 1.5
    rbox(mb, -w / 2, -d / 2, 0.0, w / 2, d / 2, h - 0.1, col_fn('#cdbca4', under=0.1), r=0.01, mid=1)
    brick_face(mb, (-w / 2, -d / 2, 0), (1, 0, 0), (0, -1, 0), w, h - 0.1, seed=1)
    brick_face(mb, (-w / 2, d / 2, 0), (0, -1, 0), (-1, 0, 0), d, h - 0.1, seed=2)
    brick_face(mb, (w / 2, -d / 2, 0), (0, 1, 0), (1, 0, 0), d, h - 0.1, seed=3)
    rbox(mb, -w / 2 - 0.04, -d / 2 - 0.04, h - 0.11, w / 2 + 0.04, d / 2 + 0.04, h, col_fn('#9a3e30', mottle=0.06, under=0.0), r=0.02, mid=1)
    # the iron door with its rivets and a little glowing window, the chimney
    iron = metal('#3a3a42')
    rbox(mb, -0.48, -d / 2 - 0.05, 0.25, 0.48, -d / 2 + 0.01, 1.15, iron, r=0.04, mid=2)
    rbox(mb, -0.42, -d / 2 - 0.065, 0.31, 0.42, -d / 2 - 0.04, 1.09, metal('#4a4a54'), r=0.03, mid=1)
    for x in (-0.38, 0.38):
        for z in (0.36, 0.7, 1.04):
            ball(mb, (x, -d / 2 - 0.07, z), 0.016, metal('#7a7a84'), sub=1)
    rbox(P.glow, -0.12, -d / 2 - 0.075, 0.82, 0.12, -d / 2 - 0.06, 0.95, col_fn('#ff9030', under=0.0), r=0.01, mid=0)
    rbox(mb, 0.36, -d / 2 - 0.12, 0.62, 0.42, -d / 2 - 0.06, 0.78, metal('#8a8a94'), r=0.012, mid=0)
    lathe(mb, [(0.14, h), (0.14, h + 0.38), (0.17, h + 0.4), (0.17, h + 0.48), (0.12, h + 0.48)], iron, c=(0.0, 0.2, 0), seg=20, cap_top=False)
    lathe(mb, [(0.12, h + 0.47), (0.0, h + 0.44)], shade('#16161a'), c=(0.0, 0.2, 0), seg=16, cap_top=False)


@item('display_shelf', 3, 1)
def display_shelf(P):
    mb = P.main
    w, d, h = 2.8, 0.6, 0.82
    rbox(mb, -w / 2 + 0.03, -d / 2 + 0.03, 0.0, w / 2 - 0.03, d / 2, 0.06, shade('#7a5030'), r=0.01, mid=0)
    rbox(mb, -w / 2, -d / 2, 0.05, w / 2, d / 2, h - 0.05, wood('#dcb680'), r=0.025, mid=2)
    rbox(mb, -w / 2 + 0.1, -d / 2 - 0.015, 0.16, w / 2 - 0.1, -d / 2 + 0.01, h - 0.16, wood('#ccA270'), r=0.02, mid=1)
    rbox(mb, -w / 2 - 0.03, -d / 2 - 0.03, h - 0.05, w / 2 + 0.03, d / 2 + 0.01, h, wood('#e6c48e'), r=0.02, mid=2)
    P.top(h)


@item('clay_bin', 1, 1)
def clay_bin(P):
    mb = P.main
    grey = metal('#6c7682')
    rbox(mb, -0.24, -0.22, 0.0, 0.24, 0.22, 0.6, grey, r=0.035, mid=2)
    for z in (0.16, 0.42):
        rbox(mb, -0.25, -0.23, z, 0.25, 0.23, z + 0.04, metal('#5a646e'), r=0.015, mid=1)
    rbox(mb, -0.26, -0.24, 0.6, 0.26, 0.24, 0.65, metal('#4e5862'), r=0.02, mid=1)
    surf(mb, superq(0.0, 0.0, 0.66, 0.17, 0.15, 0.05, 1.0, 1.0), sv(col_fn('#b06848', mottle=0.06, under=0.0)), nu=24, nv=10, caps=(False, True))
    rbox(mb, -0.07, -0.25, 0.48, 0.07, -0.22, 0.52, metal('#8a949e'), r=0.01, mid=0)


# ---------------------------------------------------------------- the arcade's prize counter
@item('counter_prize', 3, 1)
def counter_prize(P):
    counter(P, 2.8, 0.7, 1.0, paint('#f6d040'), paint('#6a48c8'), panels=0, kick='#3a2a6a', top_t=0.08)
    mb = P.main
    for k in range(6):
        x = -1.15 + k * 0.46
        rbox(mb, x - 0.17, -0.37, 0.28, x + 0.17, -0.34, 0.74, paint('#8a6ae0'), r=0.03, mid=1)
        rbox(P.gloss, x - 0.13, -0.38, 0.33, x + 0.13, -0.365, 0.69, col_fn('#b0a0f0', under=0.0), r=0.02, mid=0)
        m = len(mb.v)
        ball(mb, (0, 0, 0), (0.05, 0.012, 0.07), shade('#f6d040'), sub=1)
        xform(mb, m, Matrix.Translation((x, -0.39, 0.51)) @ Matrix.Rotation(math.pi / 4, 4, 'Y'))


# ---------------------------------------------------------------- Ginger's workshop
@item('workbench', 2, 1)
def workbench(P):
    mb = P.main
    w, d, h = 1.76, 0.7, 0.86
    wd = wood('#b47a44')
    slab_top(mb, -w / 2, -d / 2, w / 2, d / 2, h, 0.08, wood('#c48a50'))
    legs(mb, -w / 2, w / 2, -d / 2, d / 2, h - 0.08, wood('#8a5a32', 'z'), r=0.05, inset=0.06)
    rbox(mb, -w / 2 + 0.08, -d / 2 + 0.04, h - 0.32, w / 2 - 0.08, d / 2 - 0.04, h - 0.08, wd, r=0.02, mid=1)
    for x0, x1 in ((-0.72, -0.06), (0.06, 0.72)):
        rbox(mb, x0, -d / 2 + 0.02, h - 0.3, x1, -d / 2 + 0.05, h - 0.1, wood('#a46c3a'), r=0.012, mid=1)
        rbox(mb, (x0 + x1) / 2 - 0.08, -d / 2 - 0.01, h - 0.22, (x0 + x1) / 2 + 0.08, -d / 2 + 0.02, h - 0.18, metal('#4a4a50'), r=0.01, mid=0)
    rbox(mb, -w / 2 + 0.1, -d / 2 + 0.08, 0.12, w / 2 - 0.1, d / 2 - 0.08, 0.16, wood('#9a6438'), r=0.01, mid=1)
    # a hammer, a saw, the vise at the end
    tube(mb, [(-0.55, -0.08, h + 0.02), (-0.3, -0.02, h + 0.02)], 0.016, wood('#8a5a32'), seg=6)
    rbox(mb, -0.6, -0.12, h, -0.54, -0.02, h + 0.06, metal('#5a5a64'), r=0.012, mid=0)
    rbox(mb, -0.1, 0.0, h, 0.32, 0.12, h + 0.01, metal('#b8bcc4'), r=0.004, mid=0)
    rbox(mb, 0.32, 0.03, h, 0.42, 0.09, h + 0.04, wood('#7a4a2a'), r=0.012, mid=0)
    iron = metal('#3a3a44')
    rbox(mb, 0.58, -d / 2 - 0.06, h, 0.84, -d / 2 + 0.14, h + 0.14, iron, r=0.02, mid=1)
    rbox(mb, 0.6, -d / 2 - 0.08, h + 0.02, 0.82, -d / 2 - 0.04, h + 0.12, metal('#4a4a54'), r=0.015, mid=0)
    tube(mb, [(0.71, -d / 2 - 0.08, h + 0.07), (0.71, -d / 2 - 0.2, h + 0.07)], 0.012, metal('#8a8a94'), seg=6)
    tube(mb, [(0.64, -d / 2 - 0.2, h + 0.07), (0.78, -d / 2 - 0.2, h + 0.07)], 0.01, metal('#8a8a94'), seg=6)
    P.top(h)


@item('lumber_stack', 2, 1)
def lumber_stack(P):
    mb = P.main
    rng = P.rng
    z = 0.0
    for layer in range(4):
        if layer % 2 == 0 or layer == 3:
            n = 4 if layer < 3 else 3
            for k in range(n):
                y = -0.27 + k * (0.54 / (n - 1)) if n > 1 else 0
                dx = rng.uniform(-0.06, 0.06)
                rbox(mb, -0.85 + dx, y - 0.07, z, 0.85 + dx, y + 0.07, z + 0.07, wood('#dcae70', seed=rng.random() * 9), r=0.012, mid=1)
                for x in (-0.85 + dx, 0.85 + dx - 0.004):
                    rbox(mb, x - 0.002, y - 0.066, z + 0.004, x + 0.006, y + 0.066, z + 0.066, shade('#c89a5a'), r=0.004, mid=0)
            z += 0.07
        else:
            for x in (-0.6, 0.0, 0.6):
                rbox(mb, x - 0.04, -0.33, z, x + 0.04, 0.33, z + 0.04, wood('#a87a48', 'y'), r=0.008, mid=0)
            z += 0.04
    P.top(z)


def paint_cans(mb, x0, x1, y0, y1, z, hh, rng, cols=('#e84848', '#f2c040', '#3a7ad8', '#4ab05a', '#e878c0', '#f2f2ee', '#8a5ad0')):
    x, k = x0 + 0.06, rng.randrange(7)
    while x < x1 - 0.06:
        c, r, h = cols[k % len(cols)], 0.06, hh * 0.55
        y = (y0 + y1) / 2 - 0.02
        can(mb, x, y, z, r, h, [(0, 0.12, '#c8ccd0'), (0.12, 0.4, c), (0.4, 0.62, '#fbfaf6'), (0.62, 0.9, c), (0.9, 1, '#c8ccd0')], top=c, seg=12)
        ball(mb, (x - r * 0.3, y - r * 0.9, z + h - 0.02), (0.012, 0.008, 0.03), shade(c), sub=1)
        x += r * 2 + rng.uniform(0.02, 0.05)
        k += 1


@item('paint_shelf', 2, 1)
def paint_shelf(P):
    shelf(P, 1.7, 0.45, 1.4, wood('#8a5a30', 'z'), rows=2, fill=paint_cans)
