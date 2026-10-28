"""Furniture, part ten: outdoor furniture (6zu_outdoor.js, David's note of 28 October): Waffle's island displays as real
models at last, and many more of each kind, sold a few of each kind a day. Lights (street lamps, lanterns, a torch, path
lights, string lights, a fire pit), seats (park, stone, log and iron benches, a porch swing, an Adirondack chair, a deck
chair, a stump), fences (picket, split rail, iron, bamboo, low stone, rope, lattice: each a tile wide, so they join in a
row), statues (gnomes, a frog, a flamingo, an owl, a cat, a turtle, a toadstool), things that stand about (signs, an
umbrella, a picnic table, a flag, fountains, a bird bath, a sundial, a birdhouse, a wheelbarrow, a rose arch, a telescope,
wind chimes), plants (hedges square, round, long, tall and flowering, topiaries, planters, a potted palm, a rose bush)
and the rest (a lounger, a grill, a cooler, a rowboat, hay, crates). Each stands on its footprint like the rooms'
furniture, so it goes indoors as well as out; lit parts (flames, bulbs) are *_glow."""
import math
from mathutils import Vector, Matrix, noise
from trees_ac import rgb
from kit import col_fn, shade, rbox, lathe, tube, cyl, xform, rot, slab, plank_row, flame
from folks import ball, surf, superq
from furn_kit import *

OAK, DARK, PALE = '#b07a48', '#7a5232', '#d8b888'
STONE, IRON, BRASS, WHITE = '#aaa69c', '#3c3e46', '#d0a048', '#f4f0e6'
LEAF, LEAF2, LEAF3 = '#4f9a48', '#6cb85a', '#3e8040'


def stone(c=STONE, seed=0.0):
    return col_fn(c, mottle=0.14, seed=seed, under=0.18)


def leafy(c=LEAF, seed=0.0):
    """leaves: a green that varies in patches, lighter on top, darker underneath"""
    base, hi = rgb(c), rgb(LEAF2)
    off = Vector((seed * 3.1, seed * 1.7, seed * 2.3))

    def f(p, n, u=0, v=0):
        t = 0.5 + 0.5 * noise.noise(p * 7 + off)
        k = base.lerp(hi, max(0.0, min(1.0, t * 0.8 + max(0.0, n.z) * 0.35)))
        return k * (0.82 + 0.18 * (0.5 + 0.5 * noise.noise(p * 19 + off))) * (1 - 0.18 * max(0.0, -n.z))
    return f


def bush(mb, c, r, col, e_side=0.9, e_top=0.9, seed=0.0, bump=0.07, nu=36, nv=20, tufts=None):
    """a leafy mass: a superquadric (boxy for a clipped hedge, round for a ball) roughened by noise, and covered in
    little clumps of leaves (as Animal Crossing's hedges are), each its own green, lighter on top"""
    cx, cy, cz = c
    rx, ry, rz = r
    off = Vector((seed, seed * 1.7, seed * 0.6))

    def mod(u, v):
        th = u * math.tau
        p = Vector((math.cos(th) * 3, math.sin(th) * 3, v * 4)) + off
        return 1 + bump * noise.noise(p) + bump * 0.5 * noise.noise(p * 2.7)
    P = superq(cx, cy, cz, rx * 0.96, ry * 0.96, rz * 0.96, e_side, e_top, mod)
    surf(mb, P, leafy(LEAF3, seed=seed), nu=nu, nv=nv)
    # (the clumps: spread evenly over the surface by area, more where it's bigger; none underneath)
    area = 2 * (rx * ry + rx * rz + ry * rz)
    n = tufts if tufts is not None else int(min(140, max(18, area * 70)))
    import random
    rng = random.Random(int(seed * 1000) + 7)
    lo, hi, mid = rgb(LEAF3), rgb(LEAF2), rgb(LEAF)
    for k in range(n):
        u, v = rng.random(), 0.25 + 0.75 * math.sqrt(rng.random())
        p = P(u, v)
        q = P(u, min(1.0, v + 0.02))
        d = Vector((p.x - cx, p.y - cy, (p.z - cz) * 0.6))
        if d.length < 1e-6:
            continue
        rr = min(rx, ry, rz) * rng.uniform(0.2, 0.3) + 0.03
        tone = mid.lerp(hi if rng.random() < 0.55 else lo, rng.uniform(0.2, 0.8)) * rng.uniform(0.9, 1.08)
        ball(mb, p + d.normalized() * rr * 0.25, (rr, rr, rr * 0.8), col_fn(tuple(tone), mottle=0.12, seed=k, under=0.3), sub=1)


def post(mb, x, y, z0, z1, r, col, seg=10):
    cyl(mb, x, y, z0, z1, r, color=col, seg=seg, round_=r * 0.5)


def boards(mb, x0, x1, y0, y1, z0, z1, n, c, along='x', gap=0.014, seed=0):
    plank_row(mb, x0, x1, y0, y1, z0, z1, n, c, gap=gap, along=along, seed=seed)


# ---------------------------------------------------------------- lights
@item('dp_lamp', 1, 1)
def dp_lamp(P):
    """A street lamp: an iron post on a stepped foot, a four-sided lantern with glass, a little roof and finial."""
    mb, iron = P.main, metal(IRON)
    lathe(mb, [(0.15, 0), (0.15, 0.06), (0.11, 0.09), (0.08, 0.16), (0.05, 0.22)], iron, seg=16)
    post(mb, 0, 0, 0.2, 2.2, 0.04, iron)
    lathe(mb, [(0.07, 2.18), (0.1, 2.24)], iron, seg=12)
    for sx in (-1, 1):
        for sy in (-1, 1):
            rbox(mb, sx * 0.13 - 0.015, sy * 0.13 - 0.015, 2.24, sx * 0.13 + 0.015, sy * 0.13 + 0.015, 2.58, iron, r=0.006)
    rbox(P.glow, -0.11, -0.11, 2.26, 0.11, 0.11, 2.56, shade('#ffe6a0'), r=0.02)
    lathe(mb, [(0.2, 2.58), (0.2, 2.61), (0.04, 2.75), (0.025, 2.78), (0.04, 2.82), (0.0, 2.86)], iron, seg=4)


@item('dp_lantern', 1, 1)
def dp_lantern(P):
    """A stone lantern (a toro): a round foot, a post, a firebox with windows lit from inside, a wide roof, a knob."""
    mb, st = P.main, stone()
    lathe(mb, [(0.22, 0), (0.22, 0.08), (0.16, 0.12)], st, seg=8)
    post(mb, 0, 0, 0.1, 0.5, 0.08, st, seg=8)
    rbox(mb, -0.2, -0.2, 0.5, 0.2, 0.2, 0.58, st, r=0.02)
    for sx in (-1, 1):
        for sy in (-1, 1):
            rbox(mb, sx * 0.14 - 0.04, sy * 0.14 - 0.04, 0.58, sx * 0.14 + 0.04, sy * 0.14 + 0.04, 0.82, st, r=0.015)
    rbox(P.glow, -0.11, -0.11, 0.6, 0.11, 0.11, 0.8, shade('#ffd27a'), r=0.02)
    lathe(mb, [(0.34, 0.82), (0.34, 0.86), (0.12, 0.98), (0.06, 1.0), (0.07, 1.05), (0.0, 1.1)], st, seg=6)


@item('dp_torch', 1, 1)
def dp_torch(P):
    """A tiki torch: a bamboo pole in sections, a woven cup at the top, a flame."""
    mb = P.main
    for k in range(5):
        post(mb, 0, 0, k * 0.3, k * 0.3 + 0.29, 0.035, wood('#c8a86a', 'z', seed=k))
    lathe(mb, [(0.05, 1.45), (0.11, 1.55), (0.11, 1.72), (0.09, 1.75)], fabric('#8a6a3a'), seg=12)
    flame(P.glow, (0, 0, 1.74), 0.3, 0.18)


