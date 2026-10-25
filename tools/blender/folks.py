"""The island's food folks as painted toys for the new 3D look, each made after its HD picture (32n_hd_npc_*.js): Maki
the maki roll, Kai the poke bowl, Basil the pad thai, Wonton the dumpling, and the rest, the goat, the Cozy Council's
broccoli and the old keeper's ghost. Colors are in the mesh, as the trees' and props' are (soft, rounded, a little
darker underneath); nothing is baked.

Each is built in its picture's own pixels (48 wide, 72 high, standing on the bottom row; x from the middle, z up from
the ground, -y the front where its face is), then scaled to the game's tiles. The parts the game moves are their own
objects, each with its origin at its joint: foot_l / foot_r (they step as it waddles), eye_l / eye_r (shut by squashing
them flat when it blinks), arm_ / leg_ for the gingerbread builder and the goat. Empties mark where a hat a friend gave
sits (anchor_hat: the top of the head, its scale the head's width) and glasses (anchor_eyes: between the eyes, on the
face). Everything else is the body.

    python tools/blender/folks.py [--preview DIR] [--only maki,kai]
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from mathutils import Vector, Matrix, Euler, noise
from mathutils.bvhtree import BVHTree
from common import *
from trees_ac import MB, vmat, rgb, bmesh_ico
from kit import col_fn, shade, rbox, lathe, tube, xform, rot, slab

# picture pixels to tiles: a person (72 pixels) stands DOLL.H (1.62) tall in the game; the folks a touch smaller, as a
# round body looks bigger than a flat picture of one
K = 1.62 / 72 * 0.92
DARK = '#2a1c1e'
FOOT = '#3a2a2c'


def ball(mb, c, r, color, sub=3):
    """A ball (or an ellipsoid, r a triple) whose triangles share their corners: a sixth of kit.ball's weight."""
    fn = color if callable(color) else shade(color)
    ico = bmesh_ico(sub)
    c = Vector(c)
    r = (r, r, r) if isinstance(r, (int, float)) else r
    P = [c + Vector((p.x * r[0], p.y * r[1], p.z * r[2])) for p in ico['v']]
    N = [Vector((p.x / r[0], p.y / r[1], p.z / r[2])).normalized() for p in ico['v']]
    mb.add(P, [fn(p, n) for p, n in zip(P, N)], N, ico['f'])


def X(x):
    return x - 24.0


def Z(y):
    return 72.0 - y


# ---------------------------------------------------------------- shapes
def surf(mb, P, color, nu=40, nv=24, caps=(True, True)):
    """A closed surface P(u, v) -> point, u round it (0..1, counter-clockwise seen from above), v from the bottom (0) to
    the top (1); poles at v 0 and 1 when caps. color(p, n, u, v) or a color."""
    fn = color if callable(color) else (lambda p, n, u, v, c=rgb(color): c)
    e = 1e-3
    rows = list(range(1 if caps[0] else 0, nv if caps[1] else nv + 1))
    pts, nrms, cols, faces = [], [], [], []
    for j in rows:
        v = j / nv
        for i in range(nu):
            u = i / nu
            p = P(u, v)
            du = P(u + e, v) - P(u - e, v)
            dv = P(u, min(1, v + e)) - P(u, max(0, v - e))
            n = du.cross(dv)
            if n.length < 1e-9:
                n = Vector((p.x, p.y, 0))
            n.normalize()
            pts.append(p); nrms.append(n); cols.append(fn(p, n, u, v))
    R = len(rows)
    for r in range(R - 1):
        for i in range(nu):
            a, b = r * nu + i, r * nu + (i + 1) % nu
            faces += [(a, b, b + nu), (a, b + nu, a + nu)]
    mb.add(pts, cols, nrms, faces)
    for cap, v, ring, up in ((caps[0], 0.0, 0, -1), (caps[1], 1.0, R - 1, 1)):
        if not cap:
            continue
        p = P(0, v)
        ring_n = [nrms[ring * nu + i] for i in range(nu)]
        n = Vector((0, 0, up))
        P2 = [p] + [pts[ring * nu + i] for i in range(nu)]
        N2 = [n] + ring_n
        F = [(0, 1 + i, 1 + (i + 1) % nu) for i in range(nu)]
        mb.add(P2, [fn(p, n, 0, v)] + [cols[ring * nu + i] for i in range(nu)], N2, F)


def sgnpow(c, e):
    return math.copysign(abs(c) ** e, c)


def superq(cx, cy, cz, rx, ry, rz, e_side=1.0, e_top=1.0, mod=None):
    """A superquadric (e 1: an ellipsoid; under 1: boxier; over 1: pinched) as P(u, v); mod(u, v) scales the radius."""
    def P(u, v):
        th = u * math.tau
        ph = (v - 0.5) * math.pi
        cp = sgnpow(math.cos(ph), e_top)
        k = mod(u, v) if mod else 1.0
        return Vector((cx + rx * k * cp * sgnpow(math.cos(th), e_side), cy + ry * k * cp * sgnpow(math.sin(th), e_side),
                       cz + rz * sgnpow(math.sin(ph), e_top)))
    return P


def revolve(prof, cx=0.0, cy=0.0, sx=1.0, sy=1.0, mod=None):
    """A turned shape from a profile function v -> (radius, z); mod(u, v) scales the radius (pleats, ribs)."""
    def P(u, v):
        r, z = prof(max(0.0, min(1.0, v)))
        if mod:
            r *= mod(u, v)
        th = u * math.tau
        return Vector((cx + r * math.cos(th) * sx, cy + r * math.sin(th) * sy, z))
    return P


def soft(fn_col, under=0.18, z0=0.0, z1=40.0, top=0.06):
    """A color function painted like a toy: darker underneath and where it meets the ground, a touch lighter on top."""
    def f(p, n, u=0, v=0):
        c = fn_col(p, n, u, v) if callable(fn_col) else rgb(fn_col)
        k = 1.0 - under * max(0.0, 1 - (p.z - z0) / max(1e-3, z1 - z0)) ** 2
        k *= 1.0 - 0.1 * max(0.0, -n.z) + top * max(0.0, n.z)
        return c * k
    return f


def mottle(c, amt=0.08, scale=0.25, seed=0.0, c2=None):
    base, alt = rgb(c), (rgb(c2) if c2 else None)

    def f(p, n, u=0, v=0):
        t = 0.5 + 0.5 * noise.noise(p * scale + Vector((seed, seed * 1.3, seed * 0.7)))
        if alt is not None:
            return base.lerp(alt, t)
        return base * (1 - amt + 2 * amt * t)
    return f


# ---------------------------------------------------------------- a folk being made
class Folk:
    def __init__(self, name):
        self.name = name
        self.parts = {}         # object name -> [MB, origin]
        self.anchors = {}       # anchor name -> (point, scale)

    def part(self, key, origin=(0, 0, 0)):
        if key not in self.parts:
            self.parts[key] = [MB(), Vector(origin)]
        return self.parts[key][0]

    @property
    def body(self):
        return self.part('body')

    def anchor(self, key, p, s=1.0):
        self.anchors[key] = (Vector(p), s)

    def bvh(self, keys=('body',)):
        V, F = [], []
        for k in keys:
            mb = self.parts[k][0]
            b = len(V)
            V += [tuple(v) for v in mb.v]
            F += [tuple(b + i for i in f) for f in mb.f]
        return BVHTree.FromPolygons(V, F)

    def hit(self, x, z, keys=('body',), tree=None):
        """Where a ray from the front at (x, z) meets the body: the point and the way the surface faces."""
        t = tree or self.bvh(keys)
        loc, nrm, idx, d = t.ray_cast(Vector((x, -500, z)), Vector((0, 1, 0)))
        if loc is None:
            return Vector((x, 0, z)), Vector((0, -1, 0))
        if nrm.y > 0:
            nrm = -nrm
        return loc, nrm.normalized()


def frame(p, n, embed=0.0, tilt=0.0):
    """A matrix putting a feature built facing -y (x right, z up) onto the surface at p facing n."""
    out = n.normalized()
    up = Vector((0, 0, 1)) - out * out.z
    up = up.normalized() if up.length > 1e-4 else Vector((0, 1, 0))
    right = up.cross(out).normalized()
    # built with -y as its front: the local axes (x, y, z) go to (right, -out, up)
    M = Matrix((right, -out, up)).transposed().to_4x4()
    M.translation = p - out * embed
    return M @ Euler((0, tilt, 0)).to_matrix().to_4x4()


# ---------------------------------------------------------------- face features (built at the origin facing -y)
def eye_dark(mb, w=2.5, h=3.1, gl=-1, low='#3a2422'):
    """A dark oval eye with a shine (gl: which side the shine is on, -1 left), as the pictures' are."""
    top, bot = rgb(DARK), rgb(low)

    def c(p, n, u=0, v=0):
        t = max(0.0, min(1.0, (p.z + h) / (2 * h)))
        return bot.lerp(top, min(1.0, t * 1.6))
    ball(mb, (0, 0, 0), (w, 1.1, h), c, sub=3)
    ball(mb, (gl * w * 0.38, -0.95, h * 0.36), (w * 0.34, 0.35, h * 0.3), '#ffffff', sub=2)
    ball(mb, (-gl * w * 0.3, -0.85, -h * 0.42), (w * 0.15, 0.3, h * 0.13), '#e8dcd8', sub=1)


