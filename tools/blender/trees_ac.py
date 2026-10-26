"""Trees, palms, fruit and bushes in the style of Animal Crossing (the reference David picked): a thick tan trunk with
root flares, a crown of two or three round lobes covered in overlapping hanging leaves (each a three-pointed leaf with a
raised vein, darker at its stem, lighter at its tip), rows lapping like shingles; a palm with a curving ringed trunk and
two tiers of broad arching fronds over a cluster of coconuts; glossy fruit; round shrubs of small leaves, some in flower.

Every leaf is real geometry with its colors in the mesh (no baking), shaded smoothly as the whole lobe (each vertex's
normal leans toward the lobe's surface), which is what gives the reference its soft, round light. Fruit is its own
model, hung by the game at the tree's anchors (empties named anchor_fruit_N in the file) so picked fruit can go.

    python tools/blender/trees_ac.py [--preview DIR] [--only NAME]
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from mathutils import Vector, Matrix, noise
from common import *

LIGHT = Vector((-0.35, -0.55, 0.76)).normalized()       # the painted light: from the front, the left and above


def rgb(c):
    return Vector(hex_rgb(c)[:3]) if isinstance(c, str) else Vector(c[:3])


class MB:
    """A mesh gathered as lists: positions, faces, a color and a normal for every vertex."""
    def __init__(self):
        self.v, self.f, self.c, self.n = [], [], [], []

    def add(self, pts, cols, nrms, faces):
        b = len(self.v)
        P = [Vector(p) for p in pts]
        N = [Vector(n).normalized() for n in nrms]
        self.v += P
        self.c += [Vector(c) for c in cols]
        self.n += N
        # every triangle wound to face the way its vertices' normals do (the game draws only fronts)
        for f in faces:
            g = (P[f[1]] - P[f[0]]).cross(P[f[2]] - P[f[0]])
            want = N[f[0]] + N[f[1]] + N[f[2]]
            self.f.append(tuple(b + k for k in (f if g.dot(want) >= 0 else (f[0], f[2], f[1]))))

    def obj(self, name, mat):
        me = bpy.data.meshes.new(name)
        me.from_pydata([tuple(p) for p in self.v], [], self.f)
        me.update()
        ca = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
        for i, c in enumerate(self.c):
            ca.data[i].color = (max(0.0, c.x), max(0.0, c.y), max(0.0, c.z), 1.0)
        for p in me.polygons:
            p.use_smooth = True
        me.normals_split_custom_set_from_vertices([tuple(n) for n in self.n])
        o = bpy.data.objects.new(name, me)
        link(o)
        me.materials.append(mat)
        return o


def vmat(name, rough=0.85):
    return material(name, vcol='Col', rough=rough)


# ---------------------------------------------------------------- leaves
# a three-pointed leaf, from its stem (x 0) to its tip (x 1): the vein down the middle, a side point each side
LEAF_R = [(0.12, 0.24), (0.34, 0.47), (0.5, 0.25), (0.76, 0.25)]
LEAF_V = [(0.0, 0.0), (0.42, 0.0), (0.72, 0.0), (1.0, 0.0)]
# (indices: 0-3 the vein from stem to tip, 4-7 the right edge, 8-11 the left)
LEAF_F = [(0, 4, 1), (4, 5, 1), (1, 5, 6), (1, 6, 2), (6, 7, 2), (2, 7, 3)]
LEAF_F = LEAF_F + [(a if a < 4 else a + 4, c if c < 4 else c + 4, b if b < 4 else b + 4) for a, b, c in LEAF_F]
# a small rounded leaf (the bushes'): an oval, pointed at the tip
OVAL_R = [(0.14, 0.2), (0.38, 0.3), (0.64, 0.26), (0.86, 0.13)]


def leaf(mb, P, u, s, nrm, L, W, col, centre, shape=LEAF_R, droop=0.1):
    """One leaf at P: u along it (stem to tip), s across, nrm its face; col its color; centre the lobe's middle (for the
    soft normals)."""
    pts, cols, nrms = [], [], []
    edge = [(x, y) for x, y in shape] + [(x, -y) for x, y in shape]
    for i, (x, y) in enumerate(LEAF_V + edge):
        # the halves fall away from the raised vein; the tip lifts a little off the crown
        p = P + u * (x * L) + s * (y * L * W) + nrm * (-abs(y) * L * 0.2 + x * x * L * droop)
        pts.append(p)
        out = (p - centre).normalized()
        nrms.append(out * 0.84 + nrm * 0.16 + s * (y * 0.5))       # (shaded mostly as the lobe: a soft round crown)
        k = (0.62 + 0.46 * x ** 0.8) * (1.08 if i < 4 and 0 < i < 3 else 1.0) * (0.96 if i >= 4 else 1.0)
        cols.append(col * k)
    mb.add(pts, cols, nrms, LEAF_F)


def lobe(mb, rng, c, r, L, tone, others=(), squash=0.92, W=1.1, shape=LEAF_R, rows_from=0.05, rows_to=2.25, lap=0.46, tilt=(0.08, 0.2)):
    """Leaves over one round lobe (centre c, radius r, squashed in height), hanging in lapped rows, a rosette on top.
    tone(outward, height, rng) gives each leaf's color."""
    def inside_other(p):
        return any((p - oc).length < orr * 0.9 for oc, orr in others)
    # rosette on top: leaves lying outward from the crown's top
    top = c + Vector((0, 0, r * squash))
    n_top = 0
    for j in range(n_top):
        a = j / n_top * math.tau + rng.uniform(-0.2, 0.2)
        d = Vector((math.cos(a), math.sin(a), 0))
        u = (d * 0.85 + Vector((0, 0, -0.5))).normalized()
        s = Vector((0, 0, 1)).cross(d).normalized()
        nrm = s.cross(u).normalized()
        if nrm.z < 0:
            s, nrm = -s, -nrm
        leaf(mb, top - u * L * 0.3 + Vector((0, 0, 0.02)), u, s, nrm, L * 0.95, W, tone(Vector((0, 0, 1)), 1.0, rng, top), c, shape)
    th = rows_from
    row = 0
    while th < rows_to:
        rho = r * math.sin(th)
        n = max(3, int(math.tau * rho / (L * W * 0.62)))
        for j in range(n):
            ph = (j + 0.5 * (row % 2)) / n * math.tau + rng.uniform(-0.12, 0.12)
            p = c + Vector((r * math.sin(th) * math.cos(ph), r * math.sin(th) * math.sin(ph), r * squash * math.cos(th)))
            if inside_other(p):
                continue
            out = Vector((math.sin(th) * math.cos(ph), math.sin(th) * math.sin(ph), math.cos(th) / squash)).normalized()
            down = Vector((math.cos(th) * math.cos(ph), math.cos(th) * math.sin(ph), -squash * math.sin(th))).normalized()
            a = rng.uniform(*tilt)
            u = (down * math.cos(a) + out * math.sin(a)).normalized()
            s = out.cross(u).normalized()
            nrm = s.cross(u).normalized()
            if nrm.dot(out) < 0:
                s, nrm = -s, -nrm
            h = 0.5 + 0.5 * math.cos(th)
            # (in the creases between lobes, and on the undersides, the leaves are in shade)
            crease = min([max(0.0, min(1.0, ((p - oc).length - orr) / (r * 0.5))) for oc, orr in others] or [1.0])
            col = tone(out, h, rng, p) * (0.62 + 0.38 * crease)
            leaf(mb, p - down * L * 0.22, u, s, nrm, L * rng.uniform(0.94, 1.08), W, col, c, shape)
        th += L * lap / r
        row += 1