@item('od_lamp_double', 1, 1)
def od_lamp_double(P):
    """A double street lamp: a tall iron post with a scrolled arm each way, a glass globe hanging from each."""
    mb, iron = P.main, metal(IRON)
    lathe(mb, [(0.16, 0), (0.16, 0.06), (0.1, 0.12), (0.05, 0.2)], iron, seg=16)
    post(mb, 0, 0, 0.18, 2.5, 0.045, iron)
    for s in (-1, 1):
        tube(mb, [(0, 0, 2.3), (s * 0.18, 0, 2.44), (s * 0.36, 0, 2.42), (s * 0.42, 0, 2.32)], 0.02, iron, seg=6)
        ball(P.glow, (s * 0.42, 0, 2.18), 0.12, '#fff0c0', sub=2)
        lathe(mb, [(0.09, 2.27), (0.06, 2.32)], iron, c=(s * 0.42, 0, 0), seg=10)
    ball(mb, (0, 0, 2.56), 0.05, IRON, sub=2)


@item('od_path_light', 1, 1)
def od_path_light(P):
    """Garden path lights: three little posts with frosted caps, lit, standing in a cluster."""
    mb = P.main
    for x, y, h in ((-0.2, 0.1, 0.42), (0.18, 0.15, 0.36), (0.02, -0.18, 0.48)):
        post(mb, x, y, 0, h, 0.03, metal('#2e3038'))
        cyl(P.glow, x, y, h, h + 0.08, 0.05, 0.05, color='#fff2c8', seg=12)
        lathe(mb, [(0.075, h + 0.08), (0.075, h + 0.1), (0.0, h + 0.13)], metal('#2e3038'), c=(x, y, 0), seg=12)


@item('od_lantern_post', 1, 1)
def od_lantern_post(P):
    """A shepherd's hook post with a paper lantern hanging from it, glowing."""
    mb, iron = P.main, metal(IRON)
    post(mb, 0, 0, 0, 1.6, 0.03, iron)
    tube(mb, [(0, 0, 1.6), (0.05, 0, 1.75), (0.2, 0, 1.78), (0.3, 0, 1.68)], 0.025, iron, seg=6)
    tube(mb, [(0.3, 0, 1.68), (0.3, 0, 1.55)], 0.006, '#202020', seg=4)
    lathe(P.glow, [(0.0, 1.22), (0.1, 1.25), (0.14, 1.35), (0.13, 1.47), (0.08, 1.54), (0.0, 1.55)], shade('#ffb060'), c=(0.3, 0, 0), seg=16)
    for z in (1.25, 1.53):
        lathe(mb, [(0.06, z - 0.015), (0.06, z + 0.015)], shade('#3a2a20'), c=(0.3, 0, 0), seg=12)