def eye_white(mb, w=3.0, h=3.2, look=1, pupil=0.62):
    """A white eye with a dark pupil (look: which way the pupil sits, -1 left, 1 right, 0 middle) and a shine."""
    ball(mb, (0, 0, 0), (w, 1.0, h), '#fbf6f0', sub=3)
    pw, ph = w * pupil, h * 0.8
    ball(mb, (look * (w - pw) * 0.9, -0.55, -h * 0.08), (pw, 0.75, ph), DARK, sub=3)
    ball(mb, (look * (w - pw) * 0.9 - pw * 0.3, -1.2, h * 0.28), (pw * 0.36, 0.3, ph * 0.3), '#ffffff', sub=1)


def blush(mb, body_col, w=3.6, h=2.0, col='#f29aa6'):
    """A painted blush: pink in the middle fading into the body's own color at its edge."""
    pink, bc = rgb(col), rgb(body_col) if isinstance(body_col, str) else body_col

    def c(p, n, u=0, v=0):
        d = math.hypot(p.x / w, p.z / h)
        return pink.lerp(bc, max(0.0, min(1.0, (d - 0.35) / 0.65)) ** 1.5)
    ball(mb, (0, 0, 0), (w, 0.45, h), c, sub=3)


def arc(mb, w, depth, r=0.5, col=DARK, up=False, seg=6):
    """A little curve (a smile, a shut eye, a brow): w wide, sagging depth (or arching when up)."""
    pts = []
    for k in range(seg + 1):
        t = k / seg * 2 - 1
        pts.append((t * w / 2, -0.2, (1 - t * t) * depth * (1 if up else -1)))
    tube(mb, pts, r, col, seg=6)
    for q in (pts[0], pts[-1]):
        ball(mb, q, r, col, sub=1)


def mouth_open(mb, w=2.6, h=1.8, tongue='#e86a78'):
    """A small open smile: dark, a pink tongue at the bottom."""
    ball(mb, (0, 0, 0), (w / 2, 0.5, h / 2), '#4a1e22', sub=2)
    ball(mb, (0, -0.3, -h * 0.2), (w * 0.3, 0.35, h * 0.22), tongue, sub=1)


def brow(mb, w, slant, r=0.85, col='#3a2418'):
    """A bold brow, slanted (positive: its inner end down, cross)."""
    tube(mb, [(-w / 2, -0.2, -slant / 2), (0, -0.5, 0.25), (w / 2, -0.2, slant / 2)], r, col, seg=6)
    for q in ((-w / 2, -0.2, -slant / 2), (w / 2, -0.2, slant / 2)):
        ball(mb, q, r, col, sub=1)


def put(f, x, z, build, part=None, origin=False, embed=0.4, tree=None, tilt=0.0):
    """Build a face feature and stick it on the body at (x, z); part: its own object (an eye, its origin there)."""
    p, n = f.hit(x, z, tree=tree)
    M = frame(p, n, embed, tilt)
    if part:
        mb = f.part(part, p)
        m = len(mb.v)
        build(mb)
        xform(mb, m, M)
    else:
        mb = f.body
        m = len(mb.v)
        build(mb)
        xform(mb, m, M)
    return p, n


def face(f, ex, ez, kind='dark', body_col='#ffffff', w=2.5, h=3.1, gap=None, look=0, blush_dx=None, blush_dz=-4.0,
         blush_col='#f29aa6', mouth='smile', mz=None, mw=4.0, mouth_col=DARK, embed=0.45, tree=None):
    """Two eyes (each its own object, for blinking), cheeks and a mouth, on the front of the body."""
    tree = tree or f.bvh()
    gap = ex if gap is None else gap
    for s, key in ((-1, 'eye_l'), (1, 'eye_r')):
        if kind == 'dark':
            put(f, s * gap, ez, lambda mb, s=s: eye_dark(mb, w, h, gl=-1), part=key, embed=embed, tree=tree)
        elif kind == 'white':
            put(f, s * gap, ez, lambda mb, s=s: eye_white(mb, w, h, look=look if look else -s * 0.0), part=key, embed=embed, tree=tree)
    bdx = (gap + w + 2.4) if blush_dx is None else blush_dx
    if blush_col:
        for s in (-1, 1):
            put(f, s * bdx, ez + blush_dz, lambda mb: blush(mb, body_col, col=blush_col), embed=0.25, tree=tree)
    mz = ez - 5.5 if mz is None else mz
    if mouth == 'smile':
        put(f, 0, mz, lambda mb: arc(mb, mw, 1.1, 0.48, mouth_col), embed=0.15, tree=tree)
    elif mouth == 'open':
        put(f, 0, mz, lambda mb: mouth_open(mb, mw * 0.7, 1.9), embed=0.25, tree=tree)
    f.anchor('eyes', f.hit(0, ez, tree=tree)[0], (gap + w) / 12.0)


def feet(f, x=9.0, w=3.0, d=3.6, h=2.4, z=2.4, col=FOOT, y=-1.0):
    """Two little round feet, each its own object with its origin at its top (where it swings from)."""
    for s, key in ((-1, 'foot_l'), (1, 'foot_r')):
        o = Vector((s * x, y, z + h * 0.5))
        mb = f.part(key, o)
        ball(mb, o + Vector((0, -0.8, -h * 0.5)), (w, d, h), soft(col, under=0.25, z0=o.z - h * 1.2, z1=o.z), sub=3)


def hat_anchor(f, z, width, x=0.0, y=0.0):
    f.anchor('hat', (x, y, z), width / 30.0)


# ---------------------------------------------------------------- the folks
def maki():
    f = Folk('maki')
    R, z0, z1 = 21.5, 3.5, 40.0
    nori = '#1e3a32'

    def prof(v):
        # straight sides with the top and bottom edges rounded off
        if v < 0.1:
            a = v / 0.1 * math.pi / 2
            return R - 2.5 + 2.5 * math.sin(a), z0 + 2.5 - 2.5 * math.cos(a)
        if v > 0.9:
            a = (1 - v) / 0.1 * math.pi / 2
            return R - 2.5 + 2.5 * math.sin(a), z1 - 2.5 + 2.5 * math.cos(a)
        return R, z0 + 2.5 + (v - 0.1) / 0.8 * (z1 - z0 - 5)

    def seaweed(p, n, u, v):
        k = 0.92 + 0.12 * noise.noise(Vector((p.x * 0.2, p.y * 0.2, p.z * 0.9)))
        return rgb(nori) * k
    surf(f.body, revolve(prof), soft(seaweed, under=0.3, z0=z0, z1=z1, top=0.0), nu=56, nv=28, caps=(True, False))
    # the top: a rim of seaweed, then the rice, the salmon, the cucumber, each a little domed
    rice = mottle('#f6f2e8', 0.05, 0.6, 2.0)
    lathe(f.body, [(R - 0.2, z1 - 0.5), (R - 1.0, z1 + 0.2), (R - 1.6, z1 + 0.3)], nori, seg=56, cap_top=False)
    lathe(f.body, [(R - 1.6, z1 + 0.2), (R - 2.2, z1 + 1.4), (13.5, z1 + 2.2), (10.0, z1 + 2.0)], rice, seg=56, cap_top=False)
    salmon = mottle('#f0846a', 0.0, 0.5, 4.0, c2='#f6a68a')
    lathe(f.body, [(10.2, z1 + 1.9), (9.6, z1 + 2.8), (6.0, z1 + 3.4), (3.4, z1 + 3.3)], salmon, seg=40, cap_top=False)
    lathe(f.body, [(3.5, z1 + 3.2), (3.2, z1 + 3.9), (1.5, z1 + 4.2), (0.0, z1 + 4.2)], mottle('#7ec850', 0.08, 1.0), seg=24, cap_top=False)
    rng = random.Random(3)
    for k in range(70):
        a, r = rng.uniform(0, math.tau), rng.uniform(10.8, R - 2.6)
        ball(f.body, (math.cos(a) * r, math.sin(a) * r, z1 + 2.0 + 0.25 * (R - r) / 8), (0.9, 0.55, 0.45), '#fbf8f0', sub=1)
    tree = f.bvh()
    face(f, 9.5, 22.5, 'white', body_col=nori, w=3.0, h=3.3, look=1, mouth='none', blush_dx=15.5, blush_dz=-3.6, tree=tree)
    put(f, 0, 17.5, lambda mb: (ball(mb, (0, 0, 0), (2.2, 0.5, 1.1), '#f6f2ea', sub=2)), embed=0.2, tree=tree)
    feet(f, x=10)
    hat_anchor(f, z1 + 3.5, 40)
    return f


