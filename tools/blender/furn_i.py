"""Furniture, part nine: the newcomers' themed houses (6zt_themed_furn.js). Captain Shrimpy's is a ship's cabin: a ship's
wheel and a brass porthole on the wall, an anchor on a coil of rope. Muggy's remembers the old days, when everyone on the
island was dishware: a teacup big enough to sit in, a teapot lamp, a rack of plates on the wall and a china cabinet full
of cups. Wall pieces stand against the back wall (their middle at the origin, their back at y 0, as big as their
pictures); floor pieces on their footprints."""
import math
from mathutils import Vector, Matrix
from trees_ac import rgb
from kit import col_fn, shade, rbox, lathe, tube, cyl, xform, rot
from folks import ball
from furn_kit import *

BRASS, IRON, OAK, PORCELAIN = '#d8a848', '#4a4c52', '#a8743e', '#f8f4ec'


def ring(mb, c, r, t, color, axis='y', seg=28, a0=0.0, a1=math.tau):
    """a tube bent round in a circle (in the xz plane facing -y, or the xy plane lying flat: axis 'z')"""
    pts = []
    for k in range(seg + 1):
        a = a0 + (a1 - a0) * k / seg
        u, v = math.cos(a) * r, math.sin(a) * r
        pts.append((c[0] + u, c[1], c[2] + v) if axis == 'y' else (c[0] + u, c[1] + v, c[2]))
    tube(mb, pts, t, color if callable(color) else shade(color), seg=8)


def disc(mb, c, r, t, color, prof=None, seg=28):
    """a round thing facing the room (-y): turned round the y axis, its front t in front of c (prof: [(radius, depth), ...]
    from the back, in place of a flat disc)"""
    m = len(mb.v)
    lathe(mb, prof or [(r, 0.0), (r, t), (0.0, t)], color, seg=seg)
    xform(mb, m, Matrix.Translation(c) @ rot(x=-math.pi / 2))


@item('ship_wheel', 1, 1)
def ship_wheel(P):
    """A ship's wheel on the wall: a wooden rim with eight spokes running out past it into handles, a brass hub."""
    mb = P.move          # (the wheel is its own part, turned about its hub by the game; the bracket stays put)
    R = 0.3
    ring(mb, (0, -0.06, 0), R, 0.035, wood(OAK, 'z'))
    ring(mb, (0, -0.06, 0), R * 0.55, 0.018, wood(OAK, 'z'))
    for k in range(8):
        a = k / 8 * math.tau
        ca, sa = math.cos(a), math.sin(a)
        tube(mb, [(ca * 0.05, -0.06, sa * 0.05), (ca * (R + 0.02), -0.06, sa * (R + 0.02))], 0.016, wood(OAK, 'z'), seg=6)
    for k in range(8):
        a = k / 8 * math.tau
        ca, sa = math.cos(a), math.sin(a)
        tube(mb, [(ca * (R + 0.02), -0.06, sa * (R + 0.02)), (ca * (R + 0.12), -0.06, sa * (R + 0.12))], 0.024, wood('#8a5a30', 'z'), seg=8, r1=0.016)
    disc(mb, (0, -0.03, 0), 0.07, 0.06, metal(BRASS), prof=[(0.07, 0.0), (0.07, 0.04), (0.055, 0.06), (0.0, 0.065)], seg=16)
    # (the wall bracket behind)
    rbox(P.main, -0.04, -0.03, -0.04, 0.04, 0.0, 0.04, metal(IRON), r=0.01)


@item('porthole', 1, 1)
def porthole(P):
    """A brass porthole: a thick ring with bolts round it, the glass over a sea-blue view (glossy)."""
    mb = P.main
    R = 0.3
    disc(P.gloss, (0, 0, 0), R, 0.08, metal(BRASS), prof=[(R + 0.06, 0.0), (R + 0.06, 0.05), (R + 0.03, 0.08), (R - 0.02, 0.08), (R - 0.04, 0.05), (R - 0.04, 0.0)], seg=36)
    for k in range(10):
        a = k / 10 * math.tau
        ball(mb, (math.cos(a) * (R + 0.02), -0.085, math.sin(a) * (R + 0.02)), 0.018, '#a87a2a', sub=1)

    def view(p, n, z0=0, z1=1):
        t = max(0.0, min(1.0, (p.z + R) / (2 * R)))
        return rgb('#2a6a9a').lerp(rgb('#9ad4f0'), t)
    disc(mb, (0, -0.005, 0), R - 0.03, 0.01, view, seg=32)
    disc(P.clear, (0, -0.03, 0), R - 0.03, 0.005, shade('#e8f6fc'), seg=32)


