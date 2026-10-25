"""Fortune's shop as the concept draws it: a front-gabled building of blue-grey board and batten, a dark blue slate roof
with wide cream barge boards, a dark wooden sign with gold letters under the peak, a big window on the left under a green
and white striped awning with crates of apples below, a green door on the right with a glass top and an OPEN sign, a
chalkboard A-frame by the door, a stone step.

Like the cottage: every board, batten, slate, pane and letter is modelled and baked onto the game's shop, which keeps
what stands out; the glass is its own material (it glows at night). Footprint 4 x 3 tiles; the model's middle is the
footprint's middle, its door half a tile right of it (the door's tile).

    python tools/blender/shop.py [--preview DIR]
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
import numpy as np
from mathutils import Vector, Matrix
from common import *
from cottage import textured_material

W, D, H = 3.4, 2.5, 2.05            # walls: across, deep, high
RISE, EAVE, RAKE = 1.3, 0.22, 0.26  # the gable: ridge above the walls (running front to back), side overhang, front overhang
FOOT = 0.14
DOOR_X, DOOR_W, DOOR_H = 0.5, 0.8, 1.58
WIN_X, WIN_W, WIN_H, WIN_Z = -0.92, 1.08, 0.86, 0.66
C = {'wall': '#7090b6', 'wall2': '#5f7ea6', 'batten': '#82a0c4', 'trim': '#ede2c8', 'slate': '#3e4c6c', 'slate2': '#55638a',
     'slate3': '#2e3a56', 'sign': '#4a3020', 'gold': '#e8c060', 'door': '#3f8a52', 'glass': '#8ea6b8', 'open': '#e8862a',
     'stripe': '#3f8f55', 'canvas': '#f2ede0', 'crate': '#9a6a3c', 'apple': '#c82a24', 'board': '#2e3634', 'chalk': '#e8e4da',
     'foot': '#968f84', 'step': '#b6afa3'}


class Builder:
    def __init__(self, rng):
        self.bm = bmesh.new()
        self.col = self.bm.verts.layers.float_color.new('Col')
        self.rng = rng

    def paint(self, verts, color, jit=0.0):
        c = hex_rgb(C.get(color, color)) if isinstance(color, str) else color
        k = 1 + (self.rng.random() - 0.5) * 2 * jit
        for v in verts:
            v[self.col] = (c[0] * k, c[1] * k, c[2] * k, 1)

    def box(self, x0, y0, z0, x1, y1, z1, color, jit=0.0, mat=None):
        bm = self.bm
        v = [bm.verts.new(p) for p in ((x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0), (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1))]
        for f in ((0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7), (4, 5, 6, 7), (3, 2, 1, 0)):
            face = bm.faces.new([v[i] for i in f])
            if mat is not None:
                face.material_index = mat
        self.paint(v, color, jit)
        return v

    def face(self, pts, color, out, mat=None):
        v = [self.bm.verts.new(p) for p in pts]
        f = self.bm.faces.new(v)
        f.normal_update()
        if f.normal.dot(Vector(out)) < 0:
            f.normal_flip()
        if mat is not None:
            f.material_index = mat
        self.paint(v, color)
        return f

    def slab(self, quad, t, color, up):
        """A thick quad (a roof slab): quad's four corners, pushed t along `up`."""
        bm = self.bm
        bot = [bm.verts.new(p) for p in quad]
        top = [bm.verts.new(Vector(p) + Vector(up) * t) for p in quad]
        fs = [bm.faces.new(top), bm.faces.new(list(reversed(bot)))]
        for i in range(4):
            j = (i + 1) % 4
            fs.append(bm.faces.new((bot[i], bot[j], top[j], top[i])))
        bmesh.ops.recalc_face_normals(bm, faces=fs)
        self.paint(bot + top, color)

    def obj(self, name):
        return mesh_obj(name, self.bm)


def z_eave():
    return H - EAVE * (RISE / (W / 2))


