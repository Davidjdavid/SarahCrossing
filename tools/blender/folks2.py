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

    python tools/blender/folks2.py [--preview DIR] [--only maki,kai] [--lod1]

--lod1 makes the phones' versions (folk2_<id>_lod1: the same folk molded from fewer points).
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from mathutils import Vector, Matrix, Euler, noise
from mathutils.bvhtree import BVHTree
from common import *
from trees_ac import MB, vmat, rgb
from kit import shade, rbox, lathe, tube, xform
from folks import Folk, surf, superq, revolve, soft, mottle, ball, feet, hat_anchor, layered, K


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


# how many points a molded surface keeps, against what each part asks for: 60% looks the same as all of it even with
# the camera in close, so that's what's shipped; the phones' versions keep fewer (--lod1)
BUDGET = {'verts': 0.6, 'cap': None}
LOD1 = 0.35
LOD1_CAP = 6000     # (and no part of a phone's folk heavier than this many points, an arm or foot a tenth of it)


def sculpt(f, key, voxel=0.32, smooth=5, verts=9000, k=4, ao=0.0, reach=3.0, recolor=None):
    """A part's pieces melted into one soft surface, as a sculpted toy is (voxel remeshed, smoothed, lightened); each new
    vertex takes the colors of the nearest of the pieces' own (so a topping stays its color, blending a little where it
    meets the rice); ao darkens where the surface folds into itself. recolor(p, n) paints the new surface afresh instead
    (sharper, for a body painted by one function)."""
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
    m2.ratio = min(1.0, verts * BUDGET['verts'] / max(1, len(ob.data.vertices)))
    apply_modifiers(ob)
    me = ob.data
    out = MB()
    V = [v.co.copy() for v in me.vertices]
    N = [v.normal.copy() for v in me.vertices]
    # (the normals evened out over the surface: a lightened mesh's long thin triangles otherwise streak the shading)
    nb = [[] for _ in V]
    for pl in me.polygons:
        vs = list(pl.vertices)
        for a in vs:
            nb[a] += [b for b in vs if b != a]
    for _ in range(2):
        N = [(n + sum((N[j] for j in nb[i]), Vector((0, 0, 0))) / max(1, len(nb[i]))).normalized() for i, n in enumerate(N)]
    C = []
    for p, n in zip(V, N):
        if recolor:
            C.append(Vector(recolor(p, n)))
            continue
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
        occ = []
        for p, n in zip(V, N):
            o = 0.0
            for d in dirs:
                d = d if d.dot(n) > 0 else -d
                hit = tree.ray_cast(p + n * 0.05, d, reach)
                if hit[0] is not None:
                    o += 1 - hit[3] / reach
            occ.append(o / len(dirs))
        # (smoothed over the surface, as the normals are)
        for _ in range(3):
            occ = [(o + sum(occ[j] for j in nb[i])) / (1 + len(nb[i])) for i, o in enumerate(occ)]
        for i, o in enumerate(occ):
            C[i] = C[i] * (1 - ao * o)
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


# ---------------------------------------------------------------- shared by the folks below
def along(path, t):
    """A point t (0..1) of the way along a polyline."""
    P = [Vector(p) for p in path]
    L = [(b - a).length for a, b in zip(P, P[1:])]
    d = t * sum(L)
    for i, l in enumerate(L):
        if d <= l or i == len(L) - 1:
            return P[i].lerp(P[i + 1], min(1.0, d / max(l, 1e-6)))
        d -= l


def ring(mb, c, ax, R, r, col, nu=28, nv=10):
    """A ring (a torus) round the axis ax at c: a cuff, a band."""
    ax = Vector(ax).normalized()
    side = ax.cross(Vector((0, 1, 0)) if abs(ax.y) < 0.9 else Vector((1, 0, 0))).normalized()
    up = ax.cross(side).normalized()
    c = Vector(c)

    def P(u, v):
        th, ph = u * math.tau, v * math.tau
        rr = R + r * math.cos(ph)
        return c + (side * math.cos(th) + up * math.sin(th)) * rr + ax * (r * math.sin(ph))
    surf(mb, P, col, nu=nu, nv=nv, caps=(False, False))


def side_x(f, z, s, y=0.0, tree=None):
    """How far out the body's side is at height z (s: which side)."""
    t = tree or f.bvh()
    loc = t.ray_cast(Vector((s * 500, y, z)), Vector((-s, 0, 0)))[0]
    return abs(loc.x) if loc is not None else 10.0


def top_z(tree, x, y, up=0.0, miss=40.0):
    """The height of what's highest at (x, y), seen from above."""
    loc = tree.ray_cast(Vector((x, y, 300)), Vector((0, 0, -1)))[0]
    return (loc.z if loc is not None else miss) + up


def arms(f, z, col, reach=6.0, drop=3.6, r0=2.7, r1=2.4, hand=None, hr=2.9, band=None, y=0.0, inset=1.0, tree=None):
    """A pair of arms from the body's sides at height z, each its own soft piece (balls along it, melted), with a band
    near the wrist (band: its color) and a round hand (hand: its color), or just the arm's own rounded end."""
    tree = tree or f.bvh()
    for s, key in ((-1, 'arm_l'), (1, 'arm_r')):
        o = Vector((s * (side_x(f, z, s, y, tree) - inset), y, z))
        mb = f.part(key, o)
        path = [o + Vector((-s * 1.2, 0, 0.3)), o + Vector((s * reach * 0.55, -0.3, -drop * 0.25)), o + Vector((s * reach, -0.6, -drop))]
        for k in range(8):
            t = k / 7
            ball(mb, along(path, t), r0 + (r1 - r0) * t, col, sub=3)
        end, ax = path[-1], (path[2] - path[1]).normalized()
        if band:
            ring(mb, end - ax * 0.3, ax, r1 + 0.05, 0.8, band)
        if hand:
            ball(mb, end + ax * (hr * 0.75), hr, hand, sub=3)
        sculpt(f, key, voxel=0.24, smooth=4, verts=1600)


def leaf(mb, base, tip, w, col, t=0.9, bend=0.0):
    """A soft leaf from its base to its tip, w wide, its middle bowed up by bend."""
    base, tip = Vector(base), Vector(tip)
    d = tip - base
    L = d.length
    fw = d.normalized()
    side = fw.cross(Vector((0, 0, 1)))
    side = side.normalized() if side.length > 1e-3 else Vector((1, 0, 0))
    up = side.cross(fw).normalized()

    def P(u, v):
        a = u * math.tau
        k = math.sin(math.pi * v ** 0.8)
        return base + fw * (L * v) + side * (math.cos(a) * w * k) + up * (math.sin(a) * t * k + bend * math.sin(math.pi * v))
    surf(mb, P, col, nu=16, nv=12, caps=(False, False))


