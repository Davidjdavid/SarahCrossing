"""Mock-up: the island's people as little dolls (the direction David asked about: like an Animal Crossing villager, but
simpler, doll-like, and dressed from parts so the tailor can still change everything).

A doll is a few parts, each its own piece so the game could swing it: a big round head with a painted-on face (eyes
with a shine, blush, a small smile), hair as soft sculpted shapes, a body in the outfit's top, arms in its sleeves ending
in mitten hands, legs in its bottoms, rounded shoes; glasses when worn. Colors come from the look and outfit the game
already keeps (hair color, skin, top, trim, bottom, shoes), so any outfit made at the tailor dresses the doll.

    python tools/blender/doll.py --preview DIR      (renders the sheet; nothing is exported yet)
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
from mathutils import Vector, Matrix, Euler, noise
from common import *

LIGHT = Vector((-0.35, -0.55, 0.76)).normalized()


def mat(name, color, rough=0.75, sheen=0.0):
    m = material(name, hex_rgb(color), rough=rough)
    return m


def vmat(name, rough=0.7):
    return material(name, vcol='Col', rough=rough)


def obj_from(bm, name, m, smooth=True):
    o = mesh_obj(name, bm)
    if smooth:
        shade_smooth(o)
    o.data.materials.append(m)
    return o


def ellipsoid(bm, c, r, sub=3, rot=None):
    res = bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=1)
    M = Matrix.Translation(c) @ (rot.to_matrix().to_4x4() if rot else Matrix()) @ Matrix.Diagonal((r[0], r[1], r[2], 1))
    for v in res['verts']:
        v.co = M @ v.co
    return res['verts']


def capsule(bm, a, b, ra, rb, seg=14, rings=6):
    """A rounded limb from a to b, radius ra at a and rb at b."""
    a, b = Vector(a), Vector(b)
    d = (b - a)
    L = d.length
    z = d.normalized()
    x = z.cross(Vector((0, 1, 0)))
    if x.length < 1e-4:
        x = z.cross(Vector((1, 0, 0)))
    x.normalize()
    y = z.cross(x)
    verts = []
    prof = []
    for k in range(rings + 1):                          # the round end at a
        t = k / rings * math.pi / 2
        prof.append((-math.cos(t) * ra, math.sin(t) * ra))
    for k in range(1, 6):
        f = k / 5
        prof.append((L * f, ra + (rb - ra) * f))
    for k in range(1, rings + 1):                       # and at b
        t = k / rings * math.pi / 2
        prof.append((L + math.sin(t) * rb, math.cos(t) * rb))
    rows = []
    for (h, r) in prof:
        row = []
        for j in range(seg):
            ph = j / seg * math.tau
            row.append(bm.verts.new(a + z * h + (x * math.cos(ph) + y * math.sin(ph)) * r))
        rows.append(row)
    for i in range(len(rows) - 1):
        for j in range(seg):
            bm.faces.new((rows[i][j], rows[i][(j + 1) % seg], rows[i + 1][(j + 1) % seg], rows[i + 1][j]))
    return [v for r in rows for v in r]


def newbm():
    bm = bmesh.new()
    bm.verts.layers.float_color.new('Col')      # (made first: adding a layer later loses the vertices already held)
    return bm


def paint(bm, verts, fn):
    col = bm.verts.layers.float_color.get('Col')
    for v in verts:
        c = fn(v.co)
        v[col] = (c[0], c[1], c[2], 1)


def rgbv(h):
    return Vector(hex_rgb(h)[:3])


# ---------------------------------------------------------------- the body
H_HEAD = 1.06          # the head's middle
R_HEAD = 0.3


def head(spec, X):
    L = spec['look']
    bm = newbm()
    vs = ellipsoid(bm, Vector((0, 0, H_HEAD)), (R_HEAD * 1.06, R_HEAD * 0.98, R_HEAD), sub=4)
    skin, blush = rgbv(L['skin']), rgbv('#f29a98')
    def col(p):
        c = skin
        # blush on the cheeks
        for sx in (-1, 1):
            d = (p - Vector((sx * 0.17, -0.25, H_HEAD - 0.07))).length
            if d < 0.085:
                c = c.lerp(blush, 0.55 * (1 - d / 0.085) ** 0.7)
        return c
    paint(bm, vs, col)
    o = obj_from(bm, X + 'head', vmat(X + 'skin'))
    parts = [o]
    # the face: big dark eyes with a shine, small brows, a smile
    fb = newbm()
    eye = rgbv(L.get('eyes', '#2a1a14'))
    for sx in (-1, 1):
        c = Vector((sx * 0.105, -R_HEAD * 0.93, H_HEAD - 0.01))
        ev = ellipsoid(fb, c, (0.052, 0.022, 0.07), sub=3)
        paint(fb, ev, lambda p: eye)
        hv = ellipsoid(fb, c + Vector((sx * 0.012 - 0.012, -0.018, 0.028)), (0.016, 0.008, 0.02), sub=2)
        paint(fb, hv, lambda p: Vector((1, 1, 1)))
        bv = ellipsoid(fb, Vector((sx * 0.11, -R_HEAD * 0.9, H_HEAD + 0.1)), (0.045, 0.012, 0.012), sub=2, rot=Euler((0, sx * 0.25, 0)))
        paint(fb, bv, lambda p: rgbv(L.get('hairCol', '#5a3a2a')) * 0.8)
    # the mouth: a little curve of beads
    for k in range(7):
        t = (k - 3) / 3
        mv = ellipsoid(fb, Vector((t * 0.035, -R_HEAD * 0.97, H_HEAD - 0.105 + 0.012 * t * t)), (0.011, 0.008, 0.008), sub=1)
        paint(fb, mv, lambda p: rgbv('#a8424c'))
    nv = ellipsoid(fb, Vector((0, -R_HEAD * 0.99, H_HEAD - 0.05)), (0.018, 0.014, 0.014), sub=2)
    paint(fb, nv, lambda p: skin * 0.92)
    parts.append(obj_from(fb, X + 'face', vmat(X + 'face', rough=0.4)))
    return parts


def hair(spec, X):
    """Sculpted hair: a cap open over the face, and the style's own shapes (bangs, long waves, a bob, curls)."""
    L = spec['look']
    st = L['hair']
    base, hi = rgbv(L['hairCol']) * 0.9, rgbv(L['hairCol']) * 1.45
    bm = newbm()
    rng = random.Random(hash(st) & 0xffff)
    allv = []
    # the cap: a sphere a little bigger than the head, with the face cut out of it
    res = bmesh.ops.create_icosphere(bm, subdivisions=4, radius=1)
    capr = R_HEAD * 1.09
    for v in res['verts']:
        v.co = Vector((v.co.x * capr * 1.04, v.co.y * capr, v.co.z * capr)) + Vector((0, 0.015, H_HEAD + 0.02))
    line = 0.09 if st != 'curly' else 0.13           # the hairline above the eyes
    kill = [f for f in bm.faces if all(v.co.y < -0.06 and v.co.z < H_HEAD + line for v in f.verts) or all(v.co.z < H_HEAD - 0.12 and v.co.y < 0.08 for v in f.verts)]
    bmesh.ops.delete(bm, geom=kill, context='FACES')
    allv += [v for v in bm.verts]
    if st in ('waves', 'long', 'bob', 'sleek'):
        # bangs: a soft slab across the forehead, its edge in scallops
        for k in range(7):
            t = (k - 3) / 3
            c = Vector((t * 0.2, -R_HEAD * 0.92 + abs(t) * 0.05, H_HEAD + 0.15 - 0.01 * abs(t)))
            allv += ellipsoid(bm, c, (0.075, 0.05, 0.075), sub=2)
    if st in ('waves', 'long'):
        # long waves falling past the shoulders at the sides and behind
        for sx in (-1, 1):
            for k in range(6):
                z = H_HEAD - 0.02 - k * 0.085
                w = 0.016 * math.sin(k * 1.7)
                allv += ellipsoid(bm, Vector((sx * (0.27 + w + k * 0.01), 0.03 + k * 0.012, z)), (0.075, 0.1, 0.075), sub=2)
        for k in range(6):
            z = H_HEAD - 0.02 - k * 0.09
            for x in (-0.15, 0.0, 0.15):
                allv += ellipsoid(bm, Vector((x + 0.015 * math.sin(k * 2.1 + x * 9), 0.2, z)), (0.11, 0.08, 0.09), sub=2)
    elif st in ('bob', 'sleek'):
        for sx in (-1, 1):
            allv += ellipsoid(bm, Vector((sx * 0.27, 0.02, H_HEAD - 0.08)), (0.08, 0.16, 0.16), sub=3)
        allv += ellipsoid(bm, Vector((0, 0.17, H_HEAD - 0.06)), (0.26, 0.13, 0.18), sub=3)
    elif st == 'curly':
        # curls all over the cap
        for k in range(46):
            u, w = rng.uniform(0, math.tau), rng.uniform(-0.2, 1)
            d = Vector((math.cos(u) * math.sqrt(1 - w * w), math.sin(u) * math.sqrt(1 - w * w), w))
            p = Vector((0, 0.015, H_HEAD + 0.03)) + Vector((d.x * capr, d.y * capr, d.z * capr))
            if p.y < -0.12 and p.z < H_HEAD + 0.13:
                continue
            allv += ellipsoid(bm, p, (0.06, 0.06, 0.06), sub=2)
    elif st == 'spiky':
        for k in range(14):
            u = k / 14 * math.tau
            p = Vector((math.cos(u) * 0.16, math.sin(u) * 0.14 + 0.03, H_HEAD + 0.27))
            allv += ellipsoid(bm, p, (0.07, 0.07, 0.09), sub=2, rot=Euler((math.sin(u) * 0.5, -math.cos(u) * 0.5, 0)))
    seed = Vector((rng.random() * 9, 1, 2))
    paint(bm, list(bm.verts), lambda p: base.lerp(hi, max(0.0, min(1.0, 0.5 + 0.5 * noise.noise(Vector((p.x * 7, p.y * 7, p.z * 22)) + seed)))) * (0.85 + 0.2 * max(0.0, (p - Vector((0, 0, H_HEAD))).normalized().dot(LIGHT))))
    o = obj_from(bm, X + 'hair', vmat(X + 'hair', rough=0.55))
    parts = [o]
    if L.get('beard'):
        bb = newbm()
        for k in range(9):
            t = (k - 4) / 4
            # (painted as each is made: adding more to the mesh loses the vertices already held)
            paint(bb, ellipsoid(bb, Vector((t * 0.16, -0.22 + abs(t) * 0.08, H_HEAD - 0.2 + abs(t) * 0.09)), (0.055, 0.05, 0.055), sub=2), lambda p: rgbv(L['beard']))
        parts.append(obj_from(bb, X + 'beard', vmat(X + 'beard', rough=0.6)))
    return parts