def fill(mb, c, r, col, squash=0.92, sub=2):
    """A dark ball inside a lobe, so no sky shows between the leaves."""
    bm = bmesh_ico(sub)
    for tri in bm['f']:
        pts = [c + Vector((p.x * r, p.y * r, p.z * r * squash)) for p in (bm['v'][i] for i in tri)]
        mb.add(pts, [col] * 3, [(p - c) for p in pts], [(0, 1, 2)])


_ico = {}


def bmesh_ico(sub):
    if sub in _ico:
        return _ico[sub]
    import bmesh
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=1)
    out = {'v': [v.co.copy() for v in bm.verts], 'f': [tuple(v.index for v in f.verts) for f in bm.faces]}
    bm.free()
    _ico[sub] = out
    return out


# ---------------------------------------------------------------- trunks
def trunk(mb, rng, height, r0, r1, roots=5, lean=0.06, cols=('#b0702e', '#d8964c', '#f0be78'), seg=28, rings=26):
    """A thick trunk tapering up, flaring into rounded roots at its foot, tan with soft lighter streaks running up it,
    darker under the crown."""
    ph0 = rng.random() * math.tau
    dark, mid, lite = (rgb(c) for c in cols)
    seed = Vector((rng.random() * 9, rng.random() * 9, 0))
    grid = []
    for k in range(rings + 1):
        z = height * (k / rings) ** 1.15
        t = z / height
        ring = []
        for j in range(seg):
            ph = j / seg * math.tau
            bump = max(0.0, math.cos(roots * (ph - ph0))) ** 1.4
            flare = math.exp(-z / 0.22) * (0.2 + 0.95 * bump) + math.exp(-z / 0.7) * 0.1
            r = (r0 + (r1 - r0) * t) * (1 + flare)
            x = math.cos(ph) * r + lean * math.sin(t * 2.4)
            y = math.sin(ph) * r
            p = Vector((x, y, z - 0.03 * bump * math.exp(-z / 0.1)))
            st = noise.noise(Vector((math.cos(ph) * 2.2, math.sin(ph) * 2.2, z * 0.55)) + seed) * 0.5 + 0.5
            fine = noise.noise(Vector((math.cos(ph) * 7, math.sin(ph) * 7, z * 1.5)) + seed) * 0.5 + 0.5
            col = dark.lerp(mid, min(1.0, 0.35 + st * 0.9)).lerp(lite, max(0.0, st - 0.55) * 1.6 * fine)
            col = col * (1.0 - 0.32 * max(0.0, t - 0.55) / 0.45) * (0.88 + 0.12 * min(1.0, z / 0.12))
            n = Vector((math.cos(ph), math.sin(ph), 0.25 * math.exp(-z / 0.25) + 0.05))
            ring.append((p, col, n))
        grid.append(ring)
    pts, cs, ns, faces = [], [], [], []
    for ring in grid:
        for p, col, n in ring:
            pts.append(p); cs.append(col); ns.append(n)
    for k in range(rings):
        for j in range(seg):
            a, b = k * seg + j, k * seg + (j + 1) % seg
            faces.append((a, b, b + seg))
            faces.append((a, b + seg, a + seg))
    mb.add(pts, cs, ns, faces)