# ---------------------------------------------------------------- Basil
def basil():
    """Pad thai heaped into a soft round mound, its noodles running round it with a few loose strands over the top,
    crushed peanuts, his garnish of Thai basil and a lime wedge; arms of bundled noodles."""
    f = Folk('basil')
    gold, deep = rgb('#e8be74'), rgb('#c8964a')

    def noodles(p, n, *_):
        # (noodles wound round the heap: wavy bands, each one's edge a little darker)
        th = math.atan2(p.y, p.x)
        k = 0.5 + 0.5 * math.cos(p.z * 1.7 + math.sin(th * 3 + p.z * 0.2) * 2.2 + noise.noise(p * 0.2) * 2.0)
        return gold.lerp(deep, 0.55 * k ** 5) * (0.95 + 0.06 * noise.noise(p * 0.6))
    col = soft(noodles, under=0.2, z0=4, z1=44)
    lump = lambda u, v: 1 + 0.035 * noise.noise(Vector((math.cos(u * math.tau) * 2, math.sin(u * math.tau) * 2, v * 3)))
    surf(f.body, superq(0, 0, 22.5, 22.0, 19.0, 19.0, 1.0, 0.85, mod=lump), col, nu=72, nv=30)
    surf(f.body, superq(-2.0, 1.0, 36.0, 13.0, 11.0, 7.0), col, nu=40, nv=16)
    # the noodles wound round the heap like a ball of yarn, pressed into it as soft ridges (none across his face)
    rng0 = random.Random(31)
    for k in range(15):
        ax = Vector((rng0.uniform(-1, 1), rng0.uniform(-1, 1), rng0.uniform(-0.4, 1))).normalized()
        e1 = ax.cross(Vector((0.3, 0.2, 1))).normalized()
        e2 = ax.cross(e1).normalized()
        seg = []
        for j in range(73):
            a = j / 72 * math.tau
            d = (e1 * math.cos(a) + e2 * math.sin(a))
            q = Vector((d.x * 22.6, d.y * 19.6, 22.5 + d.z * 19.4))
            if q.z < 4.5 or (q.y < -9 and abs(q.x) < 16 and 11 < q.z < 32):
                if len(seg) > 2:
                    tube(f.body, seg, 1.9, col, seg=8)
                    ball(f.body, seg[0], 1.9, col, sub=2); ball(f.body, seg[-1], 1.9, col, sub=2)
                seg = []
                continue
            seg.append(q)
        if len(seg) > 2:
            tube(f.body, seg, 1.9, col, seg=8)
            ball(f.body, seg[0], 1.9, col, sub=2); ball(f.body, seg[-1], 1.9, col, sub=2)
    sculpt(f, 'body', voxel=0.3, smooth=4, verts=9000, ao=0.4)
    top = f.bvh()
    rng = random.Random(8)
    # loose strands looped over the top
    for k in range(7):
        a, r = rng.uniform(0, math.tau), rng.uniform(2, 11)
        pts = []
        for j in range(7):
            aa, rr = a + j * 0.3, r + j * 1.5
            x, y = math.cos(aa) * rr, math.sin(aa) * rr * 0.85
            pts.append(Vector((x, y, top_z(top, x, y, 0.5))))
        tube(f.body, pts, 1.35, lambda p, n, *_: rgb('#f0cc86').lerp(rgb('#fae2a8'), 0.5 * max(0.0, n.z)), seg=8)
    # crushed peanuts
    for k in range(16):
        a, r = rng.uniform(0, math.tau), math.sqrt(rng.random()) * 11
        x, y = math.cos(a) * r - 1, math.sin(a) * r * 0.8
        m = len(f.body.v)
        rbox(f.body, -0.9, -0.7, -0.5, 0.9, 0.7, 0.5, lambda p, n, *_: rgb('#c89458' if k % 3 else '#e2b77a') * (0.9 + 0.15 * max(0.0, n.z)), r=0.35, mid=0)
        xform(f.body, m, Matrix.Translation((x, y, top_z(top, x, y, 0.4))) @ Euler((rng.uniform(-0.6, 0.6), rng.uniform(-0.6, 0.6), rng.uniform(0, 3))).to_matrix().to_4x4())
    # the Thai basil sprig fanned up on his right (the viewer's left), the lime wedge on his left
    zt = top_z(top, -6, 1)
    for k, (a, tlt, sz) in enumerate(((-0.5, 0.55, 1.0), (0.1, 0.25, 1.1), (0.7, 0.6, 0.9), (2.4, 0.5, 0.85))):
        b = Vector((-6, 1, zt - 0.5))
        tip = b + Vector((math.sin(a) * tlt * 7 * sz, -math.cos(a) * tlt * 3.5, 11 * sz * (1 - tlt * 0.3)))
        leaf(f.body, b, tip, 3.3 * sz, lambda p, n, *_: rgb('#3a9a40').lerp(rgb('#6ac05a'), max(0.0, min(1.0, (p.z - zt) / 9))), t=0.6, bend=0.8)
    m = len(f.body.v)
    lathe(f.body, [(0.0, -2.2), (5.0, -2.2), (5.6, -1.4), (5.6, 1.4), (5.0, 2.2), (0.0, 2.2)], lambda p, n: rgb('#5aa83a') if math.hypot(p.x, p.y) > 4.6 else rgb('#d8ec98'), seg=28, cap_top=True, cap_bot=True)
    xform(f.body, m, Matrix.Translation((8.5, 3, top_z(top, 8.5, 3, 1.2))) @ Euler((math.pi / 2, 0.4, 0.3)).to_matrix().to_4x4())
    tree = f.bvh()
    face_patch(f, 0, 23.0, 32, tree=tree)
    f.anchor('eyes', f.hit(0, 24.5, tree=tree)[0], 1.0)
    arms(f, 21.0, lambda p, n, *_: gold.lerp(deep, 0.35 * (0.5 + 0.5 * math.cos(p.z * 2.2))) * (0.92 + 0.1 * n.z), reach=6.0, drop=3.8, hand='#e8be74', hr=2.7, tree=tree)
    feet(f, x=8.5, w=3.4, d=4.0, h=2.4, z=2.2, col='#5a3a24')
    hat_anchor(f, top_z(top, 0, 0, 2), 30)
    return f


# ---------------------------------------------------------------- Wonton
def wonton():
    """A plump dumpling, its wrapper pleated up into a soft twist on top, a little translucent sheen; small dough arms."""
    f = Folk('wonton')
    dough = rgb('#f6e6c0')

    def prof(v):
        # a wide soft bottom, then a dome drawn up into the pinch at the top
        if v < 0.42:
            a = v / 0.42 * math.pi / 2
            return 23.5 * math.sin(a) ** 0.65, 3.0 + 12 * (1 - math.cos(a))
        t = (v - 0.42) / 0.58
        return 23.5 * max(0.0, math.cos(t * math.pi / 2)) ** 0.95, 15 + 22 * math.sin(t * math.pi / 2)

    def pleat(u, v):
        # (the pleats: ridges gathered up into the twist, each swirling a little round as it rises)
        t = max(0.0, (v - 0.6) / 0.4)
        return 1 + 0.22 * t ** 0.8 * (max(0.0, math.cos(u * math.tau * 8 + t * 1.6)) ** 0.5 - 0.35)

    def col(p, n, u, v):
        th = math.atan2(p.y, p.x)
        t = max(0.0, min(1.0, (p.z - 25) / 12))
        c = dough.lerp(rgb('#e2c48a'), 0.55 * t * (0.5 - 0.5 * math.cos(th * 8 + t * 1.6)))
        return c * (0.96 + 0.05 * noise.noise(p * 0.3))
    surf(f.body, revolve(prof, sy=0.88, mod=pleat), soft(col, under=0.2, z0=3, z1=30), nu=96, nv=34)
    # the twist on top
    surf(f.body, superq(0, 0, 36.6, 4.2, 3.8, 3.4), lambda p, n, *_: rgb('#ecd29c') * (0.95 + 0.08 * max(0.0, n.z)), nu=20, nv=12)
    tube(f.body, [(0, 0, 38.5), (0.6, 0.2, 40.6), (-0.2, 0.4, 42.2), (-1.4, 0.2, 42.6)], 1.8, lambda p, n, *_: rgb('#ecd29c'), seg=10, r1=0.9)
    sculpt(f, 'body', voxel=0.26, smooth=3, verts=11000, ao=0.35)
    tree = f.bvh()
    face_patch(f, 0, 20.5, 32, tree=tree)
    f.anchor('eyes', f.hit(0, 22.0, tree=tree)[0], 1.0)
    arms(f, 15.0, lambda p, n, *_: dough * (0.92 + 0.1 * n.z), reach=5.0, drop=3.0, r0=2.6, r1=2.3, tree=tree, inset=1.4)
    feet(f, x=8.5, w=3.3, d=3.9, h=2.3, z=2.0, col='#6a4a34')
    hat_anchor(f, 41, 24)
    return f


# ---------------------------------------------------------------- Chili
def chili():
    """A glossy red pepper, broad shouldered, tapering to his tip, which he stands on: his two feet are at the base of
    the tip, so nothing floats. The green calyx and a curled stem on top, short red arms."""
    f = Folk('chili')
    red, dark = rgb('#d8322a'), rgb('#b0201c')

    def prof(v):
        # from the tip (v 0, a blunt rounded end) up through the broad shoulder to the top
        if v < 0.55:
            t = v / 0.55
            r = 3.4 + 14.6 * math.sin(t * math.pi / 2) ** 1.6
            return r, 6.0 + 27 * t
        t = (v - 0.55) / 0.45
        return 18.0 * math.cos(t * math.pi / 2) ** 0.6, 33 + 18 * math.sin(t * math.pi / 2)

    def col(p, n, u, v):
        c = red.lerp(dark, max(0.0, min(1.0, (24 - p.z) / 18)) * 0.55)
        return c * (0.96 + 0.05 * noise.noise(p * 0.25)) * (1 + 0.06 * max(0.0, n.z))
    P0 = revolve(prof, sy=0.82)

    def P(u, v):
        p = P0(u, v)
        # (the tip turns a little to his left as it comes down, and stays over his feet)
        t = max(0.0, (20 - p.z) / 14)
        return Vector((p.x + 2.2 * t ** 2, p.y, p.z))
    surf(f.body, P, soft(col, under=0.12, z0=8, z1=46), nu=56, nv=36, caps=(True, True))
    # the tip's end, rounded
    surf(f.body, superq(2.2, 0, 6.6, 3.4, 3.0, 3.0), lambda p, n, *_: dark * 0.95, nu=18, nv=10)
    sculpt(f, 'body', voxel=0.3, smooth=5, verts=10000, ao=0.25)
    top = f.bvh()
    zt = top_z(top, 0, 0)
    # the calyx: seven leaves fanned over the top, draped onto it, the stem curling up out of the middle
    green = mottle('#3a9a3a', 0.08, 0.5)
    for k in range(7):
        a = k / 7 * math.tau + 0.65
        b = Vector((math.cos(a) * 2.0, math.sin(a) * 2.0, zt))
        tip = Vector((math.cos(a) * 10.5, math.sin(a) * 9.0, 0))
        tip.z = top_z(top, tip.x, tip.y, 0.6)
        leaf(f.body, b, tip, 2.8, soft(green, under=0.0, top=0.12), t=0.7, bend=0.6)
    surf(f.body, superq(0, 0, zt + 0.6, 4.6, 4.0, 2.0), green, nu=20, nv=10)
    tube(f.body, [(0, 0, zt), (0.4, 0, zt + 4), (1.6, 0.4, zt + 7.5), (3.6, 0.8, zt + 9)], 1.7, mottle('#4aa846', 0.06, 0.5), seg=10, r1=1.2)
    ball(f.body, (3.9, 0.8, zt + 9.0), 1.25, mottle('#4aa846', 0.06, 0.5), sub=2)
    tree = f.bvh()
    face_patch(f, 0, 32.5, 32, tree=tree)
    f.anchor('eyes', f.hit(0, 34.0, tree=tree)[0], 1.0)
    arms(f, 29.0, lambda p, n, *_: red * (0.9 + 0.12 * n.z), reach=5.6, drop=3.8, r0=2.6, r1=2.3, tree=tree, inset=1.2)
    # his feet at the base of the tip, close together, so he stands on it
    feet(f, x=2.9, w=3.2, d=4.0, h=2.9, z=1.9, col='#3a2426', y=-0.2)
    for key in ('foot_l', 'foot_r'):
        mb, o = f.parts[key]
        for i in range(len(mb.v)):
            mb.v[i] = mb.v[i] + Vector((2.2, 0, 0))
        f.parts[key][1] = o + Vector((2.2, 0, 0))
    hat_anchor(f, zt + 2, 28)
    return f


