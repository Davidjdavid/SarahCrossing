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
from mathutils.bvhtree import BVHTree
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


def sculpt(f, key, voxel=0.32, smooth=5, verts=9000, k=4, ao=0.0, reach=3.0):
    """A part's pieces melted into one soft surface, as a sculpted toy is (voxel remeshed, smoothed, lightened); each new
    vertex takes the colors of the nearest of the pieces' own (so a topping stays its color, blending a little where it
    meets the rice); ao darkens where the surface folds into itself."""
    from mathutils.kdtree import KDTree
    mb, o = f.parts[key]
    kd = KDTree(len(mb.v))
    for i, v in enumerate(mb.v):
        kd.insert(v, i)
    kd.balance()
    ob = mb.obj('_sculpt', vmat('_sculpt'))
    select_only(ob)
    ob.data.remesh_voxel_size = voxel
    ob.data.remesh_voxel_adaptivity = 0.0
    bpy.ops.object.voxel_remesh()
    m = ob.modifiers.new('smooth', 'SMOOTH')
    m.factor, m.iterations = 0.6, smooth
    apply_modifiers(ob)
    m2 = ob.modifiers.new('lighter', 'DECIMATE')
    m2.ratio = min(1.0, verts / max(1, len(ob.data.vertices)))
    apply_modifiers(ob)
    me = ob.data
    out = MB()
    V = [v.co.copy() for v in me.vertices]
    N = [v.normal.copy() for v in me.vertices]
    C = []
    for p in V:
        near = kd.find_n(p, k)
        w = [1.0 / max(1e-3, d) ** 2 for (_, _, d) in near]
        C.append(sum((mb.c[i] * wi for (_, i, _), wi in zip(near, w)), Vector((0, 0, 0))) / sum(w))
    if ao:
        tree = BVHTree.FromPolygons([tuple(v) for v in V], [tuple(pl.vertices) for pl in me.polygons])
        rng = random.Random(7)
        dirs = []
        while len(dirs) < 14:
            d = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-1, 1)))
            if 0.2 < d.length <= 1:
                dirs.append(d.normalized())
        for i, (p, n) in enumerate(zip(V, N)):
            occ = 0.0
            for d in dirs:
                d = d if d.dot(n) > 0 else -d
                hit = tree.ray_cast(p + n * 0.05, d, reach)
                if hit[0] is not None:
                    occ += 1 - hit[3] / reach
            C[i] = C[i] * (1 - ao * occ / len(dirs))
    out.v, out.n, out.c = V, N, C
    out.f = [tuple(pl.vertices) for pl in me.polygons if len(set(pl.vertices)) == len(pl.vertices)]
    bpy.data.objects.remove(ob)
    f.parts[key][0] = out
    return out