@item('anchor_deco', 1, 1)
def anchor_deco(P):
    """An iron anchor standing on a coil of rope: the shank with its stock across the top and a ring, the arms curving up
    to their flukes at the bottom."""
    mb = P.main
    for k in range(4):
        ring(mb, (0, 0, 0.035 + k * 0.05), 0.3 - k * 0.04, 0.03, fabric('#c8a878', seed=k), axis='z', seg=24)
    iron = metal(IRON)
    tube(mb, [(0, 0, 0.16), (0, 0, 1.05)], 0.035, iron, seg=10)
    tube(mb, [(-0.22, 0, 0.92), (0.22, 0, 0.92)], 0.028, iron, seg=8)
    for s in (-1, 1):
        ball(mb, (s * 0.23, 0, 0.92), 0.04, IRON, sub=1)
    ring(mb, (0, 0, 1.12), 0.07, 0.018, iron)
    ring(mb, (0, 0, 0.42), 0.26, 0.032, iron, a0=math.pi * 1.05, a1=math.pi * 1.95, seg=18)
    for s in (-1, 1):
        x, z = math.cos(math.pi * (1.5 + s * 0.45)) * 0.26, 0.42 + math.sin(math.pi * (1.5 + s * 0.45)) * 0.26
        tube(mb, [(x, 0, z), (x + s * 0.07, 0, z + 0.07)], 0.045, iron, seg=6, r1=0.012)


@item('teacup_chair', 1, 1)
def teacup_chair(P):
    """A teacup big enough to sit in, on its saucer: white porcelain with a pink band and a gold rim, a handle, a soft pink
    cushion inside."""
    mb = P.main
    lathe(P.gloss, [(0.0, 0.0), (0.44, 0.0), (0.46, 0.03), (0.42, 0.07), (0.25, 0.08), (0.0, 0.08)], paint(PORCELAIN), seg=36)

    def cup(p, n, z0=0, z1=1):
        if 0.52 < p.z < 0.6:
            return rgb('#f08aa8')
        return rgb(PORCELAIN) * (1 - 0.08 * max(0.0, -n.z))
    lathe(P.gloss, [(0.18, 0.08), (0.26, 0.12), (0.36, 0.24), (0.41, 0.42), (0.42, 0.62), (0.4, 0.62), (0.39, 0.44), (0.34, 0.28), (0.25, 0.2), (0.0, 0.2)], cup, seg=36)
    ring(P.gloss, (0, 0, 0.625), 0.41, 0.014, metal(BRASS), axis='z', seg=36)
    ring(P.gloss, (0.42, 0, 0.4), 0.12, 0.035, paint(PORCELAIN), a0=-math.pi * 0.5, a1=math.pi * 0.5, seg=14)
    lathe(mb, [(0.0, 0.2), (0.34, 0.2), (0.36, 0.26), (0.32, 0.36), (0.0, 0.38)], fabric('#f4a8c0'), seg=28)
    ball(mb, (0, 0.06, 0.38), (0.03, 0.03, 0.02), '#e07898', sub=1)
    P.top(0.38)


@item('teapot_lamp', 1, 1)
def teapot_lamp(P):
    """A teapot as big as a lamp, its lid glowing warm: a round blue-and-white pot with a spout and a handle, a knob on the
    lid lit from inside."""
    mb = P.main

    def pot(p, n, z0=0, z1=1):
        b = 0.5 + 0.5 * math.sin(math.atan2(p.y, p.x) * 6)
        return rgb(PORCELAIN).lerp(rgb('#3a6ab8'), 0.85 if 0.3 < p.z < 0.38 else 0.18 * b) * (1 - 0.08 * max(0.0, -n.z))
    lathe(P.gloss, [(0.0, 0.0), (0.18, 0.0), (0.2, 0.03), (0.3, 0.14), (0.34, 0.32), (0.3, 0.5), (0.2, 0.6), (0.16, 0.62), (0.0, 0.62)], pot, seg=32)
    tube(P.gloss, [(0.28, 0, 0.2), (0.42, 0, 0.36), (0.46, 0, 0.5), (0.52, 0, 0.56)], 0.04, paint(PORCELAIN), seg=10, r1=0.026)
    ring(P.gloss, (-0.32, 0, 0.36), 0.12, 0.03, paint('#3a6ab8'), a0=math.pi * 0.5, a1=math.pi * 1.5, seg=14)
    lathe(P.glow, [(0.0, 0.62), (0.15, 0.62), (0.13, 0.68), (0.06, 0.72), (0.0, 0.73)], '#ffe2a0', seg=24)
    ball(P.glow, (0, 0, 0.78), 0.05, '#fff2c8', sub=2)


