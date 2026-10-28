"""People as dolls for the new 3D look, the style David set on 26 October: chibi toys after Animal Crossing's people. A big
round head (nearly half the doll) with a painted face, hair sculpted as a few chunky locks melted into one soft mass,
clothes with thickness (a ribbed hem, collar and cuffs, rolled jeans), round mitten hands and chunky shoes.

The game still dresses the doll from the save (the tailor's clothes, the salon's hair and colors), so nothing here has
its own color: every part is shaded in greys (darker in the creases, where one thing meets another, and underneath) and
named for what paints it, `<part>__<role>`: top, trim, bottom, bottom2 (the inside of a rolled cuff), shoes, sole, skin,
hair (its blue channel says how far toward the dyed tips), face (the patch of the head the face is painted on, its UVs
an angle grid: EnvDolls.faceSheet). Each part's origin is its joint: the neck, the shoulders and elbows, the hips and
knees; limbs are capsules whose ends are balls round their joints, so a bent elbow or knee stays whole.

Units are the doll's height (feet at 0, the top of the head at 1; the game scales it), z up, -y the front.

    python tools/blender/dolls.py [--preview DIR] [--only kit,hair] [--lod1]

--lod1 makes the phones' versions (doll_kit_lod1, doll_hair_lod1: each part and style from fewer points).
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from mathutils import Vector, Matrix, Euler, noise
from mathutils.bvhtree import BVHTree
from common import *
from trees_ac import MB, vmat, rgb
from folks import surf, superq, revolve, ball
from kit import lathe, tube, rbox, xform

# ---------------------------------------------------------------- the skeleton (doll units)
HR = 0.215                          # the head's radius
HEAD = Vector((0, 0, 0.782))        # its middle
NECK = Vector((0, 0, 0.560))        # where it turns
SH = Vector((0.113, 0.0, 0.522))    # the right shoulder (the left is mirrored)
UPPER, FORE = 0.098, 0.084          # the arm's two lengths
HIP = Vector((0.051, 0.0, 0.296))   # the right hip
THIGH, SHIN = 0.122, 0.112          # the leg's two lengths
ANKLE_Z = HIP.z - THIGH - SHIN      # (0.062)


def lin(s):
    """A grey as the game will show it (the mesh keeps linear values; the game turns them back: EnvModels.srgb)."""
    s = max(0.0, min(1.0, s))
    return s / 12.92 if s <= 0.04045 else ((s + 0.055) / 1.055) ** 2.4


def grey(s):
    v = lin(s)
    return Vector((v, v, v))


class Part:
    """A part being made: a mesh of greys (and UVs for the face), its role, its joint."""
    def __init__(self, name, role, origin=(0, 0, 0)):
        self.name, self.role, self.origin = name, role, Vector(origin)
        self.mb = MB()
        self.uv = None


PARTS = {}


def part(name, role, origin=(0, 0, 0)):
    k = f'{name}__{role}'
    if k not in PARTS:
        PARTS[k] = Part(name, role, origin)
    return PARTS[k].mb


# ---------------------------------------------------------------- shapes
def capsule(mb, a, b, ra, rb, col, sx=1.0, sy=1.0, nu=20, nv=18, mod=None):
    """A limb from joint a (radius ra) to joint b (radius rb): a ball round each joint and the taper between, built along
    the line between them."""
    a, b = Vector(a), Vector(b)
    L = (b - a).length
    ax = (b - a).normalized()
    # a frame with z along the limb
    up = Vector((0, 0, 1)) if abs(ax.z) < 0.9 else Vector((1, 0, 0))
    xx = up.cross(ax).normalized()
    yy = ax.cross(xx).normalized()
    # the profile: the top ball (round a), the taper, the bottom ball (round b); as (radius, distance along) from a
    pts = []
    n1 = nv // 3
    for k in range(n1 + 1):
        t = k / n1 * math.pi / 2
        pts.append((ra * math.sin(t), -ra * math.cos(t)))
    for k in range(1, n1):
        t = k / n1
        pts.append((ra + (rb - ra) * t, L * t))
    for k in range(n1 + 1):
        t = k / n1 * math.pi / 2
        pts.append((rb * math.cos(t), L + rb * math.sin(t)))
    acc = [0.0]
    for i in range(1, len(pts)):
        acc.append(acc[-1] + math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))

    def prof(v):
        s = v * acc[-1]
        for i in range(1, len(acc)):
            if acc[i] >= s:
                t = (s - acc[i - 1]) / max(1e-9, acc[i] - acc[i - 1])
                return (pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t)
        return pts[-1]

    def P(u, v):
        r, d = prof(1 - v)
        if mod:
            r *= mod(u, 1 - v, d / max(1e-6, L))
        th = u * math.tau
        return a + ax * d + xx * (math.cos(th) * r * sx) + yy * (math.sin(th) * r * sy)
    surf(mb, P, col, nu=nu, nv=nv, caps=(True, True))


def sym(fn):
    """Build something for the right side and its mirror for the left: fn(side, suffix)."""
    for s, k in ((1, 'r'), (-1, 'l')):
        fn(s, k)


# ---------------------------------------------------------------- the head
def head():
    """A round head a little wider than tall, its cheeks full, ears, and the face patch (an angle grid: u across, v down,
    52 degrees each way from the middle of the face)."""
    mb = part('head', 'skin', NECK)
    sx, sy, sz = 1.05, 0.98, 1.0

    def full(u, v):
        # (fuller toward the jaw, as a child's)
        return 1.0 + 0.03 * math.exp(-((v - 0.32) / 0.14) ** 2)
    P = superq(HEAD.x, HEAD.y, HEAD.z, HR * sx, HR * sy, HR * sz, mod=full)
    surf(mb, P, lambda p, n, u, v: grey(0.97 - 0.1 * max(0.0, -n.z) ** 2), nu=64, nv=40)
    # the ears: small and round, a little in front of the middle
    sym(lambda s, k: surf(part('ear_' + k, 'skin', NECK), superq(s * HR * sx * 0.97, -0.01, HEAD.z - 0.03 * HR, 0.032, 0.022, 0.04),
                          lambda p, n, u, v: grey(0.9 - 0.12 * max(0.0, -n.y * s)), nu=16, nv=12))
    # the face patch, just off the skin
    fp = PARTS.setdefault('face__face', Part('face', 'face', NECK))
    span = math.radians(52)
    nu, nv = 36, 36
    pts, cols, nrms, uvs, faces = [], [], [], [], []
    for j in range(nv + 1):
        for i in range(nu + 1):
            u, v = i / nu, j / nv
            ph = -span + 2 * span * u            # round the head (0 the front)
            th = -span + 2 * span * v            # down from the middle
            d = Vector((math.sin(ph) * math.cos(th), -math.cos(ph) * math.cos(th), -math.sin(th)))
            vv = 0.5 + math.asin(max(-1.0, min(1.0, d.z))) / math.pi
            k = 1.0 + 0.03 * math.exp(-((vv - 0.32) / 0.14) ** 2)
            p = HEAD + Vector((d.x * HR * sx * k, d.y * HR * sy * k, d.z * HR * sz)) * 1.006
            n = Vector((d.x / sx, d.y / sy, d.z / sz)).normalized()
            pts.append(p); nrms.append(n); cols.append(grey(1.0)); uvs.append((u, 1 - v))
    for j in range(nv):
        for i in range(nu):
            a = j * (nu + 1) + i
            faces += [(a, a + 1, a + nu + 2), (a, a + nu + 2, a + nu + 1)]
    fp.mb.add(pts, cols, nrms, faces)
    fp.uv = uvs


# ---------------------------------------------------------------- the body and clothes
def torso():
    """The top: a soft bell from the hem (over the hips) to round shoulders, a knit's ribbed hem and crew collar."""
    sy = 0.84
    prof_pts = [(0.0, 0.262), (0.112, 0.262), (0.121, 0.275), (0.124, 0.30), (0.119, 0.35), (0.110, 0.41), (0.104, 0.46),
                (0.101, 0.495), (0.094, 0.525), (0.078, 0.548), (0.052, 0.562), (0.0, 0.566)]

    def prof(v):
        # (the points above, followed smoothly)
        x = v * (len(prof_pts) - 1)
        i = min(len(prof_pts) - 2, int(x))
        t = x - i
        t = t * t * (3 - 2 * t)
        a, b = prof_pts[i], prof_pts[i + 1]
        return a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t

    def col(p, n, u, v):
        # a soft knit: faint ribs down the front, darker under the arms and toward the hem
        rib = 0.5 + 0.5 * math.cos(u * math.tau * 46)
        k = 0.95 - 0.04 * rib - 0.1 * max(0.0, -n.z) ** 2
        k -= 0.08 * max(0.0, 1 - abs(abs(p.x) - 0.1) / 0.03) * max(0.0, 1 - abs(p.z - 0.47) / 0.06)
        return grey(k)
    surf(part('torso', 'top'), revolve(prof, sy=sy), col, nu=56, nv=30, caps=(True, True))
    # the ribbed hem: a band that stands a little proud, ribs all round
    hem = part('hem', 'trim')

    def hem_p(v):
        z = 0.256 + v * 0.05
        r = 0.123 + 0.006 * math.sin(v * math.pi)
        return r, z
    surf(hem, revolve(hem_p, sy=sy * 1.02, mod=lambda u, v: 1 + 0.018 * math.cos(u * math.tau * 34)),
         lambda p, n, u, v: grey(0.9 - 0.08 * (0.5 - 0.5 * math.cos(u * math.tau * 34)) - 0.12 * max(0.0, -n.z)), nu=136, nv=8, caps=(False, False))
    # (its bottom edge turned under)
    lathe(hem, [(0.124, 0.256), (0.112, 0.255)], lambda p, n: grey(0.7), seg=68, cap_top=False, sy=sy * 1.02)
    # the crew collar: a ribbed roll round the neck
    col_ = part('collar', 'trim')

    def ring(u, v):
        th, ph = u * math.tau, v * math.tau
        R, r = 0.058, 0.0125
        rr = R + r * math.cos(ph)
        rib = 1 + 0.12 * math.cos(th * 30) * max(0.0, math.cos(ph))
        return Vector((math.cos(th) * rr * rib, math.sin(th) * rr * sy * 1.05 * rib, 0.556 + r * math.sin(ph)))
    surf(col_, ring, lambda p, n, u, v: grey(0.92 - 0.1 * (0.5 - 0.5 * math.cos(u * math.tau * 30)) - 0.15 * max(0.0, -n.z)),
         nu=120, nv=10, caps=(False, False))


def hips():
    """The jeans' seat under the hem."""
    def prof(v):
        z = 0.22 + v * 0.07
        r = 0.098 + 0.012 * math.sin(min(1.0, v * 1.6) * math.pi / 2)
        return (r if v < 0.98 else r * 0.5), z
    surf(part('hips', 'bottom'), revolve(prof, sy=0.84), lambda p, n, u, v: grey(0.86 - 0.12 * max(0.0, -n.z)), nu=40, nv=10, caps=(True, True))


def arm(s, k):
    """A long sleeve from the shoulder to a ribbed cuff, and a round mitten hand with a thumb."""
    sh = Vector((s * SH.x, SH.y, SH.z))
    el = sh + Vector((0, 0, -UPPER))
    wr = el + Vector((0, 0, -FORE))
    up = part(f'uarm_{k}', 'top', sh)

    def creases(u, v, t):
        return 1.0 + 0.04 * math.exp(-((t - 0.95) / 0.12) ** 2)
    capsule(up, sh, el, 0.043, 0.039, lambda p, n, u, v: grey(0.93 - 0.1 * max(0.0, -n.z) ** 2 - 0.06 * max(0.0, n.x * -s)), mod=creases)
    fore = part(f'farm_{k}', 'top', el)
    capsule(fore, el, wr + Vector((0, 0, 0.012)), 0.039, 0.037, lambda p, n, u, v: grey(0.92 - 0.1 * max(0.0, -n.z) ** 2 - 0.06 * max(0.0, n.x * -s)))
    # the cuff, ribbed
    cuff = part(f'farm_{k}', 'trim', el)

    def cprof(v):
        return 0.039 + 0.003 * math.sin(v * math.pi), wr.z - 0.006 + v * 0.026
    surf(cuff, revolve(cprof, cx=wr.x, cy=wr.y, mod=lambda u, v: 1 + 0.05 * math.cos(u * math.tau * 14)),
         lambda p, n, u, v: grey(0.9 - 0.1 * (0.5 - 0.5 * math.cos(u * math.tau * 14)) - 0.1 * max(0.0, -n.z)), nu=56, nv=6, caps=(True, False))
    # the hand: a mitten, palm toward the body, the thumb forward
    hand = part(f'farm_{k}', 'skin', el)
    hc = wr + Vector((0, -0.002, -0.026))
    surf(hand, superq(hc.x, hc.y, hc.z, 0.031, 0.035, 0.036, 0.9, 1.0), lambda p, n, u, v: grey(0.95 - 0.1 * max(0.0, -n.z) ** 2), nu=24, nv=16)
    surf(hand, superq(hc.x - s * 0.012, hc.y - 0.026, hc.z + 0.006, 0.013, 0.014, 0.019), lambda p, n, u, v: grey(0.93), nu=14, nv=10)