def body(spec, X, pose=0.0):
    """The outfit: a body in its top (a knit hem, a skirt if it has one), sleeves and mitten hands, legs, shoes."""
    C = spec['clothes']
    top, trim, bot, shoe, skin = rgbv(C['top']), rgbv(C.get('trim', C['top'])), rgbv(C.get('bottom', C['top'])), rgbv(C.get('shoes', '#3a2a22')), rgbv(spec['look']['skin'])
    style = C.get('style', 'toppants')
    skirt = style in ('dress', 'sundress', 'topskirt', 'beach', 'sweaterdress', 'party', 'tennis', 'sailor', 'goth')
    sleeves = 'none' if style in ('sundress', 'beach', 'party', 'tennis') else 'short' if style in ('dress', 'topskirt', 'overalls', 'sailor') else 'long'
    parts = []
    # the body
    bm = newbm()
    prof = [(0.4, 0.175), (0.44, 0.172), (0.48, 0.168), (0.54, 0.163), (0.6, 0.158), (0.65, 0.155), (0.7, 0.152), (0.74, 0.14), (0.77, 0.12), (0.8, 0.07)]
    if skirt:
        prof = [(0.2, 0.26), (0.25, 0.24), (0.3, 0.22), (0.36, 0.195), (0.42, 0.17)] + prof[3:]
    rows, seg = [], 40
    for (z, r) in prof:
        rows.append([bm.verts.new((math.cos(j / seg * math.tau) * r * 1.08, math.sin(j / seg * math.tau) * r * 0.92, z)) for j in range(seg)])
    for i in range(len(rows) - 1):
        for j in range(seg):
            bm.faces.new((rows[i][j], rows[i][(j + 1) % seg], rows[i + 1][(j + 1) % seg], rows[i + 1][j]))
    bm.faces.new(list(reversed(rows[0])))
    zhem = prof[0][0]

    def bodycol(p):
        c = top
        if style == 'jacket':
            # the shirt showing down the front between the open jacket
            if p.y < -0.08 and abs(p.x) < 0.06 + (p.z - 0.4) * 0.12:
                c = trim
        elif style in ('knit', 'cozy') or C.get('knit'):
            # ribs at the hem and a cable down the front
            if p.z < zhem + 0.05:
                c = top * (0.82 if int(math.atan2(p.y, p.x) * 18) % 2 else 0.95)
            elif p.y < -0.1 and abs(p.x) < 0.035:
                c = top * (0.86 + 0.12 * math.sin(p.z * 120))
        if skirt and p.z < 0.42:
            c = c * (0.92 + 0.08 * math.sin(math.atan2(p.y, p.x) * 10))
        return c * (0.86 + 0.18 * max(0.0, Vector((p.x, p.y, 0.3)).normalized().dot(LIGHT)))
    paint(bm, list(bm.verts), bodycol)
    parts.append(obj_from(bm, X + 'body', vmat(X + 'top')))
    # arms: from the shoulder down and a little out, the sleeve's color to its length, then skin, a mitten hand
    for sx in (-1, 1):
        a_ = newbm()
        sh = Vector((sx * 0.15, 0, 0.73))
        swing = pose * sx
        hand = sh + Vector((sx * 0.13, -0.08 * swing, -0.3))
        vs = capsule(a_, sh, hand, 0.062, 0.054, seg=12, rings=4)
        ls = {'long': 1.0, 'short': 0.4, 'none': 0.0}[sleeves]
        paint(a_, vs, lambda p, sh=sh, hand=hand, ls=ls: (top if (p - sh).length < ls * (hand - sh).length + 0.03 else skin) * (0.9 + 0.12 * max(0.0, (p.x * sx) * 3)))
        hv = ellipsoid(a_, hand + Vector((sx * 0.005, 0, -0.045)), (0.058, 0.052, 0.062), sub=2)
        paint(a_, hv, lambda p: skin)
        parts.append(obj_from(a_, X + ('armL' if sx < 0 else 'armR'), vmat(X + 'arm' + str(sx))))
    # legs and shoes
    for sx in (-1, 1):
        l_ = newbm()
        hip = Vector((sx * 0.07, 0, 0.42 if not skirt else 0.3))
        foot = Vector((sx * 0.075, -0.06 * pose * -sx, 0.08))
        vs = capsule(l_, hip, foot, 0.068, 0.058, seg=12, rings=4)
        legcol = skin if skirt or style in ('beach',) else bot
        paint(l_, vs, lambda p: legcol * (0.9 + 0.1 * max(0.0, p.x * sx * 4)))
        sv = ellipsoid(l_, foot + Vector((0, -0.035, -0.035)), (0.07, 0.1, 0.055), sub=3)
        paint(l_, sv, lambda p: shoe * (0.85 + 0.25 * max(0.0, (p.z - 0.04) * 10)))
        parts.append(obj_from(l_, X + ('legL' if sx < 0 else 'legR'), vmat(X + 'leg' + str(sx))))
    if not skirt:
        hb = newbm()
        vs = ellipsoid(hb, Vector((0, 0, 0.42)), (0.165, 0.14, 0.07), sub=3)
        paint(hb, vs, lambda p: bot)
        parts.append(obj_from(hb, X + 'hips', vmat(X + 'hips')))
    return parts