# ---------------------------------------------------------------- Coco
def coco():
    """A round chocolate truffle dusted with cocoa, a pink bow on top (hers), chocolate arms."""
    f = Folk('coco')
    choc = rgb('#5e3826')

    def col(p, n, *_):
        d = noise.noise(p * 1.3)
        c = choc.lerp(rgb('#8a5a3e'), 0.5 * max(0.0, d - 0.25) * 2 + 0.22 * max(0.0, n.z))
        return c * (0.94 + 0.06 * noise.noise(p * 0.4))
    lump = lambda u, v: 1 + 0.03 * noise.noise(Vector((math.cos(u * math.tau) * 3, math.sin(u * math.tau) * 3, v * 5)))
    surf(f.body, superq(0, 0, 23.0, 22.5, 19.5, 19.5, 1.0, 0.9, mod=lump), soft(col, under=0.2, z0=4, z1=43), nu=64, nv=30)
    sculpt(f, 'body', voxel=0.3, smooth=4, verts=9000, ao=0.2)
    top = f.bvh()
    zt = top_z(top, 0, 0)
    # the pink bow: two puffed loops, two tails, the knot
    pink = soft(mottle('#f08ab8', 0.05, 0.6), under=0.0, top=0.12)
    bow = MB()
    for s_ in (-1, 1):
        m = len(bow.v)
        surf(bow, superq(s_ * 5.2, 0, 0, 5.4, 2.6, 3.6, 0.9, 0.9, mod=lambda u, v, s_=s_: 1.0 - 0.35 * max(0.0, math.cos(u * math.tau) * -s_)), pink, nu=24, nv=12)
        xform(bow, m, Matrix.Translation((0, 0, zt + 1.6)) @ Euler((0, s_ * 0.3, 0)).to_matrix().to_4x4())
        for k in range(6):
            t = k / 5
            ball(bow, Vector((s_ * (1.0 + 3.0 * t), -1.4 - 2.6 * t, zt + 0.6 - 3.0 * t)), 1.3 + 0.3 * t, pink, sub=2)
    ball(bow, (0, -0.4, zt + 1.7), (2.3, 2.3, 2.3), lambda p, n: rgb('#e06aa0'), sub=3)
    f.parts['bow'] = [bow, Vector((0, 0, 0))]
    sculpt(f, 'bow', voxel=0.22, smooth=3, verts=2500)
    f.body.add(f.parts['bow'][0].v, f.parts['bow'][0].c, f.parts['bow'][0].n, f.parts['bow'][0].f)
    del f.parts['bow']
    tree = f.bvh()
    face_patch(f, 0, 25.5, 32, tree=tree)
    f.anchor('eyes', f.hit(0, 26.5, tree=tree)[0], 1.0)
    arms(f, 20.0, lambda p, n, *_: choc * (0.95 + 0.15 * n.z), reach=5.8, drop=3.6, tree=tree)
    feet(f, x=8.5, w=3.3, d=3.9, h=2.3, z=2.0, col='#3a2218')
    hat_anchor(f, zt + 4, 34)
    return f


# ---------------------------------------------------------------- Cece
def cece():
    """A slice of strawberry cheesecake, molded soft: a graham crust, the cream, strawberry sauce glazed over the top and
    running down the front, a strawberry on top; cream arms."""
    f = Folk('cece')
    cream = rgb('#faf0da')
    def lay(p, n, *_):
        # the graham crust (crumbly), a band where it meets the cream, the cream, its top a touch golden from the oven
        if p.z < 11.5:
            return rgb('#b98048') * (0.86 + 0.2 * (0.5 + 0.5 * noise.noise(p * 1.4)))
        if p.z < 12.6:
            return rgb('#e8c890')
        return cream.lerp(rgb('#f6dfae'), max(0.0, min(1.0, (p.z - 36.5) / 4.0)) * 0.6) * (0.97 + 0.03 * noise.noise(p * 0.5))
    # (a slice: wide at the front where its edge is, narrowing toward the point at the back; flat faces, edges rounded)
    m = len(f.body.v)
    surf(f.body, superq(0, 0, 0, 19.0, 11.0, 19.0, 0.45, 0.45), lambda p, n, *_: Vector((1, 1, 1)), nu=64, nv=40)
    for i in range(m, len(f.body.v)):
        q = f.body.v[i]
        k = (1.0 - 0.32 * (q.y + 11.0) / 22.0) * (1.04 - 0.08 * (q.z + 19.0) / 38.0)
        f.body.v[i] = Vector((q.x * k, q.y, q.z + 22.0))
    # (the crust's crumbly edge)
    rng0 = random.Random(4)
    for k in range(70):
        a = rng0.uniform(0, math.tau)
        ball(f.body, (math.cos(a) * 19.5 * (1.0 - 0.32 * (0.5 + 0.5 * math.sin(a))), math.sin(a) * 11.2, rng0.uniform(4.5, 11.5)), rng0.uniform(1.0, 1.7), lambda p, n: Vector((1, 1, 1)), sub=1)
    for i in range(m, len(f.body.v)):
        f.body.c[i] = lay(f.body.v[i], f.body.n[i])
    sculpt(f, 'body', voxel=0.26, smooth=8, verts=9000, ao=0.2, recolor=lay)
    top = f.bvh()
    zt = top_z(top, 0, 0)
    # the sauce glazed over the top, running down the front in two drips
    sauce = mottle('#c8202e', 0.05, 0.5, c2='#e04050')
    sm = MB()
    surf(sm, superq(0, -1.0, zt + 0.2, 15.5, 9.5, 1.3, 0.4, 0.6), sauce, nu=40, nv=12)
    for x, l in ((-8.0, 7.0), (6.0, 4.5)):
        for k in range(7):
            t = k / 6
            ball(sm, (x, -11.0, zt - l * t), 1.2 + 0.5 * t ** 3, sauce, sub=2)
    f.parts['sauce'] = [sm, Vector((0, 0, 0))]
    sculpt(f, 'sauce', voxel=0.2, smooth=3, verts=2500)
    f.body.add(f.parts['sauce'][0].v, f.parts['sauce'][0].c, f.parts['sauce'][0].n, f.parts['sauce'][0].f)
    del f.parts['sauce']
    # the strawberry on top, seeds and a leafy cap
    def berry(p, n, u=0, v=0):
        k = noise.noise(p * 2.5)
        return rgb('#d8303c').lerp(rgb('#f8e088'), 0.9 if k > 0.58 else 0.0) * (1.0 + 0.1 * max(0.0, n.z))
    surf(f.body, revolve(lambda v: (6.4 * math.sin(v * math.pi) ** 0.8 * (1 - 0.35 * (1 - v)), zt + 0.8 + 11.0 * v)), berry, nu=32, nv=16)
    for k in range(6):
        a = k / 6 * math.tau
        leaf(f.body, (0, 0, zt + 11.4), (math.cos(a) * 4.6, math.sin(a) * 4.6, zt + 10.2), 1.5, shade('#3a9a3a'), t=0.4)
    tree = f.bvh()
    face_patch(f, 0, 22.0, 32, tree=tree)
    f.anchor('eyes', f.hit(0, 23.5, tree=tree)[0], 1.0)
    arms(f, 20.0, lambda p, n, *_: cream * (0.93 + 0.08 * n.z), reach=5.6, drop=3.6, tree=tree, inset=1.2)
    feet(f, x=10, w=3.3, d=3.9, h=2.3, z=2.0, col='#8a5a3a')
    hat_anchor(f, zt + 12, 30)
    return f