def bare_arm(s, k):
    """An arm with no sleeve (or under a short one): skin from the shoulder, the same mitten hand."""
    sh = Vector((s * SH.x, SH.y, SH.z))
    el = sh + Vector((0, 0, -UPPER))
    wr = el + Vector((0, 0, -FORE))
    capsule(part(f'uarm_bare_{k}', 'skin', sh), sh, el, 0.034, 0.031, lambda p, n, u, v: grey(0.95 - 0.1 * max(0.0, -n.z) ** 2))
    fa = part(f'farm_bare_{k}', 'skin', el)
    capsule(fa, el, wr, 0.031, 0.029, lambda p, n, u, v: grey(0.95 - 0.1 * max(0.0, -n.z) ** 2))
    hc = wr + Vector((0, -0.002, -0.022))
    surf(fa, superq(hc.x, hc.y, hc.z, 0.031, 0.035, 0.036, 0.9, 1.0), lambda p, n, u, v: grey(0.95 - 0.1 * max(0.0, -n.z) ** 2), nu=24, nv=16)
    surf(fa, superq(hc.x - s * 0.012, hc.y - 0.026, hc.z + 0.006, 0.013, 0.014, 0.019), lambda p, n, u, v: grey(0.93), nu=14, nv=10)


def leg(s, k):
    """A jeans leg from the hip to a rolled cuff, and a chunky shoe with a pale sole."""
    hp = Vector((s * HIP.x, HIP.y, HIP.z))
    kn = hp + Vector((0, 0, -THIGH))
    an = kn + Vector((0, 0, -SHIN))

    def seam(p, n, u, v):
        # (a darker seam down the outside, the knee a touch lighter, darker underneath)
        side = max(0.0, 1 - abs(math.atan2(n.y, n.x * s)) / 0.18)
        return grey(0.88 - 0.1 * side - 0.12 * max(0.0, -n.z) ** 2)
    capsule(part(f'thigh_{k}', 'bottom', hp), hp, kn, 0.052, 0.047, seam)
    shin = part(f'shin_{k}', 'bottom', kn)
    capsule(shin, kn, an + Vector((0, 0, 0.016)), 0.047, 0.046, seam)
    # the rolled cuff: the denim's paler inside showing
    cuff = part(f'shin_{k}', 'bottom2', kn)

    def cprof(v):
        return 0.05 + 0.004 * math.sin(v * math.pi), an.z + 0.012 + v * 0.022
    surf(cuff, revolve(cprof, cx=an.x, cy=an.y), lambda p, n, u, v: grey(0.92 - 0.14 * max(0.0, -n.z)), nu=40, nv=6, caps=(True, True))
    # the shoe: rounded, its toe ahead, standing on a sole
    sh = part(f'shin_{k}', 'shoes', kn)
    c = Vector((an.x + s * 0.004, an.y - 0.022, 0.034))
    surf(sh, superq(c.x, c.y, c.z, 0.041, 0.062, 0.03, 0.62, 0.7, mod=lambda u, v: 1.0 + 0.1 * max(0.0, -math.sin(u * math.tau)) * v),
         lambda p, n, u, v: grey(0.95 - 0.12 * max(0.0, -n.z) - 0.05 * max(0.0, n.y)), nu=36, nv=18)
    surf(sh, superq(an.x, an.y + 0.004, 0.058, 0.036, 0.038, 0.022), lambda p, n, u, v: grey(0.9), nu=24, nv=12)
    so = part(f'shin_{k}', 'sole', kn)
    surf(so, superq(c.x, c.y, 0.011, 0.044, 0.066, 0.011, 0.5, 0.35), lambda p, n, u, v: grey(0.94 - 0.18 * max(0.0, -n.z)), nu=36, nv=10)


# ---------------------------------------------------------------- a boy's cut (Joe, David, James, John)
def torso_m():
    """A boy's top: straighter than the knit (no flare at the hem) and a little broader at the shoulders; an open jacket,
    its lapels folded back, the shirt showing down the front between them, pocket flaps, a plain hem."""
    sy = 0.86
    pts_m = [(0.0, 0.262), (0.114, 0.262), (0.119, 0.272), (0.118, 0.30), (0.115, 0.36), (0.113, 0.42), (0.113, 0.47),
             (0.113, 0.50), (0.109, 0.527), (0.092, 0.55), (0.057, 0.563), (0.0, 0.567)]

    def prof(v):
        x = v * (len(pts_m) - 1)
        i = min(len(pts_m) - 2, int(x))
        t = x - i
        t = t * t * (3 - 2 * t)
        a, b = pts_m[i], pts_m[i + 1]
        return a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t

    def rz(z):
        # (the body's radius at a height, from the profile)
        best = min(range(len(pts_m) - 1), key=lambda i: abs((pts_m[i][1] + pts_m[i + 1][1]) / 2 - z))
        a, b = pts_m[best], pts_m[best + 1]
        t = max(0.0, min(1.0, (z - a[1]) / max(1e-6, b[1] - a[1])))
        return a[0] + (b[0] - a[0]) * t

    def front(x, z, lift):
        r = max(0.02, rz(z))
        y = -r * sy * math.sqrt(max(0.0, 1 - min(0.98, (x / r) ** 2)))
        return Vector((x, y - lift, z))
    surf(part('torso_m', 'top'), revolve(prof, sy=sy), lambda p, n, u, v: grey(0.93 - 0.1 * max(0.0, -n.z) ** 2
         - 0.07 * max(0.0, 1 - abs(abs(p.x) - 0.1) / 0.03) * max(0.0, 1 - abs(p.z - 0.47) / 0.06)), nu=56, nv=30, caps=(True, True))
    # the shirt down the front: a V from the neck to the chest
    z_top, z_bot = 0.552, 0.37
    w = lambda v: 0.036 * (1 - v) ** 0.9 + 0.003
    P, C, N, F = [], [], [], []
    nu, nv = 8, 14
    for j in range(nv + 1):
        v = j / nv
        z = z_top + (z_bot - z_top) * v
        for i in range(nu + 1):
            x = (-1 + 2 * i / nu) * w(v)
            q = front(x, z, 0.003)
            P.append(q); N.append(Vector((x * 2, -1, 0.15)).normalized()); C.append(grey(0.95 - 0.1 * v))
    for j in range(nv):
        for i in range(nu):
            a = j * (nu + 1) + i
            F += [(a, a + 1, a + nu + 2), (a, a + nu + 2, a + nu + 1)]
    part('shirt_m', 'trim').add(P, C, N, F)
    # the shirt's collar round the neck, plain
    def ring(u, v):
        th, ph = u * math.tau, v * math.tau
        R, r = 0.056, 0.009
        rr = R + r * math.cos(ph)
        return Vector((math.cos(th) * rr, math.sin(th) * rr * sy * 1.05, 0.557 + r * math.sin(ph)))
    surf(part('collar_m', 'trim'), ring, lambda p, n, u, v: grey(0.93 - 0.15 * max(0.0, -n.z)), nu=48, nv=8, caps=(False, False))
    # the lapels: folded back along each side of the V, standing a little proud, a rolled edge
    lap = part('lapel_m', 'top')
    for s in (-1, 1):
        P, C, N, F = [], [], [], []
        for j in range(nv + 1):
            v = j / nv
            z = z_top + (z_bot - z_top) * v
            wi, wo = w(v), w(v) + 0.026 * (1 - 0.55 * v) + 0.004
            for k in range(4):
                x = s * (wi + (wo - wi) * k / 3)
                q = front(x, z, 0.006 + 0.002 * math.sin(k / 3 * math.pi))
                P.append(q); N.append(Vector((x * 1.5, -1, 0.25)).normalized()); C.append(grey(0.8 + 0.05 * k / 3))
        for j in range(nv):
            for k in range(3):
                a = j * 4 + k
                F += [(a, a + 1, a + 5), (a, a + 5, a + 4)]
        lap.add(P, C, N, F)
        tube(lap, [front(s * w(j / nv), z_top + (z_bot - z_top) * j / nv, 0.006) for j in range(nv + 1)], 0.004, lambda p, n: grey(0.86), seg=6)
    # pocket flaps at the hips, a plain hem
    for s in (-1, 1):
        c = front(s * 0.065, 0.315, 0.002)
        m = len(part('pocket_m', 'top').v)
        rbox(part('pocket_m', 'top'), -0.026, -0.004, -0.009, 0.026, 0.004, 0.009, lambda p, n: grey(0.8 - 0.1 * max(0.0, -n.z)), r=0.004, mid=0)
        xform(part('pocket_m', 'top'), m, Matrix.Translation(c) @ Matrix.Rotation(-s * 0.55, 4, 'Z'))
    def hem_p(v):
        return 0.119 + 0.003 * math.sin(v * math.pi), 0.258 + v * 0.03
    surf(part('hem_m', 'top'), revolve(hem_p, sy=sy * 1.02), lambda p, n, u, v: grey(0.86 - 0.12 * max(0.0, -n.z)), nu=56, nv=6, caps=(True, False))


def hips_m():
    """Trousers' seat under a jacket."""
    def prof(v):
        z = 0.22 + v * 0.07
        r = 0.1 + 0.01 * math.sin(min(1.0, v * 1.6) * math.pi / 2)
        return (r if v < 0.98 else r * 0.5), z
    surf(part('hips_m', 'bottom'), revolve(prof, sy=0.86), lambda p, n, u, v: grey(0.86 - 0.12 * max(0.0, -n.z)), nu=40, nv=10, caps=(True, True))


def arm_m(s, k):
    """A jacket's sleeve, a touch fuller, to a plain cuff with the shirt's showing under it, and the mitten hand."""
    sh = Vector((s * SH.x, SH.y, SH.z))
    el = sh + Vector((0, 0, -UPPER))
    wr = el + Vector((0, 0, -FORE))
    capsule(part(f'uarm_m_{k}', 'top', sh), sh, el, 0.045, 0.041, lambda p, n, u, v: grey(0.93 - 0.1 * max(0.0, -n.z) ** 2 - 0.06 * max(0.0, n.x * -s)))
    fore = part(f'farm_m_{k}', 'top', el)
    capsule(fore, el, wr + Vector((0, 0, 0.008)), 0.041, 0.04, lambda p, n, u, v: grey(0.92 - 0.1 * max(0.0, -n.z) ** 2 - 0.06 * max(0.0, n.x * -s)))
    lathe(fore, [(0.04, wr.z + 0.012), (0.043, wr.z + 0.006), (0.043, wr.z - 0.002), (0.034, wr.z - 0.004)], lambda p, n: grey(0.85), c=(wr.x, wr.y, 0), seg=28, cap_top=False)
    lathe(part(f'farm_m_{k}', 'trim', el), [(0.035, wr.z - 0.002), (0.036, wr.z - 0.009), (0.03, wr.z - 0.011)], lambda p, n: grey(0.93), c=(wr.x, wr.y, 0), seg=24, cap_top=False)
    hand = part(f'farm_m_{k}', 'skin', el)
    hc = wr + Vector((0, -0.002, -0.03))
    surf(hand, superq(hc.x, hc.y, hc.z, 0.032, 0.036, 0.037, 0.9, 1.0), lambda p, n, u, v: grey(0.95 - 0.1 * max(0.0, -n.z) ** 2), nu=24, nv=16)
    surf(hand, superq(hc.x - s * 0.012, hc.y - 0.027, hc.z + 0.006, 0.013, 0.014, 0.019), lambda p, n, u, v: grey(0.93), nu=14, nv=10)


# ---------------------------------------------------------------- what some clothes add (HD_STYLE's details)
KNIT_PTS = [(0.124, 0.30), (0.119, 0.35), (0.110, 0.41), (0.104, 0.46), (0.101, 0.495), (0.094, 0.525), (0.078, 0.548), (0.052, 0.562), (0.0, 0.566)]
M_PTS = [(0.118, 0.30), (0.115, 0.36), (0.113, 0.42), (0.113, 0.47), (0.113, 0.50), (0.109, 0.527), (0.092, 0.55), (0.057, 0.563), (0.0, 0.567)]
BRASS = 0.93        # (a button's grey: the code paints it brass)


