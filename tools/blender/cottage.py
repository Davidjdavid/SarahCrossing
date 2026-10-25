"""Sarah's cottage as the concept draws it: cream clapboard walls with white corner boards on a stone footing, a red
fish-scale shingle roof with white fascia and barge boards, a brick chimney, a red panelled door with a wreath in a white
frame, four-pane windows with green shutters and pink curtains, a stone step.

The detail (every board, shingle, brick and panel, each its own shade) is modelled in full and baked onto the game's
cottage, which keeps only what stands out from the walls (frames, sills, shutters, fascia, chimney, step); the glass is
its own material so the windows can glow at night. One unit is one tile; the footprint is 4 x 3 tiles (the game stretches
depth by 1.25, so 3.75 units deep), the door on the south side in the middle.

    python tools/blender/cottage.py [--preview DIR]
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
import numpy as np
from mathutils import Vector, Matrix, noise
from common import *

# (taller walls and a gentler roof than a real cottage: from the game's camera, looking down at 34 degrees, a steep roof
# fills the picture and the walls shrink to a strip; these give the concept's big front wall and red roof together)
W, D, H = 3.7, 2.4, 2.15            # walls: across, deep, high
RISE, EAVE, RAKE = 0.82, 0.24, 0.2  # the roof: ridge above the walls, overhang front/back and at the sides
FOOT = 0.16                         # the stone footing
DOOR_W, DOOR_H = 0.74, 1.52
WIN_W, WIN_H, WIN_Z = 0.72, 0.76, 0.84
WIN_X = 1.08

C = {
    'wall': '#ead9b4', 'wall2': '#dccaa2', 'trim': '#f7f3ea', 'foot': '#9c968c', 'roof': '#952620', 'roof2': '#b2362b',
    'roof3': '#6c1814', 'brick': '#a5523e', 'brick2': '#8a4232', 'mortar': '#c9bfae', 'door': '#a3262a', 'shutter': '#3f6e4c',
    'glass': '#2d3d4a', 'curtain': '#f0b4a6', 'wreath': '#3f7a3a', 'berry': '#d02a2a', 'knob': '#e3b84a', 'step': '#b8b1a5',
}


class Builder:
    """Adds boxes and shapes to a bmesh with a color per element (a point color attribute)."""
    def __init__(self, rng):
        self.bm = bmesh.new()
        self.col = self.bm.verts.layers.float_color.new('Col')
        self.rng = rng

    def _paint(self, verts, color, jit=0.0):
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
        self._paint(v, color, jit)
        return v

    def poly(self, pts, color, jit=0.0, mat=None, out=None):
        v = [self.bm.verts.new(p) for p in pts]
        f = self.face(v, out)
        if mat is not None:
            f.material_index = mat
        self._paint(v, color, jit)
        return f

    def face(self, verts, out=None):
        """A face from verts, turned to face `out` if given (the bake only sees a detail from its front)."""
        f = self.bm.faces.new(verts)
        if out is not None:
            f.normal_update()
            if f.normal.dot(Vector(out)) < 0:
                f.normal_flip()
        return f

    def prism(self, pts2, y0, y1, color, jit=0.0):
        """A shape in the x-z plane (counter-clockwise seen from the front) pushed from y0 to y1."""
        bm = self.bm
        a = [bm.verts.new((x, y0, z)) for x, z in pts2]
        b = [bm.verts.new((x, y1, z)) for x, z in pts2]
        bm.faces.new(list(reversed(a)))
        bm.faces.new(b)
        n = len(pts2)
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((a[i], a[j], b[j], b[i]))
        self._paint(a + b, color, jit)

    def fix(self, faces):
        """Closed parts facing outward; the gable triangles and the glass (single faces) facing away from the middle."""
        bmesh.ops.recalc_face_normals(self.bm, faces=faces)
        for f in faces:
            c = f.calc_center_median()
            if len(f.verts) == 3 and c.z > H - 0.01 and f.normal.x * c.x < 0:
                f.normal_flip()
            elif f.material_index == 1 and Vector((c.x / (W / 2), c.y / (D / 2), 0)).dot(Vector((f.normal.x, f.normal.y, 0))) < 0:
                f.normal_flip()

    def obj(self, name, fix=False):
        if fix:
            self.fix(list(self.bm.faces))
        return mesh_obj(name, self.bm)


def roof_planes():
    """The two roof slopes: (eave edge front, ridge) corners."""
    y_e = D / 2 + EAVE
    z_e = H - EAVE * (RISE / (D / 2))
    return y_e, z_e


def shell(b, low=True):
    """What both cottages share: walls, gables, roof slabs, fascia, chimney, footing, step, frames, sills, shutters."""
    x0, x1, y0, y1 = -W / 2, W / 2, -D / 2, D / 2
    b.box(x0, y0, 0, x1, y1, H, 'wall')
    # gable ends
    for x, s in ((x0, -1), (x1, 1)):
        pts = [(y0, H), (y1, H), (0, H + RISE)]
        v = [b.bm.verts.new((x, y, z)) for y, z in pts]
        b.bm.faces.new(v if s > 0 else list(reversed(v)))
        b._paint(v, 'wall')
    # footing
    b.box(x0 - 0.03, y0 - 0.03, 0, x1 + 0.03, y1 + 0.03, FOOT, 'foot')
    # corner boards
    for x in (x0, x1 - 0.1):
        for y in (y0 - 0.012, y1 - 0.1):
            b.box(x - 0.012, y, FOOT, x + 0.112, y + 0.112, H, 'trim')
    # roof slabs (thick) and the white boards along their edges
    y_e, z_e = roof_planes()
    T = 0.09
    for s in (-1, 1):
        ye = s * y_e
        p = [(x0 - RAKE, ye, z_e), (x1 + RAKE, ye, z_e), (x1 + RAKE, 0, H + RISE), (x0 - RAKE, 0, H + RISE)]
        top = [b.bm.verts.new((x, y, z + T)) for x, y, z in p]
        bot = [b.bm.verts.new((x, y, z)) for x, y, z in p]
        if s < 0:
            b.bm.faces.new(top)
            b.bm.faces.new(list(reversed(bot)))
        else:
            b.bm.faces.new(list(reversed(top)))
            b.bm.faces.new(bot)
        for i in range(4):
            j = (i + 1) % 4
            f = (top[i], bot[i], bot[j], top[j]) if s < 0 else (top[j], bot[j], bot[i], top[i])
            b.bm.faces.new(f)
        b._paint(top + bot, 'roof')
        # fascia along the eave, barge boards up the rakes
        # (in front of the slab's edge, not sharing its face: the bake can't tell two faces in one place apart)
        fy0 = ye - 0.07 if s < 0 else ye
        b.box(x0 - RAKE - 0.02, fy0, z_e - 0.1, x1 + RAKE + 0.02, fy0 + 0.07, z_e + T + 0.012, 'trim')
        for x in (x0 - RAKE - 0.02, x1 + RAKE - 0.04):
            # a board along the slope from the eave to the ridge
            zs = [(ye, z_e - 0.1), (0, H + RISE - 0.1)]
            pts = [(ye, z_e - 0.1), (0, H + RISE - 0.1), (0, H + RISE + T + 0.03), (ye, z_e + T + 0.01)]
            a = [b.bm.verts.new((x, y, z)) for y, z in pts]
            c = [b.bm.verts.new((x + 0.06, y, z)) for y, z in pts]
            b.bm.faces.new(list(reversed(a)) if s < 0 else a)
            b.bm.faces.new(c if s < 0 else list(reversed(c)))
            for i in range(4):
                j = (i + 1) % 4
                b.bm.faces.new((a[i], a[j], c[j], c[i]) if s < 0 else (a[j], a[i], c[i], c[j]))
            b._paint(a + c, 'trim')
    # ridge cap
    b.box(x0 - RAKE, -0.07, H + RISE + T - 0.03, x1 + RAKE, 0.07, H + RISE + T + 0.05, 'roof3')
    # chimney (on the back slope, right of the middle), with a cap
    cx, cy = 0.95, 0.42
    b.box(cx - 0.22, cy - 0.22, H + 0.5, cx + 0.22, cy + 0.22, H + RISE + 0.5, 'brick')
    b.box(cx - 0.27, cy - 0.27, H + RISE + 0.5, cx + 0.27, cy + 0.27, H + RISE + 0.58, '#6e665e')
    # step
    b.box(-0.55, y0 - 0.5, 0, 0.55, y0 - 0.02, 0.13, 'step')
    # door: frame (stands out), the door set in
    fy = y0
    b.box(-DOOR_W / 2 - 0.09, fy - 0.05, FOOT, DOOR_W / 2 + 0.09, fy + 0.01, DOOR_H + FOOT + 0.1, 'trim')
    b.box(-DOOR_W / 2, fy - 0.07, FOOT, DOOR_W / 2, fy - 0.03, DOOR_H + FOOT, 'door')
    # windows: frame, sill, shutters (front), one window on each side wall
    for wx in (-WIN_X, WIN_X):
        b.box(wx - WIN_W / 2 - 0.07, fy - 0.05, WIN_Z - 0.07, wx + WIN_W / 2 + 0.07, fy + 0.01, WIN_Z + WIN_H + 0.07, 'trim')
        b.box(wx - WIN_W / 2 - 0.1, fy - 0.1, WIN_Z - 0.11, wx + WIN_W / 2 + 0.1, fy + 0.01, WIN_Z - 0.05, 'trim')
        for s in (-1, 1):
            sx = wx + s * (WIN_W / 2 + 0.07 + 0.15)
            b.box(sx - 0.14, fy - 0.06, WIN_Z - 0.04, sx + 0.14, fy - 0.01, WIN_Z + WIN_H + 0.04, 'shutter')
    for sx in (x0, x1):
        s = 1 if sx > 0 else -1
        b.box(sx - (0.05 if s > 0 else 0.01) * 1, -0.5 - 0.07, WIN_Z - 0.07, sx + (0.01 if s > 0 else 0.05), 0.2 + 0.07, WIN_Z + WIN_H + 0.07, 'trim')


def glass_quads(b, mat=None, inset=0.0):
    """The window glass (front two, a side window each end), just in front of the frame's face."""
    fy = -D / 2 - 0.054
    out = []
    for wx in (-WIN_X, WIN_X):
        out.append(b.poly([(wx - WIN_W / 2, fy - inset, WIN_Z), (wx + WIN_W / 2, fy - inset, WIN_Z), (wx + WIN_W / 2, fy - inset, WIN_Z + WIN_H), (wx - WIN_W / 2, fy - inset, WIN_Z + WIN_H)], 'glass', mat=mat, out=(0, -1, 0)))
    for sx in (-W / 2 - 0.055, W / 2 + 0.055):
        s = 1 if sx > 0 else -1
        p = [(sx, -0.5, WIN_Z), (sx, 0.2, WIN_Z), (sx, 0.2, WIN_Z + WIN_H), (sx, -0.5, WIN_Z + WIN_H)]
        out.append(b.poly(p, 'glass', mat=mat, out=(s, 0, 0)))
    return out