# ---------------------------------------------------------------- Clementine
def clementine():
    """A dimpled clementine, a stem and two leaves on top, her big dark sunglasses (very her); orange arms."""
    f = Folk('clementine')
    peel = rgb('#f0861e')

    def col(p, n, *_):
        k = 0.93 + 0.08 * noise.noise(p * 1.4)
        return peel.lerp(rgb('#f8a040'), 0.35 * max(0.0, n.z)) * k
    surf(f.body, superq(0, 0, 24.5, 22.5, 20.5, 21.0, 1.0, 1.0), soft(col, under=0.18, z0=4, z1=46), nu=64, nv=32)
    sculpt(f, 'body', voxel=0.3, smooth=3, verts=9000, ao=0.15)
    top = f.bvh()
    zt = top_z(top, 0, 0)
    ball(f.body, (0, 0, zt + 0.2), (2.6, 2.4, 1.2), shade('#7a8a2a'), sub=2)
    tube(f.body, [(0, 0, zt), (0.2, 0, zt + 3.4), (0.5, 0.2, zt + 5.2)], 1.0, shade('#5a7a2a'), seg=8)
    for s_ in (-1, 1):
        leaf(f.body, (0.4, 0.2, zt + 4.6), (s_ * 8.0, 0.8, zt + 7.0), 2.6, soft(mottle('#4a9a3a', 0.06, 0.6), under=0.0, top=0.15), t=0.6, bend=0.7)
    tree = f.bvh()
    face_patch(f, 0, 23.5, 34, tree=tree)
    # the sunglasses: two rounded dark lenses on a bridge, arms back to the sides, a glint
    for s_ in (-1, 1):
        p, nn = f.hit(s_ * 9.6, 27.0, tree=tree)
        m = len(f.body.v)
        rbox(f.body, -5.6, -1.0, -3.6, 5.6, 0.9, 3.6, lambda q, n2, *_: rgb('#1a1a24') * (1 + 0.4 * max(0.0, -n2.y) * max(0.0, n2.z)), r=2.0, mid=1)
        ball(f.body, (-1.8, -1.05, 1.3), (1.8, 0.15, 0.55), '#6a6a8a', sub=1)
        R = Matrix.Translation(p + nn * 0.6) @ Matrix.Rotation(math.atan2(nn.x, -nn.y), 4, 'Z')
        xform(f.body, m, R)
        q, n2 = f.hit(s_ * 19.0, 28.0, tree=tree)
        tube(f.body, [p + nn * 0.4 + Vector((s_ * 5.2, 0, 0.4)), q + n2 * 0.5], 0.7, '#1a1a24', seg=6)
    p, nn = f.hit(0, 28.5, tree=tree)
    tube(f.body, [p + nn * 0.7 + Vector((-4.2, 0, 0)), p + nn * 1.1 + Vector((0, 0, 0.3)), p + nn * 0.7 + Vector((4.2, 0, 0))], 0.75, '#1a1a24', seg=6)
    f.anchor('eyes', f.hit(0, 27.0, tree=tree)[0], 1.0)
    arms(f, 19.0, lambda p, n, *_: peel * (0.92 + 0.12 * n.z), reach=5.8, drop=3.6, tree=tree)
    feet(f, x=9, w=3.3, d=3.9, h=2.3, z=2.0, col='#5a3418')
    hat_anchor(f, zt + 1, 32)
    return f


# ---------------------------------------------------------------- Cuke
def cuke():
    """A tall bumpy cucumber in a red sweatband and red wristbands, white sneakers with a red stripe; green arms."""
    f = Folk('cuke')
    green = rgb('#3e8e3a')

    def prof(v):
        a = v * math.pi
        return 14.0 * math.sin(a) ** 0.34, 7.0 + 26 * (1 - math.cos(a))

    def col(p, n, *_):
        th = math.atan2(p.y, p.x)
        stripe = 0.5 + 0.5 * math.cos(th * 9)
        c = green.lerp(rgb('#6ab85a'), 0.35 * stripe ** 4 + 0.25 * max(0.0, n.z))
        return c * (0.96 + 0.05 * noise.noise(p * 0.3))
    surf(f.body, revolve(prof, sy=0.92), soft(col, under=0.2, z0=7, z1=60), nu=64, nv=36)
    # (soft bumps, as a cucumber has)
    rng = random.Random(6)
    for k in range(34):
        a, z = rng.uniform(0, math.tau), rng.uniform(12, 54)
        r = 13.6 * min(1.0, math.sin(math.pi * (z - 7) / 52) ** 0.3)
        if math.sin(a) < -0.55 and 30 < z < 46:
            continue        # (none on the face)
        ball(f.body, (math.cos(a) * r, math.sin(a) * r * 0.92, z), 1.1, lambda p, n: green * 0.92, sub=2)
    sculpt(f, 'body', voxel=0.3, smooth=5, verts=10000, ao=0.25)
    tree = f.bvh()
    # the sweatband
    band = mottle('#d83a4a', 0.04, 0.8)
    lathe(f.body, [(13.6, 47.5), (14.6, 48.2), (14.8, 50.6), (14.6, 53.0), (13.5, 53.6)], band, seg=56, cap_top=False, sy=0.92)
    face_patch(f, 0, 38.5, 30, tree=tree)
    f.anchor('eyes', f.hit(0, 40.0, tree=tree)[0], 1.0)
    arms(f, 31.0, lambda p, n, *_: green * (0.92 + 0.12 * n.z), reach=5.4, drop=4.2, r0=2.4, r1=2.2, band='#d83a4a', tree=tree)
    # white sneakers, a red stripe, big and bouncy
    for s_, key in ((-1, 'foot_l'), (1, 'foot_r')):
        o = Vector((s_ * 7.6, -1.0, 6.4))
        mb = f.part(key, o)
        surf(mb, superq(o.x, o.y - 1.8, 2.6, 4.6, 5.8, 2.6, 0.6, 0.7), lambda p, n, *_: rgb('#f8f6f2') if p.z > 1.4 else rgb('#d8d4cc'), nu=28, nv=14)
        ring(mb, (o.x, o.y - 1.6, 2.4), (0, 0, 1), 4.0, 0.55, '#d8384a')
        tube(mb, [(o.x, o.y - 1.0, 4.4), (o.x, o.y + 0.2, 6.6)], 2.4, '#f8f6f2', seg=10)
        sculpt(f, key, voxel=0.22, smooth=3, verts=1800)
    hat_anchor(f, 60, 26)
    return f


# ---------------------------------------------------------------- Sully
def sully():
    """A square of sponge cake, puffed soft, a layer of cream through the middle and chocolate glaze over the top running
    down in drips, his tweed flat cap (an old gent's); sponge arms."""
    f = Folk('sully')
    sponge = rgb('#f2c46a')

    def cake(p, n, *_):
        if p.z > 36.0:
            return rgb('#5a301e')
        if 20.0 < p.z < 24.5:
            return rgb('#fbe8b0')
        # (the sponge's little holes)
        return sponge * (0.88 + 0.12 * (0.5 + 0.5 * noise.noise(p * 1.1))) * (0.92 if noise.noise(p * 2.2) > 0.55 else 1.0)
    m = len(f.body.v)
    surf(f.body, superq(0, 0, 0, 21.5, 12.0, 17.5, 0.5, 0.5), lambda p, n, *_: Vector((1, 1, 1)), nu=64, nv=36)
    for i in range(m, len(f.body.v)):
        q = f.body.v[i]
        f.body.v[i] = Vector((q.x * (1.03 - 0.06 * (q.z + 17.5) / 35), q.y, q.z + 21.5))
    for i in range(m, len(f.body.v)):
        f.body.c[i] = cake(f.body.v[i], f.body.n[i])
    # (big flat walls show the melt's grain as faint ridges unless they're smoothed well)
    sculpt(f, 'body', voxel=0.26, smooth=9, verts=8500, ao=0.2, recolor=cake)
    top = f.bvh()
    zt = top_z(top, 0, 0)
    # the glaze over the top and its drips down the front and sides
    gl = MB()
    choc = lambda p, n, *_: rgb('#5a301e') * (1 + 0.25 * max(0.0, n.z))
    surf(gl, superq(0, 0, zt - 0.6, 21.0, 11.8, 1.8, 0.45, 0.6), choc, nu=48, nv=12)
    for x, l in ((-16, 5), (-8.5, 8), (-1, 4.5), (6.5, 7), (14.5, 5)):
        for k in range(7):
            t = k / 6
            ball(gl, (x, -11.6, zt - 1.5 - l * t), 1.4 + 0.5 * t ** 3, choc, sub=2)
    f.parts['glaze'] = [gl, Vector((0, 0, 0))]
    sculpt(f, 'glaze', voxel=0.22, smooth=3, verts=3000)
    f.body.add(*[getattr(f.parts['glaze'][0], k) for k in ('v', 'c', 'n', 'f')])
    del f.parts['glaze']
    # the tweed flat cap, tipped a little, its brim to the front
    tweed = soft(lambda p, n, u=0, v=0: rgb('#8e877c') * (0.86 + 0.16 * (0.5 + 0.5 * math.sin(p.x * 2.4) * math.sin(p.y * 2.4))), under=0.0, top=0.08)
    cap = MB()
    surf(cap, superq(0, 2.0, 3.0, 14.0, 12.0, 6.6, 1.0, 1.0), tweed, nu=48, nv=18)
    surf(cap, superq(0, -9.5, 1.0, 10.5, 6.0, 1.2, 0.8, 1.0), tweed, nu=32, nv=10)
    ball(cap, (0, 1.5, 7.6), (1.4, 1.4, 0.8), shade('#7a7468'), sub=1)
    f.parts['cap'] = [cap, Vector((0, 0, 0))]
    sculpt(f, 'cap', voxel=0.24, smooth=3, verts=3500)
    xform(f.parts['cap'][0], 0, Matrix.Translation((-2.0, 0.5, zt - 0.4)) @ Euler((0.08, -0.1, 0)).to_matrix().to_4x4())
    f.body.add(*[getattr(f.parts['cap'][0], k) for k in ('v', 'c', 'n', 'f')])
    del f.parts['cap']
    tree = f.bvh()
    face_patch(f, 0, 25.5, 34, tree=tree)
    f.anchor('eyes', f.hit(0, 27.0, tree=tree)[0], 1.0)
    arms(f, 19.0, lambda p, n, *_: sponge * (0.92 + 0.1 * n.z), reach=5.8, drop=3.8, tree=tree, inset=1.2)
    feet(f, x=11, w=3.5, d=4.0, h=2.4, z=2.0, col='#4a2c1c')
    hat_anchor(f, zt + 8, 34)
    return f