# ---------------------------------------------------------------- Maki
def maki():
    """A plump hand-rolled maki, molded as one soft piece: the nori fuller round the middle and a little wider at the
    foot, rice puffing up out of the top with the salmon and cucumber heart, soft cheeks where his blush goes, a molded
    red bow tie; short nori arms with rice-ball hands."""
    f = Folk('maki')
    R, z0, z1 = 18.6, 3.0, 36.5
    nori = rgb('#1d3830')

    def prof(v):
        # a soft cylinder: the edges well rounded, fuller in the middle, a touch wider at the foot
        r0 = 4.6
        if v < 0.12:
            a = v / 0.12 * math.pi / 2
            return R + 0.6 - r0 + r0 * math.sin(a), z0 + r0 - r0 * math.cos(a)
        if v > 0.88:
            a = (1 - v) / 0.12 * math.pi / 2
            return max(0.0, R - r0 + r0 * math.sin(a)), z1 - r0 + r0 * math.cos(a)
        t = (v - 0.12) / 0.76
        return R + 0.6 * (1 - t) + 1.3 * math.sin(t * math.pi), z0 + r0 + t * (z1 - z0 - 2 * r0)
    seam = 1.05      # where the sheet's end overlaps (round from the front, toward his left side)

    def sheet(p, n, u, v):
        # nori: dark green-black with fine fibres across it, a sheen, the overlapping edge a little lighter
        fib = 0.94 + 0.08 * noise.noise(Vector((p.x * 0.35, p.y * 0.35, p.z * 2.2)))
        th = math.atan2(p.y, p.x)
        edge = math.exp(-((((th - seam + math.pi) % math.tau) - math.pi) / 0.06) ** 2)
        return nori * fib * (1 + 0.5 * edge)
    surf(f.body, revolve(prof), soft(sheet, under=0.3, z0=z0, z1=z1, top=0.0), nu=96, nv=34)
    # the top: rice puffing up out of the nori, the salmon in it, the cucumber heart
    def rice(p, n, *_):
        return rgb('#f6f1e4') * (0.9 + 0.12 * noise.noise(p * 1.6)) * (1 + 0.05 * max(0.0, n.z))

    def salmon(p, n, *_):
        r = math.hypot(p.x, p.y)
        stripe = 0.5 + 0.5 * math.cos(r * 2.2 + math.atan2(p.y, p.x) * 0.5)
        return rgb('#f07a5a').lerp(rgb('#fbd0bc'), 0.55 * stripe ** 6)
    surf(f.body, superq(0, 0, z1 - 0.6, R - 2.2, R - 2.2, 3.6), rice, nu=64, nv=14)
    surf(f.body, superq(0, 0, z1 + 1.6, 7.6, 7.6, 2.6), salmon, nu=40, nv=12)
    surf(f.body, superq(0, 0, z1 + 3.0, 3.0, 3.0, 1.9), lambda p, n, *_: rgb('#6cbc48').lerp(rgb('#d8f0a8'), max(0.0, 1 - math.hypot(p.x, p.y) / 2.2)), nu=24, nv=10)
    # soft cheeks under where the blush is painted (FOLK_FACES.maki: 92 of 256 across, 30 below the eyes)
    tree = f.bvh()
    for s_ in (-1, 1):
        p, nn = f.hit(s_ * 10.8, 21.6, tree=tree)
        surf(f.body, superq(p.x - nn.x * 1.65, p.y - nn.y * 1.65, p.z, 6.2, 1.9, 4.4), sheet, nu=20, nv=12)
    # the bow tie under the face, molded: two puffed wings and a knot
    p, nn = f.hit(0, 13.8, tree=tree)
    red = lambda q, nq, *_: rgb('#d6303a') * (0.86 + 0.18 * max(0.0, -nq.y)) * (1 - 0.15 * max(0.0, -nq.z))
    for s_ in (-1, 1):
        m = len(f.body.v)
        surf(f.body, superq(s_ * 3.8, 0, 0, 3.8, 1.9, 2.8, 0.8, 0.9, mod=lambda u, v, s_=s_: 1.0 - 0.3 * max(0.0, math.cos(u * math.tau) * -s_)), red, nu=24, nv=12)
        xform(f.body, m, Matrix.Translation(p + Vector((0, -0.8, 0))))
    m = len(f.body.v)
    surf(f.body, superq(0, 0, 0, 1.7, 1.9, 2.0), lambda q, nq, *_: rgb('#b8242e') * (0.9 + 0.12 * max(0.0, -nq.y)), nu=16, nv=10)
    xform(f.body, m, Matrix.Translation(p + Vector((0, -1.7, 0))))
    sculpt(f, 'body', voxel=0.28, smooth=5, verts=12000, ao=0.3)
    rng = random.Random(3)
    top = f.bvh()

    def on_top(rng):
        a, r = rng.uniform(0, math.tau), rng.uniform(8.6, R - 3.4)
        hit = top.ray_cast(Vector((math.cos(a) * r, math.sin(a) * r, 80)), Vector((0, 0, -1)))
        z = hit[0].z if hit[0] is not None else z1 + 2
        return (math.cos(a) * r, math.sin(a) * r, z + 0.1), (0, 0, 1)
    grains(f.body, rng, 90, on_top)
    # arms: short nori arms from the sides, a ball of rice for each hand (closed shapes, melted)
    for s_, key in ((-1, 'arm_l'), (1, 'arm_r')):
        o = Vector((s_ * (R - 0.4), 0, 19.0))
        mb = f.part(key, o)
        path = [o + Vector((-s_ * 1.0, 0, 0.3)), o + Vector((s_ * 3.0, 0, -1.8)), o + Vector((s_ * 4.6, -0.1, -5.2))]
        for k in range(7):
            t = k / 6
            q = path[0].lerp(path[1], min(1.0, t * 2)) if t < 0.5 else path[1].lerp(path[2], (t - 0.5) * 2)
            ball(mb, q, 2.4 - 0.2 * t, lambda q, nq, *_: nori * (1.0 + 0.1 * nq.z), sub=3)
        hc = o + Vector((s_ * 5.0, -0.2, -7.6))
        ball(mb, hc, (3.0, 2.9, 2.9), rice, sub=3)
        sculpt(f, key, voxel=0.25, smooth=4, verts=1500)
        grains(mb := f.parts[key][0], random.Random(10 + s_), 22, lambda r, hc=hc: (lambda d: (hc + d * 2.85, d))(Vector((r.uniform(-1, 1), r.uniform(-1, 1), r.uniform(-1, 1))).normalized()), size=(0.7, 0.42, 0.38))
    # feet: small and neat, soy-dark
    feet(f, x=8.0, w=3.4, d=4.2, h=2.5, z=2.2, col='#30241f')
    tree = f.bvh()
    face_patch(f, 0, 25.0, 30, tree=tree)
    f.anchor('eyes', f.hit(0, 26.0, tree=tree)[0], 1.0)
    hat_anchor(f, z1 + 4.4, 36)
    return f