def body_r(z):
    """The body's radius at a height: the fuller of the two cuts', so what lies on the front sits on either."""
    def rz(pts):
        if z <= pts[0][1]:
            return pts[0][0]
        for (r0, z0), (r1, z1) in zip(pts, pts[1:]):
            if z <= z1:
                return r0 + (r1 - r0) * (z - z0) / (z1 - z0)
        return 0.0
    return max(rz(KNIT_PTS), rz(M_PTS))


def on_body(x, z, lift=0.0, back=False, sy=0.86):
    """The point on the body's front (or back) at x across and height z, lifted off it."""
    r = body_r(z) + lift
    y = math.sqrt(max(0.0, r * r - x * x)) * sy
    return Vector((x, y if back else -y, z))


def shoulder_z(x):
    """How high the top of the shoulder is x out from the middle."""
    z = 0.566
    while z > 0.45 and body_r(z) < abs(x):
        z -= 0.001
    return z


def panel(mb, P, t, col, nu=12, nv=12):
    """A thick curved panel: P(u, v) its outer face (u, v in 0..1, ordered so u x v points out), t thick, its back
    pushed in along the face's normal and its edges closed."""
    def nrm(u, v):
        e = 1e-3
        du = P(min(1.0, u + e), v) - P(max(0.0, u - e), v)
        dv = P(u, min(1.0, v + e)) - P(u, max(0.0, v - e))
        return du.cross(dv).normalized()
    G = [[(P(i / nu, j / nv), nrm(i / nu, j / nv)) for i in range(nu + 1)] for j in range(nv + 1)]
    pts, cols, nrms, faces = [], [], [], []
    for side in (0, 1):
        for j in range(nv + 1):
            for i in range(nu + 1):
                p, n = G[j][i]
                q = p if side == 0 else p - n * t
                pts.append(q); nrms.append(n if side == 0 else -n)
                cols.append(col(q, n, i / nu, j / nv) if side == 0 else grey(0.62))
    W = (nu + 1) * (nv + 1)
    for j in range(nv):
        for i in range(nu):
            a = j * (nu + 1) + i
            faces += [(a, a + 1, a + nu + 2), (a, a + nu + 2, a + nu + 1)]
            b = W + a
            faces += [(b, b + nu + 2, b + 1), (b, b + nu + 1, b + nu + 2)]
    # the edges: round the border, front to back
    ring = [(i, 0) for i in range(nu)] + [(nu, j) for j in range(nv)] + [(i, nv) for i in range(nu, 0, -1)] + [(0, j) for j in range(nv, 0, -1)]
    for k in range(len(ring)):
        (i0, j0), (i1, j1) = ring[k], ring[(k + 1) % len(ring)]
        a, b = j0 * (nu + 1) + i0, j1 * (nu + 1) + i1
        faces += [(a, W + a, W + b), (a, W + b, b)]
    mb.add(pts, cols, nrms, faces)


def skirts():
    """Skirts with folds, each its own part painted by the code (a dress's in the top's color, a skirt's in the
    bottom's): pressed pleats to the knee, soft gathers to the floor, a tutu's three ruffled layers."""
    sy = 0.86

    def make(mb, z_w, r_w, z_h, r_h, n, depth, flare=0.8, wob=0.0, nu=120, nv=16):
        def prof(v):
            t = 1 - v
            return r_w + (r_h - r_w) * t ** flare, z_w + (z_h - z_w) * t

        def mod(u, v):
            t = 1 - v
            return 1 + depth * t ** 1.2 * math.cos(u * math.tau * n) + wob * t * math.sin(u * math.tau * 3 + 1.3)

        def col(p, nn, u, v):
            valley = 0.5 - 0.5 * math.cos(u * math.tau * n)
            band = 1.0 if v > 0.93 else 0.0
            return grey(0.94 - 0.16 * valley * (1 - v) ** 1.1 - 0.12 * max(0.0, -nn.z) - 0.05 * band)
        surf(mb, revolve(prof, sy=sy, mod=mod), col, nu=nu, nv=nv, caps=(True, True))
    make(part('skirt_knee', 'skirt'), 0.318, 0.108, 0.168, 0.168, 12, 0.07)
    make(part('skirt_floor', 'skirt'), 0.318, 0.108, 0.034, 0.205, 14, 0.05, flare=0.9, wob=0.025)
    tutu = part('skirt_tutu', 'skirt')
    for z_w, z_h, r_h in ((0.31, 0.275, 0.2), (0.3, 0.262, 0.218), (0.29, 0.25, 0.192)):
        make(tutu, z_w, 0.11, z_h, r_h, 26, 0.09, flare=0.6, nu=156, nv=8)


def strap_top():
    """A top with bare shoulders (a sundress, a gown, a party dress, a swimsuit): the body cut across above the chest
    with a rolled edge, the shoulders and neck in skin, thin straps over them."""
    sy = 0.84
    pts = [(0.0, 0.262), (0.112, 0.262), (0.121, 0.275), (0.124, 0.30), (0.119, 0.35), (0.110, 0.41), (0.104, 0.46), (0.102, 0.484), (0.07, 0.49), (0.0, 0.492)]

    def prof(v):
        x = v * (len(pts) - 1)
        i = min(len(pts) - 2, int(x))
        t = x - i
        t = t * t * (3 - 2 * t)
        a, b = pts[i], pts[i + 1]
        return a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t
    mb = part('torso_strap', 'top')
    surf(mb, revolve(prof, sy=sy), lambda p, n, u, v: grey(0.94 - 0.1 * max(0.0, -n.z) ** 2), nu=56, nv=24, caps=(True, True))

    def ring(u, v):
        th, ph = u * math.tau, v * math.tau
        R, r = 0.103, 0.0045
        rr = R + r * math.cos(ph)
        return Vector((math.cos(th) * rr, math.sin(th) * rr * sy, 0.485 + r * math.sin(ph)))
    surf(mb, ring, lambda p, n, u, v: grey(0.88 - 0.1 * max(0.0, -n.z)), nu=64, nv=8, caps=(False, False))
    chest = [(0.0, 0.47), (0.099, 0.47), (0.1, 0.49), (0.094, 0.525), (0.078, 0.548), (0.052, 0.562), (0.0, 0.566)]

    def cprof(v):
        x = v * (len(chest) - 1)
        i = min(len(chest) - 2, int(x))
        t = x - i
        a, b = chest[i], chest[i + 1]
        return (a[0] + (b[0] - a[0]) * t) * 0.99, a[1] + (b[1] - a[1]) * t
    surf(part('chest', 'skin'), revolve(cprof, sy=sy), lambda p, n, u, v: grey(0.96 - 0.08 * max(0.0, -n.z) ** 2), nu=48, nv=14, caps=(True, True))
    st = part('straps', 'top')
    for s in (-1, 1):
        x = s * 0.062
        zt = shoulder_z(x) + 0.004
        path = [on_body(s * 0.055, 0.484, 0.002, sy=sy), on_body(s * 0.06, 0.52, 0.003, sy=sy), Vector((x, 0.0, zt)), on_body(s * 0.06, 0.52, 0.003, True, sy),
                on_body(s * 0.055, 0.484, 0.002, True, sy)]
        tube(st, path, 0.006, lambda p, n: grey(0.9 - 0.1 * max(0.0, -n.z)), seg=8)


def bib():
    """Overalls: a bib on the chest in the trousers' color, a pocket stitched on it, straps over the shoulders crossing
    at the back, a brass button where each strap meets the bib."""
    mb = part('bib', 'bottom')
    z0, z1 = 0.302, 0.47

    def P(u, v):
        w = 0.066 - 0.012 * v
        return on_body((u * 2 - 1) * w, z0 + (z1 - z0) * v, 0.007)

    def col(p, n, u, v):
        # (stitching just in from the edges, and round the pocket)
        line = max(math.exp(-((min(u, 1 - u) - 0.07) / 0.025) ** 2), math.exp(-((1 - v - 0.07) / 0.03) ** 2))
        if 0.24 < u < 0.76 and 0.32 < v < 0.8:
            line = max(line, math.exp(-((min(u - 0.24, 0.76 - u)) / 0.02) ** 2), math.exp(-((v - 0.32) / 0.03) ** 2))
        return grey(0.9 - 0.2 * line - 0.1 * max(0.0, -n.z))
    panel(mb, P, 0.006, col, nu=14, nv=14)
    for s in (-1, 1):
        x = s * 0.07
        zt = shoulder_z(x) + 0.01
        path = [on_body(s * 0.052, 0.466, 0.01), on_body(s * 0.058, 0.51, 0.01), on_body(s * 0.066, 0.54, 0.01), Vector((x, 0.0, zt)), on_body(s * 0.064, 0.54, 0.01, True),
                on_body(s * 0.05, 0.49, 0.01, True), on_body(-s * 0.005, 0.42, 0.01, True), on_body(-s * 0.05, 0.32, 0.009, True)]
        tube(mb, path, 0.0085, lambda p, n: grey(0.86 - 0.12 * max(0.0, -n.z)), seg=8)
        ball(part('bib', 'metal'), on_body(s * 0.051, 0.461, 0.016), (0.011, 0.006, 0.011), lambda p, n: grey(BRASS - 0.2 * max(0.0, -n.z)), sub=2)


def hoodie():
    """A hoodie: the hood bunched behind the neck (fullest at the back, its ends tucked in at the collar), the pocket
    across the tummy, two drawstrings."""
    def P(u, v):
        a = 0.62 + (math.tau - 1.24) * v
        back = (1 - math.cos(a)) / 2
        R = 0.07 + 0.016 * back
        r = (0.016 + 0.024 * back) * math.sin(math.pi * v) ** 0.45
        zc = 0.558 + 0.014 * back - 0.02 * back ** 3
        rad = Vector((math.sin(a), -math.cos(a) * 0.92, 0))
        c = Vector((0, 0, zc)) + rad * R + Vector((0, 0.012 * back ** 2, 0))
        ph = u * math.tau
        return c + rad * (math.cos(ph) * r * 1.15) + Vector((0, 0, math.sin(ph) * r))

    def col(p, n, u, v):
        # (the opening, toward the neck, in shadow)
        ins = max(0.0, math.cos(u * math.tau + math.pi)) * math.sin(math.pi * v)
        return grey(0.93 - 0.2 * ins ** 2 - 0.1 * max(0.0, -n.z))
    surf(part('hood', 'top'), P, col, nu=20, nv=48, caps=(True, True))
    pk = part('pocket_h', 'top')
    z0, z1 = 0.282, 0.36

    def Q(u, v):
        w = 0.072 - 0.016 * v
        return on_body((u * 2 - 1) * w, z0 + (z1 - z0) * v, 0.005)

    def pcol(p, n, u, v):
        # (the openings at its sides, slanting)
        side = math.exp(-((min(u, 1 - u) - 0.1 - 0.12 * (1 - v)) / 0.03) ** 2) if v > 0.15 else 0.0
        return grey(0.92 - 0.3 * side - 0.08 * max(0.0, -n.z))
    panel(pk, Q, 0.005, pcol, nu=12, nv=8)
    cd = part('cord', 'trim')
    for s in (-1, 1):
        a, b = on_body(s * 0.018, 0.548, 0.008), on_body(s * 0.024, 0.47, 0.01)
        tube(cd, [a, a.lerp(b, 0.5) + Vector((s * 0.002, -0.002, 0)), b], 0.0042, lambda p, n: grey(0.92), seg=6)
        ball(cd, b + Vector((0, 0, -0.006)), (0.0055, 0.0055, 0.008), lambda p, n: grey(0.8), sub=2)


