"""The food folks redone in the style David set on 26 October (the style test: Maki, Kai and Ginger first). Each keeps its
food (the maki roll's nori, rice, salmon and cucumber; the poke bowl's glaze and its heap of toppings; the gingerbread's
bake and icing) and gets what makes it itself at a glance, at sixty pixels tall: its own silhouette, its own arms and
feet, an accessory, and a painted face that can change (the game paints sixteen expressions per folk on the patch named
`face`, as it does for people: EnvDolls.faceSheet).

    Maki   the tight roll: neat and upright, little nori arms with rice-ball hands, a red bow tie (proper, precise)
    Kai    the loose bowl: a messy heap of toppings swept to one side like a surfer's hair, a hibiscus tucked in it,
           chunky glazed arms that wave about
    Ginger the builder: a puffy cookie with piped icing and gumdrop buttons, the yellow hard hat, a tool belt with a hammer

Built in picture pixels as folks.py is (48 wide, 72 high, x from the middle, z up, -y the front), then scaled to tiles;
the parts that move are their own objects with their origins at their joints (arm_l / arm_r at the shoulder, foot_l /
foot_r, Ginger's leg_l / leg_r), anchors for a gift hat and glasses.

    python tools/blender/folks2.py [--preview DIR] [--only maki,kai]
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from mathutils import Vector, Matrix, Euler, noise
from common import *
from trees_ac import MB, vmat, rgb
from kit import shade, rbox, lathe, tube, xform
from folks import Folk, surf, superq, revolve, soft, mottle, ball, feet, hat_anchor, K


def face_patch(f, cx, cz, w, h=None, n=26, lift=0.22, tree=None):
    """The patch the game paints the face on: a grid laid over the front of the body (each point where a ray from the
    front meets it, lifted a little), its UVs across it from the top left (as glTF keeps them)."""
    h = h or w
    tree = tree or f.bvh()
    mb = f.part('face', (0, 0, 0))
    pts, nrm, uvs, faces = [], [], [], []
    for j in range(n + 1):
        for i in range(n + 1):
            x = cx - w / 2 + w * i / n
            z = cz + h / 2 - h * j / n
            p, nn = f.hit(x, z, tree=tree)
            pts.append(p + nn * lift); nrm.append(nn); uvs.append((i / n, 1 - j / n))
    for j in range(n):
        for i in range(n):
            a = j * (n + 1) + i
            faces += [(a, a + 1, a + n + 2), (a, a + n + 2, a + n + 1)]
    mb.add(pts, [Vector((1, 1, 1))] * len(pts), nrm, faces)
    f.uvs = getattr(f, 'uvs', {})
    f.uvs['face'] = uvs


def grains(mb, rng, n, place, col='#fbf8f0', size=(0.95, 0.55, 0.5)):
    """Rice: n little grains, each laid where place(rng) says (a point and the way the surface faces)."""
    for k in range(n):
        p, nn = place(rng)
        m = len(mb.v)
        ball(mb, (0, 0, 0), size, lambda q, nq, *_: rgb(col) * (0.92 + 0.08 * nq.z), sub=1)
        a = rng.uniform(0, math.tau)
        up = Vector(nn).normalized()
        side = up.cross(Vector((0, 0, 1)) if abs(up.z) < 0.9 else Vector((1, 0, 0))).normalized()
        fwd = up.cross(side)
        R = Matrix((side, fwd, up)).transposed().to_4x4() @ Euler((0, 0, a)).to_matrix().to_4x4()
        R.translation = Vector(p)
        xform(mb, m, R)


# ---------------------------------------------------------------- Maki
def maki():
    f = Folk('maki')
    R, z0, z1 = 18.5, 3.0, 39.0
    nori = rgb('#1d3830')

    def prof(v):
        # a soft cylinder: the edges rounded, a touch fuller in the middle (a hand-rolled roll)
        r0 = 3.2
        if v < 0.1:
            a = v / 0.1 * math.pi / 2
            return R - r0 + r0 * math.sin(a), z0 + r0 - r0 * math.cos(a)
        if v > 0.9:
            a = (1 - v) / 0.1 * math.pi / 2
            return R - r0 + r0 * math.sin(a), z1 - r0 + r0 * math.cos(a)
        t = (v - 0.1) / 0.8
        return R + 0.6 * math.sin(t * math.pi), z0 + r0 + t * (z1 - z0 - 2 * r0)
    seam = 1.05      # where the sheet's end overlaps (round from the front, toward her left side)

    def sheet(p, n, u, v):
        # nori: dark green-black with fine fibres across it, a sheen, the overlapping edge a little lighter
        fib = 0.94 + 0.08 * noise.noise(Vector((p.x * 0.35, p.y * 0.35, p.z * 2.2)))
        th = math.atan2(p.y, p.x)
        edge = math.exp(-((((th - seam + math.pi) % math.tau) - math.pi) / 0.05) ** 2)
        return nori * fib * (1 + 0.5 * edge)
    surf(f.body, revolve(prof, mod=lambda u, v: 1 + 0.006 * math.exp(-(((u * math.tau - seam + math.pi) % math.tau - math.pi) / 0.05) ** 2)),
         soft(sheet, under=0.3, z0=z0, z1=z1, top=0.0), nu=96, nv=30, caps=(True, False))
    # the top: the nori's rim, then rice (each grain), the salmon with its fat lines, the cucumber heart
    lathe(f.body, [(R - 0.2, z1 - 0.6), (R - 0.9, z1 + 0.25), (R - 1.6, z1 + 0.35)], lambda p, n, *_: nori * 1.1, seg=72, cap_top=False)
    rice = mottle('#f6f1e4', 0.04, 0.6, 2.0)
    lathe(f.body, [(R - 1.6, z1 + 0.2), (R - 2.3, z1 + 1.5), (12.5, z1 + 2.2), (9.0, z1 + 2.0)], rice, seg=72, cap_top=False)

    def salmon(p, n):
        r = math.hypot(p.x, p.y)
        stripe = 0.5 + 0.5 * math.cos(r * 2.4 + math.atan2(p.y, p.x) * 0.5)
        return rgb('#f07a5a').lerp(rgb('#fbd0bc'), 0.55 * stripe ** 6)
    lathe(f.body, [(9.2, z1 + 1.9), (8.6, z1 + 2.9), (5.4, z1 + 3.5), (3.3, z1 + 3.4)], salmon, seg=48, cap_top=False)
    lathe(f.body, [(3.4, z1 + 3.3), (3.1, z1 + 4.0), (1.4, z1 + 4.3), (0.0, z1 + 4.3)], lambda p, n, *_: rgb('#6cbc48').lerp(rgb('#d8f0a8'), max(0.0, 1 - math.hypot(p.x, p.y) / 2.2)), seg=24, cap_top=False)
    rng = random.Random(3)

    def on_top(rng):
        a, r = rng.uniform(0, math.tau), rng.uniform(9.6, R - 2.4)
        return (math.cos(a) * r, math.sin(a) * r, z1 + 2.0 + 0.2 * (R - r) / 8), (0, 0, 1)
    grains(f.body, rng, 120, on_top)
    # the bow tie, under the face: red, two puffed wings and a knot, a little crease in each
    tree = f.bvh()
    bz = 14.2
    p, nn = f.hit(0, bz, tree=tree)
    red = lambda q, nq, *_: rgb('#d6303a') * (0.86 + 0.18 * max(0.0, -nq.y)) * (1 - 0.15 * max(0.0, -nq.z))
    for s in (-1, 1):
        m = len(f.body.v)
        surf(f.body, superq(s * 3.6, 0, 0, 3.6, 1.6, 2.6, 0.8, 0.9, mod=lambda u, v, s=s: 1.0 - 0.32 * max(0.0, math.cos(u * math.tau) * -s)), red, nu=24, nv=12)
        xform(f.body, m, Matrix.Translation(p + Vector((0, -1.2, 0))))
    m = len(f.body.v)
    surf(f.body, superq(0, 0, 0, 1.5, 1.6, 1.9), lambda q, nq, *_: rgb('#b8242e') * (0.9 + 0.12 * max(0.0, -nq.y)), nu=16, nv=10)
    xform(f.body, m, Matrix.Translation(p + Vector((0, -1.9, 0))))
    # arms: short nori arms from the sides, a ball of rice for each hand
    for s, key in ((-1, 'arm_l'), (1, 'arm_r')):
        o = Vector((s * (R - 0.8), 0, 19.0))
        mb = f.part(key, o)
        tube(mb, [o, o + Vector((s * 3.0, 0, -2.0)), o + Vector((s * 4.6, 0, -5.4))], 2.4, lambda q, nq, *_: nori * (1.0 + 0.1 * nq.z), seg=12, r1=2.2)
        hc = o + Vector((s * 5.0, -0.2, -7.6))
        ball(mb, hc, (3.0, 2.9, 2.9), rice, sub=3)
        grains(mb, random.Random(10 + s), 26, lambda r, hc=hc: (lambda d: (hc + d * 2.95, d))(Vector((r.uniform(-1, 1), r.uniform(-1, 1), r.uniform(-1, 1))).normalized()), size=(0.7, 0.42, 0.38))
    # feet: small and neat, soy-dark
    feet(f, x=8.0, w=3.2, d=4.0, h=2.4, z=2.2, col='#30241f')
    tree = f.bvh()
    face_patch(f, 0, 25.5, 30, tree=tree)
    f.anchor('eyes', f.hit(0, 26.5, tree=tree)[0], 1.0)
    hat_anchor(f, z1 + 4.0, 36)
    return f


# ---------------------------------------------------------------- Kai
def kai():
    f = Folk('kai')
    blue = rgb('#3c7ad0')
    deep = rgb('#2a5aa8')

    def bowl(v):
        if v < 0.14:
            a = v / 0.14
            return 14.0 * math.sin(a * math.pi / 2), 4.0 + 1.6 * (1 - math.cos(a * math.pi / 2))
        t = (v - 0.14) / 0.86
        return 14.0 + 9.2 * math.sin(t * math.pi / 2) ** 0.85, 5.6 + 22.0 * t

    def glaze(p, n, u, v):
        # glazed blue, deeper toward the foot, with a band of white waves curling round the bowl low down
        c = deep.lerp(blue, max(0.0, min(1.0, (p.z - 5) / 10)))
        # (a band of pale dots round the bowl low down)
        th = math.atan2(p.y, p.x)
        d = math.hypot(((th * 18 / math.pi) % 1 - 0.5) * 3.6, (p.z - 8.4) / 1.0)
        c = c.lerp(rgb('#dbe8fb'), max(0.0, min(1.0, (1.0 - d) * 4)))
        return c * (0.94 + 0.05 * noise.noise(p * 0.3)) * (1 + 0.08 * max(0.0, n.z))
    surf(f.body, revolve(bowl), soft(glaze, under=0.2, z0=4, z1=28), nu=144, nv=30, caps=(True, False))
    # the rim, glazed white
    lathe(f.body, [(23.0, 27.4), (23.5, 28.2), (23.3, 29.4), (22.5, 30.0), (21.5, 29.8)], '#f6f4ee', seg=72, cap_top=False)
    lathe(f.body, [(21.5, 29.8), (20.7, 29.0)], '#e2ddd2', seg=72, cap_top=True)
    # the heap: rice, then everything piled up and swept toward his right (the viewer's left), like a surfer's hair
    surf(f.body, superq(0, 0, 29.6, 19.5, 18.5, 6.0), mottle('#f6f1e4', 0.05, 0.8), nu=48, nv=16, caps=(False, True))
    rng = random.Random(5)

    def cube(c, x, y, z, s, a, c2=None, fat=False):
        m = len(f.body.v)

        def col(p, n):
            k = rgb(c).lerp(rgb(c2 or c), 0.5 + 0.5 * noise.noise(p * 0.6 + Vector((x, y, z))))
            if fat:
                k = k.lerp(rgb('#fde2d4'), 0.7 * max(0.0, math.cos((p.x + p.z) * 1.6)) ** 8)
            return k * (0.9 + 0.12 * max(0.0, n.z))
        rbox(f.body, -s, -s, -s, s, s, s, col, r=s * 0.42, mid=0)
        xform(f.body, m, Matrix.Translation((x, y, z)) @ Euler((rng.uniform(-0.5, 0.5), rng.uniform(-0.5, 0.5), a)).to_matrix().to_4x4())
    # (heights rise toward the swept side)
    sweep = lambda x: 4.0 * max(0.0, min(1.0, (6 - x) / 22))
    for k in range(10):
        x = rng.uniform(-16, -3)
        cube('#c4203a', x, rng.uniform(-11, 7), 35.5 + sweep(x) + rng.uniform(0, 3.5), 3.3, rng.uniform(0, 3), '#e2445a')
    for k in range(8):
        x = rng.uniform(-6, 6)
        cube('#f2845e', x, rng.uniform(-11, 7), 36 + sweep(x) + rng.uniform(0, 3), 3.1, rng.uniform(0, 3), '#f8a882', fat=True)
    for k in range(5):
        cube('#f8c22e', rng.uniform(-2, 14), rng.uniform(-13, -6), 34.5 + rng.uniform(0, 2), 2.1, rng.uniform(0, 3), '#fcd860')
    # avocado: a fan of slices standing up at the back, green going to yellow, the dark skin along the edge
    for k in range(6):
        m = len(f.body.v)

        def avo(p, n, *_):
            t = max(0.0, min(1.0, (p.z + 2.6) / 5.2))
            c = rgb('#5e9a2e').lerp(rgb('#d8e890'), t)
            return c.lerp(rgb('#2e4a1c'), max(0.0, min(1.0, (abs(p.y) - 1.0) * 3)))
        surf(f.body, superq(0, 0, 0, 5.2, 1.3, 2.7, 1.0, 1.0, mod=lambda u, v: 1 - 0.25 * max(0.0, math.cos(u * math.tau))), avo, nu=22, nv=12)
        xform(f.body, m, Matrix.Translation((7 + k * 1.6, 3.5 - k * 1.2, 37.5 + k * 0.5)) @ Euler((0.2, -0.9 + k * 0.12, -0.6 + k * 0.32)).to_matrix().to_4x4())
    # edamame, sesame, green onion
    for k in range(12):
        a = rng.uniform(0, math.tau)
        ball(f.body, (math.cos(a) * rng.uniform(4, 15), math.sin(a) * rng.uniform(4, 14) - 2, 34.5 + rng.uniform(0, 3)), (1.3, 1.1, 1.0), lambda p, n, *_: rgb('#7ccf4a') * (0.9 + 0.15 * n.z), sub=2)
    for k in range(26):
        a = rng.uniform(0, math.tau)
        ball(f.body, (math.cos(a) * rng.uniform(2, 16), math.sin(a) * rng.uniform(2, 15) - 2, 38 + rng.uniform(0, 4)), (0.45, 0.3, 0.25), '#fbf6ea', sub=1)
    # the seaweed salad round the rim
    for k in range(30):
        a = k / 30 * math.tau
        tube(f.body, [(math.cos(a) * 19.5, math.sin(a) * 18.5, 31.0), (math.cos(a + 0.12) * 17.2, math.sin(a + 0.12) * 16.2, 34.0), (math.cos(a + 0.22) * 14.0, math.sin(a + 0.22) * 13.5, 33.0)], 0.95, lambda p, n, *_: rgb('#2a8a52') * (0.9 + 0.2 * n.z), seg=5)
    # a hibiscus tucked in on his left (the viewer's right), over the rim: five pink petals and a yellow stamen
    hb = Vector((15.5, -6.5, 36.5))
    for k in range(5):
        a = k / 5 * math.tau
        m = len(f.body.v)
        surf(f.body, superq(3.0, 0, 0, 3.0, 2.4, 0.6, 1.0, 1.0), lambda p, n, *_: rgb('#f2547a').lerp(rgb('#c81e4a'), max(0.0, 1 - p.length / 2.2)), nu=16, nv=8)
        xform(f.body, m, Matrix.Translation(hb) @ Euler((0.9, 0.25, 0.4)).to_matrix().to_4x4() @ Euler((0, 0, a)).to_matrix().to_4x4() @ Euler((0, -0.25, 0)).to_matrix().to_4x4())
    tube(f.body, [hb, hb + Vector((0.4, -2.2, 2.0)), hb + Vector((0.6, -3.4, 3.6))], 0.45, '#f8d040', seg=6)
    ball(f.body, hb + Vector((0.6, -3.4, 3.6)), 0.8, '#f8a830', sub=2)
    # arms: chunky glazed arms from just under the rim, white cuffs, round hands
    for s, key in ((-1, 'arm_l'), (1, 'arm_r')):
        o = Vector((s * 21.0, 0, 22.0))
        mb = f.part(key, o)
        tube(mb, [o, o + Vector((s * 4.0, -0.5, -1.0)), o + Vector((s * 6.6, -0.8, -3.8))], 3.1, lambda q, nq, *_: blue * (0.92 + 0.12 * nq.z), seg=14, r1=2.9)
        lathe(mb, [(3.3, -0.6), (3.5, 0.0), (3.3, 0.6)], '#f6f4ee', c=o + Vector((s * 6.9, -0.8, -4.4)), seg=18, cap_top=False)
        ball(mb, o + Vector((s * 7.6, -0.9, -6.6)), (3.4, 3.2, 3.3), lambda q, nq, *_: blue * (0.95 + 0.1 * nq.z), sub=3)
    # feet: two stubby ceramic feet (the foot ring, split)
    feet(f, x=8.5, w=4.0, d=4.6, h=2.6, z=2.0, col='#24508f')
    tree = f.bvh()
    face_patch(f, 0, 20.5, 32, tree=tree)
    f.anchor('eyes', f.hit(0, 22.0, tree=tree)[0], 1.2)
    hat_anchor(f, 44, 34)
    return f


# ---------------------------------------------------------------- Ginger
def ginger():
    f = Folk('ginger')
    T = 5.6     # half the cookie's thickness

    def bake(p, n, u=0, v=0):
        # baked darker round the edge, paler on the faces, a few darker specks of spice, a soft puff of light on top
        edge = 1 - abs(n.y)
        c = rgb('#cc8440').lerp(rgb('#94501f'), 0.6 * edge ** 1.6)
        sp = noise.noise(p * 1.7)
        c = c * (0.94 + 0.07 * noise.noise(p * 0.45))
        if sp > 0.62:
            c = c * 0.78
        return c * (1 + 0.1 * max(0.0, n.z))
    # the head and the body, puffy
    surf(f.body, superq(0, 0, 37.5, 11.2, T, 10.6, 1.0, 0.85), bake, nu=48, nv=24)
    surf(f.body, superq(0, 0, 22.5, 9.6, T, 10.2, 0.55, 0.62), bake, nu=48, nv=24)
    icing = '#fdfbf6'
    # icing: a scalloped collar at the neck
    for k in range(9):
        x = -7.0 + 14.0 * k / 8
        z = 30.0 - 0.9 * math.cos(k * math.pi)
        ball(f.body, (x, -T - 0.1, z), (1.1, 0.6, 0.9), icing, sub=2)
    # gumdrop buttons: three sugared domes
    for z, c in ((24.5, '#e0303e'), (19.5, '#3ab048'), (14.8, '#f2c22a')):
        surf(f.body, superq(0, -T - 0.2, z, 2.0, 1.4, 1.9, 1.0, 1.0), lambda p, n, u, v, c=c: rgb(c) * (0.85 + 0.25 * max(0.0, -n.y)) * (1 + 0.15 * (noise.noise(p * 4) > 0.5)), nu=18, nv=10)
    # the tool belt: a leather band round the waist with a buckle, a hammer hanging at the right hip, a pouch at the left
    belt = lambda p, n, *_: rgb('#7a4a26') * (0.85 + 0.2 * max(0.0, -n.y + n.z * 0.5))
    rbox(f.body, -9.9, -T - 0.9, 11.3, 9.9, T + 0.9, 14.0, belt, r=0.8, mid=2)
    rbox(f.body, -1.6, -T - 1.3, 11.0, 1.6, -T - 0.6, 14.3, lambda p, n, *_: rgb('#e2b84a') * (0.9 + 0.2 * max(0.0, -n.y)), r=0.4, mid=0)
    tube(f.body, [(7.6, -T - 1.4, 12.0), (8.2, -T - 1.6, 8.5), (8.6, -T - 1.7, 5.0)], 0.7, lambda p, n, *_: rgb('#b47838') * (0.9 + 0.15 * n.z), seg=8)
    rbox(f.body, 6.6, -T - 2.6, 11.4, 10.6, -T - 0.6, 13.4, lambda p, n, *_: rgb('#9aa0a8') * (0.85 + 0.25 * max(0.0, n.z)), r=0.5, mid=0)
    rbox(f.body, -10.4, -T - 2.0, 7.6, -6.6, -T + 0.4, 12.4, lambda p, n, *_: rgb('#946238') * (0.86 + 0.18 * max(0.0, -n.y)), r=1.0, mid=1)
    # arms and legs: the cookie's own, each its own part, icing squiggles at the wrists and ankles
    for s, key in ((-1, 'arm_l'), (1, 'arm_r')):
        o = Vector((s * 8.0, 0, 26.5))
        mb = f.part(key, o)
        m = len(mb.v)
        surf(mb, superq(o.x + s * 6.6, 0, o.z - 0.6, 7.6, T * 0.92, 3.9, 0.7, 0.8), bake, nu=32, nv=16)
        tube(mb, [o + Vector((s * (10.2 + 0.8 * (k % 2)), -T * 0.95, -3.6 + k * 1.5)) for k in range(5)], 0.55, icing, seg=6)
        xform(mb, m, Matrix.Translation(o) @ Matrix.Rotation(s * 0.42, 4, 'Y') @ Matrix.Translation(-o))
    for s, key in ((-1, 'leg_l'), (1, 'leg_r')):
        o = Vector((s * 4.6, 0, 13.5))
        mb = f.part(key, o)
        m = len(mb.v)
        surf(mb, superq(0, 0, -5.2, 4.3, T * 0.92, 6.6, 0.7, 0.8), bake, nu=32, nv=16)
        xform(mb, m, Matrix.Translation(o) @ Euler((0, s * 0.12, 0)).to_matrix().to_4x4())
        tube(mb, [o + Vector((s * 1.0 + (k - 2) * 1.5, -T * 0.95, -8.6 + 0.8 * (k % 2))) for k in range(5)], 0.55, icing, seg=6)
    # the yellow hard hat: a dome, a ridge over it, a brim all round, a little shine; tipped back on the head, so the
    # face shows from the game's camera above
    hat = soft(mottle('#f4b828', 0.04, 0.5), under=0.0, top=0.14)
    m = len(f.body.v)
    surf(f.body, superq(0, 0, 45.2, 11.6, 10.4, 9.2, 1.0, 1.0), hat, nu=48, nv=18, caps=(False, True))
    lathe(f.body, [(15.2, 44.4), (15.4, 45.3), (11.6, 46.0), (0.0, 46.0)], hat, seg=48, cap_top=False, sy=0.9)
    lathe(f.body, [(15.2, 44.4), (0.0, 44.4)], lambda p, n, *_: rgb('#c88c18'), seg=48, cap_top=False, sy=0.9)
    tube(f.body, [(0, -10.6, 46.6), (0, -6.6, 52.0), (0, 0, 54.6), (0, 6.6, 52.0), (0, 10.6, 46.6)], 1.4, shade('#e4a41e'), seg=10)
    xform(f.body, m, Matrix.Translation((0, 1.5, 45.0)) @ Matrix.Rotation(-0.32, 4, 'X') @ Matrix.Translation((0, 0, -45.0)))
    tree = f.bvh()
    face_patch(f, 0, 37.0, 22, tree=tree, lift=0.2)
    f.anchor('eyes', f.hit(0, 38.0, tree=tree)[0], 0.8)
    hat_anchor(f, 54.5, 30)
    return f


FOLKS2 = {'maki': maki, 'kai': kai, 'ginger': ginger}
SIZE = {'ginger': 1.14}       # (a gingerbread person is flat: a little bigger, to stand as tall as the others look)


def objects2(f, scale=K):
    """The folk's parts as objects at the game's scale (as folks.objects), the face patch keeping its UVs."""
    mat, out = vmat(f'folk2_{f.name}', rough=0.6), []
    for key, (mb, o) in f.parts.items():
        if not mb.v:
            continue
        mb2 = MB()
        mb2.v = [(v - o) * scale for v in mb.v]
        mb2.f, mb2.c, mb2.n = mb.f, mb.c, mb.n
        ob = mb2.obj(f'{f.name}_{key}', mat)
        uv = getattr(f, 'uvs', {}).get(key)
        if uv:
            layer = ob.data.uv_layers.new(name='UVMap')
            for poly in ob.data.polygons:
                for li in poly.loop_indices:
                    layer.data[li].uv = uv[ob.data.loops[li].vertex_index]
        ob.location = o * scale
        out.append(ob)
    for key, (p, s) in f.anchors.items():
        e = bpy.data.objects.new(f'anchor_{key}', None)
        e.location = p * scale
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
    for name, fn in FOLKS2.items():
        if only and name not in only:
            continue
        objs = objects2(fn(), scale=K * SIZE.get(name, 1.0))
        export(objs, f'folk2_{name}')
        for o in objs:
            if o.name.startswith('anchor_'):
                o.name = f'done_{name}_{o.name}'
        shown.append((name, objs))
        print('built', name, sum(len(o.data.vertices) for o in objs if o.type == 'MESH'), 'vertices')
    if prev:
        ground_plane(size=2000, color='#8cc070')
        light_rig()
        for k, (name, objs) in enumerate(shown):
            for o in objs:
                o.location.x += k * 1.4
                if o.name.endswith('_face'):
                    o.hide_render = True        # (the game paints the face)
        cam = camera(((len(shown) - 1) * 0.7, 0, 0.5), dist=4.2, pitch=14)
        render(os.path.join(prev, 'folks2_front.png'), size=(1100, 520), samples=24)
        bpy.data.objects.remove(cam)
        cam = camera(((len(shown) - 1) * 0.7, 0, 0.4), dist=6.0, pitch=34)
        render(os.path.join(prev, 'folks2_game.png'), size=(1100, 520), samples=24)
