"""The flowers as Animal Crossing: New Horizons draws them (David, 27 October: "flowers are kinda an important part of
animal crossing so its important to make sure they look right"). One plant per kind, flower_<kind>: three big blooms
close together over a leafy foot, every petal a thick, soft piece (a lens in section, never paper), cupped and curled as
the real flower's are, shading from its edge to the heart:

- the tulip: a plump egg of six petals, the outer three wrapped round the inner, a little open at the lip, over broad
  blue-green leaves that arch out and fold along the middle
- the lily: a star of six pointed petals curling back from a deep throat, speckled near the middle, long stamens with
  rust anthers, narrow leaves all the way up the stems
- the cosmos: eight broad petals notched at the tip round a golden disc, over feathery leaves
- the daisy: a ring of rounded petals round a big golden dome, over a rosette of spoon-shaped leaves
- the rose: a cup of petals in a spiral, tight in the heart and opening outward, over toothed leaves on a little bush

The petals are their own part, flower_<kind>_top, in white shading to grey at the heart (a lily's speckles a darker
grey), and the game paints them in the flower's color (EnvItems.PETALS, through EnvModels' tint); the leaves, stems and
hearts keep their colors in the mesh. --lod1 sizes for phones come with each (flower_<kind>_lod1).

    python tools/blender/flowers.py [--preview DIR] [--only NAME]
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
from mathutils import Vector, Matrix, noise
from common import *

TAU = math.tau
UP = Vector((0, 0, 1))
# the colors the game paints each kind in (EnvItems.PETALS), for the previews
PREVIEW = {
    'tulip': ['#e8283c', '#ffd03a', '#ff86b4'],
    'lily': ['#ffffff', '#ff9a3a', '#ff9cc8'],
    'cosmos': ['#ff7ab8', '#a86ae8', '#ff9a3a'],
    'daisy': ['#ffffff', '#ffd83a', '#ff9cc8'],
    'rose': ['#e02838', '#ffffff', '#ff8ab4'],
}


def c(h):
    return hex_rgb(h) if isinstance(h, str) else h


def smooth01(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def perp(v):
    a = Vector((1, 0, 0)) if abs(v.x) < 0.9 else Vector((0, 1, 0))
    x = v.cross(a).normalized()
    return x, v.cross(x).normalized()


# ---------------------------------------------------------------- the one shape everything is made of
def sheet(bm, col, P, nu, nv, th, colf, inner=None):
    """A thick, soft piece (a petal, a leaf): P(u, v) is its middle surface, u from its foot (0) to its tip (1), v across
    it (-1..1); th its thickness in the middle, thinning to nothing all round its edge (a lens in section), so it reads
    rounded and solid. colf(u, v, side) is its color, side +1 the face toward `inner` (a vector: the face that looks into
    the flower or up), -1 the back."""
    eps = 1e-3

    def nrm(u, v):
        du = P(min(1.0, u + eps), v) - P(max(0.0, u - eps), v)
        dv = P(u, min(1.0, v + eps)) - P(u, max(-1.0, v - eps))
        n = du.cross(dv)
        return n.normalized() if n.length > 1e-12 else None

    sign = 1.0
    n0 = nrm(0.5, 0.0)
    if inner is not None and n0 is not None and n0.dot(inner) < 0:
        sign = -1.0
    grid = {}
    made = []
    for side in (1, -1):
        for i in range(nu + 1):
            u = i / nu
            for j in range(nv + 1):
                v = -1 + 2 * j / nv
                p = P(u, v)
                t = th * math.sqrt(max(0.0, 1 - v * v)) * math.sqrt(max(0.0, math.sin(math.pi * u)))
                n = nrm(min(max(u, 0.02), 0.98), max(min(v, 0.98), -0.98))
                if n is not None and t > 0:
                    p = p + n * (sign * side * t / 2)
                bv = bm.verts.new(p)
                bv[col] = c(colf(u, v, side))
                grid[side, i, j] = bv
                made.append(bv)
    for side in (1, -1):
        for i in range(nu):
            for j in range(nv):
                q = [grid[side, i, j], grid[side, i + 1, j], grid[side, i + 1, j + 1], grid[side, i, j + 1]]
                if (side * sign) < 0:
                    q.reverse()
                try:
                    bm.faces.new(q)
                except ValueError:
                    pass
    bmesh.ops.remove_doubles(bm, verts=made, dist=1e-6)


def tube(bm, col, pts, r0, r1, c0, c1, sides=6):
    """A stem: a tube along pts, r0 thick at the foot to r1 at the top."""
    n = len(pts)
    rings = []
    for i, p in enumerate(pts):
        f = i / (n - 1)
        d = (pts[min(n - 1, i + 1)] - pts[max(0, i - 1)]).normalized()
        x, y = perp(d)
        r = r0 + (r1 - r0) * f
        ring = []
        for k in range(sides):
            a = k / sides * TAU
            v = bm.verts.new(p + (x * math.cos(a) + y * math.sin(a)) * r)
            v[col] = c(mix(c(c0), c(c1), f))
            ring.append(v)
        rings.append(ring)
    for i in range(n - 1):
        for k in range(sides):
            bm.faces.new([rings[i][k], rings[i][(k + 1) % sides], rings[i + 1][(k + 1) % sides], rings[i + 1][k]])


def blob(bm, col, at, sx, sy, sz, colf, axis=None, seg=(8, 5)):
    """A rounded lump (a flower's heart, an anther, a bud), turned to face `axis`; colf(z) colors it by height (-1..1)."""
    res = bmesh.ops.create_uvsphere(bm, u_segments=seg[0], v_segments=seg[1], radius=1)
    q = (axis or UP).to_track_quat('Z', 'Y')
    for v in res['verts']:
        p = v.co.copy()
        v[col] = c(colf(p.z))
        v.co = at + q @ Vector((p.x * sx, p.y * sy, p.z * sz))
    return res['verts']


def bend_line(origin, dirs, L, n=8):
    """Points along a curve from origin, its direction dirs(t) at each step, L long."""
    pts, p = [origin.copy()], origin.copy()
    for i in range(n):
        p = p + dirs((i + 0.5) / n) * (L / n)
        pts.append(p.copy())
    return pts


def curve_at(pts, u):
    """A point and direction along a polyline, u 0..1."""
    f = u * (len(pts) - 1)
    i = min(len(pts) - 2, int(f))
    t = f - i
    return pts[i].lerp(pts[i + 1], t), (pts[i + 1] - pts[i]).normalized()


# ---------------------------------------------------------------- leaves
def leaf(bm, col, base, out, L, W, rise, droop, pal, nu=6, nv=4, fold=0.35, wave=0.0, tip=1.0, th=0.006, teeth=0):
    """A leaf from base: rising at `rise` (radians from flat) and drooping toward its tip by `droop`, out the horizontal
    direction it leans to; folded along its middle (edges up), maybe wavy, maybe toothed. pal: foot, middle, tip."""
    out = Vector((out.x, out.y, 0)).normalized()
    side = UP.cross(out).normalized()
    pts = bend_line(base, lambda t: (out * math.cos(rise - droop * t ** 1.3) + UP * math.sin(rise - droop * t ** 1.3)).normalized(), L, 10)

    def P(u, v):
        p, d = curve_at(pts, u)
        n = d.cross(side).normalized()
        if n.z < 0:
            n = -n
        w = W * math.sin(math.pi * min(1.0, 0.08 + u * 0.92 * tip)) ** 0.7 * (1 - 0.0 * u)
        if teeth:
            w *= 1 + 0.12 * abs(math.sin(u * math.pi * teeth))
        off = n * (fold * w * abs(v) ** 1.5 + wave * w * math.sin(u * 11 + v) * v * v)
        return p + side * (v * w) + off

    def colf(u, v, s):
        k = smooth01(u * 1.2)
        a = mix(c(pal[0]), c(pal[1]), min(1, k * 1.6))
        a = mix(a, c(pal[2]), max(0.0, k - 0.5) * 1.4)
        # (the midrib a little lighter, the back a little paler)
        a = mix(a, c(pal[2]), 0.25 * max(0.0, 1 - abs(v) * 3))
        return mix(a, (0.8, 0.85, 0.7, 1), 0.12) if s < 0 else a
    sheet(bm, col, P, nu, nv, th, colf, inner=UP)


# ---------------------------------------------------------------- the blooms
def petal_colors(base='#c4c4c4', edge='#ffffff', back=0.92, spots=None):
    def colf(u, v, s):
        k = smooth01(u * 1.15 + 0.05)
        a = mix(c(base), c(edge), k)
        if spots and s > 0 and spots(u, v):
            a = mix(a, c('#5e5e5e'), 0.85)
        return a if s > 0 else mix((0, 0, 0, 1), a, back)
    return colf


def tulip(bp, colp, bm, col, top, axis, R, H, lod):
    """A tulip's cup: three outer petals wrapped round three inner ones, narrow at the foot, fullest above the middle,
    drawing in at a lip that's a little open; each petal's middle a soft ridge and its tip a little higher."""
    nu, nv = (8, 6) if not lod else (4, 3)
    x0, y0 = perp(axis)
    for k in range(6):
        outer = k % 2 == 0
        a0 = k / 6 * TAU + 0.3
        hw = math.radians(74 if outer else 62)
        rr = R * (1.0 if outer else 0.86)
        hh = H * (1.0 if outer else 0.95)

        def P(u, v, a0=a0, hw=hw, rr=rr, hh=hh, outer=outer):
            a = a0 + v * hw * (0.62 + 0.38 * math.sin(math.pi * min(1.0, u * 1.1)))
            r = rr * (0.12 + 0.88 * math.sin(math.pi * (0.04 + 0.84 * u)) ** 0.62)
            r *= 1 + 0.07 * (1 - v * v)
            # (the edges of the outer petals curl in at the lip, over the inner)
            r *= 1 - (0.1 if outer else 0.04) * u ** 3 * v * v
            z = hh * u * (1 + 0.13 * (1 - v * v) * u ** 4)
            rad = x0 * math.cos(a) + y0 * math.sin(a)
            return top + axis * z + rad * r
        sheet(bp, colp, P, nu, nv, R * 0.16, petal_colors('#b8b8b8', '#ffffff', 0.86), inner=-(x0 * math.cos(a0) + y0 * math.sin(a0)))
    # the heart at the cup's foot, where the stem meets it
    blob(bm, col, top + axis * 0.004, R * 0.34, R * 0.34, R * 0.28, lambda z: mix(c('#3e7a2c'), c('#6aa83e'), (z + 1) / 2), axis, (6, 4))


def lily(bp, colp, bm, col, top, face, L, lod):
    """A lily: six pointed petals rising from a deep throat and curling back at their tips, a groove down each, speckled
    near the middle; six long stamens with rust anthers and the pistil standing out of the throat."""
    nu, nv = (9, 6) if not lod else (5, 2)
    x0, y0 = perp(face)
    for k in range(6):
        inner3 = k % 2 == 1
        an = k / 6 * TAU + 0.2
        rad = x0 * math.cos(an) + y0 * math.sin(an)
        s2 = face.cross(rad).normalized()
        LL, W = (L, L * 0.36) if inner3 else (L * 0.96, L * 0.3)
        f0, f1 = math.radians(28), math.radians(122 if inner3 else 128)
        dirs = lambda t, f0=f0, f1=f1, rad=rad: face * math.cos(f0 + (f1 - f0) * t ** 1.5) + rad * math.sin(f0 + (f1 - f0) * t ** 1.5)
        pts = bend_line(top + face * 0.004, dirs, LL, 12)

        def P(u, v, pts=pts, rad=rad, s2=s2, W=W):
            p, d = curve_at(pts, u)
            nin = s2.cross(d).normalized()
            if nin.dot(face) < 0:
                nin = -nin
            w = W * math.sin(math.pi * min(1.0, u ** 0.75)) ** 0.8
            # (a groove down the middle: the edges stand up; near the tip they ruffle back a little)
            return p + s2 * (v * w) + nin * (0.32 * w * v * v - 0.25 * w * v * v * max(0.0, u - 0.6) * 2.5)

        spots = (lambda u, v: (0.18 < u < 0.5) and abs(v) < 0.75 and (round(u * nu) + round((v + 1) * nv / 2)) % 2 == 0) if not lod else None
        sheet(bp, colp, P, nu, nv, W * 0.22, petal_colors('#c8c8c8', '#ffffff', 0.9, spots), inner=face)
    # the throat's green heart
    blob(bm, col, top, 0.016, 0.016, 0.02, lambda z: mix(c('#6a9a3a'), c('#cde08a'), (z + 1) / 2), face, (6, 4))
    if lod:
        return
    # six stamens and the pistil, curving up and out of the throat
    for k in range(7):
        pistil = k == 6
        an = k / 6 * TAU + 0.7
        rad = x0 * math.cos(an) + y0 * math.sin(an)
        spread = 0.0 if pistil else 0.38
        pts = bend_line(top + face * 0.01, lambda t, rad=rad, spread=spread: (face + rad * (spread + 0.35 * t * spread)).normalized(), L * (0.95 if pistil else 0.82), 4)
        tube(bm, col, pts, 0.0028, 0.0022, '#cfe0a0', '#eef2c8', sides=4)
        tip = pts[-1]
        d = (pts[-1] - pts[-2]).normalized()
        if pistil:
            blob(bm, col, tip, 0.006, 0.006, 0.005, lambda z: c('#9ab84a'), d, (5, 3))
        else:
            ax = d.cross(rad).normalized()
            blob(bm, col, tip + d * 0.002, 0.004, 0.004, 0.011, lambda z: mix(c('#5a2410'), c('#a8481c'), (z + 1) / 2), ax, (5, 3))


def cosmos(bp, colp, bm, col, top, face, L, lod):
    """A cosmos: eight broad petals, narrow at the heart and wide at the tip, each tip notched into three teeth, the bloom
    open and a little cupped round a golden disc."""
    nu, nv = (4, 6) if not lod else (3, 2)
    x0, y0 = perp(face)
    m = 8
    for k in range(m):
        an = k / m * TAU + 0.15
        rad = x0 * math.cos(an) + y0 * math.sin(an)
        s2 = face.cross(rad).normalized()
        d = (rad * math.cos(0.2) + face * math.sin(0.2)).normalized()
        n = s2.cross(d).normalized()
        if n.dot(face) < 0:
            n = -n
        W = L * 0.44

        def P(u, v, d=d, s2=s2, n=n, W=W):
            w = W * (0.2 + 0.8 * u ** 0.6)
            x = L * u
            if nv >= 6:
                x -= L * 0.07 * u ** 6 * (1 - math.cos(3 * math.pi * v)) / 2
            x *= 1 - 0.1 * abs(v) ** 4 * u ** 4
            z = 0.22 * w * v * v - 0.08 * L * u * u
            return top + d * (x + L * 0.08) + s2 * (v * w) + n * z
        sheet(bp, colp, P, nu, nv, L * 0.07, petal_colors('#c0c0c0', '#ffffff', 0.9), inner=face)
    # the golden disc, domed, a ring of darker florets round its middle
    blob(bm, col, top + face * 0.008, L * 0.28, L * 0.28, L * 0.14, lambda z: mix(c('#c88a14'), c('#ffd23a'), smooth01((z + 0.3) / 1.3)), face, (10, 5) if not lod else (6, 3))
    blob(bm, col, top + face * (0.008 + L * 0.13), L * 0.1, L * 0.1, L * 0.05, lambda z: c('#e0a820'), face, (6, 3))


def daisy(bp, colp, bm, col, top, face, L, lod):
    """A daisy: a ring of rounded petals, a little cupped, round a big golden dome."""
    m = 15 if not lod else 9
    nu, nv = (4, 3) if not lod else (2, 2)
    x0, y0 = perp(face)
    for k in range(m):
        an = k / m * TAU
        rad = x0 * math.cos(an) + y0 * math.sin(an)
        s2 = face.cross(rad).normalized()
        d = (rad * math.cos(0.14) + face * math.sin(0.14)).normalized()
        n = s2.cross(d).normalized()
        if n.dot(face) < 0:
            n = -n
        W = L * (0.34 if not lod else 0.5)

        def P(u, v, d=d, s2=s2, n=n, W=W):
            w = W * math.sin(math.pi * (0.12 + 0.62 * u)) ** 0.6 * (0.55 + 0.45 * math.sqrt(max(0.0, 1 - max(0.0, u - 0.7) / 0.3 * 0.9)))
            x = L * u * (1 - 0.18 * v ** 2 * u ** 3)
            return top + d * (x + L * 0.12) + s2 * (v * w) + n * (0.25 * w * v * v - 0.06 * L * u * u)
        sheet(bp, colp, P, nu, nv, L * 0.09, petal_colors('#c8c8c8', '#ffffff', 0.9), inner=face)
    seg = (12, 6) if not lod else (7, 4)
    vs = blob(bm, col, top + face * 0.01, L * 0.36, L * 0.36, L * 0.2, lambda z: mix(c('#d08a10'), c('#ffcf30'), smooth01((z + 0.2) / 1.2)), face, seg)
    # (the dome's florets: a gentle bumpiness)
    for v in vs:
        v.co += face * (noise.noise(v.co * 160) * 0.0025)


def rose(bp, colp, bm, col, top, face, R, lod):
    """A rose: rings of cupped petals in a spiral, the heart's wrapped tight round each other, each ring further out a
    little more open, the outermost turned back at the rim."""
    x0, y0 = perp(face)
    rings = [(3, 0.32, 0.9, 10), (4, 0.52, 0.95, 30), (5, 0.74, 0.98, 52), (5, 0.96, 0.9, 74)] if not lod else [(3, 0.4, 0.92, 15), (5, 0.9, 0.92, 60)]
    nu, nv = (5, 4) if not lod else (3, 2)
    rng = random.Random(5)
    for ri, (n, rr, hh, openness) in enumerate(rings):
        for k in range(n):
            a0 = k / n * TAU + ri * 0.9 + rng.uniform(-0.12, 0.12)
            hw = TAU / n * 0.62 + 0.25
            o = math.radians(openness)

            def P(u, v, a0=a0, hw=hw, rr=rr, hh=hh, o=o, ri=ri):
                a = a0 + v * hw * (0.55 + 0.45 * math.sin(math.pi * min(1.0, u * 1.2)))
                # a petal leans out from the heart by `o` as it rises, and rolls back at its rim (the outer rings more)
                lean = o * u ** 1.2
                r = R * rr * (0.35 + 0.65 * u ** 0.7) + R * 0.45 * math.sin(lean) * u
                z = R * hh * 0.9 * (u - 0.2 * u * u * math.sin(lean))
                r += R * 0.06 * (1 - v * v)
                r += R * 0.12 * max(0.0, u - 0.7) / 0.3 * (ri / 3)
                z -= R * 0.08 * max(0.0, u - 0.75) / 0.25 * (ri / 3)
                rad = x0 * math.cos(a) + y0 * math.sin(a)
                return top + face * (z - R * 0.15) + rad * r
            sheet(bp, colp, P, nu, nv, R * 0.1, petal_colors('#a8a8a8' if ri < 2 else '#bcbcbc', '#ffffff', 0.84),
                  inner=-(x0 * math.cos(a0) + y0 * math.sin(a0)))
    blob(bm, col, top - face * (R * 0.12), R * 0.42, R * 0.42, R * 0.26, lambda z: mix(c('#2e6a26'), c('#5a9a3a'), (z + 1) / 2), face, (6, 4))


# ---------------------------------------------------------------- the plants
PLANTS = {
    'tulip': dict(seed=81, blooms=[(-0.085, -0.03, 0.27), (0.085, -0.045, 0.31), (0.0, 0.06, 0.36)]),
    'lily': dict(seed=89, blooms=[(-0.1, -0.03, 0.33), (0.1, -0.05, 0.38), (0.01, 0.07, 0.44)]),
    'cosmos': dict(seed=87, blooms=[(-0.1, -0.02, 0.3), (0.1, -0.04, 0.35), (0.0, 0.08, 0.41)]),
    'daisy': dict(seed=83, blooms=[(-0.09, -0.02, 0.22), (0.09, -0.04, 0.26), (0.0, 0.07, 0.31)]),
    'rose': dict(seed=91, blooms=[(-0.09, -0.03, 0.27), (0.09, -0.05, 0.3), (0.0, 0.07, 0.35)]),
}
LEAF = {
    'tulip': ('#3f7a3c', '#68a858', '#9ccb7a'),
    'lily': ('#2f6a2a', '#4e9a3a', '#86c25a'),
    'cosmos': ('#2e6e26', '#52a23a', '#8ccc5a'),
    'daisy': ('#2e6a28', '#4f9838', '#80be56'),
    'rose': ('#24561f', '#3f8030', '#6aa848'),
}


def flower_plant(kind, lod=0):
    """A flower plant: its leaves at the foot, three stems each carrying a bloom of its kind, the two in front lower,
    the blooms turned up and toward the camera (south) as the game looks at them. Two objects: the plant, its petals."""
    spec = PLANTS[kind]
    rng = random.Random(spec['seed'])
    name = 'flower_' + kind + ('_lod1' if lod else '')
    bm, bp = bmesh.new(), bmesh.new()
    col, colp = bm.verts.layers.float_color.new('Col'), bp.verts.layers.float_color.new('Col')
    pal = LEAF[kind]
    stem0, stem1 = mix(c(pal[0]), c('#2a4a1a'), 0.3), c(pal[1])
    O = Vector((0, 0, 0))
    # the leaves at the foot
    if kind == 'tulip':
        for k in range(5 if not lod else 4):
            a = k / 5 * TAU + rng.uniform(-0.3, 0.3) + 0.4
            leaf(bm, col, O + Vector((math.cos(a), math.sin(a), 0)) * 0.012, Vector((math.cos(a), math.sin(a), 0)), rng.uniform(0.22, 0.27), 0.05,
                 rng.uniform(1.15, 1.3), rng.uniform(0.9, 1.25), pal, nu=8 if not lod else 4, nv=4 if not lod else 2, fold=0.45, wave=0.12, th=0.008)
    elif kind == 'lily':
        for k in range(6 if not lod else 4):
            a = k / 6 * TAU + rng.uniform(-0.3, 0.3)
            leaf(bm, col, O, Vector((math.cos(a), math.sin(a), 0)), rng.uniform(0.13, 0.17), 0.02, rng.uniform(0.9, 1.1), rng.uniform(0.8, 1.1), pal,
                 nu=5 if not lod else 3, nv=2, fold=0.3, th=0.004)
    elif kind == 'cosmos':
        # (feathery: fronds of thread-thin leaflets)
        for k in range(7 if not lod else 4):
            a = k / 7 * TAU + rng.uniform(-0.3, 0.3)
            out = Vector((math.cos(a), math.sin(a), 0))
            rise, droop, Lf = rng.uniform(0.7, 1.0), rng.uniform(0.6, 0.9), rng.uniform(0.15, 0.19)
            pts = bend_line(O, lambda t: (out * math.cos(rise - droop * t) + UP * math.sin(rise - droop * t)).normalized(), Lf, 6)
            tube(bm, col, pts, 0.0035, 0.002, pal[0], pal[1], sides=3)
            if lod:
                leaf(bm, col, O, out, Lf, 0.03, rise, droop, pal, nu=3, nv=2, fold=0.2, th=0.003)
                continue
            for j in range(1, 6):
                p, d = curve_at(pts, j / 6)
                side = UP.cross(d).normalized()
                for sgn in (1, -1):
                    o2 = (d * 0.6 + side * sgn).normalized()
                    leaf(bm, col, p, o2, 0.045 * (1 - j / 9), 0.005, 0.5, 0.4, pal, nu=2, nv=1, fold=0.0, th=0.002)
    elif kind == 'daisy':
        for k in range(8 if not lod else 5):
            a = k / 8 * TAU + rng.uniform(-0.25, 0.25)
            leaf(bm, col, O, Vector((math.cos(a), math.sin(a), 0)), rng.uniform(0.1, 0.13), 0.04, rng.uniform(0.6, 0.8), rng.uniform(0.6, 0.8), pal,
                 nu=5 if not lod else 3, nv=3 if not lod else 2, fold=0.3, wave=0.1, th=0.006)
    elif kind == 'rose':
        pass        # (the rose's leaves grow along its stems, below)
    for bi, (bx, by, h) in enumerate(spec['blooms']):
        base = Vector((bx * 0.3, by * 0.3, 0))
        top = Vector((bx, by, h))
        bow = Vector((bx * 0.15, -0.02, 0))
        pts = [base.lerp(top, t) + bow * math.sin(t * math.pi) for t in (i / 6 for i in range(7))]
        thick = {'tulip': (0.011, 0.009), 'lily': (0.008, 0.006), 'cosmos': (0.005, 0.004), 'daisy': (0.006, 0.005), 'rose': (0.008, 0.006)}[kind]
        tube(bm, col, pts, thick[0], thick[1], stem0, stem1, sides=6 if not lod else 4)
        # the bloom faces up, a little out from the plant's middle and toward the camera
        face = Vector((bx * 2.2 + rng.uniform(-0.08, 0.08), -0.55 + rng.uniform(-0.08, 0.08) + (0.2 if by > 0 else 0), 1)).normalized()
        if kind == 'tulip':
            face = Vector((bx * 1.2, -0.18 + (0.08 if by > 0 else 0), 1)).normalized()
            tulip(bp, colp, bm, col, top, face, 0.066, 0.135, lod)
        elif kind == 'lily':
            face = Vector((bx * 3.0, -0.8 + (0.3 if by > 0 else 0), 1)).normalized()
            lily(bp, colp, bm, col, top, face, 0.13, lod)
            # narrow leaves all the way up the stem, in turns
            for j in range(5 if not lod else 2):
                f = 0.2 + j * 0.13
                p = base.lerp(top, f) + bow * math.sin(f * math.pi)
                a = j * 2.4 + bi
                leaf(bm, col, p, Vector((math.cos(a), math.sin(a), 0)), 0.1 - j * 0.008, 0.016, 0.7, 0.7, pal, nu=4 if not lod else 3, nv=2, fold=0.25, th=0.003)
        elif kind == 'cosmos':
            cosmos(bp, colp, bm, col, top, face, 0.085, lod)
            if not lod:
                for j in range(2):
                    f = 0.45 + j * 0.2
                    p = base.lerp(top, f) + bow * math.sin(f * math.pi)
                    a = j * 2.6 + bi * 1.3
                    out = Vector((math.cos(a), math.sin(a), 0))
                    for s in range(3):
                        leaf(bm, col, p, (out + Vector((-out.y, out.x, 0)) * (s - 1) * 0.6), 0.05, 0.004, 0.6, 0.5, pal, nu=2, nv=1, fold=0.0, th=0.002)
        elif kind == 'daisy':
            daisy(bp, colp, bm, col, top, face, 0.08, lod)
        elif kind == 'rose':
            face = Vector((bx * 1.6, -0.45 + (0.15 if by > 0 else 0), 1)).normalized()
            rose(bp, colp, bm, col, top, face, 0.05, lod)
            # toothed leaves up the stem, in threes, and a few round the foot
            for j in range(3 if not lod else 2):
                f = 0.25 + j * 0.2
                p = base.lerp(top, f) + bow * math.sin(f * math.pi)
                a = j * 2.3 + bi * 1.1
                out = Vector((math.cos(a), math.sin(a), 0))
                for s in ((0,) if lod else (-1, 0, 1)):
                    o2 = (out + Vector((-out.y, out.x, 0)) * s * 0.7).normalized()
                    leaf(bm, col, p, o2, 0.07 if s == 0 else 0.055, 0.03 if s == 0 else 0.024, 0.45, 0.6, pal,
                         nu=4 if not lod else 3, nv=2, fold=0.3, th=0.004, teeth=5 if not lod else 0)
    if kind == 'rose':
        for k in range(6 if not lod else 3):
            a = k / 6 * TAU + rng.uniform(-0.3, 0.3)
            leaf(bm, col, O, Vector((math.cos(a), math.sin(a), 0)), 0.085, 0.034, 0.5, 0.6, pal, nu=4 if not lod else 3, nv=2, fold=0.3, th=0.004,
                 teeth=5 if not lod else 0)
    o = mesh_obj(name, bm)
    shade_smooth(o)
    o.data.materials.append(material(name, vcol='Col', rough=0.75))
    op = mesh_obj(name + '_top', bp)
    shade_smooth(op)
    op.data.materials.append(material(name.replace('_lod1', '') + '_top', vcol='Col', rough=0.55))
    return [o, op]


# ---------------------------------------------------------------- previews
def tinted_copy(objs, color, dx, dy):
    """A copy of a plant with its petals painted (vertex colors times the color, as the game does)."""
    out = []
    for o in objs:
        n = o.copy()
        n.data = o.data.copy()
        link(n)
        n.location = (dx, dy, 0)
        n.hide_render = False
        if n.name.split('.')[0].endswith('_top'):
            m = bpy.data.materials.new('tint' + color)
            m.use_nodes = True
            nt = m.node_tree
            bsdf = nt.nodes.get('Principled BSDF')
            bsdf.inputs['Roughness'].default_value = 0.55
            v = nt.nodes.new('ShaderNodeVertexColor')
            v.layer_name = 'Col'
            mx = nt.nodes.new('ShaderNodeMix')
            mx.data_type = 'RGBA'
            mx.blend_type = 'MULTIPLY'
            mx.inputs['Factor'].default_value = 1.0
            nt.links.new(v.outputs['Color'], mx.inputs[6])
            mx.inputs[7].default_value = hex_rgb(color)
            nt.links.new(mx.outputs[2], bsdf.inputs['Base Color'])
            n.data.materials.clear()
            n.data.materials.append(m)
        out.append(n)
    return out


def tris(o):
    return sum(len(p.vertices) - 2 for p in o.data.polygons)


if __name__ == '__main__':
    args = sys.argv[1:]
    prev = args[args.index('--preview') + 1] if '--preview' in args else None
    only = args[args.index('--only') + 1] if '--only' in args else None
    want = lambda n: not only or n == only or n.startswith(only)
    reset()
    built = []
    for kind in PLANTS:
        name = 'flower_' + kind
        if not want(name):
            continue
        objs = flower_plant(kind)
        export(objs, name)
        objs1 = flower_plant(kind, lod=1)
        export(objs1, name + '_lod1')
        print('built', name, 'triangles', sum(tris(o) for o in objs), 'phones', sum(tris(o) for o in objs1))
        for o in objs + objs1:
            o.hide_render = True
        built.append((kind, objs, objs1))
    if prev:
        ground_plane(color='#7fb24a')
        light_rig()
        for row, (kind, objs, objs1) in enumerate(built):
            for i, colr in enumerate(PREVIEW[kind]):
                tinted_copy(objs, colr, i * 0.8, -row * 0.9)
            tinted_copy(objs1, PREVIEW[kind][0], 3 * 0.8 + 0.2, -row * 0.9)
        n = len(built)
        camera((1.2, -(n - 1) * 0.45, 0.2), dist=2.2 + n * 0.75)
        render(os.path.join(prev, 'flowers.png'), size=(1200, 900), samples=48)
        # and close, a row at a time, as the game shows them beside a person
        for row, (kind, objs, objs1) in enumerate(built):
            for o in list(bpy.context.scene.objects):
                if o.name.startswith('Cam'):
                    bpy.data.objects.remove(o)
            camera((0.8, -row * 0.9, 0.22), dist=1.75)
            render(os.path.join(prev, 'close_' + kind + '.png'), size=(1100, 520), samples=48)