# ---------------------------------------------------------------- Brulee
def brulee():
    """A crème brûlée in a fluted white ramekin, the custard swelling up over its rim, the torched sugar on top glassy and
    browned, an artist's beret tipped to one side; custard arms."""
    f = Folk('brulee')
    custard = rgb('#fbe8b8')

    def ram(v):
        # the ramekin (fluted, so its radius ripples round it) up to its rim, then the custard on top
        z = 3.5 + 33.5 * v
        if z < 5.5:
            r = 18.5 + 2.5 * math.sin((z - 3.5) / 2.0 * math.pi / 2)
        elif z < 20.0:
            r = 21.0 + 0.4 * (z - 5.5) / 14.5
        elif z < 34.0:
            r = 21.2 - 0.2 * (z - 20) / 14
        else:
            r = 21.0 * math.cos((z - 34.0) / 3.0 * math.pi / 2) ** 0.5
        return r, z

    def col(p, n, u, v):
        th = math.atan2(p.y, p.x)
        if p.z < 19.6:
            return rgb('#f4f0ea') * (0.9 + 0.1 * (0.5 + 0.5 * math.cos(th * 22))) * (0.92 if p.z < 6 else 1.0)
        if p.z > 35.4:
            k = noise.noise(p * 0.45)
            return rgb('#d8943e').lerp(rgb('#8a4a1a'), max(0.0, k) * 0.9)
        return custard * (0.97 + 0.03 * noise.noise(p * 0.4))
    flute = lambda u, v: 1 + (0.012 * math.cos(u * math.tau * 22) if 3.5 + 33.5 * v < 19.6 else 0.0)
    surf(f.body, revolve(ram, sy=0.95, mod=flute), col, nu=132, nv=40)
    # (the ramekin's rim, a rolled lip; the custard swelling over it)
    ring(f.body, (0, 0, 19.6), (0, 0, 1), 21.4, 0.9, lambda p, n, *_: rgb('#f8f6f2'))
    # (a tall smooth wall shows the melt's grain as faint ridges unless it's smoothed well)
    sculpt(f, 'body', voxel=0.24, smooth=9, verts=11000, ao=0.25, recolor=lambda p, n: col(p, n, 0, 0) if p.z > 20.6 or p.z < 19.0 else rgb('#f8f6f2'))
    top = f.bvh()
    zt = top_z(top, 0, 0)
    # the beret, tipped to one side, its little stalk
    ber = MB()
    surf(ber, superq(0, 0, 0, 15.0, 13.5, 4.8), soft(mottle('#8e2c48', 0.05, 0.4), under=0.0, top=0.12), nu=48, nv=18)
    tube(ber, [(0, 0, 4.4), (0.4, 0, 6.6), (1.0, 0, 7.6)], 0.9, shade('#7a2440'), seg=8)
    ball(ber, (1.0, 0, 7.6), 0.9, shade('#7a2440'), sub=2)
    f.parts['beret'] = [ber, Vector((0, 0, 0))]
    sculpt(f, 'beret', voxel=0.22, smooth=3, verts=3000)
    xform(f.parts['beret'][0], 0, Matrix.Translation((2.5, 1.0, zt + 2.0)) @ Euler((0, 0.2, 0)).to_matrix().to_4x4())
    f.body.add(*[getattr(f.parts['beret'][0], k) for k in ('v', 'c', 'n', 'f')])
    del f.parts['beret']
    tree = f.bvh()
    face_patch(f, 0, 28.8, 32, tree=tree)
    f.anchor('eyes', f.hit(0, 30.0, tree=tree)[0], 1.0)
    arms(f, 24.0, lambda p, n, *_: custard * (0.93 + 0.08 * n.z), reach=5.6, drop=3.8, tree=tree, inset=1.2)
    feet(f, x=11, w=3.4, d=4.0, h=2.4, z=2.0, col='#4a2c1c')
    hat_anchor(f, zt + 8, 30)
    return f


# ---------------------------------------------------------------- Mac
def mac():
    """Mac and cheese heaped in a deep blue bowl, macaroni in the cheese, a chef's toque (he runs the restaurant); arms
    bent like macaroni elbows."""
    f = Folk('mac')
    cheese = rgb('#f6c838')

    def bowl(v):
        z = 3.5 + 17.5 * v
        r = 16.5 + 7.0 * math.sin(min(1.0, (z - 3.5) / 15.0) * math.pi / 2) ** 0.8
        return r, z
    surf(f.body, revolve(bowl), soft(mottle('#3a64ac', 0.03, 0.4), under=0.25, z0=3.5, z1=21), nu=72, nv=20, caps=(True, True))
    ring(f.body, (0, 0, 20.8), (0, 0, 1), 22.9, 1.0, lambda p, n, *_: rgb('#4a76c0') * (1 + 0.1 * max(0.0, n.z)))
    lump = lambda u, v: 1 + 0.03 * noise.noise(Vector((math.cos(u * math.tau) * 3, math.sin(u * math.tau) * 3, v * 4)))
    surf(f.body, superq(0, 0, 25.0, 22.4, 22.0, 14.0, 1.0, 0.75, mod=lump), mottle('#f6c838', 0.05, 0.6), nu=64, nv=24)
    bowlc, cheesec = soft(mottle('#3a64ac', 0.03, 0.4), under=0.25, z0=3.5, z1=21), mottle('#f6c838', 0.05, 0.6)
    sculpt(f, 'body', voxel=0.3, smooth=4, verts=8000, ao=0.25, recolor=lambda p, n: bowlc(p, n) if p.z < 20.2 or (p.z < 21.9 and math.hypot(p.x, p.y) > 22.6) else cheesec(p, n))
    top = f.bvh()
    # macaroni elbows pressed into the cheese all round (none over his face)
    rng = random.Random(12)
    for k in range(44):
        a = rng.uniform(0, math.tau)
        zz = rng.uniform(23, 37)
        loc = top.ray_cast(Vector((math.cos(a) * 60, math.sin(a) * 60, zz)), Vector((-math.cos(a), -math.sin(a), 0)))
        if loc[0] is None:
            continue
        c, nn = loc[0], loc[1]
        if c.y < -8 and abs(c.x) < 16 and 18 < zz < 34:
            continue
        t = nn.cross(Vector((0, 0, 1)))
        t = (t.normalized() if t.length > 1e-3 else Vector((1, 0, 0))) * 2.0
        up = nn.cross(t).normalized() * 1.6
        arc_ = [c + t * math.cos(a2) + up * math.sin(a2) * 0.9 + nn * (0.2 + 0.6 * math.sin(a2)) for a2 in (math.pi * 0.05 + math.pi * 0.9 * j / 6 for j in range(7))]
        tube(f.body, arc_, 1.3, shade('#f8d860' if k % 2 else '#eab830'), seg=10)
        ball(f.body, arc_[0], 1.3, shade('#eab830'), sub=1); ball(f.body, arc_[-1], 1.3, shade('#eab830'), sub=1)
    zt = top_z(top, 0, 0)
    # the chef's toque: a band and a puffed top, molded
    toq = MB()
    lathe(toq, [(10.5, 0.0), (10.8, 5.0), (10.4, 5.6)], lambda p, n: rgb('#fbfbf6'), seg=40, cap_top=True, cap_bot=True)
    for (x, y, z, r) in ((0, 0, 10.0, 8.6), (-6.2, 1, 8.6, 6.4), (6.2, 1, 8.6, 6.4), (-3.4, -4.4, 10.0, 6.0), (3.4, -4.4, 10.0, 6.0), (0, 5, 11.0, 6.4)):
        ball(toq, (x, y, z), (r, r, r * 0.82), lambda p, n: rgb('#fbfbf6') * (0.95 + 0.05 * max(0.0, n.z)), sub=3)
    f.parts['toque'] = [toq, Vector((0, 0, 0))]
    sculpt(f, 'toque', voxel=0.24, smooth=3, verts=3500, ao=0.3)
    xform(f.parts['toque'][0], 0, Matrix.Translation((0, 0.5, zt - 1.0)))
    f.body.add(*[getattr(f.parts['toque'][0], k) for k in ('v', 'c', 'n', 'f')])
    del f.parts['toque']
    tree = f.bvh()
    face_patch(f, 0, 27.8, 32, tree=tree)
    f.anchor('eyes', f.hit(0, 29.0, tree=tree)[0], 1.0)
    arms(f, 26.0, lambda p, n, *_: cheese * (0.92 + 0.1 * n.z), reach=5.6, drop=4.4, r0=2.5, r1=2.5, tree=tree, inset=1.4)
    feet(f, x=9, w=3.4, d=4.0, h=2.4, z=2.0, col='#2a3a64')
    hat_anchor(f, zt + 16, 24)
    return f