def details(b, rng):
    """The high cottage's surface detail."""
    x0, x1, y0, y1 = -W / 2, W / 2, -D / 2, D / 2
    # clapboards: boards 13 cm high, each tipped out at the bottom, every one its own cream
    bh = 0.13
    for face, (ax, bx, yy, nrm) in {'front': (x0 + 0.1, x1 - 0.1, y0, -1), 'back': (x0 + 0.1, x1 - 0.1, y1, 1)}.items():
        z = FOOT
        while z < H - 0.02:
            z1 = min(H, z + bh)
            col = mix(hex_rgb(C['wall']), hex_rgb(C['wall2']), rng.random() * 0.6)
            zm = z + (z1 - z) * 0.22
            v = [b.bm.verts.new(p) for p in ((ax, yy + nrm * 0.026, zm), (bx, yy + nrm * 0.026, zm), (bx, yy + nrm * 0.008, z1), (ax, yy + nrm * 0.008, z1))]
            b.face(v, (0, nrm, 0.3))
            b._paint(v, col)
            vb = [b.bm.verts.new(p) for p in ((ax, yy + nrm * 0.032, z), (bx, yy + nrm * 0.032, z), (bx, yy + nrm * 0.026, zm), (ax, yy + nrm * 0.026, zm))]
            b.face(vb, (0, nrm, 0.3))
            b._paint(vb, mix(col, hex_rgb('#8a7458'), 0.55))
            # the shadowed lip under each board
            v2 = [b.bm.verts.new(p) for p in ((ax, yy + nrm * 0.008, z), (bx, yy + nrm * 0.008, z), (bx, yy + nrm * 0.032, z), (ax, yy + nrm * 0.032, z))]
            b.face(v2, (0, 0, -1))
            b._paint(v2, mix(col, (0.3, 0.25, 0.2, 1), 0.5))
            z = z1
    for xx, nrm in ((x0, -1), (x1, 1)):
        z = FOOT
        while z < H + RISE - 0.05:
            z1 = z + bh
            # the gable narrows as it rises
            half = D / 2 if z1 <= H else max(0.02, D / 2 * (1 - (z1 - H) / RISE))
            half0 = D / 2 if z <= H else max(0.02, D / 2 * (1 - (z - H) / RISE))
            ya, yb = -min(half, half0) + (0.1 if z1 <= H else 0), min(half, half0) - (0.1 if z1 <= H else 0)
            col = mix(hex_rgb(C['wall']), hex_rgb(C['wall2']), rng.random() * 0.6)
            v = [b.bm.verts.new(p) for p in ((xx + nrm * 0.032, ya, z), (xx + nrm * 0.032, yb, z), (xx + nrm * 0.008, yb, z1), (xx + nrm * 0.008, ya, z1))]
            b.face(v, (nrm, 0, 0.3))
            b._paint(v, col)
            z = z1
    # fish-scale shingles: rows up each slope, each shingle a rounded tab, lighter and darker reds
    y_e, z_e = roof_planes()
    T = 0.09
    slope_len = math.hypot(y_e, H + RISE - z_e)
    rows = int(slope_len / 0.105)
    for s in (-1, 1):
        for r in range(rows):
            t0 = r / rows
            ty = s * y_e * (1 - t0)
            tz = z_e + (H + RISE - z_e) * t0 + T + 0.006
            # down-slope direction and the roof's normal
            dn = Vector((0, s * y_e, z_e - (H + RISE))).normalized()
            nm = Vector((0, s * (H + RISE - z_e), y_e)).normalized()
            off = 0.0 if r % 2 == 0 else 0.085
            x = x0 - RAKE + 0.02 - off
            while x < x1 + RAKE - 0.02:
                w = 0.17
                xa, xb = max(x0 - RAKE + 0.01, x), min(x1 + RAKE - 0.01, x + w)
                if xb - xa > 0.03:
                    tone = rng.random()
                    col = mix(hex_rgb(C['roof3']), hex_rgb(C['roof']), min(1, tone * 1.6)) if tone < 0.6 else mix(hex_rgb(C['roof']), hex_rgb(C['roof2']), (tone - 0.6) * 2.5)
                    lift = rng.uniform(0.0, 0.012)
                    base = Vector(((xa + xb) / 2, ty, tz))
                    # a tab: straight top, round bottom (half circle), tipped out at the bottom
                    pts = []
                    hw = (xb - xa) / 2
                    L = 0.15
                    pts.append(base + Vector((-hw, 0, 0)) - dn * 0.02)
                    pts.append(base + Vector((hw, 0, 0)) - dn * 0.02)
                    for k in range(9):
                        a = k / 8 * math.pi
                        px = math.cos(a) * hw
                        py = L - hw + math.sin(a) * hw * 0.95
                        pts.append(base + Vector((px, 0, 0)) + dn * py + nm * (0.012 + lift) * (py / L))
                    v = [b.bm.verts.new(p) for p in pts]
                    ring = [v[0]] + [v[1]] + v[2:]
                    try:
                        b.face(ring, nm)
                    except ValueError:
                        pass
                    b._paint(v, col)
                x += 0.17
    # bricks on the chimney's faces
    cx, cy = 0.95, 0.42
    z = H + 0.5
    row = 0
    while z < H + RISE + 0.5:
        for face in range(4):
            off = 0.06 if row % 2 else 0
            u = -0.22 - off
            while u < 0.22:
                ua, ub = max(-0.22, u + 0.008), min(0.22, u + 0.12 - 0.008)
                if ub - ua > 0.02:
                    col = mix(hex_rgb(C['brick2']), hex_rgb(C['brick']), rng.random())
                    za, zb = z + 0.008, z + 0.065 - 0.008
                    if face == 0:
                        pts = [(cx + ua, cy - 0.232, za), (cx + ub, cy - 0.232, za), (cx + ub, cy - 0.232, zb), (cx + ua, cy - 0.232, zb)]
                    elif face == 1:
                        pts = [(cx + 0.232, cy + ua, za), (cx + 0.232, cy + ub, za), (cx + 0.232, cy + ub, zb), (cx + 0.232, cy + ua, zb)]
                    elif face == 2:
                        pts = [(cx - ua, cy + 0.232, za), (cx - ub, cy + 0.232, za), (cx - ub, cy + 0.232, zb), (cx - ua, cy + 0.232, zb)]
                    else:
                        pts = [(cx - 0.232, cy - ua, za), (cx - 0.232, cy - ub, za), (cx - 0.232, cy - ub, zb), (cx - 0.232, cy - ua, zb)]
                    b.poly(pts, col, out=((0, -1, 0), (1, 0, 0), (0, 1, 0), (-1, 0, 0))[face])
                u += 0.12
        z += 0.065
        row += 1
    # the door: four raised panels, a brass knob, a wreath with berries and a bow
    fy = y0 - 0.072
    for (pa, pb, qa, qb) in ((-0.27, -0.04, 0.32, 0.86), (0.04, 0.27, 0.32, 0.86), (-0.27, -0.04, 0.98, 1.4), (0.04, 0.27, 0.98, 1.4)):
        b.box(pa, fy - 0.012, FOOT + qa, pb, fy + 0.005, FOOT + qb, mix(hex_rgb(C['door']), (1, 1, 1, 1), 0.06))
    b.box(0.22, fy - 0.045, FOOT + 0.7, 0.27, fy, FOOT + 0.75, 'knob')
    wz, wr = FOOT + 1.16, 0.17
    for k in range(26):
        a = k / 26 * math.tau
        px, pz = math.cos(a) * wr, wz + math.sin(a) * wr
        s2 = 0.05 + rng.random() * 0.02
        b.box(px - s2, fy - 0.07, pz - s2, px + s2, fy - 0.02, pz + s2, mix(hex_rgb(C['wreath']), hex_rgb('#5a9a4a'), rng.random()))
        if k % 3 == 0:
            b.box(px - 0.018, fy - 0.085, pz - 0.018, px + 0.018, fy - 0.06, pz + 0.018, 'berry')
    b.box(-0.05, fy - 0.09, wz - wr - 0.04, 0.05, fy - 0.06, wz - wr + 0.04, 'berry')
    # windows: muntins (a cross), curtains drawn to the sides behind the glass
    gy = y0 - 0.058
    for wx in (-WIN_X, WIN_X):
        b.box(wx - 0.02, gy - 0.012, WIN_Z, wx + 0.02, gy, WIN_Z + WIN_H, 'trim')
        b.box(wx - WIN_W / 2, gy - 0.012, WIN_Z + WIN_H / 2 - 0.02, wx + WIN_W / 2, gy, WIN_Z + WIN_H / 2 + 0.02, 'trim')
        # shutter slats
        for s in (-1, 1):
            sx = wx + s * (WIN_W / 2 + 0.07 + 0.15)
            z = WIN_Z
            while z < WIN_Z + WIN_H - 0.02:
                b.box(sx - 0.11, y0 - 0.075, z, sx + 0.11, y0 - 0.06, z + 0.035, mix(hex_rgb(C['shutter']), (0.0, 0.05, 0.02, 1), 0.3))
                z += 0.07
    # stones in the footing
    x = x0 - 0.03
    while x < x1 + 0.03:
        w = rng.uniform(0.18, 0.32)
        b.box(x + 0.012, y0 - 0.045, 0.02, min(x1 + 0.03, x + w) - 0.012, y0 - 0.03, FOOT - 0.02, mix(hex_rgb('#8a847a'), hex_rgb('#b0a99c'), rng.random()))
        x += w