# ---------------------------------------------------------------- broadleaf trees
TREES = {
    # the reference's tree: two lobes side by side low down and a smaller one on top behind
    # (the two low lobes level and alike, so the tree is symmetrical facing the camera, as the game keeps it)
    'tree_round_a': dict(seed=3, lobes=[(-0.72, 0.0, 2.15, 0.9), (0.72, 0.0, 2.15, 0.9), (0.0, 0.32, 2.88, 0.74), (0.0, 0.55, 2.2, 0.8)], height=2.45, r0=0.36, r1=0.29),
    # taller, with a fourth lobe behind
    'tree_round_b': dict(seed=8, lobes=[(-0.68, 0.02, 2.28, 0.83), (0.68, 0.02, 2.28, 0.83), (0.0, 0.16, 3.0, 0.76), (0.0, 0.58, 2.45, 0.8)], height=2.6, r0=0.34, r1=0.28),
}
GREEN = dict(dark='#2a6a2e', light='#8cd05c', fill='#24552a')
SPRING = dict(leaves=[('#ffc8dc', 0.36), ('#ffb0cc', 0.26), ('#fff0f4', 0.22), ('#f48ab0', 0.1), ('#8ccc6a', 0.06)], fill='#b06a84')
WINTER = dict(dark='#1e4a2c', light='#4e8a52', snow='#f4f8fc', fill='#1a3a24')
FALL = dict(leaves=[('#f6c840', 0.34), ('#f09432', 0.3), ('#de602c', 0.14), ('#bcb846', 0.14), ('#74a848', 0.08)], fill='#7a4218')


def patch(cols, w, p, rng, scale=1.6, jump=0.12):
    """A color from the list (by weight) chosen by a smooth noise over the crown, so colors come in patches as they do
    on a real tree, and now and then a leaf of another color."""
    if p is None or rng.random() < jump:
        return rng.choices(cols, weights=w)[0]
    t = max(0.0, min(0.999, 0.5 + 0.62 * noise.noise(p * scale + Vector((3.1, 7.7, 1.3)))))
    acc, tot = 0.0, sum(w)
    for c, k in zip(cols, w):
        acc += k / tot
        if t < acc:
            return c
    return cols[-1]


def tone_fn(season):
    if season == 'spring':
        cols, w = zip(*SPRING['leaves'])
        cols = [rgb(c) for c in cols]
        def tone(out, h, rng, p=None):
            t = 0.62 + 0.38 * max(0.0, out.dot(LIGHT)) + 0.15 * h + rng.uniform(-0.04, 0.04)
            return patch(cols, w, p, rng) * min(1.08, t)
        return tone
    if season == 'winter':
        dark, light, snow = rgb(WINTER['dark']), rgb(WINTER['light']), rgb(WINTER['snow'])
        def tone(out, h, rng, p=None):
            # snow lying on the leaves that face the sky; dark green below
            if out.z > 0.42 + rng.uniform(-0.12, 0.12):
                return snow * (0.9 + 0.1 * max(0.0, out.dot(LIGHT)))
            t = 0.2 + 0.5 * max(0.0, out.dot(LIGHT)) + 0.2 * h + rng.uniform(-0.05, 0.05)
            return dark.lerp(light, max(0.0, min(1.0, t)))
        return tone
    if season == 'summer':
        dark, light = rgb(GREEN['dark']), rgb(GREEN['light'])
        def tone(out, h, rng, p=None):
            t = 0.25 + 0.45 * max(0.0, out.dot(LIGHT)) + 0.32 * h + rng.uniform(-0.05, 0.05)
            return dark.lerp(light, max(0.0, min(1.0, t)))
        return tone
    cols, w = zip(*FALL['leaves'])
    cols = [rgb(c) for c in cols]
    def tone(out, h, rng, p=None):
        base = patch(cols, w, p, rng)
        t = 0.5 + 0.45 * max(0.0, out.dot(LIGHT)) + 0.22 * h + rng.uniform(-0.05, 0.05)
        return base * min(1.12, t)
    return tone