# ---------------------------------------------------------------- Fortune
def fortune():
    """A fortune cookie, its two halves folded up with the crease pressed into the front, the paper slip peeking out of
    one side; cookie arms. She keeps the shop."""
    f = Folk('fortune')
    cookie = rgb('#e8b45a')

    def col(p, n, *_):
        k = 0.94 + 0.08 * noise.noise(p * 0.35)
        c = cookie.lerp(rgb('#f2c878'), 0.5 * max(0.0, n.z))
        top = max(0.0, (p.z - 21) / 17)
        # (the fold down the middle of the top: darker in the crease, the line itself darker still)
        c = c * (1 - 0.28 * math.exp(-(p.x ** 2) / 30) * top ** 1.5 - 0.22 * math.exp(-(p.x ** 2) / 2.5) * min(1.0, max(0.0, (p.z - 27) / 6)))
        return c.lerp(rgb('#c8903e'), 0.4 * max(0.0, 1 - abs(n.y)) ** 3) * k
    P0 = superq(0, 0, 21, 23.0, 16.0, 17.0, 0.72, 0.72)

    def P(u, v):
        # the halves folded up: the top pressed down along the middle into a deep crease, either half rising to a rounded
        # wing, the crease pinching in at the front and the back where it meets the edges (it reads from above)
        p = P0(u, v)
        top = max(0.0, (p.z - 21) / 17)
        z = p.z - 6.0 * math.exp(-(p.x ** 2) / 40) * top ** 1.5 + 2.2 * min(1.0, abs(p.x) / 20) ** 2 * top
        y = p.y
        if p.y < -6 and z > 27:
            y += 2.4 * math.exp(-(p.x ** 2) / 14) * min(1.0, (z - 27) / 8)
        if p.y > 6:
            y -= 1.6 * math.exp(-(p.x ** 2) / 14) * top
        return Vector((p.x, y, z))
    surf(f.body, P, soft(col, under=0.18, z0=4, z1=38), nu=80, nv=44)
    sculpt(f, 'body', voxel=0.26, smooth=2, verts=10000, ao=0.3)
    # the paper slip peeking out of her left side, red printing on it
    m = len(f.body.v)
    rbox(f.body, -0.35, -2.8, -4.4, 0.35, 2.8, 4.4, '#fbf8f0', r=0.3, mid=0)
    ball(f.body, (-0.5, -0.8, 1.0), (0.1, 1.0, 0.4), '#d84a3a', sub=1)
    ball(f.body, (-0.5, 0.6, -0.8), (0.1, 1.2, 0.35), '#d84a3a', sub=1)
    xform(f.body, m, Matrix.Translation((22.2, -7.5, 13.0)) @ Euler((0.1, -0.3, 0.35)).to_matrix().to_4x4())
    tree = f.bvh()
    face_patch(f, 0, 20.0, 32, tree=tree)
    f.anchor('eyes', f.hit(0, 21.0, tree=tree)[0], 1.0)
    arms(f, 18.0, lambda p, n, *_: cookie * (0.92 + 0.12 * n.z), reach=5.6, drop=3.6, tree=tree, inset=1.4)
    feet(f, x=10, w=3.4, d=4.0, h=2.4, z=2.0, col='#5a3418')
    hat_anchor(f, 38, 30)
    return f


# ---------------------------------------------------------------- Floss
def floss():
    """A fluffy cloud of cotton candy, pink with a puff of blue, on a striped paper cone; she stands on the cone's tip, her
    feet at its base; fluffy pink arms. She does everyone's hair."""
    f = Folk('floss')
    pink = '#f6a2cc'

    def fluff(base, alt, seed):
        def f2(p, n, *_):
            k = 0.5 + 0.5 * noise.noise(p * 0.35 + Vector((seed, 0, 0)))
            return rgb(base).lerp(rgb(alt), k * 0.5) * (1.0 + 0.06 * max(0.0, n.z))
        return f2
    for (x, y, z, r) in ((8, 6, 40, 11), (15, 4, 33, 8.5), (12, 10, 46, 7.5)):
        ball(f.body, (x, y, z), (r, r * 0.9, r * 0.95), fluff('#a6cef2', '#c8e2f8', 3), sub=3)
    for (x, y, z, r) in ((0, -1, 34, 13.5), (-10, 1, 35, 9.5), (8, -1, 32, 9.0), (-4, 2, 44, 9.5), (5, 1, 43, 8.5), (-14, 3, 28, 6.5), (11, 1, 27, 6.5), (0, 0, 26, 9.0)):
        ball(f.body, (x, y, z), (r, r * 0.9, r * 0.95), fluff(pink, '#fbc8e2', 5), sub=3)
    sculpt(f, 'body', voxel=0.3, smooth=10, verts=13000, ao=0.2)
    # (fluffy: the melted cloud's surface ruffled a little, as spun sugar is)
    mb = f.body
    for i, (q, n) in enumerate(zip(mb.v, mb.n)):
        mb.v[i] = q + n * (0.45 * noise.noise(q * 0.45) + 0.15 * noise.noise(q * 1.1))
    # the paper cone, striped, its tip at the bottom
    lathe(f.body, [(2.2, 6.0), (3.6, 7.5), (10.6, 22.5), (11.4, 23.8)], lambda p, n, z0=0, z1=1: rgb('#f2e4c6').lerp(rgb('#d8c4a0'), 0.6 if math.sin(math.atan2(p.y, p.x) * 3 + p.z * 0.45) > 0.6 else 0.0), seg=40, cap_top=True, cap_bot=True)
    ball(f.body, (0, 0, 6.2), 2.4, lambda p, n: rgb('#d8c4a0'), sub=2)
    tree = f.bvh()
    face_patch(f, 0, 32.0, 28, tree=tree)
    f.anchor('eyes', f.hit(0, 33.0, tree=tree)[0], 0.9)
    arms(f, 30.0, fluff(pink, '#fbc8e2', 5), reach=4.6, drop=3.4, r0=2.8, r1=2.6, tree=tree, inset=2.0)
    # her feet at the base of the cone's tip
    feet(f, x=2.6, w=2.6, d=3.2, h=2.4, z=2.0, col='#7a4a5a', y=-0.2)
    hat_anchor(f, 52, 30)
    return f


# ---------------------------------------------------------------- Waffle
def waffle():
    """A golden waffle, its grid pressed in soft (shallow where his face is), a pat of butter melting on top and running
    over the edge; waffle arms. He builds the displays."""
    f = Folk('waffle')
    dough = rgb('#e8a850')
    m = len(f.body.v)
    surf(f.body, superq(0, 0, 0, 19.0, 6.6, 15.0, 0.42, 0.5), lambda p, n, *_: Vector((1, 1, 1)), nu=96, nv=64)
    for i in range(m, len(f.body.v)):
        q = f.body.v[i]
        # the grid: pockets pressed into both faces, a raised ridge between each
        gx = 0.5 + 0.5 * math.cos(q.x / 38.0 * math.tau * 5)
        gz = 0.5 + 0.5 * math.cos((q.z + 15.0) / 30.0 * math.tau * 4)
        pocket = (1 - gx ** 6) * (1 - gz ** 6)
        face = 0.35 if (q.y < 0 and abs(q.x) < 14 and -6 < q.z < 9) else 1.0
        if abs(q.y) > 4.5:
            q = Vector((q.x, q.y - math.copysign(1.4 * pocket * face, q.y), q.z))
        f.body.v[i] = Vector((q.x, q.y, q.z + 19.5))
        f.body.c[i] = dough.lerp(rgb('#c88a3a'), 0.6 * pocket * face) if abs(q.y) > 4.5 else rgb('#c8883a')
    sculpt(f, 'body', voxel=0.26, smooth=2, verts=12000, ao=0.35)
    top = f.bvh()
    zt = top_z(top, 0, 0)
    # the butter pat melting on top, a drip running over the edge
    but = MB()
    butter = soft(mottle('#f8e27a', 0.03, 0.6), under=0.0, top=0.12)
    rbox(but, -7.0, -4.5, 0, 7.0, 4.5, 4.0, butter, r=1.6, mid=1)
    surf(but, superq(0, 0, 0.2, 10.5, 6.0, 0.9), butter, nu=32, nv=10)
    for k in range(6):
        t = k / 5
        ball(but, (5.5, -6.6, -0.4 - 4.6 * t), 1.2 + 0.4 * t ** 3, butter, sub=2)
    f.parts['butter'] = [but, Vector((0, 0, 0))]
    sculpt(f, 'butter', voxel=0.22, smooth=3, verts=2500)
    xform(f.parts['butter'][0], 0, Matrix.Translation((0.5, 0, zt)) @ Euler((0, 0, 0.08)).to_matrix().to_4x4())
    f.body.add(*[getattr(f.parts['butter'][0], k) for k in ('v', 'c', 'n', 'f')])
    del f.parts['butter']
    tree = f.bvh()
    face_patch(f, 0, 21.0, 30, tree=tree, lift=0.3)
    f.anchor('eyes', f.hit(0, 22.0, tree=tree)[0], 1.0)
    arms(f, 18.0, lambda p, n, *_: dough * (0.92 + 0.12 * n.z), reach=5.6, drop=3.6, r0=2.4, r1=2.3, tree=tree, inset=1.0)
    feet(f, x=9, w=3.3, d=3.9, h=2.3, z=2.0, col='#5a3418')
    hat_anchor(f, zt + 5, 34)
    return f