def fastenings():
    """Buttons down the front (pajamas, a raincoat; two rows on a chef's jacket), a belt with its buckle, an obi with
    its bow at the back, a sash, a cardigan's open front, a pointed collar."""
    for name, xs in (('buttons', (0.0,)), ('buttons2', (-0.034, 0.034))):
        mb = part(name, 'trim')
        for x in xs:
            for z in (0.525, 0.475, 0.425, 0.375):
                ball(mb, on_body(x, z, 0.003), (0.0095, 0.005, 0.0095), lambda p, n: grey(0.92 - 0.18 * max(0.0, -n.z)), sub=2)

    def band(mb, z0, z1, r, col, nu=72):
        def prof(v):
            return r + 0.002 * math.sin(v * math.pi), z0 + (z1 - z0) * v
        surf(mb, revolve(prof, sy=0.86), col, nu=nu, nv=6, caps=(True, True))
    band(part('belt', 'belt'), 0.3, 0.326, 0.131, lambda p, n, u, v: grey(0.9 - 0.15 * max(0.0, -n.z)))
    m = len(part('belt', 'metal').v)
    rbox(part('belt', 'metal'), -0.02, -0.004, -0.016, 0.02, 0.004, 0.016, lambda p, n: grey(BRASS - 0.15 * max(0.0, -n.z)), r=0.004, mid=0)
    xform(part('belt', 'metal'), m, Matrix.Translation(Vector((0, -0.131 * 0.86 - 0.004, 0.313))))
    for name, z0, z1, big in (('obi', 0.29, 0.372, 1.0), ('sash', 0.302, 0.33, 0.6)):
        mb = part(name, 'trim')
        band(mb, z0, z1, 0.133, lambda p, n, u, v: grey(0.92 - 0.06 * (0.5 - 0.5 * math.cos(v * math.tau * 2)) - 0.12 * max(0.0, -n.z)))
        c = Vector((0, 0.133 * 0.86 + 0.012 * big, (z0 + z1) / 2))
        for s in (-1, 1):
            ball(mb, c + Vector((s * 0.034 * big, 0.006, 0.006 * big)), (0.034 * big, 0.016 * big, 0.024 * big), lambda p, n: grey(0.9 - 0.12 * max(0.0, -n.z)), sub=3)
        ball(mb, c + Vector((0, 0.012, 0)), (0.016 * big, 0.016 * big, 0.02 * big), lambda p, n: grey(0.84), sub=2)
        if big > 0.8:
            for s in (-1, 1):
                tube(mb, [c + Vector((s * 0.01, 0.014, -0.01)), c + Vector((s * 0.026, 0.02, -0.06)), c + Vector((s * 0.03, 0.022, -0.1))], 0.012, lambda p, n: grey(0.88), seg=8, r1=0.009)
    cg = part('cardigan', 'trim')
    for s in (-1, 1):
        def P(u, v, s=s):
            z = 0.262 + (0.55 - 0.262) * v
            x0 = 0.006 + 0.03 * max(0.0, (v - 0.62) / 0.38)
            x = s * (x0 + 0.018 * (u if s > 0 else 1 - u))
            return on_body(x, z, 0.004)
        panel(cg, P, 0.004, lambda p, n, u, v: grey(0.9 - 0.1 * max(0.0, -n.z)), nu=4, nv=18)
    for z in (0.45, 0.4, 0.35, 0.3):
        ball(cg, on_body(0.015, z, 0.009), (0.007, 0.004, 0.007), lambda p, n: grey(0.7), sub=2)
    cp = part('collar_pt', 'trim')
    for s in (-1, 1):
        # (each flap from the back of the neck round to its point on the chest, lying on the shoulders)
        def P(u, v, s=s):
            a = s * (0.25 + 2.2 * (1 - v))                  # round the neck, from the front (v 1) toward the back
            t = u if s > 0 else 1 - u                       # across the flap, from the neck out
            r0 = 0.06
            z = 0.556 - 0.004 * t
            p = Vector((math.sin(a) * (r0 + 0.026 * t), -math.cos(a) * (r0 + 0.026 * t) * 0.9, z))
            if v > 0.75:
                # (the point: down onto the chest)
                k = (v - 0.75) / 0.25
                p = p.lerp(Vector((s * (0.034 + 0.018 * t), 0, 0.506 + 0.03 * t * (1 - k))), k * 0.9)
                p.y = on_body(p.x, p.z, 0.006).y
            return p
        panel(cp, P, 0.004, lambda p, n, u, v: grey(0.94 - 0.1 * max(0.0, -n.z)), nu=4, nv=20)


def cape():
    """A cape from the shoulders to below the knees, falling in folds, a rolled collar along its top."""
    mb = part('cape', 'trim')

    def P(u, v):
        t = 1 - v
        w = 0.11 + 0.07 * t
        x = (1 - 2 * u) * w
        z = 0.548 - 0.4 * t
        y = on_body(min(abs(x), body_r(max(0.3, z)) * 0.9), max(0.3, z), 0.008, True).y if t < 0.5 else 0.0
        y = max(y, 0.1 + 0.05 * t) + 0.01 * math.cos((1 - 2 * u) * math.pi * 3) * t
        return Vector((x, y, z))
    panel(mb, P, 0.007, lambda p, n, u, v: grey(0.92 - 0.12 * (0.5 - 0.5 * math.cos((1 - 2 * u) * math.pi * 3)) * (1 - v) - 0.1 * max(0.0, -n.z)), nu=24, nv=20)
    tube(mb, [on_body(x, 0.552, 0.01, True) if abs(x) < 0.07 else Vector((x, 0.03, 0.548)) for x in (-0.1, -0.07, -0.035, 0.0, 0.035, 0.07, 0.1)], 0.01, lambda p, n: grey(0.86), seg=8)


# ---------------------------------------------------------------- hair
def lock(mb, path, w0, w1, t0, t1, col=lambda p, n, s: grey(0.9), seg=14, nv=40, flat_to=None, curl_tip=True):
    """One lock of hair along a smooth path (Catmull-Rom through the points): a flattened tube, w wide and t thick from
    root to tip (rounding to a soft point), its flat face toward flat_to (the head's middle) so it lies on the head."""
    P = [Vector(p) for p in path]
    pts = [P[0] + (P[0] - P[1])] + P + [P[-1] + (P[-1] - P[-2])]

    def at(s):
        x = s * (len(P) - 1)
        i = min(len(P) - 2, int(x))
        t = x - i
        p0, p1, p2, p3 = pts[i], pts[i + 1], pts[i + 2], pts[i + 3]
        return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t)
    ring_pts, ring_n, ring_c, faces = [], [], [], []
    flat = Vector(flat_to) if flat_to is not None else None
    samples = []
    LOCKS.append(samples)
    for j in range(nv + 1):
        s = j / nv
        c = at(s)
        d = (at(min(1, s + 0.01)) - at(max(0, s - 0.01))).normalized()
        out = (c - flat) if flat is not None else Vector((0, -1, 0))
        out = (out - d * out.dot(d)).normalized()
        side = d.cross(out).normalized()
        # (full at the root, a soft point at the tip)
        taper = 1.0 if s < 0.6 else math.cos((s - 0.6) / 0.4 * math.pi / 2) ** 0.7
        if s < 0.04:
            taper *= 0.55 + 0.45 * s / 0.04
        w = (w0 + (w1 - w0) * s) * max(0.05, taper)
        t = (t0 + (t1 - t0) * s) * max(0.12, taper)
        samples.append((c.copy(), w))
        for i in range(seg):
            th = i / seg * math.tau
            cs, sn = math.cos(th), math.sin(th)
            p = c + side * (cs * w) + out * (sn * t)
            n = (side * (cs / max(w, 1e-5)) + out * (sn / max(t, 1e-5))).normalized()
            ring_pts.append(p); ring_n.append(n); ring_c.append(col(p, n, s))
    for j in range(nv):
        for i in range(seg):
            a, b = j * seg + i, j * seg + (i + 1) % seg
            faces += [(a, b, b + seg), (a, b + seg, a + seg)]
    mb.add(ring_pts, ring_c, ring_n, faces)
    # (closed at both ends, so it melts as a solid)
    for j, sgn in ((0, -1), (nv, 1)):
        ring = ring_pts[j * seg:(j + 1) * seg]
        c = sum(ring, Vector()) / seg
        d = (at(min(1, j / nv + 0.01)) - at(max(0, j / nv - 0.01))).normalized() * sgn
        mb.add([c] + ring, [col(c, d, j / nv)] + ring_c[j * seg:(j + 1) * seg], [d] * (seg + 1), [(0, 1 + i, 1 + (i + 1) % seg) for i in range(seg)])


def shell(mb, zline, r_out=1.1, r_in=0.94, nu=72, nv=20, col=lambda p, n, u, v: grey(0.9), wob=0.03):
    """The hair's base: a thick closed shell over the head down to a hairline (zline(a): its height in head radii at
    angle a from the front), so the locks melt onto a solid."""
    def pt(u, v, r):
        th = u * math.tau
        a = abs(((th + math.pi / 2 + math.pi) % math.tau) - math.pi)          # (0 at the front, -y; pi at the back)
        z0 = math.asin(max(-0.99, min(0.99, zline(a))))
        ph = z0 + (math.pi / 2 - z0) * v
        x, y, z = math.cos(ph) * math.cos(th), math.cos(ph) * math.sin(th), math.sin(ph)
        rr = r * (1 + wob * noise.noise(Vector((x * 2.5, y * 2.5, z * 2.5)))) if r > 1 else r
        return H(x * rr * 1.02, y * rr * 0.99, z * rr * 1.03)
    surf(mb, lambda u, v: pt(u, v, r_out), col, nu=nu, nv=nv, caps=(False, True))
    # (the inside, facing in)
    inner = MB()
    surf(inner, lambda u, v: pt(u, v, r_in), col, nu=nu, nv=nv, caps=(False, True))
    inner.n = [-n for n in inner.n]
    mb.add(inner.v, inner.c, inner.n, inner.f)
    # the rim along the hairline
    P, N, C, F = [], [], [], []
    for i in range(nu):
        u = i / nu
        a, b = pt(u, 0, r_out), pt(u, 0, r_in)
        n = (a - pt(u, 0.05, r_out)).normalized()
        P += [a, b]; N += [n, n]; C += [col(a, n, u, 0)] * 2
    for i in range(nu):
        a, b, c, d = 2 * i, 2 * i + 1, 2 * ((i + 1) % nu), 2 * ((i + 1) % nu) + 1
        F += [(a, c, d), (a, d, b)]
    mb.add(P, C, N, F)


LOCKS = []       # each lock's centre line as it's made: [(point, half width)...], for the grooves between locks


def H(x, y, z):
    """A point round the head, in head radii from its middle."""
    return HEAD + Vector((x, y, z)) * HR


def hair_waves():
    """Sarah's hair: a side part, chunky bangs swept across the forehead, wavy locks framing the face to the shoulders,
    and a full back that falls in waves, the ends curling."""
    mb = MB()
    C = HEAD
    LOCKS.clear()
    # the base over the head, down to a hairline: high on the forehead, down at the temples, low at the nape
    def zline(a):
        pts = [(0.0, 0.58), (0.6, 0.48), (1.1, 0.2), (1.5, -0.05), (2.1, -0.4), (math.pi, -0.62)]
        for (a0, z0), (a1, z1) in zip(pts, pts[1:]):
            if a <= a1:
                t = (a - a0) / (a1 - a0)
                return z0 + (z1 - z0) * (t * t * (3 - 2 * t))
        return pts[-1][1]
    shell(mb, zline)
    # bangs: four chunky locks from the part (her right, the viewer's left) swept across the forehead
    part_x = 0.36
    bangs = [
        ([H(part_x, -0.25, 1.02), H(0.1, -0.78, 0.82), H(-0.3, -0.98, 0.52), H(-0.62, -0.86, 0.34)], 0.34, 0.2),
        ([H(part_x + 0.05, -0.35, 1.0), H(0.32, -0.86, 0.72), H(0.12, -1.02, 0.45), H(-0.05, -1.03, 0.3)], 0.3, 0.18),
        ([H(part_x + 0.12, -0.3, 0.98), H(0.6, -0.78, 0.66), H(0.52, -0.92, 0.42), H(0.42, -0.94, 0.3)], 0.26, 0.16),
        ([H(part_x - 0.1, -0.2, 1.03), H(-0.35, -0.6, 0.9), H(-0.78, -0.7, 0.55), H(-0.92, -0.5, 0.3)], 0.3, 0.18),
    ]
    for path, w, t in bangs:
        lock(mb, path, w * HR, w * HR * 0.8, t * HR, t * HR * 0.7, flat_to=C, nv=28)
    # the locks framing the face, each side: from above the temple, down over the ear, falling to the chest in a soft S,
    # the ends turning in
    for s in (-1, 1):
        lock(mb, [H(s * 0.55, -0.55, 0.7), H(s * 0.93, -0.5, 0.3), H(s * 1.0, -0.42, -0.25), H(s * 0.92, -0.45, -0.75),
                  H(s * 0.95, -0.5, -1.15), H(s * 0.8, -0.62, -1.4)], 0.34 * HR, 0.3 * HR, 0.2 * HR, 0.17 * HR, flat_to=C + Vector((0, 0.1, 0)), nv=44)
        lock(mb, [H(s * 0.68, -0.18, 0.72), H(s * 1.06, -0.18, 0.25), H(s * 1.1, -0.12, -0.3), H(s * 1.02, -0.15, -0.85),
                  H(s * 1.06, -0.2, -1.25), H(s * 0.95, -0.3, -1.5)], 0.4 * HR, 0.36 * HR, 0.24 * HR, 0.2 * HR, flat_to=C + Vector((0, 0.15, 0)), nv=44)
        lock(mb, [H(s * 0.64, 0.26, 0.74), H(s * 1.08, 0.3, 0.2), H(s * 1.12, 0.35, -0.4), H(s * 1.06, 0.38, -0.95),
                  H(s * 1.1, 0.3, -1.35), H(s * 1.0, 0.18, -1.55)], 0.42 * HR, 0.38 * HR, 0.26 * HR, 0.2 * HR, flat_to=C + Vector((0, 0.2, 0)), nv=44)
    # the back: locks from the crown down over the back of the head, falling in waves below the shoulders
    for i in range(7):
        a = -0.95 + 1.9 * i / 6
        x0 = math.sin(a) * 0.7
        wave = 0.08 * (1 if i % 2 else -1)
        lock(mb, [H(x0 * 0.4, 0.35, 1.0), H(x0 * 1.1, 0.98, 0.4), H(x0 * 1.2 + wave, 1.1, -0.25), H(x0 * 1.18 - wave, 1.05, -0.85),
                  H(x0 * 1.22 + wave, 1.0, -1.3), H(x0 * 1.15, 0.88, -1.6)], 0.46 * HR, 0.42 * HR, 0.26 * HR, 0.2 * HR, flat_to=C + Vector((0, -0.05, 0.1)), nv=44)
    return mb