def wonton():
    f = Folk('wonton')
    dough = '#f6e6c0'

    def prof(v):
        # a wide soft bottom, then a dome drawn up into the pinch at the top
        if v < 0.45:
            a = v / 0.45 * math.pi / 2
            return 23.5 * math.sin(a) ** 0.7, 14 * (1 - math.cos(a))
        t = (v - 0.45) / 0.55
        return 23.5 * max(0.0, math.cos(t * math.pi / 2)) ** 0.75, 14 + 29 * math.sin(t * math.pi / 2)

    def pleat(u, v):
        t = max(0.0, (v - 0.45) / 0.55)
        return 1 + 0.07 * t ** 0.8 * math.cos(u * math.tau * 9)

    def col(p, n, u, v):
        t = max(0.0, (v - 0.45) / 0.55)
        c = rgb(dough).lerp(rgb('#ecd29c'), 0.4 * t * (0.5 - 0.5 * math.cos(u * math.tau * 9)))
        return c * (0.96 + 0.06 * noise.noise(p * 0.3))
    surf(f.body, revolve(prof, sy=0.86, mod=pleat), soft(col, under=0.22, z0=0, z1=30), nu=72, nv=32)
    ball(f.body, (0, 0, 43.2), (2.2, 2.0, 1.6), shade('#ecd29c'), sub=2)
    face(f, 9.5, 19.0, 'dark', body_col=dough, w=2.4, h=2.9, mouth='open', mz=13.0, mw=4.0, blush_dz=-3.2)
    hat_anchor(f, 40, 24)
    return f


def chili():
    f = Folk('chili')
    red = '#d8322a'

    def prof(v):
        # a broad round shoulder narrowing to the tip
        if v < 0.5:
            t = v / 0.5
            return 17.5 * math.sin(t * math.pi / 2) ** 1.4, 3 + 26 * t
        t = (v - 0.5) / 0.5
        return 17.5 * math.cos(t * math.pi / 2) ** 0.55, 29 + 29 * math.sin(t * math.pi / 2)

    def bend(u, v):
        return 1.0

    def col(p, n, u, v):
        c = rgb(red).lerp(rgb('#b8221e'), max(0.0, min(1.0, (22 - p.z) / 20)) * 0.6)
        return c * (0.96 + 0.06 * noise.noise(p * 0.25))
    P0 = revolve(prof, sy=0.8)

    def P(u, v):
        p = P0(u, v)
        # the tip curls round to the right as it comes down
        t = max(0.0, (24 - p.z) / 21)
        return Vector((p.x + 9 * t ** 2, p.y, p.z))
    surf(f.body, P, soft(col, under=0.15, z0=3, z1=40), nu=48, nv=32)
    # the calyx: green leaves fanned over the top, each laid along the shoulder (draped onto the body from above)
    green = mottle('#3a9a3a', 0.08, 0.5)
    top = f.bvh()
    for k in range(7):
        a = k / 7 * math.tau + 0.65       # (two leaves either side of the front, none down the face)
        m = len(f.body.v)
        ball(f.body, (6.5, 0, 0), (7.5, 3.6, 1.0), soft(green, under=0.0, top=0.12), sub=2)
        lz = [v.z for v in f.body.v[m:]]
        xform(f.body, m, Matrix.Translation((0, 0, 0)) @ Euler((0, 0, a)).to_matrix().to_4x4())
        for i, z in zip(range(m, len(f.body.v)), lz):
            q = f.body.v[i]
            hit = top.ray_cast(Vector((q.x, q.y, 200)), Vector((0, 0, -1)))[0]
            f.body.v[i] = Vector((q.x, q.y, (hit.z if hit else 50) + 1.1 + z))
    ball(f.body, (0, 0, 58.0), (5.0, 4.2, 2.2), green, sub=2)
    tube(f.body, [(0, 0, 56), (0.4, 0, 61), (1.6, 0.4, 65), (3.6, 0.8, 67)], 1.6, mottle('#4aa846', 0.06, 0.5), seg=8, r1=1.2)
    tree = f.bvh()
    face(f, 8.0, 33.5, 'dark', body_col=red, w=2.3, h=2.9, mouth='open', mz=28.5, mw=4.0, blush_dz=-3.4, tree=tree)
    for s in (-1, 1):
        put(f, s * 9.0, 39.0, lambda mb, s=s: brow(mb, 7.5, 1.6 * -s, 0.95), embed=0.2, tree=tree, tilt=0)
    feet(f, x=8.5)
    hat_anchor(f, 58, 28)
    return f


def clementine():
    f = Folk('clementine')
    peel = '#f0861e'

    def col(p, n, u, v):
        # dimpled peel: tiny pores, a little lighter on top
        k = 0.93 + 0.08 * noise.noise(p * 1.4)
        return rgb(peel).lerp(rgb('#f8a040'), 0.35 * max(0.0, n.z)) * k
    surf(f.body, superq(0, 0, 25, 23.0, 21.0, 21.5, 1.0, 1.0), soft(col, under=0.18, z0=4, z1=46), nu=56, nv=30)
    ball(f.body, (0, 0, 46.2), (2.6, 2.4, 1.4), shade('#7a8a2a'), sub=2)
    tube(f.body, [(0, 0, 46.5), (0.2, 0, 50), (0.4, 0.2, 52)], 0.9, shade('#5a7a2a'), seg=6)
    for s in (-1, 1):
        m = len(f.body.v)
        ball(f.body, (4.0, 0, 0), (4.5, 2.0, 0.8), soft(mottle('#4a9a3a', 0.06, 0.6), under=0.0, top=0.15), sub=2)
        xform(f.body, m, Matrix.Translation((0.3, 0.1, 51.6)) @ Euler((0, -0.45, 0 if s > 0 else math.pi)).to_matrix().to_4x4())
    tree = f.bvh()
    # big dark sunglasses: two lenses on a bar, a glint on each
    def lens(mb):
        rbox(mb, -5.6, -1.0, -3.4, 5.6, 0.8, 3.4, '#1a1a24', r=1.8, mid=1)
        ball(mb, (-1.8, -1.05, 1.3), (1.8, 0.15, 0.55), '#6a6a8a', sub=1)
        ball(mb, (0.4, -1.05, 0.2), (1.0, 0.15, 0.4), '#50506a', sub=1)
    for s in (-1, 1):
        put(f, s * 10.5, 28.0, lens, embed=0.3, tree=tree)
    put(f, 0, 29.5, lambda mb: rbox(mb, -3.2, -0.8, -0.7, 3.2, 0.5, 0.7, '#1a1a24', r=0.5, mid=0), embed=0.3, tree=tree)
    for s in (-1, 1):
        put(f, s * 19.5, 29.0, lambda mb: rbox(mb, -2.5, -0.6, -0.7, 2.5, 0.6, 0.7, '#1a1a24', r=0.4, mid=0), embed=0.4, tree=tree)
        put(f, s * 16.5, 21.0, lambda mb: blush(mb, peel, 3.4, 1.8), embed=0.25, tree=tree)
    put(f, 0, 19.0, lambda mb: arc(mb, 4.2, 1.0, 0.48, '#7a3a1a'), embed=0.15, tree=tree)
    f.anchor('eyes', f.hit(0, 28, tree=tree)[0], 1.0)
    feet(f, x=9)
    hat_anchor(f, 47, 32)
    return f


def fortune():
    f = Folk('fortune')
    cookie = '#e8b45a'

    def col(p, n, u, v):
        k = 0.94 + 0.08 * noise.noise(p * 0.35)
        c = rgb(cookie).lerp(rgb('#f2c878'), 0.5 * max(0.0, n.z))
        # the fold: darker along the V creased into the top and front
        fold = abs(p.x) * 0.75 - (p.z - 24) * 0.9
        c = c * (1 - 0.18 * math.exp(-(fold ** 2) / 8) * (1 if p.y < -8 and p.z > 23 else 0))
        return c * k
    P0 = superq(0, 0, 21, 23.0, 16.0, 17.0, 0.72, 0.72)

    def P(u, v):
        p = P0(u, v)
        # the two halves folded up: a soft dip along the middle of the top, the crease pressed into the front in a V
        top = max(0.0, (p.z - 21) / 17)
        z = p.z - 2.0 * math.exp(-(p.x ** 2) / 50) * top ** 2
        fold = abs(p.x) * 0.75 - (z - 24) * 0.9
        y = p.y + (1.1 * math.exp(-(fold ** 2) / 6) * min(1.0, max(0.0, (z - 23) / 3)) if p.y < -6 else 0)
        return Vector((p.x, y, z))
    surf(f.body, P, soft(col, under=0.18, z0=4, z1=38), nu=72, nv=40)
    # the paper slip peeking out on the right
    m = len(f.body.v)
    rbox(f.body, -0.3, -2.5, -4.2, 0.3, 2.5, 4.2, '#fbf8f0', r=0.25, mid=0)
    ball(f.body, (-0.45, -0.8, 1.0), (0.1, 1.0, 0.4), '#d84a3a', sub=1)
    ball(f.body, (-0.45, 0.6, -0.8), (0.1, 1.2, 0.35), '#d84a3a', sub=1)
    xform(f.body, m, Matrix.Translation((22.0, -9.0, 13.0)) @ Euler((0.1, -0.3, 0.35)).to_matrix().to_4x4())
    face(f, 9.5, 20.5, 'dark', body_col=cookie, w=2.4, h=3.0, mouth='smile', mz=15.5, mw=4.4, blush_dz=-3.2)
    feet(f, x=10)
    hat_anchor(f, 38, 30)
    return f


def layered(layers, mot=0.04, seed=0.0):
    """A color by height: layers [(z_top, color), ...] from the bottom up, each blending softly into the next."""
    cols = [(z, rgb(c)) for z, c in layers]

    def f(p, n, u=0, v=0):
        c = cols[-1][1]
        for k, (z, cc) in enumerate(cols):
            if p.z <= z:
                c = cc
                if k > 0:
                    t = max(0.0, min(1.0, (p.z - cols[k - 1][0]) / 0.8))
                    c = cols[k - 1][1].lerp(cc, t)
                break
        return c * (1 - mot + 2 * mot * (0.5 + 0.5 * noise.noise(p * 0.5 + Vector((seed, 0, 0)))))
    return f