def broadleaf(name, spec, season='summer', lod=0):
    rng = random.Random(spec['seed'] + {'summer': 0, 'fall': 100, 'spring': 200, 'winter': 300}[season])
    mb = MB()
    trunk(mb, random.Random(spec['seed']), spec['height'], spec['r0'], spec['r1'], seg=28 if lod == 0 else 16, rings=26 if lod == 0 else 14)
    lobes = [(Vector(l[:3]), l[3]) for l in spec['lobes']]
    L = 0.34 if lod == 0 else 0.48        # (leaves a third of a lobe's radius: a leafy crown, not big shards)
    tone = tone_fn(season)
    fillc = rgb({'summer': GREEN['fill'], 'spring': SPRING['fill'], 'winter': WINTER['fill']}.get(season, FALL['fill']))
    for i, (c, r) in enumerate(lobes):
        fill(mb, c, r * 0.93, fillc, sub=2 if lod == 0 else 1)
        others = [(oc, orr) for k, (oc, orr) in enumerate(lobes) if k != i]
        lobe(mb, rng, c, r, L, tone, others)
    o = mb.obj(name, vmat(name + '_leaves'))
    anchors = fruit_anchors(lobes)
    return o, anchors


def fruit_anchors(lobes):
    """Three spots for fruit on the crown's front, as the reference hangs them: low on each front lobe and one higher."""
    lowest = sorted(lobes, key=lambda l: l[0].z)[:2]
    top = max(lobes, key=lambda l: l[0].z)
    out = []
    for (c, r), d in zip(lowest + [top], (Vector((-0.25, -0.92, -0.25)), Vector((0.3, -0.9, -0.15)), Vector((0.12, -0.88, 0.1)))):
        out.append(c + d.normalized() * (r + 0.13))      # (out past the leaves, so they never cover the fruit)
    return out


def anchor_empties(anchors, prefix='anchor_fruit_'):
    out = []
    for i, p in enumerate(anchors):
        e = bpy.data.objects.new(f'{prefix}{i}', None)
        e.location = p
        link(e)
        out.append(e)
    return out