def glass_detail(b, rng):
    """What shows in the windows (baked onto the glass): curtains drawn to the sides, a light sky reflection."""
    gy = -D / 2 - 0.056
    for wx in (-WIN_X, WIN_X):
        for s in (-1, 1):
            cx0 = wx + s * (WIN_W / 2 - 0.0)
            cx1 = wx + s * (WIN_W / 2 - 0.2)
            pts = [(min(cx0, cx1), gy, WIN_Z), (max(cx0, cx1), gy, WIN_Z), (max(cx0, cx1), gy, WIN_Z + WIN_H), (min(cx0, cx1), gy, WIN_Z + WIN_H)]
            b.poly(pts, 'curtain', out=(0, -1, 0))
        # a pale streak of reflected sky
        b.poly([(wx - 0.1, gy - 0.004, WIN_Z + 0.36), (wx + 0.05, gy - 0.004, WIN_Z + 0.6), (wx + 0.12, gy - 0.004, WIN_Z + 0.6), (wx - 0.03, gy - 0.004, WIN_Z + 0.36)], '#7f97a6', out=(0, -1, 0))


def textured_material(name):
    """The high cottage's look: each element's color with a fine grain (wood, stone, shingle)."""
    m = material(name, vcol='Col', rough=0.85)
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    vc = [n for n in nt.nodes if n.bl_idname == 'ShaderNodeVertexColor'][0]
    tc = nt.nodes.new('ShaderNodeTexCoord')
    nz = nt.nodes.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = 60
    nz.inputs['Detail'].default_value = 4
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['From Min'].default_value, mr.inputs['From Max'].default_value = 0.3, 0.7
    mr.inputs['To Min'].default_value, mr.inputs['To Max'].default_value = 0.9, 1.06
    nt.links.new(nz.outputs['Fac'], mr.inputs['Value'])
    mul = nt.nodes.new('ShaderNodeVectorMath')
    mul.operation = 'SCALE'
    nt.links.new(vc.outputs['Color'], mul.inputs[0])
    nt.links.new(mr.outputs['Result'], mul.inputs['Scale'])
    nt.links.new(mul.outputs['Vector'], bsdf.inputs['Base Color'])
    bump = nt.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.25
    nt.links.new(nz.outputs['Fac'], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    return m


def build(tex=2048):
    rng = random.Random(7)
    # the high cottage
    hb = Builder(rng)
    shell(hb, low=False)
    hb.fix(list(hb.bm.faces))
    details(hb, rng)
    glass_quads(hb)
    glass_detail(hb, rng)
    hi = hb.obj('cottage_high')
    hi.data.materials.append(textured_material('cottage_high'))
    # the game's cottage: the shell, the glass its own material (index 1)
    lb = Builder(random.Random(7))
    shell(lb)
    glass_quads(lb, mat=1, inset=0.0)
    lo = lb.obj('cottage', fix=True)
    lo.data.materials.append(material('cottage_mat'))
    lo.data.materials.append(material('cottage_glass'))
    smart_uv(lo, margin=0.003, angle=60)
    # (the cage reaches past the wreath, the furthest thing standing out of a surface the game's cottage keeps)
    diff = bake(lo, 'DIFFUSE', tex, high=hi, extrusion=0.1, max_dist=0.18, samples=4)
    ao = bake(lo, 'AO', tex, high=hi, extrusion=0.1, max_dist=0.18, samples=64)
    nrm = bake(lo, 'NORMAL', tex, high=hi, extrusion=0.1, max_dist=0.18, samples=4)
    a = image_array(diff)
    o = image_array(ao)[..., :1]
    a[..., :3] *= (0.42 + 0.58 * o ** 1.2)
    col = image_from_array('cottage_col', a)
    lo.data.materials.clear()
    lo.data.materials.append(material('cottage_mat', image=col, normal=nrm, rough=0.85))
    lo.data.materials.append(material('cottage_glass', image=col, rough=1.0))
    hi.hide_render = True
    return hi, lo, col, nrm


def preview(path, objs):
    ground_plane()
    person(x=1.3, y=-2.2)
    light_rig()
    camera((0, -0.4, 1.5), dist=8.2)
    render(path, size=(900, 700), samples=64)


if __name__ == '__main__':
    args = sys.argv[1:]
    prev = args[args.index('--preview') + 1] if '--preview' in args else None
    reset()
    hi, lo, col, nrm = build()
    export([lo], 'cottage')
    if prev:
        preview(os.path.join(prev, 'cottage.png'), [lo])
        lo.hide_render = True
        hi.hide_render = False
        render(os.path.join(prev, 'cottage_high.png'), size=(900, 700), samples=48)
    print('built cottage')