def drip(mb, x, y, z, length, r, col):
    """Sauce or glaze running down a front face: a tube that fattens into a drop."""
    tube(mb, [(x, y, z), (x, y - 0.1, z - length * 0.5), (x, y - 0.2, z - length)], r, col, seg=8, r1=r * 1.15)
    ball(mb, (x, y - 0.25, z - length), r * 1.3, col, sub=2)


def lashes(f, x, z, s, tree, col=DARK):
    """Two little lashes at an eye's outer top corner (s: which eye)."""
    put(f, x + s * 2.6, z + 2.6, lambda mb: tube(mb, [(0, -0.3, 0), (s * 1.2, -0.5, 0.9), (s * 2.0, -0.4, 1.3)], 0.42, col, seg=5), embed=0.1, tree=tree)


def kai():
    f = Folk('kai')
    blue = '#4e82cc'

    def bowl(v):
        if v < 0.12:
            a = v / 0.12
            return 15.5 * math.sin(a * math.pi / 2), 4.0 + 1.5 * (1 - math.cos(a * math.pi / 2))
        t = (v - 0.12) / 0.88
        return 15.5 + 7.5 * math.sin(t * math.pi / 2) ** 0.8, 5.5 + 24.5 * t
    surf(f.body, revolve(bowl), soft(mottle(blue, 0.03, 0.4), under=0.25, z0=4, z1=30), nu=56, nv=24, caps=(True, False))
    lathe(f.body, [(23.0, 29.8), (23.4, 30.6), (23.2, 31.8), (22.4, 32.4), (21.4, 32.2)], '#f6f2ea', seg=56, cap_top=False)
    lathe(f.body, [(21.4, 32.2), (20.6, 31.4)], '#e8e2d6', seg=56, cap_top=True)
    # the pile: rice and a heap of toppings, tuna and salmon cubes, avocado slices, mango, seaweed salad round the rim
    surf(f.body, superq(0, 0, 32.0, 19.5, 18.5, 7.5, 1.0, 1.0), mottle('#f6f2e8', 0.05, 0.8), nu=40, nv=16, caps=(False, True))
    rng = random.Random(5)

    def cube(c, x, y, z, s, a, c2=None):
        m = len(f.body.v)
        rbox(f.body, -s, -s, -s, s, s, s, mottle(c, 0.06, 0.6, rng.random() * 9, c2), r=s * 0.35, mid=0)
        xform(f.body, m, Matrix.Translation((x, y, z)) @ Euler((rng.uniform(-0.4, 0.4), rng.uniform(-0.4, 0.4), a)).to_matrix().to_4x4())
    for k in range(9):
        cube('#c8243a', -12 + rng.uniform(-4, 4), rng.uniform(-10, 6), 39 + rng.uniform(0, 4), 3.2, rng.uniform(0, 3), '#e04858')
    for k in range(7):
        cube('#f28a68', 0 + rng.uniform(-3, 3), rng.uniform(-10, 6), 40 + rng.uniform(0, 4), 3.1, rng.uniform(0, 3), '#f8b498')
    for k in range(6):
        m = len(f.body.v)
        ball(f.body, (0, 0, 0), (4.6, 1.5, 2.4), lambda p, n: rgb('#a8d460').lerp(rgb('#5a9a34'), max(0.0, min(1.0, -p.z / 2.4 + 0.3))), sub=2)
        xform(f.body, m, Matrix.Translation((11 + rng.uniform(-3, 4), rng.uniform(-9, 6), 39 + rng.uniform(0, 3))) @ Euler((0.3, rng.uniform(-0.3, 0.3), rng.uniform(0, 3))).to_matrix().to_4x4())
    for k in range(4):
        cube('#f8c430', rng.uniform(-6, 14), rng.uniform(-12, -6), 38.5 + rng.uniform(0, 2), 2.0, rng.uniform(0, 3))
    for k in range(26):
        a = k / 26 * math.tau
        tube(f.body, [(math.cos(a) * 19, math.sin(a) * 18, 34.5), (math.cos(a + 0.12) * 17, math.sin(a + 0.12) * 16, 37.5), (math.cos(a + 0.2) * 14, math.sin(a + 0.2) * 13.5, 36.8)], 0.9, '#2e7a3a', seg=5)
    tree = f.bvh()
    # white dots round the bowl
    for k in range(-3, 4):
        put(f, k * 6.2, 11.5, lambda mb: rbox(mb, -1.4, -0.4, -1.0, 1.4, 0.3, 1.0, '#d8e6f8', r=0.5, mid=0), embed=0.15, tree=tree)
    face(f, 13.0, 21.5, 'white', body_col=blue, w=2.6, h=3.0, look=1, mouth='smile', mz=17.5, mw=4.2, blush_dz=-3.4, blush_dx=17.5, tree=tree)
    feet(f, x=9)
    hat_anchor(f, 45, 34)
    return f


def basil():
    f = Folk('basil')
    gold = '#e8be74'

    def col(p, n, u, v):
        k = 0.5 + 0.5 * math.cos(u * math.tau * 34 + noise.noise(p * 0.2) * 2)
        return rgb(gold).lerp(rgb('#c8964a'), 0.45 * k ** 3) * (0.95 + 0.06 * noise.noise(p * 0.6))
    surf(f.body, superq(0, 0, 24.5, 22.5, 19.0, 20.5, 1.0, 0.9, mod=lambda u, v: 1 + 0.012 * math.cos(u * math.tau * 34)), soft(col, under=0.2, z0=4, z1=45), nu=96, nv=30)
    rng = random.Random(8)
    for k in range(26):
        a, r = rng.uniform(0, math.tau), math.sqrt(rng.random()) * 13
        ball(f.body, (math.cos(a) * r, math.sin(a) * r * 0.8, 44.5 - r * r / 40), (1.0, 0.9, 0.7), shade('#b8844a' if k % 3 else '#d8a868'), sub=1)
    # the Thai basil sprig: leaves fanned up on the left
    for k, (a, tlt, s) in enumerate(((-0.5, 0.55, 1.0), (0.1, 0.2, 1.1), (0.7, 0.6, 0.9), (2.4, 0.5, 0.85))):
        m = len(f.body.v)
        ball(f.body, (0, 0, 4.5 * s), (2.6 * s, 0.9, 5.0 * s), soft(lambda p, n, u=0, v=0: rgb('#3a9a40').lerp(rgb('#6ac05a'), max(0.0, min(1.0, p.z / 9))), under=0.0), sub=2)
        xform(f.body, m, Matrix.Translation((-7, 2, 43)) @ Euler((tlt * math.cos(a), tlt * math.sin(a) * 0.6 - 0.2, a)).to_matrix().to_4x4())
    # the lime wedge on the right: a half disc, green rind, pale flesh
    m = len(f.body.v)
    lathe(f.body, [(0.0, -2.2), (5.0, -2.2), (5.6, -1.4), (5.6, 1.4), (5.0, 2.2), (0.0, 2.2)], lambda p, n: rgb('#5aa83a') if math.hypot(p.x, p.y) > 4.6 else rgb('#d8ec98'), seg=28, cap_top=True, cap_bot=True)
    xform(f.body, m, Matrix.Translation((9, 3, 45)) @ Euler((math.pi / 2, 0.4, 0.3)).to_matrix().to_4x4())
    face(f, 12.0, 22.0, 'dark', body_col=gold, w=2.5, h=3.0, mouth='open', mz=16.5, mw=4.0, blush_dz=-3.4)
    feet(f, x=9)
    hat_anchor(f, 44, 30)
    return f


def coco():
    f = Folk('coco')
    choc = '#5e3826'

    def col(p, n, u, v):
        d = noise.noise(p * 1.3)
        c = rgb(choc).lerp(rgb('#8a5a3e'), 0.5 * max(0.0, d - 0.25) * 2 + 0.25 * max(0.0, n.z))
        return c * (0.94 + 0.06 * noise.noise(p * 0.4))
    surf(f.body, superq(0, 0, 23.5, 23.0, 19.5, 19.5, 1.0, 0.9, mod=lambda u, v: 1 + 0.025 * noise.noise(Vector((math.cos(u * math.tau) * 3, math.sin(u * math.tau) * 3, v * 5)))), soft(col, under=0.2, z0=4, z1=43), nu=56, nv=30)
    # the pink bow on top: two loops, two tails, a knot
    pink = soft(mottle('#f08ab8', 0.05, 0.6), under=0.0, top=0.12)
    for s in (-1, 1):
        m = len(f.body.v)
        ball(f.body, (s * 5.5, 0, 0), (5.5, 2.4, 3.6), pink, sub=3)
        xform(f.body, m, Matrix.Translation((0, 0, 45.5)) @ Euler((0, s * 0.35, 0)).to_matrix().to_4x4())
        tube(f.body, [(s * 1.0, -1.5, 44.5), (s * 3.0, -3.5, 42.0), (s * 4.2, -4.6, 40.0)], 1.2, pink, seg=6, r1=1.5)
    ball(f.body, (0, -0.3, 45.6), (2.2, 2.2, 2.2), shade('#e06aa0'), sub=2)
    tree = f.bvh()
    face(f, 10.5, 22.5, 'white', body_col=choc, w=2.8, h=2.9, look=1, mouth='none', blush_dz=-3.6, tree=tree)
    for s in (-1, 1):
        lashes(f, s * 10.5, 22.5, s, tree)
    put(f, 0, 17.0, lambda mb: arc(mb, 3.6, 0.9, 0.55, '#f2a2b8'), embed=0.2, tree=tree)
    feet(f, x=9)
    hat_anchor(f, 44, 34)
    return f