def glasses(X):
    bm = newbm()
    vs = []
    for sx in (-1, 1):
        res = bmesh.ops.create_circle(bm, segments=20, radius=0.072)
        ring = res['verts']
        tube = []
        for v in ring:
            p = v.co.copy()
            v.co = Vector((sx * 0.105 + p.x, -R_HEAD * 1.0 - 0.012, H_HEAD - 0.01 + p.y))
        geom = bmesh.ops.extrude_edge_only(bm, edges=list({e for v in ring for e in v.link_edges}))
        for v in [g for g in geom['geom'] if isinstance(g, bmesh.types.BMVert)]:
            v.co += (v.co - Vector((sx * 0.105, v.co.y, H_HEAD - 0.01))).normalized() * 0.014
        vs += ring + [g for g in geom['geom'] if isinstance(g, bmesh.types.BMVert)]
    vs += capsule(bm, Vector((-0.035, -R_HEAD - 0.012, H_HEAD + 0.01)), Vector((0.035, -R_HEAD - 0.012, H_HEAD + 0.01)), 0.008, 0.008, seg=6, rings=2)
    for sx in (-1, 1):
        vs += capsule(bm, Vector((sx * 0.175, -R_HEAD - 0.01, H_HEAD)), Vector((sx * 0.3, 0.02, H_HEAD + 0.02)), 0.009, 0.009, seg=6, rings=2)
    paint(bm, list(bm.verts), lambda p: rgbv('#2a2224'))
    return [obj_from(bm, X + 'glasses', vmat(X + 'glasses', rough=0.3), smooth=False)]