def shell(b):
    x0, x1, y0, y1 = -W / 2, W / 2, -D / 2, D / 2
    n0 = len(b.bm.faces)
    b.box(x0, y0, 0, x1, y1, H, 'wall')
    b.box(x0 - 0.03, y0 - 0.03, 0, x1 + 0.03, y1 + 0.03, FOOT, 'foot')
    bmesh.ops.recalc_face_normals(b.bm, faces=list(b.bm.faces)[n0:])
    # the gables (front and back)
    for y, s in ((y0, -1), (y1, 1)):
        b.face([(x0, y, H), (x1, y, H), (0, y, H + RISE)], 'wall', (0, s, 0))
    # roof slabs, left and right, overhanging at the sides and front and back
    ze = z_eave()
    T = 0.09
    for s in (-1, 1):
        q = [(s * (W / 2 + EAVE), y0 - RAKE, ze), (s * (W / 2 + EAVE), y1 + RAKE, ze), (0, y1 + RAKE, H + RISE), (0, y0 - RAKE, H + RISE)]
        up = Vector((s * RISE, 0, W / 2)).normalized()
        b.slab(q, T, 'slate', up)
    b.box(-0.07, y0 - RAKE, H + RISE + 0.02, 0.07, y1 + RAKE, H + RISE + 0.12, 'slate3')
    # wide barge boards up the front and back rakes, fascia along the sides
    for yb, s in ((y0 - RAKE - 0.06, -1), (y1 + RAKE, 1)):
        for side in (-1, 1):
            a = Vector((side * (W / 2 + EAVE + 0.02), yb, ze - 0.12))
            c = Vector((0, yb, H + RISE - 0.06))
            d = (c - a).normalized()
            nrm = Vector((-d.z, 0, d.x)) * side * -1
            p = [a, c, c + Vector((0, 0, 0.2)), a + Vector((0, 0, 0.2))]
            bm = b.bm
            v0 = [bm.verts.new(q) for q in p]
            v1 = [bm.verts.new(q + Vector((0, 0.06, 0))) for q in p]
            fs = [bm.faces.new(v0), bm.faces.new(list(reversed(v1)))]
            for i in range(4):
                j = (i + 1) % 4
                fs.append(bm.faces.new((v0[i], v0[j], v1[j], v1[i])))
            bmesh.ops.recalc_face_normals(bm, faces=fs)
            b.paint(v0 + v1, 'trim')
    for side in (-1, 1):
        x = side * (W / 2 + EAVE + 0.01)
        b.box(min(x, x - side * 0.06), y0 - RAKE, ze - 0.12, max(x, x - side * 0.06), y1 + RAKE, ze + 0.02, 'trim')
    # the frieze under the gable, corner boards
    b.box(x0 - 0.02, y0 - 0.05, H - 0.14, x1 + 0.02, y0 + 0.01, H + 0.02, 'trim')
    for x in (x0 - 0.02, x1 - 0.1):
        b.box(x, y0 - 0.04, FOOT, x + 0.12, y0 + 0.08, H - 0.14, 'trim')
        b.box(x, y1 - 0.08, FOOT, x + 0.12, y1 + 0.04, H - 0.14, 'trim')
    # the sign on the gable
    b.box(-0.88, y0 - 0.07, H + 0.16, 0.88, y0 - 0.01, H + 0.52, 'sign')
    for z in (H + 0.12, H + 0.52):
        b.box(-0.92, y0 - 0.09, z, 0.92, y0 - 0.06, z + 0.04, 'gold')
    for x in (-0.92, 0.88):
        b.box(x, y0 - 0.09, H + 0.12, x + 0.04, y0 - 0.06, H + 0.56, 'gold')
    # door frame and door, window frame and sill, the awning (a sloping slab), crates, the step, the chalkboard
    b.box(DOOR_X - DOOR_W / 2 - 0.09, y0 - 0.05, FOOT, DOOR_X + DOOR_W / 2 + 0.09, y0 + 0.01, FOOT + DOOR_H + 0.1, 'trim')
    b.box(DOOR_X - DOOR_W / 2, y0 - 0.07, FOOT, DOOR_X + DOOR_W / 2, y0 - 0.03, FOOT + DOOR_H, 'door')
    b.box(WIN_X - WIN_W / 2 - 0.08, y0 - 0.05, WIN_Z - 0.08, WIN_X + WIN_W / 2 + 0.08, y0 + 0.01, WIN_Z + WIN_H + 0.08, 'trim')
    b.box(WIN_X - WIN_W / 2 - 0.12, y0 - 0.12, WIN_Z - 0.12, WIN_X + WIN_W / 2 + 0.12, y0 + 0.01, WIN_Z - 0.06, 'trim')
    ax0, ax1, az1, az0, ad = WIN_X - WIN_W / 2 - 0.16, WIN_X + WIN_W / 2 + 0.16, WIN_Z + WIN_H + 0.42, WIN_Z + WIN_H + 0.06, 0.5
    q = [(ax0, y0 - 0.02, az1), (ax1, y0 - 0.02, az1), (ax1, y0 - ad, az0), (ax0, y0 - ad, az0)]
    b.slab(q, 0.03, 'canvas', Vector((0, -(az1 - az0), ad)).normalized())
    b.box(ax0, y0 - ad - 0.02, az0 - 0.14, ax1, y0 - ad + 0.01, az0 + 0.01, 'canvas')
    for cx in (WIN_X - 0.3, WIN_X + 0.26):
        b.box(cx - 0.24, y0 - 0.5, 0, cx + 0.24, y0 - 0.14, 0.34, 'crate')
    b.box(DOOR_X - 0.55, y0 - 0.5, 0, DOOR_X + 0.55, y0 - 0.02, 0.12, 'step')
    # the chalkboard A-frame, leaning boards to the right of the door
    bx, by = DOOR_X + 1.0, y0 - 0.62
    for s in (-1, 1):
        q = [(bx - 0.26, by + s * 0.2, 0), (bx + 0.26, by + s * 0.2, 0), (bx + 0.26, by + s * 0.03, 0.78), (bx - 0.26, by + s * 0.03, 0.78)]
        b.slab(q, 0.03, 'crate', Vector((0, s, 0.25)).normalized())