# ---------------------------------------------------------------- Kai
def kai():
    """A round glazed bowl (a pot belly, its rim turned in a little) with his face on the upper curve of it, where the
    camera above sees it; on top a soft mound of rice with a few big toppings swept to one side like a surfer's hair."""
    f = Folk('kai')
    blue = rgb('#3c7ad0')
    deep = rgb('#2a5aa8')
    # the bowl's profile (radius, height): a round belly, widest low down, curving in to the rim
    pts = [(0.0, 3.0), (7.0, 3.2), (12.6, 4.6), (17.6, 7.6), (21.0, 12.0), (22.6, 17.2), (22.4, 22.8), (21.2, 27.2), (19.6, 31.2), (12.0, 31.6), (0.0, 31.6)]

    def bowl(v):
        x = v * (len(pts) - 1)
        i = min(len(pts) - 2, int(x))
        t = x - i
        P = [pts[max(0, i - 1)], pts[i], pts[i + 1], pts[min(len(pts) - 1, i + 2)]]
        r = [0.5 * ((2 * P[1][j]) + (-P[0][j] + P[2][j]) * t + (2 * P[0][j] - 5 * P[1][j] + 4 * P[2][j] - P[3][j]) * t * t
                    + (-P[0][j] + 3 * P[1][j] - 3 * P[2][j] + P[3][j]) * t * t * t) for j in (0, 1)]
        return max(0.0, r[0]), r[1]

    def glaze(p, n, u, v):
        # glazed blue, deeper toward the foot, a row of pale dots round it low down (under his mouth), the glaze a touch
        # lighter where it faces up
        c = deep.lerp(blue, max(0.0, min(1.0, (p.z - 4) / 10)))
        th = math.atan2(p.y, p.x)
        d = math.hypot(((th * 16 / math.pi) % 1 - 0.5) * 3.4, (p.z - 7.6) / 1.0)
        c = c.lerp(rgb('#dbe8fb'), max(0.0, min(1.0, (1.0 - d) * 4)))
        # (the inside, where it shows between the rim and the rice: white glaze)
        if p.z > 31.0 and math.hypot(p.x, p.y) < 19.4:
            c = rgb('#eef0ec')
        return c * (0.95 + 0.04 * noise.noise(p * 0.3)) * (1 + 0.08 * max(0.0, n.z))
    surf(f.body, revolve(bowl), soft(glaze, under=0.2, z0=3, z1=31.6), nu=144, nv=44)
    # the rim, glazed white, rolled
    rim = lambda p, n, *_: rgb('#f6f4ee') * (0.92 + 0.08 * max(0.0, n.z))

    def ring(u, v):
        th, ph = u * math.tau, v * math.tau
        rr = 19.7 + 1.55 * math.cos(ph)
        return Vector((math.cos(th) * rr, math.sin(th) * rr, 31.8 + 1.55 * math.sin(ph)))
    surf(f.body, ring, rim, nu=96, nv=12, caps=(False, False))
    # the rice: a soft mound, higher toward his right (the viewer's left) where the toppings sweep up
    def ricec(p, n, *_):
        # rice: warm white, grainy (little bumps of light and shade), a shade creamier than the rim's glaze
        g = noise.noise(p * 1.6)
        return rgb('#f3ecd8') * (0.9 + 0.12 * g) * (1 + 0.06 * max(0.0, n.z))
    surf(f.body, superq(-0.6, 0.6, 32.0, 17.2, 16.4, 8.2), ricec, nu=48, nv=16)
    surf(f.body, superq(-6.0, 2.5, 36.1, 9.5, 9.0, 5.8), ricec, nu=32, nv=14)
    sculpt(f, 'body', voxel=0.3, smooth=6, verts=11000, ao=0.35)
    rng = random.Random(5)
    rice_tree = f.bvh()

    def on_rice(x, y, up=0.0):
        hit = rice_tree.ray_cast(Vector((x, y, 80)), Vector((0, 0, -1)))
        return Vector((x, y, (hit[0].z if hit[0] is not None else 34.0) + up))

    def chunk(c, c2, at, s, rot, fat=False):
        # a topping: a soft rounded chunk, not a cube
        m = len(f.body.v)

        def col(p, n, *_):
            k = rgb(c).lerp(rgb(c2), 0.5 + 0.5 * noise.noise(p * 0.5 + Vector(at)))
            if fat:
                k = k.lerp(rgb('#fde2d4'), 0.75 * max(0.0, math.cos((p.x * 0.9 + p.z) * 1.3)) ** 10)
            return k * (0.88 + 0.14 * max(0.0, n.z))
        surf(f.body, superq(0, 0, 0, s * 1.2, s, s * 0.85, 0.62, 0.66), col, nu=24, nv=14)
        xform(f.body, m, Matrix.Translation(at) @ Euler(rot).to_matrix().to_4x4())
    # tuna, piled up on his right; salmon by it; a fan of avocado at the back on his left
    for (x, y), rot in (((-11.0, -1.5), (0.2, -0.3, 0.4)), ((-8.0, 5.5), (-0.3, 0.2, 1.2))):
        chunk('#c03048', '#dc5068', on_rice(x, y, 1.9), 3.7, rot)
    for (x, y), rot in (((-2.5, 1.0), (0.1, 0.2, 0.3)), ((1.0, 7.5), (-0.2, 0.1, 1.4))):
        chunk('#f2845e', '#f8a882', on_rice(x, y, 1.8), 3.5, rot, fat=True)
    for k in range(3):
        m = len(f.body.v)

        def avo(p, n, *_):
            t = max(0.0, min(1.0, (p.z + 2.8) / 5.6))
            c = rgb('#6aa232').lerp(rgb('#dcea98'), t)
            return c.lerp(rgb('#335020'), max(0.0, min(1.0, (abs(p.y) - 1.1) * 2.5)))
        surf(f.body, superq(0, 0, 0, 6.0, 1.9, 3.2, 1.0, 1.0, mod=lambda u, v: 1 - 0.22 * max(0.0, math.cos(u * math.tau))), avo, nu=24, nv=12)
        xform(f.body, m, Matrix.Translation(on_rice(8.5 + k * 2.2, 5.5 - k * 1.8, 1.8)) @ Euler((0.25, -0.75 + k * 0.15, -0.5 + k * 0.4)).to_matrix().to_4x4())
    # a few edamame at the front, a little seaweed at the back, sesame
    for k, (x, y) in enumerate(((6.0, -8.5), (8.6, -7.2), (4.4, -6.2), (7.4, -4.6))):
        ball(f.body, on_rice(x, y, 0.8 + 0.3 * (k % 2)), (1.6, 1.3, 1.2), lambda p, n, *_: rgb('#7ccf4a') * (0.88 + 0.16 * n.z), sub=2)
    for k in range(5):
        a = -0.6 + k * 0.3
        b0 = on_rice(-2.0 + k * 1.8, 11.0, -0.5)
        tube(f.body, [b0, b0 + Vector((math.sin(a) * 1.5, 1.0, 2.6)), b0 + Vector((math.sin(a) * 3.5, 0.6, 4.6)), b0 + Vector((math.sin(a) * 4.6, -0.8, 5.4))],
             0.9, lambda p, n, *_: rgb('#2a8a52') * (0.9 + 0.2 * n.z), seg=6, r1=0.6)
    grains(f.body, rng, 50, lambda r: (lambda a, d: (on_rice(math.cos(a) * d, math.sin(a) * d * 0.95, 0.1), (0, -0.3, 1)))(r.uniform(0, math.tau), r.uniform(9, 16.5)),
           col='#f8f3e6', size=(0.9, 0.5, 0.45))
    for k in range(14):
        a = rng.uniform(0, math.tau)
        r = rng.uniform(2, 12)
        ball(f.body, on_rice(math.cos(a) * r, math.sin(a) * r * 0.9 - 2, 0.15), (0.5, 0.32, 0.26), '#fbf6ea', sub=1)
    # the hibiscus tucked in by the rim on his left (the viewer's right): five pink petals and a yellow stamen
    hb = on_rice(15.0, -5.0, 0.6)
    for k in range(5):
        a = k / 5 * math.tau
        m = len(f.body.v)
        surf(f.body, superq(3.1, 0, 0, 3.1, 2.5, 0.7, 1.0, 1.0), lambda p, n, *_: rgb('#f2547a').lerp(rgb('#c81e4a'), max(0.0, 1 - p.length / 2.2)), nu=16, nv=8)
        xform(f.body, m, Matrix.Translation(hb) @ Euler((0.9, 0.25, 0.4)).to_matrix().to_4x4() @ Euler((0, 0, a)).to_matrix().to_4x4() @ Euler((0, -0.25, 0)).to_matrix().to_4x4())
    tube(f.body, [hb, hb + Vector((0.4, -2.2, 2.0)), hb + Vector((0.6, -3.4, 3.6))], 0.45, '#f8d040', seg=6)
    ball(f.body, hb + Vector((0.6, -3.4, 3.6)), 0.8, '#f8a830', sub=2)
    # arms: chunky glazed arms from the belly's sides, a white cuff, round hands, each melted into one soft piece (made of
    # closed shapes, so it melts cleanly: balls along the arm, a ring for the cuff)
    for s_, key in ((-1, 'arm_l'), (1, 'arm_r')):
        o = Vector((s_ * 21.8, 0, 20.4))
        mb = f.part(key, o)
        path = [o + Vector((-s_ * 1.2, 0, 0.4)), o + Vector((s_ * 3.6, -0.4, -0.8)), o + Vector((s_ * 6.2, -0.7, -3.8))]
        for k in range(9):
            t = k / 8
            a = path[0].lerp(path[1], min(1.0, t * 2)) if t < 0.5 else path[1].lerp(path[2], (t - 0.5) * 2)
            ball(mb, a, 3.2 - 0.25 * t, lambda q, nq, *_: blue * (0.92 + 0.12 * nq.z), sub=3)
        cu = o + Vector((s_ * 6.5, -0.8, -4.3))
        ax = (path[2] - path[1]).normalized()

        def cuff(u, v, cu=cu, ax=ax):
            side = ax.cross(Vector((0, 1, 0))).normalized()
            up = ax.cross(side).normalized()
            th, ph = u * math.tau, v * math.tau
            rr = 3.2 + 0.75 * math.cos(ph)
            return cu + (side * math.cos(th) + up * math.sin(th)) * rr + ax * (0.75 * math.sin(ph))
        surf(mb, cuff, lambda q, nq, *_: rgb('#f6f4ee') * (0.92 + 0.08 * max(0.0, nq.z)), nu=28, nv=10, caps=(False, False))
        ball(mb, o + Vector((s_ * 7.2, -0.9, -6.6)), (3.6, 3.4, 3.5), lambda q, nq, *_: blue * (0.95 + 0.1 * nq.z), sub=3)
        sculpt(f, key, voxel=0.28, smooth=4, verts=1800)
    # feet: two stubby ceramic feet (the foot ring, split)
    feet(f, x=8.0, w=4.2, d=4.8, h=2.6, z=2.0, col='#24508f')
    tree = f.bvh()
    # (the eyes at 24.6, high on the curve the camera sees: FOLK_FACES.kai lays the face out on this patch)
    face_patch(f, 0, 22.9, 36, tree=tree)
    f.anchor('eyes', f.hit(0, 24.6, tree=tree)[0], 1.2)
    hat_anchor(f, on_rice(0, 0).z + 4.0, 34)
    return f