def comma(mb, rng, d, rc, c0, turn=None):
    """A curl: a short lock that winds once round (a little less) about c0, shrinking, lying across the way d points (out
    from the head), lifted in the middle, so a melted mass of them reads as curls, not as a pile of balls."""
    d = d.normalized()
    t1 = d.cross(Vector((0, 0, 1)))
    t1 = t1.normalized() if t1.length > 1e-3 else Vector((1, 0, 0))
    t2 = d.cross(t1).normalized()
    a0 = rng.uniform(0, math.tau) if turn is None else turn
    path = []
    for k in range(7):
        f = k / 6
        th = a0 + f * 4.0
        r = rc * (1 - 0.45 * f) * HR
        path.append(c0 + (t1 * math.cos(th) + t2 * math.sin(th)) * r + d * HR * 0.05 * math.sin(f * math.pi))
    w = rc * 1.15
    lock(mb, path, w * HR, w * HR * 0.6, w * 0.75 * HR, w * 0.5 * HR, flat_to=HEAD, nv=20, seg=10)


def hair_joecut():
    """Joe's curls, cut as a boy's: short and close at the sides and back (his ears show, sideburns in front of them),
    the curls on top, fullest at the front and tumbling a little onto the forehead. Each curl is a short lock wound into
    a comma lying on the head, so the melted mass reads as curls, not as a pile of balls."""
    mb = MB()
    LOCKS.clear()
    def zline(a):
        pts = [(0.0, 0.6), (0.7, 0.5), (1.05, 0.34), (1.2, -0.12), (1.34, 0.2), (1.85, 0.16), (2.4, -0.18), (math.pi, -0.42)]
        for (a0, z0), (a1, z1) in zip(pts, pts[1:]):
            if a <= a1:
                t = (a - a0) / (a1 - a0)
                return z0 + (z1 - z0) * (t * t * (3 - 2 * t))
        return pts[-1][1]
    shell(mb, zline, r_out=1.045, wob=0.015)
    rng = random.Random(12)

    def curl(d, rc, lift=1.1, turn=None, droop=0.0):
        comma(mb, rng, d, rc, HEAD + d.normalized() * HR * lift + Vector((0, 0, -droop * HR)), turn)
    # the top: curls spread evenly (golden angle) over the head above the hairline, smaller toward the sides and back
    n = 42
    for i in range(n):
        t = (i + 0.5) / n
        z = 1 - t * 0.82
        th = i * 2.39996
        rr = math.sqrt(max(0.0, 1 - z * z))
        d = Vector((math.cos(th) * rr, math.sin(th) * rr, z))
        a = abs(((th + math.pi / 2 + math.pi) % math.tau) - math.pi)
        if z < zline(a) + 0.2:
            continue
        # (short at the sides and back: the curls there small and close to the head)
        side = max(0.0, min(1.0, (z - 0.25) / 0.45))
        back = max(0.0, d.y)
        rc = (0.2 + 0.05 * rng.random()) * (0.6 + 0.4 * side) * (1 - 0.25 * back)
        curl(d, rc, lift=1.04 + 0.06 * side * (1 - 0.6 * back))
    # the front: a row of curls along the hairline, tumbling onto the forehead
    for x, z, rc in ((-0.48, 0.56, 0.18), (-0.14, 0.63, 0.21), (0.22, 0.62, 0.2), (0.55, 0.52, 0.16)):
        d = Vector((x, -math.sqrt(max(0.0, 1.0 - x * x - z * z)), z))
        curl(d, rc, lift=1.06, droop=0.06)
    # sideburns, short, in front of the ears
    for s in (-1, 1):
        lock(mb, [H(s * 0.84, -0.42, 0.36), H(s * 0.94, -0.34, 0.1), H(s * 0.98, -0.3, -0.12)], 0.11 * HR, 0.08 * HR, 0.06 * HR, 0.05 * HR,
             flat_to=HEAD, nv=12, seg=10)
    return mb


def men_line(a):
    """A man's hairline: high at the forehead, in at the temples, up over the ears (they show), low at the nape."""
    pts = [(0.0, 0.6), (0.7, 0.5), (1.05, 0.34), (1.2, -0.1), (1.34, 0.2), (1.85, 0.16), (2.4, -0.18), (math.pi, -0.42)]
    for (a0, z0), (a1, z1) in zip(pts, pts[1:]):
        if a <= a1:
            t = (a - a0) / (a1 - a0)
            return z0 + (z1 - z0) * (t * t * (3 - 2 * t))
    return pts[-1][1]


def hair_davidcut():
    """David's: a quiff, swept up off his forehead and back over his crown, highest at the front; the sides short and
    brushed back, his ears showing."""
    mb = MB()
    LOCKS.clear()
    shell(mb, men_line, r_out=1.045, wob=0.015)
    C = HEAD
    for i in range(5):
        x = -0.5 + i / 4 * 1.0
        k = 1 - abs(x) * 0.45
        lock(mb, [H(x * 0.9, -0.8, 0.52), H(x * 0.95, -0.94, 0.9 * k + 0.1), H(x * 0.88, -0.52, 1.16 * k + 0.08), H(x * 0.8, 0.1, 1.14), H(x * 0.7, 0.62, 0.95)],
             0.32 * HR, 0.26 * HR, 0.2 * HR, 0.12 * HR, flat_to=C, nv=30)
    for s in (-1, 1):
        for j in range(2):
            z = 0.55 - j * 0.22
            lock(mb, [H(s * 0.82, -0.5 + j * 0.1, z), H(s * 1.02, 0.0, z + 0.05), H(s * 0.92, 0.55, z - 0.05), H(s * 0.6, 0.85, z - 0.1)], 0.28 * HR, 0.22 * HR, 0.1 * HR, 0.08 * HR, flat_to=C, nv=24, curl_tip=False)
    for i in range(4):
        x = -0.45 + i * 0.3
        lock(mb, [H(x, 0.55, 0.85), H(x * 1.05, 0.95, 0.35), H(x * 0.95, 0.95, -0.15)], 0.3 * HR, 0.24 * HR, 0.1 * HR, 0.07 * HR, flat_to=C, nv=20, curl_tip=False)
    return mb


def hair_jamescut():
    """James's: short and a little tousled, parted on his left, the top swept over to his right with the ends lifting, a
    few locks of fringe at his forehead; short at the sides."""
    mb = MB()
    LOCKS.clear()
    shell(mb, men_line, r_out=1.045, wob=0.02)
    C = HEAD
    px = 0.38
    for i in range(6):
        y0 = -0.62 + i * 0.25
        lock(mb, [H(px, y0, 1.0), H(0.05, y0 - 0.12, 1.12), H(-0.45, y0 - 0.15, 0.95), H(-0.82, y0 - 0.05, 0.62)], 0.3 * HR, 0.26 * HR, 0.17 * HR, 0.11 * HR, flat_to=C, nv=26)
    for i in range(4):
        y0 = -0.5 + i * 0.3
        lock(mb, [H(px + 0.04, y0, 0.98), H(0.78, y0 + 0.02, 0.78), H(0.98, y0 + 0.1, 0.42)], 0.26 * HR, 0.22 * HR, 0.12 * HR, 0.09 * HR, flat_to=C, nv=20)
    for (x0, x1) in ((0.22, -0.18), (0.0, -0.42), (-0.25, -0.62)):
        lock(mb, [H(x0, -0.65, 0.88), H((x0 + x1) / 2, -0.95, 0.66), H(x1, -0.98, 0.5)], 0.22 * HR, 0.18 * HR, 0.14 * HR, 0.1 * HR, flat_to=C, nv=18)
    for i in range(4):
        x = -0.45 + i * 0.3
        lock(mb, [H(x, 0.5, 0.88), H(x * 1.05, 0.95, 0.35), H(x * 0.95, 0.95, -0.15)], 0.3 * HR, 0.24 * HR, 0.11 * HR, 0.07 * HR, flat_to=C, nv=20, curl_tip=False)
    return mb


def hair_johncut():
    """John's: short and neat, combed over from a side part on his right, a smooth fringe swept across above his brows."""
    mb = MB()
    LOCKS.clear()
    shell(mb, men_line, r_out=1.04, wob=0.01)
    C = HEAD
    px = -0.4
    for i in range(6):
        y0 = -0.62 + i * 0.25
        lock(mb, [H(px, y0, 1.0), H(0.05, y0 - 0.1, 1.08), H(0.5, y0 - 0.1, 0.92), H(0.86, y0, 0.58)], 0.32 * HR, 0.28 * HR, 0.12 * HR, 0.08 * HR, flat_to=C, nv=26, curl_tip=False)
    lock(mb, [H(-0.42, -0.6, 0.92), H(0.0, -0.95, 0.72), H(0.48, -0.92, 0.6), H(0.72, -0.72, 0.52)], 0.3 * HR, 0.22 * HR, 0.14 * HR, 0.09 * HR, flat_to=C, nv=24, curl_tip=False)
    for i in range(3):
        y0 = -0.4 + i * 0.35
        lock(mb, [H(px - 0.02, y0, 0.98), H(-0.8, y0 + 0.02, 0.76), H(-0.97, y0 + 0.1, 0.42)], 0.28 * HR, 0.24 * HR, 0.1 * HR, 0.07 * HR, flat_to=C, nv=20, curl_tip=False)
    for i in range(4):
        x = -0.45 + i * 0.3
        lock(mb, [H(x, 0.5, 0.88), H(x * 1.05, 0.95, 0.35), H(x * 0.95, 0.95, -0.15)], 0.3 * HR, 0.24 * HR, 0.1 * HR, 0.07 * HR, flat_to=C, nv=20, curl_tip=False)
    return mb


def hair_sleek():
    """Elizabeth's: long and straight from a middle part, framing her face and falling well past her shoulders, the ends
    softly turned in."""
    mb = MB()
    LOCKS.clear()

    def zline(a):
        pts = [(0.0, 0.6), (0.6, 0.5), (1.1, 0.22), (1.5, -0.05), (2.1, -0.4), (math.pi, -0.62)]
        for (a0, z0), (a1, z1) in zip(pts, pts[1:]):
            if a <= a1:
                t = (a - a0) / (a1 - a0)
                return z0 + (z1 - z0) * (t * t * (3 - 2 * t))
        return pts[-1][1]
    shell(mb, zline, wob=0.015)
    C = HEAD
    for s in (-1, 1):
        lock(mb, [H(s * 0.06, -0.55, 1.0), H(s * 0.55, -0.78, 0.72), H(s * 0.92, -0.58, 0.2), H(s * 0.98, -0.48, -0.55), H(s * 0.95, -0.45, -1.3), H(s * 0.85, -0.5, -1.55)],
             0.38 * HR, 0.32 * HR, 0.18 * HR, 0.14 * HR, flat_to=C + Vector((0, 0.1, 0)), nv=44)
        lock(mb, [H(s * 0.1, -0.2, 1.02), H(s * 0.72, -0.25, 0.8), H(s * 1.06, -0.18, 0.2), H(s * 1.1, -0.12, -0.6), H(s * 1.06, -0.15, -1.4), H(s * 0.96, -0.25, -1.62)],
             0.42 * HR, 0.36 * HR, 0.22 * HR, 0.17 * HR, flat_to=C + Vector((0, 0.15, 0)), nv=44)
        lock(mb, [H(s * 0.1, 0.2, 1.0), H(s * 0.7, 0.3, 0.75), H(s * 1.08, 0.32, 0.1), H(s * 1.1, 0.35, -0.7), H(s * 1.06, 0.3, -1.45), H(s * 0.98, 0.18, -1.66)],
             0.44 * HR, 0.38 * HR, 0.24 * HR, 0.18 * HR, flat_to=C + Vector((0, 0.2, 0)), nv=44)
    for i in range(7):
        a = -0.95 + 1.9 * i / 6
        x0 = math.sin(a) * 0.7
        lock(mb, [H(x0 * 0.2, 0.4, 1.0), H(x0 * 1.05, 0.98, 0.42), H(x0 * 1.15, 1.08, -0.3), H(x0 * 1.15, 1.04, -1.0), H(x0 * 1.12, 0.98, -1.5), H(x0 * 1.05, 0.88, -1.72)],
             0.46 * HR, 0.42 * HR, 0.24 * HR, 0.18 * HR, flat_to=C + Vector((0, -0.05, 0.1)), nv=44)
    return mb