# ---------------------------------------------------------------- Wasabi
def wasabi():
    """DJ Wasabi: a swirl of wasabi piled in soft tiers to a curl, his DJ shades and headphones (his whole thing); green
    arms."""
    f = Folk('wasabi')
    green = '#8cc43c'
    col = soft(mottle(green, 0.05, 0.4), under=0.18, z0=4, z1=42, top=0.08)
    surf(f.body, superq(0, 0, 13.0, 23.5, 18.5, 10.0, 1.0, 0.8), col, nu=64, nv=24)
    for k, (r, z) in enumerate(((18.0, 20.0), (13.5, 26.5), (9.5, 32.0), (6.0, 36.5))):
        surf(f.body, superq(k * 0.6, 0, z, r, r * 0.8, 4.8 - k * 0.4, 1.0, 1.0), col, nu=48, nv=16)
    for j in range(8):
        t = j / 7
        ball(f.body, (1.8 - 2.8 * t ** 1.4, -0.6 * t, 38.0 + 6.0 * math.sin(t * 2.0)), 2.8 - 1.8 * t, col, sub=2)
    sculpt(f, 'body', voxel=0.28, smooth=4, verts=10000, ao=0.3)
    tree = f.bvh()
    face_patch(f, 0, 22.0, 34, tree=tree)
    # DJ shades: a wide black bar with a blue gleam
    p, nn = f.hit(0, 24.5, tree=tree)
    m = len(f.body.v)
    rbox(f.body, -16.0, -1.0, -3.2, 16.0, 1.0, 3.0, lambda q, n2, *_: rgb('#16161e') * (1 + 0.4 * max(0.0, n2.z)), r=1.6, mid=2)
    for s_ in (-1, 1):
        ball(f.body, (s_ * 8.5 - 2.0, -1.0, 1.3), (2.0, 0.2, 0.55), '#5ab8e8', sub=1)
    xform(f.body, m, Matrix.Translation(p + nn * 0.4))
    # the headphones: a band over the swirl, red cups at the sides
    tube(f.body, [(math.cos(a) * 21.0, 0, 24.0 + math.sin(a) * 19.5) for a in (math.pi * j / 24 for j in range(25))], 1.6, '#1e1e26', seg=10)
    for s_ in (-1, 1):
        m = len(f.body.v)
        lathe(f.body, [(5.5, 0.0), (6.0, 1.2), (6.0, 3.6), (5.0, 4.6), (0.0, 4.8)], lambda q, n2: rgb('#e04a5c') if q.z > 1.0 else rgb('#1e1e26'), seg=28, cap_top=True)
        xform(f.body, m, Matrix.Translation((s_ * 20.5, 0, 23.0)) @ Euler((0, s_ * math.pi / 2, 0)).to_matrix().to_4x4())
    f.anchor('eyes', f.hit(0, 24.5, tree=tree)[0], 1.0)
    arms(f, 15.0, lambda p, n, *_: rgb(green) * (0.92 + 0.12 * n.z), reach=5.6, drop=3.4, tree=tree, inset=1.4)
    feet(f, x=10, w=3.4, d=4.0, h=2.4, z=2.0, col='#3a5a1a')
    hat_anchor(f, 46, 22)
    return f


# ---------------------------------------------------------------- the goat
def goat():
    """The farm's goat, molded in one shaggy piece (body, neck, head and muzzle), curled horns, floppy ears, a little beard
    and tail; four legs, each its own part from the hip, so it trots."""
    f = Folk('goat')
    coat = rgb('#f2f0ea')

    def shag(p, n, *_):
        return coat * (0.9 + 0.12 * (0.5 + 0.5 * noise.noise(p * 0.9))) * (1 - 0.08 * max(0.0, -n.z))
    surf(f.body, superq(0, 2.0, 19.0, 8.6, 14.5, 7.8), shag, nu=40, nv=22)
    surf(f.body, superq(0, -12.5, 24.5, 4.4, 4.6, 6.0), shag, nu=24, nv=14)
    surf(f.body, superq(0, -17.0, 30.0, 5.6, 6.6, 5.4), shag, nu=32, nv=18)
    surf(f.body, superq(0, -22.0, 28.4, 3.8, 3.8, 3.3), shag, nu=24, nv=14)
    for k in range(5):
        t = k / 4
        ball(f.body, (0, -21.0 - 0.4 * t, 25.0 - 3.4 * t), 1.6 - 0.9 * t, shag, sub=2)
    for k in range(4):
        t = k / 3
        ball(f.body, (0, 16.0 + 1.0 * t, 22.0 + 3.6 * t), 1.9 - 0.9 * t, shag, sub=2)
    sculpt(f, 'body', voxel=0.24, smooth=4, verts=7000, ao=0.25)
    ball(f.body, (0, -25.4, 29.0), (1.9, 0.9, 1.3), shade('#f0a0a8'), sub=2)
    for s_ in (-1, 1):
        leaf(f.body, (s_ * 4.0, -16.0, 33.0), (s_ * 9.5, -15.0, 30.0), 1.9, lambda p, n, *_: rgb('#f6c8c8') if n.y < -0.3 else coat, t=0.8, bend=-0.4)
        pts = [(s_ * 2.2, -16.5, 34.6), (s_ * 2.8, -15.0, 38.5), (s_ * 3.4, -12.0, 41.0), (s_ * 3.6, -9.6, 40.4)]
        tube(f.body, pts, 1.35, mottle('#b89a6a', 0.08, 1.0), seg=10, r1=0.6)
        ball(f.body, pts[-1], 0.6, mottle('#b89a6a', 0.08, 1.0), sub=1)
    tree = f.bvh()
    face_patch(f, 0, 31.0, 12, tree=tree, lift=0.16)
    for (sx, sy, key) in ((-1, -1, 'leg_fl'), (1, -1, 'leg_fr'), (-1, 1, 'leg_bl'), (1, 1, 'leg_br')):
        o = Vector((sx * 4.6, sy * 9.0 + 1.0, 14.0))
        mb = f.part(key, o)
        for k in range(12):
            t = k / 11
            ball(mb, o + Vector((0, 0, -11.0 * t)), 2.5 - 0.5 * t, shag, sub=2)
        sculpt(f, key, voxel=0.22, smooth=5, verts=800)
        mb = f.parts[key][0]
        lathe(mb, [(2.2, 0.0), (2.3, 1.0), (2.1, 3.0), (0.0, 3.1)], '#4a4044', c=(o.x, o.y, 0), seg=14, cap_top=True)
    f.anchor('eyes', (0, -22.0, 31.0), 0.5)
    hat_anchor(f, 36, 13, y=-17.0)
    return f