def cece():
    f = Folk('cece')
    cream = '#faf0da'
    rbox(f.body, -20.5, -11, 4, 20.5, 11, 46, layered([(10.5, '#c8925a'), (11.5, '#e8c890'), (42.0, cream), (46.5, '#fdf6e8')], 0.03), r=2.6, mid=3)
    rng = random.Random(4)
    for k in range(24):
        ball(f.body, (rng.uniform(-19, 19), -11.2 + rng.uniform(-0.2, 0.3), rng.uniform(5, 10)), (0.7, 0.4, 0.6), shade('#a8743e'), sub=1)
    # the strawberry on top, seeds and a leafy cap
    def berry(p, n, u=0, v=0):
        k = noise.noise(p * 2.5)
        return rgb('#d8303c').lerp(rgb('#f8e088'), 0.9 if k > 0.55 else 0.0) * (1.0 + 0.1 * max(0.0, n.z))
    surf(f.body, revolve(lambda v: (6.2 * math.sin(v * math.pi) ** 0.8 * (1 - 0.35 * (1 - v)), 46.5 + 11.5 * v)), berry, nu=32, nv=16)
    for k in range(6):
        a = k / 6 * math.tau
        m = len(f.body.v)
        ball(f.body, (2.6, 0, 0), (3.0, 1.4, 0.6), shade('#3a9a3a'), sub=2)
        xform(f.body, m, Matrix.Translation((0, 0, 57.6)) @ Euler((0, 0.35, a)).to_matrix().to_4x4())
    tree = f.bvh()
    # sauce running down from the top edge
    for x, l in ((-8.5, 7.0), (7.5, 5.0)):
        drip(f.body, x, -11.3, 45.5, l, 1.1, '#c8202e')
    # the sauce glazed over the top, running to the front edge
    m = len(f.body.v)
    rbox(f.body, -17.0, -11.4, 45.6, 17.0, 5.0, 46.9, mottle('#c8202e', 0.05, 0.5, c2='#e04050'), r=0.6, mid=1)
    # the nervous sweat drop on the right
    ball(f.body, (21.8, -6, 31), (1.2, 1.0, 1.6), '#8ec8f4', sub=2)
    tube(f.body, [(21.8, -6, 32.4), (21.9, -6, 33.6)], 0.6, '#8ec8f4', seg=6, r1=0.15)
    face(f, 10.5, 22.0, 'white', body_col=cream, w=2.7, h=2.9, look=0, mouth='smile', mz=17.0, mw=3.4, blush_dz=-3.4, tree=tree)
    for s in (-1, 1):
        lashes(f, s * 10.5, 22.0, s, tree)
        put(f, s * 10.5, 27.5, lambda mb, s=s: brow(mb, 5.0, -1.4 * s, 0.5, '#8a5a3a'), embed=0.1, tree=tree)
    feet(f, x=10)
    hat_anchor(f, 47, 40)
    return f


def cuke():
    f = Folk('cuke')
    green = '#3e8e3a'

    def prof(v):
        a = v * math.pi
        return 14.0 * math.sin(a) ** 0.32, 8.0 + 26 * (1 - math.cos(a))

    def col(p, n, u, v):
        stripe = 0.5 + 0.5 * math.cos(u * math.tau * 9)
        c = rgb(green).lerp(rgb('#6ab85a'), 0.35 * stripe ** 4 + 0.3 * max(0.0, n.z))
        bump = noise.noise(p * 0.9)
        return c * (0.9 if bump > 0.55 else 1.0) * (0.96 + 0.05 * noise.noise(p * 0.3))
    surf(f.body, revolve(prof, sy=0.92), soft(col, under=0.2, z0=8, z1=60), nu=56, nv=32)
    # the sweatband
    band = mottle('#d83a4a', 0.04, 0.8)
    lathe(f.body, [(14.0, 48.0), (14.8, 48.6), (15.0, 51.0), (14.8, 53.4), (13.9, 54.0)], band, seg=56, cap_top=False, sy=0.92)
    tree = f.bvh()
    face(f, 7.0, 40.0, 'dark', body_col=green, w=2.4, h=2.9, mouth='none', blush_col=None, tree=tree)
    def grin(mb):
        m = len(mb.v)
        ball(mb, (0, 0, 0), (4.6, 0.6, 2.6), lambda p, n: rgb('#4a1e22') if p.z > -1.4 else rgb('#e86a78'), sub=3)
        for i in range(m, len(mb.v)):
            q = mb.v[i]
            if q.z > 0:
                mb.v[i] = Vector((q.x, q.y, q.z * 0.15))
    put(f, 0, 33.5, grin, embed=0.3, tree=tree)
    # white sneakers, a red stripe, big and bouncy
    for s, key in ((-1, 'foot_l'), (1, 'foot_r')):
        o = Vector((s * 10.0, -1.0, 6.0))
        mb = f.part(key, o)
        rbox(mb, o.x - 4.6, o.y - 6.5, 0.0, o.x + 4.6, o.y + 3.0, 4.6, lambda p, n: rgb('#f8f6f2') if p.z > 1.3 else rgb('#d8d4cc'), r=2.0, mid=1)
        rbox(mb, o.x - 4.7, o.y - 4.0, 1.6, o.x + 4.7, o.y + 1.0, 2.6, '#d8384a', r=0.5, mid=0)
        tube(mb, [(o.x, o.y - 1.0, 4.4), (o.x, o.y + 0.5, 6.4)], 2.4, '#f8f6f2', seg=8)
    hat_anchor(f, 60, 26)
    return f


def sully():
    f = Folk('sully')
    sponge = '#f2c46a'
    rbox(f.body, -22.5, -12, 4, 22.5, 12, 39, layered([(17.0, sponge), (22.5, '#fbe8b0'), (34.0, sponge), (40, '#5a301e')], 0.04, 2), r=2.4, mid=3)
    tree = f.bvh()
    for x, l in ((-17, 6), (-9, 9), (-1, 5), (7, 8), (15, 6)):
        drip(f.body, x, -12.2, 35.5, l, 1.4, '#5a301e')
    # the tweed flat cap, tipped a little, its brim to the front
    tweed = soft(lambda p, n, u=0, v=0: rgb('#8e877c') * (0.86 + 0.18 * (0.5 + 0.5 * math.sin(p.x * 2.4) * math.sin(p.y * 2.4))), under=0.0, top=0.08)
    m = len(f.body.v)
    surf(f.body, superq(0, 1.5, 0, 17.5, 15.0, 6.0, 1.0, 1.0), tweed, nu=48, nv=18, caps=(False, True))
    lathe(f.body, [(17.5, 0.0), (17.0, -0.6), (0.0, -0.6)], tweed, seg=48, cap_top=False, sy=15 / 17.5)
    ball(f.body, (0, -15.5, 0.2), (13.0, 6.5, 1.0), tweed, sub=3)
    ball(f.body, (0, 1.5, 5.8), (1.4, 1.4, 0.8), shade('#7a7468'), sub=1)
    xform(f.body, m, Matrix.Translation((-2.0, 0.5, 40.5)) @ Euler((0.08, -0.1, 0)).to_matrix().to_4x4())
    face(f, 11.5, 24.0, 'dark', body_col=sponge, w=2.5, h=3.0, mouth='smile', mz=19.0, mw=4.8, blush_dz=-3.0, tree=tree)
    for s in (-1, 1):
        put(f, s * 12.0, 29.5, lambda mb, s=s: brow(mb, 7.0, 0.9 * s, 1.1, '#4a2818'), embed=0.2, tree=tree)
    feet(f, x=11)
    hat_anchor(f, 47, 34)
    return f