def glass(b, mat=None, front=-D / 2 - 0.056):
    """Glass: the window's panes, the door's top half."""
    b.face([(WIN_X - WIN_W / 2, front, WIN_Z), (WIN_X + WIN_W / 2, front, WIN_Z), (WIN_X + WIN_W / 2, front, WIN_Z + WIN_H), (WIN_X - WIN_W / 2, front, WIN_Z + WIN_H)], 'glass', (0, -1, 0), mat)
    gz0, gz1 = FOOT + 0.8, FOOT + DOOR_H - 0.12
    b.face([(DOOR_X - 0.26, front - 0.02, gz0), (DOOR_X + 0.26, front - 0.02, gz0), (DOOR_X + 0.26, front - 0.02, gz1), (DOOR_X - 0.26, front - 0.02, gz1)], 'glass', (0, -1, 0), mat)


def details(b, rng):
    x0, x1, y0, y1 = -W / 2, W / 2, -D / 2, D / 2
    # board and batten: boards 18 cm wide, each its own blue-grey, a batten over every joint (front, back, sides, gables)
    def boards(axis, fixed, a0, a1, top_fn, out):
        a = a0
        while a < a1 - 0.01:
            b2 = min(a1, a + 0.18)
            col = mix(hex_rgb(C['wall']), hex_rgb(C['wall2']), rng.random())
            zt0, zt1 = top_fn(a), top_fn(b2)
            if axis == 'x':
                pts = [(a, fixed, FOOT), (b2, fixed, FOOT), (b2, fixed, zt1), (a, fixed, zt0)]
            else:
                pts = [(fixed, a, FOOT), (fixed, b2, FOOT), (fixed, b2, zt1), (fixed, a, zt0)]
            b.face(pts, col, out)
            # the batten at the joint
            m = b2
            if m < a1 - 0.01:
                zt = top_fn(m)
                if axis == 'x':
                    b.box(m - 0.016, fixed + out[1] * 0.025 - 0.01, FOOT, m + 0.016, fixed + out[1] * 0.025 + 0.01, zt, 'batten')
                else:
                    b.box(fixed + out[0] * 0.025 - 0.01, m - 0.016, FOOT, fixed + out[0] * 0.025 + 0.01, m + 0.016, zt, 'batten')
            a = b2
    gable = lambda x: H + RISE * max(0.0, 1 - abs(x) / (W / 2)) - 0.02
    boards('x', y0 - 0.012, x0 + 0.1, x1 - 0.1, gable, (0, -1, 0))
    boards('x', y1 + 0.012, x0 + 0.1, x1 - 0.1, gable, (0, 1, 0))
    boards('y', x0 - 0.012, y0 + 0.1, y1 - 0.1, lambda y: H - 0.02, (-1, 0, 0))
    boards('y', x1 + 0.012, y0 + 0.1, y1 - 0.1, lambda y: H - 0.02, (1, 0, 0))
    # slates: rows up each slope, rectangles staggered, every one its own blue-grey
    ze = z_eave()
    T = 0.09
    for s in (-1, 1):
        A = Vector((s * (W / 2 + EAVE), 0, ze))
        R = Vector((0, 0, H + RISE))
        up = Vector((s * RISE, 0, W / 2)).normalized()
        L = (R - A).length
        rows = int(L / 0.1)
        for r in range(rows):
            t0 = r / rows
            p0 = A.lerp(R, t0) + up * (T + 0.005 + 0.006 * (r % 2))
            dn = (A - R).normalized()
            off = 0.0 if r % 2 == 0 else 0.09
            y = y0 - RAKE - off
            while y < y1 + RAKE:
                ya, yb = max(y0 - RAKE, y + 0.008), min(y1 + RAKE, y + 0.18 - 0.008)
                if yb - ya > 0.03:
                    tone = rng.random()
                    col = mix(hex_rgb(C['slate3']), hex_rgb(C['slate']), min(1, tone * 1.7)) if tone < 0.6 else mix(hex_rgb(C['slate']), hex_rgb(C['slate2']), (tone - 0.6) * 2.5)
                    q = [p0 + Vector((0, ya, 0)) - dn * 0.02, p0 + Vector((0, yb, 0)) - dn * 0.02, p0 + Vector((0, yb, 0)) + dn * 0.12, p0 + Vector((0, ya, 0)) + dn * 0.12]
                    b.face([tuple(v) for v in q], col, tuple(up))
                y += 0.18
    # the sign's letters
    bpy.ops.object.text_add(location=(0, y0 - 0.075, H + 0.25))
    t = bpy.context.active_object
    t.data.body = "FORTUNE'S"
    t.data.size = 0.26
    t.data.extrude = 0.008
    t.data.align_x = 'CENTER'
    t.rotation_euler = (math.pi / 2, 0, 0)
    bpy.ops.object.convert(target='MESH')
    letters = bpy.context.active_object
    me = letters.data
    ca = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
    g = hex_rgb(C['gold'])
    for i in range(len(me.vertices)):
        ca.data[i].color = g
    # door: panels below the glass, the OPEN sign, a knob
    fy = y0 - 0.072
    b.box(DOOR_X - 0.27, fy - 0.012, FOOT + 0.14, DOOR_X + 0.27, fy + 0.004, FOOT + 0.7, mix(hex_rgb(C['door']), (1, 1, 1, 1), 0.08))
    b.box(DOOR_X - 0.13, fy - 0.1, FOOT + 1.06, DOOR_X + 0.13, fy - 0.085, FOOT + 1.2, 'open')
    b.box(DOOR_X - 0.3, fy - 0.045, FOOT + 0.74, DOOR_X - 0.25, fy, FOOT + 0.79, '#e3b84a')
    # window: muntins in a 3 x 2 grid, things on display behind
    gy = y0 - 0.06
    for k in (1, 2):
        x = WIN_X - WIN_W / 2 + k * WIN_W / 3
        b.box(x - 0.018, gy - 0.012, WIN_Z, x + 0.018, gy, WIN_Z + WIN_H, 'trim')
    b.box(WIN_X - WIN_W / 2, gy - 0.012, WIN_Z + WIN_H / 2 - 0.018, WIN_X + WIN_W / 2, gy, WIN_Z + WIN_H / 2 + 0.018, 'trim')
    for k in range(5):
        x = WIN_X - WIN_W / 2 + 0.15 + k * 0.2
        b.face([(x - 0.06, gy + 0.004, WIN_Z + 0.06), (x + 0.06, gy + 0.004, WIN_Z + 0.06), (x + 0.06, gy + 0.004, WIN_Z + 0.26), (x - 0.06, gy + 0.004, WIN_Z + 0.26)], rng.choice(['#e8b040', '#d84a3a', '#6aa04a', '#e8e0c8']), (0, -1, 0))
    # awning stripes (on the slab's top), a scalloped edge
    ax0, ax1, az1, az0, ad = WIN_X - WIN_W / 2 - 0.16, WIN_X + WIN_W / 2 + 0.16, WIN_Z + WIN_H + 0.42, WIN_Z + WIN_H + 0.06, 0.5
    n = 8
    nrm = Vector((0, -(az1 - az0), ad)).normalized()
    for k in range(n):
        if k % 2:
            continue
        xa, xb = ax0 + k * (ax1 - ax0) / n, ax0 + (k + 1) * (ax1 - ax0) / n
        p = [(xa, y0 - 0.02, az1), (xb, y0 - 0.02, az1), (xb, y0 - ad, az0), (xa, y0 - ad, az0)]
        b.face([tuple(Vector(q) + nrm * 0.034) for q in p], 'stripe', tuple(nrm))
        b.face([(xa, y0 - ad - 0.024, az0 - 0.13), (xb, y0 - ad - 0.024, az0 - 0.13), (xb, y0 - ad - 0.024, az0 + 0.005), (xa, y0 - ad - 0.024, az0 + 0.005)], 'stripe', (0, -1, 0))
    # apples heaped in the crates, a pumpkin
    for cx in (WIN_X - 0.3, WIN_X + 0.26):
        for _ in range(16):
            ax, ay = cx + rng.uniform(-0.18, 0.18), y0 - 0.32 + rng.uniform(-0.13, 0.13)
            res = bmesh.ops.create_icosphere(b.bm, subdivisions=2, radius=0.055, matrix=Matrix.Translation((ax, ay, 0.36 + rng.uniform(0, 0.04))))
            b.paint(res['verts'], rng.choice(['#c82a24', '#d8402a', '#b8241e', '#e05a2a']))
    # chalkboard: the dark board inset, chalk lines
    bx, by = DOOR_X + 1.0, y0 - 0.62
    p = [(bx - 0.21, by - 0.19, 0.12), (bx + 0.21, by - 0.19, 0.12), (bx + 0.21, by - 0.05, 0.68), (bx - 0.21, by - 0.05, 0.68)]
    nb = Vector((0, -1, 0.25)).normalized()
    b.face([tuple(Vector(q) + nb * 0.035) for q in p], 'board', tuple(nb))
    for k in range(4):
        z = 0.24 + k * 0.11
        f = (z - 0.12) / 0.56
        yy = by - 0.19 + f * 0.14
        b.face([tuple(Vector(q) + nb * 0.037) for q in ((bx - 0.15, yy, z), (bx + 0.15 - 0.06 * (k % 2), yy, z), (bx + 0.15 - 0.06 * (k % 2), yy + 0.005, z + 0.02), (bx - 0.15, yy + 0.005, z + 0.02))], 'chalk', tuple(nb))
    # footing stones
    x = x0 - 0.03
    while x < x1 + 0.03:
        w = rng.uniform(0.18, 0.32)
        b.box(x + 0.012, y0 - 0.045, 0.02, min(x1 + 0.03, x + w) - 0.012, y0 - 0.03, FOOT - 0.02, mix(hex_rgb('#8a847a'), hex_rgb('#b0a99c'), rng.random()))
        x += w
    return letters


