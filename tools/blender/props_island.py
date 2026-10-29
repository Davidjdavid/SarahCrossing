"""The island's props as miniatures, in the dollhouse look: painted wood with a grain, soft rounded edges, warm stone,
bright toy colors, every one a little darker underneath. One model per kind of prop on Sarah's island (scripts/island/
plan.mjs): the square's fountain, drinking fountain, notice board, plaque, trash cans and David's statue; signposts; the
farm's windmill (its sails a model of their own, to turn), well, scarecrow, hay, crate, wheelbarrow and trough; the
neighborhood's birdhouses and flamingos; the forest's logs, tents, campfire and picnic table; the lookout's telescope
and the harbor's coin viewer and tackle; the beach's driftwood, rocks, bonfire, ice cream stand, sandcastle and
volleyball net; Basil's noodle cart; barrels.

Colors are in the mesh (no baking). A part named *_glow (flames) is drawn unlit; *_water is water.

    python tools/blender/props_island.py [--preview DIR] [--only NAME]
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from mathutils import Vector, Matrix, Euler, noise
from common import *
from trees_ac import MB, vmat, rgb, bmesh_ico, anchor_empties, LIGHT
from kit import col_fn, shade, rbox, lathe, cyl, ball, tube, slab, plank_row, flame, rocks, xform, rot
from folks import ball as sball, surf, superq       # (sball: a ball whose triangles share their corners, a sixth of kit.ball's weight)
import kit
kit.DETAIL['lite'] = True

WOOD = '#a8743e'
WOOD_D = '#7a5230'
WOOD_L = '#c8945a'
STONE = '#c4bcae'
CREAM = '#f2e8d2'
IRON = '#34343a'


def wood(c=WOOD, axis='z', seed=0):
    return col_fn(c, grain=axis, seed=seed)


def stone(c=STONE, seed=0):
    return col_fn(c, mottle=0.1, seed=seed)


def gable(mb, x0, x1, y0, y1, z, rise, color, over=0.06, t=0.05):
    """A gable roof over x0..x1 (its ridge along x) from the eaves at z up rise: two thick boards meeting at the ridge."""
    ym = (y1 - y0) / 2 + y0
    run = (y1 - y0) / 2 + over
    ang = math.atan2(rise, (y1 - y0) / 2)
    L = run / math.cos(ang)
    for s in (-1, 1):
        m = len(mb.v)
        rbox(mb, x0 - over, 0, -t / 2, x1 + over, L, t / 2, color, r=0.02)
        # local +y runs down the slope: toward +y world on one side, -y on the other
        th = -ang if s > 0 else math.pi + ang
        xform(mb, m, Matrix.Translation((0, ym, z + rise)) @ Euler((th, 0, 0)).to_matrix().to_4x4())


def checker(a, b, size):
    A, B = rgb(a), rgb(b)

    def f(p, n):
        return A if (int(math.floor(p.x / size)) + int(math.floor(p.y / size))) % 2 else B
    return f


def stripes(a, b, n, around=True):
    A, B = rgb(a), rgb(b)

    def f(p, nn):
        ang = math.atan2(p.y, p.x)
        return A if int((ang / math.tau + 0.5) * n) % 2 else B
    return f


def lbox(mb, x0, y0, z0, x1, y1, z1, color, r=0.012):
    """A light rounded box: each face a flat rectangle inset by r, joined to its neighbours by a bevel shaded round (24
    points, a quarter of a rounded box's), for small boards, plates and trims."""
    import itertools
    fn = color if callable(color) else shade(color)
    r = max(0.0005, min(r, (x1 - x0) * 0.45, (y1 - y0) * 0.45, (z1 - z0) * 0.45))
    lo, hi = (x0, y0, z0), (x1, y1, z1)
    pts, nrm, idx = [], [], {}
    corners = list(itertools.product((0, 1), (0, 1), (0, 1)))
    for a in range(3):
        for s in (0, 1):
            n = [0.0, 0.0, 0.0]
            n[a] = 1.0 if s else -1.0
            for c in corners:
                if c[a] != s:
                    continue
                p = [lo[k] + r if c[k] == 0 else hi[k] - r for k in range(3)]
                p[a] = hi[a] if s else lo[a]
                idx[(a, s, c)] = len(pts)
                pts.append(Vector(p))
                nrm.append(Vector(n))
    faces = []
    for a in range(3):
        b, d = (a + 1) % 3, (a + 2) % 3
        for s in (0, 1):
            q = []
            for cb, cd in ((0, 0), (1, 0), (1, 1), (0, 1)):
                c = [0, 0, 0]
                c[a], c[b], c[d] = s, cb, cd
                q.append(idx[(a, s, tuple(c))])
            faces += [(q[0], q[1], q[2]), (q[0], q[2], q[3])]
    for e in range(3):
        b, d = (e + 1) % 3, (e + 2) % 3
        for sb in (0, 1):
            for sd in (0, 1):
                c0 = [0, 0, 0]
                c0[b], c0[d] = sb, sd
                c1 = list(c0)
                c1[e] = 1
                c0, c1 = tuple(c0), tuple(c1)
                q = [idx[(b, sb, c0)], idx[(b, sb, c1)], idx[(d, sd, c1)], idx[(d, sd, c0)]]
                faces += [(q[0], q[1], q[2]), (q[0], q[2], q[3])]
    for c in corners:
        faces.append((idx[(0, c[0], c)], idx[(1, c[1], c)], idx[(2, c[2], c)]))
    cols = [fn(p, n, z0, z1) if fn.__code__.co_argcount > 2 else fn(p, n) for p, n in zip(pts, nrm)]
    mb.add(pts, cols, nrm, faces)


def sheet(mb, F, us, vs, col, thick=0.02, dark=0.8, ends=False):
    """A sheet of cloth with a little thickness: F(u, v) its top surface over the rows us and the columns vs (each from 0
    to 1), col(u, v) its color; the underside a shade darker and its long edges (v 0 and 1) closed, its ends too with
    ends. The normals come from the surface."""
    e = 1e-3

    def nrm(u, v):
        du = F(min(1.0, u + e), v) - F(max(0.0, u - e), v)
        dv = F(u, min(1.0, v + e)) - F(u, max(0.0, v - e))
        return du.cross(dv).normalized()
    flip = -1.0 if nrm(0.5, 0.5).z < 0 else 1.0
    nu, nv = len(us), len(vs)
    T = [[F(u, v) for v in vs] for u in us]
    N = [[nrm(u, v) * flip for v in vs] for u in us]
    C = [[Vector(col(u, v)) for v in vs] for u in us]
    quads = []
    for i in range(nu - 1):
        for j in range(nv - 1):
            a, b, c, d = i * nv + j, (i + 1) * nv + j, (i + 1) * nv + j + 1, i * nv + j + 1
            quads += [(a, b, c), (a, c, d)]
    flat = lambda G: [g for row in G for g in row]
    mb.add(flat(T), flat(C), flat(N), quads)
    mb.add([p - n * thick for p, n in zip(flat(T), flat(N))], [c * dark for c in flat(C)], [-n for n in flat(N)], quads)
    # the edges: a strip from the top's border to the underside's, facing out
    # (each border with the step inward from it: across for a long edge, along for an end)
    borders = [([(i, 0) for i in range(nu)], (0, 1)), ([(i, nv - 1) for i in range(nu)], (0, -1))]
    if ends:
        borders += [([(0, j) for j in range(nv)], (1, 0)), ([(nu - 1, j) for j in range(nv)], (-1, 0))]
    for line, (si, sj) in borders:
        pts, nn, cc, ff = [], [], [], []
        for k, (i, j) in enumerate(line):
            p, n = T[i][j], N[i][j]
            o = p - T[i + si][j + sj]
            o = (o - n * o.dot(n)).normalized()
            pts += [p, p - n * thick]
            nn += [o, o]
            cc += [C[i][j] * 0.9, C[i][j] * 0.75]
            if k:
                b = 2 * k
                ff += [(b - 2, b, b + 1), (b - 2, b + 1, b - 1)]
        mb.add(pts, cc, nn, ff)


# ---------------------------------------------------------------- the square
def fountain():
    """A small fountain (smaller and simpler than the square's grand one, but a fountain): a basin in eight soft lobes on a
    granite step, its wall banded and its rim a moulded cap; a turned pedestal with a scalloped bowl, a little column with
    a smaller bowl above it and a finial on top; water in all three, spilling from the bowls in arcs. The game throws its
    spray from the top bowl's water (EnvSpray.TOPS: 1.16 up, falling to the basin's at 0.4)."""
    mb, water = MB(), MB()
    pale, mid, dark = stone('#d6cdbd'), stone('#c2b8a6', seed=2), stone('#a89f90', seed=3)

    def lobes(m, n, amp, r0):
        """the vertices added since m pushed out into n soft lobes (more toward the outside, none inside r0)"""
        for i in range(m, len(mb.v)):
            v = mb.v[i]
            r = math.hypot(v.x, v.y)
            if r > r0:
                k = 1 + amp * math.cos(math.atan2(v.y, v.x) * n) * min(1.0, (r - r0) / 0.3)
                mb.v[i] = Vector((v.x * k, v.y * k, v.z))
    # the step and the basin: its wall with a band and a groove, the moulded cap rolling over inward
    lathe(mb, [(1.4, 0.0), (1.53, 0.0), (1.55, 0.05), (1.47, 0.08)], col_fn('#6a6e76', mottle=0.15), seg=40, cap_top=False)
    m = len(mb.v)
    lathe(mb, [(1.45, 0.06), (1.45, 0.13), (1.41, 0.16), (1.41, 0.3), (1.44, 0.33), (1.42, 0.37),
               (1.47, 0.41), (1.48, 0.45), (1.42, 0.5), (1.33, 0.49), (1.3, 0.44), (1.3, 0.3)], pale, seg=40, cap_top=False)
    lathe(mb, [(1.3, 0.3), (0.3, 0.3)], dark, seg=20, cap_top=False)
    lobes(m, 8, 0.035, 1.0)
    # the pedestal: a turned baluster, a bulb, collars
    lathe(mb, [(0.0, 0.3), (0.34, 0.3), (0.33, 0.36), (0.25, 0.42), (0.27, 0.5), (0.18, 0.57), (0.21, 0.65), (0.14, 0.72)], pale, seg=20, cap_top=False)
    # the lower bowl, its rim in scallops, and its water
    m = len(mb.v)
    lathe(mb, [(0.14, 0.7), (0.3, 0.72), (0.52, 0.78), (0.64, 0.84), (0.68, 0.88), (0.65, 0.91), (0.58, 0.88)], pale, seg=40, cap_top=False)
    lathe(mb, [(0.58, 0.88), (0.0, 0.82)], mid, seg=40, cap_top=False)
    lobes(m, 8, 0.06, 0.45)
    # the column, the upper bowl, the finial: a pinecone on a little collar
    lathe(mb, [(0.0, 0.82), (0.13, 0.82), (0.1, 0.88), (0.08, 0.98), (0.1, 1.02), (0.08, 1.06)], pale, seg=20, cap_top=False)
    m = len(mb.v)
    lathe(mb, [(0.08, 1.05), (0.2, 1.08), (0.31, 1.13), (0.35, 1.17), (0.33, 1.2), (0.28, 1.18)], pale, seg=32, cap_top=False)
    lathe(mb, [(0.28, 1.18), (0.0, 1.13)], mid, seg=32, cap_top=False)
    lobes(m, 8, 0.07, 0.2)
    lathe(mb, [(0.0, 1.14), (0.07, 1.15), (0.08, 1.2), (0.05, 1.24), (0.06, 1.27)], pale, seg=14, cap_top=False)
    pc = lambda p, n, z0=0, z1=1: rgb('#d6cdbd') * (0.86 + 0.14 * abs(math.sin(math.atan2(p.y, p.x) * 3 + p.z * 40)))
    lathe(mb, [(0.06, 1.26), (0.085, 1.3), (0.09, 1.36), (0.07, 1.42), (0.035, 1.47), (0.0, 1.5)], pc, seg=14)
    sball(mb, (0, 0, 1.52), 0.03, pale, sub=1)
    # the water: the basin's (two lily pads on it), each bowl's, and arcs spilling from the bowls
    m = len(water.v)
    lathe(water, [(1.31, 0.4), (0.3, 0.4)], col_fn('#78c4e4'), seg=40, cap_top=False)
    lathe(water, [(0.6, 0.87), (0.0, 0.87)], col_fn('#82caea'), seg=40, cap_top=False)
    lathe(water, [(0.29, 1.16), (0.0, 1.16)], col_fn('#8ad0ec'), seg=32, cap_top=False)
    for i in range(m, len(water.v)):
        v = water.v[i]
        r = math.hypot(v.x, v.y)
        amp = 0.035 if v.z < 0.5 else 0.06 if v.z < 1.0 else 0.07
        k = 1 + amp * math.cos(math.atan2(v.y, v.x) * 8) * min(1.0, max(0.0, r - (1.0 if v.z < 0.5 else 0.45 if v.z < 1.0 else 0.2)) / 0.3)
        water.v[i] = Vector((v.x * k, v.y * k, v.z))
    for (x, y, rr) in ((0.82, -0.62, 0.11), (-0.95, 0.35, 0.09)):
        lathe(water, [(rr, 0.405), (rr * 0.95, 0.415), (0.0, 0.418)], col_fn('#6aa84a'), c=(x, y, 0), seg=12, cap_top=False)
    for k in range(8):
        a = k / 8 * math.tau
        d = Vector((math.cos(a), math.sin(a), 0))
        pts = [d * (0.69 + 0.32 * t) + Vector((0, 0, 0.88 - 0.46 * t * t)) for t in (0, 0.2, 0.4, 0.6, 0.8, 1.0)]
        tube(water, pts, 0.032, col_fn('#a8e0f4'), seg=5, r1=0.018)
        pts = [d * (0.37 + 0.14 * t) + Vector((0, 0, 1.19 - 0.3 * t * t)) for t in (0, 0.33, 0.67, 1.0)]
        tube(water, pts, 0.022, col_fn('#b0e4f6'), seg=5, r1=0.013)
    return [(mb, 'stone'), (water, 'water')]


def fountain_grand():
    """The square's fountain (David, 27 October: the fountain larger, more detailed and not walked through): a round
    basin on a granite step, its rim a moulded cap of pale stone, four bronze fish on the rim spouting into it, a few
    lily pads; in the middle a turned pedestal carrying a wide scalloped bowl and a small one above it, water spilling
    from both in arcs and a jet from the pinecone on top. 3.5 tiles across, its middle at the origin."""
    mb, br, water = MB(), MB(), MB()
    pale, dark = stone('#cfc6b6'), stone('#a89f90')
    # the step and the basin wall, its cap moulded, a darker band at its foot
    lathe(mb, [(1.62, 0.0), (1.76, 0.0), (1.78, 0.06), (1.7, 0.09), (1.66, 0.09)], col_fn('#6a6e76', mottle=0.15), seg=56, cap_top=False)
    lathe(mb, [(1.66, 0.09), (1.66, 0.16), (1.62, 0.2), (1.62, 0.42), (1.68, 0.46), (1.7, 0.52), (1.66, 0.56), (1.5, 0.56), (1.47, 0.52), (1.48, 0.46)], pale, seg=56, cap_top=False)
    lathe(mb, [(1.48, 0.46), (1.48, 0.12), (0.0, 0.12)], dark, seg=56, cap_top=False)
    # the pedestal, its lower bowl (scalloped: its rim rises and falls), the upper column and bowl, the pinecone
    lathe(mb, [(0.0, 0.12), (0.42, 0.12), (0.4, 0.2), (0.3, 0.26), (0.24, 0.5), (0.28, 0.56), (0.22, 0.62), (0.2, 0.95)], pale, seg=32, cap_top=False)
    m = len(mb.v)
    lathe(mb, [(0.2, 0.95), (0.4, 0.98), (0.7, 1.06), (0.9, 1.16), (0.94, 1.22), (0.9, 1.25), (0.82, 1.2)], pale, seg=48, cap_top=False)
    for i in range(m, len(mb.v)):
        v = mb.v[i]
        r = math.hypot(v.x, v.y)
        if r > 0.6:
            mb.v[i] = Vector((v.x, v.y, v.z + 0.035 * math.cos(math.atan2(v.y, v.x) * 8) * (r - 0.6) / 0.34))
    lathe(mb, [(0.82, 1.2), (0.0, 1.12)], dark, seg=48, cap_top=False)
    lathe(mb, [(0.16, 1.12), (0.13, 1.3), (0.17, 1.36), (0.11, 1.42), (0.1, 1.6)], pale, seg=24, cap_top=False)
    lathe(mb, [(0.1, 1.6), (0.26, 1.63), (0.44, 1.7), (0.47, 1.75), (0.43, 1.77), (0.38, 1.73)], pale, seg=32, cap_top=False)
    lathe(mb, [(0.38, 1.73), (0.0, 1.69)], dark, seg=32, cap_top=False)
    lathe(br, [(0.0, 1.74), (0.07, 1.76), (0.09, 1.84), (0.07, 1.92), (0.03, 1.98), (0.0, 2.0)], col_fn('#8a6a3a', under=0.1), seg=16)
    # the water: the basin's, each bowl's, sheets spilling from the bowls, a jet from the top
    lathe(water, [(1.49, 0.42), (0.36, 0.42)], col_fn('#6cbce0'), seg=56, cap_top=False)
    lathe(water, [(0.83, 1.19), (0.0, 1.19)], col_fn('#82caea'), seg=48, cap_top=False)
    lathe(water, [(0.39, 1.74), (0.0, 1.74)], col_fn('#8ad0ec'), seg=32, cap_top=False)
    for k in range(16):
        a = (k + 0.5) / 16 * math.tau
        d = Vector((math.cos(a), math.sin(a), 0))
        pts = [d * (0.92 + 0.3 * t) + Vector((0, 0, 1.2 - 0.78 * t * t)) for t in (0, 0.2, 0.4, 0.6, 0.8, 1.0)]
        tube(water, pts, 0.04, col_fn('#a8e0f4'), seg=6, r1=0.022)
    for k in range(8):
        a = k / 8 * math.tau
        d = Vector((math.cos(a), math.sin(a), 0))
        pts = [d * (0.46 + 0.16 * t) + Vector((0, 0, 1.75 - 0.5 * t * t)) for t in (0, 0.25, 0.5, 0.75, 1.0)]
        tube(water, pts, 0.03, col_fn('#b0e4f6'), seg=6, r1=0.018)
    tube(water, [(0, 0, 1.98), (0, 0, 2.18), (0.02, 0, 2.26)], 0.03, col_fn('#c8eefa'), seg=8, r1=0.012)
    for k in range(6):
        a = k / 6 * math.tau
        d = Vector((math.cos(a), math.sin(a), 0))
        tube(water, [Vector((0, 0, 2.24)), d * 0.12 + Vector((0, 0, 2.28)), d * 0.24 + Vector((0, 0, 2.12)), d * 0.3 + Vector((0, 0, 1.9))], 0.016, col_fn('#c8eefa'), seg=5, r1=0.008)
    # four bronze fish on the rim, leaping, mouths toward the middle, each spouting an arc into the basin
    bronze = col_fn('#6a8a6a', under=0.12, mottle=0.1)
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2
        d = Vector((math.cos(a), math.sin(a), 0))
        base = d * 1.58 + Vector((0, 0, 0.56))
        body = [base, base - d * 0.08 + Vector((0, 0, 0.14)), base - d * 0.18 + Vector((0, 0, 0.22)), base - d * 0.3 + Vector((0, 0, 0.2))]
        tube(br, body, 0.07, bronze, seg=10, r1=0.045)
        side = Vector((-d.y, d.x, 0))
        for sgn in (-1, 1):
            tube(br, [base + Vector((0, 0, 0.02)), base + d * 0.08 + side * sgn * 0.07 + Vector((0, 0, -0.02))], 0.02, bronze, seg=5, r1=0.008)
        ball(br, base - d * 0.3 + Vector((0, 0, 0.2)), 0.05, bronze, sub=2)
        mouth = base - d * 0.36 + Vector((0, 0, 0.19))
        tube(water, [mouth, mouth - d * 0.18 + Vector((0, 0, 0.06)), mouth - d * 0.36 + Vector((0, 0, -0.04)), mouth - d * 0.46 + Vector((0, 0, -0.2))], 0.022, col_fn('#b0e4f6'), seg=6, r1=0.012)
    # lily pads on the basin's water
    rng = random.Random(3)
    for k in range(5):
        a = rng.uniform(0, math.tau)
        r = rng.uniform(0.6, 1.25)
        c = (math.cos(a) * r, math.sin(a) * r, 0.425)
        lathe(br, [(0.0, 0.0), (0.12, 0.0), (0.12, 0.012), (0.0, 0.016)], col_fn('#4a9a3a'), c=c, seg=14)
        if k % 2 == 0:
            ball(br, (c[0], c[1], 0.46), (0.04, 0.04, 0.03), shade('#f4b8d0'), sub=1)
    return [(mb, 'stone'), (br, 'bronze'), (water, 'water')]


def drinkfountain():
    """An old park drinking fountain (David, 27 October: the stone one was lost against the cobbles): a dark granite step,
    a fluted column painted green, a brass bowl and spout, a red button."""
    mb, gl, water = MB(), MB(), MB()
    rbox(mb, -0.2, -0.2, 0, 0.2, 0.2, 0.07, col_fn('#4e525a', mottle=0.12), r=0.025)
    paint = lambda p, n, *_: rgb('#2f7a5c') * (0.8 + 0.2 * (math.sin(math.atan2(p.y, p.x) * 12) > 0) + 0.12 * max(0.0, n.z))
    lathe(mb, [(0.15, 0.07), (0.15, 0.12), (0.11, 0.16), (0.09, 0.62), (0.11, 0.66), (0.14, 0.72)], paint, seg=24, cap_top=False)
    lathe(gl, [(0.14, 0.72), (0.24, 0.8), (0.26, 0.87), (0.22, 0.87), (0.14, 0.82), (0.0, 0.81)], col_fn('#c99a3e', under=0.1), seg=24)
    tube(gl, [(0.0, 0.0, 0.82), (0.0, 0.0, 0.95), (0.05, 0.0, 0.99), (0.09, 0.0, 0.96)], 0.02, shade('#d8aa48'), seg=8)
    rbox(mb, -0.035, -0.13, 0.6, 0.035, -0.09, 0.66, shade('#d83a3a'), r=0.012)
    tube(water, [(0.09, 0.0, 0.955), (0.12, 0.0, 0.94), (0.14, 0.0, 0.9), (0.15, 0.0, 0.86)], 0.012, col_fn('#9ad8f0'), seg=6, r1=0.006)
    return [(mb, 'main'), (gl, 'gloss'), (water, 'water')]


def planter_box():
    """A raised planter for growing crops (David, 27 October: the garden spots by Sarah's house were lost under the grass):
    a box of honey planks on four corner posts, a cap rail round its top, dark crumbly soil heaped a little inside. As
    wide as most of a tile, knee high to Sarah; what grows in it stands on the soil (its top at 0.3)."""
    mb = MB()
    H, R = 0.3, 0.42
    for x0, y0, x1, y1, ax in ((-R, -R, R, -R + 0.05, 'x'), (-R, R - 0.05, R, R, 'x'), (-R, -R, -R + 0.05, R, 'y'), (R - 0.05, -R, R, R, 'y')):
        for k, (z0, z1) in enumerate(((0.0, 0.13), (0.14, 0.27))):
            rbox(mb, x0, y0, z0, x1, y1, z1, wood(WOOD if k else WOOD_D, ax), r=0.012)
    for sx in (-1, 1):
        for sy in (-1, 1):
            rbox(mb, sx * R - 0.04, sy * R - 0.04, 0, sx * R + 0.04, sy * R + 0.04, H + 0.02, wood(WOOD_D), r=0.015)
    for x0, y0, x1, y1, ax in ((-R - 0.03, -R - 0.03, R + 0.03, -R + 0.05, 'x'), (-R - 0.03, R - 0.05, R + 0.03, R + 0.03, 'x'),
                               (-R - 0.03, -R, -R + 0.05, R, 'y'), (R - 0.05, -R, R + 0.03, R, 'y')):
        rbox(mb, x0, y0, H - 0.03, x1, y1, H, wood('#c08a52', ax), r=0.01)
    # the soil: a low mound, crumbly and dark, a few lighter clods
    soil = lambda p, n, *_: rgb('#4a3020').lerp(rgb('#6a4630'), 0.5 + 0.5 * noise.noise(p * 18)) * (0.82 + 0.18 * max(0.0, n.z))
    rbox(mb, -R + 0.045, -R + 0.045, H - 0.09, R - 0.045, R - 0.045, H - 0.025, soil, r=0.02)
    ball(mb, (0, 0, H - 0.035), (0.31, 0.31, 0.035), soil, sub=2)
    rng = random.Random(5)
    for _ in range(9):
        x, y = rng.uniform(-0.28, 0.28), rng.uniform(-0.28, 0.28)
        ball(mb, (x, y, H - 0.005), (0.03, 0.03, 0.015), shade('#7a5238'), sub=1)
    return [(mb, 'main')]


def board():
    """The notice board: a little roofed frame on two legs, papers pinned on cork."""
    mb = MB()
    for x in (-0.62, 0.62):
        rbox(mb, x - 0.05, -0.05, 0, x + 0.05, 0.05, 1.55, wood(WOOD_D), r=0.02)
    rbox(mb, -0.62, -0.06, 0.62, 0.62, 0.04, 1.4, wood(WOOD, 'x'), r=0.03)
    rbox(mb, -0.55, -0.075, 0.68, 0.55, -0.04, 1.34, col_fn('#c89a64', mottle=0.12), r=0.01)
    rng = random.Random(7)
    for k in range(6):
        x, z = rng.uniform(-0.42, 0.42), rng.uniform(0.78, 1.22)
        w, h = rng.uniform(0.12, 0.2), rng.uniform(0.12, 0.18)
        c = rng.choice(['#fff8e8', '#ffd8e0', '#d8f0ff', '#fff0a8', '#e0ffd8'])
        m = len(mb.v)
        rbox(mb, x - w / 2, -0.09, z - h / 2, x + w / 2, -0.078, z + h / 2, c, r=0.004)
        xform(mb, m, rot(y=rng.uniform(-0.15, 0.15), at=(x, 0, z)))
        ball(mb, (x, -0.095, z + h / 2 - 0.02), 0.014, shade(rng.choice(['#d8302a', '#3a78d8', '#f0c020'])), sub=1)
    gable(mb, -0.72, 0.72, -0.18, 0.12, 1.5, 0.16, wood('#9a4a32', 'x'))
    return [(mb, 'main')]


def plaque():
    mb = MB()
    m = len(mb.v)
    rbox(mb, -0.3, -0.08, 0, 0.3, 0.08, 0.42, stone('#a8a094'), r=0.04)
    xform(mb, m, rot(x=-0.2, at=(0, 0, 0)))
    m = len(mb.v)
    rbox(mb, -0.22, -0.11, 0.12, 0.22, -0.085, 0.36, col_fn('#c09040', mottle=0.06), r=0.01)
    xform(mb, m, rot(x=-0.2, at=(0, 0, 0)))
    return [(mb, 'main')]


def trashcan():
    mb = MB()
    lathe(mb, [(0.2, 0.0), (0.22, 0.05), (0.23, 0.6), (0.25, 0.62), (0.25, 0.66)], col_fn('#3f7a4a', under=0.3), seg=24, cap_top=False)
    for z in (0.18, 0.42):
        lathe(mb, [(0.235, z), (0.245, z + 0.01), (0.245, z + 0.04), (0.235, z + 0.05)], shade('#2e5a36'), seg=24, cap_top=False)
    lathe(mb, [(0.26, 0.66), (0.24, 0.72), (0.16, 0.78), (0.0, 0.8)], shade('#3f7a4a'), seg=24, cap_top=False)
    tube(mb, [(-0.06, 0, 0.79), (-0.05, 0, 0.84), (0.05, 0, 0.84), (0.06, 0, 0.79)], 0.014, shade(IRON), seg=6)
    return [(mb, 'main')]


def statue():
    """David's statue: him in bronze on a stone plinth, holding up a fish (as he'd want)."""
    mb = MB()
    rbox(mb, -0.5, -0.5, 0, 0.5, 0.5, 0.18, stone('#a8a094'), r=0.03)
    rbox(mb, -0.4, -0.4, 0.18, 0.4, 0.4, 0.8, stone('#c4bcae'), r=0.03)
    rbox(mb, -0.45, -0.45, 0.8, 0.45, 0.45, 0.9, stone('#b0a89a'), r=0.03)
    rbox(mb, -0.22, -0.415, 0.36, 0.22, -0.4, 0.58, col_fn('#c09040'), r=0.005)
    return [(mb, 'main')], 'statue_doll'


def sign(kind):
    """A signpost: a post, arrow boards pointing off in different directions, a cap."""
    mb = MB()
    rbox(mb, -0.05, -0.05, 0, 0.05, 0.05, 1.5, wood(WOOD_D), r=0.02)
    ball(mb, (0, 0, 1.53), 0.065, shade('#c84a3a'))
    cols = {'trail': ['#f2e2c0', '#e8d0a0'], 'farm': ['#f0d070', '#d8a048'], 'camp': ['#c8e0a8', '#e8d0a0'],
            'club': ['#f4b8d8', '#c8b0f0'], 'bonfire': ['#f4b070', '#f0d8a0'], 'island': ['#a8d8f0', '#f2e2c0']}[kind]
    for k, (z, ang, c) in enumerate(((1.22, 0.25, cols[0]), (0.92, -0.5, cols[1]))):
        outline = [(0.0, -0.09), (0.5, -0.09), (0.62, 0.0), (0.5, 0.09), (0.0, 0.09)]
        if k == 1:
            outline = [(-u, v) for u, v in outline[::-1]]
        m = len(mb.v)
        slab(mb, [(u, v + z) for u, v in outline], 0.05, wood(c, 'x', seed=k), axis='y', at=-0.075)
        xform(mb, m, rot(z=ang, at=(0, 0, 0)))
    return [(mb, 'main')]


def sign_forsale():
    """A plot of land for sale (David, 27 October: where the neighbors still to come will live): a white post with an arm,
    a board hanging from it on two little chains, FOR SALE on the board over a little house, a stake in the grass."""
    from buildings import text
    mb = MB()
    rbox(mb, -0.05, -0.05, 0, 0.05, 0.05, 1.45, col_fn('#f4f0e8', under=0.1), r=0.02)
    rbox(mb, -0.05, -0.05, 1.32, 0.62, 0.05, 1.4, col_fn('#f4f0e8', under=0.1), r=0.02)
    ball(mb, (0, 0, 1.48), 0.05, shade('#c84a3a'))
    for x in (0.12, 0.54):
        tube(mb, [(x, -0.02, 1.32), (x, -0.02, 1.2)], 0.008, shade('#8a8a8a'), seg=4)
    rbox(mb, 0.04, -0.035, 0.72, 0.62, 0.035, 1.2, shade('#c8423a'), r=0.03)
    rbox(mb, 0.08, -0.045, 0.76, 0.58, -0.03, 1.16, col_fn('#fbf6ec'), r=0.02)
    # a little house painted under the words
    slab(mb, [(0.24, 0.9), (0.33, 0.97), (0.42, 0.9)], 0.006, shade('#c8423a'), axis='y', at=-0.052)
    rbox(mb, 0.26, -0.052, 0.8, 0.4, -0.046, 0.9, shade('#5a8ac0'), r=0.004)
    rbox(mb, -0.02, -0.02, 0, 0.02, 0.02, 0.1, wood(WOOD_D), r=0.01)
    t = text('FOR SALE', 0.33, -0.05, 1.065, 0.085, '#c8423a', depth=0.006)
    return [(mb, 'main'), t]


def sign_comingsoon():
    """The café's lot on Market Lane (David, 27 October: set aside for a new business, where a neighbor still to come will
    open a coffee shop): a board on two posts, COMING SOON over a steaming coffee cup, a striped bar across the legs."""
    from buildings import text
    mb = MB()
    for x in (-0.48, 0.48):
        rbox(mb, x - 0.05, -0.05, 0, x + 0.05, 0.05, 1.25, wood(WOOD_D), r=0.02)
    rbox(mb, -0.6, -0.05, 0.6, 0.6, 0.05, 1.22, wood('#e8d4a8', 'x'), r=0.035)
    rbox(mb, -0.54, -0.07, 0.66, 0.54, -0.045, 1.16, col_fn('#3a3430'), r=0.02)
    # the cup: a white mug with a handle, a saucer, three curls of steam
    rbox(mb, -0.1, -0.075, 0.72, 0.08, -0.06, 0.88, shade('#fbf6ec'), r=0.02)
    tube(mb, [(0.08, -0.07, 0.86), (0.13, -0.07, 0.84), (0.13, -0.07, 0.77), (0.08, -0.07, 0.75)], 0.012, shade('#fbf6ec'), seg=5)
    rbox(mb, -0.16, -0.075, 0.7, 0.14, -0.06, 0.72, shade('#e8d4a8'), r=0.008)
    for k, x in enumerate((-0.06, 0.0, 0.05)):
        tube(mb, [(x + 0.015 * math.sin(i * 1.5 + k), -0.07, 0.9 + i * 0.025) for i in range(5)], 0.006, shade('#f4f0e8'), seg=4)
    # the striped bar across the legs (something's being built)
    for i in range(6):
        x0 = -0.48 + i * 0.16
        rbox(mb, x0, -0.06, 0.3, x0 + 0.16, 0.0, 0.4, shade('#f2c230' if i % 2 else '#2e2a26'), r=0.01)
    t = text('COMING SOON', 0.0, -0.08, 1.05, 0.085, '#f4f0e8', depth=0.006)
    return [(mb, 'main'), t]


def signboard():
    """A welcome board on two legs under a little roof (the island's, the club's)."""
    mb = MB()
    for x in (-0.75, 0.75):
        rbox(mb, x - 0.06, -0.06, 0, x + 0.06, 0.06, 1.45, wood(WOOD_D), r=0.02)
    rbox(mb, -0.78, -0.05, 0.72, 0.78, 0.05, 1.3, wood('#e8d4a8', 'x'), r=0.04)
    rbox(mb, -0.7, -0.07, 0.8, 0.7, -0.045, 1.22, wood('#5a8ac0', 'x'), r=0.02)
    # a little sun and waves painted on
    ball(mb, (-0.38, -0.08, 1.04), (0.1, 0.015, 0.1), shade('#ffd040'))
    for k in range(3):
        z = 0.9 + k * 0.012
        tube(mb, [(-0.1 + i * 0.1, -0.08, z + 0.02 * math.sin(i * 1.8)) for i in range(7)], 0.012, shade('#e8f4ff'), seg=5)
    gable(mb, -0.88, 0.88, -0.16, 0.16, 1.42, 0.14, wood('#b04a3a', 'x'))
    return [(mb, 'main')]


# ---------------------------------------------------------------- the farm
def windmill():
    mb = MB()
    lathe(mb, [(1.12, 0.0), (1.15, 0.1), (1.0, 1.8), (0.82, 3.4), (0.86, 3.45), (0.86, 3.55)], col_fn(CREAM, under=0.15), seg=32, cap_top=False)
    lathe(mb, [(1.06, 1.1), (1.08, 1.14), (1.08, 1.24), (1.06, 1.28)], wood(WOOD_D), seg=32, cap_top=False)
    lathe(mb, [(0.95, 3.5), (0.98, 3.56), (0.7, 4.1), (0.35, 4.45), (0.0, 4.6)], wood('#a84a32', 'z'), seg=32, cap_top=False)
    # the door and two windows on the front
    rbox(mb, -0.3, -1.18, 0.0, 0.3, -1.05, 0.9, wood('#6a4a2a'), r=0.04)
    rbox(mb, -0.36, -1.2, 0.0, 0.36, -1.04, 0.06, stone(), r=0.02)
    for z, x in ((1.8, 0.0), (2.6, 0.0)):
        y = -1.0 + (z - 1.8) * 0.11 - 0.02
        rbox(mb, x - 0.16, y - 0.06, z - 0.2, x + 0.16, y + 0.04, z + 0.2, shade('#f2ece0'), r=0.03)
        rbox(mb, x - 0.12, y - 0.075, z - 0.16, x + 0.12, y - 0.05, z + 0.16, shade('#3a4a6a'), r=0.01)
    # the hub's axle
    tube(mb, [(0, -0.6, 3.75), (0, -1.08, 3.75)], 0.09, shade(IRON), seg=10)
    sails = MB()
    ball(sails, (0, 0, 0), 0.16, shade('#8a5a34'))
    for k in range(4):
        m = len(sails.v)
        rbox(sails, -0.05, -0.04, 0.1, 0.05, 0.04, 2.3, wood(WOOD_L), r=0.015)
        # the lattice and the cloth
        for j in range(7):
            z = 0.55 + j * 0.25
            rbox(sails, 0.05, -0.03, z - 0.02, 0.62, 0.0, z + 0.02, wood(WOOD_L), r=0.008)
        rbox(sails, 0.6, -0.03, 0.5, 0.64, 0.0, 2.25, wood(WOOD_L), r=0.008)
        rbox(sails, 0.06, -0.012, 0.52, 0.6, 0.0, 2.23, col_fn('#f4ecdc'), r=0.004)
        xform(sails, m, Euler((0, k * math.pi / 2 + 0.3, 0)).to_matrix().to_4x4())
    return [(mb, 'main')], [(sails, 'sails')], [Vector((0, -1.12, 3.75))]


def well():
    mb, water = MB(), MB()
    lathe(mb, [(0.6, 0.0), (0.62, 0.05), (0.62, 0.62), (0.66, 0.66), (0.66, 0.72), (0.5, 0.72), (0.48, 0.66), (0.48, 0.2)], stone('#b8ae9e', seed=2), seg=32, cap_top=False)
    lathe(water, [(0.49, 0.32), (0.0, 0.32)], col_fn('#3a6a8a'), seg=24, cap_top=False)
    for x in (-0.6, 0.6):
        rbox(mb, x - 0.05, -0.05, 0.6, x + 0.05, 0.05, 1.7, wood(WOOD_D), r=0.02)
    gable(mb, -0.78, 0.78, -0.5, 0.5, 1.62, 0.36, wood('#b04a3a', 'x'))
    tube(mb, [(-0.6, 0, 1.25), (0.72, 0, 1.25)], 0.04, wood(WOOD), seg=8)
    tube(mb, [(0.72, 0, 1.25), (0.72, -0.16, 1.25), (0.72, -0.16, 1.12)], 0.018, shade(IRON), seg=6)
    tube(mb, [(0.0, 0.0, 1.22), (0.0, 0.0, 0.92)], 0.008, shade('#d8c8a0'), seg=5)
    lathe(mb, [(0.08, 0.78), (0.1, 0.92), (0.11, 0.93)], wood(WOOD), seg=12, cap_top=False, cap_bot=True)
    return [(mb, 'main'), (water, 'water')]


def scarecrow():
    mb = MB()
    rbox(mb, -0.04, -0.04, 0, 0.04, 0.04, 1.6, wood(WOOD_D), r=0.015)
    rbox(mb, -0.6, -0.035, 1.1, 0.6, 0.035, 1.17, wood(WOOD_D, 'x'), r=0.015)
    ball(mb, (0, 0, 1.45), (0.17, 0.16, 0.18), col_fn('#d8b880', mottle=0.08))
    for x in (-0.06, 0.06):
        ball(mb, (x, -0.155, 1.48), 0.022, shade('#2a2018'), sub=1)
    tube(mb, [(-0.06, -0.16, 1.38), (0.0, -0.17, 1.36), (0.06, -0.16, 1.38)], 0.008, shade('#2a2018'), seg=5)
    lathe(mb, [(0.34, 1.56), (0.34, 1.58), (0.15, 1.6), (0.13, 1.76), (0.0, 1.78)], col_fn('#e0c070', grain='z'), seg=20, cap_top=False)
    lathe(mb, [(0.15, 1.6), (0.155, 1.64), (0.135, 1.64)], shade('#c83a2a'), seg=20, cap_top=False)
    rbox(mb, -0.2, -0.13, 0.75, 0.2, 0.13, 1.22, col_fn('#4a7ac0', mottle=0.05), r=0.06)
    rbox(mb, -0.55, -0.1, 1.06, 0.55, 0.1, 1.21, col_fn('#4a7ac0', mottle=0.05), r=0.05)
    rbox(mb, -0.07, -0.135, 0.9, 0.07, -0.13, 1.05, shade('#e8c040'), r=0.005)
    rng = random.Random(3)
    for sx in (-1, 1):
        for k in range(5):
            tube(mb, [(sx * 0.55, 0, 1.13), (sx * (0.6 + rng.uniform(0.02, 0.08)), rng.uniform(-0.04, 0.04), 1.13 - rng.uniform(0.03, 0.12))], 0.008, shade('#e8c870'), seg=4)
    return [(mb, 'main')]


def hay():
    mb = MB()
    rng = random.Random(2)
    f = col_fn('#e4c06a', grain='y', seed=3)

    def straw(p, n):
        return f(p, n) * (0.9 + 0.2 * (0.5 + 0.5 * math.sin(p.x * 80 + p.z * 37)))
    rbox(mb, -0.45, -0.32, 0, 0.45, 0.32, 0.5, straw, r=0.07, mid=4)
    for x in (-0.22, 0.22):
        rbox(mb, x - 0.02, -0.335, 0.02, x + 0.02, 0.335, 0.515, shade('#a07a4a'), r=0.01)
    for k in range(10):
        p = Vector((rng.uniform(-0.45, 0.45), rng.uniform(-0.3, 0.3), 0.5))
        tube(mb, [p, p + Vector((rng.uniform(-0.1, 0.1), rng.uniform(-0.1, 0.1), rng.uniform(0.02, 0.06)))], 0.006, shade('#f0d080'), seg=4)
    return [(mb, 'main')]


def crate():
    mb = MB()
    plank_row(mb, -0.35, 0.35, -0.3, -0.26, 0.04, 0.56, 4, WOOD_L, along='x', seed=1, stack='z')
    plank_row(mb, -0.35, 0.35, 0.26, 0.3, 0.04, 0.56, 4, WOOD_L, along='x', seed=2, stack='z')
    for x0 in (-0.35, 0.31):
        rbox(mb, x0, -0.3, 0.04, x0 + 0.04, 0.3, 0.56, wood(WOOD_L, 'y'), r=0.01)
    rbox(mb, -0.35, -0.3, 0.0, 0.35, 0.3, 0.06, wood(WOOD), r=0.01)
    for (x, y) in ((-0.33, -0.28), (0.33, -0.28), (-0.33, 0.28), (0.33, 0.28)):
        rbox(mb, x - 0.035, y - 0.035, 0.0, x + 0.035, y + 0.035, 0.58, wood(WOOD_D), r=0.012)
    m = len(mb.v)
    rbox(mb, -0.34, -0.315, 0.08, -0.3, -0.3, 0.52, wood(WOOD_D), r=0.008)
    xform(mb, m, rot(y=-0.95, at=(0, -0.31, 0.3)))
    rng = random.Random(4)
    for k in range(9):
        ball(mb, (rng.uniform(-0.24, 0.24), rng.uniform(-0.2, 0.2), 0.52 + rng.uniform(0, 0.06)), 0.07, shade(rng.choice(['#d83028', '#e8442a', '#f0b030'])), sub=2)
    return [(mb, 'main')]


def wheelbarrow():
    mb = MB()
    # the tray, splayed boards
    rbox(mb, -0.3, -0.42, 0.34, 0.3, 0.3, 0.38, wood('#5a8a5a', 'y'), r=0.015)
    for s in (-1, 1):
        m = len(mb.v)
        rbox(mb, s * 0.3 - 0.02, -0.42, 0.36, s * 0.3 + 0.02, 0.32, 0.62, wood('#5a8a5a', 'y'), r=0.015)
        xform(mb, m, rot(y=-s * 0.35, at=(s * 0.3, 0, 0.36)))
    m = len(mb.v)
    rbox(mb, -0.38, -0.44, 0.36, 0.38, -0.4, 0.62, wood('#5a8a5a', 'x'), r=0.015)
    xform(mb, m, rot(x=0.4, at=(0, -0.42, 0.36)))
    rbox(mb, -0.38, 0.3, 0.36, 0.38, 0.34, 0.6, wood('#5a8a5a', 'x'), r=0.015)
    # the wheel in front, the handles back, two legs
    m = len(mb.v)
    lathe(mb, [(0.0, -0.05), (0.16, -0.05), (0.2, -0.03), (0.2, 0.03), (0.16, 0.05), (0.0, 0.05)], shade('#3a3a3a'), seg=24, cap_top=False)
    xform(mb, m, Matrix.Translation((0, -0.6, 0.2)) @ Euler((0, math.pi / 2, 0)).to_matrix().to_4x4())
    for s in (-1, 1):
        tube(mb, [(s * 0.06, -0.62, 0.2), (s * 0.22, -0.3, 0.32), (s * 0.24, 0.4, 0.45), (s * 0.26, 0.8, 0.55)], 0.022, wood(WOOD_D), seg=6)
        rbox(mb, s * 0.22 - 0.025, 0.25, 0.0, s * 0.22 + 0.025, 0.3, 0.36, wood(WOOD_D), r=0.01)
    rng = random.Random(5)
    for k in range(6):
        ball(mb, (rng.uniform(-0.18, 0.18), rng.uniform(-0.25, 0.15), 0.42 + rng.uniform(0, 0.05)), (0.08, 0.08, 0.06), shade(rng.choice(['#f08a20', '#e87a1a', '#8a6a3a'])), sub=2)
    return [(mb, 'main')]


def trough():
    mb, water = MB(), MB()
    plank_row(mb, -0.6, 0.6, -0.26, -0.22, 0.08, 0.42, 3, WOOD, along='x', seed=3, stack='z')
    plank_row(mb, -0.6, 0.6, 0.22, 0.26, 0.08, 0.42, 3, WOOD, along='x', seed=4, stack='z')
    for x0 in (-0.64, 0.6):
        rbox(mb, x0, -0.26, 0.04, x0 + 0.04, 0.26, 0.44, wood(WOOD, 'y'), r=0.01)
    rbox(mb, -0.62, -0.24, 0.06, 0.62, 0.24, 0.1, wood(WOOD_D), r=0.01)
    for x in (-0.5, 0.5):
        rbox(mb, x - 0.05, -0.3, 0.0, x + 0.05, 0.3, 0.1, wood(WOOD_D, 'y'), r=0.015)
    rbox(water, -0.6, -0.22, 0.3, 0.6, 0.22, 0.33, col_fn('#6ab4d8'), r=0.005)
    return [(mb, 'main'), (water, 'water')]


# ---------------------------------------------------------------- the neighborhood
def birdhouse():
    mb = MB()
    rbox(mb, -0.035, -0.035, 0, 0.035, 0.035, 1.2, wood(WOOD_D), r=0.012)
    rbox(mb, -0.17, -0.15, 1.2, 0.17, 0.15, 1.5, wood('#f0e0b8', 'z'), r=0.025)
    gable(mb, -0.2, 0.2, -0.15, 0.15, 1.48, 0.14, wood('#c8443a', 'x'), over=0.05, t=0.035)
    ball(mb, (0, -0.152, 1.38), (0.05, 0.01, 0.05), shade('#3a2a20'), sub=2)
    tube(mb, [(0, -0.15, 1.28), (0, -0.24, 1.28)], 0.012, wood(WOOD_D), seg=5)
    return [(mb, 'main')]


def flamingo():
    mb = MB()
    pink, pink_d = '#f48aac', '#e0688e'
    ball(mb, (0, 0.02, 0.72), (0.12, 0.22, 0.11), col_fn(pink, under=0.0))
    tube(mb, [(0, -0.14, 0.76), (0, -0.2, 0.9), (0, -0.16, 1.05), (0, -0.2, 1.14)], 0.03, shade(pink), seg=8, r1=0.026)
    ball(mb, (0, -0.22, 1.17), 0.05, shade(pink))
    tube(mb, [(0, -0.26, 1.18), (0, -0.33, 1.14), (0, -0.34, 1.1)], 0.018, shade('#2a2a2a'), seg=6, r1=0.008)
    ball(mb, (0.03, -0.23, 1.19), 0.01, shade('#1a1a1a'), sub=1)
    ball(mb, (-0.03, -0.23, 1.19), 0.01, shade('#1a1a1a'), sub=1)
    for x in (-0.04, 0.04):
        tube(mb, [(x, 0.0, 0.66), (x, 0.0, 0.0)], 0.008, shade('#3a3a3a'), seg=5)
    ball(mb, (0, 0.2, 0.75), (0.06, 0.08, 0.04), shade(pink_d))
    return [(mb, 'main')]


# ---------------------------------------------------------------- the forest and the campsite
def log():
    mb = MB()
    m = len(mb.v)
    lathe(mb, [(0.2, -0.6), (0.22, -0.55), (0.21, 0.0), (0.22, 0.55), (0.2, 0.6)], col_fn('#7a5a3a', grain='z', seed=2, under=0.0), seg=18, cap_top=False)
    lathe(mb, [(0.19, 0.6), (0.12, 0.6), (0.05, 0.6), (0.0, 0.6)], lambda p, n: rgb('#d8b080') * (0.85 + 0.15 * math.sin(math.hypot(p.x, p.y) * 60)), seg=18, cap_top=False)
    lathe(mb, [(0.0, -0.6), (0.19, -0.6)], lambda p, n: rgb('#d8b080') * (0.85 + 0.15 * math.sin(math.hypot(p.x, p.y) * 60)), seg=18, cap_top=False)
    xform(mb, m, Matrix.Translation((0, 0, 0.19)) @ Euler((0, math.pi / 2, 0)).to_matrix().to_4x4())
    ball(mb, (0.15, -0.12, 0.3), (0.05, 0.04, 0.02), shade('#5a8a3a'), sub=2)
    return [(mb, 'main')]


def tent_ac(colors):
    """A ridge tent: two cloth sides on a ridge pole, the ends closed but for the open front door, ropes and pegs."""
    mb = MB()
    c, c2 = colors
    L, H, W = 1.5, 1.0, 0.85                    # length (front to back), height, half width at the foot
    for s in (-1, 1):
        pts = [(s * W, -L / 2, 0.0), (0.0, -L / 2, H), (0.0, L / 2, H), (s * W, L / 2, 0.0)]
        base = len(mb.v)
        # a cloth panel with a little thickness, sagging between the poles
        quad = []
        for j in range(5):
            for i in range(6):
                u, v = i / 5, j / 4
                a = Vector(pts[0]).lerp(Vector(pts[3]), u)
                b = Vector(pts[1]).lerp(Vector(pts[2]), u)
                p = a.lerp(b, v)
                p.z -= 0.035 * math.sin(math.pi * v) * (0.6 + 0.4 * math.sin(math.pi * u))
                quad.append(p)
        n = (Vector(pts[1]) - Vector(pts[0])).cross(Vector(pts[3]) - Vector(pts[0])).normalized()
        if n.dot(Vector((s, 0, 0.5))) < 0:
            n = -n
        f = col_fn(c if s < 0 else c2, under=0.0)
        cols = [f(p, n) * (0.9 + 0.1 * (int(i % 6 / 1.5) % 2)) for i, p in enumerate(quad)]
        faces = []
        for j in range(4):
            for i in range(5):
                a = j * 6 + i
                faces += [(a, a + 1, a + 7), (a, a + 7, a + 6)]
        mb.add(quad, cols, [n] * len(quad), faces)
        # (the inside a little in from the outside, so the two never fight)
        mb.add([q - n * 0.01 for q in quad], [x * 0.7 for x in cols], [-n] * len(quad), faces)
    for y, door in ((-L / 2, True), (L / 2, False)):
        if door:
            for s in (-1, 1):
                outline = [(s * W, 0.0), (s * 0.18, 0.0), (0.0, H)] if s > 0 else [(s * W, 0.0), (0.0, H), (s * 0.18, 0.0)]
                slab(mb, [(u, v) for u, v in outline], 0.02, col_fn(colors[1], under=0.0), axis='y', at=y - 0.01)
            slab(mb, [(-0.18, 0.0), (0.18, 0.0), (0.0, H * 0.8)], 0.01, shade('#2a2a2a'), axis='y', at=y + 0.05)
        else:
            slab(mb, [(-W, 0.0), (W, 0.0), (0.0, H)], 0.02, col_fn(colors[1], under=0.0), axis='y', at=y - 0.01)
    tube(mb, [(0, -L / 2 - 0.05, H), (0, L / 2 + 0.05, H)], 0.025, wood(WOOD_D), seg=6)
    for y in (-L / 2 - 0.02, L / 2 + 0.02):
        tube(mb, [(0, y, 0), (0, y, H + 0.12)], 0.022, wood(WOOD_D), seg=6)
        for s in (-1, 1):
            tube(mb, [(0, y, H + 0.08), (s * 0.15, y + math.copysign(0.55, y), 0.0)], 0.006, shade('#e8dcc0'), seg=4)
            rbox(mb, s * 0.15 - 0.015, y + math.copysign(0.55, y) - 0.015, 0, s * 0.15 + 0.015, y + math.copysign(0.55, y) + 0.015, 0.08, wood(WOOD_D), r=0.005)
    return [(mb, 'main')]


def campfire(big=False):
    mb, fire = MB(), MB()
    k = 1.6 if big else 1.0
    for j in range(9 if not big else 12):
        a = j / (9 if not big else 12) * math.tau
        rocks(mb, (math.cos(a) * 0.36 * k, math.sin(a) * 0.36 * k, 0.0), 0.09 * k, color='#8a8478', seed=j)
    if big:
        for j in range(7):
            a = j / 7 * math.tau
            tube(mb, [(math.cos(a) * 0.4, math.sin(a) * 0.4, 0.02), (math.cos(a) * 0.05, math.sin(a) * 0.05, 0.8)], 0.05, col_fn('#6a4a2a', grain='z'), seg=7, r1=0.035)
    else:
        for a in (0.3, 1.9):
            m = len(mb.v)
            lathe(mb, [(0.05, -0.28), (0.055, 0.28)], col_fn('#6a4a2a', grain='z'), seg=8)
            xform(mb, m, Matrix.Translation((0, 0, 0.06)) @ Euler((0, math.pi / 2, a)).to_matrix().to_4x4())
    ball(mb, (0, 0, 0.02), (0.22 * k, 0.22 * k, 0.03), shade('#3a2a20'), sub=2)
    flame(fire, (0, 0, 0.04), 0.55 * k, 0.32 * k)
    return [(mb, 'main'), (fire, 'glow')]


def picnic():
    mb, cloth = MB(), MB()
    plank_row(mb, -0.75, 0.75, -0.4, 0.4, 0.68, 0.74, 4, WOOD_L, along='x', seed=5)
    for s in (-1, 1):
        plank_row(mb, -0.75, 0.75, s * 0.7 - 0.15, s * 0.7 + 0.15, 0.4, 0.45, 2, WOOD_L, along='x', seed=6 + s)
        for x in (-0.55, 0.55):
            m = len(mb.v)
            rbox(mb, x - 0.04, -0.03, 0.0, x + 0.04, 0.03, 0.78, wood(WOOD), r=0.012)
            xform(mb, m, rot(x=s * 0.62, at=(x, 0, 0.7)))
    for x in (-0.55, 0.55):
        rbox(mb, x - 0.04, -0.85, 0.36, x + 0.04, 0.85, 0.4, wood(WOOD, 'y'), r=0.012)
    rbox(cloth, -0.5, -0.42, 0.74, 0.5, 0.42, 0.75, checker('#e8443a', '#fff6ee', 0.1), r=0.003, mid=8)
    lathe(cloth, [(0.07, 0.75), (0.08, 0.86), (0.06, 0.9)], shade('#c8823a'), c=(0.2, 0.1, 0), seg=10)
    ball(cloth, (-0.22, -0.05, 0.79), (0.1, 0.07, 0.04), shade('#f0c070'))
    return [(mb, 'main'), (cloth, 'cloth')]


# ---------------------------------------------------------------- lookout, harbor
def telescope():
    """The lookout's telescope, pointing out to sea (north): a brass spyglass with a leather-wrapped barrel, a sunshade with
    a rolled lip and the lens at the front, a draw tube and an eyepiece at the back, a little finder on top; held in a
    fork on a turned head, on three chunky wooden legs with brass feet and a spreader between them."""
    mb = MB()
    brass, brass_d = col_fn('#d8a640', under=0.0), col_fn('#b08030', under=0.0)
    leather = col_fn('#7a3e2a', mottle=0.05, under=0.0)
    legw = wood(WOOD_D)
    HZ = 1.02                                   # the pivot
    # the legs, splayed, each with a collar half way and a brass foot; the spreader's three bars to a little hub
    for k in range(3):
        a = k / 3 * math.tau + math.pi / 2 + math.pi / 3
        d = Vector((math.cos(a), math.sin(a), 0))
        top, foot = d * 0.07 + Vector((0, 0, 0.9)), d * 0.42
        tube(mb, [top, top.lerp(foot, 0.5), foot + Vector((0, 0, 0.05))], 0.034, legw, seg=8, r1=0.026)
        c = top.lerp(foot, 0.55)
        dd = (foot - top).normalized()
        tube(mb, [c - dd * 0.025, c + dd * 0.025], 0.036, brass, seg=8)
        tube(mb, [foot + Vector((0, 0, 0.06)), foot + Vector((0, 0, 0.0))], 0.03, brass_d, seg=8, r1=0.034)
        tube(mb, [c, Vector((0, 0, c.z - 0.02))], 0.012, legw, seg=5)
    sball(mb, (0, 0, 0.385), 0.03, brass_d, sub=1)
    # the head: a turned collar where the legs meet, a post, a fork holding the tube by two knobs
    lathe(mb, [(0.0, 0.84), (0.1, 0.85), (0.11, 0.9), (0.09, 0.95), (0.05, 0.96), (0.04, 0.98)], brass_d, seg=14)
    for s in (-1, 1):
        lbox(mb, s * 0.1 - 0.018, -0.045, 0.94, s * 0.1 + 0.018, 0.045, HZ + 0.03, brass_d, r=0.012)
    lbox(mb, -0.118, -0.045, 0.94, 0.118, 0.045, 0.975, brass_d, r=0.012)
    m = len(mb.v)
    # the spyglass, built along z (the front at +z), then tipped up toward the sea
    lathe(mb, [(0.0, -0.66), (0.032, -0.66), (0.044, -0.64), (0.04, -0.6), (0.034, -0.58), (0.034, -0.55)], shade('#2e2a28'), seg=14)
    lathe(mb, [(0.036, -0.56), (0.042, -0.55), (0.042, -0.5), (0.05, -0.49), (0.05, -0.36), (0.056, -0.35)], brass, seg=14, cap_top=False)
    lathe(mb, [(0.06, -0.36), (0.082, -0.35), (0.084, -0.31), (0.076, -0.3)], brass, seg=16, cap_top=False, cap_bot=True)
    lathe(mb, [(0.074, -0.3), (0.075, 0.22)], leather, seg=16, cap_top=False)
    lathe(mb, [(0.076, 0.21), (0.084, 0.22), (0.084, 0.27), (0.08, 0.28), (0.092, 0.3), (0.095, 0.54), (0.105, 0.56), (0.1, 0.59), (0.088, 0.58)], brass, seg=16, cap_top=False)
    lathe(mb, [(0.088, 0.565), (0.0, 0.565)], col_fn('#3a5a7a', under=0.0), seg=16, cap_top=False)
    for z in (-0.12, 0.06):
        lathe(mb, [(0.074, z - 0.018), (0.081, z - 0.012), (0.081, z + 0.012), (0.074, z + 0.018)], brass, seg=16, cap_top=False)
    # the trunnions (where the fork holds it), the finder on top on two little posts
    for s in (-1, 1):
        tube(mb, [(s * 0.07, 0, 0.0), (s * 0.115, 0, 0.0)], 0.024, brass_d, seg=8)
        sball(mb, (s * 0.12, 0, 0.0), 0.028, brass, sub=1)
    # (-y is up once it's tipped)
    for z in (-0.06, 0.16):
        tube(mb, [(0, -0.07, z), (0, -0.11, z)], 0.012, brass_d, seg=5)
    lathe(mb, [(0.0, -0.14), (0.018, -0.14), (0.022, -0.1), (0.022, 0.2), (0.028, 0.22), (0.028, 0.25), (0.0, 0.25)], brass, c=(0, -0.125, 0), seg=10)
    xform(mb, m, Matrix.Translation((0, 0, HZ)) @ Euler((-1.15, 0, 0)).to_matrix().to_4x4())
    return [(mb, 'main')]


def viewer():
    mb = MB()
    lathe(mb, [(0.22, 0.0), (0.16, 0.06), (0.06, 0.12), (0.05, 0.85), (0.08, 0.9)], col_fn('#3a8a9a', under=0.2), seg=16)
    rbox(mb, -0.2, -0.15, 0.88, 0.2, 0.15, 1.14, shade('#3a8a9a'), r=0.06)
    for x in (-0.08, 0.08):
        m = len(mb.v)
        lathe(mb, [(0.06, 0.0), (0.065, 0.1), (0.05, 0.12)], shade('#2a2a2e'), seg=12)
        xform(mb, m, Matrix.Translation((x, -0.14, 1.03)) @ Euler((math.pi / 2, 0, 0)).to_matrix().to_4x4())
    rbox(mb, 0.19, -0.03, 0.95, 0.22, 0.03, 1.02, shade('#d8c070'), r=0.005)
    return [(mb, 'main')]


def tackle():
    mb = MB()
    rbox(mb, -0.25, -0.15, 0.0, 0.25, 0.15, 0.24, col_fn('#3a7a4a'), r=0.03)
    rbox(mb, -0.26, -0.16, 0.2, 0.26, 0.16, 0.26, shade('#2e6a3e'), r=0.02)
    tube(mb, [(-0.1, 0, 0.26), (-0.1, 0, 0.32), (0.1, 0, 0.32), (0.1, 0, 0.26)], 0.012, shade(IRON), seg=5)
    rbox(mb, -0.04, -0.162, 0.17, 0.04, -0.15, 0.22, shade('#d8c070'), r=0.004)
    for k, x in enumerate((0.4, 0.5)):
        tube(mb, [(x, 0.1, 0.0), (x - 0.08, 0.12, 1.4)], 0.012, wood('#c8a060'), seg=5, r1=0.006)
        tube(mb, [(x - 0.01, 0.1, 0.25), (x - 0.01, 0.06, 0.29)], 0.03, shade('#3a3a3a'), seg=8)
    lathe(mb, [(0.13, 0.0), (0.15, 0.26), (0.16, 0.27)], col_fn('#4a78c8'), c=(-0.45, 0.05, 0), seg=16, cap_top=False, cap_bot=True)
    return [(mb, 'main')]


# ---------------------------------------------------------------- the beach
def driftwood():
    mb = MB()
    f = col_fn('#c8b8a0', grain='x', seed=4, under=0.1)
    tube(mb, [(-0.8, 0.05, 0.08), (-0.4, 0.0, 0.12), (0.0, 0.04, 0.13), (0.4, -0.02, 0.11), (0.85, 0.06, 0.08)], 0.11, f, seg=10, r1=0.06)
    tube(mb, [(0.1, 0.02, 0.14), (0.3, -0.25, 0.2), (0.45, -0.4, 0.18)], 0.045, f, seg=7, r1=0.02)
    tube(mb, [(-0.4, 0.02, 0.15), (-0.55, 0.3, 0.32)], 0.04, f, seg=7, r1=0.018)
    return [(mb, 'main')]


def rock(seed):
    mb = MB()
    rocks(mb, (0, 0, 0), 0.42, color='#a09a90', seed=seed, n=1)
    rocks(mb, (0.36, -0.2, 0), 0.2, color='#948e84', seed=seed + 5, n=1)
    ball(mb, (-0.1, -0.1, 0.3), (0.12, 0.1, 0.03), shade('#7a9a4a'), sub=2)
    return [(mb, 'main')]


def icecream():
    mb, top = MB(), MB()
    rbox(mb, -0.6, -0.35, 0.3, 0.6, 0.35, 1.0, col_fn('#f8d8e4'), r=0.05)
    rbox(mb, -0.62, -0.37, 0.95, 0.62, 0.37, 1.05, shade('#f4f0ea'), r=0.03)
    rbox(mb, -0.55, -0.37, 0.4, 0.55, -0.34, 0.86, shade('#8ad0e8'), r=0.02)
    for x in (-0.45, 0.45):
        m = len(mb.v)
        lathe(mb, [(0.0, -0.05), (0.2, -0.05), (0.22, -0.03), (0.22, 0.03), (0.2, 0.05), (0.0, 0.05)], shade('#e8443a'), seg=20, cap_top=False)
        xform(mb, m, Matrix.Translation((x, -0.32, 0.22)) @ Euler((0, math.pi / 2, 0)).to_matrix().to_4x4())
    tube(mb, [(0, 0.1, 1.05), (0, 0.1, 2.0)], 0.025, shade('#f4f0ea'), seg=6)
    # (a profile runs from the bottom up, so its surface faces out: the umbrella's rim first)
    lathe(top, [(0.98, 1.9), (0.95, 1.95), (0.0, 2.25)], stripes('#ff8ab0', '#fff8f0', 12), c=(0, 0.1, 0), seg=36, cap_top=False, cap_bot=False)
    lathe(top, [(0.0, 1.93), (0.94, 1.92)], shade('#f0d8e0'), c=(0, 0.1, 0), seg=36, cap_top=False)
    for k, (x, c) in enumerate(((-0.3, '#ffd0e0'), (0.0, '#fff0b0'), (0.3, '#c8f0d0'))):
        lathe(mb, [(0.0, 1.05), (0.07, 1.22)], col_fn('#d8a050'), c=(x, -0.1, 0), seg=10, cap_top=False)
        ball(mb, (x, -0.1, 1.27), 0.075, shade(c))
    return [(mb, 'main'), (top, 'umbrella')]


def sandcastle():
    mb = MB()
    sand = col_fn('#e8d0a0', mottle=0.06, under=0.1)
    rbox(mb, -0.5, -0.4, 0.0, 0.5, 0.4, 0.22, sand, r=0.06)
    for (x, y, h) in ((-0.35, -0.25, 0.55), (0.35, -0.25, 0.55), (-0.35, 0.25, 0.5), (0.35, 0.25, 0.5), (0.0, 0.05, 0.75)):
        lathe(mb, [(0.13, 0.15), (0.11, h), (0.14, h + 0.02), (0.14, h + 0.06)], sand, c=(x, y, 0), seg=14, cap_top=True)
        for j in range(4):
            a = j / 4 * math.tau
            rbox(mb, x + math.cos(a) * 0.1 - 0.03, y + math.sin(a) * 0.1 - 0.03, h + 0.06, x + math.cos(a) * 0.1 + 0.03, y + math.sin(a) * 0.1 + 0.03, h + 0.11, sand, r=0.01)
    tube(mb, [(0.0, 0.05, 0.8), (0.0, 0.05, 1.1)], 0.008, shade('#5a4a3a'), seg=4)
    slab(mb, [(0.0, 1.0), (0.18, 1.04), (0.0, 1.09)], 0.01, shade('#e8443a'), axis='y', at=0.04)
    rbox(mb, -0.15, -0.42, 0.0, 0.15, -0.38, 0.14, sand, r=0.02)
    lathe(mb, [(0.06, 0.0), (0.09, 0.12), (0.1, 0.13)], shade('#4a8ad8'), c=(0.62, -0.1, 0), seg=12, cap_top=False, cap_bot=True)
    return [(mb, 'main')]


def volleyball():
    """The net across the 7-tile court (the game keeps its own ball, which bounces)."""
    mb = MB()
    for x in (-3.4, 3.4):
        cyl(mb, x, 0, 0, 1.55, 0.045, color=shade('#f4f0ea'), round_=0.02)
        ball(mb, (x, 0, 1.58), 0.055, shade('#e8443a'))
        tube(mb, [(x, 0, 1.5), (x * 1.12, 0, 0.0)], 0.006, shade('#e8dcc0'), seg=4)
    rbox(mb, -3.4, -0.012, 1.32, 3.4, 0.012, 1.4, shade('#f4f0ea'), r=0.005)
    for k in range(69):
        x = -3.4 + k * 0.1
        rbox(mb, x - 0.004, -0.004, 0.82, x + 0.004, 0.004, 1.32, shade('#2a2a2e'), r=0.002)
    for k in range(6):
        z = 0.82 + k * 0.1
        rbox(mb, -3.4, -0.004, z - 0.004, 3.4, 0.004, z + 0.004, shade('#2a2a2e'), r=0.002)
    return [(mb, 'main')]


def noodle_cart():
    """Basil's noodle cart (out at night): a red-orange plank body on four small wheels, its counter with a pot of broth
    steaming, bowls and chopsticks, a cream sign with a bowl of noodles on it, a red cloth roof on two posts with a
    scalloped valance, a paper lantern lit under it, Joe's poem taped to the side, two stools."""
    mb, lamp = MB(), MB()
    RED, ORANGE = '#c9542e', '#e8763c'
    # the body: planks standing side by side, a darker plinth, the counter on top overhanging the front
    for k in range(11):
        x0 = -1.1 + k * 0.2
        rbox(mb, x0 + 0.005, -0.42, 0.3, x0 + 0.195, 0.42, 1.0, col_fn(tuple(rgb(RED) * (0.92 + 0.1 * ((k * 7) % 3) / 2)), grain='z', seed=k), r=0.012)
    rbox(mb, -1.12, -0.44, 0.24, 1.12, 0.44, 0.32, shade('#8a3a20'), r=0.02)
    rbox(mb, -1.18, -0.56, 1.0, 1.18, 0.5, 1.08, col_fn(ORANGE, grain='x'), r=0.02)
    # the sign: a cream panel, a red bowl with noodles hanging over its rim, chopsticks, steam
    rbox(mb, -0.78, -0.45, 0.42, 0.78, -0.42, 0.9, shade('#fff1e4'), r=0.02)
    m = len(mb.v)
    slab(mb, [(-0.2, 0.0), (0.2, 0.0), (0.16, -0.08), (0.08, -0.13), (-0.08, -0.13), (-0.16, -0.08)], 0.012, shade(RED), axis='y', at=-0.006)
    for k in range(5):
        tube(mb, [(-0.12 + k * 0.06, -0.012, 0.0), (-0.1 + k * 0.06, -0.012, 0.06), (-0.13 + k * 0.06, -0.012, 0.11)], 0.008, shade('#e8c070'), seg=4)
    for d in (0.0, 0.03):
        tube(mb, [(0.04 + d, -0.014, 0.08), (0.22 + d, -0.014, 0.2)], 0.007, shade('#7a3a20'), seg=4)
    for x in (-0.07, 0.03):
        tube(mb, [(x, -0.012, 0.15), (x + 0.02, -0.012, 0.19), (x - 0.01, -0.012, 0.23), (x + 0.01, -0.012, 0.27)], 0.007, shade('#d8b8a8'), seg=4)
    xform(mb, m, Matrix.Translation((0, -0.45, 0.56)))
    # four little wheels, front and back
    for x in (-0.72, 0.72):
        for y in (-0.47, 0.47):
            m = len(mb.v)
            lathe(mb, [(0.0, -0.035), (0.2, -0.035), (0.22, -0.015), (0.22, 0.015), (0.2, 0.035), (0.0, 0.035)], shade('#2d2832'), seg=22, cap_top=False)
            lathe(mb, [(0.0, 0.036), (0.07, 0.036), (0.07, 0.05), (0.0, 0.05)], shade('#7a7686'), seg=12, cap_top=False)
            xform(mb, m, Matrix.Translation((x, y + (-0.02 if y < 0 else 0.02), 0.22)) @ Euler((math.pi / 2 if y < 0 else -math.pi / 2, 0, 0)).to_matrix().to_4x4())
    # a push handle at the right
    tube(mb, [(1.12, -0.3, 0.8), (1.42, -0.3, 0.86), (1.42, 0.3, 0.86), (1.12, 0.3, 0.8)], 0.025, wood(WOOD_D, 'x'), seg=6)
    # the posts and the roof: a red cloth sloping back, a scalloped valance in front
    for x in (-1.08, 1.08):
        rbox(mb, x - 0.045, 0.32, 1.08, x + 0.045, 0.41, 2.08, wood(WOOD_D), r=0.015)
        rbox(mb, x - 0.045, -0.5, 1.08, x + 0.045, -0.42, 1.95, wood(WOOD_D), r=0.015)

    def cloth(p, n):
        k = int(math.floor((p.x + 2) / 0.24)) % 2
        return rgb('#e0405a') * (0.84 + 0.1 * k + 0.08 * abs(n.z))
    m = len(mb.v)
    rbox(mb, -1.3, 0.0, -0.025, 1.3, 1.26, 0.025, cloth, r=0.015, mid=10)
    xform(mb, m, Matrix.Translation((0, -0.7, 2.0)) @ Euler((math.atan2(0.16, 1.25), 0, 0)).to_matrix().to_4x4())
    rbox(mb, -1.32, -0.73, 1.86, 1.32, -0.69, 2.02, cloth, r=0.012, mid=10)
    for k in range(11):
        ball(mb, (-1.2 + k * 0.24, -0.71, 1.86), (0.12, 0.02, 0.07), shade('#e0405a' if k % 2 == 0 else '#c8304a'), sub=2)
    # the paper lantern, lit, hanging from the roof: dark caps, a red word down it
    tube(mb, [(-0.55, -0.55, 1.98), (-0.55, -0.55, 1.82)], 0.006, shade('#3f3a4a'), seg=4)
    lathe(lamp, [(0.0, 1.5), (0.1, 1.5), (0.15, 1.56), (0.17, 1.66), (0.15, 1.76), (0.1, 1.8), (0.0, 1.8)], shade('#ffd35a'), c=(-0.55, -0.55, 0), seg=16)
    for z in (1.48, 1.8):
        lathe(mb, [(0.0, z), (0.085, z), (0.085, z + 0.03), (0.0, z + 0.03)], shade('#3a3340'), c=(-0.55, -0.55, 0), seg=12)
    for z in (1.58, 1.66, 1.74):
        rbox(lamp, -0.57, -0.73, z - 0.02, -0.53, -0.7, z + 0.02, shade('#c0302a'), r=0.006)
    # the counter's things: a pot of broth steaming, a stack of bowls, chopsticks in a cup, a bottle
    lathe(mb, [(0.0, 1.08), (0.22, 1.08), (0.24, 1.12), (0.24, 1.36), (0.26, 1.38), (0.22, 1.38), (0.22, 1.34), (0.0, 1.34)], shade('#8a8a94'), c=(0.45, 0.05, 0), seg=20)
    for k, (dx, dz) in enumerate(((0.0, 0.0), (0.06, 0.12), (-0.04, 0.24))):
        ball(mb, (0.45 + dx, 0.05, 1.46 + dz), 0.07 + 0.015 * k, shade('#f4f0ec'), sub=2)
    for k in range(4):
        lathe(mb, [(0.0, 1.08 + k * 0.05), (0.08, 1.08 + k * 0.05), (0.13, 1.13 + k * 0.05), (0.12, 1.135 + k * 0.05), (0.0, 1.11 + k * 0.05)], shade('#fbf6ee' if k % 2 else '#e0405a'), c=(-0.3, -0.15, 0), seg=16)
    lathe(mb, [(0.0, 1.08), (0.05, 1.08), (0.05, 1.22), (0.0, 1.22)], shade('#2a5a8a'), c=(0.0, -0.25, 0), seg=10)
    for k in range(6):
        tube(mb, [(0.0 + (k % 3 - 1) * 0.015, -0.25 + (k // 3 - 0.5) * 0.02, 1.15), (0.0 + (k % 3 - 1) * 0.03, -0.25 + (k // 3 - 0.5) * 0.04, 1.36)], 0.006, wood(WOOD_L), seg=4)
    lathe(mb, [(0.0, 1.08), (0.045, 1.08), (0.045, 1.24), (0.02, 1.28), (0.02, 1.33), (0.0, 1.33)], shade('#7a2a1a'), c=(0.88, -0.2, 0), seg=10)
    # Joe's poem taped to the side
    rbox(mb, 1.12, -0.22, 0.5, 1.13, 0.12, 0.88, shade('#fbfbf6'), r=0.004)
    for k in range(5):
        rbox(mb, 1.13, -0.18, 0.8 - k * 0.06, 1.135, 0.04 - (k % 2) * 0.06, 0.81 - k * 0.06, shade('#5a6a8a'), r=0.002)
    rbox(mb, 1.13, -0.1, 0.86, 1.137, -0.02, 0.9, shade('#e8e0b8'), r=0.002)
    # two stools in front
    for x in (-0.45, 0.35):
        lathe(mb, [(0.0, 0.5), (0.16, 0.5), (0.17, 0.53), (0.16, 0.56), (0.0, 0.56)], col_fn('#c8945a', grain='x'), c=(x, -0.85, 0), seg=16)
        for k in range(3):
            a = k / 3 * math.tau + 0.3
            tube(mb, [(x + math.cos(a) * 0.12, -0.85 + math.sin(a) * 0.12, 0.0), (x + math.cos(a) * 0.06, -0.85 + math.sin(a) * 0.06, 0.5)], 0.02, wood(WOOD_D), seg=5)
    return [(mb, 'main'), (lamp, 'glow')]


def barrel():
    mb = MB()
    prof = [(0.22, 0.0)] + [(0.22 + 0.06 * math.sin(math.pi * k / 8), 0.62 * k / 8) for k in range(1, 8)] + [(0.22, 0.62)]
    lathe(mb, prof, col_fn(WOOD, grain='z', seed=3), seg=24, cap_top=True)
    for z in (0.08, 0.5):
        r = 0.22 + 0.06 * math.sin(math.pi * z / 0.62) + 0.008
        lathe(mb, [(r, z), (r + 0.004, z + 0.01), (r + 0.004, z + 0.05), (r, z + 0.06)], shade('#4a4a50'), seg=24, cap_top=False)
    return [(mb, 'main')]


# ---------------------------------------------------------------- the water's edges
def reeds():
    """A clump of cattails: long blades leaning out, velvety brown heads on stems."""
    mb = MB()
    rng = random.Random(11)
    for k in range(9):
        a = rng.uniform(0, math.tau)
        base = Vector((math.cos(a) * 0.06, math.sin(a) * 0.06, 0))
        lean = Vector((math.cos(a), math.sin(a), 0)) * rng.uniform(0.08, 0.25)
        h = rng.uniform(0.45, 0.8)
        # a blade: a thin strip curving out
        side = Vector((-math.sin(a), math.cos(a), 0))
        pts, cols, ns, faces = [], [], [], []
        for j in range(6):
            t = j / 5
            c = base + lean * t * t + Vector((0, 0, h * t))
            w = 0.03 * (1 - t) + 0.004
            pts += [c - side * w, c + side * w]
            col = rgb('#4a7a30').lerp(rgb('#8ab850'), t)
            cols += [col, col]
            nn = Vector((math.cos(a), math.sin(a), 0.4)).normalized()
            ns += [nn, nn]
        for j in range(5):
            i = j * 2
            faces += [(i, i + 1, i + 3), (i, i + 3, i + 2)]
        mb.add(pts, cols, ns, faces)
        mb.add(pts, [c * 0.8 for c in cols], [-n for n in ns], faces)
    for k in range(4):
        a = rng.uniform(0, math.tau)
        b = Vector((math.cos(a) * 0.05, math.sin(a) * 0.05, 0))
        top = b + Vector((math.cos(a) * 0.06, math.sin(a) * 0.06, rng.uniform(0.6, 0.85)))
        tube(mb, [b, b.lerp(top, 0.5), top], 0.008, shade('#5a8a3a'), seg=5)
        ball(mb, top - Vector((0, 0, 0.08)), (0.028, 0.028, 0.08), col_fn('#6a3e22', mottle=0.06), sub=2)
    return [(mb, 'main')]


def lilypad(flower=False):
    mb = MB()
    pts, cols, ns, faces = [Vector((0, 0, 0.01))], [rgb('#3a7a30')], [Vector((0, 0, 1))], []
    n = 18
    for j in range(n + 1):
        a = 0.35 + j / n * (math.tau - 0.7)
        r = 0.26 * (1 + 0.04 * math.sin(a * 5))
        pts.append(Vector((math.cos(a) * r, math.sin(a) * r, 0.0)))
        cols.append(rgb('#4c9a3a').lerp(rgb('#6ab84a'), 0.5 + 0.5 * math.sin(a * 3)))
        ns.append(Vector((0, 0, 1)))
    for j in range(n):
        faces.append((0, 1 + j, 2 + j))
    mb.add(pts, cols, ns, faces)
    # veins
    for j in range(5):
        a = 0.6 + j / 4 * (math.tau - 1.2)
        tube(mb, [(0, 0, 0.012), (math.cos(a) * 0.22, math.sin(a) * 0.22, 0.012)], 0.004, shade('#7ac860'), seg=3)
    if flower:
        for ring, (cnt, L, c, tilt) in enumerate(((8, 0.085, '#f8c0d4', 0.5), (6, 0.065, '#ffdce8', 0.9))):
            for k in range(cnt):
                a = (k + ring * 0.5) / cnt * math.tau
                d = Vector((math.cos(a), math.sin(a), tilt)).normalized()
                ball(mb, Vector((-0.06, 0.04, 0.04)) + d * L * 0.6, (0.035, 0.035, 0.02), shade(c), sub=2)
        ball(mb, (-0.06, 0.04, 0.07), 0.025, shade('#ffd84a'), sub=2)
    return [(mb, 'main')]


def pebbles():
    mb = MB()
    rng = random.Random(21)
    for k in range(5):
        a, d = rng.uniform(0, math.tau), rng.uniform(0, 0.22)
        c = (math.cos(a) * d, math.sin(a) * d, -0.01)
        rocks(mb, c, rng.uniform(0.05, 0.11), color=rng.choice(['#a8a298', '#968f86', '#b8b2a6', '#8a8aa0']), seed=k)
    return [(mb, 'main')]


def falls_rocks():
    """Rocks to sit either side of a waterfall: a big mossy one and two small, dark and wet."""
    mb = MB()
    rocks(mb, (0, 0, -0.05), 0.42, color='#7a7a74', seed=31)
    rocks(mb, (0.36, -0.22, -0.03), 0.18, color='#6e6e6a', seed=32)
    rocks(mb, (-0.3, -0.25, -0.03), 0.14, color='#86847c', seed=33)
    ball(mb, (-0.05, 0.05, 0.19), (0.2, 0.16, 0.08), col_fn('#5a8a3a', mottle=0.1), sub=2)
    return [(mb, 'main')]


# ---------------------------------------------------------------- the Post Office's mailbox styles
# (game/src/6zf_post.js MAILBOX_STYLES) the part named body is painted in white and greys, and the game multiplies in
# the color Sarah picked for her mailbox (MAILBOX_COLORS); the rest keeps its own colors
def mb_post(mb, top=0.86):
    rbox(mb, -0.045, -0.045, 0, 0.045, 0.045, top, wood(WOOD_D), r=0.012)
    rbox(mb, -0.07, -0.2, top - 0.06, 0.07, 0.16, top, wood(WOOD_D, 'y'), r=0.01)


def mb_flag(x, y, z, h=0.36):
    """The red flag on a mailbox's side, raised: a part of its own (named *_flag, its origin where its arm is pinned on,
    build) that the game lowers, and raises flashing while there are new letters (EnvBuild.mailbox)."""
    mb = MB()
    rbox(mb, x - 0.012, y - 0.02, z, x + 0.012, y + 0.02, z + h, shade('#c8302a'), r=0.004)
    rbox(mb, x - 0.008, y + 0.02, z + h - 0.12, x + 0.008, y + 0.17, z + h, shade('#c8302a'), r=0.004)
    return mb


def mailbox_cottage():
    """A little house on a post: walls in the mailbox's color, a shingled roof, a round-topped door for the letters,
    a window each side, a chimney."""
    body, main = MB(), MB()
    mb_post(main)
    rbox(body, -0.16, -0.22, 0.86, 0.16, 0.2, 1.14, col_fn('#ffffff', grain='z', under=0.1), r=0.015)
    # the roof: two boards of shingles, a darker line under each row; a brick chimney
    tile = rgb('#7a4a3a')
    gable(main, -0.16, 0.16, -0.22, 0.2, 1.13, 0.15, lambda p, n: tile * (0.82 if int((p.z - 1.1) / 0.03) % 2 else 1.0), over=0.05, t=0.035)
    rbox(main, 0.06, 0.02, 1.18, 0.12, 0.08, 1.34, stone('#b0583e', 3), r=0.008)
    # the door: cream, round topped, a brass knob; a window each side, white framed
    slab(main, [(-0.07, 0.88), (0.07, 0.88)] + [(math.cos(i * math.pi / 8) * 0.07, 1.02 + math.sin(i * math.pi / 8) * 0.07) for i in range(9)],
         0.02, col_fn(CREAM, grain='z'), axis='y', at=-0.235)
    ball(main, (0.04, -0.24, 0.96), 0.012, shade('#d8b860'), sub=1)
    for sx in (-1, 1):
        rbox(main, sx * 0.16 - 0.01, -0.08, 0.96, sx * 0.16 + 0.01, 0.06, 1.08, shade('#ffffff'), r=0.005)
        rbox(main, sx * 0.16 - 0.015, -0.06, 0.98, sx * 0.16 + 0.015, 0.04, 1.06, shade('#6a8aa8'), r=0.003)
    return [(body, 'body'), (main, 'main'), (mb_flag(0.17, 0.06, 0.9, 0.22), 'flag')]


def mailbox_lighthouse():
    """A lighthouse as tall as a mailbox: bands of the mailbox's color and white, a slot for the letters, a little
    gallery, the lamp lit, a red cap."""
    body, main = MB(), MB()
    rbox(main, -0.2, -0.2, 0, 0.2, 0.2, 0.06, stone(STONE, 5), r=0.015)
    r = lambda z: 0.16 - z * 0.055
    z, k = 0.06, 0
    while z < 1.0:
        z1 = min(1.0, z + 0.16)
        lathe(body if k % 2 == 0 else main, [(r(z), z), (r(z1), z1)], col_fn('#ffffff', under=0.0), seg=24, cap_top=False)
        z, k = z1, k + 1
    # the slot on the front, with a flap
    rbox(main, -0.07, -r(0.78) - 0.018, 0.74, 0.07, -r(0.78) + 0.01, 0.8, shade('#2a2420'), r=0.006)
    rbox(main, -0.075, -r(0.8) - 0.026, 0.79, 0.075, -r(0.8) + 0.0, 0.815, shade('#d8b860'), r=0.005)
    # the door
    slab(main, [(-0.04, 0.06), (0.04, 0.06)] + [(math.cos(i * math.pi / 6) * 0.04, 0.2 + math.sin(i * math.pi / 6) * 0.04) for i in range(7)],
         0.02, col_fn(WOOD, grain='z'), axis='y', at=-r(0.12) - 0.012)
    # the gallery, its rail, the lamp room and the cap
    cyl(main, 0, 0, 1.0, 1.03, 0.14, color=shade(IRON), seg=24)
    for i in range(12):
        a = i / 12 * math.tau
        rbox(main, math.cos(a) * 0.13 - 0.006, math.sin(a) * 0.13 - 0.006, 1.03, math.cos(a) * 0.13 + 0.006, math.sin(a) * 0.13 + 0.006, 1.1, shade(IRON), r=0.002)
    tube(main, [(math.cos(i / 24 * math.tau) * 0.13, math.sin(i / 24 * math.tau) * 0.13, 1.1) for i in range(25)], 0.008, shade(IRON), seg=5)
    glow = MB()
    cyl(glow, 0, 0, 1.03, 1.16, 0.075, color=shade('#ffe08a'), seg=16)
    for i in range(6):
        a = i / 6 * math.tau
        rbox(main, math.cos(a) * 0.078 - 0.007, math.sin(a) * 0.078 - 0.007, 1.03, math.cos(a) * 0.078 + 0.007, math.sin(a) * 0.078 + 0.007, 1.16, shade(IRON), r=0.002)
    lathe(main, [(0.1, 1.16), (0.1, 1.18), (0.03, 1.27), (0.0, 1.28)], shade('#c8302a'), seg=20)
    ball(main, (0, 0, 1.3), 0.02, shade(IRON), sub=1)
    # (a flag on its side like the others': EnvBuild.mailbox raises it while there are new letters)
    return [(body, 'body'), (main, 'main'), (glow, 'glow'), (mb_flag(0.15, 0.0, 0.42, 0.28), 'flag')]


def mailbox_fish():
    """A fat fish on a post, mouth open for the letters: its body in the mailbox's color with scales, its fins a shade
    darker, big eyes."""
    body, main = MB(), MB()
    mb_post(main, 0.82)
    sc = col_fn('#ffffff', under=0.0)

    def scales(p, n):
        # rows of scales from behind the head to the tail, each row offset from the last
        row = (p.y + 0.15) * 20
        k = 1.0 if p.y < -0.15 else 0.9 + 0.1 * math.cos((row + 0.5 * (int(row) % 2) + math.atan2(p.z - 1.0, p.x) * 1.5) * math.tau)
        return sc(p, n) * k
    ball(body, (0, 0.0, 1.0), (0.14, 0.27, 0.15), scales, sub=4)
    g = col_fn('#b4b4b4', under=0.0)
    # the tail, the fin on top and the two at its sides (outlines across y and z)
    m = len(body.v)
    slab(body, [(0.22, 0.0), (0.38, 0.14), (0.42, 0.1), (0.4, 0.0), (0.42, -0.1), (0.38, -0.14)], 0.03, g, axis='x', at=-0.015)
    xform(body, m, Matrix.Translation((0, 0, 1.0)))
    m = len(body.v)
    slab(body, [(-0.08, 0.13), (0.06, 0.12), (0.12, 0.2), (0.0, 0.22)], 0.025, g, axis='x', at=-0.0125)
    xform(body, m, Matrix.Translation((0, 0, 1.0)))
    for sx in (-1, 1):
        ball(body, (sx * 0.13, -0.02, 0.93), (0.02, 0.07, 0.035), g, sub=2)
        ball(main, (sx * 0.1, -0.17, 1.05), (0.04, 0.04, 0.045), shade('#ffffff'), sub=2)
        ball(main, (sx * 0.125, -0.185, 1.05), (0.02, 0.022, 0.026), shade('#1e1a1a'), sub=2)
    # the mouth: a dark round opening and a lip round it
    m = len(main.v)
    lathe(main, [(0.06, 0.0), (0.075, 0.015), (0.06, 0.03)], shade('#e88a7a'), c=(0, -0.26, 0.98), seg=16, cap_top=False)
    xform(main, m, rot(x=math.pi / 2, at=(0, -0.26, 0.98)))
    ball(main, (0, -0.272, 0.98), (0.055, 0.01, 0.055), shade('#2a2020'), sub=2)
    return [(body, 'body'), (main, 'main'), (mb_flag(0.16, 0.08, 0.88, 0.3), 'flag')]


# ---------------------------------------------------------------- things seen only at certain times (33q_env_sights.js)
def fairy_mushroom():
    """A toadstool from the ring that comes up in the woods at night: a pale stem, a round cap that glows aqua (drawn
    unlit), paler spots, darker gills under it."""
    main, glow = MB(), MB()
    lathe(main, [(0.022, 0.0), (0.019, 0.04), (0.016, 0.08), (0.02, 0.1)], col_fn('#efe6d0', under=0.3), seg=12)
    lathe(main, [(0.02, 0.098), (0.06, 0.092), (0.064, 0.096)], shade('#b8b098'), seg=18, cap_top=False)
    top, low = rgb('#a8fff0'), rgb('#38b8d8')

    def cap(p, n):
        t = max(0.0, min(1.0, (p.z - 0.095) / 0.06))
        spot = noise.noise(p * 70) > 0.42
        return rgb('#f0fff8') if spot and t > 0.2 else low.lerp(top, t)
    lathe(glow, [(0.064, 0.096), (0.066, 0.104), (0.058, 0.125), (0.04, 0.143), (0.018, 0.152), (0.0, 0.154)], cap, seg=18)
    return [(main, 'main'), (glow, 'glow')]


def bunting(cols):
    """Holiday bunting across three tiles of the plaza (54_events.js decorateIsland): two posts, a rope sagging between
    them, little triangle flags hanging along it in turn."""
    mb = MB()
    for sx in (-1.38, 1.38):
        cyl(mb, sx, 0, 0, 1.32, 0.035, 0.03, wood(WOOD_D), seg=8, round_=0.01)
        ball(mb, (sx, 0, 1.34), 0.045, shade('#e8c048'), sub=2)
    rope = lambda x: 1.24 - 0.22 * (1 - (x / 1.38) ** 2)
    tube(mb, [(x / 10 * 1.38, 0, rope(x / 10 * 1.38)) for x in range(-10, 11)], 0.008, shade('#f2ead8'), seg=5)
    n = 11
    for i in range(n):
        x = -1.2 + i * 2.4 / (n - 1)
        z = rope(x)
        slab(mb, [(x - 0.095, z), (x, z - 0.22), (x + 0.095, z)], 0.012, shade(cols[i % len(cols)]), axis='y', at=-0.006)
    return [(mb, 'main')]


def grand_lights():
    """Winter Lights on the square's grand tree (David, 27 October: decorations that fit the day, more the more it matters):
    strings of colored bulbs swagged across the front and top of each of its lobes, and a gold star on top, in the grand
    tree's own coordinates (trees_ac.py's tree_grand: the game stands it where the tree stands). The bulbs and the star are
    a *_glow part, lit at night; the wire is dark green."""
    from trees_ac import TREES
    spec = TREES['tree_grand']
    lobes = [(Vector(l[:3]), l[3]) for l in spec['lobes']]
    wire, glow = MB(), MB()
    cols = ['#ff4a4a', '#ffd24a', '#4aa8ff', '#5ad86a', '#fff4dc', '#ff8ad0']
    k = 0
    for i, (c, r) in enumerate(lobes):
        R = r + 0.13
        for row, el in enumerate((-0.15, 0.32, 0.78)):
            line = []
            n = 9 if row < 2 else 6
            span = 1.45 if row < 2 else 1.1
            for s in range(n):
                az = -span + 2 * span * s / (n - 1) + (0.12 if row % 2 else 0)
                d = Vector((math.cos(el) * math.sin(az), -math.cos(el) * math.cos(az), math.sin(el)))
                p = c + d * R
                # (not where another lobe covers it)
                if any((p - oc).length < orr + 0.05 for j, (oc, orr) in enumerate(lobes) if j != i):
                    if len(line) > 1:
                        tube(wire, line, 0.012, shade('#1a3a24'), seg=4)
                    line = []
                    continue
                line.append(p - Vector((0, 0, 0.04)) if s % 2 else p)
                ball(glow, p, 0.055, shade(cols[k % len(cols)]), sub=1)
                k += 1
            if len(line) > 1:
                tube(wire, line, 0.012, shade('#1a3a24'), seg=4)
    # the star on top
    top = max(lobes, key=lambda l: l[0].z + l[1])
    sz = top[0].z + top[1] + 0.3
    star = []
    for a in range(10):
        ang = math.pi / 2 + a / 10 * math.tau
        rr = 0.34 if a % 2 == 0 else 0.15
        star.append((top[0].x + math.cos(ang) * rr, sz + math.sin(ang) * rr))
    slab(glow, star, 0.07, shade('#ffd24a'), axis='y', at=top[0].y - 0.035)
    cyl(wire, top[0].x, top[0].y, sz - 0.42, sz - 0.18, 0.025, color=shade('#8a6a2a'), seg=6)
    return [(wire, 'main'), (glow, 'glow')]


def ribbed(mb, c, R, H, ribs=10, groove=0.1, lo='#c0581c', hi='#f2902e', seg=60, rings=22):
    """A pumpkin's body: a squat ball of lobes with grooves between them, darker in the grooves and underneath, the top
    dimpled where the stem goes (its middle at c, R across, H high)"""
    P, C, N, F = [], [], [], []
    cx, cy, cz = c
    for j in range(rings + 1):
        th = j / rings * math.pi                     # (0 at the bottom)
        for i in range(seg + 1):
            ph = i / seg * math.tau
            lobe = abs(math.sin(ph * ribs / 2))
            rib = 1 - groove * (1 - lobe ** 0.45)
            dimple = 0.18 * math.exp(-((math.pi - th) / 0.42) ** 2) + 0.08 * math.exp(-(th / 0.4) ** 2)
            x, y = math.sin(th) * math.cos(ph) * R * rib, math.sin(th) * math.sin(ph) * R * rib
            z = -math.cos(th) * H * (1 - dimple)
            n = Vector((x / (R * R), y / (R * R), z / (H * H))).normalized()
            p = Vector((cx + x, cy + y, cz + z))
            k = 0.62 + 0.38 * lobe ** 0.6
            col = rgb(lo).lerp(rgb(hi), k) * (0.78 + 0.22 * math.sin(th) ** 0.5)
            P.append(p); N.append(n); C.append(col * (0.84 + 0.24 * max(0.0, n.dot(LIGHT))))
    for j in range(rings):
        for i in range(seg):
            a = j * (seg + 1) + i
            F += [(a, a + 1, a + seg + 2), (a, a + seg + 2, a + seg + 1)]
    mb.add(P, C, N, F)


def stem(mb, top, r=0.05, h=0.14, lean=0.06, seed=0):
    """A pumpkin's stem, curling a little, with a vine tendril and a leaf"""
    rng = random.Random(seed)
    t = Vector(top)
    tube(mb, [t - Vector((0, 0, 0.03)), t + Vector((lean * 0.3, 0, h * 0.6)), t + Vector((lean, 0.01, h))], r, col_fn('#6a7a34', grain='z'), seg=8, r1=r * 0.6)
    a0 = rng.uniform(0, math.tau)
    tube(mb, [t + Vector((math.cos(a0 + k * 0.7) * (0.04 + k * 0.012), math.sin(a0 + k * 0.7) * (0.04 + k * 0.012), 0.01 + 0.012 * math.sin(k))) for k in range(10)], 0.006, shade('#5a8a30'), seg=4)
    a1 = a0 + 2.2
    tip = t + Vector((math.cos(a1) * 0.16, math.sin(a1) * 0.16, -0.02))
    mid = (t + tip) / 2
    sd = Vector((-math.sin(a1), math.cos(a1), 0)) * 0.05
    for q in ((t, mid + sd, tip), (t, tip, mid - sd)):
        P = [Vector(v) + Vector((0, 0, 0.012)) for v in q]
        mb.add(P, [rgb('#5a9a38') * 1.05] * 3, [Vector((0, 0, 1))] * 3, [(0, 1, 2)])


# ---------------------------------------------------------------- carved pumpkins (Spooky Season)
def pumpkin_fn(R, H, ribs=10, groove=0.17):
    """A pumpkin's skin as P(th, ph): th from the bottom (0) to the top (pi), ph round it (the front, -y, on a lobe's
    crown); squat lobes with deep grooves between them, the top dimpled where the stem goes, a little flat underneath."""
    def P(th, ph):
        lobe = abs(math.sin(ph * ribs / 2))
        rib = 1 - groove * (1 - lobe ** 0.45)
        dimple = 0.22 * math.exp(-((math.pi - th) / 0.45) ** 2) + 0.1 * math.exp(-(th / 0.45) ** 2)
        s = math.sin(th)
        return Vector((s * math.cos(ph) * R * rib, s * math.sin(ph) * R * rib, -math.cos(th) * H * (1 - dimple)))
    return P


def closed_surface(P, nth, nph):
    """a closed mesh over P(th, ph): a pole at each end and rings between (points, faces)"""
    V = [P(0.0, 0.0)]
    for j in range(1, nth):
        for i in range(nph):
            V.append(P(j / nth * math.pi, i / nph * math.tau))
    V.append(P(math.pi, 0.0))
    F, top = [], len(V) - 1
    for i in range(nph):
        i1 = (i + 1) % nph
        F.append((0, 1 + i1, 1 + i))
        for j in range(nth - 2):
            a, b = 1 + j * nph + i, 1 + j * nph + i1
            F.append((a, b, b + nph, a + nph))
        F.append((1 + (nth - 2) * nph + i, 1 + (nth - 2) * nph + i1, top))
    return V, F


def soft_normals(V, T):
    """each point's normal: the angle-weighted average of the triangles round it"""
    N = [Vector((0, 0, 0)) for _ in V]
    for t in T:
        a, b, c = (V[i] for i in t)
        n = (b - a).cross(c - a)
        if n.length < 1e-12:
            continue
        n.normalize()
        for i, (p, q, r) in zip(t, ((a, b, c), (b, c, a), (c, a, b))):
            e1, e2 = q - p, r - p
            if e1.length > 1e-9 and e2.length > 1e-9:
                N[i] += n * e1.angle(e2)
    return [n.normalized() if n.length > 1e-9 else Vector((0, 0, 1)) for n in N]


def carved_pumpkin(main, glow, c, R, H, holes, ribs=10, t=0.03, nth=16, nph=40):
    """A pumpkin carved into a jack-o'-lantern: a hollow shell (its skin in main), the holes in its face cut through it
    toward its middle by Blender's exact boolean, so each shows the shell's thickness (cut flesh, in main) and, through
    it, the inside, candlelit (the *_glow part, drawn unlit). holes: outlines [(u, v), ...] on the front about the
    middle c (u across, v up). Returns the skin's function, for the stem and leaf to sit on."""
    import bmesh
    P = pumpkin_fn(R, H, ribs)
    C = Vector(c)
    bm = bmesh.new()
    groups = []
    # (the inside is the skin itself scaled in, point for point, so the two never cross)
    V, F = closed_surface(P, nth, nph)
    for k, sc in enumerate((Vector((1, 1, 1)), Vector((1 - t / R, 1 - t / R, 1 - t / H)))):
        vs = [bm.verts.new(C + v * sc) for v in V]
        fs = [bm.faces.new([vs[i] for i in f]) for f in F]
        for f in fs:
            f.material_index = k
        groups.append(fs)
    bmesh.ops.recalc_face_normals(bm, faces=groups[0])
    bmesh.ops.recalc_face_normals(bm, faces=groups[1])
    bmesh.ops.reverse_faces(bm, faces=groups[1])
    me = bpy.data.meshes.new('pk_shell')
    bm.to_mesh(me)
    bm.free()
    for nm in ('pk_out', 'pk_in'):
        me.materials.append(bpy.data.materials.get(nm) or bpy.data.materials.new(nm))
    shell = link(bpy.data.objects.new('pk_shell', me))
    # the cutters: each outline pushed out along the rays from the middle, from inside the hollow to well outside
    bm = bmesh.new()
    for h in holes:
        n = len(h)
        ring = lambda s: [bm.verts.new(C + Vector((u, -R, v)) * s) for u, v in h]
        fr, bk = ring(1.8), ring(0.3)
        bm.faces.new(fr)
        bm.faces.new(list(reversed(bk)))
        for k in range(n):
            bm.faces.new([fr[(k + 1) % n], fr[k], bk[k], bk[(k + 1) % n]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    cm = bpy.data.meshes.new('pk_cut')
    bm.to_mesh(cm)
    bm.free()
    cm.materials.append(bpy.data.materials.get('pk_cut') or bpy.data.materials.new('pk_cut'))
    cutter = link(bpy.data.objects.new('pk_cut', cm))
    mod = shell.modifiers.new('carve', 'BOOLEAN')
    mod.operation, mod.object, mod.solver, mod.material_mode = 'DIFFERENCE', cutter, 'EXACT', 'TRANSFER'
    bpy.context.view_layer.update()
    ev = shell.evaluated_get(bpy.context.evaluated_depsgraph_get())
    out = ev.to_mesh()
    out.calc_loop_triangles()
    names = [m.name.split('.')[0] for m in out.materials]
    allv = [Vector(v.co) for v in out.vertices]
    tris = {'pk_out': [], 'pk_in': [], 'pk_cut': []}
    for lt in out.loop_triangles:
        tris[names[lt.material_index]].append(tuple(lt.vertices))
    ev.to_mesh_clear()
    for o in (shell, cutter):
        bpy.data.objects.remove(o)
    lo, hi = rgb('#c4561a'), rgb('#f6982e')
    for key, T in tris.items():
        idx = {}
        for tr in T:
            for i in tr:
                idx.setdefault(i, len(idx))
        V = [allv[i] for i in idx]
        TT = [tuple(idx[i] for i in tr) for tr in T]
        N = soft_normals(V, TT)
        cols = []
        for p, n in zip(V, N):
            d = p - C
            if key == 'pk_out':
                lobe = abs(math.sin(math.atan2(d.y, d.x) * ribs / 2))
                up = max(-1.0, min(1.0, d.z / H))
                col = lo.lerp(hi, 0.55 + 0.45 * lobe ** 0.6) * (0.8 + 0.2 * (1 - abs(min(0.0, up)) ** 1.5))
                cols.append(col * (0.86 + 0.22 * max(0.0, n.dot(LIGHT))))
            elif key == 'pk_in':
                # (brightest low down, where the candle stands)
                cols.append(rgb('#ff8a1e').lerp(rgb('#ffdc5a'), max(0.0, min(1.0, 0.7 - d.z / H * 0.7))))
            else:
                # the cut flesh: pale at the skin, deeper toward the inside
                f = max(0.0, min(1.0, (Vector((d.x / R, d.y / R, d.z / H)).length - (1 - t / R) * 0.8) / (t / R * 1.6)))
                cols.append(rgb('#d2681c').lerp(rgb('#f6c060'), f))
        (glow if key == 'pk_in' else main).add(V, cols, N, TT)
    return P


def sweep(mb, path, radii, col, seg=10, ridges=0, amp=0.0):
    """A tube along a path whose radius changes point by point (radii), ridged along its length (ridges, amp), its end
    closed in a point; col(p, n, t) colors it along (t from 0 to 1)."""
    path = [Vector(p) for p in path]
    pts, nrm, cols, F = [], [], [], []
    prev = None
    for i, p in enumerate(path):
        d = (path[min(i + 1, len(path) - 1)] - path[max(i - 1, 0)]).normalized()
        side = d.cross(Vector((0, 0, 1)))
        if side.length < 1e-3:
            side = d.cross(Vector((1, 0, 0)))
        side.normalize()
        if prev is not None and side.dot(prev) < 0:
            side = -side
        prev = side
        up = side.cross(d).normalized()
        for j in range(seg):
            a = j / seg * math.tau
            o = side * math.cos(a) + up * math.sin(a)
            r = radii[i] * (1 + amp * math.cos(a * ridges))
            q = p + o * r
            pts.append(q); nrm.append(o); cols.append(col(q, o, i / (len(path) - 1)))
    for i in range(len(path) - 1):
        for j in range(seg):
            a, b = i * seg + j, i * seg + (j + 1) % seg
            F += [(a, b, b + seg), (a, b + seg, a + seg)]
    tip = len(pts)
    d = (path[-1] - path[-2]).normalized()
    pts.append(path[-1] + d * radii[-1] * 0.6); nrm.append(d); cols.append(col(pts[-1], d, 1.0))
    for j in range(seg):
        a = (len(path) - 1) * seg + j
        F.append((a, (len(path) - 1) * seg + (j + 1) % seg, tip))
    mb.add(pts, cols, nrm, F)


def on_skin(P, c, x, y, lift=0.01):
    """the height of a pumpkin's skin (P about c) over the point (x, y) of its top half, lift above it"""
    C = Vector(c)
    ph = math.atan2(y - C.y, x - C.x)
    r = math.hypot(x - C.x, y - C.y)
    a, b = math.pi / 2, math.pi
    for _ in range(30):
        m = (a + b) / 2
        q = P(m, ph)
        if math.hypot(q.x, q.y) > r:
            a = m
        else:
            b = m
    return C.z + P((a + b) / 2, ph).z + lift


def pumpkin_top(mb, P, c, R, H, seed=0, leaf=True):
    """A pumpkin's stem, short, ridged and curling over, green going brown, with a curly tendril and a five-lobed leaf
    lying over its shoulder"""
    rng = random.Random(seed)
    C = Vector(c)
    k = R / 0.36
    top = Vector((C.x, C.y, C.z + P(math.pi, 0.0).z))
    a = rng.uniform(0, math.tau)
    d = Vector((math.cos(a), math.sin(a), 0))
    h = 0.13 * k
    path = [top - Vector((0, 0, 0.02 * k)), top + Vector((0, 0, h * 0.4)), top + d * h * 0.1 + Vector((0, 0, h * 0.8)),
            top + d * h * 0.35 + Vector((0, 0, h * 1.02)), top + d * h * 0.62 + Vector((0, 0, h * 0.94))]
    g0, g1 = rgb('#6a7a2e'), rgb('#7a5a2c')
    sweep(mb, path, [0.058 * k, 0.042 * k, 0.036 * k, 0.03 * k, 0.024 * k], lambda p, n, t: g0.lerp(g1, t ** 1.3) * (0.82 + 0.25 * max(0.0, n.z)), seg=10, ridges=5, amp=0.14)
    # the tendril: a little spring curling away over the top
    a0 = a + 2.4
    pts = []
    for j in range(18):
        ang = a0 + j * 0.8
        rr = (0.075 - j * 0.0032) * k
        x, y = C.x + math.cos(a0) * 0.06 * k + math.cos(ang) * rr * 0.5, C.y + math.sin(a0) * 0.06 * k + math.sin(ang) * rr * 0.5
        pts.append(Vector((x, y, on_skin(P, C, x, y, (0.012 + 0.02 * (j / 17)) * k))))
    tube(mb, pts, 0.006 * k, shade('#6a8a30'), seg=4)
    if not leaf:
        return
    # the leaf: five lobes round its middle, draped over the skin, a little cupped
    la = a + math.pi * 0.85
    ax, sx = Vector((math.cos(la), math.sin(la), 0)), Vector((-math.sin(la), math.cos(la), 0))
    L = 0.13 * k
    mid2 = Vector((C.x, C.y, 0)) + ax * (0.05 * k + L * 0.95)
    ring = []
    for j in range(30):
        t = j / 30 * math.tau
        rr = L * (0.6 + 0.4 * abs(math.cos(2.5 * t)) ** 0.6) * (0.55 if abs(((t + math.pi) % math.tau) - math.pi) > 2.6 else 1.0)
        ring.append(mid2 + ax * math.cos(t) * rr + sx * math.sin(t) * rr * 0.9)
    lv = [Vector((mid2.x, mid2.y, on_skin(P, C, mid2.x, mid2.y, 0.03 * k)))]
    lv += [Vector((q.x, q.y, on_skin(P, C, q.x, q.y, 0.022 * k))) for q in ring]
    lc = [rgb('#4a8a2c')] + [rgb('#5aa038') * (0.92 + 0.1 * math.cos(j)) for j in range(30)]
    lf = [(0, 1 + (j + 1) % 30, 1 + j) for j in range(30)]
    mb.add(lv, lc, [Vector((0, 0, 1))] * len(lv), lf)
    mb.add([v - Vector((0, 0, 0.005)) for v in lv], [c * 0.75 for c in lc], [Vector((0, 0, -1))] * len(lv), lf)
    tube(mb, [path[0] + Vector((0, 0, 0.02 * k)), lv[0]], 0.007 * k, shade('#4a7a28'), seg=4)


def mouth(W, top, bot, top_teeth=(), bot_teeth=(), n=16):
    """A mouth's outline: its corners at u -W and W, its lower edge bot(u) with teeth standing on it and its upper edge
    top(u) with teeth hanging from it [(u, width, height)], round from the left corner along the bottom and back"""
    def edge(fn, teeth, sgn):
        spans = [(tu - tw / 2, tu + tw / 2, td) for tu, tw, td in teeth]
        out = [(u, fn(u)) for u in (-W + 2 * W * k / n for k in range(n + 1)) if not any(u0 - 0.012 <= u <= u1 + 0.012 for u0, u1, _ in spans)]
        for u0, u1, td in spans:
            out += [(u0, fn(u0)), (u0 + 1e-4, fn(u0) + sgn * td), (u1 - 1e-4, fn(u1) + sgn * td), (u1, fn(u1))]
        return sorted(out, key=lambda q: q[0])
    return edge(bot, bot_teeth, 1) + list(reversed(edge(top, top_teeth, -1)[1:-1]))


def lantern_face(face, R, H):
    """The holes a jack-o'-lantern's face is cut with (at the big one's size, scaled to R and H): the classic grin
    (triangle eyes and nose, a smile with square teeth) or the happy one (eyes shut in arcs, a little nose pointing down,
    a wide smile full of teeth)"""
    ku, kv = R / 0.36, H / 0.29
    if face == 'grin':
        eye = [(-0.235, 0.035), (-0.06, 0.035), (-0.15, 0.18)]
        nose = [(-0.045, -0.018), (0.045, -0.018), (0.0, 0.058)]
        W = 0.25
        m = mouth(W, lambda u: -0.045 - 0.05 * (1 - (u / W) ** 2), lambda u: -0.045 - 0.16 * (1 - (u / W) ** 2) ** 0.8,
                  top_teeth=((-0.09, 0.056, 0.05), (0.09, 0.056, 0.05)), bot_teeth=((0.0, 0.062, 0.05),))
        holes = [eye, [(-u, v) for u, v in reversed(eye)], nose, m]
    else:
        def arc(cx, cy):
            o = [(cx + 0.092 * math.cos(k / 8 * math.pi), cy + 0.085 * math.sin(k / 8 * math.pi)) for k in range(9)]
            i = [(cx + 0.048 * math.cos(k / 8 * math.pi), cy - 0.012 + 0.04 * math.sin(k / 8 * math.pi)) for k in range(8, -1, -1)]
            return o + i
        nose = [(-0.04, 0.03), (0.0, -0.02), (0.04, 0.03)]
        W = 0.24
        m = mouth(W, lambda u: -0.055 - 0.03 * (1 - (u / W) ** 2), lambda u: -0.055 - 0.16 * (1 - (u / W) ** 2) ** 0.7,
                  top_teeth=((-0.11, 0.046, 0.04), (0.0, 0.052, 0.045), (0.11, 0.046, 0.04)), bot_teeth=((-0.055, 0.046, 0.04), (0.055, 0.046, 0.04)))
        holes = [arc(-0.13, 0.06), arc(0.13, 0.06), nose, m]
    # (all a little above the middle: the camera looks down on them)
    return [[(u * ku, (v + 0.025) * kv) for u, v in h] for h in holes]


def jack_o_lantern(face='grin', R=0.36, H=0.29, seed=0):
    """A big carved pumpkin for Spooky Season (David, 27 October: bigger jack-o'-lanterns, not a little pile): squat,
    deeply ribbed, a short curling stem with a tendril and a leaf, its face carved right through the shell, the cut
    flesh showing at each hole's edge and the candlelit inside showing through (the *_glow part, drawn unlit, so it
    glows at night). About two thirds of a tile across; its foot at z 0, its face toward the front (-y)."""
    mb, glow = MB(), MB()
    c = (0, 0, H * 0.91)
    P = carved_pumpkin(mb, glow, c, R, H, lantern_face(face, R, H), ribs=10, t=0.03 * R / 0.36)
    pumpkin_top(mb, P, c, R, H, seed=seed)
    return [(mb, 'main'), (glow, 'glow')]


def pumpkin(mb, c, R, H, ribs=10, seed=0, nth=12, nph=36):
    """A whole pumpkin to go with the jack-o'-lanterns: the same deep ribs, stem, tendril and leaf"""
    P = pumpkin_fn(R, H, ribs)
    V, F = closed_surface(P, nth, nph)
    C = Vector(c)
    V = [C + v for v in V]
    T = [t for f in F for t in ([f] if len(f) == 3 else [(f[0], f[1], f[2]), (f[0], f[2], f[3])])]
    N = soft_normals(V, T)
    # (outward: the triangles are wound by MB.add from these normals)
    N = [n if n.dot(v - C) >= 0 else -n for n, v in zip(N, V)]
    lo, hi = rgb('#c4561a'), rgb('#f6982e')
    cols = []
    for p, n in zip(V, N):
        d = p - C
        lobe = abs(math.sin(math.atan2(d.y, d.x) * ribs / 2))
        up = max(-1.0, min(1.0, d.z / H))
        cols.append(lo.lerp(hi, 0.55 + 0.45 * lobe ** 0.6) * (0.8 + 0.2 * (1 - abs(min(0.0, up)) ** 1.5)) * (0.86 + 0.22 * max(0.0, n.dot(LIGHT))))
    mb.add(V, cols, N, T)
    pumpkin_top(mb, P, c, R, H, seed=seed)


def jack_stack():
    """The square's corners in Spooky Season: a hay bale with a jack-o'-lantern on top, a little pumpkin beside it there
    and two more on the ground in front, about a tile across."""
    out = hay()
    mb = out[0][0]
    # (the same pumpkins as the jack-o'-lanterns: deep ribs, a curling stem, a tendril and a leaf)
    for (x, y, r, h, sd) in ((0.25, 0.05, 0.13, 0.1, 3), (-0.5, -0.36, 0.16, 0.12, 4), (0.52, -0.4, 0.12, 0.095, 5)):
        z = 0.5 + h * 0.91 if abs(y) < 0.2 else h * 0.91
        pumpkin(mb, (x, y, z), r, h, ribs=8 if sd % 2 else 10, seed=sd, nth=10, nph=32 if sd % 2 else 30)
    (jm, _), (jg, _) = jack_o_lantern('grin', 0.25, 0.2, seed=8)
    glow = MB()
    merge(mb, jm, (-0.12, 0, 0.5))
    merge(glow, jg, (-0.12, 0, 0.5))
    return [(mb, 'main'), (glow, 'glow')]


def present(mb, x, y, z, w, d, h, box, ribbon, turn=0.0):
    """a wrapped present standing at (x, y, z): the box, a ribbon round it both ways and a bow of two loops on top"""
    m = len(mb.v)
    rbox(mb, -w / 2, -d / 2, 0, w / 2, d / 2, h, col_fn(box, under=0.12), r=min(w, d, h) * 0.08)
    rb = min(w, d) * 0.16
    rbox(mb, -rb / 2, -d / 2 - 0.004, -0.004, rb / 2, d / 2 + 0.004, h + 0.004, shade(ribbon), r=0.004)
    rbox(mb, -w / 2 - 0.004, -rb / 2, -0.004, w / 2 + 0.004, rb / 2, h + 0.004, shade(ribbon), r=0.004)
    s = min(w, d) * 0.22
    for sx in (-1, 1):
        tube(mb, [(0, 0, h), (sx * s * 0.6, -s * 0.15, h + s * 0.55), (sx * s * 1.05, 0, h + s * 0.35), (sx * s * 0.5, s * 0.1, h + 0.01)], s * 0.18, shade(ribbon), seg=6)
    ball(mb, (0, 0, h + s * 0.08), s * 0.22, shade(ribbon), sub=2)
    xform(mb, m, Matrix.Translation((x, y, z)) @ rot(z=turn))


def grand_presents():
    """Presents piled under the square's grand tree for the Winter Holiday (David, 27 October: more elaborate the more the
    day matters): a dozen wrapped boxes in the holiday's colors on the soil in front of the trunk and round its sides, a
    few stacked, in the grand tree's own coordinates (the game stands it on the planter's soil where the tree stands)."""
    mb, r = MB(), random.Random(24)
    wraps = [('#d83a3a', '#f8d048'), ('#3a8a4a', '#d83a3a'), ('#f4f0e0', '#d83a3a'), ('#4a7ad0', '#f4f0e0'),
             ('#f8c040', '#3a8a4a'), ('#b05ad0', '#f8d048'), ('#e86a9a', '#ffffff'), ('#d83a3a', '#ffffff')]
    spots = [(-0.95, -0.55, 0.3), (-0.55, -0.85, 0.36), (-0.12, -0.98, 0.28), (0.32, -0.92, 0.34), (0.72, -0.7, 0.3),
             (1.0, -0.3, 0.24), (-1.08, -0.12, 0.24), (0.15, -0.62, 0.22), (-0.4, -0.5, 0.2)]
    for k, (x, y, s) in enumerate(spots):
        w, d, h = s * (0.8 + r.random() * 0.4), s * (0.8 + r.random() * 0.35), s * (0.65 + r.random() * 0.5)
        box, rib = wraps[k % len(wraps)]
        t = r.uniform(-0.5, 0.5)
        present(mb, x, y, 0, w, d, h, box, rib, t)
        # a little one on top of a few of the big ones
        if k in (1, 3, 6):
            b2, r2 = wraps[(k + 3) % len(wraps)]
            present(mb, x + r.uniform(-0.03, 0.03), y, h + 0.01, w * 0.6, d * 0.6, h * 0.55, b2, r2, t + r.uniform(-0.6, 0.6))
    return [(mb, 'main')]


def snowman():
    """A snowman on the square in winter (David, 27 October: decorations for the seasons too): three balls of snow, coal
    eyes and buttons, a carrot nose, twig arms, a red scarf with its tail hanging, and a little black top hat."""
    mb, r = MB(), random.Random(7)

    def snow(p, n):
        k = 0.93 + 0.07 * (0.5 + 0.5 * noise.noise(p * 9))
        return rgb('#f4f8ff').lerp(rgb('#c8d8ec'), max(0.0, -n.z) * 0.6 + max(0.0, -n.y) * 0.05) * k
    for (z, rr) in ((0.24, 0.26), (0.62, 0.19), (0.9, 0.14)):
        ball(mb, (0, 0, z), (rr, rr, rr * 0.94), snow, sub=3)
    coal = shade('#24242a')
    for sx in (-1, 1):
        ball(mb, (sx * 0.05, -0.125, 0.94), 0.019, coal, sub=2)
    for z in (0.56, 0.64, 0.72):
        ball(mb, (0, -0.19 + abs(z - 0.64) * 0.25, z), 0.02, coal, sub=2)
    # (the carrot: a cone sticking out toward the front)
    m = len(mb.v)
    lathe(mb, [(0.026, 0.0), (0.02, 0.04), (0.01, 0.09), (0.0, 0.12)], shade('#f08a2a'), seg=10)
    xform(mb, m, Matrix.Translation((0, -0.13, 0.9)) @ rot(x=math.pi / 2 - 0.25))
    for sx in (-1, 1):
        tube(mb, [(sx * 0.16, 0, 0.66), (sx * 0.3, -0.01, 0.76), (sx * 0.4, 0.0, 0.84)], 0.012, shade('#6a4a2a'), seg=5, r1=0.007)
        tube(mb, [(sx * 0.33, -0.01, 0.78), (sx * 0.38, -0.02, 0.86)], 0.008, shade('#6a4a2a'), seg=4, r1=0.005)
    # the scarf round the neck, its tail hanging down the front
    tube(mb, [(math.cos(a) * 0.135, math.sin(a) * 0.135, 0.785) for a in (i / 16 * math.tau for i in range(17))], 0.03, col_fn('#d83a3a', under=0.1), seg=8)
    rbox(mb, 0.04, -0.17, 0.62, 0.11, -0.13, 0.79, col_fn('#d83a3a', under=0.1), r=0.015)
    for z in (0.64, 0.66):
        rbox(mb, 0.035, -0.176, z, 0.115, -0.165, z + 0.008, shade('#f4f0e0'), r=0.003)
    # the hat
    cyl(mb, 0, 0, 1.0, 1.015, 0.13, 0.13, shade('#2a2a30'), seg=18, round_=0.005)
    cyl(mb, 0, 0, 1.01, 1.15, 0.085, 0.09, shade('#2a2a30'), seg=18, round_=0.01)
    cyl(mb, 0, 0, 1.02, 1.05, 0.092, 0.092, shade('#c83a3a'), seg=18)
    return [(mb, 'main')]


def harvest_stack():
    """The square's corners for the Harvest Festival and Feast Day: a hay bale with a big pumpkin and a little white one on
    top, two more pumpkins and a gourd on the ground in front, and a sheaf of corn stalks tied with a ribbon leaning at its
    back corner, about a tile across."""
    out = hay()
    mb = out[0][0]
    for (x, y, z, r, h, lo, hi, sd) in ((0.12, 0.0, 0.5, 0.17, 0.13, '#c8641e', '#f4a040', 3), (-0.24, 0.06, 0.5, 0.1, 0.08, '#d8d0b8', '#f8f2e0', 4),
                                         (-0.48, -0.38, 0.0, 0.15, 0.11, '#c8641e', '#f4a040', 5), (0.45, -0.42, 0.0, 0.11, 0.09, '#b85a1e', '#e89a3a', 6)):
        ribbed(mb, (x, y, z + h * 0.97), r, h, lo=lo, hi=hi, seg=36, rings=14)
        stem(mb, (x, y, z + h * 1.77), r=0.02, h=0.06, lean=0.03, seed=sd)
    # a striped gourd lying in front
    ball(mb, (0.0, -0.46, 0.06), (0.09, 0.06, 0.06), lambda p, n: rgb('#e8c040').lerp(rgb('#3a8a3a'), 1.0 if math.sin(p.x * 70) > 0.3 else 0.0), sub=3)
    # the corn sheaf: stalks bundled and tied, fanning at the top with long drooping leaves, a few ears with their husks
    rng = random.Random(9)
    stalk = shade('#c8a858')
    for k in range(12):
        a = k / 12 * math.tau
        bx, by = 0.36 + math.cos(a) * 0.05, 0.24 + math.sin(a) * 0.05
        tx, ty, tz = bx + math.cos(a) * 0.2 + rng.uniform(-0.03, 0.03), by + math.sin(a) * 0.12, 1.1 + rng.uniform(-0.1, 0.08)
        tube(mb, [(bx, by, 0.0), (bx, by, 0.55), (tx, ty, tz)], 0.026, stalk, seg=6, r1=0.01)
        # two leaves off each stalk, arching out and down
        for (f, sz) in ((0.62, 0.3), (0.82, 0.24)):
            px, py, pz = bx + (tx - bx) * (f - 0.5) * 2 * 0.5, by + (ty - by) * (f - 0.5), 0.55 + (tz - 0.55) * (f - 0.45) / 0.55
            ox, oy = math.cos(a + rng.uniform(-0.4, 0.4)), math.sin(a + rng.uniform(-0.4, 0.4))
            tube(mb, [(px, py, pz), (px + ox * sz * 0.5, py + oy * sz * 0.4, pz + sz * 0.25), (px + ox * sz, py + oy * sz * 0.7, pz - sz * 0.25)], 0.018, shade('#d8bc6a'), seg=4, r1=0.004)
    for (dx, dy) in ((0.06, -0.05), (-0.05, -0.06)):
        ball(mb, (0.36 + dx, 0.24 + dy, 0.62), (0.03, 0.03, 0.09), shade('#f0c040'), sub=2)
    cyl(mb, 0.36, 0.24, 0.5, 0.56, 0.065, 0.065, shade('#c83a3a'), seg=14)
    return [(mb, 'main')]


def merge(dst, src, off=(0, 0, 0)):
    """one mesh's pieces added to another's, moved by off"""
    o = Vector(off)
    dst.add([v + o for v in src.v], src.c, src.n, src.f)


def bigtree_planter():
    """The square's big tree stands in a raised ring of rounded stones (David, 27 October: not a giant tree on the
    flagstones): two courses of stones under a capping, grass and soil inside with the tree's roots showing and little
    flowers round the edge. About three tiles across (the tiles round the tree that nobody walks on: 20_world.js); the
    game stretches it in depth to the grid and stands the tree on the soil at z 0.27."""
    mb, r = MB(), random.Random(41)
    R0, R1 = 1.42, 1.62
    for course, (z0, z1, n, off) in enumerate(((0.0, 0.15, 30, 0.0), (0.15, 0.29, 29, 0.5))):
        for k in range(n):
            a0, a1 = (k + off + 0.04) / n * math.tau, (k + off + 0.96) / n * math.tau
            c = r.choice(('#c4bcae', '#b8b0a2', '#cfc6b6', '#aea594'))
            m = len(mb.v)
            w = (a1 - a0) * (R0 + R1) / 2
            rbox(mb, -w / 2, R0 + r.uniform(-0.01, 0.02), z0 + 0.005, w / 2, R1 + r.uniform(-0.02, 0.01), z1 - 0.004 + r.uniform(-0.01, 0.01), stone(c, seed=k + course * 9), r=0.035)
            xform(mb, m, Matrix.Rotation((a0 + a1) / 2 - math.pi / 2, 4, 'Z'))
    lathe(mb, [(R1 + 0.03, 0.28), (R1 + 0.04, 0.31), (R1 + 0.02, 0.33), (R0 - 0.02, 0.33), (R0 - 0.04, 0.31), (R0 - 0.03, 0.27)], stone('#d6cebe'), seg=48, cap_top=False)
    # inside: soil darkening toward the wall, grass over it
    lathe(mb, [(R0 - 0.02, 0.25), (R0 - 0.3, 0.262), (0.0, 0.27)], lambda p, n, *_: rgb('#6aa846').lerp(rgb('#7a5a38'), max(0.0, min(1.0, (math.hypot(p.x, p.y) - (R0 - 0.32)) / 0.28)) * 0.6) * (0.9 + 0.12 * noise.noise(p * 6)), seg=48)
    for k in range(120):
        a, q = r.uniform(0, math.tau), math.sqrt(r.uniform(0.04, 1.0)) * (R0 - 0.1)
        x, y = math.cos(a) * q, math.sin(a) * q
        lathe(mb, [(0.026, 0.0), (0.0, 0.07 + r.uniform(0, 0.04))], shade(r.choice(('#5f9a3a', '#6aa848', '#78b450'))), c=(x, y, 0.265), seg=5)
    # the roots reaching out from the trunk into the soil
    bark = col_fn('#7a5230', grain='z', under=0.0)
    for k in range(6):
        a = k / 6 * math.tau + r.uniform(-0.2, 0.2)
        d, L = Vector((math.cos(a), math.sin(a), 0)), r.uniform(0.45, 0.8)
        side = Vector((-d.y, d.x, 0)) * r.uniform(-0.12, 0.12)
        tube(mb, [d * 0.12 + Vector((0, 0, 0.34)), d * L * 0.5 + side * 0.5 + Vector((0, 0, 0.3)), d * L * 0.8 + side + Vector((0, 0, 0.275)), d * L + side * 1.2 + Vector((0, 0, 0.262))], 0.06, bark, seg=7, r1=0.015)
    # little flowers round the inside of the wall
    for k in range(28):
        a = k / 28 * math.tau + r.uniform(-0.08, 0.08)
        q = R0 - 0.12 + r.uniform(-0.04, 0.03)
        x, y = math.cos(a) * q, math.sin(a) * q
        col = r.choice(('#f8f2f6', '#ffd84a', '#f48ab0', '#c8a0f0'))
        ball(mb, (x, y, 0.335), (0.036, 0.036, 0.01), shade(col), sub=1)
        ball(mb, (x, y, 0.342), 0.012, shade('#f8c040'), sub=1)
        lathe(mb, [(0.008, 0.0), (0.006, 0.07)], shade('#4a8a30'), c=(x, y, 0.265), seg=4, cap_top=False)
    return [(mb, 'main')]


# ---------------------------------------------------------------- the town's projects (game/src/6zgb_projects.js)
def swing_set():
    """A wooden A-frame swing set three tiles wide; its two seats on their chains are a model of their own
    (swing_set_sails), hung from the top bar at anchor_hub, so the game can swing them."""
    mb, seats = MB(), MB()
    TOP = 1.72
    for x in (-1.32, 1.32):
        for s in (-1, 1):
            tube(mb, [(x, s * 0.56, 0.0), (x, s * 0.04, TOP - 0.04)], 0.055, wood(WOOD, seed=3 + s), seg=10)
            rbox(mb, x - 0.09, s * 0.56 - 0.09, -0.01, x + 0.09, s * 0.56 + 0.09, 0.07, wood(WOOD_D), r=0.02)
        rbox(mb, x - 0.035, -0.33, 0.62, x + 0.035, 0.33, 0.7, wood(WOOD_D), r=0.015)
    tube(mb, [(-1.48, 0, TOP), (1.48, 0, TOP)], 0.075, wood(WOOD_L, 'x'), seg=12)
    for x in (-1.48, 1.48):
        ball(mb, (x, 0, TOP), (0.03, 0.085, 0.085), wood(WOOD_D), sub=2)
    for x in (-0.62, 0.62):
        for dx in (-0.25, 0.25):
            tube(mb, [(x + dx, 0, TOP - 0.04), (x + dx, 0, TOP - 0.1)], 0.02, shade('#5a5a62'), seg=6)
            # (the chains: a string of little links)
            for k in range(14):
                z = -0.1 - k * 0.088
                ball(seats, (x + dx, 0, z), (0.014, 0.008 if k % 2 else 0.016, 0.03), shade('#8a8a92'), sub=1)
        rbox(seats, x - 0.31, -0.14, -1.37, x + 0.31, 0.14, -1.3, wood('#d0503a' if x < 0 else '#3a8ad0', 'x'), r=0.03)
    return [(mb, 'main')], [(seats, 'seats')], [(0, 0, TOP)]


def hammock():
    """A striped hammock slung between two posts on the beach, three tiles wide: a wide bed of cloth (striped along its
    length, bound in teal, a scalloped valance down each side) held open at each end by a wooden spreader bar, strings
    fanning from each bar to an iron ring, a rope from the ring to the post; a cushion at the head, the west end, where
    the game lays Sarah's head (Projects.hammock: her doll along the cloth, half a tile up)."""
    mb, cloth = MB(), MB()
    PX, BX, ZE = 1.32, 0.96, 0.8            # the posts, the spreader bars, the height of the bed's ends
    rope = col_fn('#efe2c4', under=0.0)
    TEAL = '#3aa8b4'
    for s in (-1, 1):
        x = s * PX
        # the post: a chunky turned log on a stone footing, its top rounded, rope wound round it where the hammock ties on
        lathe(mb, [(0.14, 0.0), (0.13, 0.07), (0.09, 0.11)], stone('#d8ccb0'), c=(x, 0, 0), seg=10, cap_top=False)
        lathe(mb, [(0.082, 0.08), (0.078, 0.7), (0.072, 1.17), (0.079, 1.2), (0.05, 1.28), (0.0, 1.3)], wood(WOOD_D, seed=s), c=(x, 0, 0), seg=10, cap_top=False)
        lathe(mb, [(0.074, 0.99), (0.09, 1.01), (0.083, 1.04), (0.09, 1.07), (0.074, 1.09)], rope, c=(x, 0, 0), seg=10, cap_top=False)
        # the spreader bar, a turned rod with round ends
        bx = s * BX
        tube(mb, [(bx, -0.46, ZE + 0.025), (bx, 0.46, ZE + 0.025)], 0.032, wood(WOOD_L, 'y', seed=2 + s), seg=10)
        for y in (-0.46, 0.46):
            sball(mb, (bx, y, ZE + 0.025), 0.045, wood(WOOD), sub=2)
        # five strings from the bar to an iron ring, a rope from the ring to the post
        rx, rz = s * 1.14, 1.0
        for y in (-0.4, -0.2, 0.0, 0.2, 0.4):
            tube(mb, [(bx, y, ZE + 0.05), (rx - s * 0.03, 0, rz - 0.01)], 0.008, rope, seg=4)
        tube(mb, [(rx + 0.034 * math.cos(k / 9 * math.tau), 0, rz + 0.034 * math.sin(k / 9 * math.tau)) for k in range(10)], 0.011, shade('#5a5a62'), seg=5)
        tube(mb, [(rx + s * 0.03, 0, rz + 0.01), (x - s * 0.07, 0, 1.04)], 0.016, rope, seg=6)
    # the bed: sagging from bar to bar, flat where the bars hold it, curling up at its sides in the middle
    X0, X1 = -BX + 0.03, BX - 0.03

    def F(u, v):
        sg = math.sin(math.pi * u)
        w = 2 * v - 1
        half = 0.42 - 0.03 * sg
        return Vector((X0 + (X1 - X0) * u, w * half * (1 - 0.07 * sg * w * w), ZE - 0.39 * sg + 0.14 * sg * w * w))
    bands = [(0.0, TEAL), (0.055, '#f6eedc'), (0.16, '#e8604a'), (0.3, '#f6eedc'), (0.39, '#e8604a'), (0.61, '#f6eedc'), (0.7, '#e8604a'),
             (0.84, '#f6eedc'), (0.945, TEAL)]

    def col(u, v):
        c = [b for b in bands if b[0] <= v + 1e-9][-1][1]
        return rgb(c) * (0.95 + 0.05 * math.sin(math.pi * u))
    vs = [0.0]
    for b, _ in bands[1:]:
        vs += [b - 0.005, b + 0.005]
    vs = sorted(set(vs + [0.5, 1.0]))
    us = [k / 16 for k in range(17)]
    sheet(cloth, F, us, vs, col, thick=0.022)
    # the valance down each long side: a teal flap, scalloped along its foot (front and back)
    for v, side in ((0.0, -1), (1.0, 1)):
        n = 7 * 4
        top, foot = [], []
        for k in range(n + 1):
            u = 0.02 + 0.96 * k / n
            p = F(u, v)
            top.append(p + Vector((0, side * 0.004, -0.01)))
            foot.append(p + Vector((0, side * 0.012, -0.045 - 0.05 * abs(math.sin(math.pi * k / 4)) ** 0.7)))
        for off, sgn in ((0.0, side), (-side * 0.008, -side)):
            pts, cc, nn, ff = [], [], [], []
            for k in range(n + 1):
                pts += [top[k] + Vector((0, off, 0)), foot[k] + Vector((0, off, 0))]
                cc += [rgb(TEAL), rgb(TEAL) * 0.82]
                nn += [Vector((0, sgn, 0.25)), Vector((0, sgn, 0.0))]
                if k:
                    b = 2 * k
                    ff += [(b - 2, b, b + 1), (b - 2, b + 1, b - 1)]
            cloth.add(pts, cc, nn, ff)
    # a cushion at the head end, a puffy square lying along the cloth's slope
    u = (-0.64 - X0) / (X1 - X0)
    c = F(u, 0.5)
    m = len(cloth.v)
    surf(cloth, superq(0, 0, 0, 0.15, 0.25, 0.06, 0.35, 0.7), col_fn('#f8d860', under=0.0), nu=16, nv=8)
    tilt = math.atan2(F(u + 0.01, 0.5).z - F(u - 0.01, 0.5).z, F(u + 0.01, 0.5).x - F(u - 0.01, 0.5).x)
    xform(cloth, m, Matrix.Translation(c + Vector((0, 0, 0.055))) @ Euler((0, -tilt, 0)).to_matrix().to_4x4())
    return [(mb, 'main'), (cloth, 'cloth')]


# the park clock's faces (the game hangs its hands there, park_clock_hour and park_clock_minute: EnvBuild.CLOCK_FACE)
CLOCK_FACE = (0.0, 0.125, 2.06)


def park_clock():
    """A park clock: a green iron post with a round clock on top, a face to the front and one to the back, and a lamp
    of a finial; its hands are models of their own, turned to the time."""
    mb, glow = MB(), MB()
    G = '#2e6a4a'
    lathe(mb, [(0.3, 0.0), (0.3, 0.08), (0.24, 0.12), (0.2, 0.18), (0.13, 0.24), (0.1, 0.4)], col_fn(G, under=0.3), seg=24, cap_top=False)
    lathe(mb, [(0.075, 0.38), (0.06, 1.0), (0.055, 1.6), (0.07, 1.68), (0.09, 1.72)], shade(G), seg=16, cap_top=False)
    for z in (0.62, 1.2):
        lathe(mb, [(0.06, z), (0.085, z + 0.02), (0.085, z + 0.05), (0.06, z + 0.07)], shade('#c8a048'), seg=16, cap_top=False)
    cx, cy, cz = CLOCK_FACE
    R = 0.36
    # the case and both faces, turned upright from the lathe (its axis along y): the drum, the rims, the faces
    lay = Matrix.Translation((cx, 0, cz)) @ Euler((math.pi / 2, 0, 0)).to_matrix().to_4x4()
    m = len(mb.v)
    lathe(mb, [(R + 0.06, -0.11), (R + 0.075, -0.09), (R + 0.075, 0.09), (R + 0.06, 0.11)], shade(G), seg=40, cap_top=False)
    for z in (-0.11, 0.11):
        lathe(mb, [(R + 0.06, z), (R + 0.0, z + (0.012 if z > 0 else -0.012))], shade('#c8a048'), seg=40, cap_top=False)
    lathe(mb, [(R, cy), (0.0, cy)], shade('#f6f0de'), seg=40, cap_top=False)
    lathe(mb, [(0.0, -cy), (R, -cy)], shade('#f6f0de'), seg=40, cap_top=False)
    xform(mb, m, lay)
    # the hour marks on both faces
    for s in (-1, 1):
        for k in range(12):
            a = k / 12 * math.tau
            x, z = math.cos(a) * 0.29, math.sin(a) * 0.29
            dx, dz = (0.03, 0.011) if k in (0, 6) else (0.011, 0.03) if k in (3, 9) else (0.012, 0.012)
            y = s * (cy + 0.003)
            rbox(mb, cx + x - dx, y - 0.003, cz + z - dz, cx + x + dx, y + 0.003, cz + z + dz, shade('#2a2a2a'), r=0.002, mid=0)
    # the cap and its little lamp
    lathe(mb, [(0.2, cz + R + 0.04), (0.16, cz + R + 0.1), (0.06, cz + R + 0.2), (0.0, cz + R + 0.24)], shade(G), seg=20, cap_top=False, cap_bot=True)
    lathe(mb, [(0.05, cz - R - 0.1), (0.07, cz - R - 0.04), (0.05, cz - R + 0.02)], shade(G), seg=12, cap_top=False)
    ball(glow, (0, 0, cz + R + 0.3), 0.07, shade('#ffe8a0'), sub=2)
    ball(mb, (0, 0, cz + R + 0.39), 0.03, shade('#c8a048'), sub=1)
    return [(mb, 'main'), (glow, 'glow')]


def park_clock_hand(kind):
    """A hand of the park clock, pointing at 12 about the middle of its face (origin), a face's worth in front of it."""
    mb = MB()
    L, W = (0.27, 0.016) if kind == 'minute' else (0.18, 0.022)
    for s in (-1, 1):
        rbox(mb, -W, s * 0.012 - 0.005, -0.04, W, s * 0.012 + 0.005, L, shade('#22201e'), r=0.006, mid=0)
    ball(mb, (0, 0, 0), (0.03, 0.022, 0.03), shade('#c8a048'), sub=1)
    return [(mb, 'main')]


def shrine_stone():
    """The stone tablet on the mountain top: an old carved stele on a stepped base, mossy at its foot, with a stone
    lantern each side and a little dish of offerings, two tiles wide."""
    mb, glow = MB(), MB()
    rbox(mb, -0.85, -0.42, 0.0, 0.85, 0.42, 0.12, stone('#a8a094', seed=1), r=0.04)
    rbox(mb, -0.6, -0.3, 0.12, 0.6, 0.3, 0.24, stone('#b4ac9e', seed=2), r=0.04)
    # the stele: rounded at the top
    out = [(-0.34, 0.24)]
    for k in range(13):
        a = math.pi * k / 12
        out.append((-0.34 + 0.34 * (1 - math.cos(a)), 1.22 + 0.2 * math.sin(a)))
    out.append((0.34, 0.24))
    slab(mb, out[::-1] if False else out, 0.16, stone('#c0b8a8', seed=4), axis='y', at=-0.08)
    # its carving: rows of inset marks, and a sun at the top
    r = random.Random(5)
    for row in range(6):
        z = 0.42 + row * 0.12
        x = -0.24
        while x < 0.22:
            w = r.uniform(0.03, 0.08)
            rbox(mb, x, -0.088, z, x + w, -0.08, z + 0.05, shade('#6e675c'), r=0.004, mid=0)
            x += w + r.uniform(0.02, 0.05)
    m = len(mb.v)
    lathe(mb, [(0.09, 0.0), (0.0, 0.0)], shade('#6e675c'), c=(0, 0, 0), seg=16, cap_top=False)
    xform(mb, m, Matrix.Translation((0, -0.088, 1.25)) @ Euler((math.pi / 2, 0, 0)).to_matrix().to_4x4())
    for k in range(8):
        a = k / 8 * math.tau
        rbox(mb, math.cos(a) * 0.13 - 0.012, -0.088, 1.25 + math.sin(a) * 0.13 - 0.012, math.cos(a) * 0.13 + 0.012, -0.08, 1.25 + math.sin(a) * 0.13 + 0.012, shade('#6e675c'), r=0.004, mid=0)
    # moss at its foot
    for k in range(18):
        x, y = r.uniform(-0.55, 0.55), r.choice((-0.3, 0.3)) + r.uniform(-0.04, 0.04)
        ball(mb, (x, y, 0.24), (r.uniform(0.05, 0.1), 0.05, 0.035), shade(r.choice(('#5a8a3a', '#6a9a44', '#4e7a34'))), sub=1)
    # two stone lanterns
    for x in (-0.7, 0.7):
        lathe(mb, [(0.1, 0.12), (0.08, 0.16), (0.05, 0.4), (0.09, 0.42), (0.12, 0.44)], stone('#b8b0a2'), c=(x, 0, 0), seg=10, cap_top=False)
        rbox(mb, x - 0.09, -0.09, 0.44, x + 0.09, 0.09, 0.58, stone('#c4bcae'), r=0.02)
        rbox(glow, x - 0.06, -0.095, 0.47, x + 0.06, 0.095, 0.55, shade('#ffd88a'), r=0.01, mid=0)
        lathe(mb, [(0.16, 0.58), (0.14, 0.62), (0.05, 0.72), (0.0, 0.74)], stone('#a8a094'), c=(x, 0, 0), seg=6, cap_top=False)
    # a dish of offerings: a peach and a little cup
    lathe(mb, [(0.0, 0.24), (0.12, 0.25), (0.13, 0.28)], shade('#e8e0d0'), c=(0, -0.22, 0), seg=16, cap_top=False, cap_bot=True)
    ball(mb, (-0.03, -0.22, 0.31), 0.045, shade('#f4a088'), sub=2)
    lathe(mb, [(0.0, 0.25), (0.03, 0.25), (0.035, 0.3)], shade('#c84a3a'), c=(0.07, -0.22, 0), seg=10, cap_top=False, cap_bot=True)
    return [(mb, 'main'), (glow, 'glow')]


def statue_sarah():
    """Sarah's statue, the town's last and grandest project: her in bronze (the doll kit) on a tall stone plinth with
    steps, flowers round its foot and a brass plaque, two tiles square."""
    mb = MB()
    rbox(mb, -0.95, -0.95, 0, 0.95, 0.95, 0.14, stone('#a8a094'), r=0.04)
    rbox(mb, -0.75, -0.75, 0.14, 0.75, 0.75, 0.3, stone('#b8b0a2'), r=0.04)
    rbox(mb, -0.5, -0.5, 0.3, 0.5, 0.5, 1.0, stone('#ccc4b4'), r=0.04)
    rbox(mb, -0.56, -0.56, 1.0, 0.56, 0.56, 1.1, stone('#b8b0a2'), r=0.04)
    rbox(mb, -0.26, -0.515, 0.48, 0.26, -0.5, 0.74, col_fn('#c8a048'), r=0.006)
    r = random.Random(9)
    for k in range(26):
        a = k / 26 * math.tau
        x, y = math.cos(a) * 0.86, math.sin(a) * 0.86
        x, y = max(-0.88, min(0.88, x * 1.2)), max(-0.88, min(0.88, y * 1.2))
        col = r.choice(('#f8f2f6', '#ffd84a', '#f48ab0', '#e85a5a', '#c8a0f0'))
        ball(mb, (x, y, 0.19), (0.05, 0.05, 0.02), shade(col), sub=1)
        ball(mb, (x, y, 0.15), (0.06, 0.06, 0.03), shade('#5a9a3a'), sub=1)
    return [(mb, 'main')], 'statue_doll:sarah'


def tama_keychain():
    """Sarah's Tamagotchi on its keychain, for the statue on the square (game/src/6zgc_statue.js casts it in bronze): the
    egg standing on its foot with its screen, a pixel pet on it and three buttons, a loop on top, three links of chain and
    the key ring, about a tile and a third tall."""
    mb = MB()

    def ring(c, r, t, axis='y', color='#c8c8d0', seg=20):
        pts = []
        for k in range(seg + 1):
            a = k / seg * math.tau
            u, v = math.cos(a) * r, math.sin(a) * r
            pts.append((c[0] + u, c[1], c[2] + v) if axis == 'y' else (c[0], c[1] + u, c[2] + v))
        tube(mb, pts, t, shade(color), seg=8)
    # the egg, flattened front to back, a pink shell freckled with little stars
    prof = [(0.0, 0.0), (0.2, 0.02), (0.34, 0.1), (0.42, 0.25), (0.44, 0.42), (0.41, 0.6), (0.33, 0.78), (0.2, 0.92), (0.0, 0.98)]
    lathe(mb, prof, col_fn('#f07aa8', mottle=0.04), seg=36, sy=0.55)
    r = random.Random(4)
    for k in range(14):
        a = r.uniform(-1.2, 1.2) + (math.pi if k % 2 else 0)
        z = r.uniform(0.15, 0.85)
        rr = [x for x, zz in prof if zz <= z][-1] if z > 0 else 0.2
        ball(mb, (math.sin(a) * rr * 0.98, -math.cos(a) * rr * 0.55 * 0.98, z), (0.022, 0.012, 0.022), shade('#ffd84a'), sub=1)
    # the screen in its frame, and the pet on it
    rbox(mb, -0.23, -0.27, 0.42, 0.23, -0.18, 0.74, shade('#d8d0c4'), r=0.04)
    rbox(mb, -0.18, -0.29, 0.46, 0.18, -0.24, 0.7, shade('#b4c89a'), r=0.02)
    for x, z in ((-0.03, 0.62), (0.03, 0.62), (-0.06, 0.58), (0.0, 0.58), (0.06, 0.58), (-0.06, 0.54), (0.06, 0.54), (-0.03, 0.5), (0.03, 0.5)):
        rbox(mb, x - 0.022, -0.3, z - 0.018, x + 0.022, -0.285, z + 0.018, shade('#3a4a30'), r=0.004)
    # three buttons under it
    for x in (-0.13, 0.0, 0.13):
        ball(mb, (x, -0.235, 0.27 - abs(x) * 0.25), (0.05, 0.03, 0.05), shade('#f8f2e6'), sub=2)
    # the loop, the chain and the key ring
    ring((0, 0, 1.03), 0.06, 0.018)
    ring((0, 0, 1.12), 0.045, 0.014, axis='x')
    ring((0, 0, 1.2), 0.045, 0.014)
    ring((0, 0, 1.28), 0.045, 0.014, axis='x')
    ring((0, 0, 1.47), 0.17, 0.022)
    return [(mb, 'main')]


def door_boards():
    """Boards nailed over the lighthouse door until the town restores it: two planks up, two across in an X, and a
    notice; its back against the wall (y 0), facing -y, its middle at x 0."""
    mb, pic = MB(), MB()
    for x, seed in ((-0.2, 1), (0.2, 2)):
        rbox(mb, x - 0.17, -0.06, 0.0, x + 0.17, 0.0, 1.32, wood('#9a7650', 'z', seed=seed), r=0.015)
    for s in (-1, 1):
        m = len(mb.v)
        rbox(mb, -0.62, -0.12, -0.07, 0.62, -0.06, 0.07, wood('#b08458', 'x', seed=s + 4), r=0.015)
        xform(mb, m, Matrix.Translation((0, 0, 0.68)) @ Euler((0, s * 0.82, 0)).to_matrix().to_4x4())
    for x, z in ((-0.3, 0.32), (0.3, 0.32), (-0.3, 1.04), (0.3, 1.04), (0, 0.68)):
        ball(mb, (x, -0.125, z), (0.016, 0.01, 0.016), shade('#5a5a60'), sub=1)
    rbox(mb, -0.2, -0.135, 0.9, 0.2, -0.125, 1.18, shade('#f2e8d2'), r=0.008)
    return [(mb, 'main')]


# ---------------------------------------------------------------- Captain Shrimpy's ship (game/src/6zr_seafarer.js)
def hull_shape(mb, L, B, D, color, z0=0.0, nu=26, nv=10, bow=0.85, inner=None):
    """A boat's hull along x (the bow at +x, a flat transom at -x), its gunwale at z0 + D, its keel at z0; B the beam.
    inner: the color of the hull's inside (the deck well), or None for a closed top."""
    fn = color if callable(color) else shade(color)
    pts, cols, nrms, faces = [], [], [], []

    def half(u):
        # wide aft, curving to a point at the bow
        t = max(0.0, (u - 0.45) / 0.55)
        return B / 2 * (1 - t ** 1.8) ** 0.55 if u > 0.45 else B / 2 * (0.82 + 0.18 * math.sin(u / 0.45 * math.pi / 2))
    for i in range(nu + 1):
        u = i / nu
        x = -L / 2 + L * u
        w = max(0.004, half(u))
        sheer = 0.12 * max(0.0, (u - 0.6) / 0.4) ** 2      # (the bow rises a little)
        for j in range(nv + 1):
            a = math.pi * j / nv                              # from one gunwale, round under the keel, to the other
            y = -math.cos(a) * w
            z = z0 + D + sheer - math.sin(a) * (D + sheer) * (0.35 + 0.65 * min(1.0, w / (B / 2)))
            p = Vector((x, y, z))
            nn = Vector((0.0, -math.cos(a), -math.sin(a)))
            pts.append(p); nrms.append(nn); cols.append(fn(p, nn))
    for i in range(nu):
        for j in range(nv):
            a, b, c, d = i * (nv + 1) + j, (i + 1) * (nv + 1) + j, (i + 1) * (nv + 1) + j + 1, i * (nv + 1) + j + 1
            faces += [(a, b, c), (a, c, d)]
    mb.add(pts, cols, nrms, faces)
    # the transom
    tr = [pts[j] for j in range(nv + 1)]
    mb.add(tr, [fn(q, Vector((-1, 0, 0))) for q in tr], [(-1, 0, 0)] * len(tr), [(0, j, j + 1) for j in range(1, nv)])
    # the deck (or the inside, a shade darker)
    top = [Vector((pts[i * (nv + 1)].x, 0, pts[i * (nv + 1)].z - 0.04)) for i in range(nu + 1)]
    deck_fn = inner if inner else fn
    dp, dc, dn, df = [], [], [], []
    for i in range(nu + 1):
        l, r = pts[i * (nv + 1)], pts[i * (nv + 1) + nv]
        for q in (l, r):
            qq = Vector((q.x, q.y * 0.94, q.z - 0.05))
            dp.append(qq); dn.append((0, 0, 1)); dc.append(deck_fn(qq, Vector((0, 0, 1))) if callable(deck_fn) else shade(deck_fn)(qq, Vector((0, 0, 1))))
    for i in range(nu):
        a = i * 2
        df += [(a, a + 2, a + 3), (a, a + 3, a + 1)]
    mb.add(dp, dc, dn, df)
    return half


def wreck():
    """What washed up with the captain: broken planks, a barrel, a coil of rope, a torn scrap of red sail, a lantern."""
    mb = MB()
    r = random.Random(4)
    for k in range(6):
        x, y, a = r.uniform(-1.2, 1.2), r.uniform(-0.8, 0.8), r.uniform(0, math.pi)
        m = len(mb.v)
        L = r.uniform(0.5, 1.0)
        rbox(mb, -L / 2, -0.06, 0.0, L / 2, 0.06, 0.05, wood(r.choice((WOOD, WOOD_D, '#8a6a48')), 'x', seed=k), r=0.012)
        xform(mb, m, Matrix.Translation((x, y, 0.01)) @ Euler((r.uniform(-0.1, 0.1), r.uniform(-0.1, 0.1), a)).to_matrix().to_4x4())
    # a barrel on its side
    m = len(mb.v)
    lathe(mb, [(0.0, -0.22), (0.17, -0.22), (0.2, 0.0), (0.17, 0.22), (0.0, 0.22)], wood(WOOD, 'z'), seg=16, cap_top=False)
    for z in (-0.13, 0.13):
        lathe(mb, [(0.19, z - 0.015), (0.2, z), (0.19, z + 0.015)], shade(IRON), seg=16, cap_top=False)
    xform(mb, m, Matrix.Translation((0.9, 0.5, 0.18)) @ Euler((0, math.pi / 2, 0.4)).to_matrix().to_4x4())
    # rope, coiled
    for k in range(3):
        tube(mb, [(math.cos(a) * (0.16 + k * 0.03) - 0.7, math.sin(a) * (0.16 + k * 0.03) - 0.4, 0.03 + k * 0.02) for a in [t / 12 * math.tau for t in range(13)]], 0.022, shade('#d8c08a'), seg=6)
    # a torn scrap of red sail, rumpled on the sand
    for k in range(5):
        ball(mb, (-0.2 + k * 0.12, 0.55 + 0.05 * math.sin(k), 0.02), (0.12, 0.09, 0.02), shade('#c83a2e'), sub=1)
    # a ship's lantern on its side
    m = len(mb.v)
    lathe(mb, [(0.06, 0.0), (0.07, 0.02), (0.07, 0.14), (0.04, 0.18), (0.0, 0.2)], shade('#3a3a40'), seg=10, cap_top=False, cap_bot=True)
    xform(mb, m, Matrix.Translation((0.3, -0.6, 0.07)) @ Euler((math.pi / 2, 0, 0.9)).to_matrix().to_4x4())
    return [(mb, 'main')]


def ship_frame():
    """The new ship on the beach, half built: a keel on blocks with its ribs up, the first planks on, a stack of logs."""
    mb = MB()
    for x in (-1.0, 0.0, 1.0):
        rbox(mb, x - 0.15, -0.18, 0.0, x + 0.15, 0.18, 0.2, wood(WOOD_D), r=0.02)
    rbox(mb, -1.5, -0.06, 0.2, 1.4, 0.06, 0.3, wood(WOOD, 'x'), r=0.02)
    tube(mb, [(1.4, 0, 0.25), (1.6, 0, 0.6), (1.65, 0, 0.95)], 0.05, wood(WOOD), seg=8)
    for k in range(7):
        x = -1.25 + k * 0.4
        w = 0.5 * (1 - max(0.0, (x - 0.3) / 1.3) ** 1.8) ** 0.55 if x > 0.3 else 0.5
        tube(mb, [(x, -w, 0.95), (x, -w * 0.9, 0.5), (x, -w * 0.4, 0.3), (x, 0, 0.27), (x, w * 0.4, 0.3), (x, w * 0.9, 0.5), (x, w, 0.95)], 0.035, wood('#c8945a'), seg=6)
    for z, k in ((0.42, 0), (0.55, 1)):
        for sgn in (-1, 1):
            tube(mb, [(-1.3, sgn * 0.48, z), (0.3, sgn * 0.5, z), (1.0, sgn * 0.3, z + 0.05), (1.5, sgn * 0.05, z + 0.12)], 0.03, wood(WOOD_L, 'x', seed=k + sgn), seg=6)
    for k in range(4):
        m = len(mb.v)
        lathe(mb, [(0.0, -0.45), (0.09, -0.45), (0.09, 0.45), (0.0, 0.45)], wood(WOOD_D, 'z', seed=k), seg=10, cap_top=False)
        xform(mb, m, Matrix.Translation((-0.4 + (k % 2) * 0.2, 0.95 + (k // 2) * 0.0, 0.09 + (k // 2) * 0.16 + (k % 2) * 0.0)) @ Euler((0, math.pi / 2, 0.1 * k)).to_matrix().to_4x4())
    return [(mb, 'main')]


def ship_scampi():
    """Captain Shrimpy's new ship: a little wooden sloop three tiles long, blue and white, a red sail with a shrimp on it, a
    tiny cabin aft with a round window, a ship's wheel, a pennant at the masthead."""
    mb, sail = MB(), MB()
    hull_col = lambda p, n, *_: (rgb('#3a6ab8') if p.z < 0.42 else rgb('#f4efe2')) * (0.9 + 0.1 * max(0.0, -n.z * -1)) * (0.94 + 0.06 * noise.noise(p * 3))
    hull_shape(mb, 3.0, 1.15, 0.62, hull_col, z0=0.0, inner=wood(WOOD_L, 'x'))
    # a gold stripe along the side, the cabin, the wheel, the mast and boom
    rbox(mb, -1.35, -0.42, 0.62, -0.45, 0.42, 1.0, wood('#f4efe2'), r=0.04)
    rbox(mb, -1.42, -0.46, 1.0, -0.38, 0.46, 1.06, wood('#a84a32', 'x'), r=0.02)
    lathe(mb, [(0.0, 0.0), (0.09, 0.0), (0.1, 0.012)], shade('#3a4a6a'), c=(-0.9, -0.425, 0.82), seg=14, cap_top=False, cap_bot=True)
    m = len(mb.v)
    for k in range(8):
        a = k / 8 * math.tau
        tube(mb, [(0, 0, 0), (math.cos(a) * 0.14, 0, math.sin(a) * 0.14)], 0.012, wood(WOOD_D), seg=4)
    lathe(mb, [(0.15, -0.01), (0.15, 0.01)], wood(WOOD_D), seg=16, cap_top=False)
    xform(mb, m, Matrix.Translation((-0.3, 0, 0.86)) @ Euler((0, 0, math.pi / 2)).to_matrix().to_4x4())
    tube(mb, [(-0.3, 0, 0.6), (-0.3, 0, 0.78)], 0.025, wood(WOOD_D), seg=6)
    tube(mb, [(0.35, 0, 0.6), (0.35, 0, 2.6)], 0.045, wood(WOOD, 'z'), seg=10, r1=0.032)
    tube(mb, [(0.35, 0, 0.95), (-0.6, 0, 0.95)], 0.03, wood(WOOD_D, 'x'), seg=8)
    # the sail: a triangle from the masthead to the boom's end, bellied a little, red with a white shrimp
    nu, nv = 10, 10
    pts, cols, nrms, faces = [], [], [], []
    for i in range(nu + 1):
        for j in range(nv + 1):
            u, v = i / nu, j / nv
            x = 0.33 - 0.92 * u * (1 - v)
            z = 1.0 + 1.55 * v
            y = -0.08 * math.sin(math.pi * u) * math.sin(math.pi * min(1.0, v * 1.2))
            p = Vector((x, y, z))
            sx, sz = (x + 0.15) / 0.3, (z - 1.45) / 0.3
            white = (sx * sx + sz * sz) < 0.6 or ((sx + 1.0) ** 2 + (sz - 0.2) ** 2) < 0.12
            pts.append(p); nrms.append((0, -1, 0)); cols.append(rgb('#f6f0e6') if white else rgb('#c8382c'))
    for i in range(nu):
        for j in range(nv):
            a, b, c, d = i * (nv + 1) + j, (i + 1) * (nv + 1) + j, (i + 1) * (nv + 1) + j + 1, i * (nv + 1) + j + 1
            faces += [(a, b, c), (a, c, d)]
    sail.add(pts, cols, nrms, faces)
    sail.add([Vector((q.x, q.y + 0.01, q.z)) for q in pts], [c * 0.82 for c in cols], [(0, 1, 0)] * len(pts), faces)
    # the pennant and the ropes
    slab(mb, [(0.35, 2.6), (0.75, 2.52), (0.35, 2.44)], 0.01, shade('#f4c440'), axis='y', at=-0.005)
    tube(mb, [(0.35, 0, 2.55), (1.45, 0, 0.66)], 0.008, shade('#d8c08a'), seg=4)
    tube(mb, [(0.35, 0, 2.55), (-1.3, 0, 1.0)], 0.008, shade('#d8c08a'), seg=4)
    # a life ring on the cabin's side
    m = len(mb.v)
    for k in range(16):
        a, b2 = k / 16 * math.tau, (k + 1) / 16 * math.tau
        tube(mb, [(math.cos(a) * 0.1, 0, math.sin(a) * 0.1), (math.cos(b2) * 0.1, 0, math.sin(b2) * 0.1)], 0.028, shade('#f4f0e8' if k % 4 < 2 else '#d83a2e'), seg=6)
    xform(mb, m, Matrix.Translation((-0.6, -0.44, 0.84)))
    return [(mb, 'main'), (sail, 'sail')]


PROPS = {
    'tama_keychain': tama_keychain,
    'fountain': fountain, 'fountain_grand': fountain_grand, 'drinkfountain': drinkfountain, 'board': board, 'planter_box': planter_box, 'plaque': plaque, 'trashcan': trashcan, 'statue_david': statue,
    'signpost_trail': lambda: sign('trail'), 'signpost_farm': lambda: sign('farm'), 'signpost_camp': lambda: sign('camp'),
    'signpost_club': lambda: sign('club'), 'signpost_bonfire': lambda: sign('bonfire'), 'signboard': signboard,
    'windmill': windmill, 'well': well, 'scarecrow': scarecrow, 'hay': hay, 'crate': crate, 'wheelbarrow': wheelbarrow, 'trough': trough,
    'birdhouse': birdhouse, 'flamingo': flamingo, 'log': log,
    'tent_0': lambda: tent_ac(('#f08a3a', '#f4b060')), 'tent_1': lambda: tent_ac(('#3aa0a8', '#6ac8c8')), 'tent_2': lambda: tent_ac(('#e8c040', '#f4dc78')),
    'campfire': campfire, 'bonfire': lambda: campfire(True), 'picnic': picnic, 'telescope': telescope, 'viewer': viewer, 'tackle': tackle,
    'driftwood': driftwood, 'rock_a': lambda: rock(1), 'rock_b': lambda: rock(7), 'icecream': icecream, 'sandcastle': sandcastle,
    'volleyball': volleyball, 'noodle_cart': noodle_cart, 'barrel': barrel,
    'fairy_mushroom': fairy_mushroom, 'bunting': lambda: bunting(['#e85a5a', '#f8c040', '#5ab0e0', '#f088b0', '#7ac860']),
    'bunting_green': lambda: bunting(['#3a9a4a', '#8ad070', '#f4f0e0', '#5ab85a']), 'bunting_spooky': lambda: bunting(['#f08a24', '#7a3ab8', '#2e2a36', '#f8c040']),
    'bunting_winter': lambda: bunting(['#d83a3a', '#3a8a4a', '#f8d048', '#f4f0e0']), 'bunting_lunar': lambda: bunting(['#d82a2a', '#f8c040']),
    'bunting_hearts': lambda: bunting(['#e83a5a', '#ffffff', '#f088b0']), 'bunting_july': lambda: bunting(['#d83a3a', '#ffffff', '#3a5ad8']),
    'bunting_harvest': lambda: bunting(['#c8641e', '#e8b040', '#9a3a2a', '#7a8a3a']), 'harvest_stack': harvest_stack,
    'sign_forsale': sign_forsale, 'sign_comingsoon': sign_comingsoon, 'grand_lights': grand_lights, 'grand_presents': grand_presents, 'snowman': snowman,
    'jack_o_lantern': jack_o_lantern, 'jack_o_lantern_b': lambda: jack_o_lantern('happy', 0.3, 0.25, seed=3), 'jack_stack': jack_stack, 'mailbox_cottage': mailbox_cottage, 'mailbox_lighthouse': mailbox_lighthouse, 'mailbox_fish': mailbox_fish,
    'swing_set': swing_set, 'hammock': hammock, 'park_clock': park_clock, 'park_clock_hour': lambda: park_clock_hand('hour'),
    'park_clock_minute': lambda: park_clock_hand('minute'), 'shrine_stone': shrine_stone, 'statue_sarah': statue_sarah, 'door_boards': door_boards,
    'wreck': wreck, 'ship_frame': ship_frame, 'ship_scampi': ship_scampi,
    'bigtree_planter': bigtree_planter, 'reeds': reeds, 'lilypad': lilypad, 'lilypad_flower': lambda: lilypad(True), 'pebbles': pebbles, 'falls_rocks': falls_rocks,
}


def statue_doll(who='david'):
    """David in bronze, from the doll kit, one arm up (or Sarah, for hers)."""
    import doll
    if who == 'sarah':
        spec = dict(doll.FOLKS['sarah'])
        X = 'statue_sarah_'
    else:
        spec = {'look': dict(hair='spiky', hairCol='#a87a3a', skin='#b8863e', eyes='#5a3a1a', beard='#a87a3a'),
                'clothes': dict(style='jacket', top='#a87a3a', trim='#c8964a', bottom='#9a6e34', shoes='#8a6230')}
        X = 'statue_'
    parts = doll.doll(spec, X, pose=0.0)
    # all of it cast in one bronze: each color's lightness picks a shade between dark and bright bronze
    dark, light = Vector(hex_rgb('#4a3014')[:3]), Vector(hex_rgb('#c89848')[:3])
    for o in parts:
        o.matrix_world = Matrix.Translation((0, 0, 1.1 if who == 'sarah' else 0.9)) @ Matrix.Diagonal((1.15, 1.15, 1.15, 1)) @ o.matrix_world
        ca = o.data.color_attributes.get('Col')
        if ca:
            for d in ca.data:
                c = d.color
                lum = min(1.0, (0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]) * 1.6 + 0.15)
                v = dark.lerp(light, lum)
                d.color = (v.x, v.y, v.z, 1)
        for m in o.data.materials:
            m.name = 'statue_bronze_gloss'
    return parts


def build(name):
    out = PROPS[name]()
    objs, anchors = [], []
    extra = None
    if isinstance(out, tuple) and len(out) == 2 and isinstance(out[1], str):
        out, extra = out
    sails = None
    if isinstance(out, tuple) and len(out) == 3:
        out, sails, anchors = out
    for item in out:
        # (a finished object, letters made by buildings.text, goes in as it is)
        if not isinstance(item, tuple):
            objs.append(item)
            continue
        mb, part = item
        objs.append(mb.obj(f'{name}_{part}', vmat(f'{name}_{part}', rough=0.35 if part == 'water' else 0.75)))
        # (a mailbox's flag turns about the foot of its arm: its origin there)
        if part == 'flag':
            z0 = min(v.z for v in mb.v)
            foot = [v for v in mb.v if v.z < z0 + 0.005]
            bpy.context.scene.cursor.location = (sum(v.x for v in foot) / len(foot), sum(v.y for v in foot) / len(foot), z0 + 0.03)
            select_only(objs[-1])
            bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
            bpy.context.scene.cursor.location = (0, 0, 0)
    if extra and extra.startswith('statue_doll'):
        objs += statue_doll(extra.split(':')[1] if ':' in extra else 'david')
    return objs, sails, anchors


def grid(path, objs_list, cols=8, cell=3.2, size=(1800, 1200)):
    ground_plane(color='#a8d088')
    light_rig()
    for k, objs in enumerate(objs_list):
        x, y = (k % cols) * cell, (k // cols) * cell * 0.9
        for o in objs:
            o.matrix_world = Matrix.Translation((x, y, 0)) @ o.matrix_world
    rows = (len(objs_list) + cols - 1) // cols
    camera(((cols - 1) * cell / 2, (rows - 1) * cell * 0.45, 0.4), dist=max(16, cols * cell * 1.05), pitch=38)
    render(path, size=size, samples=48)


if __name__ == '__main__':
    args = sys.argv[1:]
    prev = args[args.index('--preview') + 1] if '--preview' in args else None
    only = args[args.index('--only') + 1] if '--only' in args else None
    reset()
    shown = []
    for name in PROPS:
        if only and not name.startswith(only):
            continue
        objs, sails, anchors = build(name)
        es = anchor_empties(anchors, prefix='anchor_hub_') if anchors else []
        export(objs + es, name)
        if sails:
            so = [mb.obj(f'{name}_{part}', vmat(f'{name}_{part}')) for mb, part in sails]
            export(so, name + '_sails')
            for o in so:
                o.matrix_world = Matrix.Translation(anchors[0]) @ o.matrix_world
            objs = objs + so
        for e in es:
            bpy.data.objects.remove(e)
        shown.append(objs)
        print('built', name)
    if prev and shown:
        grid(os.path.join(prev, (only or 'props_island') + '.png'), shown, cols=min(8, len(shown)))