# ---------------------------------------------------------------- fruit
def fruit(name, rng):
    mb = MB()

    def ball(c, rx, ry, rz, col_fn, sub=3):
        ico = bmesh_ico(sub)
        pts = []
        for tri in ico['f']:
            ps = [ico['v'][i] for i in tri]
            P = [c + Vector((p.x * rx, p.y * ry, p.z * rz)) for p in ps]
            mb.add(P, [col_fn(p) for p in ps], [Vector((p.x / rx, p.y / ry, p.z / rz)) for p in ps], [(0, 1, 2)])

    def stem(a, b, r, col):
        d = (b - a)
        side = d.cross(Vector((1, 0, 0)))
        if side.length < 1e-4:
            side = d.cross(Vector((0, 1, 0)))
        side.normalize()
        up = d.normalized().cross(side)
        pts, cols, ns, faces = [], [], [], []
        for k in range(6):
            ang = k / 6 * math.tau
            o = side * math.cos(ang) + up * math.sin(ang)
            pts += [a + o * r, b + o * r * 0.8]
            cols += [rgb(col), rgb(col) * 1.1]
            ns += [o, o]
        for k in range(6):
            i, j = k * 2, ((k + 1) % 6) * 2
            faces += [(i, j, j + 1), (i, j + 1, i + 1)]
        mb.add(pts, cols, ns, faces)

    def leaf_on(P, d, col, L=0.11):
        d = d.normalized()
        s = d.cross(Vector((0, 0, 1))).normalized()
        nrm = s.cross(d).normalized()
        if nrm.z < 0:
            s, nrm = -s, -nrm
        leaf(mb, P, d, s, nrm, L, 0.9, rgb(col), P - nrm * 0.2, shape=OVAL_R, droop=0.2)

    if name == 'fruit_apple':
        base, hi = rgb('#d8282a'), rgb('#f05a3a')
        def col(p):
            k = 0.5 + 0.5 * max(0.0, p.dot(LIGHT))
            streak = 0.5 + 0.5 * noise.noise(Vector((math.atan2(p.y, p.x) * 3, p.z * 2, 0)))
            c = base.lerp(hi, k * 0.6) * (0.85 + 0.2 * streak)
            return c.lerp(rgb('#f2c24a'), max(0.0, -p.z - 0.6) * 0.8)
        def dent(c0, rx, rz):
            pass
        ball(Vector((0, 0, 0.11)), 0.11, 0.11, 0.1, col)
        stem(Vector((0, 0, 0.2)), Vector((0.012, 0, 0.27)), 0.008, '#6a4424')
        leaf_on(Vector((0.012, 0, 0.25)), Vector((1, -0.4, 0.3)), '#4a9a3a')
    elif name == 'fruit_cherry':
        for x in (-0.055, 0.055):
            ball(Vector((x, 0, 0.06)), 0.06, 0.06, 0.057, lambda p: rgb('#c8202a').lerp(rgb('#f04a44'), 0.6 * max(0.0, p.dot(LIGHT))))
            stem(Vector((x, 0, 0.11)), Vector((0, 0.0, 0.26)), 0.006, '#4a7a2a')
        leaf_on(Vector((0, 0, 0.25)), Vector((0.8, -0.3, 0.4)), '#5aa040')
    elif name == 'fruit_orange':
        def col(p):
            dimple = noise.noise(p * 14) * 0.06
            return rgb('#f08a1a').lerp(rgb('#ffb444'), 0.6 * max(0.0, p.dot(LIGHT))) * (0.95 + dimple)
        ball(Vector((0, 0, 0.11)), 0.11, 0.11, 0.105, col)
        stem(Vector((0, 0, 0.21)), Vector((0, 0, 0.24)), 0.01, '#4a6a2a')
        leaf_on(Vector((0, 0, 0.23)), Vector((0.9, -0.3, 0.3)), '#3f8a34', L=0.13)
    elif name == 'fruit_pear':
        def col(p):
            spot = 1.0 if noise.noise(p * 9) > 0.45 else 0.0
            c = rgb('#a8c83c').lerp(rgb('#d8e06a'), 0.6 * max(0.0, p.dot(LIGHT)))
            return c.lerp(rgb('#c8a040'), spot * 0.5)
        ico = bmesh_ico(3)
        for tri in ico['f']:
            ps = [ico['v'][i] for i in tri]
            P, N = [], []
            for p in ps:
                w = 1.0 - 0.38 * max(0.0, p.z) ** 1.2         # narrower toward the top
                P.append(Vector((p.x * 0.1 * w, p.y * 0.1 * w, 0.1 + p.z * 0.13)))
                N.append(Vector((p.x, p.y, p.z * 0.7)))
            mb.add(P, [col(p) for p in ps], N, [(0, 1, 2)])
        stem(Vector((0, 0, 0.22)), Vector((0.02, 0, 0.29)), 0.008, '#6a4424')
    elif name == 'fruit_peach':
        def col(p):
            k = max(0.0, p.dot(LIGHT))
            return rgb('#f4a07a').lerp(rgb('#ffd2a4'), 0.7 * k).lerp(rgb('#f07a6a'), max(0.0, p.x) * 0.35)
        ico = bmesh_ico(3)
        for tri in ico['f']:
            ps = [ico['v'][i] for i in tri]
            P = [Vector((p.x * 0.11, p.y * 0.105, 0.105 + p.z * 0.1)) - Vector((0, 0.012 * math.exp(-(p.x * 6) ** 2) * max(0.0, -p.y), 0)) for p in ps]
            mb.add(P, [col(p) for p in ps], [p for p in ps], [(0, 1, 2)])
        leaf_on(Vector((0, 0, 0.2)), Vector((0.8, -0.2, 0.5)), '#4a9a3a')
    elif name == 'fruit_mango':
        def col(p):
            g = max(0.0, min(1.0, 0.5 + p.x * 0.6 + p.z * 0.3))
            c = rgb('#7ab83a').lerp(rgb('#f4b030'), g).lerp(rgb('#e8503a'), max(0.0, g - 0.7) * 1.6)
            return c * (0.85 + 0.25 * max(0.0, p.dot(LIGHT)))
        ico = bmesh_ico(3)
        for tri in ico['f']:
            ps = [ico['v'][i] for i in tri]
            # a kidney: long, flattened, its belly bent
            P = [Vector((p.x * 0.13, p.y * 0.085, 0.1 + p.z * 0.1 + 0.03 * (1 - p.x * p.x))) for p in ps]
            mb.add(P, [col(p) for p in ps], [Vector((p.x * 0.7, p.y * 1.2, p.z)) for p in ps], [(0, 1, 2)])
        stem(Vector((-0.06, 0, 0.2)), Vector((-0.07, 0, 0.26)), 0.008, '#6a4424')
    elif name == 'fruit_lychee':
        def col(p):
            bump = 0.5 + 0.5 * noise.noise(p * 16)
            return rgb('#c8303a').lerp(rgb('#f0607a'), 0.5 * max(0.0, p.dot(LIGHT))) * (0.82 + 0.3 * bump)
        for (x, y, z) in ((-0.05, 0.0, 0.06), (0.05, 0.01, 0.065), (0.0, -0.03, 0.14)):
            ball(Vector((x, y, z)), 0.06, 0.06, 0.065, col, sub=2)
        stem(Vector((0, -0.02, 0.19)), Vector((0.01, 0, 0.27)), 0.006, '#6a5424')
        leaf_on(Vector((0.01, 0, 0.26)), Vector((0.9, -0.3, 0.3)), '#4a9a3a')
    elif name == 'fruit_coconut':
        def col(p):
            return rgb('#6a8a2c').lerp(rgb('#9ab44a'), 0.6 * max(0.0, p.dot(LIGHT))) * (0.9 + 0.1 * noise.noise(p * 6))
        ball(Vector((0, 0, 0)), 0.13, 0.13, 0.15, col)
    return mb.obj(name, vmat(name + '_gloss', rough=0.45))