@item('plate_rack', 2, 1)
def plate_rack(P):
    """A wooden rack on the wall with two rows of plates standing in it and cups hanging under: Muggy's old neighbors,
    Muggy says. (Two tiles wide.)"""
    mb, w = P.main, wood('#c08a52')
    rbox(mb, -0.92, -0.02, -0.42, 0.92, 0.0, 0.42, wood('#a8743e', 'x'), r=0.02)
    for z in (-0.12, 0.26):
        rbox(mb, -0.9, -0.16, z - 0.02, 0.9, -0.02, z + 0.01, w, r=0.01)
        rbox(mb, -0.9, -0.17, z + 0.06, 0.9, -0.15, z + 0.08, w, r=0.006)
    cols = ['#f8f4ec', '#bcd8f0', '#f8f4ec', '#f4c8d4', '#f8f4ec', '#d8ecc4']
    for row, z in enumerate((-0.12, 0.26)):
        for k in range(6):
            x = -0.75 + k * 0.3
            c = cols[(k + row) % 6]

            disc(P.gloss, (x, -0.06, z + 0.13), 0.13, 0.03, paint(c), prof=[(0.13, 0.0), (0.13, 0.02), (0.11, 0.03), (0.0, 0.025)], seg=24)
            ring(P.gloss, (x, -0.091, z + 0.13), 0.1, 0.006, shade('#3a6ab8'), seg=20)
    for k in range(5):
        x = -0.6 + k * 0.3
        tube(mb, [(x, -0.04, -0.34), (x, -0.06, -0.3)], 0.008, metal(BRASS), seg=4)
        lathe(P.gloss, [(0.0, -0.42), (0.045, -0.42), (0.055, -0.36), (0.05, -0.34), (0.0, -0.34)], paint(cols[k]), c=(x, -0.08, 0), seg=16)


@item('china_cabinet', 2, 1)
def china_cabinet(P):
    """A tall china cabinet: a painted wooden case on legs with two glass doors, cups and plates on its shelves, a
    scalloped crown."""
    mb = P.main
    W, D, H = P.W / 2, P.D / 2, 1.62
    body = paint('#f0e6d4')
    rbox(mb, -W, -D, 0.1, W, D, H, body, r=0.03)
    legs(mb, -W, W, -D, D, 0.12, wood('#a8743e'), r=0.035, turned=True)
    for k in range(5):
        x = -W + (k + 0.5) * (2 * W / 5)
        ball(mb, (x, -D + 0.04, H + 0.03), (0.14, 0.05, 0.06), '#f0e6d4', sub=2)
    rbox(mb, -W + 0.06, -D - 0.005, 0.18, W - 0.06, -D + 0.04, 0.5, paint('#e4d6c0'), r=0.02)
    for s in (-1, 1):
        x0, x1 = (0.02, W - 0.06) if s > 0 else (-W + 0.06, -0.02)
        rbox(P.clear, x0 + 0.03, -D - 0.01, 0.58, x1 - 0.03, -D + 0.005, H - 0.08, paint('#d8eef4'), r=0.01, mid=0)
        for z0, z1 in ((0.55, 0.58), (H - 0.08, H - 0.05)):
            rbox(mb, x0, -D - 0.02, z0, x1, -D + 0.01, z1, paint('#d8c8b0'), r=0.008)
        ball(P.gloss, ((x1 - 0.06) if s < 0 else (x0 + 0.06), -D - 0.03, 1.05), 0.022, BRASS, sub=1)
    for z in (0.58, 0.92, 1.26):
        rbox(mb, -W + 0.06, -D + 0.06, z - 0.02, W - 0.06, D - 0.04, z, paint('#e4d6c0'), r=0.006)
    r = P.rng
    for z in (0.58, 0.92, 1.26):
        for k in range(6):
            x = -W + 0.18 + k * ((2 * W - 0.36) / 5)
            c = r.choice(['#f8f4ec', '#bcd8f0', '#f4c8d4', '#d8ecc4', '#f8e0a0'])
            if (k + int(z * 10)) % 3 == 0:
                m = len(P.gloss.v)
                disc(P.gloss, (x, -D + 0.32, z + 0.105), 0.1, 0.02, paint(c), seg=20)
                xform(P.gloss, m, rot(x=-0.25, at=(x, -D + 0.32, z)))
            else:
                lathe(P.gloss, [(0.0, z), (0.045, z), (0.06, z + 0.08), (0.055, z + 0.1), (0.0, z + 0.1)], paint(c), c=(x, -D + 0.22, 0), seg=14)
    P.top(H + 0.05)