@item('od_string_lights', 2, 1)
def od_string_lights(P):
    """Two wooden posts with a string of round bulbs swagged between them, lit."""
    mb = P.main
    for x in (-0.85, 0.85):
        rbox(mb, x - 0.05, -0.05, 0, x + 0.05, 0.05, 1.7, wood(DARK, 'z'), r=0.015)
    pts = []
    for k in range(17):
        t = k / 16
        x = -0.85 + 1.7 * t
        pts.append((x, 0, 1.62 - 0.32 * math.sin(t * math.pi)))
    tube(mb, pts, 0.008, '#2a2a2a', seg=4)
    cols = ['#ffd27a', '#ff9a7a', '#a8e0ff', '#c8f0a0', '#ffd27a']
    for k in range(1, 16, 2):
        x, y, z = pts[k]
        ball(P.glow, (x, y, z - 0.05), 0.045, cols[(k // 2) % len(cols)], sub=1)


@item('od_firepit', 1, 1)
def od_firepit(P):
    """A fire pit: a ring of round stones, logs crossed inside, flames."""
    mb = P.main
    for k in range(10):
        a = k / 10 * math.tau
        ball(mb, (math.cos(a) * 0.3, math.sin(a) * 0.3, 0.08), (0.1, 0.09, 0.09), stone(seed=k), sub=2)
    for a in (0.3, 1.9, 3.5):
        m = len(mb.v)
        rbox(mb, -0.2, -0.035, 0.03, 0.2, 0.035, 0.1, wood(DARK), r=0.03)
        xform(mb, m, rot(z=a, y=0.25))
    rbox(mb, -0.2, -0.2, 0.0, 0.2, 0.2, 0.03, shade('#3a3030'), r=0.01)
    flame(P.glow, (0, 0, 0.1), 0.42, 0.32)


# ---------------------------------------------------------------- seats
def bench_legs(mb, w, col, iron=False):
    for x in (-w / 2 + 0.12, w / 2 - 0.12):
        if iron:
            tube(mb, [(x, -0.18, 0), (x, -0.16, 0.36), (x, 0.12, 0.38), (x, 0.2, 0.75)], 0.025, col, seg=6)
            tube(mb, [(x, 0.18, 0), (x, 0.14, 0.36)], 0.025, col, seg=6)
            tube(mb, [(x, -0.16, 0.36), (x, -0.2, 0.52), (x, -0.08, 0.56)], 0.02, col, seg=6)
        else:
            rbox(mb, x - 0.04, -0.18, 0, x + 0.04, -0.12, 0.38, col, r=0.012)
            rbox(mb, x - 0.04, 0.12, 0, x + 0.04, 0.18, 0.75, col, r=0.012)


@item('dp_bench', 2, 1)
def dp_bench(P):
    """A park bench: wooden slats for the seat and back on iron ends with arms."""
    mb, iron = P.main, metal(IRON)
    bench_legs(mb, 1.7, iron, iron=True)
    boards(mb, -0.8, 0.8, -0.2, 0.16, 0.36, 0.41, 4, OAK)
    for k in range(3):
        z = 0.48 + k * 0.1
        m = len(mb.v)
        rbox(mb, -0.8, 0.14, z, 0.8, 0.18, z + 0.07, wood(OAK, seed=k), r=0.01)
        xform(mb, m, rot(x=-0.18, at=(0, 0.16, 0.42)))


@item('dp_stonebench', 2, 1)
def dp_stonebench(P):
    """A stone bench: a thick slab on two chunky feet."""
    mb = P.main
    for x in (-0.55, 0.55):
        rbox(mb, x - 0.12, -0.16, 0, x + 0.12, 0.16, 0.34, stone(seed=x), r=0.04)
    rbox(mb, -0.82, -0.22, 0.32, 0.82, 0.22, 0.44, stone(seed=3), r=0.05)


@item('dp_log', 2, 1)
def dp_log(P):
    """A log bench: half a log, flat side up, its rings at the ends, on two stubby blocks."""
    mb = P.main
    for x in (-0.55, 0.55):
        rbox(mb, x - 0.1, -0.12, 0, x + 0.1, 0.12, 0.18, wood(DARK, 'z'), r=0.03)
    m = len(mb.v)
    lathe(mb, [(0.0, -0.8), (0.2, -0.8), (0.22, -0.78), (0.22, 0.78), (0.2, 0.8), (0.0, 0.8)], col_fn('#8a6038', grain='z', mottle=0.06), seg=16)
    xform(mb, m, Matrix.Translation((0, 0, 0.22)) @ rot(y=math.pi / 2))
    rbox(mb, -0.79, -0.19, 0.28, 0.79, 0.19, 0.36, wood(PALE), r=0.02)


@item('od_iron_bench', 2, 1)
def od_iron_bench(P):
    """A wrought-iron garden bench: curling scrolls for the ends and back, a slatted iron seat, painted."""
    mb, c = P.main, paint('#3a5a4a')
    bench_legs(mb, 1.7, c, iron=True)
    for k in range(5):
        y = -0.2 + k * 0.08
        rbox(mb, -0.8, y, 0.36, 0.8, y + 0.05, 0.4, c, r=0.01)
    rbox(mb, -0.8, 0.14, 0.82, 0.8, 0.2, 0.86, c, r=0.015)
    for k in range(7):
        x = -0.6 + k * 0.2
        m = len(mb.v)
        for a0 in (0.0, math.pi):
            pts = [(x + 0.07 * math.cos(a0 + t * 3.2) * (1 - t * 0.6), 0.17, 0.62 + (0.12 if a0 else -0.12) * (1 - t) + 0.07 * math.sin(a0 + t * 3.2) * (1 - t * 0.6)) for t in [j / 8 for j in range(9)]]
            tube(mb, pts, 0.012, c, seg=5)


@item('od_adirondack', 1, 1)
def od_adirondack(P):
    """An Adirondack chair: a low slatted seat sloping back, a tall fanned back, wide flat arms."""
    mb, c = P.main, '#e8c060'
    for x in (-0.3, 0.3):
        rbox(mb, x - 0.03, -0.32, 0, x + 0.03, -0.26, 0.5, paint(c), r=0.01)
        m = len(mb.v)
        rbox(mb, x - 0.03, -0.3, 0.0, x + 0.03, 0.3, 0.06, paint(c), r=0.01)
        xform(mb, m, rot(x=-0.25, at=(0, -0.3, 0.3)))
        rbox(mb, x - 0.06 + (0.02 if x > 0 else -0.02), -0.4, 0.5, x + 0.06 + (0.02 if x > 0 else -0.02), 0.18, 0.53, paint(c), r=0.012)
    m = len(mb.v)
    boards(mb, -0.28, 0.28, -0.3, 0.2, 0.3, 0.34, 5, c)
    xform(mb, m, rot(x=0.12, at=(0, 0, 0.32)))
    for k in range(5):
        x = -0.24 + k * 0.12
        m = len(mb.v)
        rbox(mb, x - 0.05, 0.16, 0.3, x + 0.05, 0.2, 1.0 - abs(k - 2) * 0.06, paint(c), r=0.015)
        xform(mb, m, rot(x=-0.32, at=(0, 0.18, 0.32)))


@item('od_stump', 1, 1)
def od_stump(P):
    """A tree stump to sit on: bark round it, roots spreading at the foot, rings on top."""
    mb = P.main
    lathe(mb, [(0.3, 0), (0.24, 0.06), (0.22, 0.38), (0.21, 0.4)], col_fn('#6a4a30', grain='z', mottle=0.12), seg=14)
    for k in range(5):
        a = k / 5 * math.tau + 0.3
        tube(mb, [(math.cos(a) * 0.18, math.sin(a) * 0.18, 0.12), (math.cos(a) * 0.36, math.sin(a) * 0.36, 0.0)], 0.05, '#6a4a30', seg=6, r1=0.02)

    def rings(p, n, z0=0, z1=1):
        r = math.hypot(p.x, p.y)
        return rgb('#d8b080') * (0.86 + 0.14 * math.sin(r * 70))
    cyl(mb, 0, 0, 0.395, 0.405, 0.2, color=rings, seg=14)


@item('od_porch_swing', 2, 1)
def od_porch_swing(P):
    """A porch swing: an A-frame of posts with a crossbeam, a slatted seat hanging on chains, a cushion."""
    mb = P.main
    for x in (-0.9, 0.9):
        for y in (-0.3, 0.3):
            m = len(mb.v)
            rbox(mb, x - 0.04, y - 0.04, 0, x + 0.04, y + 0.04, 1.75, wood(OAK, 'z'), r=0.012)
            xform(mb, m, rot(x=-0.16 if y > 0 else 0.16, at=(x, y, 0)))
    rbox(mb, -0.98, -0.05, 1.68, 0.98, 0.05, 1.78, wood(OAK), r=0.015)
    for x in (-0.65, 0.65):
        tube(mb, [(x, 0, 1.68), (x, -0.05, 0.42)], 0.008, '#8a8a8a', seg=4)
    boards(mb, -0.7, 0.7, -0.2, 0.15, 0.38, 0.42, 4, OAK)
    rbox(mb, -0.7, 0.12, 0.42, 0.7, 0.16, 0.8, wood(OAK), r=0.012)
    rbox(mb, -0.66, -0.18, 0.42, 0.66, 0.12, 0.48, fabric('#e87a7a'), r=0.03)


@item('od_deck_chair', 1, 1)
def od_deck_chair(P):
    """A folding deck chair: a wooden frame and a striped canvas sling."""
    mb = P.main
    for x in (-0.28, 0.28):
        tube(mb, [(x, -0.35, 0), (x, 0.25, 0.85)], 0.022, wood(PALE), seg=6)
        tube(mb, [(x, 0.3, 0), (x, -0.25, 0.42)], 0.022, wood(PALE), seg=6)
    st = stripes('#3a8ad8', '#f4f0e6', 14, axis='x')
    for k in range(10):
        t0, t1 = k / 10, (k + 1) / 10
        y0, z0 = -0.28 + 0.5 * t0, 0.32 - 0.1 * math.sin(t0 * math.pi) + 0.5 * t0 * t0
        y1, z1 = -0.28 + 0.5 * t1, 0.32 - 0.1 * math.sin(t1 * math.pi) + 0.5 * t1 * t1
        rbox(mb, -0.26, min(y0, y1), min(z0, z1), 0.26, max(y0, y1) + 0.02, max(z0, z1) + 0.02, st, r=0.005)


# ---------------------------------------------------------------- fences (a tile wide, so a row joins up)
@item('dp_fence', 1, 1)
def dp_fence(P):
    """A white picket fence: pointed pickets on two rails."""
    mb, c = P.main, paint(WHITE)
    for z in (0.18, 0.46):
        rbox(mb, -0.5, -0.02, z, 0.5, 0.02, z + 0.06, c, r=0.01)
    for k in range(5):
        x = -0.4 + k * 0.2
        slab(mb, [(x - 0.055, 0.0), (x + 0.055, 0.0), (x + 0.055, 0.62), (x, 0.7), (x - 0.055, 0.62)], 0.04, c, at=-0.05)


@item('od_fence_rail', 1, 1)
def od_fence_rail(P):
    """A split-rail fence: a rough post at each end and two rails between."""
    mb = P.main
    for x in (-0.46, 0.46):
        rbox(mb, x - 0.05, -0.05, 0, x + 0.05, 0.05, 0.72, col_fn('#8a6a48', grain='z', mottle=0.1), r=0.02)
    for z, s in ((0.28, 0), (0.56, 1)):
        m = len(mb.v)
        lathe(mb, [(0.0, -0.5), (0.04, -0.5), (0.045, 0.5), (0.0, 0.5)], col_fn('#9a7a52', grain='z', mottle=0.1, seed=s), seg=7)
        xform(mb, m, Matrix.Translation((0, 0, z)) @ rot(y=math.pi / 2))


@item('od_fence_iron', 1, 1)
def od_fence_iron(P):
    """A wrought-iron fence: spear-topped bars between two rails, painted black."""
    mb, c = P.main, paint('#2a2c34')
    for z in (0.1, 0.62):
        rbox(mb, -0.5, -0.02, z, 0.5, 0.02, z + 0.04, c, r=0.008)
    for k in range(6):
        x = -0.42 + k * 0.168
        post(mb, x, 0, 0, 0.78, 0.014, c, seg=6)
        lathe(mb, [(0.03, 0.78), (0.0, 0.86)], c, c=(x, 0, 0), seg=6)


@item('od_fence_bamboo', 1, 1)
def od_fence_bamboo(P):
    """A bamboo fence: upright canes bound with dark cord at two bands."""
    mb = P.main
    for k in range(9):
        x = -0.44 + k * 0.11
        h = 0.78 + (0.04 if k % 2 else 0)
        for j in range(3):
            post(mb, x, 0, j * h / 3, (j + 1) * h / 3 - 0.01, 0.045, wood('#c8b070', 'z', seed=k + j), seg=8)
    for z in (0.22, 0.58):
        rbox(mb, -0.5, -0.05, z, 0.5, 0.05, z + 0.04, shade('#3a2a20'), r=0.015)


@item('od_fence_stone', 1, 1)
def od_fence_stone(P):
    """A low drystone wall: rounded stones stacked in two courses, a capping row."""
    mb = P.main
    rng = P.rng
    for row, z in enumerate((0.08, 0.24)):
        x = -0.5
        while x < 0.48:
            w = rng.uniform(0.18, 0.28)
            ball(mb, (min(0.4, x + w / 2), rng.uniform(-0.02, 0.02), z), (w / 2 + 0.02, 0.13, 0.1), stone(seed=x * 7 + row), sub=2)
            x += w
    rbox(mb, -0.5, -0.12, 0.32, 0.5, 0.12, 0.4, stone('#9a968c', seed=9), r=0.04)


@item('od_fence_rope', 1, 1)
def od_fence_rope(P):
    """A rope fence: a wooden post at each end with a thick rope swagged between them."""
    mb = P.main
    for x in (-0.44, 0.44):
        post(mb, x, 0, 0, 0.6, 0.06, wood(OAK, 'z'), seg=10)
        ball(mb, (x, 0, 0.62), 0.065, OAK, sub=2)
    for z in (0.5, 0.28):
        tube(mb, [(-0.44 + 0.88 * t, 0, z - 0.08 * math.sin(t * math.pi)) for t in [j / 10 for j in range(11)]], 0.02, fabric('#c8a878'), seg=6)


@item('od_fence_lattice', 1, 1)
def od_fence_lattice(P):
    """A garden lattice: a frame with diagonal slats crossing, a vine climbing it."""
    mb, c = P.main, paint(WHITE)
    rbox(mb, -0.5, -0.025, 0, -0.44, 0.025, 0.85, c, r=0.01)
    rbox(mb, 0.44, -0.025, 0, 0.5, 0.025, 0.85, c, r=0.01)
    rbox(mb, -0.5, -0.025, 0.8, 0.5, 0.025, 0.86, c, r=0.01)
    # (diagonal slats, each clipped to the frame's inside)
    for k in range(-5, 6):
        for s in (-1, 1):
            x0 = k * 0.2
            a = [(x0 + s * t, t) for t in (j / 20 * 0.8 for j in range(21)) if -0.44 <= x0 + s * t <= 0.44]
            if len(a) >= 2:
                tube(mb, [(a[0][0], s * 0.006, a[0][1]), (a[-1][0], s * 0.006, a[-1][1])], 0.012, c, seg=4)
    for k in range(9):
        ball(mb, (-0.3 + 0.07 * k + 0.05 * math.sin(k), -0.04, 0.08 + k * 0.08), 0.06, leafy(seed=k), sub=1)


# ---------------------------------------------------------------- statues
def gnome_body(mb, hat='#e04848', coat='#3a6ad8', beard=WHITE, s=1.0, x=0.0):
    lathe(mb, [(0.0, 0), (0.12 * s, 0.0), (0.13 * s, 0.12 * s), (0.1 * s, 0.24 * s), (0.0, 0.26 * s)], paint(coat), c=(x, 0, 0), seg=14)
    ball(mb, (x, 0, 0.3 * s), 0.08 * s, '#f0c8a0', sub=2)
    ball(mb, (x, -0.075 * s, 0.29 * s), 0.025 * s, '#e8a090', sub=1)
    lathe(mb, [(0.0, 0.16 * s), (0.085 * s, 0.2 * s), (0.07 * s, 0.27 * s), (0.0, 0.3 * s)], shade(beard), c=(x, -0.03 * s, 0), seg=12)
    lathe(mb, [(0.095 * s, 0.33 * s), (0.07 * s, 0.42 * s), (0.03 * s, 0.52 * s), (0.0, 0.58 * s)], paint(hat), c=(x, 0, 0), seg=14)
    for sx in (-1, 1):
        ball(mb, (x + sx * 0.06 * s, -0.04 * s, -0.0), (0.05 * s, 0.07 * s, 0.03 * s), '#5a3a2a', sub=1)


@item('dp_gnome', 1, 1)
def dp_gnome(P):
    """A garden gnome: a red pointed hat, a white beard, a blue coat, standing very seriously."""
    gnome_body(P.main, s=1.6)


@item('od_gnome_fish', 1, 1)
def od_gnome_fish(P):
    """A gnome sitting on a little rock with a fishing rod, very patient."""
    mb = P.main
    ball(mb, (0, 0.02, 0.1), (0.2, 0.17, 0.12), stone(), sub=2)
    m = len(mb.v)
    gnome_body(mb, hat='#3aa860', coat='#e8a030', s=1.3)
    xform(mb, m, Matrix.Translation((0, 0, 0.16)))
    tube(mb, [(0.1, -0.1, 0.42), (0.35, -0.3, 0.78)], 0.01, wood(DARK), seg=4)
    tube(mb, [(0.35, -0.3, 0.78), (0.4, -0.38, 0.1)], 0.003, '#e0e0e0', seg=3)


@item('dp_frog', 1, 1)
def dp_frog(P):
    """A stone frog sitting on its haunches, big round eyes on top."""
    mb, st = P.main, stone('#8aa07a')
    ball(mb, (0, 0.02, 0.18), (0.24, 0.22, 0.17), st, sub=3)
    ball(mb, (0, -0.1, 0.3), (0.17, 0.12, 0.1), st, sub=2)
    for sx in (-1, 1):
        ball(mb, (sx * 0.09, -0.12, 0.38), 0.065, st, sub=2)
        ball(mb, (sx * 0.09, -0.17, 0.39), 0.03, '#2a2a28', sub=1)
        ball(mb, (sx * 0.17, -0.18, 0.04), (0.07, 0.09, 0.04), st, sub=1)


@item('dp_flamingo', 1, 1)
def dp_flamingo(P):
    """A plastic lawn flamingo on wire legs: the S of its neck, a black-tipped beak."""
    mb, pk = P.main, paint('#ff7aa8')
    for x in (-0.03, 0.03):
        tube(mb, [(x, 0, 0), (x, 0, 0.5)], 0.008, '#3a3a3a', seg=4)
    ball(mb, (0, 0.03, 0.6), (0.11, 0.17, 0.1), pk, sub=2)
    tube(mb, [(0, -0.08, 0.64), (0, -0.14, 0.78), (0, -0.08, 0.9), (0, -0.12, 0.98)], 0.025, pk, seg=8)
    ball(mb, (0, -0.13, 1.0), 0.045, pk, sub=2)
    tube(mb, [(0, -0.17, 1.0), (0, -0.24, 0.96)], 0.018, '#2a2a2a', seg=6, r1=0.006)


@item('od_owl', 1, 1)
def od_owl(P):
    """A stone owl on a block: tufted ears, big round eyes, folded wings."""
    mb, st = P.main, stone('#9a9488')
    rbox(mb, -0.18, -0.18, 0, 0.18, 0.18, 0.2, stone(seed=2), r=0.03)
    ball(mb, (0, 0, 0.42), (0.17, 0.15, 0.23), st, sub=3)
    ball(mb, (0, -0.02, 0.66), (0.15, 0.13, 0.12), st, sub=2)
    for sx in (-1, 1):
        ball(mb, (sx * 0.065, -0.12, 0.68), 0.05, '#e8e0c8', sub=2)
        ball(mb, (sx * 0.065, -0.16, 0.68), 0.022, '#2a2a28', sub=1)
        tube(mb, [(sx * 0.09, -0.02, 0.74), (sx * 0.13, -0.01, 0.84)], 0.03, st, seg=6, r1=0.005)
    tube(mb, [(0, -0.14, 0.64), (0, -0.17, 0.6)], 0.018, '#c8a050', seg=5, r1=0.004)


@item('od_cat', 1, 1)
def od_cat(P):
    """A cat statue sitting tall, its tail curled round its paws, pointed ears."""
    mb, c = P.main, stone('#c8c0b4')
    ball(mb, (0, 0.03, 0.2), (0.16, 0.15, 0.22), c, sub=3)
    ball(mb, (0, -0.02, 0.5), (0.12, 0.11, 0.1), c, sub=2)
    for sx in (-1, 1):
        slab(mb, [(sx * 0.03, 0.54), (sx * 0.11, 0.53), (sx * 0.09, 0.66)], 0.03, c, at=-0.02)
        ball(mb, (sx * 0.045, -0.1, 0.52), 0.02, '#4a7a4a', sub=1)
        ball(mb, (sx * 0.06, -0.12, 0.03), (0.05, 0.06, 0.03), c, sub=1)
    tube(mb, [(0.12, 0.1, 0.03), (0.2, -0.05, 0.03), (0.08, -0.16, 0.04)], 0.035, c, seg=6)


@item('od_turtle', 1, 1)
def od_turtle(P):
    """A stone turtle: a domed shell with plates, its head poking out, four stubby legs."""
    mb = P.main
    ball(mb, (0, 0.02, 0.12), (0.28, 0.24, 0.16), stone('#7a9a6a'), sub=3)
    for k in range(6):
        a = k / 6 * math.tau
        ball(mb, (math.cos(a) * 0.14, math.sin(a) * 0.12 + 0.02, 0.23), (0.07, 0.06, 0.02), stone('#6a8a5a', seed=k), sub=1)
    ball(mb, (0, -0.28, 0.12), (0.08, 0.09, 0.07), stone('#8aa07a'), sub=2)
    for sx in (-1, 1):
        for sy in (-1, 1):
            ball(mb, (sx * 0.2, sy * 0.15, 0.04), (0.06, 0.06, 0.04), stone('#8aa07a'), sub=1)


@item('od_mushroom', 1, 1)
def od_mushroom(P):
    """A big toadstool: a cream stalk and a red cap with white spots."""
    mb = P.main
    lathe(mb, [(0.12, 0), (0.09, 0.08), (0.08, 0.4), (0.1, 0.46)], paint('#f0e4c8'), seg=16)
    lathe(mb, [(0.0, 0.42), (0.32, 0.44), (0.33, 0.5), (0.26, 0.62), (0.12, 0.7), (0.0, 0.72)], paint('#e04040'), seg=24)
    for k in range(7):
        a = k / 7 * math.tau
        r, z = (0.2, 0.6) if k % 2 else (0.27, 0.53)
        ball(mb, (math.cos(a) * r, math.sin(a) * r, z), 0.035, WHITE, sub=1)
    ball(mb, (0, 0, 0.71), 0.04, WHITE, sub=1)


# ---------------------------------------------------------------- things that stand about
@item('dp_sign', 1, 1)
def dp_sign(P):
    """A wooden sign on a post, its board blank for words."""
    mb = P.main
    rbox(mb, -0.04, -0.04, 0, 0.04, 0.04, 0.9, wood(DARK, 'z'), r=0.012)
    rbox(mb, -0.34, -0.07, 0.5, 0.34, -0.03, 0.88, wood(PALE), r=0.02)


@item('dp_umbrella', 1, 1)
def dp_umbrella(P):
    """A beach umbrella: a pole and a striped canopy of eight panels, a little top."""
    mb = P.main
    post(mb, 0, 0, 0, 1.6, 0.025, paint(WHITE), seg=8)
    for k in range(8):
        a0, a1 = k / 8 * math.tau, (k + 1) / 8 * math.tau
        c = '#e85050' if k % 2 else WHITE
        pts = [Vector((0, 0, 1.62)), Vector((math.cos(a0) * 0.75, math.sin(a0) * 0.75, 1.32)), Vector((math.cos(a1) * 0.75, math.sin(a1) * 0.75, 1.32))]
        n = (pts[1] - pts[0]).cross(pts[2] - pts[0]).normalized()
        if n.z < 0:
            n = -n
        mb.add(pts, [rgb(c)] * 3, [n] * 3, [(0, 1, 2)])
        mb.add(pts, [rgb(c) * 0.8] * 3, [-n] * 3, [(0, 2, 1)])
    ball(mb, (0, 0, 1.64), 0.03, WHITE, sub=1)
    rbox(mb, -0.12, -0.12, 0, 0.12, 0.12, 0.04, paint('#e85050'), r=0.015)


@item('dp_picnic', 3, 1)
def dp_picnic(P):
    """A picnic table with its benches joined on, a checked cloth over the top."""
    mb = P.main
    for x in (-1.0, 1.0):
        for s in (-1, 1):
            m = len(mb.v)
            rbox(mb, x - 0.04, -0.03, 0, x + 0.04, 0.03, 0.7, wood(OAK, 'z'), r=0.01)
            xform(mb, m, rot(x=s * 0.45, at=(x, 0, 0.35)))
        rbox(mb, x - 0.04, -0.45, 0.32, x + 0.04, 0.45, 0.36, wood(OAK), r=0.01)
    boards(mb, -1.3, 1.3, -0.3, 0.3, 0.68, 0.72, 4, OAK)

    def chk(p, n, z0=0, z1=1):
        a = (math.floor(p.x * 6) + math.floor(p.y * 6)) % 2
        return rgb('#e05a5a' if a else '#fbf6ee') * (1 - 0.1 * max(0.0, -n.z))
    rbox(mb, -0.9, -0.34, 0.72, 0.9, 0.34, 0.735, chk, r=0.006)
    for y in (-0.4, 0.4):
        boards(mb, -1.3, 1.3, y - 0.11, y + 0.11, 0.36, 0.4, 2, OAK)


@item('dp_flag', 1, 1)
def dp_flag(P):
    """A flagpole with a gold ball on top and the island's flag (a little sun on blue and white) flying."""
    mb = P.main
    rbox(mb, -0.12, -0.12, 0, 0.12, 0.12, 0.08, stone(), r=0.02)
    post(mb, 0, 0, 0, 1.9, 0.02, metal('#c8c8cc'), seg=8)
    ball(P.gloss, (0, 0, 1.93), 0.04, BRASS, sub=2)

    def fl(p, n, z0=0, z1=1):
        if (p.x - 0.32) ** 2 + (p.z - 1.62) ** 2 < 0.007:
            return rgb('#f8d040')
        return rgb('#5aa0e8' if p.z < 1.62 else '#fbf8f0')
    pts = []
    for i in range(9):
        for j in range(5):
            u, v = i / 8, j / 4
            pts.append((0.02 + u * 0.6, 0.04 * math.sin(u * 5.0) * u, 1.48 + v * 0.3))
    mesh_pts = [Vector(p) for p in pts]
    F = []
    for i in range(8):
        for j in range(4):
            a, b = i * 5 + j, (i + 1) * 5 + j
            F += [(a, b, b + 1), (a, b + 1, a + 1)]
    nn = [Vector((0, -1, 0))] * len(mesh_pts)
    mb.add(mesh_pts, [fl(p, n) for p, n in zip(mesh_pts, nn)], nn, F)
    mb.add(mesh_pts, [fl(p, n) * 0.85 for p, n in zip(mesh_pts, nn)], [Vector((0, 1, 0))] * len(mesh_pts), [(a, c, b) for a, b, c in F])


@item('dp_fountain', 2, 1)
def dp_fountain(P):
    """A little stone fountain: a round basin with water, a column with a smaller bowl spilling over."""
    mb = P.main
    lathe(mb, [(0.62, 0), (0.64, 0.05), (0.64, 0.3), (0.56, 0.32), (0.54, 0.12), (0.0, 0.12)], stone(), seg=28)
    cyl(P.gloss, 0, 0, 0.12, 0.26, 0.54, color='#6ab8e0', seg=28)
    post(mb, 0, 0, 0.12, 0.6, 0.07, stone(seed=1), seg=12)
    lathe(mb, [(0.06, 0.55), (0.26, 0.62), (0.27, 0.68), (0.22, 0.68), (0.0, 0.64)], stone(seed=2), seg=20)
    cyl(P.gloss, 0, 0, 0.62, 0.67, 0.22, color='#7ac8ec', seg=20)
    for k in range(6):
        a = k / 6 * math.tau
        tube(P.gloss, [(math.cos(a) * 0.26, math.sin(a) * 0.26, 0.68), (math.cos(a) * 0.36, math.sin(a) * 0.36, 0.45), (math.cos(a) * 0.4, math.sin(a) * 0.4, 0.27)], 0.015, '#bfe6f6', seg=4)


@item('dp_birdbath', 1, 1)
def dp_birdbath(P):
    """A bird bath: a turned stone pedestal and a shallow bowl of water."""
    mb = P.main
    lathe(mb, [(0.18, 0), (0.18, 0.05), (0.08, 0.12), (0.06, 0.45), (0.1, 0.55), (0.32, 0.62), (0.33, 0.66), (0.28, 0.66), (0.0, 0.62)], stone(), seg=20)
    cyl(P.gloss, 0, 0, 0.6, 0.645, 0.28, color='#7ac0e4', seg=20)


@item('od_sundial', 1, 1)
def od_sundial(P):
    """A sundial: a stone pillar with a brass dial and its pointer on top."""
    mb = P.main
    lathe(mb, [(0.2, 0), (0.2, 0.06), (0.12, 0.1), (0.1, 0.6), (0.2, 0.66), (0.22, 0.7)], stone(), seg=8)
    cyl(P.gloss, 0, 0, 0.7, 0.72, 0.2, color=BRASS, seg=24)
    for k in range(12):
        a = k / 12 * math.tau
        rbox(mb, math.cos(a) * 0.16 - 0.008, math.sin(a) * 0.16 - 0.008, 0.72, math.cos(a) * 0.16 + 0.008, math.sin(a) * 0.16 + 0.008, 0.73, shade('#4a3a20'), r=0.002)
    slab(P.gloss, [(-0.12, 0.72), (0.12, 0.72), (-0.12, 0.88)], 0.012, metal(BRASS), at=-0.006)


@item('od_birdhouse', 1, 1)
def od_birdhouse(P):
    """A birdhouse on a tall post: painted walls, a round door with a perch, a pitched roof."""
    mb, c = P.main, '#6ab0d8'
    rbox(mb, -0.035, -0.035, 0, 0.035, 0.035, 1.25, wood(DARK, 'z'), r=0.01)
    rbox(mb, -0.15, -0.13, 1.2, 0.15, 0.13, 1.45, paint(c), r=0.015)
    cyl(mb, 0, -0.131, 1.3, 1.3001, 0.04, color='#2a2420', seg=12)
    m = len(mb.v)
    cyl(mb, 0, 0, 0, 0.07, 0.035, color='#2a2420', seg=12)
    xform(mb, m, Matrix.Translation((0, -0.13, 1.33)) @ rot(x=math.pi / 2))
    tube(mb, [(0, -0.13, 1.26), (0, -0.2, 1.26)], 0.008, wood(DARK), seg=4)
    for s in (-1, 1):
        m = len(mb.v)
        rbox(mb, -0.19, 0, -0.012, 0.19, 0.2, 0.012, paint('#e05a4a'), r=0.006)
        xform(mb, m, Matrix.Translation((0, 0, 1.56)) @ rot(x=-s * 0.7 + (math.pi if s > 0 else 0)))
    slab(mb, [(-0.15, 1.45), (0.15, 1.45), (0.0, 1.56)], 0.26, paint('#6ab0d8'), at=-0.13)


@item('od_wheelbarrow', 1, 1)
def od_wheelbarrow(P):
    """A wheelbarrow full of flowers: a painted tub, a wheel at the front, two handles and legs."""
    mb, c = P.main, '#d84a3a'

    def tub(u, v):
        th, ph = u * math.tau, (v - 1) * math.pi / 2
        return Vector((0.24 * math.cos(th) * math.cos(ph), 0.34 * math.sin(th) * math.cos(ph), 0.4 + 0.2 * math.sin(ph)))
    surf(mb, tub, paint(c), nu=28, nv=8, caps=(True, False))
    tube(mb, [(0.24 * math.cos(t / 28 * math.tau), 0.34 * math.sin(t / 28 * math.tau), 0.4) for t in range(29)], 0.015, paint(c), seg=5)
    m = len(mb.v)
    lathe(mb, [(0.0, -0.03), (0.12, -0.03), (0.13, 0.0), (0.12, 0.03), (0.0, 0.03)], shade('#2a2a2a'), seg=16)
    xform(mb, m, Matrix.Translation((0, -0.36, 0.13)) @ rot(y=math.pi / 2))
    for sx in (-1, 1):
        tube(mb, [(sx * 0.03, -0.36, 0.13), (sx * 0.14, -0.1, 0.24), (sx * 0.2, 0.4, 0.4)], 0.014, metal(IRON), seg=5)
        tube(mb, [(sx * 0.13, 0.15, 0.2), (sx * 0.13, 0.18, 0.0)], 0.012, metal(IRON), seg=5)
    for k in range(9):
        a = k * 2.4
        ball(mb, (math.cos(a) * 0.15 * (k / 9), math.sin(a) * 0.18 * (k / 9) + 0.02, 0.4), 0.06, ('#ff7aa8', '#f8d040', '#ffffff', '#b07ae8')[k % 4], sub=1)
    ball(mb, (0, 0.0, 0.38), (0.22, 0.3, 0.05), leafy(), sub=2)


@item('od_arch', 2, 1)
def od_arch(P):
    """A rose arch: two lattice sides and a curved top, roses climbing all over it."""
    mb, c = P.main, paint(WHITE)
    for x in (-0.75, 0.75):
        for y in (-0.15, 0.15):
            post(mb, x, y, 0, 1.6, 0.025, c, seg=6)
        for z in (0.4, 0.8, 1.2):
            rbox(mb, x - 0.02, -0.15, z, x + 0.02, 0.15, z + 0.03, c, r=0.006)
    for y in (-0.15, 0.15):
        tube(mb, [(math.cos(t) * 0.75, y, 1.6 + math.sin(t) * 0.4) for t in [j / 12 * math.pi for j in range(13)]], 0.025, c, seg=6)
    rng = P.rng
    for k in range(46):
        t = rng.uniform(0, 1)
        if t < 0.33:
            p = (-0.75 + rng.uniform(-0.05, 0.05), rng.uniform(-0.17, 0.17), t * 3 * 1.6)
        elif t < 0.66:
            p = (0.75 + rng.uniform(-0.05, 0.05), rng.uniform(-0.17, 0.17), (t - 0.33) * 3 * 1.6)
        else:
            a = (t - 0.66) * 3 * math.pi
            p = (math.cos(a) * 0.75, rng.uniform(-0.17, 0.17), 1.6 + math.sin(a) * 0.4)
        ball(mb, p, 0.07, leafy(seed=k), sub=1)
        if k % 3 == 0:
            ball(mb, (p[0], p[1] - 0.06, p[2]), 0.04, '#e84a6a', sub=1)


@item('od_telescope', 1, 1)
def od_telescope(P):
    """A brass telescope on a wooden tripod, pointed at the sky."""
    mb = P.main
    for k in range(3):
        a = k / 3 * math.tau + 0.4
        tube(mb, [(0, 0, 0.82), (math.cos(a) * 0.3, math.sin(a) * 0.3, 0)], 0.02, wood(OAK), seg=5)
    m = len(P.gloss.v)
    lathe(P.gloss, [(0.0, -0.3), (0.05, -0.3), (0.05, 0.1), (0.07, 0.12), (0.07, 0.42), (0.08, 0.44), (0.0, 0.44)], metal(BRASS), seg=16)
    xform(P.gloss, m, Matrix.Translation((0, 0, 0.86)) @ rot(x=-0.9))


@item('od_chimes', 1, 1)
def od_chimes(P):
    """Wind chimes hanging from a wooden stand: silver tubes of different lengths round a disc."""
    mb = P.main
    rbox(mb, -0.15, -0.15, 0, 0.15, 0.15, 0.05, wood(DARK), r=0.015)
    rbox(mb, -0.03, -0.03, 0.05, 0.03, 0.03, 1.3, wood(DARK, 'z'), r=0.01)
    rbox(mb, -0.03, -0.03, 1.27, 0.32, 0.03, 1.32, wood(DARK), r=0.01)
    # (what hangs from the hook is its own part, swayed by the game)
    cyl(P.move, 0.25, 0, 1.14, 1.16, 0.1, color=wood(PALE), seg=16)
    tube(P.move, [(0.25, 0, 1.27), (0.25, 0, 1.16)], 0.004, '#3a3a3a', seg=3)
    for k in range(6):
        a = k / 6 * math.tau
        L = 0.2 + 0.05 * k
        x, y = 0.25 + math.cos(a) * 0.075, math.sin(a) * 0.075
        cyl(P.move, x, y, 1.12 - L, 1.12, 0.012, color='#d8dce4', seg=8)


# ---------------------------------------------------------------- plants
@item('dp_hedge', 1, 1)
def dp_hedge(P):
    """A square hedge, clipped neat, on a little band of earth."""
    bush(P.main, (0, 0, 0.32), (0.44, 0.42, 0.32), leafy(), e_side=0.25, e_top=0.3, bump=0.04)


@item('dp_hedge_round', 1, 1)
def dp_hedge_round(P):
    """A round hedge: a clipped ball of leaves."""
    bush(P.main, (0, 0, 0.36), (0.4, 0.4, 0.36), leafy(seed=1), bump=0.05)


@item('dp_hedge_long', 2, 1)
def dp_hedge_long(P):
    """A long hedge, clipped neat, two tiles long."""
    bush(P.main, (0, 0, 0.32), (0.92, 0.4, 0.32), leafy(seed=2), e_side=0.22, e_top=0.3, bump=0.035, nu=56)


@item('od_hedge_tall', 1, 1)
def od_hedge_tall(P):
    """A tall hedge, clipped into a column taller than Sarah."""
    bush(P.main, (0, 0, 0.75), (0.42, 0.4, 0.75), leafy(LEAF3, seed=3), e_side=0.3, e_top=0.25, bump=0.035, nv=28)


@item('od_hedge_flower', 1, 1)
def od_hedge_flower(P):
    """A flowering hedge: round and leafy, dotted all over with pink blossoms."""
    mb = P.main
    bush(mb, (0, 0, 0.34), (0.42, 0.4, 0.34), leafy(seed=4), e_side=0.6, e_top=0.6, bump=0.05)
    rng = P.rng
    for k in range(40):
        u, v = rng.uniform(0, math.tau), rng.uniform(0.15, 1.0)
        r = math.sqrt(max(0.0, 1 - v * v))
        ball(mb, (math.cos(u) * 0.42 * (r * 0.9 + 0.1), math.sin(u) * 0.4 * (r * 0.9 + 0.1), 0.34 + v * 0.34), 0.035, ('#ff8ac0', '#ffd0e4', '#ff6aa8')[k % 3], sub=1)


@item('dp_topiary', 1, 1)
def dp_topiary(P):
    """A bunny topiary: a round body and head of clipped leaves, two long ears, a pot of earth under it."""
    mb = P.main
    lathe(mb, [(0.18, 0), (0.22, 0.2), (0.2, 0.22)], paint('#c8784a'), seg=16)
    bush(mb, (0, 0.03, 0.42), (0.24, 0.22, 0.22), leafy(seed=5), bump=0.04)
    bush(mb, (0, -0.06, 0.74), (0.15, 0.14, 0.14), leafy(seed=6), bump=0.04)
    for sx in (-1, 1):
        bush(mb, (sx * 0.06, -0.04, 1.0), (0.05, 0.04, 0.16), leafy(seed=7 + sx), bump=0.03, nu=16, nv=12)


@item('od_topiary_spiral', 1, 1)
def od_topiary_spiral(P):
    """A spiral topiary: a cone of leaves clipped into a spiral, in a terracotta pot."""
    mb = P.main
    lathe(mb, [(0.16, 0), (0.2, 0.22), (0.22, 0.25), (0.2, 0.26)], paint('#c8784a'), seg=16)
    post(mb, 0, 0, 0.25, 0.4, 0.025, wood(DARK, 'z'))
    for k in range(5):
        z = 0.42 + k * 0.2
        r = 0.24 - k * 0.04
        bush(mb, (0, 0, z + 0.08), (r, r, 0.09), leafy(seed=10 + k), bump=0.05, nu=24, nv=12)


@item('od_topiary_heart', 1, 1)
def od_topiary_heart(P):
    """A heart topiary: two lobes of clipped leaves meeting in a point, on a stem in a pot."""
    mb = P.main
    lathe(mb, [(0.16, 0), (0.2, 0.22), (0.22, 0.25), (0.2, 0.26)], paint('#e8e0d8'), seg=16)
    post(mb, 0, 0, 0.25, 0.5, 0.025, wood(DARK, 'z'))
    for sx in (-1, 1):
        bush(mb, (sx * 0.12, 0, 0.86), (0.17, 0.13, 0.17), leafy(seed=20 + sx), bump=0.04, nu=24, nv=14)
    m = len(mb.v)
    bush(mb, (0, 0, 0.7), (0.2, 0.12, 0.2), leafy(seed=23), e_side=0.6, bump=0.04, nu=24, nv=14)
    xform(mb, m, rot(y=math.pi / 4, at=(0, 0, 0.7)))


@item('dp_planter', 2, 1)
def dp_planter(P):
    """A wooden planter box full of flowers."""
    mb = P.main
    boards(mb, -0.85, 0.85, -0.3, 0.3, 0.0, 0.32, 3, OAK, along='x')
    rbox(mb, -0.8, -0.25, 0.25, 0.8, 0.25, 0.3, shade('#4a3020'), r=0.02)
    rng = P.rng
    for k in range(18):
        x, y = rng.uniform(-0.72, 0.72), rng.uniform(-0.18, 0.18)
        tube(mb, [(x, y, 0.28), (x, y, 0.44)], 0.012, LEAF, seg=4)
        ball(mb, (x, y, 0.47), 0.06, ('#ff7aa8', '#f8d040', '#ffffff', '#b07ae8', '#ff9a4a')[k % 5], sub=1)
        ball(mb, (x + 0.04, y, 0.36), (0.05, 0.03, 0.02), leafy(seed=k), sub=1)


@item('od_barrel_planter', 1, 1)
def od_barrel_planter(P):
    """Half a barrel planted up: staves and iron hoops, a mound of leaves and flowers."""
    mb = P.main
    lathe(mb, [(0.26, 0), (0.3, 0.18), (0.29, 0.36), (0.27, 0.38)], col_fn(OAK, grain='z', mottle=0.06), seg=16)
    for z in (0.08, 0.3):
        lathe(mb, [(0.285 + (0.01 if z > 0.2 else 0), z), (0.29 + (0.012 if z > 0.2 else 0.002), z + 0.03)], metal(IRON), seg=16)
    bush(mb, (0, 0, 0.42), (0.27, 0.27, 0.14), leafy(seed=30), bump=0.07)
    for k in range(10):
        a = k * 2.3
        ball(mb, (math.cos(a) * 0.16 * (k / 10 + 0.3), math.sin(a) * 0.16 * (k / 10 + 0.3), 0.54), 0.045, ('#ff6a6a', '#ffd04a', '#ffffff')[k % 3], sub=1)


@item('od_potted_palm', 1, 1)
def od_potted_palm(P):
    """A little palm in a big pot: a ringed trunk and a crown of long fronds."""
    mb = P.main
    lathe(mb, [(0.16, 0), (0.22, 0.3), (0.24, 0.33), (0.22, 0.34)], paint('#4aa0b8'), seg=16)
    for k in range(6):
        post(mb, 0.01 * k, 0, 0.32 + k * 0.12, 0.44 + k * 0.12, 0.05 - k * 0.004, wood('#9a7a52', 'z', seed=k), seg=8)
    for k in range(7):
        a = k / 7 * math.tau
        pts = [(0.03, 0, 1.05)] + [(math.cos(a) * 0.5 * t, math.sin(a) * 0.5 * t, 1.05 + 0.18 * t - 0.42 * t * t) for t in (0.25, 0.5, 0.75, 1.0)]
        tube(mb, pts, 0.012, LEAF3, seg=4)
        for j, t in enumerate((0.25, 0.4, 0.55, 0.7, 0.85)):
            x, y, z = math.cos(a) * 0.5 * t, math.sin(a) * 0.5 * t, 1.05 + 0.18 * t - 0.42 * t * t
            ball(mb, (x, y, z - 0.02), (0.11 * (1 - t * 0.5), 0.11 * (1 - t * 0.5), 0.02), leafy(LEAF, seed=k + j), sub=1)


@item('od_rose_bush', 1, 1)
def od_rose_bush(P):
    """A rose bush: a loose round shrub of dark leaves with red roses all through it."""
    mb = P.main
    bush(mb, (0, 0, 0.36), (0.38, 0.36, 0.36), leafy(LEAF3, seed=40), e_side=1.0, e_top=1.0, bump=0.1)
    rng = P.rng
    for k in range(18):
        u, v = rng.uniform(0, math.tau), rng.uniform(-0.1, 1.0)
        r = math.sqrt(max(0.0, 1 - v * v))
        p = (math.cos(u) * 0.39 * r, math.sin(u) * 0.37 * r, 0.36 + v * 0.36)
        ball(mb, p, 0.05, '#d8243a', sub=2)
        ball(mb, (p[0], p[1], p[2] + 0.02), 0.03, '#ff4a5a', sub=1)


# ---------------------------------------------------------------- the rest
@item('dp_lounger', 2, 1)
def dp_lounger(P):
    """A beach lounger: a slatted frame with its back raised and a striped cushion."""
    mb = P.main
    for x in (-0.7, 0.7):
        for y in (-0.22, 0.22):
            rbox(mb, x - 0.03, y - 0.03, 0, x + 0.03, y + 0.03, 0.22, wood(PALE, 'z'), r=0.01)
    boards(mb, -0.8, 0.3, -0.25, 0.25, 0.2, 0.25, 3, PALE)
    m = len(mb.v)
    boards(mb, 0.3, 0.95, -0.25, 0.25, 0.2, 0.25, 3, PALE)
    xform(mb, m, rot(y=-0.6, at=(0.3, 0, 0.25)))
    rbox(mb, -0.78, -0.22, 0.25, 0.3, 0.22, 0.31, stripes('#3ab8a8', '#fbf6ee', 10), r=0.03)


@item('od_grill', 1, 1)
def od_grill(P):
    """A kettle grill: a round black bowl with its lid on three legs, little wheels, a handle on top."""
    mb, c = P.main, paint('#2a2a30')
    for k in range(3):
        a = k / 3 * math.tau + 0.5
        tube(mb, [(math.cos(a) * 0.12, math.sin(a) * 0.12, 0.5), (math.cos(a) * 0.26, math.sin(a) * 0.26, 0)], 0.018, metal('#8a8a90'), seg=5)
    lathe(mb, [(0.0, 0.46), (0.2, 0.48), (0.28, 0.6), (0.29, 0.66)], c, seg=20)
    lathe(mb, [(0.29, 0.67), (0.27, 0.76), (0.16, 0.86), (0.0, 0.88)], c, seg=20)
    tube(mb, [(-0.06, 0, 0.9), (-0.06, 0, 0.94), (0.06, 0, 0.94), (0.06, 0, 0.9)], 0.014, metal('#c8c8cc'), seg=5)


@item('od_cooler', 1, 1)
def od_cooler(P):
    """A picnic cooler: a white lid on a colored box, a handle each side."""
    mb, c = P.main, '#3a8ad8'
    rbox(mb, -0.3, -0.2, 0, 0.3, 0.2, 0.3, paint(c), r=0.04)
    rbox(mb, -0.31, -0.21, 0.29, 0.31, 0.21, 0.36, paint(WHITE), r=0.03)
    for s in (-1, 1):
        tube(mb, [(s * 0.3, -0.08, 0.2), (s * 0.34, -0.06, 0.28), (s * 0.34, 0.06, 0.28), (s * 0.3, 0.08, 0.2)], 0.012, metal('#c8c8cc'), seg=4)


@item('od_rowboat', 2, 1)
def od_rowboat(P):
    """A little rowboat pulled up on land: painted planks, a seat across it, two oars inside."""
    mb, c = P.main, '#e8e0d0'

    def hull(sc, z0):
        def P_(u, v):
            th, ph = u * math.tau, (v - 1) * math.pi / 2          # the bottom half only: v 0 the keel, 1 the rim
            k = 1 - 0.35 * max(0.0, math.cos(th)) ** 3              # (the bow pointed, the stern rounder)
            return Vector((0.88 * sc * math.cos(th) * math.cos(ph), 0.34 * sc * k * math.sin(th) * math.cos(ph), z0 + 0.26 * sc * math.sin(ph)))
        return P_
    surf(mb, hull(1.0, 0.32), paint('#3a7ac8'), nu=40, nv=10, caps=(True, False))
    # (inside: the planks, a shade lighter, a little in from the outside)
    surf(mb, hull(0.92, 0.32), wood('#9a7650'), nu=40, nv=8, caps=(True, False))
    tube(mb, [(0.88 * math.cos(t / 40 * math.tau), 0.34 * (1 - 0.35 * max(0.0, math.cos(t / 40 * math.tau)) ** 3) * math.sin(t / 40 * math.tau), 0.32) for t in range(41)], 0.025, paint(c), seg=6)
    rbox(mb, -0.08, -0.28, 0.24, 0.08, 0.28, 0.27, wood(OAK), r=0.01)
    for y in (-0.12, 0.12):
        tube(mb, [(-0.7, y, 0.3), (0.6, y, 0.26)], 0.018, wood(PALE), seg=5)
        rbox(mb, 0.55, y - 0.05, 0.24, 0.8, y + 0.05, 0.27, wood(PALE), r=0.01)


@item('od_haybale', 1, 1)
def od_haybale(P):
    """A round hay bale lying on its side, straw sticking out, a band of twine."""
    mb = P.main
    m = len(mb.v)
    lathe(mb, [(0.0, -0.32), (0.3, -0.32), (0.34, -0.26), (0.35, 0.0), (0.34, 0.26), (0.3, 0.32), (0.0, 0.32)], col_fn('#e8c060', grain='z', mottle=0.15), seg=20)
    xform(mb, m, Matrix.Translation((0, 0, 0.35)) @ rot(y=math.pi / 2))
    for x in (-0.12, 0.12):
        m = len(mb.v)
        lathe(mb, [(0.355, -0.01), (0.355, 0.01)], shade('#a87040'), seg=20)
        xform(mb, m, Matrix.Translation((x, 0, 0.35)) @ rot(y=math.pi / 2))


@item('od_crates', 1, 1)
def od_crates(P):
    """Wooden crates stacked, one with apples in it."""
    mb = P.main
    for (x, y, z, s) in ((-0.1, 0.05, 0.0, 0.34), (0.16, -0.08, 0.0, 0.28), (-0.06, 0.06, 0.34, 0.28)):
        boards(mb, x - s / 2, x + s / 2, y - s / 2, y + s / 2, z, z + s, 3, OAK, along='y', seed=int(x * 10))
        rbox(mb, x - s / 2 - 0.01, y - s / 2 - 0.01, z + s * 0.4, x + s / 2 + 0.01, y + s / 2 + 0.01, z + s * 0.48, wood(DARK), r=0.006)
    for k in range(5):
        ball(mb, (0.16 + 0.07 * math.cos(k * 1.3) * (k % 3) / 2, -0.08 + 0.07 * math.sin(k * 1.3) * (k % 3) / 2, 0.29), 0.05, '#d83a3a', sub=1)