def beard_full():
    """A full beard, as David has: a soft mass along his jaw from below his ears to his chin, fuller at the chin, and a
    mustache over his lip; it stays low on his face, the mouth left clear so the painted one shows."""
    mb = MB()
    LOCKS.clear()
    C = HEAD

    def jaw(a, z, out=1.04):
        r = math.sqrt(max(0.0, 1 - z * z)) * out
        return H(math.sin(a) * r * 1.05, -math.cos(a) * r, z)
    for s in (-1, 1):
        # (up the cheek to meet the sideburn in front of the ear, so it reads as a beard, not a strap round the jaw)
        lock(mb, [jaw(s * 1.5, 0.22), jaw(s * 1.42, -0.1), jaw(s * 1.18, -0.44), jaw(s * 0.86, -0.64)], 0.4 * HR, 0.36 * HR, 0.17 * HR, 0.17 * HR, flat_to=C, nv=24, curl_tip=False)
        lock(mb, [jaw(s * 1.45, -0.05), jaw(s * 1.2, -0.42), jaw(s * 0.8, -0.74), jaw(s * 0.3, -0.92)], 0.4 * HR, 0.36 * HR, 0.19 * HR, 0.18 * HR, flat_to=C, nv=24, curl_tip=False)
        lock(mb, [jaw(s * 1.3, -0.3), jaw(s * 0.95, -0.66), jaw(s * 0.5, -0.88), jaw(s * 0.1, -1.0)], 0.34 * HR, 0.32 * HR, 0.19 * HR, 0.18 * HR, flat_to=C, nv=24, curl_tip=False)
        # (the lower cheek filled in toward the corner of the mouth, the mouth itself left clear)
        lock(mb, [jaw(s * 1.0, -0.4), jaw(s * 0.74, -0.6), jaw(s * 0.47, -0.8)], 0.32 * HR, 0.28 * HR, 0.15 * HR, 0.15 * HR, flat_to=C, nv=18, curl_tip=False)
        # the mustache: from under the nose out over the lip, the ends turned down a little
        lock(mb, [jaw(s * 0.03, -0.37, 1.05), jaw(s * 0.2, -0.4, 1.07), jaw(s * 0.38, -0.47, 1.06), jaw(s * 0.48, -0.58, 1.04)], 0.15 * HR, 0.1 * HR, 0.1 * HR, 0.07 * HR, flat_to=C, nv=16, curl_tip=False)
    # the chin, fullest
    lock(mb, [jaw(-0.5, -0.84), jaw(0.0, -1.04, 1.12), jaw(0.5, -0.84)], 0.44 * HR, 0.44 * HR, 0.22 * HR, 0.22 * HR, flat_to=C, nv=20, curl_tip=False)
    return mb


def mustache():
    """A mustache by itself, as David wears his now (David, 28 October): the full beard's, a little fuller, from under the
    nose out over the lip with the ends turned down, the chin and jaw bare."""
    mb = MB()
    LOCKS.clear()
    C = HEAD

    def jaw(a, z, out=1.04):
        r = math.sqrt(max(0.0, 1 - z * z)) * out
        return H(math.sin(a) * r * 1.05, -math.cos(a) * r, z)
    for s in (-1, 1):
        lock(mb, [jaw(s * 0.02, -0.35, 1.06), jaw(s * 0.2, -0.39, 1.09), jaw(s * 0.4, -0.47, 1.08), jaw(s * 0.52, -0.6, 1.05)], 0.19 * HR, 0.12 * HR, 0.12 * HR, 0.08 * HR, flat_to=C, nv=16, curl_tip=False)
    return mb


def hairline(*pts):
    """A hairline through (angle from the front, height in head radii) points, eased between them (for shell)."""
    def z(a):
        for (a0, z0), (a1, z1) in zip(pts, pts[1:]):
            if a <= a1:
                t = (a - a0) / (a1 - a0)
                return z0 + (z1 - z0) * (t * t * (3 - 2 * t))
        return pts[-1][1]
    return z


GIRL_LINE = hairline((0.0, 0.58), (0.6, 0.48), (1.1, 0.2), (1.5, -0.05), (2.1, -0.4), (math.pi, -0.62))


def around(a, z, r=1.04):
    """A point on the head at angle a round from the front (toward its right, +x) and height z, r head radii out."""
    rr = math.sqrt(max(0.0, 1 - z * z)) * r
    return H(math.sin(a) * rr, -math.cos(a) * rr, z)


def wrapped(mb, c, r, n=5, seed=3, w=0.34):
    """A knot of hair (a bun): n locks wound round a ball at c (r head radii), each a great circle at its own tilt, so
    the melted ball shows the turns."""
    rng = random.Random(seed)
    for k in range(n):
        ax = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-1, 1))).normalized()
        t1 = ax.cross(Vector((0, 0, 1)) if abs(ax.z) < 0.9 else Vector((1, 0, 0))).normalized()
        t2 = ax.cross(t1)
        a0 = rng.uniform(0, math.tau)
        path = [c + (t1 * math.cos(a0 + f * 5.2) + t2 * math.sin(a0 + f * 5.2)) * r * HR * 0.82 for f in (i / 8 for i in range(9))]
        lock(mb, path, w * r * HR * 2.2, w * r * HR * 1.6, 0.16 * r * HR * 2.2, 0.12 * r * HR * 2.2, flat_to=c, nv=26)


def tie(mb, c, d, r):
    """A hair tie: a thick band round the hair at c, facing the way d runs (part of the same mass; the grooves set it off)."""
    d = d.normalized()
    t1 = d.cross(Vector((0, 0, 1)) if abs(d.z) < 0.9 else Vector((1, 0, 0))).normalized()
    t2 = d.cross(t1)
    path = [c + (t1 * math.cos(f * math.tau) + t2 * math.sin(f * math.tau)) * r * HR for f in (i / 10 for i in range(11))]
    lock(mb, path, 0.1 * HR, 0.1 * HR, 0.07 * HR, 0.07 * HR, flat_to=c, nv=24, seg=10)


def hair_bob():
    """Chin length and blunt, a straight fringe across the forehead; full at the sides, the ends turning under."""
    mb = MB()
    LOCKS.clear()
    shell(mb, GIRL_LINE, wob=0.015)
    C = HEAD
    # the fringe: a row of locks from the crown forward, cut straight just above the brows
    for i in range(6):
        x = -0.62 + i * 0.25
        lock(mb, [H(x * 0.5, -0.1, 1.04), H(x * 0.85, -0.72, 0.86), H(x * 0.98, -0.98, 0.5), H(x * 1.0, -1.0, 0.36)], 0.3 * HR, 0.3 * HR, 0.18 * HR, 0.16 * HR, flat_to=C, nv=24)
    # the sides and back: from the crown down past the ears to the chin, full, the ends turned under toward the neck
    for i in range(11):
        a = 1.12 + i * (math.tau - 2.24) / 10
        x0, y0 = math.sin(a), -math.cos(a)
        lock(mb, [H(x0 * 0.25, y0 * 0.25 + 0.05, 1.03), H(x0 * 0.98, y0 * 0.98, 0.55), H(x0 * 1.14, y0 * 1.1, -0.1), H(x0 * 1.12, y0 * 1.08, -0.5),
                  H(x0 * 0.98, y0 * 0.94, -0.66)], 0.44 * HR, 0.42 * HR, 0.24 * HR, 0.22 * HR, flat_to=C + Vector((0, 0.05, 0.05)), nv=34)
    return mb


def hair_buzz():
    """Very short, close to the scalp: a cap that hugs the skull, the ears showing."""
    mb = MB()
    LOCKS.clear()
    shell(mb, men_line, r_out=1.03, r_in=0.95, wob=0.008)
    return mb


def hair_pixie():
    """Short, soft and cropped: feathered layers swept forward and to the side, a side-swept fringe, little points at
    the nape and before the ears."""
    mb = MB()
    LOCKS.clear()
    line = hairline((0.0, 0.58), (0.7, 0.48), (1.1, 0.25), (1.3, 0.02), (1.9, -0.05), (2.5, -0.3), (math.pi, -0.48))
    shell(mb, line, r_out=1.05, wob=0.015)
    C = HEAD
    # the top: layers from the crown, swept forward and over to her left
    for i in range(7):
        a = -1.6 + i * 0.53
        x0, y0 = math.sin(a) * 0.3, -math.cos(a) * 0.3 + 0.35
        lock(mb, [H(x0, y0, 1.02), H(x0 - 0.3, y0 - 0.45, 0.98), H(x0 - 0.55, y0 - 0.8, 0.72)], 0.32 * HR, 0.24 * HR, 0.16 * HR, 0.1 * HR, flat_to=C, nv=20)
    # the fringe swept across
    for (x0, x1, z1) in ((0.45, -0.25, 0.5), (0.25, -0.5, 0.44), (0.62, -0.02, 0.56)):
        lock(mb, [H(x0, -0.5, 0.9), H((x0 + x1) / 2, -0.92, 0.7), H(x1, -0.98, z1)], 0.26 * HR, 0.2 * HR, 0.14 * HR, 0.1 * HR, flat_to=C, nv=18)
    # feathered points: before the ears and at the nape
    for s in (-1, 1):
        lock(mb, [around(s * 1.15, 0.45, 1.05), around(s * 1.22, 0.05, 1.06), around(s * 1.24, -0.18, 1.05)], 0.16 * HR, 0.1 * HR, 0.08 * HR, 0.06 * HR, flat_to=C, nv=14, seg=10)
    for k in range(5):
        a = math.pi - 0.7 + k * 0.35
        lock(mb, [around(a, 0.1, 1.06), around(a + 0.03, -0.3, 1.06), around(a + 0.05, -0.52, 1.04)], 0.22 * HR, 0.12 * HR, 0.1 * HR, 0.06 * HR, flat_to=C, nv=14, seg=10)
    return mb


def hair_afro():
    """Big and round: one soft ball of coils (little curls all over it), the face set into it."""
    mb = MB()
    LOCKS.clear()
    shell(mb, hairline((0.0, 0.58), (0.7, 0.5), (1.2, 0.1), (1.6, -0.4), (math.pi, -0.6)), wob=0.01)
    rng = random.Random(21)
    c = H(0, 0.24, 0.3)
    R = (1.38, 1.24, 1.26)

    def clear_of_face(p, r):
        rel = (p - HEAD) / HR
        e = (abs(rel.x) / (0.94 + r)) ** 2 + ((rel.z + 0.05) / (0.68 + r)) ** 2
        return e > 1 or rel.y - r > 0.2
    # the mass: balls through the volume, none in front of the face
    for k in range(320):
        u = Vector((rng.gauss(0, 1), rng.gauss(0, 1), rng.gauss(0, 1))).normalized() * rng.random() ** 0.4
        p = c + Vector((u.x * R[0], u.y * R[1], u.z * R[2])) * HR * 0.86
        r = 0.32
        if clear_of_face(p, r):
            ball(mb, p, (r * HR, r * HR, r * HR), lambda q, n, *_: grey(0.9), sub=2)
    # the coils over its surface
    n = 150
    for i in range(n):
        t = (i + 0.5) / n
        z = 1 - 2 * t
        th = i * 2.39996
        rr = math.sqrt(max(0.0, 1 - z * z))
        d = Vector((math.cos(th) * rr, math.sin(th) * rr, z))
        p = c + Vector((d.x * R[0], d.y * R[1], d.z * R[2])) * HR * 0.97
        if (p - HEAD).z / HR < -0.75 or not clear_of_face(p, 0.2):
            continue
        comma(mb, rng, d, 0.16 + 0.04 * rng.random(), p)
    return mb