FRUITS = ['fruit_apple', 'fruit_cherry', 'fruit_orange', 'fruit_pear', 'fruit_peach', 'fruit_mango', 'fruit_lychee', 'fruit_coconut']


# ---------------------------------------------------------------- palms
PALMS = {
    'palm_ac': dict(seed=5, height=3.7, bend=0.9, fronds=10),
    'palm_ac_b': dict(seed=12, height=3.3, bend=-0.7, fronds=9),
}


def palm(name, spec, lod=0):
    """A trunk that curves as it rises and narrows toward the top, banded in rings like overlapping scales (each ring a
    touch wider at its top, light on its face, a dark line under its lip), flared at the foot; a crown of fronds in two
    tiers, the young ones arching up, the older ones drooping lower and a little yellower, each a rib with broad
    leaflets swept out and down both sides so the frond reads as a wide serrated blade from above."""
    rng = random.Random(spec['seed'])
    mb = MB()
    H, bend = spec['height'], spec['bend']
    rings = 13
    seg = 18 if lod == 0 else 10
    steps_up = rings * (4 if lod == 0 else 2)
    axis = lambda t: Vector((bend * 0.85 * t ** 1.8, -0.16 * t * t, H * t))
    lite, mid, dark = rgb('#e8c48c'), rgb('#c8995e'), rgb('#7c5430')
    pts, cols, ns, faces = [], [], [], []
    for k in range(steps_up + 1):
        t = k / steps_up
        c = axis(t)
        f = (t * rings) % 1.0                        # where on its ring: 0 at the foot, 1 at the lip
        r = (0.25 - 0.09 * t) * (0.93 + 0.1 * f ** 1.6) * (1 + 0.38 * math.exp(-t * 14))
        band = dark if f > 0.9 or f < 0.05 else lite.lerp(mid, 0.35 + 0.3 * (1 - f))
        tan = (axis(min(1, t + 0.01)) - axis(max(0, t - 0.01))).normalized()
        sx = Vector((0, 0, 1)).cross(tan).normalized() if abs(tan.z) < 0.999 else Vector((1, 0, 0))
        if sx.length < 0.5:
            sx = Vector((1, 0, 0))
        sy = tan.cross(sx).normalized()
        for j in range(seg):
            ph = j / seg * math.tau
            d = sx * math.cos(ph) + sy * math.sin(ph)
            pts.append(c + d * r)
            shade = 0.8 + 0.26 * max(0.0, d.dot(LIGHT))
            cols.append(band * shade * rng.uniform(0.97, 1.03))
            ns.append(d + tan * (0.35 if f > 0.6 else -0.05))
    for k in range(steps_up):
        for j in range(seg):
            a0, b0 = k * seg + j, k * seg + (j + 1) % seg
            faces += [(a0, b0, b0 + seg), (a0, b0 + seg, a0 + seg)]
    mb.add(pts, cols, ns, faces)
    top = axis(1.0)
    fill(mb, top + Vector((0, 0, -0.04)), 0.22, rgb('#5c6a2c'), squash=0.85, sub=2)
    # fronds, two tiers
    n = spec['fronds']
    tiers = [dict(hi=rgb('#9ee46a'), mid=rgb('#56b84a'), lo=rgb('#2c7a34'), rise=(0.55, 0.75), droop=0.75, length=(1.6, 1.9)),
             dict(hi=rgb('#b8dc62'), mid=rgb('#6ab042'), lo=rgb('#3a7a30'), rise=(0.2, 0.36), droop=1.15, length=(1.7, 2.05))]
    for i in range(n):
        T = tiers[i % 2]
        az = i / n * math.tau + rng.uniform(-0.16, 0.16) + (0.5 / n * math.tau if i % 2 else 0)
        d = Vector((math.cos(az), math.sin(az), 0))
        side = Vector((0, 0, 1)).cross(d).normalized()
        length = rng.uniform(*T['length'])
        rise = rng.uniform(*T['rise'])
        steps = 12 if lod == 0 else 6
        spine = []
        for k in range(steps + 1):
            t = k / steps
            spine.append(top + d * (length * t) + Vector((0, 0, rise * math.sin(t * math.pi * 0.7) - T['droop'] * t ** 2.2)))
        # the rib, a thin strip, a paler green than the leaflets
        for k in range(steps):
            a0, b0 = spine[k], spine[k + 1]
            w = 0.028 * (1 - k / steps) + 0.008
            mb.add([a0 - side * w, a0 + side * w, b0 + side * w * 0.8, b0 - side * w * 0.8], [rgb('#9cb452')] * 4, [Vector((0, 0, 1))] * 4, [(0, 1, 2), (0, 2, 3)])
        # leaflets: broad blades swept toward the tip, out and a little down, longest just past the middle
        m = 28 if lod == 0 else 13
        twist = rng.uniform(-0.12, 0.12)
        for k in range(1, m):
            t = k / m
            idx = t * steps
            i0 = min(steps - 1, int(idx))
            p = spine[i0].lerp(spine[i0 + 1], idx - i0)
            fwd = (spine[i0 + 1] - spine[i0]).normalized()
            ll = 0.66 * math.sin(math.pi * (0.1 + 0.9 * t)) ** 0.6 + 0.1
            for sg in (-1, 1):
                out = (side * sg * 0.9 + Vector((0, 0, -0.32 - 0.25 * t + twist * sg)) + fwd * 0.4).normalized()
                nrm = out.cross(fwd).normalized()
                if nrm.z < 0:
                    nrm = -nrm
                w = 0.2 * (1 - 0.35 * t)
                mid_p = p + out * ll * 0.45 + Vector((0, 0, 0.035))
                tip = p + out * ll + fwd * 0.08 - Vector((0, 0, 0.05 + 0.06 * t))
                q = [p - fwd * w * 0.35, p + fwd * w * 0.35, mid_p + fwd * w * 0.5, mid_p - fwd * w * 0.5, tip]
                lit = 0.86 + 0.24 * max(0.0, nrm.dot(LIGHT))
                tone = rng.uniform(0.93, 1.07)
                cs = [T['lo'], T['lo'].lerp(T['mid'], 0.4), T['mid'].lerp(T['hi'], 0.35), T['mid'], T['hi']]
                up = Vector((0, 0, 1))
                mb.add(q, [c * lit * tone for c in cs], [nrm * 0.45 + up * 0.75 + out * 0.2] * 5, [(0, 1, 2), (0, 2, 3), (3, 2, 4)])
    o = mb.obj(name, vmat(name + '_leaves'))
    # (the coconuts sit in a cluster at the crown's heart, toward the front, where the game's camera sees them between the
    # fronds' bases)
    anchors = [top + Vector((math.cos(a) * 0.2, math.sin(a) * 0.2 - 0.05, -0.1 - 0.04 * k)) for k, a in enumerate((-2.25, -1.57, -0.9))]
    return o, anchors