def ginger():
    f = Folk('ginger')
    dough = '#c27a3c'

    def col(p, n, u=0, v=0):
        # baked darker round the edge (the sides), paler on the faces
        edge = 1 - abs(n.y)
        return rgb(dough).lerp(rgb('#9a5626'), 0.55 * edge ** 2) * (0.95 + 0.07 * noise.noise(p * 0.5))
    T = 5.0     # half the cookie's thickness
    surf(f.body, superq(0, 0, 37.0, 10.5, T, 10.0, 1.0, 1.0), col, nu=40, nv=22)
    rbox(f.body, -9.0, -T, 13.0, 9.0, T, 30.5, col, r=4.0, mid=2)
    icing = '#fbf8f2'
    for z, c in ((25.0, '#d83040'), (19.0, '#4ab04a')):
        ball(f.body, (0, -T - 0.3, z), (1.8, 0.9, 1.8), shade(c), sub=2)
    for s, key in ((-1, 'arm_l'), (1, 'arm_r')):
        o = Vector((s * 8.0, 0, 27.0))
        mb = f.part(key, o)
        tube(mb, [o, o + Vector((s * 7, 0, 0.5)), o + Vector((s * 14, 0, 1.0))], 4.0, col, seg=16, r1=3.6)
        ball(mb, o + Vector((s * 14, 0, 1.0)), (3.6, T * 0.9, 3.6), col, sub=2)
        tube(mb, [o + Vector((s * (10.5 + 0.7 * (k % 2)), -T * 0.9, 1.0 + (k - 2) * 1.2)) for k in range(5)], 0.45, icing, seg=5)
    for s, key in ((-1, 'leg_l'), (1, 'leg_r')):
        o = Vector((s * 4.8, 0, 15.0))
        mb = f.part(key, o)
        tube(mb, [o, o + Vector((s * 1.6, 0, -7)), o + Vector((s * 2.6, 0, -11.5))], 4.2, col, seg=16, r1=3.9)
        ball(mb, o + Vector((s * 2.6, 0, -11.5)), (4.0, T * 0.9, 3.4), col, sub=2)
        tube(mb, [o + Vector((s * 2.2 + (k - 2) * 1.3, -T * 0.92, -9.8 + 0.7 * (k % 2))) for k in range(5)], 0.45, icing, seg=5)
    # the yellow hard hat: a dome, a ridge over it, a brim all round
    hat = soft(mottle('#f2b62a', 0.04, 0.5), under=0.0, top=0.1)
    surf(f.body, superq(0, 0, 44.5, 10.5, 9.5, 8.5, 1.0, 1.0), hat, nu=40, nv=16, caps=(False, True))
    lathe(f.body, [(15.0, 43.8), (15.2, 44.6), (10.5, 45.2), (0.0, 45.2)], hat, seg=40, cap_top=False, sy=0.9)
    lathe(f.body, [(15.0, 43.8), (0.0, 43.8)], hat, seg=40, cap_top=False, sy=0.9)
    tube(f.body, [(0, -9.8, 46.0), (0, -6.0, 51.0), (0, 0, 53.2), (0, 6.0, 51.0), (0, 9.8, 46.0)], 1.2, shade('#e0a020'), seg=8)
    tree = f.bvh()
    face(f, 4.8, 39.0, 'dark', body_col=dough, w=1.9, h=2.4, mouth='none', blush_dx=7.6, blush_dz=-2.8, tree=tree)
    put(f, 0, 34.0, lambda mb: arc(mb, 7.0, 1.6, 0.55, icing), embed=0.2, tree=tree)
    hat_anchor(f, 53, 30)
    return f


def brulee():
    f = Folk('brulee')
    custard = '#fbe8b8'
    # the fluted ramekin
    lathe(f.body, [(19.5, 4.0), (21.0, 4.6), (21.8, 6.0), (22.0, 18.0), (22.4, 18.6), (22.0, 19.2)], lambda p, n: rgb('#f4f0ea') * (0.9 + 0.12 * (0.5 + 0.5 * math.cos(math.atan2(p.y, p.x) * 22))) * (0.92 if p.z < 7 else 1.0), seg=88, cap_top=False, cap_bot=True)
    lathe(f.body, [(21.0, 18.6), (21.0, 36.5), (20.6, 37.4), (19.0, 37.8)], soft(custard, under=0.0, z0=18, z1=37), seg=56, cap_top=False)
    # the torched sugar top: glassy amber, darker where the flame caught it
    def sugar(p, n, u=0, v=0):
        k = noise.noise(p * 0.45)
        return rgb('#d8943e').lerp(rgb('#8a4a1a'), max(0.0, k) * 0.9)
    lathe(f.part('gloss'), [(19.2, 37.6), (19.0, 38.6), (14.0, 39.2), (0.0, 39.3)], sugar, seg=56, cap_top=False)
    # the beret, tipped to one side, its little stalk
    m = len(f.body.v)
    surf(f.body, superq(0, 0, 0, 15.5, 14.0, 5.0, 1.0, 1.0), soft(mottle('#8e2c48', 0.05, 0.4), under=0.0, top=0.12), nu=48, nv=18)
    tube(f.body, [(0, 0, 4.6), (0.4, 0, 6.6), (1.0, 0, 7.6)], 0.8, shade('#7a2440'), seg=6)
    xform(f.body, m, Matrix.Translation((2.0, 1.0, 43.0)) @ Euler((0, 0.18, 0)).to_matrix().to_4x4())
    tree = f.bvh()
    face(f, 11.5, 25.0, 'dark', body_col=custard, w=2.5, h=3.0, mouth='smile', mz=20.0, mw=4.0, blush_dz=-3.0, tree=tree)
    feet(f, x=11)
    hat_anchor(f, 50, 30)
    return f


def mac():
    f = Folk('mac')
    cheese = '#f6c838'
    lathe(f.body, [(17.0, 4.0), (19.5, 4.6), (21.5, 8.0), (23.0, 15.0), (23.6, 19.0), (23.0, 19.8), (21.5, 19.8)], soft(mottle('#3e6eb8', 0.03, 0.4), under=0.25, z0=4, z1=20), seg=56, cap_top=False, cap_bot=True)
    lathe(f.body, [(22.2, 19.4), (23.0, 22.0), (23.0, 34.0), (22.0, 37.0), (17.0, 38.6), (0.0, 39.0)], soft(mottle(cheese, 0.05, 0.6), under=0.0, z0=19, z1=39), seg=56, cap_top=False)
    tree = f.bvh()
    # macaroni elbows pressed into the cheese all round
    rng = random.Random(12)
    for k in range(90):
        a = rng.uniform(0, math.tau)
        z = rng.uniform(21, 37.5)
        r = 23.2 if z < 34 else 23.2 - (z - 34) * 1.3
        c = Vector((math.cos(a) * r, math.sin(a) * r, z))
        if c.y < -8 and abs(c.x) < 20 and 15 < z < 32:
            continue    # (not over the face)
        t = Vector((-math.sin(a), math.cos(a), 0)) * 1.6
        tube(f.body, [c - t + Vector((0, 0, -0.8)), c, c + t + Vector((0, 0, -0.8))], 0.9, shade('#f8d860' if k % 2 else '#eab830'), seg=6)
    # the chef's toque: a band and a puffed top
    lathe(f.body, [(11.0, 38.5), (11.2, 43.5), (10.8, 44.0)], soft('#fbfbf6', under=0.0), seg=40, cap_top=True)
    for (x, y, z, r) in ((0, 0, 48.5, 9.0), (-6.5, 1, 47.0, 6.5), (6.5, 1, 47.0, 6.5), (-3.5, -4.5, 48.5, 6.0), (3.5, -4.5, 48.5, 6.0), (0, 5, 49.5, 6.5)):
        ball(f.body, (x, y, z), (r, r, r * 0.82), soft(mottle('#fbfbf6', 0.02, 0.5), under=0.0, top=0.05), sub=3)
    face(f, 11.5, 25.0, 'dark', body_col=cheese, w=2.5, h=3.0, mouth='smile', mz=20.0, mw=4.2, blush_dz=-3.0, tree=tree)
    feet(f, x=9)
    hat_anchor(f, 57, 24)
    return f


def goat():
    f = Folk('goat')
    coat = '#f2f0ea'

    def shag(p, n, u=0, v=0):
        return rgb(coat) * (0.9 + 0.12 * (0.5 + 0.5 * noise.noise(p * 0.9))) * (1 - 0.08 * max(0.0, -n.z))
    # the body along y (the head to the front, -y)
    surf(f.body, superq(0, 2.0, 19.0, 8.0, 14.0, 7.5, 1.0, 1.0), soft(shag, under=0.12, z0=10, z1=27), nu=40, nv=22)
    surf(f.body, superq(0, -13.5, 25.0, 3.6, 4.0, 5.5, 1.0, 1.0), shag, nu=24, nv=14)
    # the head, a long nose with a pink tip, ears, horns, the beard
    surf(f.body, superq(0, -17.5, 30.5, 5.0, 6.5, 5.2, 1.0, 1.0, mod=lambda u, v: 1.0), shag, nu=32, nv=18)
    ball(f.body, (0, -23.0, 28.6), (3.4, 3.4, 3.0), shag, sub=3)
    ball(f.body, (0, -26.0, 29.2), (1.8, 0.8, 1.2), shade('#f0a0a8'), sub=2)
    for s in (-1, 1):
        m = len(f.body.v)
        ball(f.body, (0, 0, 0), (4.0, 1.4, 1.8), lambda p, n: rgb('#f6c8c8') if n.y < -0.5 else rgb(coat), sub=2)
        xform(f.body, m, Matrix.Translation((s * 6.2, -16.0, 32.5)) @ Euler((0, s * -0.4, s * 0.3)).to_matrix().to_4x4())
        tube(f.body, [(s * 2.2, -16.5, 34.6), (s * 2.8, -15.0, 38.5), (s * 3.2, -12.0, 41.0), (s * 3.4, -9.8, 40.6)], 1.3, mottle('#b89a6a', 0.08, 1.0), seg=8, r1=0.5)
    tube(f.body, [(0, -21.5, 24.8), (0, -21.8, 22.5), (0, -21.2, 20.6)], 1.4, shag, seg=8, r1=0.4)
    tube(f.body, [(0, 15.0, 22.0), (0, 16.8, 25.0), (0, 16.5, 27.0)], 1.8, shag, seg=8, r1=0.6)
    for s, key in ((-1, 'eye_l'), (1, 'eye_r')):
        p = Vector((s * 4.6, -19.5, 31.6))
        mb = f.part(key, p)
        m = len(mb.v)
        eye_dark(mb, 1.3, 1.6, gl=-1)
        xform(mb, m, Matrix.Translation(p) @ Euler((0, 0, s * 1.1)).to_matrix().to_4x4())
    for (sx, sy, key) in ((-1, -1, 'leg_fl'), (1, -1, 'leg_fr'), (-1, 1, 'leg_bl'), (1, 1, 'leg_br')):
        o = Vector((sx * 4.6, sy * 9.0 + 1.0, 14.0))
        mb = f.part(key, o)
        tube(mb, [o, o + Vector((0, 0, -6)), o + Vector((0, 0, -11))], 2.3, shag, seg=10, r1=1.9)
        lathe(mb, [(2.1, 0.0), (2.2, 1.0), (2.0, 3.0), (0.0, 3.1)], '#4a4044', c=(o.x, o.y, 0), seg=12, cap_top=True)
    f.anchor('eyes', (0, -21.5, 31.6), 0.5)
    hat_anchor(f, 36, 13, y=-17.5)
    return f