def hair_friar():
    """Bald on top, a ring of hair round the sides and back of the head, from the temples round the back: short soft
    locks falling from where the scalp shows, the ears peeping through."""
    mb = MB()
    LOCKS.clear()
    C = HEAD
    n = 15
    for k in range(n):
        a = 1.12 + k * (math.tau - 2.24) / (n - 1)
        top = 0.42 if abs(a - math.pi) < 1.4 else 0.34
        lock(mb, [around(a, top, 0.99), around(a + 0.04, top - 0.25, 1.04), around(a + 0.06, -0.12, 1.045), around(a + 0.07, -0.36, 1.02)],
             0.36 * HR, 0.32 * HR, 0.12 * HR, 0.1 * HR, flat_to=C, nv=22)
    return mb


def hair_mohawk():
    """Shaved sides (a close cap) and a tall crest of spikes from the forehead to the nape."""
    mb = MB()
    LOCKS.clear()
    shell(mb, men_line, r_out=1.025, r_in=0.95, wob=0.008)
    C = HEAD
    # the crest's base, along the middle
    lock(mb, [H(0, -0.62, 0.86), H(0, -0.1, 1.06), H(0, 0.5, 0.92), H(0, 0.92, 0.3)], 0.22 * HR, 0.2 * HR, 0.2 * HR, 0.16 * HR, flat_to=C, nv=30)
    # the spikes, leaning back, tallest over the crown
    for k in range(6):
        a = -0.75 + k * 0.42
        base = Vector((0, math.sin(a), math.cos(a)))
        lean = Vector((0, 0.35, 0.05))
        h = 0.55 + 0.25 * math.sin((k + 0.5) / 6 * math.pi)
        tip = base * (1.0 + h) + lean * h
        lock(mb, [H(*(base * 0.98)), H(*(base * (1.0 + h * 0.45) + lean * h * 0.3)), H(*tip)], 0.3 * HR, 0.1 * HR, 0.14 * HR, 0.06 * HR, flat_to=C + Vector((0.3 * HR, 0, 0)), nv=20)
    return mb


def hair_curls():
    """Big long curls with lots of volume: a cloud of curls on top, ringlets falling past the shoulders."""
    mb = MB()
    LOCKS.clear()
    shell(mb, GIRL_LINE, r_out=1.08, wob=0.02)
    rng = random.Random(31)
    # the cloud on top
    n = 46
    for i in range(n):
        t = (i + 0.5) / n
        z = 1 - t * 1.2
        th = i * 2.39996
        rr = math.sqrt(max(0.0, 1 - z * z))
        d = Vector((math.cos(th) * rr, math.sin(th) * rr, z))
        a = abs(((th + math.pi / 2 + math.pi) % math.tau) - math.pi)
        if z < GIRL_LINE(a) + 0.12:
            continue
        comma(mb, rng, d, 0.24 + 0.05 * rng.random(), HEAD + d * HR * 1.14)
    # ringlets: from about the ears down to the chest, each a spiral in short turns (one lock a turn, so they stay apart)
    for k in range(11):
        a = 1.25 + k * (math.tau - 2.5) / 10
        top = around(a, 0.2, 1.1)
        out = (top - HEAD).normalized()
        out.z = 0
        out.normalize()
        side = out.cross(Vector((0, 0, 1)))
        L = 1.35 + 0.15 * rng.random()
        turns = 4
        for tn in range(turns):
            pts = []
            for j in range(9):
                f = (tn + j / 8) / turns
                th = f * turns * math.tau + k
                rad = (0.17 - 0.05 * f) * HR
                pts.append(top + Vector((0, 0, -L * f * HR)) + out * (0.12 * HR * f) + (out * math.cos(th) + side * math.sin(th)) * rad)
            w = (0.2 - 0.05 * tn / turns) * HR
            lock(mb, pts, w, w * 0.9, w * 0.7, w * 0.65, flat_to=None, nv=16, seg=10)
    return mb


def hair_braids():
    """Two long braids over the shoulders, from a middle parting: the hair smoothed down to behind each ear, then plaited
    (plaits slanting in from each side in turn), a tie and a little tuft at the end."""
    mb = MB()
    LOCKS.clear()
    shell(mb, GIRL_LINE, wob=0.012)
    C = HEAD
    for s in (-1, 1):
        # smoothed from the parting down to the braid's start, behind the ear
        for i in range(4):
            y = -0.6 + i * 0.42
            lock(mb, [H(s * 0.05, y * 0.6, 1.02), H(s * 0.75, y * 0.9, 0.72), H(s * 1.04, y * 0.6 + 0.2, 0.05), H(s * 0.9, 0.3, -0.4)], 0.42 * HR, 0.3 * HR, 0.2 * HR, 0.18 * HR, flat_to=C, nv=30)
        # the braid: over the shoulder to the front and down the chest
        path = [H(s * 0.9, 0.3, -0.42), H(s * 0.98, 0.0, -0.75), H(s * 0.88, -0.42, -1.05), H(s * 0.8, -0.6, -1.45), H(s * 0.76, -0.62, -1.75)]
        P = [Vector(p) for p in path]
        def at(f):
            x = f * (len(P) - 1)
            i = min(len(P) - 2, int(x))
            return P[i].lerp(P[i + 1], x - i)
        n = 9
        for k in range(n):
            f0, f1 = k / n, (k + 1.25) / n
            a, b = at(f0), at(min(1.0, f1))
            dirv = (b - a).normalized()
            sideways = dirv.cross(Vector((0, -1, 0)) if abs(dirv.y) < 0.9 else Vector((1, 0, 0))).normalized()
            w = (0.34 - 0.1 * f0) * HR
            sg = 1 if k % 2 else -1
            lock(mb, [a + sideways * sg * w * 0.55, (a + b) / 2, b - sideways * sg * w * 0.4], w, w * 0.8, w * 0.6, w * 0.5, flat_to=None, nv=12, seg=10)
        end = at(1.0)
        tie(mb, end, at(1.0) - at(0.9), 0.1)
        lock(mb, [end, end + Vector((0, -0.02, -0.18)) * HR, end + Vector((s * 0.04, -0.03, -0.34)) * HR], 0.16 * HR, 0.06 * HR, 0.1 * HR, 0.05 * HR, flat_to=None, nv=10, seg=10)
    return mb


def hair_ponytail():
    """Tied high at the back of the head: swept back smooth from the forehead to the tie, the tail falling behind in a soft
    curve (the game swings it as she walks)."""
    mb = MB()
    LOCKS.clear()
    shell(mb, hairline((0.0, 0.58), (0.6, 0.48), (1.1, 0.24), (1.4, 0.02), (2.0, -0.2), (math.pi, -0.42)), wob=0.012)
    C = HEAD
    knot = H(0, 1.02, 0.45)
    # swept back to the tie from all round
    for i in range(9):
        a = -2.0 + i * 0.5
        lock(mb, [around(a, 0.55, 1.04) if abs(a) < 1.6 else around(a, 0.1, 1.04), H(math.sin(a) * 0.6, -math.cos(a) * 0.3 + 0.3, 0.98), knot], 0.4 * HR, 0.26 * HR, 0.18 * HR, 0.14 * HR, flat_to=C, nv=24)
    tie(mb, knot + Vector((0, 0.05, 0)) * HR, Vector((0, 1, -0.4)), 0.24)
    # the tail: three locks from the tie, back and down in an S
    for x, w in ((0.0, 0.34), (-0.12, 0.26), (0.13, 0.26)):
        lock(mb, [knot + Vector((x, 0.12, 0.04)) * HR, H(x, 1.42, 0.2), H(x * 1.3, 1.45, -0.35), H(x * 1.5, 1.28, -0.8), H(x * 1.2, 1.32, -1.1)], w * HR, w * HR * 0.8, w * 0.7 * HR, w * 0.55 * HR, flat_to=None, nv=36)
    return mb


def hair_bun():
    """Everything up into a round top-knot: swept up smooth from the hairline to a knot of wound hair on top."""
    mb = MB()
    LOCKS.clear()
    shell(mb, hairline((0.0, 0.58), (0.6, 0.48), (1.1, 0.24), (1.4, 0.02), (2.0, -0.2), (math.pi, -0.42)), wob=0.012)
    C = HEAD
    knot = H(0, 0.45, 1.25)
    for i in range(10):
        a = -2.4 + i * 0.53
        lock(mb, [around(a, 0.52 if abs(a) < 1.6 else 0.05, 1.04), around(a, 0.82, 1.05), knot + (around(a, 0.0, 1.0) - HEAD) * 0.25], 0.42 * HR, 0.26 * HR, 0.18 * HR, 0.14 * HR, flat_to=C, nv=22)
    wrapped(mb, knot, 0.46, seed=5)
    return mb


def hair_pigtails():
    """Two short tails tied high on the sides of the head, from a middle parting."""
    mb = MB()
    LOCKS.clear()
    shell(mb, GIRL_LINE, wob=0.012)
    C = HEAD
    for s in (-1, 1):
        knot = H(s * 1.02, 0.18, 0.42)
        for i in range(5):
            y = -0.7 + i * 0.4
            lock(mb, [H(s * 0.05, y * 0.6, 1.02), H(s * 0.72, y * 0.8, 0.82), knot], 0.38 * HR, 0.24 * HR, 0.18 * HR, 0.14 * HR, flat_to=C, nv=22)
        lock(mb, [around(s * 2.4, -0.3, 1.04), around(s * 1.9, 0.05, 1.05), knot], 0.4 * HR, 0.26 * HR, 0.18 * HR, 0.14 * HR, flat_to=C, nv=22)
        tie(mb, knot + Vector((s * 0.06, 0, 0)) * HR, Vector((s, 0, -0.3)), 0.2)
        for dy, w in ((0.0, 0.3), (-0.12, 0.22), (0.12, 0.22)):
            lock(mb, [knot + Vector((s * 0.12, dy, 0.02)) * HR, H(s * 1.32, 0.18 + dy, 0.24), H(s * 1.38, 0.2 + dy * 1.2, -0.2), H(s * 1.3, 0.18 + dy, -0.62), H(s * 1.2, 0.12 + dy, -0.92)],
                 w * HR, w * HR * 0.8, w * 0.7 * HR, w * 0.55 * HR, flat_to=None, nv=26)
    return mb


def hair_spacebuns():
    """Two round buns up on the top of the head, either side of a middle parting."""
    mb = MB()
    LOCKS.clear()
    shell(mb, GIRL_LINE, wob=0.012)
    C = HEAD
    for s in (-1, 1):
        knot = H(s * 0.6, 0.12, 1.02)
        for i in range(5):
            a = s * (0.3 + i * 0.55)
            lock(mb, [around(a, 0.5 if abs(a) < 1.6 else 0.0, 1.04), around(a, 0.8, 1.05) * 0.5 + knot * 0.5, knot], 0.38 * HR, 0.24 * HR, 0.18 * HR, 0.14 * HR, flat_to=C, nv=22)
        wrapped(mb, knot + Vector((s * 0.06, 0, 0.12)) * HR, 0.36, seed=7 + s)
    return mb


def hair_mullet():
    """Short on top and at the sides, long at the back: the back falls past the nape to the shoulders, lying close."""
    mb = MB()
    LOCKS.clear()
    shell(mb, hairline((0.0, 0.6), (0.7, 0.5), (1.05, 0.34), (1.2, -0.1), (1.34, 0.2), (1.85, 0.0), (2.4, -0.5), (math.pi, -0.7)), r_out=1.045, wob=0.015)
    C = HEAD
    for i in range(5):
        x = -0.5 + i * 0.25
        lock(mb, [H(x * 0.5, 0.3, 1.04), H(x * 0.9, -0.6, 0.86), H(x * 0.95, -0.92, 0.56)], 0.3 * HR, 0.24 * HR, 0.16 * HR, 0.1 * HR, flat_to=C, nv=20)
    for i in range(7):
        a = math.pi - 0.95 + i * 0.32
        lock(mb, [around(a, 0.7, 1.05), around(a, 0.0, 1.1), around(a, -0.6, 1.1), around(a * 0.98 + 0.06 * (1 if a > math.pi else -1), -1.15, 1.04)],
             0.42 * HR, 0.36 * HR, 0.2 * HR, 0.16 * HR, flat_to=C + Vector((0, -0.05, 0.1)), nv=30)
    return mb


