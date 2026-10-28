"""Furniture, part ten: outdoor furniture (6zu_outdoor.js, David's note of 28 October): Waffle's island displays as real
models at last, and many more of each kind, sold a few of each kind a day. Lights (street lamps, lanterns, a torch, path
lights, string lights, a fire pit), seats (park, stone, log and iron benches, a porch swing, an Adirondack chair, a deck
chair, a stump), fences (picket, split rail, iron, bamboo, low stone, rope, lattice: each a tile wide, so they join in a
row), statues (gnomes, a frog, a flamingo, an owl, a cat, a turtle, a toadstool), things that stand about (signs, an
umbrella, a picnic table, a flag, fountains, a bird bath, a sundial, a birdhouse, a wheelbarrow, a rose arch, a telescope,
wind chimes), plants (hedges square, round, long, tall and flowering, topiaries, planters, a potted palm, a rose bush)
and the rest (a lounger, a grill, a cooler, a rowboat, hay, crates). Each stands on its footprint like the rooms'
furniture, so it goes indoors as well as out; lit parts (flames, bulbs) are *_glow."""
import math, random
from mathutils import Vector, Matrix, Euler, noise
from trees_ac import rgb, LIGHT
from kit import col_fn, shade, rbox, lathe, tube, cyl, xform, rot, slab, plank_row, flame
from folks import ball, surf, superq, sgnpow, revolve
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