# ---------------------------------------------------------------- bushes
BUSHES = {
    'bush_round': dict(seed=21, leaves=('#2a6a2c', '#7cc054'), flowers=None),
    'bush_azalea': dict(seed=23, leaves=('#2a6a2c', '#74b850'), flowers=('#f48ab8', '#ffd0e4', 26)),
    'bush_hibiscus': dict(seed=25, leaves=('#24602a', '#6aae48'), flowers=('#e8343a', '#ffb0a0', 14)),
    'bush_holly': dict(seed=27, leaves=('#1c4e24', '#4e9a3c'), berries=('#d42a2a', 30)),
    'bush_fall': dict(seed=29, leaves=('#a83a18', '#f4a03a'), flowers=None, mix=[('#e8642a', 0.3), ('#f2a43a', 0.3), ('#c83a26', 0.2), ('#d8c048', 0.1), ('#5a9a3a', 0.1)]),
}


def bush(name, spec, lod=0):
    rng = random.Random(spec['seed'])
    mb = MB()
    dark, light = (rgb(c) for c in spec['leaves'])
    lobes = [(Vector((0, 0, 0.42)), 0.5)] + [(Vector((math.cos(a) * 0.32, math.sin(a) * 0.28, 0.34)), 0.36) for a in (0.4, 2.3, 4.2)]
    L = 0.2 if lod == 0 else 0.28

    mix = spec.get('mix')

    def tone(out, h, rng, p=None):
        t = 0.25 + 0.45 * max(0.0, out.dot(LIGHT)) + 0.3 * h + rng.uniform(-0.1, 0.1)
        if mix:
            cols, w = zip(*mix)
            return rgb(rng.choices(cols, weights=w)[0]) * (0.5 + 0.6 * max(0.0, min(1.0, t)))
        return dark.lerp(light, max(0.0, min(1.0, t)))

    for i, (c, r) in enumerate(lobes):
        fill(mb, c, r * 0.9, dark * 0.6, squash=0.85, sub=2 if lod == 0 else 1)
        others = [(oc, orr) for k, (oc, orr) in enumerate(lobes) if k != i]
        lobe(mb, rng, c, r, L, tone, others, squash=0.85, W=1.0, shape=OVAL_R, rows_from=0.05, rows_to=1.9, lap=0.42, tilt=(0.04, 0.14))
    main_c, main_r = lobes[0]

    def on_surface():
        while True:
            c, r = rng.choice(lobes)
            th, ph = rng.uniform(0.2, 1.5), rng.uniform(math.pi * 1.0, math.pi * 2.0)    # (the front half)
            d = Vector((math.sin(th) * math.cos(ph), math.sin(th) * math.sin(ph), math.cos(th) * 0.85))
            p = c + d * (r + 0.03)
            if not any((p - oc).length < orr * 0.95 for oc, orr in lobes if (oc - c).length > 1e-6):
                return p, d.normalized()

    if spec.get('flowers'):
        petal, centre, cnt = spec['flowers']
        for _ in range(cnt if lod == 0 else cnt // 2):
            p, d = on_surface()
            s = d.cross(Vector((0, 0, 1)))
            if s.length < 1e-3:
                s = Vector((1, 0, 0))
            s.normalize()
            t = d.cross(s).normalized()
            size = rng.uniform(0.07, 0.1) * (1.4 if 'hibiscus' in name else 1.0)
            for k in range(5):
                a = k / 5 * math.tau
                u = (s * math.cos(a) + t * math.sin(a))
                leaf(mb, p, u, u.cross(d).normalized(), d, size, 1.2, rgb(petal) * rng.uniform(0.92, 1.08), p - d * 0.3, shape=OVAL_R, droop=0.25)
            mb.add([p + d * 0.012 + s * 0.012, p + d * 0.012 + t * 0.012, p + d * 0.012 - s * 0.012 - t * 0.006], [rgb(centre)] * 3, [d] * 3, [(0, 1, 2)])
    if spec.get('berries'):
        col, cnt = spec['berries']
        ico = bmesh_ico(1)
        for _ in range(cnt if lod == 0 else cnt // 2):
            p, d = on_surface()
            for tri in ico['f']:
                ps = [ico['v'][i] for i in tri]
                mb.add([p + q * 0.035 for q in ps], [rgb(col).lerp(rgb('#ff6a5a'), 0.5 * max(0.0, q.dot(LIGHT))) for q in ps], ps, [(0, 1, 2)])
    return mb.obj(name, vmat(name + '_leaves'))


# ---------------------------------------------------------------- main
def lineup(path, objs, target_z=1.4, dist=None, size=(1400, 640)):
    ground_plane(color='#8cc46a')
    light_rig()
    x = 0
    for o in objs:
        w = max(1.0, o.dimensions.x)
        o.location.x += x + w / 2
        for ch in o.children:
            pass
        x += w + 0.4
    camera((x / 2, 0, target_z), dist=dist or max(7, x * 1.05))
    render(path, size=size, samples=64)


if __name__ == '__main__':
    args = sys.argv[1:]
    prev = args[args.index('--preview') + 1] if '--preview' in args else None
    only = args[args.index('--only') + 1] if '--only' in args else None
    want = lambda n: not only or n.startswith(only)
    shown = []
    reset()
    for name, spec in TREES.items():
        for season in ('summer', 'fall', 'spring', 'winter'):
            nm = name + ('' if season == 'summer' else '_' + season)
            if not want(nm):
                continue
            for lod in (0, 1):
                o, anchors = broadleaf(nm, spec, season, lod)
                es = anchor_empties(anchors)
                export([o] + es, nm + ('' if lod == 0 else '_lod1'))
                if lod == 0:
                    shown.append(o)
                else:
                    o.hide_render = True
                for e in es:
                    bpy.data.objects.remove(e)
            print('built', nm)
    for name in FRUITS:
        if not want(name):
            continue
        o = fruit(name, random.Random(1))
        export([o], name)
        shown.append(o)
        print('built', name)
    for name, spec in PALMS.items():
        if not want(name):
            continue
        for lod in (0, 1):
            o, anchors = palm(name, spec, lod)
            es = anchor_empties(anchors)
            export([o] + es, name + ('' if lod == 0 else '_lod1'))
            if lod == 0:
                shown.append(o)
            else:
                o.hide_render = True
            for e in es:
                bpy.data.objects.remove(e)
        print('built', name)
    for name, spec in BUSHES.items():
        if not want(name):
            continue
        for lod in (0, 1):
            o = bush(name, spec, lod)
            export([o], name + ('' if lod == 0 else '_lod1'))
            if lod == 0:
                shown.append(o)
            else:
                o.hide_render = True
        print('built', name)
    if prev and shown:
        lineup(os.path.join(prev, (only or 'trees_ac') + '.png'), shown)
