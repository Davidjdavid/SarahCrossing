"""Five props in the style David set on 26 October (the style test): a park bench, a street lamp, an armchair, a strawberry
shortcake and the shovel. Each is a miniature toy rather than a scale model: chunky (nothing so thin it vanishes at
playing distance), every edge rounded, the part that says what it is made a little bigger (the bench's scrolled arms,
the lamp's lantern, the chair's rolled arms and tufted back, the cake's layers and berries, the shovel's D-grip), warm
painted colors a shade darker underneath, and each standing on its own feet, base or plate.

Colors are in the mesh (no baking), as props_island.py's are; a part named *_glass glows at night (the lamp), *_gloss
is a touch shinier (glaze, cream, a painted blade).

    python tools/blender/props2.py [--preview DIR] [--only NAME]
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from mathutils import Vector, Matrix, Euler, noise
from common import *
from trees_ac import MB, vmat, rgb
from kit import col_fn, shade, rbox, lathe, cyl, ball, tube, slab, xform, rot
from folks import surf, superq, revolve


def paint(c, under=0.22, z0=0.0, z1=1.0, top=0.06, mottle=0.0, seed=0.0):
    """A painted color: darker toward the bottom of the piece and on faces turned down, lighter on top, a faint mottle."""
    base = rgb(c)
    off = Vector((seed, seed * 1.3, seed * 0.7))

    def f(p, n, *_):
        k = 1.0 - under * max(0.0, 1 - (p.z - z0) / max(1e-3, z1 - z0)) ** 2
        k *= 1.0 - 0.12 * max(0.0, -n.z) + top * max(0.0, n.z)
        if mottle:
            k *= 1 - mottle + 2 * mottle * (0.5 + 0.5 * noise.noise(p * 9 + off))
        return base * k
    return f


def grain(c, axis='x', seed=0.0, z0=0.0, z1=1.0):
    """Painted wood: a soft grain along the board, lighter on its top face, a worn lighter edge."""
    base = rgb(c)
    off = Vector((seed * 3.1, seed * 1.7, seed * 2.3))

    def f(p, n, *_):
        a = {'x': (p.y * 14, p.z * 14, p.x * 1.2), 'y': (p.x * 14, p.z * 14, p.y * 1.2), 'z': (p.x * 14, p.y * 14, p.z * 1.2)}[axis]
        k = 0.9 + 0.16 * (0.5 + 0.5 * noise.noise(Vector(a) * 1.6 + off))
        k *= 1.0 - 0.14 * max(0.0, -n.z) + 0.07 * max(0.0, n.z)
        k *= 1.0 - 0.18 * max(0.0, 1 - (p.z - z0) / max(1e-3, z1 - z0)) ** 3
        return base * k
    return f


def scroll(mb, c, s, r, turns, width, color, axis='x', seg=12):
    """A curl (the end of an iron arm): a tube winding inward round c, in the plane across `axis`."""
    pts = []
    n = int(turns * 28)
    for k in range(n + 1):
        t = k / n
        a = t * turns * math.tau
        rr = r * (1 - 0.72 * t)
        if axis == 'x':
            pts.append(c + Vector((0, math.cos(a) * rr * s, math.sin(a) * rr)))
        else:
            pts.append(c + Vector((math.cos(a) * rr * s, 0, math.sin(a) * rr)))
    tube(mb, pts, width, color, seg=seg, r1=width * 0.8)
    ball(mb, pts[-1], width * 0.95, color, sub=2)


# ---------------------------------------------------------------- the bench
def bench():
    """A park bench 1.8 long: three thick honey-colored seat planks and two for the back, on cast sides painted forest
    green, each a front leg, a back leg sweeping up to hold the back, and an arm ending in a big scroll."""
    mb = MB()
    L, sh = 1.8, 0.46
    tones = ['#c98a4a', '#d29452', '#c08044']
    for i in range(3):
        y0 = -0.24 + i * 0.15
        rbox(mb, -L / 2, y0, sh - 0.075, L / 2, y0 + 0.13, sh, grain(tones[i], 'x', i * 2.3, sh - 0.1, sh), r=0.032)
    for i in range(2):
        m = len(mb.v)
        rbox(mb, -L / 2 + 0.04, -0.035, -0.075, L / 2 - 0.04, 0.035, 0.075, grain(tones[(i + 1) % 3], 'x', 7 + i), r=0.03)
        xform(mb, m, Matrix.Translation((0, 0.26 + i * 0.045, 0.68 + i * 0.19)) @ Matrix.Rotation(math.radians(-12), 4, 'X'))
    green = paint('#2f5c4a', under=0.15, z0=0, z1=1.0, top=0.12)
    for s in (-1, 1):
        x = s * (L / 2 - 0.16)
        # the front leg, a little splayed, and its foot
        tube(mb, [(x, -0.2, 0.03), (x, -0.21, 0.2), (x, -0.2, sh - 0.06)], 0.034, green, seg=12)
        ball(mb, (x, -0.2, 0.03), (0.055, 0.06, 0.03), green, sub=2)
        # the back leg: down from the top of the back, a curve back to its foot
        tube(mb, [(x, 0.28, 0.03), (x, 0.24, 0.25), (x, 0.24, sh - 0.04), (x, 0.3, 0.7), (x, 0.36, 1.02)], 0.034, green, seg=12)
        ball(mb, (x, 0.28, 0.03), (0.055, 0.06, 0.03), green, sub=2)
        ball(mb, (x, 0.36, 1.02), 0.042, green, sub=2)
        # the rail under the seat
        tube(mb, [(x, -0.26, sh - 0.1), (x, 0.28, sh - 0.1)], 0.026, green, seg=10)
        # the arm: from the back leg forward over the seat, its end rolled into a scroll
        tube(mb, [(x, 0.26, 0.66), (x, 0.0, 0.69), (x, -0.22, 0.68)], 0.03, green, seg=12)
        tube(mb, [(x, -0.2, sh - 0.04), (x, -0.22, 0.56), (x, -0.24, 0.62)], 0.026, green, seg=10)
        scroll(mb, Vector((x, -0.28, 0.62)), -1, 0.07, 1.1, 0.026, green)
    return [(mb, 'main')]


# ---------------------------------------------------------------- the street lamp
def lamp():
    """A street lamp 2.5 tall, chunky as a toy: a stepped, flared foot, a fat post with rings, scrolls holding a six-sided
    lantern (its glass glows at night), a little domed roof and a finial; deep green with gold rings."""
    mb, glass = MB(), MB()
    green = paint('#2a4a40', under=0.12, z0=0, z1=2.5, top=0.14)
    gold = paint('#d8aa48', under=0.0, top=0.2)
    lathe(mb, [(0.2, 0.0), (0.21, 0.04), (0.2, 0.08), (0.16, 0.1), (0.15, 0.16), (0.12, 0.2), (0.09, 0.26), (0.075, 0.34)], green, seg=28)
    lathe(mb, [(0.075, 0.34), (0.068, 1.0), (0.06, 1.9), (0.058, 1.98)], green, seg=24, cap_top=False)
    for z, r in ((0.12, 0.17), (0.36, 0.085), (1.12, 0.075), (1.96, 0.08)):
        lathe(mb, [(r - 0.01, z - 0.022), (r + 0.012, z - 0.01), (r + 0.012, z + 0.01), (r - 0.01, z + 0.022)], gold, seg=24, cap_top=False)
    # the top of the post spreading into a cup, scrolls under the lantern
    lathe(mb, [(0.058, 1.98), (0.09, 2.03), (0.15, 2.07), (0.17, 2.09), (0.0, 2.095)], green, seg=24, cap_top=False)
    for k in range(4):
        a = k * math.pi / 2 + math.pi / 4
        d = Vector((math.cos(a), math.sin(a), 0))
        pts = [Vector((0, 0, 1.86)) + d * 0.06, Vector((0, 0, 1.94)) + d * 0.14, Vector((0, 0, 2.04)) + d * 0.17]
        tube(mb, pts, 0.018, green, seg=8)
        ball(mb, pts[-1], 0.024, gold, sub=1)
    # the lantern: six sides, the glass inside a frame of corner posts, a band top and bottom
    z0, z1, R = 2.1, 2.42, 0.17
    lathe(glass, [(R * 0.86, z0 + 0.005), (R * 0.94, z0 + 0.12), (R * 0.98, z1 - 0.04), (R * 0.9, z1 - 0.005)], col_fn('#fde8a8', under=0.0), seg=6, cap_top=True, cap_bot=True)
    for k in range(6):
        a = k * math.tau / 6
        tube(mb, [(math.cos(a) * R * 0.92, math.sin(a) * R * 0.92, z0), (math.cos(a) * R * 1.0, math.sin(a) * R * 1.0, z0 + 0.15), (math.cos(a) * R * 0.98, math.sin(a) * R * 0.98, z1)], 0.016, green, seg=8)
    lathe(mb, [(R * 0.9, z0 - 0.02), (R * 1.06, z0), (R * 1.06, z0 + 0.03), (R * 0.9, z0 + 0.035)], gold, seg=6, cap_top=False)
    lathe(mb, [(R * 0.95, z1 - 0.01), (R * 1.12, z1), (R * 1.12, z1 + 0.035), (R * 0.95, z1 + 0.04)], green, seg=6, cap_top=False)
    # the roof: a six-sided dome flaring at the eaves, a gold ball on top
    lathe(mb, [(R * 1.32, z1 + 0.04), (R * 1.25, z1 + 0.07), (R * 0.95, z1 + 0.13), (R * 0.55, z1 + 0.2), (R * 0.2, z1 + 0.25), (0.0, z1 + 0.26)], green, seg=6, cap_top=False)
    lathe(mb, [(R * 1.32, z1 + 0.04), (0.0, z1 + 0.04)], green, seg=6, cap_top=False)
    ball(mb, (0, 0, z1 + 0.3), 0.045, gold, sub=2)
    return [(mb, 'main'), (glass, 'glass')]


# ---------------------------------------------------------------- the armchair
def armchair():
    """A plump armchair a tile wide: an overstuffed mustard body, arms rolled outward, a deep seat cushion with piping, a
    tall back tufted with buttons, short turned walnut legs."""
    mb = MB()
    fab = rgb('#e2a43a')

    def cloth(c=None, tuft=None):
        base = rgb(c) if c else fab

        def f(p, n, *_):
            k = 0.92 + 0.06 * noise.noise(p * 22)
            k *= 1.0 - 0.16 * max(0.0, -n.z) + 0.06 * max(0.0, n.z)
            k *= 1.0 - 0.14 * max(0.0, 1 - p.z / 0.3) ** 2
            if tuft:
                for (tx, tz) in tuft:
                    d = math.hypot(p.x - tx, p.z - tz)
                    k *= 1 - 0.3 * math.exp(-(d / 0.045) ** 2)
            return base * k
        return f
    W, D = 0.86, 0.8
    # the legs
    walnut = grain('#6a4024', 'z', 3.0, 0, 0.14)
    for sx in (-1, 1):
        for sy in (-1, 1):
            lathe(mb, [(0.032, 0.0), (0.038, 0.03), (0.028, 0.07), (0.036, 0.11), (0.042, 0.14)], walnut, c=(sx * (W / 2 - 0.08), sy * (D / 2 - 0.08), 0), seg=14)
    # the body: a plump box from the legs to the seat, the skirt
    rbox(mb, -W / 2, -D / 2, 0.13, W / 2, D / 2, 0.36, cloth(), r=0.07)
    # the back: tall and puffy, leaning back a little, tufted
    tufts = [(-0.15, 0.72), (0.15, 0.72), (0.0, 0.62), (-0.15, 0.52), (0.15, 0.52)]
    m = len(mb.v)
    surf(mb, superq(0, 0, 0, W / 2 - 0.02, 0.1, 0.34, 0.4, 0.45), lambda p, n, *_: cloth(tuft=[(tx, tz - 0.6) for tx, tz in tufts])(p + Vector((0, 0, 0.6)), n), nu=48, nv=24)
    xform(mb, m, Matrix.Translation((0, D / 2 - 0.12, 0.62)) @ Matrix.Rotation(math.radians(-9), 4, 'X'))
    for (tx, tz) in tufts:
        p = Vector((tx, D / 2 - 0.22 - (tz - 0.62) * math.tan(math.radians(9)), tz))
        ball(mb, p, (0.022, 0.014, 0.022), lambda q, nq, *_: rgb('#a86a10') * (0.9 + 0.2 * max(0.0, -nq.y)), sub=2)
    # the seat cushion, deep and puffy, piped round its top edge
    surf(mb, superq(0, -0.06, 0.41, W / 2 - 0.13, D / 2 - 0.1, 0.075, 0.35, 0.5), cloth('#e8ae44'), nu=40, nv=16)
    pip = []
    for k in range(41):
        t = k / 40 * math.tau
        x = (W / 2 - 0.13) * math.copysign(abs(math.cos(t)) ** 0.35, math.cos(t))
        y = -0.06 + (D / 2 - 0.1) * math.copysign(abs(math.sin(t)) ** 0.35, math.sin(t))
        pip.append((x, y, 0.445))
    tube(mb, pip, 0.012, cloth('#f2c868'), seg=8)
    # the arms: rolled outward, front caps showing the roll
    for s in (-1, 1):
        x = s * (W / 2 - 0.07)
        m = len(mb.v)
        surf(mb, superq(0, 0, 0, 0.085, D / 2 - 0.02, 0.17, 0.5, 0.55), cloth(), nu=32, nv=16)
        xform(mb, m, Matrix.Translation((x, -0.01, 0.42)))
        # (the roll's face at the front of the arm)
        mm = len(mb.v)
        lathe(mb, [(0.0, 0.0), (0.09, 0.0), (0.1, 0.018), (0.0, 0.022)], cloth('#eab550'), seg=24)
        xform(mb, mm, Matrix.Translation((x + s * 0.02, -D / 2 + 0.0, 0.56)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
        tube(mb, [(x + s * 0.02 + math.cos(a) * 0.05 * (1 - k / 22), -D / 2 - 0.02, 0.56 + math.sin(a) * 0.05 * (1 - k / 22)) for k, a in enumerate([k * 0.4 for k in range(16)])], 0.007, cloth('#c08420'), seg=6)
    return [(mb, 'main')]


# ---------------------------------------------------------------- the cake
def cake():
    """A strawberry shortcake on a cake stand: two golden sponge layers with cream and sliced berries between, a slice
    cut out to show them, piped cream round the top with a whole strawberry on each swirl."""
    mb, gl = MB(), MB()
    # the stand: a white plate on a short foot
    lathe(gl, [(0.12, 0.0), (0.13, 0.01), (0.08, 0.03), (0.05, 0.07), (0.05, 0.1), (0.2, 0.115), (0.28, 0.13), (0.29, 0.14), (0.27, 0.142), (0.0, 0.138)], paint('#f8f4ee', under=0.25, z0=0, z1=0.14), seg=48, cap_top=True)
    R, b = 0.21, 0.142
    cut0, cut1 = math.radians(-115), math.radians(-60)      # the slice taken out (toward the front)
    sponge = lambda p, n, *_: rgb('#f2c878').lerp(rgb('#c88a3e'), max(0.0, min(1.0, (abs(n.x) + abs(n.y)) * 0.55 - 0.15))) * (0.94 + 0.08 * noise.noise(p * 40))
    cream = lambda p, n, *_: rgb('#fffaf2') * (0.93 + 0.06 * max(0.0, n.z) - 0.06 * max(0.0, -n.z))
    layers = [(b, b + 0.06, sponge), (b + 0.06, b + 0.085, cream), (b + 0.085, b + 0.15, sponge), (b + 0.15, b + 0.17, cream)]

    def ring(z0, z1, col, r=R):
        # a layer round the cake but for the cut, its top and the cut faces
        n = 64
        span = math.tau - (cut1 - cut0)
        P, C, N, F = [], [], [], []
        for k in range(n + 1):
            a = cut1 + span * k / n
            d = Vector((math.cos(a), math.sin(a), 0))
            for z in (z0, z1):
                p = Vector((d.x * r, d.y * r, z))
                P.append(p); N.append(d); C.append(col(p, d))
        for k in range(n):
            a = 2 * k
            F += [(a, a + 2, a + 3), (a, a + 3, a + 1)]
        mb.add(P, C, N, F)
        # the top (a fan from the middle)
        P = [Vector((0, 0, z1))] + [Vector((math.cos(cut1 + span * k / n) * r, math.sin(cut1 + span * k / n) * r, z1)) for k in range(n + 1)]
        up = Vector((0, 0, 1))
        mb.add(P, [col(p, up) for p in P], [up] * len(P), [(0, 1 + k, 2 + k) for k in range(n)])
        # the two cut faces
        for a, sgn in ((cut0, 1), (cut1, -1)):
            d = Vector((math.cos(a), math.sin(a), 0))
            nn = Vector((-d.y, d.x, 0)) * sgn
            P = [Vector((0, 0, z0)), Vector((0, 0, z1)), Vector((d.x * r, d.y * r, z1)), Vector((d.x * r, d.y * r, z0))]
            mb.add(P, [col(p, nn) for p in P], [nn] * 4, [(0, 1, 2), (0, 2, 3)])
    for z0, z1, col in layers:
        ring(z0, z1, col)
    # sliced berries peeking out of the cream between the layers, and on the cut faces
    rng = random.Random(7)
    berry = lambda p, n, *_: rgb('#e23848').lerp(rgb('#f6a0a8'), max(0.0, -n.z) * 0.6) * (0.92 + 0.1 * max(0.0, n.z))
    for k in range(14):
        a = cut1 + (math.tau - (cut1 - cut0)) * (k + 0.5) / 14
        m = len(mb.v)
        surf(mb, superq(0, 0, 0, 0.026, 0.008, 0.022), lambda p, n, u, v: rgb('#e83a4a').lerp(rgb('#fde0e0'), max(0.0, 1 - abs(n.y) * 1.4) * 0.0 + max(0.0, 0.7 - math.hypot(p.x, p.z) / 0.026)), nu=12, nv=8)
        xform(mb, m, Matrix.Translation((math.cos(a) * (R - 0.004), math.sin(a) * (R - 0.004), b + 0.072)) @ Matrix.Rotation(a + math.pi / 2, 4, 'Z'))
    for a in (cut0, cut1):
        d = Vector((math.cos(a), math.sin(a), 0))
        for t in (0.35, 0.7):
            m = len(mb.v)
            surf(mb, superq(0, 0, 0, 0.022, 0.006, 0.02), lambda p, n, u, v: rgb('#e83a4a').lerp(rgb('#fde4e4'), max(0.0, 0.75 - math.hypot(p.x, p.z) / 0.022)), nu=12, nv=8)
            xform(mb, m, Matrix.Translation(d * R * t + Vector((0, 0, b + 0.072))) @ Matrix.Rotation(a, 4, 'Z'))
    # piped cream swirls round the top, a strawberry on each
    top = b + 0.17
    n = 9
    span = math.tau - (cut1 - cut0)
    for k in range(n):
        a = cut1 + span * (k + 0.5) / n
        c = Vector((math.cos(a) * (R - 0.04), math.sin(a) * (R - 0.04), top))

        def swirl(v):
            return 0.038 * (1 - v) ** 0.8 + 0.004, top + v * 0.06
        surf(mb, revolve(swirl, cx=c.x, cy=c.y, mod=lambda u, v: 1 + 0.18 * math.cos(u * math.tau * 6 + v * 7)), cream, nu=30, nv=10, caps=(True, True))
        # the berry: point up, wide at the bottom, red with pale seeds, its green calyx flat on the cream
        bc = c + Vector((0, 0, 0.05))
        surf(mb, revolve(lambda v: (0.031 * (math.sin(min(1.0, v * 2.2) * math.pi / 2) ** 0.6) * (1 - v) ** 0.55, bc.z + v * 0.062), cx=bc.x, cy=bc.y),
             lambda p, n, *_: (rgb('#e22c3e') * (0.86 + 0.18 * max(0.0, n.z))).lerp(rgb('#ffe890'), 0.85 if noise.noise(p * 260) > 0.58 else 0.0), nu=20, nv=12)
        for j in range(5):
            aa = j / 5 * math.tau + k
            m = len(mb.v)
            surf(mb, superq(0.016, 0, 0, 0.016, 0.006, 0.003), lambda p, n, *_: rgb('#4aa83a') * (0.9 + 0.15 * max(0.0, n.z)), nu=8, nv=4)
            xform(mb, m, Matrix.Translation(bc + Vector((0, 0, 0.004))) @ Matrix.Rotation(aa, 4, 'Z') @ Matrix.Rotation(-0.25, 4, 'Y'))
    return [(mb, 'main'), (gl, 'gloss')]


# ---------------------------------------------------------------- the shovel
def shovel():
    """The shovel, standing on its blade (as it lies in the hand): a warm wooden shaft, a red D-grip, a rounded steel
    blade with a rolled top edge, the socket riveted. 1.0 long; its origin where the hand holds it, under the grip."""
    mb, gl = MB(), MB()
    wood = grain('#c8874a', 'z', 2.0, 0.2, 1.0)
    lathe(mb, [(0.03, 0.28), (0.028, 0.6), (0.027, 0.86), (0.03, 0.88)], wood, seg=16, cap_top=False)
    # the grip: a D of red rubber
    red = paint('#d8443a', under=0.0, top=0.16)
    tube(mb, [(0.0, 0, 0.86), (-0.05, 0, 0.9), (-0.065, 0, 0.98), (-0.05, 0, 1.03)], 0.022, red, seg=12)
    tube(mb, [(0.0, 0, 0.86), (0.05, 0, 0.9), (0.065, 0, 0.98), (0.05, 0, 1.03)], 0.022, red, seg=12)
    tube(mb, [(-0.07, 0, 1.03), (0.07, 0, 1.03)], 0.026, red, seg=12)
    for s in (-1, 1):
        ball(mb, (s * 0.07, 0, 1.03), 0.027, red, sub=2)
    # the socket and its rivets
    steel = paint('#a8b2bc', under=0.1, z0=0, z1=0.36, top=0.25)
    lathe(gl, [(0.034, 0.22), (0.036, 0.26), (0.032, 0.3), (0.031, 0.31)], steel, seg=16, cap_top=False)
    for s in (-1, 1):
        ball(gl, (0, s * 0.034, 0.27), 0.007, '#6a727a', sub=1)
    # the blade: a rounded spade, cupped a little, with a rolled top edge
    def bl(u, v):
        # u across (-1..1), v from the tip (0) to the top (1)
        half = 0.13 * (math.sin(min(1.0, v * 1.4) * math.pi / 2) ** 0.7)
        x = u * half
        z = 0.0 + v * 0.24
        y = 0.03 * (u * u) - 0.012
        return Vector((x, y, z))
    P, C, N, F = [], [], [], []
    nu, nv = 18, 14
    for j in range(nv + 1):
        for i in range(nu + 1):
            u, v = -1 + 2 * i / nu, j / nv
            p = bl(u, v)
            P.append(p)
    for side in (0, 1):
        base = len(gl.v)
        pts, cols, nrms = [], [], []
        for j in range(nv + 1):
            for i in range(nu + 1):
                p = P[j * (nu + 1) + i] + Vector((0, 0.008 * side, 0))
                n = Vector((0, -1 if side == 0 else 1, 0))
                pts.append(p); nrms.append(n); cols.append(steel(p, n))
        F = []
        for j in range(nv):
            for i in range(nu):
                a = j * (nu + 1) + i
                F += [(a, a + 1, a + nu + 2), (a, a + nu + 2, a + nu + 1)]
        gl.add(pts, cols, nrms, F)
    # (the rim round the blade's edge and the roll along its top)
    outline = [bl(-1, 1 - k / nv) for k in range(nv + 1)] + [bl(-1 + 2 * i / nu, 0) for i in range(1, nu)] + [bl(1, k / nv) for k in range(nv + 1)]
    tube(gl, [p + Vector((0, 0.004, 0)) for p in outline], 0.007, steel, seg=6)
    tube(gl, [bl(-1 + 2 * i / nu, 1.0) + Vector((0, 0.004, 0.004)) for i in range(nu + 1)], 0.013, steel, seg=8)
    # (the hand holds it under the grip)
    for m in (mb, gl):
        for i in range(len(m.v)):
            m.v[i] = m.v[i] - Vector((0, 0, 0.8))
    return [(mb, 'main'), (gl, 'gloss')]


# ---------------------------------------------------------------- the fishing rod
def rod():
    """The fishing rod in Sarah's hand (David, 27 October: a real rod, not a flat picture): a cork grip, a brass reel
    seat with a little red reel hung under it, a varnished cane rod tapering to a white tip, gold whippings at its
    joints and five line guides under it. 1.0 long from the hand (the origin, the middle of the grip) to the tip, which
    is where the game ties the line (EnvFishing)."""
    mb, gl = MB(), MB()
    cork = lambda p, n: rgb('#c89a64').lerp(rgb('#a87a48'), max(0.0, noise.noise(p * 60)) * 0.8) * (0.88 + 0.12 * max(0.0, n.z))
    lathe(mb, [(0.0, -0.13), (0.024, -0.128), (0.03, -0.1), (0.032, -0.02), (0.03, 0.06), (0.026, 0.1), (0.022, 0.11)], cork, seg=16, cap_top=False)
    brass = paint('#d8aa48', under=0.05, top=0.2)
    lathe(gl, [(0.024, -0.145), (0.026, -0.13), (0.02, -0.128), (0.0, -0.128)], brass, seg=16, cap_top=False)
    lathe(gl, [(0.022, 0.1), (0.024, 0.12), (0.024, 0.17), (0.018, 0.18)], brass, seg=16, cap_top=False)
    # the reel: a round red spool on a foot under the seat, a crank with a knob
    red = paint('#d8443a', under=0.1, top=0.2)
    tube(gl, [(0, -0.02, 0.145), (0, -0.05, 0.145)], 0.007, brass, seg=8)
    m0 = len(mb.v)
    lathe(mb, [(0.0, -0.022), (0.045, -0.022), (0.05, -0.012), (0.05, 0.012), (0.045, 0.022), (0.0, 0.022)], red, seg=24)
    # (the spool's axis across the rod: lathe made it about z, turn it to x)
    for i in range(m0, len(mb.v)):
        v = mb.v[i]
        mb.v[i] = Vector((v.z, v.y - 0.075, 0.145 - v.x))
        mb.n[i] = Vector((mb.n[i].z, mb.n[i].y, -mb.n[i].x))
    tube(gl, [(0.024, -0.075, 0.145), (0.034, -0.075, 0.145), (0.034, -0.105, 0.13)], 0.005, brass, seg=6)
    ball(mb, (0.04, -0.105, 0.13), 0.011, '#f2ead8', sub=2)
    # the cane, tapering, varnished brown going lighter, a white tip
    cane = lambda p, n: rgb('#8a4a2a').lerp(rgb('#b8743a'), min(1.0, max(0.0, (p.z - 0.18) / 0.82))) * (0.82 + 0.18 * max(0.0, n.y * -1 + 0.4))
    lathe(gl, [(0.016, 0.175), (0.013, 0.4), (0.009, 0.7), (0.006, 0.93), (0.005, 0.97)], cane, seg=12, cap_top=False)
    lathe(mb, [(0.0058, 0.965), (0.005, 1.0), (0.0, 1.002)], '#f4f0e6', seg=10)
    for z, r in ((0.32, 0.0145), (0.55, 0.012), (0.78, 0.0085)):
        lathe(gl, [(r, z - 0.01), (r + 0.002, z - 0.008), (r + 0.002, z + 0.008), (r, z + 0.01)], brass, seg=12, cap_top=False)
    # line guides: little rings on stalks under the cane (the reel's side)
    for z, r, s in ((0.26, 0.016, 0.03), (0.44, 0.013, 0.026), (0.62, 0.011, 0.022), (0.8, 0.009, 0.018), (0.95, 0.007, 0.014)):
        tube(gl, [(0, -r * 0.6, z), (0, -r - s, z)], 0.0025, '#c8ccd2', seg=5)
        pts = [(math.cos(a) * s * 0.35, -r - s - math.sin(a) * s * 0.35 - s * 0.35, z) for a in (k / 10 * math.tau for k in range(11))]
        tube(gl, pts, 0.0022, '#c8ccd2', seg=5)
    return [(mb, 'main'), (gl, 'gloss')]


# ---------------------------------------------------------------- the step stool
def stool():
    """A sturdy wooden step stool for behind a counter, so a food folk working there is seen over it (David: "give them
    chairs or stools ... for them to stand on"): a thick round seat 0.3 high, four splayed legs, a footrest ring, all
    honey wood, the seat's top worn a little paler where feet go."""
    mb = MB()
    H, R = 0.3, 0.27
    wood = grain('#c98a4a', 'x', 3.0, 0, H)
    lathe(mb, [(R - 0.02, H - 0.06), (R, H - 0.045), (R + 0.004, H - 0.02), (R - 0.012, H), (0.0, H + 0.002)], lambda p, n: rgb('#d6a062').lerp(rgb('#e8bc84'), 0.6 * max(0.0, n.z)) * (0.94 + 0.06 * noise.noise(p * 12)), seg=40, cap_top=True, cap_bot=True)
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2
        c, sn = math.cos(a), math.sin(a)
        tube(mb, [(c * 0.15, sn * 0.15, H - 0.05), (c * 0.2, sn * 0.2, 0.02)], 0.032, wood, seg=10, r1=0.028)
        ball(mb, (c * 0.2, sn * 0.2, 0.02), (0.034, 0.034, 0.022), wood, sub=2)
    pts = [(math.cos(a) * 0.178, math.sin(a) * 0.178, 0.11) for a in (k / 24 * math.tau for k in range(25))]
    tube(mb, pts, 0.016, wood, seg=8)
    return [(mb, 'main')]


# ---------------------------------------------------------------- things in hand (33kd_doll_idle.js)
# What the neighbors hold when they're not busy (David, 27 October: things they do, each its own animation): each one's
# origin is where the hand holds it, its front (Blender -y) toward the face of whoever holds it, chunky enough to read
# at playing distance.
def book():
    """An open book held in both hands: two red cloth covers open in a shallow V, cream pages fanned a little, a ribbon
    marker hanging from the spine; the origin at the spine's middle."""
    mb = MB()
    cloth = paint('#c84a4a', under=0.1, top=0.1)
    for sx in (-1, 1):
        m = len(mb.v)
        X = lambda a, b: (min(sx * a, sx * b), max(sx * a, sx * b))
        x0, x1 = X(0, 0.13)
        rbox(mb, x0, -0.006, -0.085, x1, 0.006, 0.085, cloth, r=0.005)
        for k in range(3):
            x0, x1 = X(0.004, 0.124 - k * 0.004)
            rbox(mb, x0, -0.016 - k * 0.006, -0.078 + k * 0.002, x1, -0.008 - k * 0.006, 0.078 - k * 0.002, paint('#fbf4e2', under=0.05), r=0.004)
        # lines of print on the top page
        for j in range(7):
            z = 0.058 - j * 0.019
            x0, x1 = X(0.018, 0.11 - (0.03 if j == 6 else 0))
            rbox(mb, x0, -0.0315, z - 0.003, x1, -0.029, z + 0.003, shade('#8a8278'), r=0.001)
        # (the covers open in a V, their outer edges toward the reader)
        xform(mb, m, rot(z=-sx * 0.42))
    cyl(mb, 0, 0, -0.088, 0.088, 0.012, 0.012, cloth, seg=10)
    tube(mb, [(0.0, -0.01, -0.08), (0.006, -0.02, -0.11), (0.0, -0.02, -0.135)], 0.004, shade('#f8c040'), seg=5)
    return [(mb, 'main')]


def phone():
    """A phone with a pastel case and a little charm, its screen lit (a *_glow part: blue with app squares); the origin
    at its middle."""
    mb, gl = MB(), MB()
    rbox(mb, -0.046, -0.012, -0.08, 0.046, 0.012, 0.08, paint('#f4a0c0', under=0.1, top=0.12), r=0.014)
    rbox(gl, -0.038, -0.0135, -0.068, 0.038, -0.011, 0.07, shade('#8ad0f0'), r=0.008)
    for i in range(3):
        for j in range(4):
            c = ['#ffd24a', '#5ad86a', '#ff6a8a', '#ffffff'][(i + j) % 4]
            x, z = -0.022 + i * 0.022, 0.048 - j * 0.026
            rbox(gl, x - 0.008, -0.0142, z - 0.008, x + 0.008, -0.0128, z + 0.008, shade(c), r=0.003)
    tube(mb, [(0.038, 0.0, -0.076), (0.05, 0.0, -0.095), (0.05, 0.0, -0.11)], 0.003, shade('#f2ead8'), seg=4)
    ball(mb, (0.05, 0.0, -0.118), 0.011, '#ffd24a', sub=2)
    return [(mb, 'main'), (gl, 'glow')]


def snack():
    """An ice cream cone: a waffle cone with its criss-cross, a strawberry scoop and a mint one on top, a cherry; the origin
    at the cone's middle, where it's held."""
    mb = MB()
    waffle = lambda p, n: rgb('#d8a058').lerp(rgb('#a86a30'), 0.55 if (math.sin((p.z + math.atan2(p.y, p.x) * 0.02) * 120) > 0.6 or math.sin((p.z - math.atan2(p.y, p.x) * 0.02) * 120) > 0.6) else 0.0)
    lathe(mb, [(0.0, -0.07), (0.012, -0.05), (0.032, 0.02), (0.042, 0.06), (0.044, 0.068)], waffle, seg=18)
    ball(mb, (0, 0, 0.09), (0.05, 0.05, 0.043), paint('#f7a0b4', under=0.12, top=0.12), sub=3)
    ball(mb, (0, 0, 0.14), (0.042, 0.042, 0.038), paint('#a8e8c8', under=0.12, top=0.12), sub=3)
    ball(mb, (0.006, -0.004, 0.182), 0.013, '#d82a3a', sub=2)
    tube(mb, [(0.006, -0.004, 0.19), (0.012, 0.0, 0.215)], 0.0025, shade('#5a8a2a'), seg=4)
    return [(mb, 'main')]


def cup():
    """A big mug of cocoa with a marshmallow, a handle on its side; the origin at its middle."""
    mb, gl = MB(), MB()
    lathe(gl, [(0.0, -0.05), (0.042, -0.05), (0.046, -0.045), (0.048, 0.04), (0.045, 0.05), (0.04, 0.05), (0.04, 0.034)], paint('#5aa0d8', under=0.12, top=0.1), seg=24, cap_top=False, cap_bot=True)
    lathe(mb, [(0.0, 0.032), (0.04, 0.032)], shade('#6a3a22'), seg=24)
    rbox(mb, -0.015, -0.015, 0.03, 0.015, 0.015, 0.05, paint('#fbf6ee', under=0.05), r=0.007)
    tube(gl, [(0.045, 0.0, 0.025), (0.072, 0.0, 0.02), (0.075, 0.0, -0.01), (0.068, 0.0, -0.03), (0.046, 0.0, -0.032)], 0.009, paint('#5aa0d8', under=0.05), seg=8)
    return [(mb, 'main'), (gl, 'gloss')]


def brush():
    """A paintbrush: a red handle, a silver ferrule, bristles dipped in blue; the origin at the grip, the bristles up."""
    mb, gl = MB(), MB()
    lathe(gl, [(0.0, -0.09), (0.008, -0.085), (0.01, 0.0), (0.008, 0.06)], paint('#d8443a', under=0.05, top=0.15), seg=10)
    lathe(gl, [(0.008, 0.058), (0.009, 0.062), (0.009, 0.09), (0.0075, 0.095)], shade('#c8ccd2'), seg=10, cap_top=False)
    lathe(mb, [(0.0076, 0.094), (0.009, 0.11), (0.006, 0.13), (0.0, 0.14)], lambda p, n: rgb('#e8d4a8').lerp(rgb('#3a7ad8'), min(1.0, max(0.0, (p.z - 0.11) / 0.025))), seg=10)
    return [(mb, 'main'), (gl, 'gloss')]


def palette():
    """A painter's palette: a kidney of pale wood with a thumb hole, six blobs of paint round its edge; the origin at the
    thumb hole, its face toward -y."""
    mb = MB()
    out = []
    for k in range(28):
        a = k / 28 * math.tau
        r = 0.11 * (1 + 0.08 * math.cos(a * 2)) - (0.03 if abs(math.atan2(math.sin(a - 3.6), math.cos(a - 3.6))) < 0.35 else 0)
        out.append((0.06 + math.cos(a) * r * 1.2, math.sin(a) * r * 0.9))
    slab(mb, out, 0.012, grain('#e8c890', 'x', 2.0), axis='y', at=-0.006)
    for i, c in enumerate(['#d8443a', '#f8c040', '#5ab85a', '#3a7ad8', '#fbf6ee', '#b05ad0']):
        a = 0.5 + i * 0.75
        x, z = 0.06 + math.cos(a) * 0.09, math.sin(a) * 0.065
        ball(mb, (x, -0.01, z), (0.016, 0.008, 0.016), shade(c), sub=2)
    return [(mb, 'main')]


def suitcase():
    """A neighbor's suitcase for a vacation (6zj_vacations.js): an old-fashioned case in teal with tan leather corners and
    straps, a brass catch, travel stickers, carried by its handle (the origin, at the top of the grip; the case hangs below)."""
    mb, gl = MB(), MB()
    W, D, H, top = 0.17, 0.07, 0.26, -0.035
    rbox(mb, -W, -D, top - H, W, D, top, paint('#3aa0a0', under=0.15, top=0.08), r=0.03)
    leather = paint('#b87a42', under=0.1, top=0.1)
    for x in (-W * 0.55, W * 0.55):
        rbox(mb, x - 0.016, -D - 0.006, top - H - 0.004, x + 0.016, D + 0.006, top + 0.004, leather, r=0.006)
    for (x, z) in ((-W, top - H), (W, top - H), (-W, top), (W, top)):
        ball(mb, (x * 0.97, 0, z + (-0.008 if z == top else 0.008)), (0.022, D + 0.006, 0.022), leather, sub=2)
    rbox(gl, -0.022, -D - 0.008, top - 0.07, 0.022, -D + 0.002, top - 0.035, shade('#e8c050'), r=0.004)
    # the handle: a leather loop on two brass lugs
    for x in (-0.05, 0.05):
        rbox(gl, x - 0.01, -0.012, top - 0.004, x + 0.01, 0.012, top + 0.012, shade('#e8c050'), r=0.004)
    tube(mb, [(-0.05, 0, top + 0.008), (-0.045, 0, top + 0.03), (0, 0, top + 0.04), (0.045, 0, top + 0.03), (0.05, 0, top + 0.008)], 0.009, leather, seg=8)
    # travel stickers on the front
    for (x, z, c, r) in ((-0.035, top - 0.12, '#f8d048', 0.03), (0.04, top - 0.17, '#e86a8a', 0.028), (-0.02, top - 0.215, '#fbf6ee', 0.022)):
        m = len(mb.v)
        cyl(mb, 0, 0, 0, 0.004, r, r, shade(c), seg=16)
        xform(mb, m, Matrix.Translation((x, -D - 0.001, z)) @ rot(x=math.pi / 2))
    return [(mb, 'main'), (gl, 'gloss')]


def basket():
    """The farm's morning delivery (22_npc.js farmOverride): a woven basket heaped with the day's vegetables, carried by
    its handle (the origin, at the top of the handle; the basket hangs below)."""
    mb = MB()
    top, H, R = -0.13, 0.12, 0.11
    weave = lambda p, n, *_: rgb('#c8945a').lerp(rgb('#8a5a30'), 0.5 + 0.5 * math.sin(p.z * 160) * math.sin(math.atan2(p.y, p.x) * 18)) * (0.82 + 0.25 * max(0.0, n.z))
    lathe(mb, [(R * 0.7, top - H), (R * 0.95, top - H + 0.02), (R, top - 0.03), (R * 1.04, top)], weave, seg=24, cap_bot=True, cap_top=False)
    ring = [(math.cos(k / 24 * math.tau) * R * 1.04, math.sin(k / 24 * math.tau) * R * 1.04, top) for k in range(25)]
    tube(mb, ring, 0.011, shade('#7a4a28'), seg=6)
    # the handle, arching over
    tube(mb, [(-R, 0, top), (-R * 0.8, 0, top + 0.06), (0, 0, top + 0.105), (R * 0.8, 0, top + 0.06), (R, 0, top)], 0.01, shade('#8a5a30'), seg=6)
    # the vegetables: a cabbage, tomatoes, carrots poking out, a cucumber
    ball(mb, (-0.035, 0.02, top + 0.005), 0.045, paint('#8ac85a', under=0.1), sub=2)
    for (x, y) in ((0.04, -0.03), (0.055, 0.03), (0.0, -0.05)):
        ball(mb, (x, y, top + 0.0), 0.026, paint('#e8402a', under=0.1), sub=2)
    for (x, y, a) in ((0.03, 0.05, 0.4), (-0.06, -0.04, -0.5)):
        tube(mb, [(x, y, top - 0.02), (x + math.sin(a) * 0.03, y, top + 0.05)], 0.012, shade('#f0862a'), seg=6, r1=0.004)
        tube(mb, [(x + math.sin(a) * 0.03, y, top + 0.05), (x + math.sin(a) * 0.04, y, top + 0.08)], 0.006, shade('#5aa84a'), seg=4)
    tube(mb, [(-0.07, 0.04, top - 0.01), (0.0, 0.06, top + 0.02), (0.06, 0.05, top + 0.005)], 0.016, paint('#3f8a3a', under=0.1), seg=8)
    return [(mb, 'main')]


def bucket():
    """Kai's catch on its way to the shop (22_npc.js catchOverride): a tin pail of water with two fish tails sticking up
    out of it, carried by its wire handle (the origin, at the top of the handle; the pail hangs below)."""
    mb, gl = MB(), MB()
    top, H, R = -0.12, 0.13, 0.085
    tin = lambda p, n, *_: rgb('#9aa8b4').lerp(rgb('#d8e0e8'), max(0.0, min(1.0, 0.5 + n.x * 0.5))) * (0.85 + 0.2 * max(0.0, n.z))
    lathe(gl, [(R * 0.8, top - H), (R * 0.82, top - H + 0.01), (R, top - 0.012), (R * 1.04, top)], tin, seg=24, cap_bot=True, cap_top=False)
    for z in (top - H * 0.3, top - H * 0.75):
        ring = [(math.cos(k / 24 * math.tau) * (R * 0.97 if z > top - H / 2 else R * 0.88), math.sin(k / 24 * math.tau) * (R * 0.97 if z > top - H / 2 else R * 0.88), z) for k in range(25)]
        tube(gl, ring, 0.004, tin, seg=4)
    cyl(mb, 0, 0, top - 0.034, top - 0.028, R * 0.95, R * 0.95, shade('#5ab0d8'), seg=24)
    tube(gl, [(-R * 1.02, 0, top), (-R * 0.6, 0, top + 0.07), (0, 0, top + 0.1), (R * 0.6, 0, top + 0.07), (R * 1.02, 0, top)], 0.004, shade('#6a7480'), seg=4)
    tube(mb, [(-0.02, 0, top + 0.085), (0.02, 0, top + 0.085)], 0.012, shade('#5a3a28'), seg=6)
    # two fish, tails up out of the water
    for (x, y, c, a) in ((-0.03, 0.01, '#4a7aa8', -0.25), (0.03, -0.015, '#e8907a', 0.3)):
        tube(mb, [(x, y, top - 0.05), (x + math.sin(a) * 0.03, y, top + 0.03)], 0.018, paint(c, under=0.1), seg=8, r1=0.007)
        tx, tz = x + math.sin(a) * 0.04, top + 0.045
        for s in (-1, 1):
            tube(mb, [(tx, y, tz - 0.01), (tx + s * 0.025, y, tz + 0.025)], 0.008, paint(c, under=0.1), seg=4, r1=0.003)
    return [(mb, 'main'), (gl, 'gloss')]


def grocery():
    """Shopping at Fortune's after the farm's delivery (22_npc.js shopOverride): a canvas tote with a leek, a baguette and
    a bunch of carrots poking out, carried by its two handles (the origin, where the handles meet; the bag hangs below)."""
    mb = MB()
    top, H, W, D = -0.1, 0.13, 0.085, 0.04
    canvas = lambda p, n, *_: rgb('#efe4cc').lerp(rgb('#d9caa8'), 0.5 + 0.5 * math.sin(p.z * 240 + p.x * 90)) * (0.8 + 0.25 * max(0.0, n.z) + 0.08 * n.y)
    rbox(mb, -W, -D, top - H, W, D, top, canvas, r=0.012)
    # a band of green round the top, and Fortune's leaf printed on the front
    rbox(mb, -W * 1.01, -D * 1.04, top - 0.03, W * 1.01, D * 1.04, top - 0.012, shade('#5a9a5a'), r=0.004)
    ball(mb, (0, -D * 1.02, top - H * 0.6), 0.022, shade('#7ab86a'), sub=2)
    # the handles, up from each side to meet over it
    for s in (-1, 1):
        tube(mb, [(s * W * 0.6, -D * 0.6, top), (s * W * 0.35, -D * 0.3, top + 0.06), (0, 0, top + 0.1)], 0.006, shade('#c8b48a'), seg=5)
        tube(mb, [(s * W * 0.6, D * 0.6, top), (s * W * 0.35, D * 0.3, top + 0.06), (0, 0, top + 0.1)], 0.006, shade('#c8b48a'), seg=5)
    # what's inside: a baguette, a leek with its green top, carrots
    tube(mb, [(-0.05, 0.0, top - 0.06), (-0.035, 0.005, top + 0.07)], 0.016, paint('#d8a058', under=0.15), seg=8, r1=0.012)
    tube(mb, [(0.035, -0.01, top - 0.06), (0.045, -0.01, top + 0.03)], 0.013, shade('#f2f0dc'), seg=8)
    for a in (-0.4, 0.0, 0.4):
        tube(mb, [(0.045, -0.01, top + 0.03), (0.045 + math.sin(a) * 0.03, -0.01, top + 0.09)], 0.01, shade('#4a9a3a'), seg=4, r1=0.003)
    for (x, a) in ((0.0, 0.2), (0.012, -0.15)):
        tube(mb, [(x, 0.015, top - 0.03), (x + math.sin(a) * 0.015, 0.015, top + 0.025)], 0.009, shade('#f0862a'), seg=6, r1=0.003)
        tube(mb, [(x + math.sin(a) * 0.015, 0.015, top + 0.025), (x + math.sin(a) * 0.022, 0.015, top + 0.05)], 0.005, shade('#5aa84a'), seg=4)
    return [(mb, 'main')]


PROPS = {'style_stool': stool, 'style_suitcase': suitcase, 'style_basket': basket, 'style_bucket': bucket, 'style_grocery': grocery, 'style_book': book, 'style_phone': phone, 'style_snack': snack, 'style_cup': cup, 'style_brush': brush, 'style_palette': palette, 'style_bench': bench, 'style_lamp': lamp, 'style_armchair': armchair, 'style_cake': cake, 'style_shovel': shovel, 'style_rod': rod}


def build(name):
    return [mb.obj(f'{name}_{part}', vmat(f'{name}_{part}', rough=0.5 if part == 'gloss' else 0.75)) for mb, part in PROPS[name]() if mb.v]


if __name__ == '__main__':
    args = sys.argv[1:]
    prev = args[args.index('--preview') + 1] if '--preview' in args else None
    only = args[args.index('--only') + 1] if '--only' in args else None
    reset()
    shown = []
    for name in PROPS:
        if only and not name.startswith(only):
            continue
        objs = build(name)
        export(objs, name)
        shown.append((name, objs))
        print('built', name, sum(len(o.data.vertices) for o in objs), 'vertices')
    if prev and shown:
        ground_plane(color='#a8d088')
        light_rig()
        xs = {'style_bench': 0, 'style_lamp': 1.7, 'style_armchair': 2.9, 'style_cake': 4.0, 'style_shovel': 4.8, 'style_rod': 4.2, 'style_basket': 4.0, 'style_bucket': 4.4, 'style_grocery': 4.2, 'style_suitcase': 3.6}
        for name, objs in shown:
            for o in objs:
                o.location.x += xs.get(name, 0)
                if name == 'style_shovel':
                    o.location.z += 0.8
                if name == 'style_rod':
                    o.location.z += 0.2
                if name in ('style_suitcase', 'style_basket', 'style_bucket', 'style_grocery'):      # (carried things hang below their handle)
                    o.location.z += 0.32
        cam = camera((2.4, 0, 0.6), dist=6.4, pitch=20)
        render(os.path.join(prev, 'props2.png'), size=(1400, 620), samples=32)
        bpy.data.objects.remove(cam)
        cam = camera((4.2, 0, 0.3), dist=2.2, pitch=26)
        render(os.path.join(prev, 'props2_close.png'), size=(900, 600), samples=32)