# ---------------------------------------------------------------- light helpers (29 October: the pieces redone after
# David's look at the sheet; these keep each model within its old weight)
def box4(mb, x0, y0, z0, x1, y1, z1, col, soft=0.35):
    """a light box: four corners a face (24 points), the normals leaning out at the corners so its edges read soft"""
    fn = col if callable(col) else shade(col)
    lo, hi = (x0, y0, z0), (x1, y1, z1)
    c = Vector(((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2))
    for ax in range(3):
        a, b = [i for i in range(3) if i != ax]
        for sgn in (-1, 1):
            n = Vector((0, 0, 0))
            n[ax] = sgn
            pts = []
            for ua, ub in ((0, 0), (1, 0), (1, 1), (0, 1)):
                p = Vector((0, 0, 0))
                p[ax] = lo[ax] if sgn < 0 else hi[ax]
                p[a] = lo[a] if ua == 0 else hi[a]
                p[b] = lo[b] if ub == 0 else hi[b]
                pts.append(p)
            nr = [(n * (1 - soft) + (p - c).normalized() * soft).normalized() for p in pts]
            mb.add(pts, [fn(p, n, z0, z1) if fn.__code__.co_argcount > 2 else fn(p, n) for p in pts], nr, [(0, 1, 2), (0, 2, 3)])


def sheet(mb, P, us, vs, col, flip=False, closed_u=False):
    """an open surface P(u, v) over the values us x vs (a hull's skin), its normals worked out from it (flip: the other way)"""
    fn = col if callable(col) else shade(col)
    e = 1e-4
    pts, nrms, faces = [], [], []
    for v in vs:
        for u in us:
            p = P(u, v)
            n = (P(u + e, v) - P(u - e, v)).cross(P(u, v + e) - P(u, v - e))
            if n.length < 1e-12:
                n = (P(u + 0.02, v) - P(u - 0.02, v)).cross(P(u, v + 0.02) - P(u, v - 0.02))
            n = n.normalized() * (-1 if flip else 1)
            pts.append(p); nrms.append(n)
    # (painted as kit's pieces are: darker toward its foot, over its own height)
    z0, z1 = min(p.z for p in pts), max(p.z for p in pts)
    cols = [fn(p, n, z0, z1) if fn.__code__.co_argcount > 2 else fn(p, n) for p, n in zip(pts, nrms)]
    w = len(us)
    for j in range(len(vs) - 1):
        for i in range(w - (0 if closed_u else 1)):
            a, b = j * w + i, j * w + (i + 1) % w
            faces += [(a, b, b + w), (a, b + w, a + w)]
    mb.add(pts, cols, nrms, faces)


def lump(seed, freq, amp):
    """a slow lumpy swelling over a surface (a clipped hedge's clumps): 1 + amp * noise, by direction from the middle"""
    off = Vector((seed * 1.37, seed * 2.11, seed * 0.73))

    def f(d):
        q = d * freq + off
        return 1 + amp * (noise.noise(q) + 0.45 * noise.noise(q * 2.3 + off))
    return f


def _arc(f, a0, a1, n=400):
    """a curve f(t) for t from a0 to a1, retraced evenly along its length: s 0..1 -> t"""
    ts = [a0 + (a1 - a0) * k / n for k in range(n + 1)]
    ps = [f(t) for t in ts]
    acc = [0.0]
    for k in range(n):
        acc.append(acc[-1] + math.hypot(ps[k + 1][0] - ps[k][0], ps[k + 1][1] - ps[k][1]))
    L = acc[-1] or 1.0

    def g(s):
        x = max(0.0, min(1.0, s)) * L
        lo, hi = 0, n
        while hi - lo > 1:
            m = (lo + hi) // 2
            if acc[m] <= x:
                lo = m
            else:
                hi = m
        t = (x - acc[lo]) / max(1e-12, acc[hi] - acc[lo])
        return ts[lo] + (ts[hi] - ts[lo]) * t
    return g


def blob(c, r, e_side=1.0, e_top=1.0, amp=0.0, freq=2.6, seed=0.0, sink=0.0):
    """a superquadric (boxy for a clipped hedge, round for a ball) swollen in slow lumps, its points spread evenly along
    its sides and over its top (not bunched at the edges as a superquadric's are): (P(u, v), inside(p), swell(u, v))"""
    c, (rx, ry, rz) = Vector(c), r
    sw = lump(seed, freq, amp)
    R = (rx + ry) / 2

    def ring(t, e):
        """the unit superellipse by the angle seen from its middle (smooth all round, its flat sides as even as its corners)"""
        c, s_ = math.cos(t), math.sin(t)
        r = (abs(c) ** (2 / e) + abs(s_) ** (2 / e)) ** (-e / 2)
        return r * c, r * s_
    th_of = _arc(lambda t: (ring(t, e_side)[0] * rx, ring(t, e_side)[1] * ry), 0.0, math.tau)
    ph_of = _arc(lambda t: (ring(t, e_top)[0] * R, ring(t, e_top)[1] * rz), -math.pi / 2, math.pi / 2)

    def unit(u, v):
        th, ph = th_of(u % 1.0 if u != 1.0 else 1.0), ph_of(v)
        hx, hy = ring(th, e_side)
        cp, sp = ring(ph, e_top)
        return Vector((cp * hx, cp * hy, sp))

    def swell(u, v):
        q = unit(u, v)
        return sw(Vector((q.x * rx, q.y * ry, q.z * rz)))

    def P(u, v):
        q = unit(u, v)
        k = sw(Vector((q.x * rx, q.y * ry, q.z * rz)))
        z = q.z * rz
        # (it swells everywhere but underneath, which stays on the ground; sink: how far its foot goes into it)
        return c + Vector((q.x * rx * k, q.y * ry * k, z * k if z > 0 else z * (1 + sink)))

    def inside(p, m=0.96):
        d = p - c
        x, y, z = abs(d.x) / rx, abs(d.y) / ry, abs(d.z) / rz
        F = (x ** (2 / e_side) + y ** (2 / e_side)) ** (e_side / e_top) + z ** (2 / e_top)
        return F < m ** (2 / e_top)
    return P, inside, swell


# a leaflet: an oval leaf of six points, from its stem (x 0) to its tip (x 1)
LEAFLET = [(0.0, 0.0), (0.3, 0.46), (0.68, 0.4), (1.0, 0.0), (0.68, -0.4), (0.3, -0.46)]
LEAFLET_F = [(0, 1, 5), (1, 2, 4), (1, 4, 5), (2, 3, 4)]


def leaflet(mb, p, n, d, L, W, col, lift=0.2, curl=0.16):
    """one leaf lying on a surface at p (n its normal, d along it), its tip lifting off it, its edges curling down; shaded
    mostly as the surface it lies on, so a hedge of them reads as one soft mass with leaves in it"""
    s = n.cross(d).normalized()
    pts, nrms, cols = [], [], []
    for i, (x, y) in enumerate(LEAFLET):
        pts.append(p + d * (x * L) + s * (y * L * W) + n * (x * x * L * lift - abs(y) * L * W * curl))
        nrms.append((n + s * (y * 0.9) + d * (0.25 * x - 0.15)).normalized())
        cols.append(col * ((0.8 + 0.32 * x) * (0.93 if y else 1.0)))
    mb.add(pts, cols, nrms, LEAFLET_F)


def scatter(P, count, rng, mind, reject=None, vmin=0.0, vmax=1.0, grid=(64, 40), centre=None):
    """points spread over a surface P(u, v) by its area, kept mind apart: [(p, outward normal, u, v)]"""
    import bisect
    gu, gv = grid
    keys, cells, tot = [], [], 0.0
    for j in range(gv):
        v0, v1 = vmin + (vmax - vmin) * j / gv, vmin + (vmax - vmin) * (j + 1) / gv
        for i in range(gu):
            u0, u1 = i / gu, (i + 1) / gu
            a = P(u0, v0)
            tot += (P(u1, v0) - a).cross(P(u0, v1) - a).length + 1e-9
            keys.append(tot); cells.append((u0, u1, v0, v1))
    # (kept apart about as far as the leaves can go and still fit, so they cover it evenly, without bare patches)
    mind = max(mind, 0.74 * math.sqrt(tot / max(1, count)))
    out, hashed = [], {}
    h = max(mind, 1e-3)
    for _ in range(count * 60):
        if len(out) >= count:
            break
        u0, u1, v0, v1 = cells[min(len(cells) - 1, bisect.bisect_left(keys, rng.random() * tot))]
        u, v = rng.uniform(u0, u1), rng.uniform(v0, v1)
        p = P(u, v)
        if reject and reject(p):
            continue
        k = (int(math.floor(p.x / h)), int(math.floor(p.y / h)), int(math.floor(p.z / h)))
        near = [q for dx in (-1, 0, 1) for dy in (-1, 0, 1) for dz in (-1, 0, 1) for q in hashed.get((k[0] + dx, k[1] + dy, k[2] + dz), ())]
        if any((p - q).length < mind for q in near):
            continue
        e = 1e-3
        n = (P(u + e, v) - P(u - e, v)).cross(P(u, min(1.0, v + e)) - P(u, max(0.0, v - e)))
        if n.length < 1e-12:
            continue
        n.normalize()
        if centre is not None and n.dot(p - Vector(centre)) < 0:
            n = -n
        hashed.setdefault(k, []).append(p)
        out.append((p, n, u, v))
    return out


GREENS = ('#336e36', '#4f9a48', '#86c868')      # (the hedges' shade, middle and the sunlit tips: all near one hue, so
                                                 # the four colors the shop paints them in take every leaf)


def area(P, vmin=0.0, gu=32, gv=24):
    """about how big a surface P(u, v) is (from v = vmin up), for how many leaves it takes"""
    tot = 0.0
    for j in range(gv):
        v0, v1 = vmin + (1 - vmin) * j / gv, vmin + (1 - vmin) * (j + 1) / gv
        for i in range(gu):
            a = P(i / gu, v0)
            tot += (P((i + 1) / gu, v0) - a).cross(P(i / gu, v1) - a).length
    return tot


def turned(S, R, at):
    """a shape for foliage() turned by the matrix R about the point at"""
    R, at = R.to_3x3(), Vector(at)
    Ri = R.inverted()
    P0, in0 = S['P'], S['inside']
    return dict(S, P=lambda u, v: R @ (P0(u, v) - at) + at, inside=lambda p, m=0.96: in0(Ri @ (p - at) + at, m),
                c=R @ (Vector(S['c']) - at) + at)


def shape(c, r, nu, nv, e_side=1.0, e_top=1.0, amp=0.03, freq=4.0, seed=0.0, **kw):
    P, inside, sw = blob(c, r, e_side, e_top, amp=amp, freq=freq, seed=seed)
    return dict(P=P, inside=inside, swell=sw, c=Vector(c), nu=nu, nv=nv, **kw)


def flower_pot(mb, r0, r1, h, col, rim=0.03, soil='#4a3424', seg=18):
    """a flower pot: tapering, a rolled rim, dark earth showing at the top"""
    lathe(mb, [(r0 * 0.92, 0.0), (r0, 0.015), (r1, h - rim * 1.6), (r1 + rim * 0.8, h - rim * 1.5), (r1 + rim, h - rim * 0.7),
               (r1 + rim * 0.75, h), (r1 - 0.01, h)], col, seg=seg, cap_top=False)
    lathe(mb, [(r1 - 0.01, h - 0.025), (0.0, h - 0.035)], col_fn(soil, mottle=0.2, under=0.0), seg=seg, cap_top=False)


def foliage(mb, shapes, rng, L=0.14, W=0.82, lift=(0.1, 0.45), spin=math.pi, mind=0.62, z0=0.0, z1=1.0, cols=GREENS,
            base=True, curl=0.22, cover=1.25):
    """clipped leaves over shapes (each {'P', 'inside', 'c', 'n' leaves, 'nu', 'nv', optional 'vmin', 'L', 'swell'}): a
    dark mass under them so nothing shows through, then the leaves, kept off the parts buried in another shape; lighter
    up top and toward the light, darker underneath, in the creases and down by the ground"""
    dark, mid, hi = (rgb(c) for c in cols)

    def shade_at(p, n, k=0.0):
        t = 0.18 + 0.42 * max(0.0, n.dot(LIGHT)) + 0.32 * max(0.0, min(1.0, (p.z - z0) / max(0.05, z1 - z0))) + k
        t = max(0.0, min(1.0, t))
        c = dark.lerp(mid, min(1.0, t * 1.6)) if t < 0.62 else mid.lerp(hi, (t - 0.62) / 0.38)
        c = c * (1 - 0.3 * max(0.0, -n.z))
        return c * (1 - 0.32 * max(0.0, 1 - (p.z - z0) / 0.22) ** 2)
    for S in shapes:
        others = [o for o in shapes if o is not S]
        sw = S.get('swell')
        LL = S.get('L', L)
        if base:
            def bc(p, n, u, v, sw=sw):
                k = (sw(u, v) - 1) * 3.0 if sw else 0.0
                return shade_at(p, n, -0.25 + k) * (0.42 + 0.08 * noise.noise(p * 11))

            def Pb(u, v, P0=S['P'], d=0.15 * LL, c0=Vector(S['c'])):
                """(the dark mass a little under the leaves, so its flat facets never cover the ones lying in a hollow)"""
                p, e = P0(u, v), 1e-3
                n = (P0(u + e, v) - P0(u - e, v)).cross(P0(u, min(1.0, v + e)) - P0(u, max(0.0, v - e)))
                if n.length < 1e-10:
                    return p
                n.normalize()
                if S.get('flip', True) and n.dot(p - c0) < 0:
                    n = -n
                return p - n * d
            surf(mb, Pb, bc, nu=S['nu'], nv=S['nv'])
        rej = (lambda p, others=others: any(o['inside'](p) for o in others)) if others else None
        cnt = S.get('n') or int(cover * area(S['P'], S.get('vmin', 0.12)) / (LL * LL * W * 0.588))
        for p, n, u, v in scatter(S['P'], cnt, rng, LL * mind, rej, vmin=S.get('vmin', 0.12), centre=S['c'] if S.get('flip', True) else None):
            g = Vector((0, 0, -1)) - n * (-n.z)
            if g.length < 0.25:
                g = n.cross(Vector((1, 0, 0)))
            g.normalize()
            a = rng.uniform(-spin, spin)
            sd = n.cross(g)
            d = (g * math.cos(a) + sd * math.sin(a)).normalized()
            k = (sw(u, v) - 1) * 1.5 if sw else 0.0
            lf = rng.uniform(*lift)
            # (a leaf standing further out catches more light; one lying deep in is in shade)
            c = shade_at(p, n, k + rng.uniform(-0.15, 0.1) + 0.25 * (lf - lift[0]) / max(1e-3, lift[1] - lift[0]) - 0.08)
            if rng.random() < 0.12:
                c = c.lerp(hi * 1.08, 0.45)
            Lk = LL * rng.uniform(0.85, 1.15)
            leaflet(mb, p - d * Lk * 0.42 + n * 0.006, n, d, Lk, W, c, lift=lf, curl=curl)


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


def rock(mb, c, size, col, seed, box=0.38, jag=0.1, clip=None, tilt=0.0, sub=2):
    """a stone: a ball pushed out toward a box (flat faces, rounded edges), sized, its faces and corners knocked about a
    little, cut off flat at clip (x from, x to) where it meets the next tile; shaded by its own faces"""
    from trees_ac import bmesh_ico
    ico = bmesh_ico(sub)
    c = Vector(c)
    sx, sy, sz = size
    off = Vector((seed * 1.7, seed * 2.9, seed * 0.6))
    P = []
    for v in ico['v']:
        q = Vector((sgnpow(v.x, box), sgnpow(v.y, box), sgnpow(v.z, box)))
        q *= 1 + jag * noise.noise(v * 1.8 + off) + jag * 0.5 * noise.noise(v * 4.0 + off)
        p = Vector((q.x * sx, q.y * sy, q.z * sz))
        if tilt:
            p = Matrix.Rotation(tilt, 3, 'Y') @ p
        p += c
        if clip:
            p.x = max(clip[0], min(clip[1], p.x))
        P.append(p)
    N = [Vector((0, 0, 0)) for _ in P]
    for f in ico['f']:
        a, b, d = (P[i] for i in f)
        fn = (b - a).cross(d - a)
        if fn.dot(a - c) < 0:
            fn = -fn
        for i in f:
            N[i] += fn
    N = [n.normalized() if n.length > 1e-12 else Vector((0, 0, 1)) for n in N]
    mb.add(P, [col(p, n) for p, n in zip(P, N)], N, ico['f'])


@item('od_fence_stone', 1, 1)
def od_fence_stone(P):
    """A low drystone wall: flat, uneven stones laid in courses (big ones at the foot, thinner ones above, the joints
    crossing), a row of coping stones set on edge along its top, in warm greys and buffs; cut square at each end so a row
    joins up."""
    mb = P.main
    rng = random.Random(91)
    tones = ('#ada597', '#9a958c', '#b9ae99', '#8f8b84', '#a99d88', '#a09684', '#b4ada2', '#a39a8c')

    def stone_col(c, seed):
        f = col_fn(c, mottle=0.14, seed=seed, under=0.1)

        def g(p, n, z0=0, z1=1):
            # (worn lighter on top; its rounded edges a shade darker than its faces, so they read crisp, not puffed up)
            edge = max(abs(n.x), abs(n.y), abs(n.z)) ** 3
            return f(p, n, 0.0, 0.42) * (1 + 0.1 * max(0.0, n.z)) * (0.8 + 0.2 * edge)
        return g
    box4(mb, -0.5, -0.09, 0.0, 0.5, 0.09, 0.32, col_fn('#55514b', under=0.0))
    k = 0
    for z0, z1, lens in ((0.0, 0.125, (0.3, 0.41, 0.29)), (0.125, 0.215, (0.19, 0.27, 0.3, 0.24)), (0.215, 0.29, (0.37, 0.28, 0.35))):
        x = -0.5
        for L in lens:
            g = 0.009
            end = x < -0.49 or x + L > 0.49
            clip = (-0.5 if x < -0.49 else -9, 0.5 if x + L > 0.49 else 9)
            hz = (z1 - z0) / 2 - g + rng.uniform(-0.006, 0.004)
            rock(mb, (x + L / 2, rng.uniform(-0.008, 0.008), (z0 + z1) / 2 + 0.003), (L / 2 - g + (0.012 if end else 0), 0.125 + rng.uniform(-0.008, 0.006), hz),
                 stone_col(tones[k % len(tones)], k * 1.3), seed=k * 3.1, clip=clip, jag=0.16, box=0.22, tilt=rng.uniform(-0.04, 0.04))
            x += L
            k += 1
    # the capping: long flat stones along the top, a little proud of the wall each side
    x = -0.5
    for j, L in enumerate((0.24, 0.29, 0.21, 0.26)):
        clip = (-0.5 if j == 0 else -9, 0.5 if j == 3 else 9)
        end = j in (0, 3)
        hz = (0.034, 0.042, 0.03, 0.038)[j]
        rock(mb, (x + L / 2, rng.uniform(-0.012, 0.012), 0.29 + hz + 0.002), (L / 2 - 0.008 + (0.012 if end else 0), 0.14 + rng.uniform(-0.01, 0.01), hz),
             stone_col(tones[(j * 3 + 2) % len(tones)], j * 2.3 + 9), seed=j * 5.7 + 2, clip=clip, tilt=rng.uniform(-0.04, 0.04), jag=0.16, box=0.22)
        x += L


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
    """A stone turtle: a high domed shell of raised plates (a row down its back, three each side, a ring of small ones round
    its rim) over a lip, its head poking out on a short neck, looking up, four stubby legs."""
    mb = P.main
    SHELL, GROOVE, SKIN, LIP = '#86ae6c', '#46663e', '#a6c48c', '#6e9a5a'
    a, b, z0, h = 0.31, 0.26, 0.12, 0.22          # (half length, half width, the rim's height, the dome's height)

    def dz(x, y):
        q = max(0.0, 1 - (x / b) ** 2 - (y / a) ** 2)
        return z0 + h * q ** 0.55

    def dome(u, v):
        th, rho = u * math.tau, math.cos(v * math.pi / 2)
        x, y = b * rho * math.cos(th), a * rho * math.sin(th)
        return Vector((x, y, dz(x, y)))
    surf(mb, dome, lambda p, n, u, v: rgb(GROOVE) * (0.85 + 0.15 * n.z), nu=14, nv=6, caps=(False, True))
    # the lip under the rim, and the belly
    lathe(mb, [(1.0, z0 + 0.002), (1.05, z0 - 0.025), (0.9, z0 - 0.06)], stone(LIP, 1), seg=14, cap_top=False, cap_bot=True, sx=b, sy=a)

    def plate(cx, cy, others, rim=0.84, gap=0.016, n=8, lift=0.018, rot0=0.0, col=SHELL, ring=None):
        """one plate: its edge where it meets its neighbours (half way to each), clipped to the rim, its middle raised"""
        c = Vector((cx, cy))
        pts, ts = [], []
        for k in range(n):
            ang = rot0 + k / n * math.tau
            d = Vector((math.cos(ang), math.sin(ang)))
            t = 1.0
            for o in others:
                w = o - c
                dd = d.dot(w)
                if dd > 1e-6:
                    t = min(t, w.length_squared / (2 * dd))
            # (the rim: an ellipse rho = rim)
            A = (d.x / b) ** 2 + (d.y / a) ** 2
            B_ = 2 * (c.x * d.x / b ** 2 + c.y * d.y / a ** 2)
            C = (c.x / b) ** 2 + (c.y / a) ** 2 - rim ** 2
            if ring:
                C = (c.x / b) ** 2 + (c.y / a) ** 2 - ring ** 2
            disc = B_ * B_ - 4 * A * C
            if disc > 0:
                t = min(t, (-B_ + math.sqrt(disc)) / (2 * A))
            ts.append((d, max(0.0, t - gap)))
        # (each corner eased toward its neighbours', so the plates come out rounded, never spiky)
        for k, (d, t) in enumerate(ts):
            t = min(t, 0.5 * t + 0.25 * (ts[k - 1][1] + ts[(k + 1) % n][1]))
            q = c + d * t
            pts.append(Vector((q.x, q.y, dz(q.x, q.y) + 0.012)))
        mid = Vector((cx, cy, dz(cx, cy) + 0.012 + lift))
        ring_ = [mid] + pts
        nrm = [Vector((0, 0, 1)).lerp((p - Vector((0, 0, z0 - 0.1))).normalized(), 0.8).normalized() for p in ring_]
        f = stone(col, seed=cx * 9 + cy * 5)
        cols = [f(p, nn) * (1.08 if i == 0 else 0.96) for i, (p, nn) in enumerate(zip(ring_, nrm))]
        mb.add(ring_, cols, nrm, [(0, 1 + k, 1 + (k + 1) % n) for k in range(n)])
    inner = [Vector((0, -0.15)), Vector((0, 0.0)), Vector((0, 0.15))] + [Vector((sx * 0.14, y)) for sx in (-1, 1) for y in (-0.14, 0.0, 0.14)]
    for c in inner:
        plate(c.x, c.y, [o for o in inner if o != c], rot0=math.pi / 8)
    # the rim's ring of small plates
    for k in range(10):
        ang = (k + 0.5) / 10 * math.tau
        c = Vector((b * 0.93 * math.cos(ang), a * 0.93 * math.sin(ang)))
        ring_pts = []
        for da, rr in ((-0.5, 0.86), (0.5, 0.86), (0.5, 1.0), (-0.5, 1.0)):
            an = ang + da / 10 * math.tau * 0.86
            x, y = b * rr * math.cos(an), a * rr * math.sin(an)
            ring_pts.append(Vector((x, y, dz(x, y) + 0.01 - (0.012 if rr > 0.95 else 0.0))))
        mid = sum(ring_pts, Vector()) / 4 + Vector((0, 0, 0.012))
        nn = (mid - Vector((0, 0, z0 - 0.05))).normalized()
        f = stone(LIP, seed=k)
        mb.add([mid] + ring_pts, [f(q, nn) for q in [mid] + ring_pts], [nn] * 5, [(0, 1, 2), (0, 2, 3), (0, 3, 4), (0, 4, 1)])
    # head on a short neck, looking up a little, two dark eyes and a smile line
    sk = stone(SKIN, 2)
    ball(mb, (0, -0.31, 0.12), (0.06, 0.08, 0.055), sk, sub=1)
    ball(mb, (0, -0.39, 0.165), (0.078, 0.092, 0.072), sk, sub=2)
    for sx in (-1, 1):
        ball(mb, (sx * 0.042, -0.455, 0.19), 0.017, '#2a2a28', sub=1)
    # four stubby legs, splayed, and a little pointed tail
    for sx in (-1, 1):
        for sy, ang in ((-1, 0.6), (1, -0.5)):
            m = len(mb.v)
            ball(mb, (0, 0, 0), (0.085, 0.06, 0.05), sk, sub=1)
            xform(mb, m, Matrix.Translation((sx * 0.22, sy * 0.17, 0.045)) @ rot(z=sx * ang * sy * -1 + (0 if sx > 0 else math.pi)))
    m = len(mb.v)
    ball(mb, (0, 0, 0), (0.025, 0.06, 0.025), sk, sub=1)
    xform(mb, m, Matrix.Translation((0, 0.33, 0.08)) @ rot(x=0.4))


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


def disc(mb, c, rx, ry, seg, col, n=(0, 0, 1)):
    """a flat disc (water in a bowl): seg corners round its middle"""
    c, n = Vector(c), Vector(n)
    fn = col if callable(col) else shade(col)
    pts = [c] + [c + Vector((math.cos(k / seg * math.tau) * rx, math.sin(k / seg * math.tau) * ry, 0)) for k in range(seg)]
    mb.add(pts, [fn(p, n) for p in pts], [n] * len(pts), [(0, 1 + k, 1 + (k + 1) % seg) for k in range(seg)])


@item('dp_fountain', 2, 1)
def dp_fountain(P):
    """A little stone fountain: an oval basin with a moulded foot and a rolled rim, water in it; a turned column carrying
    a scalloped bowl that spills over in streams; a small top bowl and a finial the water springs from."""
    mb, g = P.main, P.gloss
    SY = 0.7                                  # (the basin's oval, to sit in its two tiles)
    st = stone(STONE, 0)
    lathe(mb, [(0.6, 0.0), (0.635, 0.02), (0.635, 0.055), (0.595, 0.075), (0.58, 0.2), (0.605, 0.225), (0.648, 0.245),
               (0.66, 0.28), (0.64, 0.308), (0.585, 0.312), (0.55, 0.29), (0.54, 0.24)], st, seg=24, cap_top=False, sy=SY)

    def water(p, n, z0=0, z1=1):
        r = math.hypot(p.x, p.y / SY)
        return rgb('#5aaed8').lerp(rgb('#a8dcf2'), 0.5 + 0.5 * math.sin(r * 38))
    disc(g, (0, 0, 0.262), 0.55, 0.55 * SY, 14, water)
    # the column, turned like a baluster
    lathe(mb, [(0.13, 0.24), (0.11, 0.27), (0.08, 0.31), (0.066, 0.38), (0.09, 0.44), (0.066, 0.5), (0.075, 0.54)], stone(STONE, 1), seg=12, cap_top=False)
    # the bowl: its underside swelling out to a rolled rim, scalloped all round
    prof = [(0.0, 0.52), (0.1, 0.535), (0.2, 0.575), (0.28, 0.615), (0.31, 0.64), (0.305, 0.668), (0.28, 0.678), (0.25, 0.668), (0.0, 0.648)]

    def pf(v):
        x = v * (len(prof) - 1)
        i = min(len(prof) - 2, int(x))
        t = x - i
        return (prof[i][0] + (prof[i + 1][0] - prof[i][0]) * t, prof[i][1] + (prof[i + 1][1] - prof[i][1]) * t)
    surf(mb, revolve(pf, mod=lambda u, v: 1 + 0.07 * max(0.0, math.cos(u * math.tau * 8)) ** 2 * min(1.0, v * 2)), stone(STONE, 2), nu=16, nv=8)
    disc(g, (0, 0, 0.664), 0.26, 0.26, 10, water)
    # water spilling over the bowl's lip between the scallops, in curved sheets falling into the basin (each one sided,
    # facing out: the far ones are behind the bowl; and few points, so the stone stays most of it and is what's painted)
    for k in range(6):
        a = (k + 0.5) / 6 * math.tau + 1 / 16 * math.tau
        rad, tan = Vector((math.cos(a), math.sin(a), 0)), Vector((-math.sin(a), math.cos(a), 0))
        pts, cols, nrms = [], [], []
        for j, (r_, z, w) in enumerate(((0.3, 0.668, 0.075), (0.345, 0.635, 0.068), (0.372, 0.5, 0.056), (0.386, 0.272, 0.048))):
            q = Vector((rad.x * r_, rad.y * r_ * (1 - (1 - SY) * 0.5 * (0.668 - z) / 0.4), z))
            n = (rad + Vector((0, 0, 0.6 if j < 2 else 0.1))).normalized()
            for sd in (-1, 1):
                pts.append(q + tan * sd * w / 2)
                cols.append(rgb('#e8f6fc') if j == 0 else rgb('#9fd4ee').lerp(rgb('#d0ecf8'), 0.5 + 0.5 * sd * (0.3 if j % 2 else -0.3)))
                nrms.append((n + tan * sd * 0.3).normalized())
        g.add(pts, cols, nrms, [f for j in range(3) for f in ((2 * j, 2 * j + 1, 2 * j + 3), (2 * j, 2 * j + 3, 2 * j + 2))])
    # the top: a short stem, a little bowl, the finial
    lathe(mb, [(0.035, 0.64), (0.028, 0.72), (0.05, 0.75), (0.1, 0.78), (0.105, 0.8), (0.05, 0.81), (0.04, 0.84), (0.0, 0.89)], stone(STONE, 3), seg=10, cap_top=False)
    tube(g, [(0, 0, 0.88), (0, 0, 0.93)], 0.012, '#d8f0fa', seg=3)


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


def rose(mb, c, n, r, col, rng):
    """a rose facing out along n: a round bloom with its petals wound in toward a darker heart"""
    c, n = Vector(c), Vector(n).normalized()
    t = n.cross(Vector((0.2, 0.3, 0.9))).normalized()
    b = n.cross(t)
    base, deep = rgb(col), rgb(col) * 0.62
    m = len(mb.v)
    ball(mb, (0, 0, 0), (r, r, r * 0.78), (0.5, 0.5, 0.5), sub=2)
    for i in range(m, len(mb.v)):
        q = mb.v[i]
        rr = math.hypot(q.x, q.y) / r
        a = math.atan2(q.y, q.x)
        sw = 0.5 + 0.5 * math.sin(a * 2 + rr * 11)
        k = max(0.0, q.z / (r * 0.78))
        col_ = base.lerp(deep, max(0.0, 0.55 * sw * k + 0.4 * max(0.0, 0.35 - rr) / 0.35 * k)) * (1.0 + 0.12 * k)
        mb.c[i] = col_ * (0.8 if q.z < 0 else 1.0)
    xform(mb, m, Matrix.Translation(c) @ Matrix(((t.x, b.x, n.x, 0), (t.y, b.y, n.y, 0), (t.z, b.z, n.z, 0), (0, 0, 0, 1))))


@item('od_arch', 2, 1)
def od_arch(P):
    """A rose arch: white posts with rungs at the sides and an arched top joined by rungs, climbing roses all over it:
    vines winding up the posts and over the top, thick with leaves, roses in bloom and in bud."""
    mb, c = P.main, paint(WHITE)
    XO, YO, HP, HA = 0.72, 0.15, 1.5, 0.42
    for sx in (-1, 1):
        for sy in (-1, 1):
            box4(mb, sx * XO - 0.03, sy * YO - 0.03, 0.0, sx * XO + 0.03, sy * YO + 0.03, HP, c)
        for z in (0.55, 1.1):
            box4(mb, sx * XO - 0.018, -YO, z, sx * XO + 0.018, YO, z + 0.035, c)

    def arc(t):
        return Vector((XO * math.cos(t), 0, HP + HA * math.sin(t)))
    for sy in (-1, 1):
        tube(mb, [arc(j / 14 * math.pi) + Vector((0, sy * YO, 0)) for j in range(15)], 0.03, c, seg=4)
    for j in range(1, 4):
        q = arc(j / 4 * math.pi)
        box4(mb, q.x - 0.02, -YO, q.z - 0.018, q.x + 0.02, YO, q.z + 0.02, c)

    # the frame's middle line, from the left foot up, over and down the right: its point and the way out from it
    def F(t):
        L1, L2 = HP, math.pi * math.sqrt((XO ** 2 + HA ** 2) / 2)
        d = t * (2 * L1 + L2)
        if d < L1:
            return Vector((-XO, 0, d)), Vector((-1, 0, 0))
        if d > L1 + L2:
            return Vector((XO, 0, 2 * L1 + L2 - d)), Vector((1, 0, 0))
        a = math.pi * (1 - (d - L1) / L2)
        q = arc(a)
        return q, Vector((math.cos(a) * HA, 0, math.sin(a) * XO)).normalized()
    rng = random.Random(81)
    dark, mid, hi = (rgb(x) for x in GREENS)

    def tone(out, z, k=0.0):
        tt = max(0.0, min(1.0, 0.22 + 0.45 * max(0.0, out.dot(LIGHT)) + 0.18 * z / 1.9 + k))
        return dark.lerp(mid, min(1.0, tt * 1.6)) if tt < 0.62 else mid.lerp(hi, (tt - 0.62) / 0.38)
    # the vines in clumps along the frame (thickest at the feet and all over the top, thinner up the posts with the white
    # showing between): each a soft mass of leaves with a few leaves standing out of it, roses on some
    blooms = []
    for k in range(42):
        t = rng.random()
        if rng.random() < 0.5:
            t = rng.choice((rng.uniform(0.0, 0.1), rng.uniform(0.9, 1.0), rng.uniform(0.33, 0.67), rng.uniform(0.33, 0.67)))
        q, nrm = F(t)
        top = 0.33 < t < 0.67
        y = rng.choice((-YO, YO)) if not top or rng.random() < 0.6 else rng.uniform(-YO, YO)
        T = (F(min(1.0, t + 0.01))[0] - F(max(0.0, t - 0.01))[0]).normalized()
        r = rng.uniform(0.075, 0.105) * (1.15 if top or t < 0.08 or t > 0.92 else 1.0)
        centre = q + Vector((0, y, 0)) + nrm * rng.uniform(-0.01, 0.03)
        m = len(mb.v)
        ball(mb, (0, 0, 0), (r * 1.25, r, r * 0.9), (0.5, 0.5, 0.5), sub=1)
        R = Matrix((T, Vector((0, 1, 0)).cross(T).normalized() if abs(T.y) < 0.9 else Vector((1, 0, 0)), Vector((0, 1, 0)))).transposed()
        for i in range(m, len(mb.v)):
            o = mb.n[i]
            mb.c[i] = tone(o, centre.z, rng.uniform(-0.18, 0.0)) * 0.82
        xform(mb, m, Matrix.Translation(centre) @ R.to_4x4())
        for j in range(3):
            a = rng.uniform(0, math.tau)
            out = (nrm * math.cos(a) + Vector((0, 1 if y >= 0 else -1, 0)) * math.sin(a) * 1.3 + Vector((0, -0.25, 0.15))).normalized()
            p = centre + out * r * 0.8 + T * rng.uniform(-r, r)
            d = (T * rng.uniform(-1, 1) + Vector((0, 0, -0.5)) + out.cross(T) * rng.uniform(-1, 1))
            d = (d - out * d.dot(out)).normalized()
            Lk = rng.uniform(0.11, 0.15)
            leaflet(mb, p - d * Lk * 0.35, out, d, Lk, 0.82, tone(out, centre.z, rng.uniform(-0.1, 0.12)), lift=rng.uniform(0.1, 0.4))
        if k % 2 == 0:
            blooms.append((centre, nrm, y, r))
    for i, (centre, nrm, y, r) in enumerate(blooms):
        out = (nrm + Vector((0, (1 if y >= 0 else -1) * 0.9, 0)) + Vector((0, -0.5, 0.25))).normalized()
        col = ('#e8406a', '#f0628a', '#d8304e')[i % 3]
        if i % 4 == 3:
            ball(mb, centre + out * (r + 0.01), (0.028, 0.028, 0.036), col_fn(col, under=0.0), sub=1)       # (a bud)
        elif i % 4:
            ball(mb, centre + out * (r + 0.015), (0.045, 0.045, 0.04), col_fn(col, under=0.0), sub=1)       # (a small bloom)
        else:
            rose(mb, centre + out * (r + 0.02), out, 0.058, col, rng)


@item('od_telescope', 1, 1)
def od_telescope(P):
    """A brass telescope on a wooden tripod, pointed up at the sky: a fat tube with a dew shield at its front, a focuser and
    a dark eyepiece at its back, the lens glinting, sitting in a turned mount on the tripod's head."""
    mb, g = P.main, P.gloss
    head = Vector((0, 0.03, 0.8))
    for k in range(3):
        a = k / 3 * math.tau - math.pi / 2 + 0.5
        foot = Vector((math.cos(a) * 0.37, math.sin(a) * 0.33 + 0.03, 0.0))
        tube(mb, [head + (foot - head).normalized() * 0.05, foot], 0.03, wood(OAK, 'z', seed=k), seg=5, r1=0.02)
    lathe(mb, [(0.075, 0.72), (0.08, 0.78), (0.055, 0.84), (0.035, 0.9)], metal(DARK), c=(0, 0.03, 0), seg=8, cap_top=False)
    m = len(g.v)

    def tc(p, n, z0=0, z1=1):
        if p.z > 0.32 and math.hypot(p.x, p.y) < 0.03:
            return rgb('#2a3e5a')                                                # (the lens)
        if p.z < -0.29:
            return rgb('#2e2a2c')                                                # (the eyepiece)
        k = 0.82 if -0.02 < p.z < 0.02 or 0.15 < p.z < 0.17 else 1.0             # (bands round the tube)
        return rgb(BRASS) * k * (0.9 + 0.1 * n.z)
    lathe(g, [(0.028, -0.4), (0.028, -0.3), (0.04, -0.3), (0.04, -0.2), (0.058, -0.2), (0.058, 0.16), (0.072, 0.16),
              (0.072, 0.34), (0.06, 0.34), (0.0, 0.33)], tc, seg=10, cap_top=False, cap_bot=True)
    xform(g, m, Matrix.Translation((0, 0.03, 0.92)) @ rot(z=0.45) @ rot(y=math.radians(56)) @ Matrix.Translation((0, 0, -0.04)))


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
def hedge(P, c, r, e_side, e_top, n, nu, nv, L, amp=0.035, freq=2.6, seed=0.0, lift=(0.08, 0.4), spin=math.pi, mind=0.62):
    """a clipped hedge: a soft box (or ball) swollen in slow clumps, a dark mass under a skin of small leaves"""
    S, inside, sw = blob(c, r, e_side, e_top, amp=amp, freq=freq, seed=seed, sink=0.06)
    shapes = [{'P': S, 'inside': inside, 'c': c, 'n': n, 'nu': nu, 'nv': nv, 'swell': sw, 'vmin': 0.1}]
    foliage(P.main, shapes, random.Random(int(seed * 100) + 3), L=L, z0=0.0, z1=c[2] + r[2], lift=lift, spin=spin, mind=mind)


@item('dp_hedge', 1, 1)
def dp_hedge(P):
    """A square hedge, clipped neat: a soft box of small leaves, gently lumpy, lighter on top where it's been trimmed."""
    hedge(P, (0, 0, 0.31), (0.42, 0.4, 0.31), 0.22, 0.28, n=300, nu=16, nv=10, L=0.15, seed=1.0, lift=(0.04, 0.3), mind=0.5)


@item('dp_hedge_round', 1, 1)
def dp_hedge_round(P):
    """A round hedge: a full, loose ball of leaves bulging in clumps, a little wider than tall."""
    hedge(P, (0, 0, 0.35), (0.39, 0.38, 0.35), 1.0, 1.0, n=290, nu=18, nv=10, L=0.14, amp=0.12, freq=3.4, seed=2.0,
          lift=(0.12, 0.5), spin=2.2, mind=0.4)


@item('dp_hedge_long', 2, 1)
def dp_hedge_long(P):
    """A long hedge, clipped neat, two tiles long."""
    hedge(P, (0, 0, 0.31), (0.9, 0.39, 0.31), 0.2, 0.28, n=480, nu=24, nv=10, L=0.16, amp=0.028, seed=6.0, lift=(0.04, 0.3), mind=0.48)


@item('od_hedge_tall', 1, 1)
def od_hedge_tall(P):
    """A tall hedge, clipped into a column taller than Sarah, its top rounded off."""
    hedge(P, (0, 0, 0.74), (0.4, 0.38, 0.74), 0.24, 0.2, n=470, nu=16, nv=16, L=0.16, amp=0.03, freq=2.2, seed=4.0,
          lift=(0.04, 0.3), mind=0.5)


@item('od_hedge_flower', 1, 1)
def od_hedge_flower(P):
    """A flowering hedge: round and leafy, dotted all over with pink blossoms, each five petals round a yellow eye."""
    mb = P.main
    c, r = (0, 0, 0.34), (0.4, 0.38, 0.33)
    S, inside, sw = blob(c, r, 0.6, 0.6, amp=0.06, freq=3.0, seed=5.0, sink=0.06)
    foliage(mb, [{'P': S, 'inside': inside, 'c': Vector(c), 'n': 255, 'nu': 18, 'nv': 10, 'swell': sw, 'vmin': 0.1}],
            random.Random(41), L=0.14, z1=0.67, lift=(0.06, 0.4), mind=0.5)
    rng = random.Random(42)
    for p, n, u, v in scatter(S, 46, rng, 0.1, vmin=0.3, centre=c):
        col = rgb(('#ff8ac0', '#ffc8e0', '#ff6aa8')[rng.randrange(3)])
        blossom(mb, p + n * 0.03, n, rng.uniform(0.04, 0.055), col, rng)


def blossom(mb, p, n, r, col, rng):
    """a little flower facing out along n: five round petals in one fan, a yellow eye"""
    t = n.cross(Vector((0.3, 0.7, 0.2))).normalized()
    b = n.cross(t)
    a0 = rng.uniform(0, math.tau)
    pts, cols, nrms = [p + n * r * 0.25], [rgb('#f8d040')], [n]
    for k in range(10):
        a = a0 + k / 10 * math.tau
        rr = r * (1.0 if k % 2 == 0 else 0.78)
        pts.append(p + (t * math.cos(a) + b * math.sin(a)) * rr - n * r * 0.15)
        cols.append(col * (1.0 if k % 2 == 0 else 0.86))
        nrms.append((n + (t * math.cos(a) + b * math.sin(a)) * 0.35).normalized())
    mb.add(pts, cols, nrms, [(0, 1 + k, 1 + (k + 1) % 10) for k in range(10)])


@item('dp_topiary', 1, 1)
def dp_topiary(P):
    """A bunny topiary: a body and head of clipped leaves sitting up on a terracotta pot, two long ears, a round tail,
    two front paws."""
    mb = P.main
    flower_pot(mb, 0.17, 0.21, 0.26, col_fn('#c8784a', under=0.2), seg=16)
    ear = [turned(shape((sx * 0.06, -0.05, 0.99), (0.045, 0.034, 0.16), 8, 6, amp=0.02, seed=7 + sx, L=0.05),
                  rot(y=sx * 0.22, x=0.12), (sx * 0.06, -0.05, 0.86)) for sx in (-1, 1)]
    shapes = [shape((0, 0.04, 0.45), (0.22, 0.2, 0.21), 16, 8, seed=5, L=0.075),
              shape((0, -0.08, 0.74), (0.14, 0.13, 0.13), 14, 8, seed=6, L=0.065),
              shape((0, 0.24, 0.42), (0.065, 0.06, 0.065), 8, 6, seed=9, L=0.05)] + ear + \
             [shape((sx * 0.085, -0.15, 0.31), (0.05, 0.065, 0.05), 8, 6, seed=10 + sx, L=0.045) for sx in (-1, 1)]
    foliage(mb, shapes, random.Random(51), W=0.82, z0=0.24, z1=1.1, lift=(0.04, 0.3), mind=0.5, cover=1.0)


def helix(turns, z0, z1, R0, R1, r0, r1, phase=0.0):
    """a tube wound up round the z axis, tapering (its centre line from R0 to R1 out, its own radius from r0 to r1), closed
    to a point at each end: P(u, v), u round the tube, v along it"""
    def C(v):
        a = phase + turns * math.tau * v
        R = R0 + (R1 - R0) * v
        return Vector((R * math.cos(a), R * math.sin(a), z0 + (z1 - z0) * v))

    def P(u, v):
        v = max(0.0, min(1.0, v))
        e = 1e-3
        T = (C(min(1.0, v + e)) - C(max(0.0, v - e))).normalized()
        a = phase + turns * math.tau * v
        N = Vector((math.cos(a), math.sin(a), 0.0))
        N = (N - T * N.dot(T)).normalized()
        B = T.cross(N)
        # (round at the ends: the radius falls to nothing over the first and last bit)
        k = min(1.0, v / 0.035, (1 - v) / 0.06)
        rr = (r0 + (r1 - r0) * v) * math.sqrt(max(0.0, k * (2 - k)))
        th = u * math.tau
        return C(v) + (N * math.cos(th) + B * math.sin(th)) * rr
    return P


@item('od_topiary_spiral', 1, 1)
def od_topiary_spiral(P):
    """A spiral topiary: a cone of leaves clipped into a corkscrew winding up round its trunk, in a terracotta pot."""
    mb = P.main
    flower_pot(mb, 0.15, 0.2, 0.27, col_fn('#c8784a', under=0.2))
    post(mb, 0, 0, 0.25, 1.22, 0.028, wood(DARK, 'z'), seg=8)
    H = helix(3.2, 0.36, 1.26, 0.12, 0.015, 0.115, 0.05, phase=-0.6)
    S = {'P': H, 'inside': lambda p, m=0.96: False, 'c': Vector((0, 0, 0.8)), 'nu': 8, 'nv': 76, 'vmin': 0.0, 'flip': False}
    # (the leaves face out from the tube, not from the topiary's middle)
    foliage(mb, [S], random.Random(61), L=0.075, W=0.82, z0=0.28, z1=1.3, lift=(0.04, 0.32), mind=0.5, cover=1.2)


def heart(c, w, h, t):
    """a puffy heart standing up facing the front: P(u, v), u round its outline, v from its back to its front"""
    c = Vector(c)
    sx, sz = w / 32.0, h / 30.0

    def o(a):
        return Vector((16 * math.sin(a) ** 3 * sx, 0.0, (13 * math.cos(a) - 5 * math.cos(2 * a) - 2 * math.cos(3 * a) - math.cos(4 * a) + 2.5) * sz))

    def P(u, v):
        ph = (max(0.0, min(1.0, v)) - 0.5) * math.pi
        k = max(0.0, math.cos(ph)) ** 0.45
        return c + o((1 - u) * math.tau) * k - Vector((0, t * sgnpow(math.sin(ph), 0.8), 0))

    def inside(p, m=0.96):
        return False
    return P, inside


@item('od_topiary_heart', 1, 1)
def od_topiary_heart(P):
    """A heart topiary: a puffy heart of clipped leaves on a slim trunk, in a white pot."""
    mb = P.main
    flower_pot(mb, 0.15, 0.2, 0.27, col_fn('#ece4da', under=0.18))
    post(mb, 0, 0, 0.25, 0.7, 0.026, wood(DARK, 'z'), seg=8)
    Hp, inside = heart((0, 0, 0.88), 0.56, 0.5, 0.12)
    S = {'P': Hp, 'inside': inside, 'c': Vector((0, 0, 0.88)), 'nu': 32, 'nv': 8, 'vmin': 0.0}
    foliage(mb, [S], random.Random(71), L=0.07, W=0.82, z0=0.6, z1=1.15, lift=(0.04, 0.32), mind=0.5, cover=1.2)




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
    """A beach lounger: a sturdy wooden frame on legs, little wheels at its head, its back raised, a thick cushion of
    padded rolls in stripes, and a rolled pillow at the top."""
    mb = P.main
    CUSH, CREAM = '#2fb4a4', '#fbf6ee'
    fr = wood('#dcc090', 'x')
    HX, Y, ZR = 0.26, 0.3, 0.29              # (the hinge, the rails' half spread, the rails' top)
    for sy in (-1, 1):
        rbox(mb, -0.88, sy * Y - 0.035, ZR - 0.1, HX + 0.03, sy * Y + 0.035, ZR, fr, r=0.022, mid=0)
        box4(mb, -0.82, sy * Y - 0.03, 0.0, -0.75, sy * Y + 0.03, ZR - 0.09, wood('#c8a878', 'z'))
        # (a wheel each side at the head, on a short leg)
        box4(mb, HX - 0.1, sy * Y - 0.028, 0.1, HX - 0.04, sy * Y + 0.028, ZR - 0.09, wood('#c8a878', 'z'))
        m = len(mb.v)
        lathe(mb, [(0.0, -0.022), (0.075, -0.022), (0.095, -0.012), (0.095, 0.012), (0.075, 0.022), (0.0, 0.022)],
              lambda p, n, z0=0, z1=1: rgb('#3a3a40') if math.hypot(p.x, p.y) > 0.07 else rgb('#e8e0d0'), seg=12, cap_top=False)
        xform(mb, m, Matrix.Translation((HX - 0.07, sy * (Y + 0.06), 0.095)) @ rot(x=math.pi / 2))
    box4(mb, -0.9, -Y - 0.03, ZR - 0.09, -0.83, Y + 0.03, ZR - 0.01, fr)
    box4(mb, HX - 0.12, -Y, ZR - 0.09, HX - 0.04, Y, ZR - 0.02, fr)
    box4(mb, -0.3, -Y, ZR - 0.085, -0.22, Y, ZR - 0.02, fr)

    def roll(x, z, r, col, half=0.27):
        m = len(mb.v)
        lathe(mb, [(0.0, -half), (r * 0.7, -half + 0.005), (r, -half + r * 0.55), (r, half - r * 0.55), (r * 0.7, half - 0.005), (0.0, half)],
              fabric(col, seed=x * 7), seg=6, cap_top=False)
        xform(mb, m, Matrix.Translation((x, 0, z)) @ Matrix.Diagonal((1.0, 1.0, 0.72, 1.0)) @ rot(x=math.pi / 2, y=math.pi / 6))
    # the cushion: a soft pad, its top padded in rolls, two in the cushion's color to one cream; then the back's, raised
    # with the back
    rbox(mb, -0.85, -0.275, ZR - 0.012, HX + 0.005, 0.275, ZR + 0.04, fabric(CUSH, 3), r=0.03, mid=0)
    n = 12
    for k in range(n):
        roll(-0.84 + (HX + 0.84) * (k + 0.5) / n, ZR + 0.042, 0.06, CREAM if k % 3 == 2 else CUSH)
    ang = 0.62
    m = len(mb.v)
    for sy in (-1, 1):
        rbox(mb, 0.0, sy * Y - 0.032, -0.045, 0.66, sy * Y + 0.032, 0.025, fr, r=0.02, mid=0)
    box4(mb, 0.6, -Y - 0.03, -0.045, 0.67, Y + 0.03, 0.02, fr)
    rbox(mb, 0.01, -0.275, 0.015, 0.6, 0.275, 0.065, fabric(CUSH, 4), r=0.03, mid=0)
    for k in range(6):
        roll(0.055 + 0.0915 * k, 0.07, 0.06, CREAM if k % 3 == 2 else CUSH)
    roll(0.58, 0.14, 0.07, CREAM, half=0.24)
    xform(mb, m, Matrix.Translation((HX, 0, ZR - 0.01)) @ rot(y=-ang))


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
    """A little rowboat pulled up on land: a deep painted hull with a pointed bow, a square transom and a sheer rising to
    each end, a white rubbing strake under the gunwale, planks inside, three thwarts, oarlocks, and two oars laid in it."""
    mb = P.main
    BLUE, TRIM, INSIDE, KEEL = '#3a7ac8', '#f2ece0', '#c8ac8a', '#2e5690'
    X0, X1 = -0.82, 0.86                     # (the stern, the bow)

    def B(s):                                # half the beam
        if s < 0.42:
            return 0.37 * (0.64 + 0.36 * math.sin(math.pi / 2 * s / 0.42))
        return 0.37 * max(0.0, math.cos((s - 0.42) / 0.58 * math.pi / 2)) ** 0.8

    def H(s):                                # the sheer: the gunwale, rising to each end
        return 0.37 + (0.06 * (1 - s / 0.45) ** 2 if s < 0.45 else 0.14 * ((s - 0.45) / 0.55) ** 2)

    def K(s):                                # the keel: flat amidships, rising to the stern and up the bow
        return 0.045 + (0.11 * (1 - s / 0.4) ** 2 if s < 0.4 else 0.15 * ((s - 0.4) / 0.6) ** 2.4)

    def hull(s, t, inset=0.0):
        th = (t - 0.5) * math.pi
        b, d = max(0.0, B(s) - inset), max(0.0, H(s) - K(s) - inset)
        up = 1 - max(0.0, math.cos(th)) ** 0.5
        # (the stem raked forward up the bow, the transom leaning back a little at its top)
        rake = 0.16 * up * max(0.0, (s - 0.8) / 0.2) ** 2 - 0.05 * up * max(0.0, 1 - s / 0.15)
        return Vector((X0 + (X1 - X0) * s + rake, b * sgnpow(math.sin(th), 0.62), H(s) - d * (1 - up)))
    ts = [k / 16 for k in range(17)]
    ss = [0.0, 0.03] + [k / 26 for k in range(1, 26)] + [0.975, 1.0]
    sheet(mb, lambda s_, t: hull(s_, t), ss, ts, paint(BLUE, 0.1), flip=True)
    # inside: the planks, a little in from the outside, from just inside the transom to just short of the bow
    si = lambda s_: 0.03 + 0.92 * s_
    sheet(mb, lambda s_, t: hull(si(s_), t, 0.028), [k / 18 for k in range(19)], [k / 12 for k in range(13)],
          wood(INSIDE, 'x'))
    # the transom: the stern's flat back, outside and in
    for sgn, s0, ins, col in ((-1, 0.0, 0.0, paint(BLUE, 0.05)), (1, si(0.0), 0.028, wood(INSIDE, 'z'))):
        ring = [hull(s0, t, ins) for t in ts]
        mid = sum(ring, Vector()) / len(ring)
        n = Vector((sgn, 0, 0))
        mb.add([mid] + ring, [col(q, n) for q in [mid] + ring], [n] * (len(ring) + 1), [(0, 1 + k, 2 + k) for k in range(len(ring) - 1)] + [(0, len(ring), 1)])
    # the gunwale all round, and a rubbing strake below it
    rim = [hull(k / 18, 0.0) for k in range(19)] + [hull(1 - k / 18, 1.0) for k in range(1, 19)] + [hull(0.0, 0.0)]
    tube(mb, rim, 0.026, paint(TRIM, 0.0), seg=5)
    for t in (0.06, 0.94):
        tube(mb, [hull(k / 14 * 0.97, t) + Vector((0, (0.012 if t > 0.5 else -0.012), 0)) for k in range(15)], 0.015, paint(TRIM, 0.0), seg=4)
    # the keel and the stem rising up the bow
    tube(mb, [hull(k / 12, 0.5) - Vector((0, 0, 0.012)) for k in range(12)] + [hull(1.0, 0.5 + 0.5 * k / 4) + Vector((0.014, 0, 0.0)) for k in range(5)],
         0.02, paint(KEEL, 0.0), seg=4)

    def beam_at(s_, z):
        """how far out the inside reaches at height z, at s"""
        d = H(s_) - K(s_) - 0.028
        c = max(0.0, min(1.0, (H(s_) - z) / max(1e-3, d))) ** 2
        return max(0.0, B(s_) - 0.028) * math.sin(math.acos(c)) ** 0.62
    # three thwarts across
    for s_ in (0.16, 0.47, 0.77):
        z = H(s_) - 0.1
        y = beam_at(s_, z) + 0.01
        x = X0 + (X1 - X0) * s_
        box4(mb, x - 0.065, -y, z - 0.03, x + 0.065, y, z, wood('#b8946a', 'y', seed=s_ * 9))
    # floorboards amidships
    for y in (-0.09, 0.0, 0.09):
        x0, x1 = X0 + (X1 - X0) * 0.24, X0 + (X1 - X0) * 0.7
        box4(mb, x0, y - 0.035, K(0.45) + 0.03, x1, y + 0.035, K(0.45) + 0.05, wood('#a8865e', 'x', seed=y * 20))
    # oarlocks on the gunwale by the middle thwart
    xm = X0 + (X1 - X0) * 0.5
    for sy in (-1, 1):
        p = hull(0.5, 0.0 if sy < 0 else 1.0)
        tube(mb, [p + Vector((-0.028, 0, 0.01)), p + Vector((-0.028, 0, 0.045)), p + Vector((0.0, 0, 0.055)), p + Vector((0.028, 0, 0.045)), p + Vector((0.028, 0, 0.01))], 0.009, metal(BRASS), seg=4)
    # two oars laid in it, resting on the thwarts, their blades out over the transom
    for k, (y0, y1) in enumerate(((-0.13, -0.05), (0.1, 0.16))):
        a = Vector((X0 + (X1 - X0) * 0.86, y0, H(0.77) - 0.06 + k * 0.012))
        b = Vector((X0 - 0.06, y1, H(0.0) + 0.035))
        d = (b - a).normalized()
        L = (b - a).length
        oak = wood('#d8bc8c', 'x', seed=k + 3)
        tube(mb, [a - d * 0.02, a + d * 0.12], 0.024, oak, seg=6)
        tube(mb, [a + d * 0.12, a + d * (L - 0.3)], 0.016, oak, seg=6)
        m = len(mb.v)
        slab(mb, [(0.0, -0.016), (0.07, -0.042), (0.3, -0.052), (0.34, -0.03), (0.35, 0.0), (0.34, 0.03), (0.3, 0.052), (0.07, 0.042), (0.0, 0.016)], 0.014, oak, axis='z', at=-0.007)
        yaw = math.atan2(d.y, d.x)
        pitch = -math.asin(max(-1.0, min(1.0, d.z)))
        xform(mb, m, Matrix.Translation(a + d * (L - 0.31)) @ Euler((0, pitch, yaw), 'XYZ').to_matrix().to_4x4())


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