def floss():
    f = Folk('floss')
    pink = '#f6a2cc'
    lathe(f.body, [(2.0, 5.0), (3.6, 7.0), (11.0, 25.0), (11.6, 26.4)], lambda p, n, z0=0, z1=1: rgb('#f2e4c6').lerp(rgb('#d8c4a0'), 0.6 if math.sin(math.atan2(p.y, p.x) * 3 + p.z * 0.45) > 0.6 else 0.0), seg=40, cap_top=True)

    def fluff(base, alt, seed):
        def f2(p, n, u=0, v=0):
            k = 0.5 + 0.5 * noise.noise(p * 0.35 + Vector((seed, 0, 0)))
            return rgb(base).lerp(rgb(alt), k * 0.5) * (1.0 + 0.06 * max(0.0, n.z))
        return f2
    rng = random.Random(21)
    for (x, y, z, r) in ((8, 6, 41, 11), (16, 4, 34, 8.5), (13, 10, 47, 7.5)):
        ball(f.body, (x, y, z), (r, r * 0.9, r * 0.95), fluff('#a6cef2', '#c8e2f8', 3), sub=3)
    for (x, y, z, r) in ((0, -1, 35, 13.5), (-10, 1, 36, 9.5), (8, -1, 33, 9.0), (-4, 2, 45, 9.5), (5, 1, 44, 8.5), (-14, 3, 29, 6.5), (11, 1, 28, 6.5), (0, 0, 27, 9.0)):
        ball(f.body, (x, y, z), (r, r * 0.9, r * 0.95), fluff(pink, '#fbc8e2', 5), sub=3)
    tree = f.bvh()
    face(f, 8.0, 32.0, 'white', body_col=pink, w=2.4, h=2.7, look=1, mouth='smile', mz=27.5, mw=3.6, blush_col='#9cc8f2', blush_dz=-3.2, mouth_col='#7a3a5a', tree=tree)
    feet(f, x=4.0, w=2.2, d=2.8, h=2.0, z=2.0)
    hat_anchor(f, 52, 34)
    return f


def waffle():
    f = Folk('waffle')
    dough = '#e8a850'
    rbox(f.body, -19.0, -5.5, 4.5, 19.0, 5.5, 34.0, '#c88a3a', r=2.6, mid=2)
    # the grid: raised ridges over the front and back, the pockets between them darker
    ridge = soft(mottle(dough, 0.06, 0.5), under=0.0, top=0.1)
    xs = [-19 + 38 * k / 5 for k in range(6)]
    zs = [4.5 + 29.5 * k / 4 for k in range(5)]
    for side in (-1, 1):
        y0, y1 = (-6.6, -4.8) if side < 0 else (4.8, 6.6)
        for x in xs:
            rbox(f.body, max(-19.2, x - 1.3), y0, 4.3, min(19.2, x + 1.3), y1, 34.2, ridge, r=0.9, mid=1)
        for z in zs:
            rbox(f.body, -19.2, y0, max(4.3, z - 1.3), 19.2, y1, min(34.2, z + 1.3), ridge, r=0.9, mid=1)
    # the butter pat melting on top, a drip running over the edge
    butter = soft(mottle('#f8e27a', 0.03, 0.6), under=0.0, top=0.12)
    m = len(f.body.v)
    rbox(f.body, -7.5, -5, 0, 7.5, 5, 4.5, butter, r=1.6, mid=1)
    xform(f.body, m, Matrix.Translation((0.5, 0, 33.8)) @ Euler((0, 0, 0.08)).to_matrix().to_4x4())
    ball(f.body, (0, 0, 34.4), (11.0, 6.2, 0.9), butter, sub=3)
    drip(f.body, 5.5, -6.9, 34.0, 4.5, 1.2, '#f8e27a')
    tree = f.bvh()
    face(f, 8.5, 18.0, 'white', body_col=dough, w=2.8, h=2.9, look=1, mouth='smile', mz=13.5, mw=4.0, blush_dz=-3.0, mouth_col='#7a3a1a', embed=-1.0, tree=tree)
    feet(f, x=9)
    hat_anchor(f, 39, 38)
    return f


def wasabi():
    f = Folk('wasabi')
    green = '#8cc43c'
    col = soft(mottle(green, 0.05, 0.4), under=0.18, z0=4, z1=40, top=0.08)
    surf(f.body, superq(0, 0, 13.0, 23.5, 18.0, 9.5, 1.0, 0.8), col, nu=56, nv=22)
    # the swirl: tiers getting smaller, a curl at the tip
    for k, (r, z) in enumerate(((17.5, 20.0), (13.0, 26.5), (9.0, 32.0), (5.5, 36.5))):
        surf(f.body, superq(k * 0.5, 0, z, r, r * 0.8, 4.6 - k * 0.4, 1.0, 1.0), col, nu=48, nv=16)
    tube(f.body, [(1.5, 0, 38.5), (2.0, 0, 41.5), (0.6, -0.4, 44.5), (-1.2, -0.6, 45.5)], 2.6, col, seg=10, r1=0.7)
    tree = f.bvh()
    # DJ shades: a wide black bar with a blue gleam
    def shades(mb):
        rbox(mb, -16.5, -1.0, -3.2, 16.5, 1.0, 3.0, '#16161e', r=1.5, mid=2)
        for s in (-1, 1):
            ball(mb, (s * 8.5 - 2.0, -1.0, 1.3), (2.0, 0.2, 0.55), '#5ab8e8', sub=1)
    put(f, 0, 24.5, shades, embed=0.6, tree=tree)
    # the headphones: a band over the swirl, red cups at the sides
    tube(f.body, [(-21.0, 0, 24.0), (-18.0, 0, 34.0), (-9.0, 0, 41.0), (0, 0, 43.0), (9.0, 0, 41.0), (18.0, 0, 34.0), (21.0, 0, 24.0)], 1.5, '#1e1e26', seg=8)
    for s in (-1, 1):
        m = len(f.body.v)
        lathe(f.body, [(5.5, 0.0), (6.0, 1.2), (6.0, 3.6), (5.0, 4.6), (0.0, 4.8)], lambda p, n: rgb('#e04a5c') if p.z > 1.0 else rgb('#1e1e26'), seg=28, cap_top=True)
        xform(f.body, m, Matrix.Translation((s * 20.5, 0, 23.0)) @ Euler((0, s * math.pi / 2, 0)).to_matrix().to_4x4())
    put(f, 1.0, 17.0, lambda mb: tube(mb, [(-3.4, -0.2, 0.4), (-1.0, -0.4, -0.7), (2.0, -0.4, -0.4), (3.6, -0.2, 0.9)], 0.5, '#3a5a1a', seg=6), embed=0.1, tree=tree)
    f.anchor('eyes', f.hit(0, 24.5, tree=tree)[0], 1.0)
    feet(f, x=10)
    hat_anchor(f, 45, 22)
    return f


def broccoli(name, stem_w, stem_h, crown_w, crown_h, look):
    f = Folk(name)
    stem = '#a8d48a'
    z0 = 4.0
    rbox(f.body, -stem_w, -stem_w * 0.8, z0, stem_w, stem_w * 0.8, z0 + stem_h, soft(mottle(stem, 0.05, 0.5), under=0.16, z0=z0, z1=z0 + stem_h), r=stem_w * 0.4, mid=2)
    rng = random.Random(hash(name) % 1000)
    zc = z0 + stem_h - 1.0
    for k in range(int(26 * crown_w / 23)):
        a = rng.uniform(0, math.tau)
        d = math.sqrt(rng.random())
        x, y = math.cos(a) * d * crown_w * 0.85, math.sin(a) * d * crown_w * 0.6
        z = zc + crown_h * 0.35 + (1 - d * d) * crown_h * 0.45 + rng.uniform(-1, 1)
        r = rng.uniform(0.2, 0.3) * crown_w

        def bud(p, n, u=0, v=0, c=(x, y, z)):
            b = 0.5 + 0.5 * noise.noise(p * 0.9)
            return rgb('#2e7a30').lerp(rgb('#5aa84a'), 0.35 * b + 0.35 * max(0.0, n.z)) * (0.82 + 0.18 * max(0.0, (p.z - zc) / crown_h))
        ball(f.body, (x, y, z), (r, r, r * 0.8), bud, sub=2)
    tree = f.bvh()
    return f, tree, z0 + stem_h