# ---------------------------------------------------------------- Ginger
def puffy(mb, c, rx, rz, t, col, e_out=1.0, e_face=0.42, nu=56, nv=22, tilt=0.0):
    """A cookie piece: round (or squarer, e_out under 1) seen from the front, its faces flat and its edge puffed round,
    t its half thickness; tilt turns it in the picture's plane."""
    m = len(mb.v)
    surf(mb, superq(0, 0, 0, rx, rz, t, e_out, e_face), col, nu=nu, nv=nv)
    # (made lying down: stood up, its faces toward the front and back)
    xform(mb, m, Matrix.Translation(c) @ Matrix.Rotation(tilt, 4, 'Y') @ Matrix.Rotation(math.pi / 2, 4, 'X'))


def ginger():
    """A gingerbread builder baked as one puffy cookie (head and body one piece, a soft neck between), piped icing, two
    gumdrop buttons, a tool belt with a hammer, the yellow hard hat tipped back so his face shows; soft cheeks under his
    pink icing blush. His arms and legs are the cookie's own, each its own puffy piece."""
    f = Folk('ginger')
    T = 5.4     # half the cookie's thickness

    def bake(p, n, u=0, v=0):
        # baked darker round the edge, paler on the faces, a few darker specks of spice, a touch lighter on top
        edge = 1 - abs(n.y)
        c = rgb('#cc8440').lerp(rgb('#94501f'), 0.6 * edge ** 1.6)
        sp = noise.noise(p * 1.7)
        c = c * (0.94 + 0.07 * noise.noise(p * 0.45))
        if sp > 0.62:
            c = c * 0.8
        return c * (1 + 0.1 * max(0.0, n.z))
    puffy(f.body, Vector((0, 0, 37.4)), 12.2, 11.4, T, bake)
    puffy(f.body, Vector((0, 0, 21.4)), 9.0, 9.8, T, bake, e_out=0.72)
    # (the neck: a soft join)
    puffy(f.body, Vector((0, 0, 29.4)), 6.4, 3.4, T * 0.92, bake)
    # cheeks under the blush (FOLK_FACES.ginger: 84 of 256 across, 34 below the eyes)
    for s_ in (-1, 1):
        surf(f.body, superq(s_ * 7.8, -T + 1.3, 33.4, 4.6, 1.55, 3.8), bake, nu=18, nv=10)
    sculpt(f, 'body', voxel=0.26, smooth=5, verts=9000, ao=0.3)
    icing = lambda p, n, *_: rgb('#fdfbf6') * (0.9 + 0.1 * max(0.0, -n.y))
    # icing: a piped wavy line across the neck
    tube(f.body, [(-7.4 + 14.8 * k / 16, -T - 0.25, 28.8 + 0.7 * math.cos(k * math.pi / 2)) for k in range(17)], 0.75, icing, seg=8)
    # gumdrop buttons: two sugared domes
    for z, c in ((22.8, '#e0303e'), (17.8, '#3ab048')):
        surf(f.body, superq(0, -T - 0.2, z, 2.1, 1.5, 2.0, 1.0, 1.0), lambda p, n, u, v, c=c: rgb(c) * (0.85 + 0.25 * max(0.0, -n.y)) * (1 + 0.12 * (noise.noise(p * 4) > 0.5)), nu=18, nv=10)
    # the tool belt: a leather band round the waist with a brass buckle, a hammer hanging at his left hip
    belt = lambda p, n, *_: rgb('#7a4a26') * (0.85 + 0.2 * max(0.0, -n.y + n.z * 0.5))
    rbox(f.body, -9.6, -T - 0.8, 11.2, 9.6, T + 0.8, 13.8, belt, r=1.0, mid=2)
    rbox(f.body, -1.7, -T - 1.3, 10.9, 1.7, -T - 0.5, 14.1, lambda p, n, *_: rgb('#e2b84a') * (0.9 + 0.2 * max(0.0, -n.y)), r=0.6, mid=0)
    tube(f.body, [(7.4, -T - 1.4, 12.0), (8.0, -T - 1.6, 8.6), (8.4, -T - 1.7, 5.4)], 0.8, lambda p, n, *_: rgb('#b47838') * (0.9 + 0.15 * n.z), seg=10)
    rbox(f.body, 6.2, -T - 2.6, 11.2, 10.6, -T - 0.6, 13.6, lambda p, n, *_: rgb('#9aa0a8') * (0.85 + 0.25 * max(0.0, n.z)), r=0.8, mid=0)
    # arms and legs: puffy cookie pieces, icing squiggles at the wrists and ankles
    for s_, key in ((-1, 'arm_l'), (1, 'arm_r')):
        o = Vector((s_ * 8.0, 0, 25.6))
        mb = f.part(key, o)
        puffy(mb, o + Vector((s_ * 6.2, 0, -1.6)), 7.4, 3.8, T * 0.9, bake, e_out=0.8, nu=40, nv=16, tilt=s_ * 0.38)
        sculpt(f, key, voxel=0.26, smooth=3, verts=1600)
        mb = f.parts[key][0]
        tube(mb, [o + Vector((s_ * (11.0 + 0.7 * (k % 2)), -T * 0.95, -6.6 + k * 1.4)) for k in range(5)], 0.6, icing, seg=6)
    for s_, key in ((-1, 'leg_l'), (1, 'leg_r')):
        o = Vector((s_ * 4.6, 0, 13.5))
        mb = f.part(key, o)
        puffy(mb, o + Vector((s_ * 0.6, 0, -5.4)), 4.4, 6.6, T * 0.9, bake, e_out=0.8, nu=40, nv=16, tilt=-s_ * 0.1)
        sculpt(f, key, voxel=0.26, smooth=3, verts=1600)
        mb = f.parts[key][0]
        tube(mb, [o + Vector((s_ * 1.2 + (k - 2) * 1.5, -T * 0.95, -9.0 + 0.8 * (k % 2))) for k in range(5)], 0.6, icing, seg=6)
    # the yellow hard hat: a dome, a ridge over it, a brim all round; tipped back so his face shows from above
    hat = soft(mottle('#f4b828', 0.04, 0.5), under=0.0, top=0.14)
    m = len(f.body.v)
    surf(f.body, superq(0, 0, 44.2, 10.8, 9.8, 8.6, 1.0, 1.0), hat, nu=48, nv=18, caps=(False, True))
    lathe(f.body, [(14.0, 43.5), (14.2, 44.4), (10.8, 45.0), (0.0, 45.0)], hat, seg=48, cap_top=False, sy=0.9)
    lathe(f.body, [(14.0, 43.5), (0.0, 43.5)], lambda p, n, *_: rgb('#c88c18'), seg=48, cap_top=False, sy=0.9)
    tube(f.body, [(0, -9.8, 45.6), (0, -6.0, 50.6), (0, 0, 53.0), (0, 6.0, 50.6), (0, 9.8, 45.6)], 1.3, shade('#e4a41e'), seg=10)
    xform(f.body, m, Matrix.Translation((0, 2.2, 46.0)) @ Matrix.Rotation(-0.42, 4, 'X') @ Matrix.Translation((0, 0, -44.0)))
    tree = f.bvh()
    face_patch(f, 0, 37.0, 25, tree=tree, lift=0.2)
    f.anchor('eyes', f.hit(0, 38.0, tree=tree)[0], 0.85)
    hat_anchor(f, 55.0, 28)
    return f


FOLKS2 = {'maki': maki, 'kai': kai, 'ginger': ginger}
# how big each stands: smaller than people, but each big enough that its face reads from the game's camera (a
# gingerbread person is flat, so a little bigger again)
SIZE = {'maki': 1.1, 'kai': 1.1, 'ginger': 1.2}


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