# ---------------------------------------------------------------- the Cozy Council
def broccoli2(name, stem_w, stem_h, crown_w, crown_h, face_z, face_w, arm_z):
    """A broccoli of the council, molded: a stalk (soft, a little wider at the foot) under a crown of florets melted
    together with a groove round each, budded and darker deep down; stalk arms."""
    f = Folk(name)
    stem = rgb('#a8d48a')
    z0 = 3.0
    surf(f.body, superq(0, 0, z0 + stem_h / 2, stem_w, stem_w * 0.82, stem_h / 2 + 2, 0.55, 0.6), lambda p, n, *_: stem, nu=40, nv=24)
    rng = random.Random(sum(map(ord, name)))
    zc = z0 + stem_h
    LOCKS = []
    for k in range(int(30 * crown_w / 23)):
        a = rng.uniform(0, math.tau)
        d = math.sqrt(rng.random())
        x, y = math.cos(a) * d * crown_w * 0.85, math.sin(a) * d * crown_w * 0.62
        z = zc + crown_h * 0.25 + (1 - d * d) * crown_h * 0.45 + rng.uniform(-1, 1)
        r = rng.uniform(0.24, 0.32) * crown_w
        ball(f.body, (x, y, z), (r, r, r * 0.82), lambda p, n: rgb('#3a8a3a'), sub=3)
        LOCKS.append((Vector((x, y, z)), r))

    def col(p, n):
        if p.z < zc - 1.0:
            return stem * (0.95 + 0.05 * noise.noise(p * 0.5)) * (0.92 if p.z < z0 + 2 else 1.0)
        # the florets: budded (tiny bumps of light), darker in the grooves between them and deep under the crown
        near = sorted(((p - c).length / r, c, r) for c, r in LOCKS)[:2]
        groove = max(0.0, 1 - (near[1][0] - near[0][0]) / 0.18) if len(near) > 1 else 0.0
        b = 0.5 + 0.5 * noise.noise(p * 1.4)
        c = rgb('#2e7a30').lerp(rgb('#62b04e'), 0.3 * b + 0.4 * max(0.0, n.z))
        return c * (1 - 0.35 * groove) * (0.78 + 0.22 * min(1.0, max(0.0, (p.z - zc + 2) / crown_h)))
    sculpt(f, 'body', voxel=0.26, smooth=3, verts=10000, ao=0.35, recolor=col)
    tree = f.bvh()
    face_patch(f, 0, face_z, face_w, tree=tree)
    f.anchor('eyes', f.hit(0, face_z + 1.0, tree=tree)[0], 0.8)
    arms(f, arm_z, lambda p, n, *_: stem * (0.92 + 0.1 * n.z), reach=4.6 * stem_w / 11, drop=3.0, r0=2.2 * stem_w / 11 + 0.6, r1=2.0 * stem_w / 11 + 0.5, tree=tree, inset=1.0)
    return f, tree, top_z(tree, 0, 0)


def floret():
    """Floret, the council's head: big and serious, a monocle on a chain."""
    f, tree, top = broccoli2('floret', 11.0, 26.0, 23.0, 18.0, 19.5, 26, 17.0)
    # the monocle over his right eye (the viewer's left), its chain down to his side
    p, nn = f.hit(-6.2, 21.5, tree=tree)
    ring(f.body, p + nn * 0.8, nn, 3.4, 0.5, lambda q, n2, *_: rgb('#d8a830') * (0.85 + 0.3 * max(0.0, n2.z)), nu=24, nv=8)
    q, n2 = f.hit(-10.0, 12.0, tree=tree)
    tube(f.body, [p + nn * 0.8 + Vector((-2.4, 0, -2.4)), (p + q) / 2 + nn * 1.4, q + n2 * 0.6], 0.3, '#c89a28', seg=5)
    feet(f, x=7, w=3.2, d=3.8, h=2.3, z=2.0, col='#5a7a3a')
    hat_anchor(f, top + 2, 32)
    return f


def stalk():
    """Stalk, the council's second: middling, lashes and a toothy grin."""
    f, tree, top = broccoli2('stalk', 9.5, 21.0, 18.0, 14.0, 18.5, 24, 15.0)
    feet(f, x=6, w=3.0, d=3.6, h=2.2, z=2.0, col='#5a7a3a')
    hat_anchor(f, top + 2, 30)
    return f


def sprout():
    """Sprout, the council's youngest: small, rosy cheeks."""
    f, tree, top = broccoli2('sprout', 6.0, 12.0, 10.0, 8.5, 10.0, 15, 9.0)
    feet(f, x=3.5, w=2.0, d=2.4, h=1.7, z=1.6, col='#5a7a3a')
    hat_anchor(f, top + 1, 24)
    return f


# ---------------------------------------------------------------- the old keeper
def ghost():
    """The old keeper, a kindly ghost: a soft sheet with a scalloped hem, his navy keeper's cap with its gold badge, a
    great white beard and mustache; little arms. (The game draws him a little see-through.)"""
    f = Folk('ghost')
    pale = rgb('#d4e0fa')

    def prof(v):
        if v > 0.75:
            a = (v - 0.75) / 0.25 * math.pi / 2
            return 16.5 * math.cos(a) ** 0.6, 50 + 10 * math.sin(a)
        return 16.5 + 1.8 * (0.75 - v) / 0.75, 6 + 44 * v / 0.75

    def P(u, v):
        r, z = prof(v)
        th = u * math.tau
        if v < 0.2:
            z += (0.2 - v) / 0.2 * 4.0 * math.cos(th * 6)
        return Vector((math.cos(th) * r, math.sin(th) * r * 0.85, z))

    def col(p, n, *_):
        return pale.lerp(rgb('#aebeea'), max(0.0, min(1.0, (22 - p.z) / 16)) * 0.6) * (1 + 0.05 * max(0.0, n.z))
    surf(f.body, P, col, nu=72, nv=30, caps=(True, True))
    sculpt(f, 'body', voxel=0.3, smooth=4, verts=8000, ao=0.15, recolor=col)
    tree = f.bvh()
    # the beard and mustache, one soft white piece
    bd = MB()
    beard = mottle('#fbfcff', 0.03, 0.8)
    for (x, z, r) in ((0, 34, 9.5), (-7, 37, 6.5), (7, 37, 6.5), (-3.5, 29.5, 6.5), (3.5, 29.5, 6.5), (0, 26, 5.0)):
        p, nn = f.hit(x, z, tree=tree)
        ball(bd, p + nn * 0.4, (r, 3.0, r * 0.8), beard, sub=3)
    for s_ in (-1, 1):
        p, nn = f.hit(s_ * 4.5, 41.0, tree=tree)
        for k in range(5):
            t = k / 4
            ball(bd, p + nn * 1.2 + Vector((s_ * 5.0 * t, 0, -1.2 * t * t)), 2.4 - 0.8 * t, beard, sub=2)
    f.parts['beard'] = [bd, Vector((0, 0, 0))]
    sculpt(f, 'beard', voxel=0.24, smooth=3, verts=3000)
    f.body.add(*[getattr(f.parts['beard'][0], k) for k in ('v', 'c', 'n', 'f')])
    del f.parts['beard']
    # the keeper's cap: navy, a brim to the front, a gold badge
    navy = soft(mottle('#2a3a7a', 0.04, 0.5), under=0.0, top=0.1)
    lathe(f.body, [(15.0, 57.5), (15.6, 62.5), (17.0, 65.5), (16.5, 66.3), (0.0, 66.5)], navy, seg=48, cap_top=True, sy=0.88)
    surf(f.body, superq(0, -12.0, 58.4, 13.0, 6.0, 1.0, 0.8, 1.0), navy, nu=32, nv=10)
    ball(f.body, (0, -14.8, 62.6), (1.7, 0.7, 1.7), shade('#f2c840'), sub=2)
    tree = f.bvh()
    face_patch(f, 0, 46.0, 26, tree=tree)
    f.anchor('eyes', f.hit(0, 47.0, tree=tree)[0], 1.0)
    arms(f, 36.0, lambda p, n, *_: pale * (0.95 + 0.06 * n.z), reach=4.6, drop=2.6, r0=2.8, r1=2.4, hand='#dde6fb', hr=2.8, tree=tree, inset=1.0)
    hat_anchor(f, 66.5, 32)
    return f


FOLKS2 = {'maki': maki, 'kai': kai, 'ginger': ginger, 'basil': basil, 'wonton': wonton, 'chili': chili, 'coco': coco, 'cece': cece,
          'clementine': clementine, 'cuke': cuke, 'sully': sully, 'brulee': brulee, 'mac': mac, 'fortune': fortune, 'floss': floss,
          'waffle': waffle, 'wasabi': wasabi, 'goat': goat, 'floret': floret, 'stalk': stalk, 'sprout': sprout, 'ghost': ghost}
# how big each stands: smaller than people, but each big enough that its face reads from the game's camera (a
# gingerbread person is flat, so a little bigger again)
SIZE = {'maki': 1.1, 'kai': 1.1, 'ginger': 1.2, 'basil': 1.1, 'wonton': 1.1, 'chili': 1.0, 'coco': 1.1, 'cece': 1.05, 'clementine': 1.08,
        'cuke': 1.0, 'sully': 1.05, 'brulee': 1.08, 'mac': 1.05, 'fortune': 1.1, 'floss': 1.1, 'waffle': 1.1, 'wasabi': 1.08,
        'goat': 1.05, 'floret': 1.05, 'stalk': 1.05, 'sprout': 1.05, 'ghost': 1.0}


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
        if BUDGET['cap'] and key != 'face':
            cap = BUDGET['cap'] * (1.0 if key == 'body' else 0.1)
            if len(ob.data.vertices) > cap:
                m = ob.modifiers.new('lighter', 'DECIMATE')
                m.ratio = cap / len(ob.data.vertices)
                apply_modifiers(ob)
                shade_smooth(ob)
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
    lod = '_lod1' if '--lod1' in args else ''
    if lod:
        BUDGET['verts'], BUDGET['cap'] = LOD1, LOD1_CAP
    reset()
    shown = []
    for name, fn in FOLKS2.items():
        if only and name not in only:
            continue
        objs = objects2(fn(), scale=K * SIZE.get(name, 1.0))
        export(objs, f'folk2_{name}{lod}')
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