def melt(name, mb, voxel=0.0042, smooth=6, verts=6500, before=None):
    """A mass of overlapping pieces melted into one soft surface (as if sculpted in clay): voxel remeshed, smoothed,
    (before(o): worked on while it's still dense) then lightened."""
    o = mb.obj(name, vmat(name))
    select_only(o)
    o.data.remesh_voxel_size = voxel
    o.data.remesh_voxel_adaptivity = 0.0
    bpy.ops.object.voxel_remesh()
    m = o.modifiers.new('smooth', 'SMOOTH')
    m.factor, m.iterations = 0.6, smooth
    apply_modifiers(o)
    if before:
        before(o)
    m2 = o.modifiers.new('lighter', 'DECIMATE')
    m2.ratio = min(1.0, verts / max(1, len(o.data.vertices)))
    apply_modifiers(o)
    shade_smooth(o)
    return o


def grooves(o, depth=0.0055):
    """Where two locks meet (as far from one's middle as from the other's), the melted surface is pressed in a little: the
    locks stay distinct, as a sculpted toy's hair is. Returns each vertex's groove (0..1)."""
    from mathutils.kdtree import KDTree
    pts = [(p, w, i) for i, L in enumerate(LOCKS) for (p, w) in L]
    kd = KDTree(len(pts))
    for k, (p, w, i) in enumerate(pts):
        kd.insert(p, k)
    kd.balance()
    me = o.data
    out = []
    for v in me.vertices:
        p = o.matrix_world @ v.co
        near = kd.find_n(p, 24)
        best = {}
        for (q, k, d) in near:
            lk = pts[k][2]
            dd = d / max(1e-4, pts[k][1])
            if lk not in best or dd < best[lk]:
                best[lk] = dd
        ds = sorted(best.values())
        g = 0.0
        if len(ds) > 1:
            g = max(0.0, 1 - (ds[1] - ds[0]) / 0.45) * min(1.0, 2.2 - ds[0]) if ds[0] < 2.2 else 0.0
            g = max(0.0, min(1.0, g)) ** 1.5
        out.append(g)
    if depth:
        # (the normals read first: moving a vertex makes Blender work them all out again)
        nrm = [v.normal.copy() for v in me.vertices]
        for v, n, g in zip(me.vertices, nrm, out):
            v.co -= n * depth * g
        me.update()
    return out


def hair_colors(o, groove=None, dark=0.75):
    """A melted hair's greys: darker in its grooves and underneath, a soft shine band across the crown (the toy's
    gloss); the blue channel how far down toward the tips (dyed tips follow it)."""
    me = o.data
    V = [o.matrix_world @ v.co for v in me.vertices]
    N = [(o.matrix_world.to_3x3() @ v.normal).normalized() for v in me.vertices]
    tree = BVHTree.FromObject(o, bpy.context.evaluated_depsgraph_get())
    rng = random.Random(4)
    dirs = []
    while len(dirs) < 20:
        d = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-1, 1)))
        if 0.2 < d.length <= 1:
            dirs.append(d.normalized())
    ca = me.color_attributes.get('Col') or me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
    for i, (p, n) in enumerate(zip(V, N)):
        occ = 0
        tot = 0
        for d in dirs:
            if d.dot(n) <= 0:
                d = -d
            tot += 1
            hit = tree.ray_cast(p + n * 0.0015, d, 0.03)
            if hit[0] is not None:
                occ += 1 - hit[3] / 0.03
        ao = 1 - dark * occ / max(1, tot)
        if groove:
            ao *= 1 - 0.32 * groove[i]
        # the shine: a band round the crown, brightest facing up and toward us
        rel = (p - HEAD) / HR
        band = math.exp(-((rel.z - 0.62) / 0.16) ** 2) * max(0.0, 0.35 + 0.65 * -n.y) * max(0.0, n.z * 0.6 + 0.4)
        k = (0.8 * ao + 0.24 * band) * (1 - 0.12 * max(0.0, -n.z))
        tip = max(0.0, min(1.0, (HEAD.z - 0.2 * HR - p.z) / (1.2 * HR)))
        ca.data[i].color = (lin(k), lin(k), lin(tip), 1.0)


# ---------------------------------------------------------------- crease shading for the kit
def kit_ao(objs, reach=0.022, n=16, occ=None):
    """Every part's greys darkened where it meets another (the collar on the neck, the hem on the hips, the cuff on the
    hand), from the whole doll standing at rest (or only from the parts in occ)."""
    deps = bpy.context.evaluated_depsgraph_get()
    V, F = [], []
    for o in (occ or objs):
        if o.name.startswith('face'):
            continue
        b = len(V)
        V += [tuple(o.matrix_world @ v.co) for v in o.data.vertices]
        F += [tuple(b + i for i in p.vertices) for p in o.data.polygons]
    tree = BVHTree.FromPolygons(V, F)
    rng = random.Random(9)
    dirs = []
    while len(dirs) < n:
        d = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-1, 1)))
        if 0.2 < d.length <= 1:
            dirs.append(d.normalized())
    for o in objs:
        if o.name.startswith('face'):
            continue
        me = o.data
        ca = me.color_attributes.get('Col')
        M3 = o.matrix_world.to_3x3()
        for i, v in enumerate(me.vertices):
            p = o.matrix_world @ v.co
            nn = (M3 @ v.normal).normalized()
            occ = 0
            for d in dirs:
                if d.dot(nn) <= 0:
                    d = -d
                hit = tree.ray_cast(p + nn * 0.0012, d, reach)
                if hit[0] is not None:
                    occ += 1 - hit[3] / reach
            k = 1 - 0.6 * occ / n
            c = ca.data[i].color
            ca.data[i].color = (c[0] * k, c[1] * k, c[2] * k if not o.name.startswith('hair') else c[2], 1.0)


# ---------------------------------------------------------------- objects
def part_obj(p):
    name = f'{p.name}__{p.role}'
    mb2 = MB()
    mb2.v = [v - p.origin for v in p.mb.v]
    mb2.f, mb2.c, mb2.n = p.mb.f, p.mb.c, p.mb.n
    o = mb2.obj(name, vmat(f'doll_{p.role}', rough=0.6))
    if p.uv:
        uvl = o.data.uv_layers.new(name='UVMap')
        for poly in o.data.polygons:
            for li in poly.loop_indices:
                vi = o.data.loops[li].vertex_index
                uvl.data[li].uv = p.uv[vi]
    o.location = p.origin
    return o


def build_kit():
    PARTS.clear()
    head()
    torso()
    hips()
    sym(arm)
    sym(bare_arm)
    sym(leg)
    torso_m()
    hips_m()
    sym(arm_m)
    base = set(PARTS)
    skirts()
    strap_top()
    bib()
    hoodie()
    fastenings()
    cape()
    objs = [part_obj(p) for p in PARTS.values()]
    # (the phones' version: every part but the face's patch from half the points)
    if BUDGET['verts'] <= LOD1:
        for o in objs:
            if not o.name.startswith('face'):
                m = o.modifiers.new('lighter', 'DECIMATE')
                m.ratio = 0.5
                apply_modifiers(o)
                shade_smooth(o)
    bpy.context.view_layer.update()
    first = [o for o in objs if o.name in base]
    kit_ao([o for o in first if 'bare' not in o.name])
    # (what clothes add, shaded against itself and the head, arms and legs it's worn with, never the tops it replaces
    # or covers: one part's folds never darken a part that isn't worn with it)
    limbs = [o for o in first if o.name.startswith(('head', 'ear_', 'uarm_l', 'uarm_r', 'farm_l', 'farm_r', 'thigh_', 'shin_'))]
    for o in objs:
        if o.name not in base:
            kit_ao([o], occ=limbs + [o])
    return objs


HAIRS = {'waves': hair_waves, 'joecut': hair_joecut, 'davidcut': hair_davidcut, 'jamescut': hair_jamescut, 'johncut': hair_johncut, 'sleek': hair_sleek,
         'bob': hair_bob, 'buzz': hair_buzz, 'pixie': hair_pixie, 'afro': hair_afro, 'friar': hair_friar, 'mohawk': hair_mohawk, 'curls': hair_curls,
         'braids': hair_braids, 'ponytail': hair_ponytail, 'bun': hair_bun, 'pigtails': hair_pigtails, 'spacebuns': hair_spacebuns, 'mullet': hair_mullet,
         'beard': beard_full, 'mustache': mustache}
# how each is melted: smoothing, the points it keeps, how dark its folds (curls softer and lighter in the folds, or the
# deep ones read as holes; the short cuts need few points)
MELT = {'joecut': (8, 7000, 0.55), 'afro': (8, 7000, 0.5), 'curls': (6, 8000, 0.55), 'beard': (4, 3800, 0.7), 'mustache': (3, 1200, 0.7), 'buzz': (4, 2500, 0.75),
        'friar': (5, 3000, 0.75), 'mohawk': (4, 4000, 0.75), 'pixie': (5, 5000, 0.7), 'mullet': (4, 5500, 0.75), 'braids': (4, 7500, 0.7)}


BUDGET = {'verts': 0.75}      # the share of MELT's points kept (the phones' versions keep fewer: --lod1)
LOD1 = 0.4


def build_hair(styles=tuple(HAIRS)):
    out = []
    for st in styles:
        mb = HAIRS[st]()
        # (curls melted a little softer, as a toy's are; a beard is its own part, colored by the look's beard)
        name = 'beard_full__beard' if st == 'beard' else 'beard_mustache__beard' if st == 'mustache' else f'hair_{st}__hair'
        sm, verts, dark = MELT.get(st, (4, 7000, 0.75))
        o = melt(name, mb, smooth=sm, verts=int(verts * BUDGET['verts']), before=lambda o: grooves(o))
        hair_colors(o, grooves(o, depth=0.0), dark=dark)
        # (its origin at the neck, where the head turns)
        me = o.data
        for v in me.vertices:
            v.co -= NECK
        o.location = NECK
        out.append(o)
    return out


if __name__ == '__main__':
    args = sys.argv[1:]
    prev = args[args.index('--preview') + 1] if '--preview' in args else None
    only = args[args.index('--only') + 1].split(',') if '--only' in args else ['kit', 'hair']
    lod = '_lod1' if '--lod1' in args else ''
    if lod:
        BUDGET['verts'] = LOD1
    reset()
    kit = hair = []
    if 'kit' in only:
        kit = build_kit()
        export(kit, 'doll_kit' + lod)
        print('kit', len(kit), 'parts', sum(len(o.data.vertices) for o in kit), 'vertices')
    if 'hair' in only:
        hair = build_hair()
        export(hair, 'doll_hair' + lod)
        print('hair', [(o.name, len(o.data.vertices)) for o in hair])
    if prev:
        # a quick look: the kit dressed in Sarah's colors (crimson knit, jeans), from the game's camera and the front
        cols = {'top': '#c0303a', 'trim': '#f4f0e6', 'bottom': '#4d6d9f', 'bottom2': '#8aa4cc', 'shoes': '#f3f1ee', 'sole': '#d8cfc4',
                'skin': '#fbd9c6', 'face': '#fbd9c6', 'hair': '#8f4629', 'beard': '#c0502a'}
        for o in kit + hair:
            if 'bare' in o.name:
                o.hide_render = True
                continue
            role = o.name.split('__')[1]
            m = material(f'prev_{o.name}', hex_rgb(cols[role]), rough=0.6, vcol='Col')
            # (the greys times the role's color)
            nt = m.node_tree
            bsdf = nt.nodes.get('Principled BSDF')
            vc = [n for n in nt.nodes if n.type == 'VERTEX_COLOR'][0]
            mul = nt.nodes.new('ShaderNodeMix')
            mul.data_type = 'RGBA'
            mul.blend_type = 'MULTIPLY'
            mul.inputs[0].default_value = 1.0
            mul.inputs[6].default_value = hex_rgb(cols[role])
            nt.links.new(vc.outputs['Color'], mul.inputs[7])
            nt.links.new(mul.outputs[2], bsdf.inputs['Base Color'])
            o.data.materials.clear()
            o.data.materials.append(m)
        ground_plane(size=40, color='#8cc070')
        light_rig()
        for pitch, tag, d, turn in ((34, 'game', 3.2, 0), (6, 'front', 2.6, 0), (20, 'close', 1.5, 0), (14, 'three', 1.6, 0.7), (10, 'back', 1.8, 3.0)):
            cam = camera((0, 0, 0.52 if tag in ('game', 'front') else 0.68), dist=d, pitch=pitch)
            if turn:
                # (round the doll: the camera swung about it)
                cam.location = Matrix.Rotation(turn, 4, 'Z') @ cam.location
                cam.rotation_euler.z += turn
            render(os.path.join(prev, f'doll_{tag}.png'), size=(560, 560), samples=24)
            bpy.data.objects.remove(cam)