def build(tex=2048):
    rng = random.Random(17)
    hb = Builder(rng)
    shell(hb)
    letters = details(hb, rng)
    glass(hb)
    # what shows in the glass: a pale reflection, the door's dim inside
    gy = -D / 2 - 0.058
    hb.face([(WIN_X - 0.3, gy, WIN_Z + 0.45), (WIN_X - 0.1, gy, WIN_Z + 0.8), (WIN_X, gy, WIN_Z + 0.8), (WIN_X - 0.2, gy, WIN_Z + 0.45)], '#b4c8d4', (0, -1, 0))
    gz0 = FOOT + 0.8
    hb.face([(DOOR_X - 0.2, gy - 0.025, gz0 + 0.1), (DOOR_X - 0.02, gy - 0.025, gz0 + 0.5), (DOOR_X + 0.08, gy - 0.025, gz0 + 0.5), (DOOR_X - 0.1, gy - 0.025, gz0 + 0.1)], '#bccfda', (0, -1, 0))
    hi = hb.obj('shop_high')
    select_only(letters, hi)
    bpy.ops.object.join()
    hi = bpy.context.active_object
    hi.data.materials.clear()
    hi.data.materials.append(textured_material('shop_high'))
    lb = Builder(random.Random(17))
    shell(lb)
    glass(lb, mat=1)
    lo = lb.obj('shop')
    lo.data.materials.append(material('shop_mat'))
    lo.data.materials.append(material('shop_glass'))
    smart_uv(lo, margin=0.003, angle=60)
    kw = dict(high=hi, extrusion=0.1, max_dist=0.18)
    diff = bake(lo, 'DIFFUSE', tex, samples=4, **kw)
    ao = bake(lo, 'AO', tex, samples=64, **kw)
    nrm = bake(lo, 'NORMAL', tex, samples=4, **kw)
    a = image_array(diff)
    o = image_array(ao)[..., :1]
    a[..., :3] *= (0.42 + 0.58 * o ** 1.2)
    col = image_from_array('shop_col', a)
    lo.data.materials.clear()
    lo.data.materials.append(material('shop_mat', image=col, normal=nrm, rough=0.85))
    lo.data.materials.append(material('shop_glass', image=col, rough=1.0))
    hi.hide_render = True
    return hi, lo


if __name__ == '__main__':
    args = sys.argv[1:]
    prev = args[args.index('--preview') + 1] if '--preview' in args else None
    reset()
    hi, lo = build()
    export([lo], 'shop')
    if prev:
        ground_plane()
        person(x=-1.9, y=-2.0)
        light_rig()
        camera((0, -0.5, 1.5), dist=8.2)
        render(os.path.join(prev, 'shop.png'), size=(900, 700), samples=64)
        lo.hide_render = True
        hi.hide_render = False
        render(os.path.join(prev, 'shop_high.png'), size=(900, 700), samples=48)
    print('built shop')
