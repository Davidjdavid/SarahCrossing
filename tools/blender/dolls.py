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

    python tools/blender/dolls.py [--preview DIR] [--only kit,hair]
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
        # a comma: from its root it winds once round (a little less), shrinking, lifted off the head in the middle
        d = d.normalized()
        t1 = d.cross(Vector((0, 0, 1)))
        t1 = t1.normalized() if t1.length > 1e-3 else Vector((1, 0, 0))
        t2 = d.cross(t1).normalized()
        a0 = rng.uniform(0, math.tau) if turn is None else turn
        c0 = HEAD + d * HR * lift + Vector((0, 0, -droop * HR))
        path = []
        for k in range(7):
            f = k / 6
            th = a0 + f * 4.0
            r = rc * (1 - 0.45 * f) * HR
            path.append(c0 + (t1 * math.cos(th) + t2 * math.sin(th)) * r + d * HR * 0.05 * math.sin(f * math.pi))
        w = rc * 1.15
        lock(mb, path, w * HR, w * HR * 0.6, w * 0.75 * HR, w * 0.5 * HR, flat_to=HEAD, nv=20, seg=10)
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
def kit_ao(objs, reach=0.022, n=16):
    """Every part's greys darkened where it meets another (the collar on the neck, the hem on the hips, the cuff on the
    hand), from the whole doll standing at rest."""
    deps = bpy.context.evaluated_depsgraph_get()
    V, F = [], []
    for o in objs:
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
    objs = [part_obj(p) for p in PARTS.values()]
    bpy.context.view_layer.update()
    kit_ao([o for o in objs if 'bare' not in o.name])
    return objs


def build_hair(styles=('waves', 'joecut')):
    out = []
    for st in styles:
        mb = {'waves': hair_waves, 'joecut': hair_joecut}[st]()
        # (curls melted a little softer, as a toy's are)
        o = melt(f'hair_{st}__hair', mb, smooth=8 if st == 'joecut' else 4, verts=7500, before=lambda o: grooves(o))
        # (the curls' deep folds a little lighter, or they read as holes)
        hair_colors(o, grooves(o, depth=0.0), dark=0.55 if st == 'joecut' else 0.75)
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
    reset()
    kit = hair = []
    if 'kit' in only:
        kit = build_kit()
        export(kit, 'doll_kit')
        print('kit', len(kit), 'parts', sum(len(o.data.vertices) for o in kit), 'vertices')
    if 'hair' in only:
        hair = build_hair()
        export(hair, 'doll_hair')
        print('hair', [(o.name, len(o.data.vertices)) for o in hair])
    if prev:
        # a quick look: the kit dressed in Sarah's colors (crimson knit, jeans), from the game's camera and the front
        cols = {'top': '#c0303a', 'trim': '#f4f0e6', 'bottom': '#4d6d9f', 'bottom2': '#8aa4cc', 'shoes': '#f3f1ee', 'sole': '#d8cfc4',
                'skin': '#fbd9c6', 'face': '#fbd9c6', 'hair': '#8f4629'}
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