def floret():
    f, tree, top = broccoli('floret', 11.0, 27.0, 23.0, 18.0, 0)
    stem = '#a8d48a'
    # half-shut, very serious eyes: dark eyes with a heavy lid over each
    for s, key in ((-1, 'eye_l'), (1, 'eye_r')):
        put(f, s * 6.0, 21.5, lambda mb: (eye_dark(mb, 2.2, 2.6), ball(mb, (0, -0.25, 1.3), (2.6, 1.3, 1.6), stem, sub=2)), part=key, embed=0.4, tree=tree)
    put(f, 0, 14.0, lambda mb: arc(mb, 4.4, 0.7, 0.5, '#2a3a20', up=True), embed=0.1, tree=tree)
    put(f, -6.0, 21.5, lambda mb: tube(mb, [(math.cos(k / 24 * math.tau) * 3.4, -1.2, math.sin(k / 24 * math.tau) * 3.4) for k in range(25)], 0.45, '#d8a830', seg=6), embed=0.0, tree=tree)
    put(f, -9.0, 14.0, lambda mb: tube(mb, [(0.5, -0.8, 4.5), (0.0, -0.9, 0.0), (-0.6, -0.8, -4.0)], 0.25, '#c89a28', seg=4), embed=0.0, tree=tree)
    f.anchor('eyes', f.hit(0, 21.5, tree=tree)[0], 0.8)
    feet(f, x=7)
    hat_anchor(f, top + 16, 32)
    return f


def stalk():
    f, tree, top = broccoli('stalk', 9.5, 22.0, 18.0, 14.0, 0)
    stem = '#a8d48a'
    for s, key in ((-1, 'eye_l'), (1, 'eye_r')):
        put(f, s * 5.5, 20.5, lambda mb: (eye_dark(mb, 2.0, 2.3), ball(mb, (0, -0.25, 1.2), (2.4, 1.2, 1.4), stem, sub=2)), part=key, embed=0.4, tree=tree)
        lashes(f, s * 5.5, 19.5, s, tree)
    def teeth(mb):
        rbox(mb, -5.0, -0.8, -2.0, 5.0, 0.6, 2.0, '#2a3a20', r=0.8, mid=0)
        for k in range(3):
            rbox(mb, -4.3 + k * 2.95, -1.2, -1.4, -4.3 + k * 2.95 + 2.6, -0.4, 1.4, '#fbf6e2', r=0.5, mid=0)
    put(f, 0, 13.0, teeth, embed=0.2, tree=tree)
    f.anchor('eyes', f.hit(0, 20.5, tree=tree)[0], 0.7)
    feet(f, x=6)
    hat_anchor(f, top + 12, 30)
    return f


def sprout():
    f, tree, top = broccoli('sprout', 5.5, 12.5, 9.5, 8.0, 0)
    face(f, 3.2, 11.5, 'dark', body_col='#a8d48a', w=1.4, h=1.8, mouth='open', mz=8.4, mw=2.6, blush_dx=5.2, blush_dz=-2.0, embed=0.3, tree=tree)
    feet(f, x=3.5, w=1.8, d=2.2, h=1.6, z=1.6)
    hat_anchor(f, top + 7, 24)
    return f


def ghost():
    f = Folk('ghost')
    pale = '#d4e0fa'

    def prof(v):
        if v > 0.75:
            a = (v - 0.75) / 0.25 * math.pi / 2
            return 16.5 * math.cos(a) ** 0.6, 50 + 10 * math.sin(a)
        return 16.5 + 1.5 * (0.75 - v) / 0.75, 6 + 44 * v / 0.75

    def P(u, v):
        r, z = prof(v)
        th = u * math.tau
        # the hem waves in scallops
        if v < 0.2:
            z += (0.2 - v) / 0.2 * 4.0 * math.cos(th * 6)
        return Vector((math.cos(th) * r, math.sin(th) * r * 0.85, z))

    def col(p, n, u, v):
        return rgb(pale).lerp(rgb('#aebeea'), max(0.0, min(1.0, (22 - p.z) / 16)) * 0.6) * (1 + 0.05 * max(0.0, n.z))
    surf(f.body, P, col, nu=72, nv=30, caps=(False, True))
    lathe(f.body, [(17.6, 6.5), (0.0, 6.5)], '#aebeea', seg=72, cap_top=False, sy=0.85)
    for s in (-1, 1):
        ball(f.body, (s * 18.0, -1.0, 34.0), (4.5, 3.0, 2.6), col_fn(pale, under=0.0), sub=2)
    tree = f.bvh()
    # eyes shut in a smile, a great white beard and mustache
    for s in (-1, 1):
        put(f, s * 7.5, 47.0, lambda mb: arc(mb, 4.6, 1.1, 0.5, '#5a6aa8', up=True), embed=0.1, tree=tree)
    beard = mottle('#fbfcff', 0.03, 0.8)
    for (x, z, r) in ((0, 34, 9.5), (-7, 37, 6.5), (7, 37, 6.5), (-3.5, 30, 6.5), (3.5, 30, 6.5)):
        put(f, x, z, lambda mb, r=r: ball(mb, (0, 0, 0), (r, 2.6, r * 0.8), beard, sub=3), embed=0.8, tree=tree)
    for s in (-1, 1):
        put(f, s * 4.5, 41.0, lambda mb, s=s: ball(mb, (0, 0, 0), (5.0, 2.2, 2.2), beard, sub=2), embed=0.5, tree=tree, tilt=s * 0.25)
    # the keeper's cap: navy, a brim to the front, a gold badge
    navy = soft(mottle('#2a3a7a', 0.04, 0.5), under=0.0, top=0.1)
    lathe(f.body, [(15.0, 58.0), (15.6, 63.0), (17.0, 66.0), (16.5, 66.8), (0.0, 67.0)], navy, seg=48, cap_top=True, sy=0.88)
    ball(f.body, (0, -13.5, 58.6), (14.0, 6.0, 1.0), navy, sub=3)
    ball(f.body, (0, -14.8, 63.0), (1.6, 0.6, 1.6), shade('#f2c840'), sub=2)
    hat_anchor(f, 67, 32)
    return f


FOLKS = {'maki': maki, 'kai': kai, 'basil': basil, 'wonton': wonton, 'chili': chili, 'coco': coco, 'cece': cece,
         'clementine': clementine, 'cuke': cuke, 'sully': sully, 'ginger': ginger, 'brulee': brulee, 'mac': mac,
         'fortune': fortune, 'goat': goat, 'floss': floss, 'waffle': waffle, 'wasabi': wasabi, 'floret': floret,
         'stalk': stalk, 'sprout': sprout, 'ghost': ghost}


# ---------------------------------------------------------------- making the objects
def objects(f):
    """The folk's parts as objects at the game's scale (each part's origin at its joint), and its anchors."""
    mat, gl = vmat(f'folk_{f.name}', rough=0.62), None
    out = []
    for key, (mb, o) in f.parts.items():
        if not mb.v:
            continue
        mb2 = MB()
        mb2.v = [(v - o) * K for v in mb.v]
        mb2.f, mb2.c, mb2.n = mb.f, mb.c, mb.n
        name = f'{f.name}_{key}'
        m = mat
        if key.startswith('eye') or key == 'gloss':
            gl = gl or vmat(f'folk_{f.name}_gloss', rough=0.4)
            m = gl
        ob = mb2.obj(name, m)
        ob.location = o * K
        out.append(ob)
    for key, (p, s) in f.anchors.items():
        e = bpy.data.objects.new(f'anchor_{key}', None)
        e.location = p * K
        e.scale = (s, s, s)
        link(e)
        out.append(e)
    return out


if __name__ == '__main__':
    args = sys.argv[1:]
    prev = args[args.index('--preview') + 1] if '--preview' in args else None
    only = args[args.index('--only') + 1].split(',') if '--only' in args else None
    reset()
    shown = []
    for name, fn in FOLKS.items():
        if only and name not in only:
            continue
        objs = objects(fn())
        export(objs, f'folk_{name}')
        for o in objs:
            if o.name.startswith('anchor_'):
                o.name = f'done_{name}_{o.name}'      # (so the next folk's anchors keep their plain names)
        shown.append((name, objs))
        print('built', name, sum(len(o.data.vertices) for o in objs if o.type == 'MESH'), 'vertices')
    if prev:
        ground_plane(size=2000, color='#8cc070')
        light_rig()
        people = person(x=0.9, y=0.3, h=1.62)
        for k, (name, objs) in enumerate(shown):
            for o in objs:
                o.location.x += k * 40
        cam = None
        for k, (name, objs) in enumerate(shown):
            for p in people:
                p.location.x = k * 40 + 0.95
            for pitch, tag in ((34, 'game'), (8, 'front')):
                if cam:
                    bpy.data.objects.remove(cam)
                cam = camera((k * 40 + 0.2, 0, 0.5), dist=2.6, pitch=pitch)
                render(os.path.join(prev, f'{name}_{tag}.png'), size=(520, 440), samples=32)