def doll(spec, X, pose=0.0):
    parts = body(spec, X, pose) + head(spec, X) + hair(spec, X)
    if spec.get('eyes') == 'glasses':
        parts += glasses(X)
    # a doll stands a little under 1.5 tiles: the head is near half of it, as a toy's is
    return parts


FOLKS = {
    'sarah': dict(look=dict(hair='waves', hairCol='#8f4629', skin='#fbd9c6', eyes='#2a1417'),
                  clothes=dict(style='knit', top='#b3263a', trim='#d44a5c', bottom='#4d6d9f', shoes='#f3f1ee'), eyes='glasses'),
    'joe': dict(look=dict(hair='curly', hairCol='#3e2418', skin='#f1c7a8', eyes='#2a1a14'),
                clothes=dict(style='jacket', top='#c9962b', trim='#efe6d2', bottom='#5a3b2e', shoes='#3a2a22')),
    'elizabeth': dict(look=dict(hair='bob', hairCol='#5a3622', skin='#fbd9c6', eyes='#4a2c1c'),
                      clothes=dict(style='toppants', top='#4a78c8', trim='#9ab8e8', bottom='#2c3e66', shoes='#efeae0'), eyes='glasses'),
    'david': dict(look=dict(hair='spiky', hairCol='#d8602a', skin='#fbd9c6', eyes='#3f6fb8', beard='#c0502a'),
                  clothes=dict(style='jacket', top='#e86aa8', trim='#ffd1e7', bottom='#f4f1ea', shoes='#f4f1ea')),
    'sarah_sundress': dict(look=dict(hair='waves', hairCol='#8f4629', skin='#fbd9c6', eyes='#2a1417'),
                           clothes=dict(style='sundress', top='#f2c94c', trim='#ffffff', bottom='#f2c94c', shoes='#c8644a'), eyes='glasses'),
    'sarah_overalls': dict(look=dict(hair='bob', hairCol='#2a1a1a', skin='#fbd9c6', eyes='#2a1417'),
                           clothes=dict(style='overalls', top='#7ab0e0', trim='#ffffff', bottom='#3c5a8a', shoes='#d8423a'), eyes=None),
}


def place(parts, x, y=0.0, rot=0.0):
    for o in parts:
        o.matrix_world = Matrix.Translation((x, y, 0)) @ Euler((0, 0, rot)).to_matrix().to_4x4() @ o.matrix_world


if __name__ == '__main__':
    args = sys.argv[1:]
    prev = args[args.index('--preview') + 1] if '--preview' in args else None
    reset()
    x = 0
    for k, (name, spec) in enumerate(FOLKS.items()):
        parts = doll(spec, name + '_', pose=0.0)
        place(parts, x)
        x += 0.85
    ground_plane(color='#e8d8c0')
    light_rig()
    camera(((x - 0.85) / 2, 0, 0.72), dist=5.0, pitch=14)
    render(os.path.join(prev, 'dolls.png'), size=(1500, 640), samples=96)
    # Sarah and Joe close, from a little above
    print('done')
