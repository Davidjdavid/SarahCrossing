"""The island's other buildings as dollhouse pieces, after their pictures in the game: the post office, the bank and the
town hall on the square, the museum, Clementine's boutique, Floss & Gloss, Sully's studio, Waffle's displays, Mac's
restaurant, the arcade, the club, Ginger's workshop, the lighthouse, the barn and Mugsy's café. Each is a finished piece (its colors
are its own), built from the kit: walls with corner boards and a frieze, framed windows with flower boxes, doors, roofs
of shingle courses (gable, hipped, mansard, gambrel), columns and pediments, awnings, neon, its name on its sign.
A part named *_glow (neon) is drawn unlit; *_glass glows at night.

Units are tiles; the model's middle is its footprint's middle (scripts/island/plan.mjs) with the front wall a little
behind the footprint's front edge, the front toward -y, the door at x 0 unless the plan puts it elsewhere (DOOR_X).
A row of tiles is 1.25 deep in the game, so a 3-row footprint has 3.75 of depth to stand in.

    python tools/blender/buildings.py [--preview DIR] [--each DIR] [--only NAME]
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from mathutils import Vector, Matrix, Euler, noise
from common import *
from trees_ac import MB, vmat, rgb
from kit import col_fn, shade, rbox, lathe, cyl, ball, tube, slab, plank_row, xform, rot, flame
import kit
kit.DETAIL['lite'] = True

STONE = '#c8c0b2'
T = 0.08              # a roof's thickness

# where the door is, from the footprint's middle (the plan's door column + 0.5 - w / 2)
DOOR_X = {'postoffice': 0, 'bank': 0, 'townhall': 0, 'museum': 0, 'boutique': 0.5, 'salon': 0.5, 'studio': 0, 'displays': 0,
          'restaurant': 0, 'arcade': 0, 'club': 0.5, 'builder': 0, 'lighthouse': 0, 'barn': 0, 'cafe': 0.5}


# ---------------------------------------------------------------- pieces
def panel(mb, pts, t, fn, up):
    """A flat board over the outline pts (3 or 4 points), t thick toward up."""
    q = [Vector(p) for p in pts]
    up = Vector(up).normalized()
    top = [p + up * t for p in q]
    n = len(q)
    c0, c1 = sum(q, Vector()) / n, sum(top, Vector()) / n
    mb.add([c1] + top, [fn(p, up) for p in [c1] + top], [up] * (n + 1), [(0, 1 + k, 1 + (k + 1) % n) for k in range(n)])
    mb.add([c0] + q, [fn(p, -up) for p in [c0] + q], [-up] * (n + 1), [(0, 1 + (k + 1) % n, 1 + k) for k in range(n)])
    for i in range(n):
        j = (i + 1) % n
        e = q[j] - q[i]
        if e.length < 1e-6:
            continue
        side = e.cross(up).normalized()
        if side.dot(q[i] - c0) < 0:
            side = -side
        p4 = [q[i], q[j], top[j], top[i]]
        mb.add(p4, [fn(p, side) for p in p4], [side] * 4, [(0, 1, 2), (0, 2, 3)])


def courses(mb, A, B, C, Dd, up, rows, fn, scallop=None, rng=None):
    """Shingle courses over a sloping panel (A, B along the eave; Dd, C at the top, C == Dd for a hip's triangle), each
    course a shade lighter or darker; scallop (a color) hangs rounded shingle ends along each course's edge."""
    up = Vector(up).normalized()
    rng = rng or random.Random(3)
    for r in range(rows):
        t0, t1 = r / rows, min(1.0, (r + 1.3) / rows)
        a0, b0, a1, b1 = A.lerp(Dd, t0), B.lerp(C, t0), A.lerp(Dd, t1), B.lerp(C, t1)
        k = 0.8 + 0.2 * (r % 2) + rng.uniform(-0.03, 0.03)
        lv = up * (T + 0.006 + 0.01 * (r % 2))
        panel(mb, [a0 + lv, b0 + lv, b1 + lv, a1 + lv], 0.016, lambda p, n, k=k: fn(p, n) * k, up)
        if scallop and (b0 - a0).length > 0.2:
            m = max(2, int((b0 - a0).length / 0.17))
            for i in range(m):
                p = a0.lerp(b0, (i + 0.5) / m) + lv + up * 0.02
                d = (b0 - a0).normalized()
                s = (b0 - a0).length / m * 0.5
                bl = len(mb.v)
                ball(mb, (0, 0, 0), (s, 0.06, 0.016), lambda q, n, k=k: shade(scallop)(q, n) * (0.9 + 0.12 * (r % 2)), sub=1)
                slope = (Dd - A).normalized()
                xform(mb, bl, Matrix.Translation(p) @ Matrix((d, slope, up)).transposed().to_4x4())


def walls(mb, W, D, H, c, trim='#f4f0e6', mottle=0.03, grain=None, frieze=True, corners=True):
    rbox(mb, -W / 2, -D / 2, 0.12, W / 2, D / 2, H, col_fn(c, mottle=mottle, grain=grain, under=0.12), r=0.03, mid=4)
    rbox(mb, -W / 2 - 0.05, -D / 2 - 0.05, 0, W / 2 + 0.05, D / 2 + 0.05, 0.14, col_fn(STONE, mottle=0.1), r=0.02)
    if frieze:
        rbox(mb, -W / 2 - 0.03, -D / 2 - 0.04, H - 0.14, W / 2 + 0.03, D / 2 + 0.04, H, shade(trim), r=0.015)
    if corners:
        for x in (-W / 2 - 0.035, W / 2 - 0.085):
            for y in (-D / 2 - 0.035, D / 2 - 0.085):
                rbox(mb, x, y, 0.14, x + 0.12, y + 0.12, H - 0.12, shade(trim), r=0.012)


def door(mb, glass, x, y0, w, h, c, frame='#f4f0e6', double=False, pane=True, step=True):
    rbox(mb, x - w / 2 - 0.08, y0 - 0.05, 0.12, x + w / 2 + 0.08, y0 + 0.01, 0.12 + h + 0.09, shade(frame), r=0.015)
    if double:
        for s in (-1, 1):
            a, b = (x + 0.005, x + w / 2) if s > 0 else (x - w / 2, x - 0.005)
            rbox(mb, a, y0 - 0.065, 0.12, b, y0 - 0.025, 0.12 + h, col_fn(c, grain='z'), r=0.015)
            rbox(mb, a + 0.06, y0 - 0.075, 0.25, b - 0.06, y0 - 0.06, 0.12 + h * 0.45, shade(c), r=0.01)
            rbox(mb, a + 0.06, y0 - 0.075, 0.12 + h * 0.52, b - 0.06, y0 - 0.06, 0.12 + h - 0.12, shade(c), r=0.01)
            ball(mb, (x + s * 0.06, y0 - 0.08, 0.12 + h * 0.48), 0.025, shade('#e8c050'), sub=1)
    else:
        rbox(mb, x - w / 2, y0 - 0.065, 0.12, x + w / 2, y0 - 0.025, 0.12 + h, col_fn(c, grain='z'), r=0.015)
        rbox(mb, x - w / 2 + 0.08, y0 - 0.075, 0.24, x + w / 2 - 0.08, y0 - 0.06, 0.12 + h * 0.48, shade(c), r=0.01)
        ball(mb, (x + w / 2 - 0.09, y0 - 0.085, 0.12 + h * 0.5), 0.026, shade('#e8c050'), sub=1)
        if pane:
            rbox(glass, x - w / 2 + 0.1, y0 - 0.075, 0.12 + h * 0.58, x + w / 2 - 0.1, y0 - 0.06, 0.12 + h - 0.1, col_fn('#a8d4e8', under=0.0), r=0.008)
    if step:
        rbox(mb, x - w / 2 - 0.15, y0 - 0.4, 0, x + w / 2 + 0.15, y0 - 0.02, 0.1, col_fn(STONE, mottle=0.08), r=0.03)


def window(mb, glass, x, z, w, h, y0, frame='#f4f0e6', panes=(2, 2), sill=True, tint='#a8d4e8', box=None, arch=False):
    rbox(mb, x - w / 2 - 0.06, y0 - 0.045, z - 0.06, x + w / 2 + 0.06, y0 + 0.01, z + h + 0.06, shade(frame), r=0.015)
    if arch:
        m = len(mb.v)
        slab(mb, [(math.cos(a) * (w / 2 + 0.06), math.sin(a) * (w / 2 + 0.06)) for a in [k / 10 * math.pi for k in range(11)]], 0.055, shade(frame), axis='y', at=-0.045)
        xform(mb, m, Matrix.Translation((x, y0, z + h)))
        m = len(glass.v)
        slab(glass, [(math.cos(a) * w / 2, math.sin(a) * w / 2) for a in [k / 10 * math.pi for k in range(11)]], 0.015, col_fn(tint, under=0.0), axis='y', at=-0.05)
        xform(glass, m, Matrix.Translation((x, y0, z + h)))
    if sill:
        rbox(mb, x - w / 2 - 0.1, y0 - 0.1, z - 0.1, x + w / 2 + 0.1, y0 + 0.01, z - 0.05, shade(frame), r=0.012)
    rbox(glass, x - w / 2, y0 - 0.05, z, x + w / 2, y0 - 0.035, z + h, col_fn(tint, under=0.0), r=0.004)
    for k in range(1, panes[0]):
        xx = x - w / 2 + k * w / panes[0]
        rbox(mb, xx - 0.014, y0 - 0.06, z, xx + 0.014, y0 - 0.045, z + h, shade(frame), r=0.004)
    for k in range(1, panes[1]):
        zz = z + k * h / panes[1]
        rbox(mb, x - w / 2, y0 - 0.06, zz - 0.014, x + w / 2, y0 - 0.045, zz + 0.014, shade(frame), r=0.004)
    if box:
        flowerbox(mb, x, y0, z - 0.06, w + 0.16, box)


def flowerbox(mb, x, y0, z, w, colors, seed=0):
    rng = random.Random(int(x * 100) + seed)
    rbox(mb, x - w / 2, y0 - 0.22, z - 0.16, x + w / 2, y0 - 0.02, z, col_fn(colors[0], grain='x'), r=0.015)
    n = max(3, int(w / 0.11))
    for k in range(n):
        xx = x - w / 2 + 0.06 + k * (w - 0.12) / (n - 1)
        ball(mb, (xx, y0 - 0.12 + rng.uniform(-0.04, 0.04), z + 0.03), (0.075, 0.07, 0.06), shade('#4f9a3c' if k % 2 else '#5fae46'), sub=1)
        if k % 2 == 0 or rng.random() < 0.4:
            ball(mb, (xx + rng.uniform(-0.03, 0.03), y0 - 0.16 + rng.uniform(-0.03, 0.03), z + 0.09), 0.04, shade(rng.choice(colors[1:])), sub=1)


def rake(mb, a, b, c, r=0.035):
    tube(mb, [a, b], r, shade(c), seg=8)


def gable_roof(mb, W, D, H, rise, c, over=0.22, rows=7, ridge='x', trim='#f4f0e6', wall=None, scallop=None):
    """A gable roof over the walls (ridge along x or y), its gable ends filled with wall, trim along the rakes."""
    f = col_fn(c, under=0.0)
    half = D / 2 if ridge == 'x' else W / 2
    ze = H - over * rise / half
    X, Y = W / 2 + over, D / 2 + over
    if ridge == 'x':
        sides = [(Vector((-X, s * Y, ze)), Vector((X, s * Y, ze)), Vector((X, 0, H + rise)), Vector((-X, 0, H + rise))) for s in (-1, 1)]
    else:
        sides = [(Vector((s * X, -Y, ze)), Vector((s * X, Y, ze)), Vector((0, Y, H + rise)), Vector((0, -Y, H + rise))) for s in (-1, 1)]
    for A, B, C, Dd in sides:
        up = (B - A).cross(Dd - A).normalized()
        if up.z < 0:
            up = -up
        panel(mb, [A, B, C, Dd], T, f, up)
        courses(mb, A, B, C, Dd, up, rows, f, scallop=scallop)
    wallc = col_fn(wall or '#f0e8d8')
    if ridge == 'x':
        rbox(mb, -X, -0.07, H + rise + T - 0.02, X, 0.07, H + rise + T + 0.07, col_fn(c), r=0.03)
        for x in (-W / 2, W / 2):
            slab(mb, [(-D / 2 + 0.02, H - 0.01), (D / 2 - 0.02, H - 0.01), (0.0, H + rise - 0.03)], 0.04, wallc, axis='x', at=x - (0.04 if x < 0 else 0))
            xx = -X - 0.02 if x < 0 else X + 0.02
            for s in (-1, 1):
                rake(mb, (xx, s * Y, ze - 0.02), (xx, 0, H + rise + 0.02), trim)
        for s in (-1, 1):
            rbox(mb, -X, s * Y - 0.035, ze - 0.11, X, s * Y + 0.035, ze + 0.02, shade(trim), r=0.015)
    else:
        rbox(mb, -0.07, -Y, H + rise + T - 0.02, 0.07, Y, H + rise + T + 0.07, col_fn(c), r=0.03)
        for y in (-D / 2, D / 2):
            slab(mb, [(-W / 2 + 0.02, H - 0.01), (W / 2 - 0.02, H - 0.01), (0.0, H + rise - 0.03)], 0.04, wallc, axis='y', at=y - (0.0 if y < 0 else 0.04))
            yy = -Y - 0.02 if y < 0 else Y + 0.02
            for s in (-1, 1):
                rake(mb, (s * X, yy, ze - 0.02), (0, yy, H + rise + 0.02), trim)
        for s in (-1, 1):
            rbox(mb, s * X - 0.035, -Y, ze - 0.11, s * X + 0.035, Y, ze + 0.02, shade(trim), r=0.015)


def hip_roof(mb, W, D, H, rise, c, over=0.2, rows=6, top=None, trim='#f4f0e6', scallop=None, cap=None, deck='#b8b4ac'):
    """A hipped roof (top None: up to a ridge) or a mansard (top = (w, d): steep sides up to a flat deck)."""
    f = col_fn(c, under=0.0)
    X, Y = W / 2 + over, D / 2 + over
    ze, zt = H - over * 0.5, H + rise
    tx, ty = (top[0] / 2, top[1] / 2) if top else (max(0.0, (W - D) / 2), 0.0)
    E = [(-X, -Y), (X, -Y), (X, Y), (-X, Y)]
    Tp = [(-tx, -ty), (tx, -ty), (tx, ty), (-tx, ty)]
    for i in range(4):
        j = (i + 1) % 4
        A, B = Vector((*E[i], ze)), Vector((*E[j], ze))
        C, Dd = Vector((*Tp[j], zt)), Vector((*Tp[i], zt))
        up = (B - A).cross(Dd - A)
        if up.length < 1e-6:
            up = (B - A).cross(C - A)
        up = up.normalized()
        if up.z < 0:
            up = -up
        pts = [A, B, C] if (C - Dd).length < 1e-6 else [A, B, C, Dd]
        panel(mb, pts, T, f, up)
        courses(mb, A, B, C, Dd, up, rows, f, scallop=scallop)
        rake(mb, A + up * (T + 0.03), Dd + up * (T + 0.03), cap or c, r=0.04)
        rbox(mb, min(A.x, B.x) - 0.035, min(A.y, B.y) - 0.035, ze - 0.11, max(A.x, B.x) + 0.035, max(A.y, B.y) + 0.035, ze + 0.02, shade(trim), r=0.015)
    if top:
        rbox(mb, -tx - 0.04, -ty - 0.04, zt - 0.02, tx + 0.04, ty + 0.04, zt + 0.06, shade(trim), r=0.02)
        rbox(mb, -tx, -ty, zt, tx, ty, zt + 0.07, col_fn(deck, mottle=0.05), r=0.01)
    elif tx > 0:
        rbox(mb, -tx - 0.05, -0.07, zt + T - 0.02, tx + 0.05, 0.07, zt + T + 0.07, col_fn(cap or c), r=0.03)


def flat_roof(mb, W, D, H, c, trim='#f4f0e6', deck='#a8a49c', parapet=0.22):
    rbox(mb, -W / 2 - 0.1, -D / 2 - 0.1, H - 0.02, W / 2 + 0.1, D / 2 + 0.1, H + 0.12, shade(trim), r=0.03)
    # the parapet: a low wall round the edge, capped, the deck sunk inside it
    X, Y, t = W / 2 + 0.06, D / 2 + 0.06, 0.12
    for x0, y0, x1, y1 in ((-X, -Y, X, -Y + t), (-X, Y - t, X, Y), (-X, -Y, -X + t, Y), (X - t, -Y, X, Y)):
        rbox(mb, x0, y0, H + 0.1, x1, y1, H + parapet, col_fn(c), r=0.02)
        rbox(mb, x0 - (0.04 if x0 <= -X else 0), y0 - (0.04 if y0 <= -Y else 0), H + parapet, x1 + (0.04 if x1 >= X else 0), y1 + (0.04 if y1 >= Y else 0),
             H + parapet + 0.05, shade(trim), r=0.015)
    rbox(mb, -X + t - 0.01, -Y + t - 0.01, H + 0.08, X - t + 0.01, Y - t + 0.01, H + 0.13, col_fn(deck, mottle=0.08), r=0.01)


def awning(mb, x0, x1, y0, z, depth, c1, c2, drop=0.35):
    """A striped awning sloping out from the wall, its edge in scallops."""
    A, B = rgb(c1), rgb(c2)
    w = (x1 - x0)
    n = max(4, int(round(w / 0.24)))

    def st(p, nn):
        k = int(math.floor((p.x - x0) / (w / n)))
        return (A if k % 2 == 0 else B) * (0.84 + 0.16 * abs(nn.z))
    m = len(mb.v)
    L = math.hypot(depth, drop)
    rbox(mb, x0, 0, -0.012, x1, L, 0.012, st, r=0.008, mid=max(6, n))
    xform(mb, m, Matrix.Translation((0, y0 - 0.01, z)) @ Euler((math.pi + math.atan2(drop, depth), 0, 0)).to_matrix().to_4x4())
    for k in range(n):
        xx = x0 + (k + 0.5) * w / n
        ball(mb, (xx, y0 - depth - 0.01, z - drop - 0.02), (w / n * 0.5, 0.014, 0.07), shade(c1 if k % 2 == 0 else c2), sub=2)
    for x in (x0 + 0.04, x1 - 0.04):
        tube(mb, [(x, y0 - 0.01, z - drop - 0.25), (x, y0 - depth, z - drop)], 0.012, shade('#3a3a3e'), seg=5)


def columns(mb, xs, y, z0, z1, r=0.11, c='#fbf8f0'):
    for x in xs:
        lathe(mb, [(r * 1.35, z0), (r * 1.35, z0 + 0.08), (r, z0 + 0.12), (r * 0.92, z1 - 0.12), (r * 1.3, z1 - 0.06), (r * 1.4, z1)], col_fn(c, under=0.05), c=(x, y, 0), seg=16)
        rbox(mb, x - r * 1.5, y - r * 1.5, z1 - 0.01, x + r * 1.5, y + r * 1.5, z1 + 0.05, shade(c), r=0.01)
        rbox(mb, x - r * 1.5, y - r * 1.5, z0 - 0.01, x + r * 1.5, y + r * 1.5, z0 + 0.05, shade(c), r=0.01)


def pediment(mb, W, y0, z, rise, c='#fbf8f0', depth=0.3, inner=None):
    slab(mb, [(-W / 2, z), (W / 2, z), (0.0, z + rise)], depth, col_fn(c), axis='y', at=y0 - depth)
    if inner:
        slab(mb, [(-W / 2 + 0.22, z + 0.1), (W / 2 - 0.22, z + 0.1), (0.0, z + rise - 0.1)], 0.02, shade(inner), axis='y', at=y0 - depth - 0.015)
    for s in (-1, 1):
        rake(mb, (s * (W / 2 + 0.06), y0 - depth - 0.02, z - 0.02), (0, y0 - depth - 0.02, z + rise + 0.04), c, r=0.05)
    rbox(mb, -W / 2 - 0.08, y0 - depth - 0.06, z - 0.12, W / 2 + 0.08, y0 + 0.02, z + 0.02, col_fn(c), r=0.02)


def text(word, x, y, z, size, color, depth=0.014, align='CENTER', glow=False):
    """Letters standing on a sign, facing the front (glow: neon, lit at night)."""
    bpy.ops.object.text_add(location=(x, y, z))
    t = bpy.context.active_object
    t.data.body = word
    t.data.size = size
    t.data.extrude = depth
    t.data.align_x = align
    t.data.align_y = 'CENTER'
    t.rotation_euler = (math.pi / 2, 0, 0)
    bpy.ops.object.convert(target='MESH')
    o = bpy.context.active_object
    me = o.data
    ca = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
    c = hex_rgb(color)
    for i in range(len(me.vertices)):
        ca.data[i].color = c
    me.materials.append(vmat(''.join(ch for ch in word.lower() if ch.isalnum()) + ('_letters_glow' if glow else '_letters'), rough=0.4))
    return o


def sign(mb, x, y0, z, w, h, c='#5a3a24', border='#e8c060'):
    rbox(mb, x - w / 2 - 0.05, y0 - 0.08, z - h / 2 - 0.05, x + w / 2 + 0.05, y0 - 0.02, z + h / 2 + 0.05, shade(border), r=0.025)
    rbox(mb, x - w / 2, y0 - 0.1, z - h / 2, x + w / 2, y0 - 0.06, z + h / 2, col_fn(c, grain='x'), r=0.018)


def lettered(mb, word, x, y0, z, size, color, c='#5a3a24', border='#e8c060', pad=0.3):
    """A sign wide enough for word, with the word on it."""
    sign(mb, x, y0, z, 0.62 * size * len(word) + pad, size * 1.55, c=c, border=border)
    return text(word, x, y0 - 0.115, z, size, color)


def bush_by(mb, x, y, r=0.22, c='#4f9a3c', flowers=None, seed=0, z=0.0):
    rng = random.Random(seed + int(x * 10))
    for k in range(5):
        a = k / 5 * math.tau + rng.random()
        ball(mb, (x + math.cos(a) * r * 0.5, y + math.sin(a) * r * 0.35, z + r * 0.75 + rng.uniform(-0.05, 0.05)), r * rng.uniform(0.62, 0.8), shade(c) if k % 2 else col_fn(c, mottle=0.12), sub=2)
    ball(mb, (x, y, z + r * 1.15), r * 0.7, col_fn(c, mottle=0.1), sub=2)
    if flowers:
        for k in range(7):
            a = rng.random() * math.tau
            ball(mb, (x + math.cos(a) * r * 0.6, y + math.sin(a) * r * 0.45 - 0.06, z + r * 0.9 + rng.uniform(0, 0.6) * r), 0.045, shade(rng.choice(flowers)), sub=1)


# ---------------------------------------------------------------- the buildings
def postoffice():
    mb, gl = MB(), MB()
    W, D, H = 4.4, 2.6, 2.0
    y0 = -D / 2
    walls(mb, W, D, H, '#f4ead6')
    gable_roof(mb, W, D, H, 0.95, '#cf4a3c', wall='#f4ead6')
    # the front gable over the door, the envelope in it
    m = len(mb.v)
    gable_roof(mb, 1.9, 1.3, H, 0.78, '#cf4a3c', over=0.18, rows=5, ridge='y', wall='#f4ead6')
    xform(mb, m, Matrix.Translation((0, y0 + 0.65 - 0.01, 0)))
    rbox(mb, -0.42, y0 - 0.08, H + 0.08, 0.42, y0 - 0.02, H + 0.52, shade('#6b5a4a'), r=0.02)
    rbox(mb, -0.37, y0 - 0.1, H + 0.12, 0.37, y0 - 0.06, H + 0.48, shade('#fbf6ea'), r=0.012)
    for s in (-1, 1):
        tube(mb, [(s * 0.35, y0 - 0.11, H + 0.46), (0, y0 - 0.11, H + 0.27)], 0.014, shade('#6b5a4a'), seg=5)
    rbox(mb, -0.06, y0 - 0.12, H + 0.24, 0.06, y0 - 0.1, H + 0.32, shade('#cf4a3c'), r=0.01)
    door(mb, gl, 0, y0, 0.66, 1.15, '#3d6fb6')
    for x in (-1.4, 1.4):
        window(mb, gl, x, 0.6, 0.66, 0.6, y0, box=('#8a5a34', '#f4f0e6', '#f7c8d8', '#e8443a'))
    letters = [lettered(mb, 'POST OFFICE', 0, y0, 1.62, 0.15, '#fbf6ea', c='#3d6fb6', border='#f4f0e6', pad=0.2)]
    # the red post box by the door, a parcel or two
    lathe(mb, [(0.0, 0.0), (0.14, 0.0), (0.14, 0.62), (0.11, 0.72), (0.0, 0.77)], col_fn('#d8433b'), c=(0.78, y0 - 0.4, 0), seg=18)
    rbox(mb, 0.7, y0 - 0.55, 0.5, 0.86, y0 - 0.53, 0.54, shade('#3b2a2a'), r=0.004)
    rbox(mb, -1.0, y0 - 0.55, 0, -0.68, y0 - 0.25, 0.26, col_fn('#c8945a', grain='x'), r=0.02)
    rbox(mb, -0.94, y0 - 0.5, 0.26, -0.74, y0 - 0.3, 0.42, col_fn('#d8a86a', grain='x'), r=0.02)
    tube(mb, [(-1.0, y0 - 0.4, 0.265), (-0.68, y0 - 0.4, 0.265)], 0.01, shade('#e8443a'), seg=4)
    return [(mb, 'main'), (gl, 'glass')], letters


def bank():
    mb, gl = MB(), MB()
    W, D, H = 4.4, 2.6, 1.9
    y0 = -D / 2
    walls(mb, W, D, H, '#e8e4dc', trim='#f8f4ea', mottle=0.05)
    # stone courses
    for z in (0.5, 0.88, 1.26):
        rbox(mb, -W / 2 - 0.005, y0 - 0.008, z, W / 2 + 0.005, y0 + 0.01, z + 0.02, shade('#d2ccbf'), r=0.004)
    hip_roof(mb, W, D, H + 0.04, 0.7, '#2f8f6b', rows=5, trim='#f8f4ea', cap='#277a5a')
    pediment(mb, 2.9, y0 - 0.3, H + 0.04, 0.66, inner='#e8e2d4')
    columns(mb, (-1.25, -0.6, 0.6, 1.25), y0 - 0.42, 0.14, H - 0.08)
    for k in range(2):
        rbox(mb, -1.6 + k * 0.08, y0 - 0.75 + k * 0.15, 0.0, 1.6 - k * 0.08, y0, 0.07 + k * 0.06, col_fn(STONE, mottle=0.06), r=0.015)
    door(mb, gl, 0, y0, 0.8, 1.25, '#6b4a2e', double=True, pane=False, step=False)
    # the gold coin in the pediment
    m = len(mb.v)
    lathe(mb, [(0.0, -0.03), (0.21, -0.03), (0.23, 0.0), (0.21, 0.035), (0.0, 0.035)], col_fn('#e9bd4f', under=0.0), seg=28, cap_top=False)
    lathe(mb, [(0.0, 0.036), (0.15, 0.036), (0.15, 0.045), (0.0, 0.045)], shade('#d8a838'), seg=28, cap_top=False)
    xform(mb, m, Matrix.Translation((0, y0 - 0.62, H + 0.3)) @ Euler((math.pi / 2, 0, 0)).to_matrix().to_4x4())
    for x in (-1.85, 1.85):
        window(mb, gl, x, 0.6, 0.38, 0.85, y0, panes=(1, 3), frame='#f8f4ea', arch=True)
    for x in (-1.85, 1.85):
        lathe(mb, [(0.0, 0.0), (0.16, 0.0), (0.2, 0.16), (0.17, 0.24), (0.0, 0.24)], col_fn('#d8d0c0'), c=(x, y0 - 0.45, 0), seg=14)
        bush_by(mb, x, y0 - 0.45, r=0.2, c='#3f8a3a', z=0.16)
    letters = [text('BANK', 0, y0 - 0.66, H - 0.03, 0.17, '#2f6b50')]
    return [(mb, 'main'), (gl, 'glass')], letters


def townhall():
    mb, gl = MB(), MB()
    W, D, H = 6.3, 3.3, 2.0
    y0 = -D / 2
    walls(mb, W, D, H, '#f3ecdf')
    gable_roof(mb, W, D, H, 0.9, '#4a63b5', rows=8, wall='#f3ecdf')
    # the clock tower in the middle, its own little gable to the front
    tw, td, ty = 1.5, 1.3, y0 - 0.3
    rbox(mb, -tw / 2, ty, H - 0.2, tw / 2, ty + td, H + 1.5, col_fn('#f3ecdf', mottle=0.03), r=0.03)
    rbox(mb, -tw / 2 - 0.04, ty - 0.04, H + 1.36, tw / 2 + 0.04, ty + td + 0.04, H + 1.5, shade('#f8f4ea'), r=0.015)
    for x in (-tw / 2 - 0.035, tw / 2 - 0.085):
        rbox(mb, x, ty - 0.035, H - 0.2, x + 0.12, ty + 0.085, H + 1.36, shade('#f8f4ea'), r=0.012)
    m = len(mb.v)
    gable_roof(mb, tw, td, H + 1.5, 0.55, '#384c90', over=0.14, rows=4, ridge='y', wall='#f3ecdf')
    xform(mb, m, Matrix.Translation((0, ty + td / 2, 0)))
    ball(mb, (0, ty - 0.1, H + 2.12), 0.05, shade('#e9bd4f'), sub=2)
    m = len(mb.v)
    lathe(mb, [(0.0, -0.03), (0.38, -0.03), (0.42, 0.0), (0.42, 0.04), (0.0, 0.04)], col_fn('#384c90', under=0.0), seg=32, cap_top=False)
    lathe(mb, [(0.0, 0.04), (0.34, 0.04), (0.34, 0.05), (0.0, 0.05)], shade('#ffffff'), seg=32, cap_top=False)
    xform(mb, m, Matrix.Translation((0, ty - 0.01, H + 0.88)) @ Euler((math.pi / 2, 0, 0)).to_matrix().to_4x4())
    for k in range(12):
        a = k / 12 * math.tau
        rbox(mb, math.cos(a) * 0.28 - 0.012, ty - 0.075, H + 0.88 + math.sin(a) * 0.28 - 0.012, math.cos(a) * 0.28 + 0.012, ty - 0.06, H + 0.88 + math.sin(a) * 0.28 + 0.012, shade('#384c90'), r=0.004)
    rbox(mb, -0.018, ty - 0.09, H + 0.87, 0.018, ty - 0.07, H + 1.11, shade('#3b2a2a'), r=0.006)
    rbox(mb, -0.018, ty - 0.1, H + 0.86, 0.17, ty - 0.08, H + 0.9, shade('#3b2a2a'), r=0.006)
    ball(mb, (0, ty - 0.1, H + 0.88), 0.03, shade('#e9bd4f'), sub=1)
    # the porch: columns under a frieze with the name, the steps
    columns(mb, (-2.3, -1.55, 1.55, 2.3), y0 - 0.38, 0.14, H - 0.12)
    rbox(mb, -2.6, y0 - 0.58, H - 0.14, 2.6, y0 + 0.02, H + 0.04, col_fn('#f8f4ea'), r=0.02)
    rbox(mb, -2.6, y0 - 0.58, H + 0.04, 2.6, y0 + 0.02, H + 0.09, shade('#384c90'), r=0.012)
    for k in range(2):
        rbox(mb, -2.6 + k * 0.08, y0 - 0.75 + k * 0.15, 0.0, 2.6 - k * 0.08, y0, 0.07 + k * 0.06, col_fn(STONE, mottle=0.06), r=0.015)
    door(mb, gl, 0, ty, 0.9, 1.35, '#6b4a2e', double=True, pane=False, step=False)
    for x in (-1.0, 1.0):
        window(mb, gl, x, 0.7, 0.44, 0.7, ty + 0.3, panes=(2, 2))
    for x in (-2.9, 2.9):
        window(mb, gl, x, 0.6, 0.36, 0.9, y0, panes=(1, 3), arch=True)
    # pink banners on the porch, flower beds before it
    for x in (-1.92, 1.92):
        rbox(mb, x - 0.13, y0 - 0.06, 0.85, x + 0.13, y0 - 0.03, 1.72, col_fn('#e0559a', under=0.0), r=0.01)
        slab(mb, [(x - 0.13, 0.85), (x + 0.13, 0.85), (x, 0.72)], 0.03, shade('#e0559a'), axis='y', at=y0 - 0.06)
        rbox(mb, x - 0.15, y0 - 0.07, 1.72, x + 0.15, y0 - 0.02, 1.78, shade('#e9bd4f'), r=0.01)
    for x in (-2.95, 2.95):
        bush_by(mb, x, y0 - 0.4, r=0.24, c='#4f9a3c', flowers=('#e0559a', '#f7c8d8', '#ffffff'), seed=3)
    letters = [text('TOWN HALL', 0, y0 - 0.6, H - 0.05, 0.15, '#384c90')]
    return [(mb, 'main'), (gl, 'glass')], letters


def museum():
    mb, gl = MB(), MB()
    W, D, H = 6.3, 3.3, 2.1
    y0 = -D / 2
    walls(mb, W, D, H, '#f2efe6', trim='#fbf8f0', mottle=0.04)
    for z in (0.55, 0.95, 1.35):
        rbox(mb, -W / 2 - 0.005, y0 - 0.008, z, W / 2 + 0.005, y0 + 0.01, z + 0.02, shade('#e2ddd0'), r=0.004)
    hip_roof(mb, W, D, H + 0.04, 0.85, '#6a7f9a', rows=6, trim='#fbf8f0', cap='#5a6e88')
    # a glass lantern on the ridge, lighting the halls
    rbox(gl, -0.7, -0.45, H + 0.75, 0.7, 0.45, H + 1.2, col_fn('#b8dcec', under=0.0), r=0.02)
    for x in (-0.7, -0.35, 0.0, 0.35, 0.7):
        rbox(mb, x - 0.025, -0.47, H + 0.75, x + 0.025, -0.43, H + 1.2, shade('#fbf8f0'), r=0.006)
    hip_roof(mb, 1.4, 0.9, H + 1.2, 0.3, '#6a7f9a', over=0.08, rows=2, trim='#fbf8f0', cap='#5a6e88')
    pediment(mb, 3.5, y0 - 0.34, H + 0.04, 0.8, inner='#e8e2d4')
    columns(mb, (-1.5, -0.75, 0.75, 1.5), y0 - 0.48, 0.18, H - 0.08, r=0.12)
    for k in range(3):
        rbox(mb, -1.95 + k * 0.08, y0 - 0.85 + k * 0.14, 0.0, 1.95 - k * 0.08, y0, 0.06 + k * 0.06, col_fn(STONE, mottle=0.06), r=0.015)
    door(mb, gl, 0, y0, 0.9, 1.4, '#6b4a2e', double=True, pane=False, step=False)
    for x, c in ((-2.45, '#d8333a'), (2.45, '#3a6ac8')):
        window(mb, gl, x, 0.65, 0.6, 0.95, y0, panes=(2, 3), tint='#b8dcec', arch=True, frame='#fbf8f0')
        rbox(mb, x - 0.2, y0 - 0.1, 0.55, x + 0.2, y0 - 0.07, 1.9, col_fn(c, under=0.0), r=0.012)
        slab(mb, [(x - 0.2, 0.55), (x + 0.2, 0.55), (x, 0.4)], 0.03, shade(c), axis='y', at=y0 - 0.1)
        rbox(mb, x - 0.24, y0 - 0.11, 1.9, x + 0.24, y0 - 0.05, 1.97, shade('#e9bd4f'), r=0.01)
        m = len(mb.v)
        ball(mb, (0, 0, 0), (0.1, 0.012, 0.05), shade('#fbf8f0'), sub=2)
        slab(mb, [(0.09, 0.0), (0.15, 0.05), (0.15, -0.05)], 0.012, shade('#fbf8f0'), axis='y', at=-0.006)
        xform(mb, m, Matrix.Translation((x, y0 - 0.12, 1.45)))
    # a fossil fish in the pediment
    m = len(mb.v)
    ball(mb, (0, 0, 0), (0.3, 0.03, 0.13), shade('#c8b890'), sub=2)
    slab(mb, [(0.28, 0.0), (0.46, 0.13), (0.46, -0.13)], 0.03, shade('#c8b890'), axis='y', at=-0.015)
    for k in range(5):
        rbox(mb, -0.15 + k * 0.08, -0.05, -0.1, -0.13 + k * 0.08, -0.03, 0.1, shade('#a89870'), r=0.006)
    ball(mb, (-0.18, -0.04, 0.03), 0.025, shade('#6a5a40'), sub=1)
    xform(mb, m, Matrix.Translation((0, y0 - 0.66, H + 0.38)))
    letters = [text('MUSEUM', 0, y0 - 0.71, H - 0.04, 0.16, '#6b5a3a')]
    return [(mb, 'main'), (gl, 'glass')], letters


def shopfront(W, D, H, wall, door_c, word, word_c, roof=('flat',), aw=None, deco=None, trim='#f4f0e6', door_x=0.0, mottle=0.03,
              grain=None, box=None, sign_c='#5a3a24', sign_b='#e8c060', wins=None):
    """A little shop: a body, a roof (flat with a parapet, gable, hip or mansard), an awning over its front, a door,
    windows, a sign with its name; deco adds the rest."""
    mb, gl = MB(), MB()
    y0 = -D / 2
    walls(mb, W, D, H, wall, trim=trim, mottle=mottle, grain=grain)
    kind = roof[0]
    if kind == 'flat':
        flat_roof(mb, W, D, H, wall, trim=trim)
    elif kind == 'gable':
        gable_roof(mb, W, D, H, roof[2], roof[1], wall=wall, trim=trim)
    elif kind == 'front':
        gable_roof(mb, W, D, H, roof[2], roof[1], wall=wall, trim=trim, ridge='y', rows=6)
    elif kind == 'hip':
        hip_roof(mb, W, D, H, roof[2], roof[1], trim=trim)
    elif kind == 'mansard':
        hip_roof(mb, W, D, H, roof[2], roof[1], top=(W - 1.9, D - 1.6), trim=trim, rows=5, scallop=roof[3] if len(roof) > 3 else None, deck=roof[3])
    if aw:
        awning(mb, -W / 2 - 0.02, W / 2 + 0.02, y0, H - 0.24, 0.6, aw[0], aw[1])
    door(mb, gl, door_x, y0, 0.62, 1.12, door_c, frame=trim)
    for x in (wins if wins is not None else (door_x - 1.2, door_x + 1.2)):
        if abs(x) < W / 2 - 0.35:
            window(mb, gl, x, 0.45, 0.78, 0.66, y0, frame=trim, panes=(3, 2), box=box)
    letters = []
    if word:
        if aw is not None:
            # a sign standing on the awning's edge
            letters.append(lettered(mb, word, door_x, y0 - 0.58, H - 0.26, 0.2, word_c, c=sign_c, border=sign_b))
        elif kind == 'front':
            letters.append(lettered(mb, word, door_x, y0, H + 0.32, 0.2, word_c, c=sign_c, border=sign_b))
        else:
            letters.append(lettered(mb, word, door_x, y0, H - 0.34, 0.2, word_c, c=sign_c, border=sign_b))
    out = [(mb, 'main'), (gl, 'glass')]
    if deco:
        out += deco(mb, gl, W, D, H, y0) or []
    return out, letters


def boutique():
    def deco(mb, gl, W, D, H, y0):
        # Clementine's orange on the roof, dresses in the window, a rail of clothes outside
        ball(mb, (0.0, 0.0, H + 1.22), 0.3, col_fn('#f08a1a', mottle=0.06, under=0.0))
        tube(mb, [(0.0, 0.0, H + 1.5), (0.03, 0.0, H + 1.6)], 0.025, shade('#5a3a20'), seg=5)
        m = len(mb.v)
        ball(mb, (0, 0, 0), (0.14, 0.05, 0.035), shade('#4a9a3a'), sub=2)
        xform(mb, m, Matrix.Translation((0.16, 0.0, H + 1.57)) @ Euler((0, -0.5, 0)).to_matrix().to_4x4())
        for x, c in ((-0.95, '#f4a0c0'), (-0.55, '#a0c8f4')):
            lathe(mb, [(0.0, 0.5), (0.13, 0.5), (0.08, 0.78), (0.06, 0.9), (0.0, 0.92)], shade(c), c=(x, y0 + 0.1, 0), seg=10)
        tube(mb, [(-1.85, y0 - 0.55, 0), (-1.85, y0 - 0.55, 0.9), (-1.0, y0 - 0.55, 0.9), (-1.0, y0 - 0.55, 0)], 0.018, shade('#c8a040'), seg=6)
        for k, c in enumerate(('#e8443a', '#f7c8d8', '#5a9ad8', '#f0c020', '#ffffff')):
            x = -1.75 + k * 0.17
            lathe(mb, [(0.0, 0.32), (0.09, 0.32), (0.06, 0.72), (0.0, 0.84)], shade(c), c=(x, y0 - 0.55, 0), seg=8, sx=0.5)
    return shopfront(3.5, 2.6, 1.75, '#fbeef0', '#3f8f45', "CLEMENTINE'S", '#fff4e4', roof=('mansard', '#f29ab8', 0.85, '#f6b4cc'),
                     aw=('#f7962d', '#fff4e4'), deco=deco, door_x=0.5, wins=(-0.75,), box=('#f4f0e6', '#f7962d', '#ffffff'),
                     sign_c='#e8742a', sign_b='#fff4e4')


def salon():
    def deco(mb, gl, W, D, H, y0):
        # a comb on the roof, the barber pole, a potted fern
        rbox(mb, -0.5, -0.05, H + 0.92, 0.5, 0.07, H + 1.1, shade('#f08ac0'), r=0.04)
        for k in range(10):
            rbox(mb, -0.45 + k * 0.1, -0.03, H + 1.1, -0.41 + k * 0.1, 0.05, H + 1.32, shade('#f08ac0'), r=0.012)

        def pole(p, n):
            a = math.atan2(p.y - (y0 - 0.2), p.x + 1.45) / math.tau
            return rgb('#e0405a') if int(math.floor(p.z * 7 + a * 2)) % 2 else rgb('#ffffff')
        lathe(mb, [(0.0, 0.45), (0.065, 0.45), (0.065, 1.25), (0.0, 1.25)], pole, c=(-1.45, y0 - 0.2, 0), seg=18)
        for z in (0.42, 1.25):
            lathe(mb, [(0.0, z), (0.08, z), (0.08, z + 0.04), (0.0, z + 0.04)], shade('#c8c0d0'), c=(-1.45, y0 - 0.2, 0), seg=14)
        ball(mb, (-1.45, y0 - 0.2, 1.33), 0.07, shade('#e8e0f0'))
        tube(mb, [(-1.45, y0 - 0.2, 0.45), (-1.45, y0 - 0.02, 0.45)], 0.015, shade('#c8c0d0'), seg=4)
        lathe(mb, [(0.0, 0.0), (0.14, 0.0), (0.17, 0.28), (0.0, 0.28)], col_fn('#f4ecfc'), c=(1.45, y0 - 0.4, 0), seg=14)
        bush_by(mb, 1.45, y0 - 0.4, r=0.18, c='#5aa846', flowers=('#c890f0', '#ffffff'), seed=2, z=0.2)
    return shopfront(3.5, 2.6, 1.75, '#e6d8f6', '#8a4ad8', 'FLOSS & GLOSS', '#fbf6ff', roof=('mansard', '#9a6ad8', 0.85, '#b48ae8'),
                     aw=('#a873e8', '#f4ecfc'), deco=deco, door_x=0.5, wins=(-0.75,), box=('#f4f0e6', '#c890f0', '#f7c8d8'),
                     sign_c='#8a4ad8', sign_b='#f4ecfc')


def studio():
    def deco(mb, gl, W, D, H, y0):
        # a paint palette by the sign, an easel with a painting out front
        m = len(mb.v)
        ball(mb, (0, 0, 0), (0.22, 0.02, 0.16), shade('#e8c890'), sub=2)
        for k, c in enumerate(('#e8443a', '#4a8ad8', '#f0c020', '#5aa844')):
            ball(mb, (-0.12 + k * 0.08, -0.02, 0.05 - (k % 2) * 0.07), 0.035, shade(c), sub=1)
        xform(mb, m, Matrix.Translation((1.7, y0 - 0.12, H - 0.32)))
        for s in (-1, 1):
            tube(mb, [(-1.4 + s * 0.22, y0 - 0.6, 0), (-1.4, y0 - 0.5, 1.0)], 0.018, shade('#8a5a34'), seg=5)
        tube(mb, [(-1.4, y0 - 0.25, 0), (-1.4, y0 - 0.48, 1.0)], 0.018, shade('#8a5a34'), seg=5)
        rbox(mb, -1.72, y0 - 0.62, 0.35, -1.08, y0 - 0.58, 0.39, shade('#8a5a34'), r=0.01)
        rbox(mb, -1.7, y0 - 0.61, 0.39, -1.1, y0 - 0.55, 0.9, shade('#fbf6ee'), r=0.012)
        ball(mb, (-1.5, y0 - 0.62, 0.72), (0.12, 0.01, 0.1), shade('#5a9ad8'), sub=1)
        ball(mb, (-1.3, y0 - 0.62, 0.55), (0.14, 0.01, 0.09), shade('#5aa846'), sub=1)
        ball(mb, (-1.25, y0 - 0.625, 0.78), 0.05, shade('#f0c020'), sub=1)
    return shopfront(4.4, 2.6, 1.85, '#d98a5a', '#3a5a8a', "SULLY'S STUDIO", '#fff0d8', roof=('front', '#a84a32', 1.05),
                     deco=deco, mottle=0.1, box=('#8a5a34', '#f0c020', '#e8443a', '#ffffff'))


def displays():
    def deco(mb, gl, W, D, H, y0):
        lathe(mb, [(0.0, 0.0), (0.13, 0.0), (0.16, 0.26), (0.17, 0.28), (0.0, 0.28)], col_fn('#c8643a'), c=(1.85, y0 - 0.4, 0), seg=14)
        bush_by(mb, 1.85, y0 - 0.4, r=0.2, c='#4a9a3c', seed=5, z=0.2)
        lathe(mb, [(0.0, 0.0), (0.035, 0.0), (0.025, 1.45), (0.0, 1.45)], shade('#2a2a2e'), c=(-1.95, y0 - 0.45, 0), seg=8)
        rbox(gl, -2.04, y0 - 0.54, 1.45, -1.86, y0 - 0.36, 1.66, col_fn('#ffe8a0', under=0.0), r=0.02)
        lathe(mb, [(0.0, 1.66), (0.14, 1.66), (0.0, 1.78)], shade('#2a2a2e'), c=(-1.95, y0 - 0.45, 0), seg=8)
        # a little table on show, and a waffle by the sign
        rbox(mb, 0.8, y0 - 0.85, 0.36, 1.3, y0 - 0.45, 0.4, col_fn('#c8945a', grain='x'), r=0.015)
        for x in (0.84, 1.26):
            for y in (y0 - 0.81, y0 - 0.49):
                rbox(mb, x - 0.02, y - 0.02, 0, x + 0.02, y + 0.02, 0.36, shade('#8a5a34'), r=0.008)
        m = len(mb.v)
        rbox(mb, -0.2, -0.02, -0.16, 0.2, 0.02, 0.16, shade('#e0a040'), r=0.04)
        for k in range(3):
            rbox(mb, -0.2, -0.03, -0.12 + k * 0.1, 0.2, -0.02, -0.1 + k * 0.1, shade('#b87a28'), r=0.004)
            rbox(mb, -0.14 + k * 0.12, -0.03, -0.16, -0.12 + k * 0.12, -0.02, 0.16, shade('#b87a28'), r=0.004)
        xform(mb, m, Matrix.Translation((1.45, y0 - 0.12, H - 0.42)))
    return shopfront(4.4, 2.6, 2.0, '#e8f4dc', '#3f7a4a', "WAFFLE'S", '#fffbe8', roof=('gable', '#3f8a3a', 0.72), aw=('#3f8a3a', '#f4f8ec'),
                     deco=deco, box=('#f4f0e6', '#f0c020', '#ffffff'), sign_c='#3f8a3a', sign_b='#fffbe8')


def restaurant():
    def deco(mb, gl, W, D, H, y0):
        # a chalkboard by the door, tables in the windows, a planter each side
        for s in (-1, 1):
            q = [(0.85 - 0.24, y0 - 0.6 + s * 0.16, 0.0), (0.85 + 0.24, y0 - 0.6 + s * 0.16, 0.0), (0.85 + 0.24, y0 - 0.6 + s * 0.02, 0.74), (0.85 - 0.24, y0 - 0.6 + s * 0.02, 0.74)]
            panel(mb, q, 0.03, col_fn('#8a5a34'), Vector((0, s, 0.25)))
        panel(mb, [(0.67, y0 - 0.79, 0.14), (1.03, y0 - 0.79, 0.14), (1.03, y0 - 0.64, 0.66), (0.67, y0 - 0.64, 0.66)], 0.035, shade('#2e3634'), Vector((0, -1, 0.25)))
        for k in range(3):
            z = 0.5 - k * 0.11
            panel(mb, [(0.72, y0 - 0.8, z), (0.98 - k * 0.04, y0 - 0.8, z), (0.98 - k * 0.04, y0 - 0.795, z + 0.02), (0.72, y0 - 0.795, z + 0.02)], 0.012, shade('#f4f0e6'), Vector((0, -1, 0.25)))
        for x in (-1.2, 1.2):
            rbox(mb, x - 0.22, y0 + 0.04, 0.5, x + 0.22, y0 + 0.22, 0.53, shade('#e8443a'), r=0.01)
            lathe(mb, [(0.0, 0.53), (0.04, 0.53), (0.03, 0.6), (0.0, 0.62)], shade('#ffe8a0'), c=(x, y0 + 0.13, 0), seg=8)
        for x in (-1.95, 1.95):
            rbox(mb, x - 0.2, y0 - 0.5, 0, x + 0.2, y0 - 0.15, 0.3, col_fn('#8a5a34', grain='x'), r=0.02)
            bush_by(mb, x, y0 - 0.33, r=0.17, c='#4f9a3c', flowers=('#e8443a', '#ffffff'), seed=7, z=0.22)
    return shopfront(4.4, 2.6, 2.0, '#fbf3e4', '#d8433b', "MAC'S", '#fff8e8', roof=('hip', '#2f7a4a', 0.8), aw=('#2f7a4a', '#f4f0e0'),
                     deco=deco, sign_c='#d8433b', sign_b='#fff8e8')


def neon_box(gl, x0, x1, z0, z1, y, c, r=0.02):
    for (a, b, c0, c1) in ((x0, x1, z0, z0 + r * 2), (x0, x1, z1 - r * 2, z1), (x0, x0 + r * 2, z0, z1), (x1 - r * 2, x1, z0, z1)):
        rbox(gl, a, y - 0.03, c0, b, y, c1, col_fn(c, under=0.0), r=r * 0.8)


def roof_box(mb, x, y, H, w=0.5, d=0.4, h=0.3):
    rbox(mb, x - w / 2, y - d / 2, H, x + w / 2, y + d / 2, H + h, col_fn('#b8bcc0', mottle=0.04), r=0.03)
    lathe(mb, [(0.0, H + h), (w * 0.3, H + h), (w * 0.3, H + h + 0.02), (0.0, H + h + 0.02)], shade('#5a5e64'), c=(x, y, 0), seg=14)


def arcade():
    mb, gl, neon = MB(), MB(), MB()
    W, D, H = 4.4, 2.6, 1.8
    y0 = -D / 2
    walls(mb, W, D, H, '#1e2448', trim='#2e3a70', mottle=0.04)
    flat_roof(mb, W, D, H, '#2a3060', trim='#4a5aa0', deck='#4a5068')
    rng = random.Random(8)
    for k in range(44):
        ball(neon, (-W / 2 - 0.05 + k * (W + 0.1) / 43, y0 - 0.11, H + 0.06), 0.028, shade(rng.choice(['#ff5ac8', '#5ae8ff', '#fff05a', '#8aff5a'])), sub=1)
    # the marquee on the roof: a board on legs, bulbs round its edge, the name in neon yellow
    for x in (-1.0, 1.0):
        rbox(mb, x - 0.04, y0 + 0.2, H + 0.12, x + 0.04, y0 + 0.28, H + 0.6, shade('#3a3e52'), r=0.01)
    rbox(mb, -1.35, y0 + 0.1, H + 0.55, 1.35, y0 + 0.2, H + 1.15, shade('#2a1e48'), r=0.04)
    per = 2 * (2.6 + 0.5)
    for k in range(26):
        p = k / 26 * per
        if p < 2.6:
            x, z = -1.3 + p, H + 0.6
        elif p < 3.1:
            x, z = 1.3, H + 0.6 + (p - 2.6)
        elif p < 5.7:
            x, z = 1.3 - (p - 3.1), H + 1.1
        else:
            x, z = -1.3, H + 1.1 - (p - 5.7)
        ball(neon, (x, y0 + 0.08, z), 0.032, shade('#fff8c0'), sub=1)
    door(mb, gl, 0, y0, 0.66, 1.15, '#2a3a70', frame='#4ae0f0')
    for x in (-1.4, 1.4):
        window(mb, gl, x, 0.55, 0.78, 0.62, y0, frame='#4ae0f0', panes=(1, 1), tint='#2a4a7a', sill=False)
        # arcade cabinets inside, their screens lit
        for dx, c in ((-0.2, '#ff5ac8'), (0.2, '#8aff5a')):
            rbox(mb, x + dx - 0.13, y0 - 0.056, 0.55, x + dx + 0.13, y0 - 0.051, 1.08, shade('#141830'), r=0.01)
            rbox(neon, x + dx - 0.09, y0 - 0.062, 0.8, x + dx + 0.09, y0 - 0.056, 0.98, shade(c), r=0.008)
            ball(neon, (x + dx - 0.04, y0 - 0.06, 0.72), 0.018, shade('#fff05a'), sub=1)
    # a neon frame over the door, a joystick and a star in neon by the windows
    neon_box(neon, -0.62, 0.62, 1.38, 1.7, y0 - 0.02, '#ff5ac8')
    tube(neon, [(1.4, y0 - 0.06, 1.3), (1.4, y0 - 0.06, 1.55)], 0.02, shade('#8aff5a'), seg=6)
    ball(neon, (1.4, y0 - 0.07, 1.58), 0.05, shade('#ff5a5a'), sub=2)
    rbox(neon, 1.25, y0 - 0.06, 1.24, 1.55, y0 - 0.03, 1.3, shade('#8aff5a'), r=0.01)
    pts = [(math.cos(a) * (0.13 if k % 2 == 0 else 0.055), math.sin(a) * (0.13 if k % 2 == 0 else 0.055)) for k, a in enumerate([math.pi / 2 + k * math.pi / 5 for k in range(10)])]
    m = len(neon.v)
    slab(neon, pts, 0.02, shade('#fff05a'), axis='y', at=-0.01)
    xform(neon, m, Matrix.Translation((-1.4, y0 - 0.06, 1.45)))
    roof_box(mb, 1.5, 0.5, H + 0.12)
    letters = [text('ARCADE', 0, y0 + 0.07, H + 0.85, 0.3, '#fff05a', depth=0.02, glow=True), text('PLAY', 0, y0 - 0.06, 1.54, 0.16, '#5ae8ff', glow=True)]
    return [(mb, 'main'), (gl, 'glass'), (neon, 'glow')], letters


def club():
    mb, gl, neon = MB(), MB(), MB()
    W, D, H = 5.4, 2.6, 1.85
    y0 = -D / 2
    walls(mb, W, D, H, '#221c2c', trim='#3a2e48', mottle=0.04)
    flat_roof(mb, W, D, H, '#2e2638', trim='#5a4870', deck='#4a4256')
    for k in range(54):
        ball(neon, (-W / 2 - 0.05 + k * (W + 0.1) / 53, y0 - 0.11, H + 0.06), 0.022, shade('#c8f05a' if k % 2 else '#5ae8ff'), sub=1)
    door(mb, gl, 0.5, y0, 0.7, 1.2, '#3a2a48', frame='#ff5ac8')
    rbox(mb, 0.0, y0 - 0.55, 0.0, 1.0, y0 - 0.02, 0.02, shade('#c83a5a'), r=0.005)
    for x in (-0.15, 1.15):
        lathe(mb, [(0.0, 0.0), (0.05, 0.0), (0.03, 0.05), (0.025, 0.6), (0.0, 0.62)], shade('#c8a040'), c=(x, y0 - 0.55, 0), seg=10)
        ball(mb, (x, y0 - 0.55, 0.64), 0.04, shade('#c8a040'), sub=1)
    tube(mb, [(-0.15, y0 - 0.55, 0.56), (0.5, y0 - 0.6, 0.48), (1.15, y0 - 0.55, 0.56)], 0.018, shade('#c83a5a'), seg=6)
    for x in (-1.5, 1.8):
        window(mb, gl, x, 0.55, 0.7, 0.6, y0, frame='#ff5ac8', panes=(2, 1), tint='#5a3a8a', sill=False)
    # a big neon music note on a board over the door, a disco ball on the roof
    rbox(mb, -0.55, y0 - 0.06, H - 0.72, 1.55, y0 - 0.02, H - 0.14, shade('#140f1c'), r=0.02)
    neon_box(neon, -0.5, 1.5, H - 0.68, H - 0.18, y0 - 0.06, '#ff5ac8')
    for dx in (0.0, 0.26):
        tube(neon, [(-0.25 + dx, y0 - 0.09, H - 0.6), (-0.25 + dx, y0 - 0.09, H - 0.3)], 0.018, shade('#ff8ae0'), seg=6)
        ball(neon, (-0.3 + dx, y0 - 0.09, H - 0.6), (0.065, 0.02, 0.05), shade('#ff8ae0'), sub=1)
    tube(neon, [(-0.25, y0 - 0.09, H - 0.3), (0.01, y0 - 0.09, H - 0.26)], 0.018, shade('#ff8ae0'), seg=6)
    roof_box(mb, 1.9, 0.6, H + 0.12, w=0.6, d=0.45)
    rbox(gl, -0.6, 0.1, H + 0.12, 0.6, 0.8, H + 0.3, col_fn('#7a5aa8', under=0.0), r=0.03)
    for x in (-2.0, -1.2):
        lathe(mb, [(0.0, H + 0.12), (0.1, H + 0.12), (0.06, H + 0.3), (0.0, H + 0.3)], shade('#3a3e52'), c=(x, -0.6, 0), seg=10)
        m = len(mb.v)
        lathe(mb, [(0.0, -0.12), (0.09, -0.12), (0.12, 0.1), (0.0, 0.1)], shade('#4a4e58'), seg=14)
        xform(mb, m, Matrix.Translation((x, -0.6, H + 0.42)) @ Euler((0.5, 0.4 if x < -1.5 else -0.4, 0)).to_matrix().to_4x4())
        m = len(neon.v)
        lathe(neon, [(0.0, 0.1), (0.11, 0.1), (0.0, 0.11)], shade('#fffbe0'), seg=14)
        xform(neon, m, Matrix.Translation((x, -0.6, H + 0.42)) @ Euler((0.5, 0.4 if x < -1.5 else -0.4, 0)).to_matrix().to_4x4())
    rng = random.Random(6)
    for x in (-1.5, 1.8):
        for k in range(5):
            ball(neon, (x + rng.uniform(-0.28, 0.28), y0 - 0.056, 0.62 + rng.uniform(0, 0.45)), (0.05, 0.004, 0.05), shade(rng.choice(['#ff5ac8', '#5ae8ff', '#fff05a'])), sub=1)
    letters = [text('CLUB', 0.75, y0 - 0.08, H - 0.43, 0.24, '#5ae8ff', depth=0.02, glow=True)]
    return [(mb, 'main'), (gl, 'glass'), (neon, 'glow')], letters


def builder():
    def deco(mb, gl, W, D, H, y0):
        # a lumber pile under a lean-to, sawhorses, a hammer by the sign
        for k in range(4):
            for j in range(4 - k):
                m = len(mb.v)
                lathe(mb, [(0.0, -0.5), (0.06, -0.5), (0.06, 0.5), (0.0, 0.5)], col_fn('#c8945a', grain='z'), seg=8)
                xform(mb, m, Matrix.Translation((-1.75 + j * 0.13 + k * 0.065, y0 - 0.55, 0.06 + k * 0.11)) @ Euler((0, math.pi / 2, 0.05)).to_matrix().to_4x4())
        for x in (1.25, 1.85):
            for s in (-1, 1):
                tube(mb, [(x + s * 0.12, y0 - 0.55, 0), (x, y0 - 0.55, 0.42)], 0.02, shade('#a87a48'), seg=5)
        rbox(mb, 1.1, y0 - 0.58, 0.4, 2.0, y0 - 0.52, 0.45, col_fn('#c8945a', grain='x'), r=0.01)
        m = len(mb.v)
        rbox(mb, -0.025, -0.02, -0.2, 0.025, 0.02, 0.12, shade('#8a5a34'), r=0.008)
        rbox(mb, -0.09, -0.03, 0.1, 0.09, 0.03, 0.17, shade('#5a5a60'), r=0.012)
        xform(mb, m, Matrix.Translation((-1.75, y0 - 0.12, H - 0.36)) @ Euler((0, 0.5, 0)).to_matrix().to_4x4())
        panel(mb, [(-2.25, y0 - 0.85, 0.95), (-1.0, y0 - 0.85, 0.95), (-1.0, y0 - 0.02, 1.25), (-2.25, y0 - 0.02, 1.25)], 0.05, col_fn('#8a3e2a'), Vector((0, -0.3, 1)))
        for x in (-2.2, -1.05):
            tube(mb, [(x, y0 - 0.8, 0), (x, y0 - 0.8, 0.96)], 0.03, shade('#a87a48'), seg=6)
    return shopfront(4.4, 2.6, 2.0, '#b8854e', '#6a4a2a', "GINGER'S", '#fff0d0', roof=('gable', '#8a3e2a', 0.72), deco=deco,
                     grain='z', mottle=0.0, trim='#f0e0c0', wins=(1.2,), box=('#8a5a34', '#f0c020', '#ffffff'))


def lighthouse():
    mb, gl = MB(), MB()

    lathe(mb, [(0.0, 0.0), (1.08, 0.0), (1.12, 0.06), (1.12, 0.45), (1.0, 0.52), (0.0, 0.52)], col_fn('#a8a094', mottle=0.14), seg=32)

    def rad(z):
        return 0.84 - (z - 0.5) * 0.06 if z < 2.5 else 0.72 - (z - 2.5) * 0.05 if z < 4.5 else 0.62 - (z - 4.5) * 0.12
    # the tower in bands (each its own ring of vertices, so the stripes stay crisp)
    bands = [0.5, 1.25, 2.0, 2.75, 3.5, 4.25, 5.0]
    for k in range(len(bands) - 1):
        z0, z1 = bands[k], bands[k + 1]
        prof = [(rad(z0 + (z1 - z0) * t / 4), z0 + (z1 - z0) * t / 4) for t in range(5)]
        if k == len(bands) - 2:
            prof.append((0.0, z1))
        lathe(mb, prof, col_fn('#e04040' if k % 2 else '#fbf8f0', under=0.0), seg=32, cap_top=False)
    lathe(mb, [(0.0, 4.98), (0.85, 4.98), (0.85, 5.1), (0.0, 5.1)], shade('#2a2a2e'), seg=28)
    for k in range(14):
        a = k / 14 * math.tau
        tube(mb, [(math.cos(a) * 0.8, math.sin(a) * 0.8, 5.1), (math.cos(a) * 0.8, math.sin(a) * 0.8, 5.36)], 0.014, shade('#2a2a2e'), seg=4)
    lathe(mb, [(0.78, 5.33), (0.82, 5.33), (0.82, 5.38), (0.78, 5.38)], shade('#2a2a2e'), seg=28, cap_top=False)
    lathe(gl, [(0.44, 5.1), (0.44, 5.62)], col_fn('#ffe8a0', under=0.0), seg=16, cap_top=False)
    for k in range(8):
        a = k / 8 * math.tau
        tube(mb, [(math.cos(a) * 0.45, math.sin(a) * 0.45, 5.1), (math.cos(a) * 0.45, math.sin(a) * 0.45, 5.62)], 0.022, shade('#2a2a2e'), seg=4)
    lathe(mb, [(0.0, 5.6), (0.58, 5.6), (0.6, 5.65), (0.32, 5.92), (0.0, 6.02)], col_fn('#c83a32', under=0.0), seg=28)
    lathe(mb, [(0.0, 6.0), (0.04, 6.0), (0.02, 6.2), (0.0, 6.2)], shade('#2a2a2e'), seg=8)
    ball(mb, (0, 0, 6.22), 0.05, shade('#2a2a2e'))
    # the keeper's door with a little porch roof, windows up the tower
    y0 = -0.84
    rbox(mb, -0.32, y0 - 0.04, 0.5, 0.32, y0 + 0.12, 1.55, shade('#fbf8f0'), r=0.04)
    rbox(mb, -0.26, y0 - 0.06, 0.5, 0.26, y0 + 0.1, 1.45, col_fn('#2a4a8a', grain='z'), r=0.04)
    ball(mb, (0.17, y0 - 0.08, 0.98), 0.025, shade('#e8c050'), sub=1)
    panel(mb, [(-0.45, y0 - 0.38, 1.6), (0.45, y0 - 0.38, 1.6), (0.45, y0 + 0.05, 1.78), (-0.45, y0 + 0.05, 1.78)], 0.04, col_fn('#c83a32'), Vector((0, -0.4, 1)))
    rbox(mb, -0.4, y0 - 0.55, 0.0, 0.4, y0 - 0.05, 0.25, col_fn(STONE, mottle=0.08), r=0.02)
    rbox(mb, -0.4, y0 - 0.85, 0.0, 0.4, y0 - 0.5, 0.12, col_fn(STONE, mottle=0.08), r=0.02)
    for z in (2.3, 3.5):
        r = rad(z + 0.2)
        rbox(mb, -0.16, -r - 0.04, z - 0.04, 0.16, -r + 0.06, z + 0.4, shade('#fbf8f0'), r=0.02)
        rbox(gl, -0.12, -r - 0.05, z, 0.12, -r + 0.05, z + 0.36, col_fn('#a8d4e8', under=0.0), r=0.02)
    return [(mb, 'main'), (gl, 'glass')], []


def barn():
    mb, gl = MB(), MB()
    W, D, H = 4.4, 3.0, 1.55
    y0 = -D / 2
    walls(mb, W, D, H, '#c43a32', trim='#fbf6ee', grain='z', mottle=0.02, frieze=False)
    for x in [-W / 2 + 0.25 + k * 0.25 for k in range(int((W - 0.4) / 0.25))]:
        rbox(mb, x - 0.006, y0 - 0.008, 0.14, x + 0.006, y0 + 0.01, H - 0.02, shade('#a83028'), r=0.003)
    # a gambrel roof, its ridge front to back: steep low slopes, gentle top ones, the gambrel's outline on the front
    f = col_fn('#7a2a22', under=0.0)
    over = 0.2
    RZ = 1.55
    prof = [(-W / 2 - over, H - 0.12), (-W / 2 + 0.55, H + 1.0), (0.0, H + RZ), (W / 2 - 0.55, H + 1.0), (W / 2 + over, H - 0.12)]
    Y = D / 2 + over
    for i in range(4):
        (xa, za), (xb, zb) = prof[i], prof[i + 1]
        A, B = Vector((xa, -Y, za)), Vector((xa, Y, za))
        C, Dd = Vector((xb, Y, zb)), Vector((xb, -Y, zb))
        up = (B - A).cross(Dd - A).normalized()
        if up.z < 0:
            up = -up
        panel(mb, [A, B, C, Dd], T, f, up)
        courses(mb, A, B, C, Dd, up, 4 if i in (0, 3) else 3, f)
        rake(mb, (xa, -Y - 0.03, za), (xb, -Y - 0.03, zb), '#fbf6ee', r=0.04)
        rake(mb, (xa, Y + 0.03, za), (xb, Y + 0.03, zb), '#fbf6ee', r=0.04)
    rbox(mb, -0.07, -Y, H + RZ + T - 0.02, 0.07, Y, H + RZ + T + 0.07, col_fn('#7a2a22'), r=0.03)
    outline = [(-W / 2 + 0.02, H - 0.01), (W / 2 - 0.02, H - 0.01), (W / 2 - 0.02, H + 0.02), (W / 2 - 0.55, H + 1.0), (0.0, H + RZ - 0.02),
               (-W / 2 + 0.55, H + 1.0), (-W / 2 + 0.02, H + 0.02)]
    for y in (y0, D / 2 - 0.04):
        slab(mb, outline, 0.04, col_fn('#c43a32', grain='z'), axis='y', at=y)

    def gable_top(x):
        ax = abs(x)
        return H + RZ - ax * (RZ - 1.0) / (W / 2 - 0.55) if ax < W / 2 - 0.55 else H + 1.0 - (ax - (W / 2 - 0.55)) * 1.0 / 0.55
    for k in range(17):
        x = -2.0 + k * 0.25
        if abs(x) < W / 2 - 0.15:
            rbox(mb, x - 0.006, y0 - 0.008, H, x + 0.006, y0 + 0.01, gable_top(x) - 0.06, shade('#a83028'), r=0.003)
    # big doors with a white X, white trim
    for s in (-1, 1):
        x0, x1 = (0.02, 0.8) if s > 0 else (-0.8, -0.02)
        rbox(mb, x0 + 0.01, y0 - 0.07, 0.12, x1 - 0.01, y0 - 0.02, 1.32, col_fn('#a83028', grain='z'), r=0.015)
        rbox(mb, x0, y0 - 0.09, 0.12, x1, y0 - 0.06, 0.2, shade('#fbf6ee'), r=0.01)
        rbox(mb, x0, y0 - 0.09, 1.24, x1, y0 - 0.06, 1.32, shade('#fbf6ee'), r=0.01)
        rbox(mb, x0, y0 - 0.09, 0.12, x0 + 0.08, y0 - 0.06, 1.32, shade('#fbf6ee'), r=0.01)
        rbox(mb, x1 - 0.08, y0 - 0.09, 0.12, x1, y0 - 0.06, 1.32, shade('#fbf6ee'), r=0.01)
        for (a, b) in (((x0 + 0.08, 0.2), (x1 - 0.08, 1.24)), ((x0 + 0.08, 1.24), (x1 - 0.08, 0.2))):
            tube(mb, [(a[0], y0 - 0.085, a[1]), (b[0], y0 - 0.085, b[1])], 0.035, shade('#fbf6ee'), seg=6)
    rbox(mb, -0.86, y0 - 0.06, 0.12, 0.86, y0 - 0.01, 1.4, shade('#fbf6ee'), r=0.012)
    for x in (-1.6, 1.6):
        window(mb, gl, x, 0.62, 0.45, 0.45, y0, frame='#fbf6ee', panes=(2, 2))
    # the hay loft in the gable, hay peeking out, the pulley beam
    rbox(mb, -0.38, y0 - 0.06, H + 0.32, 0.38, y0 + 0.01, H + 0.98, shade('#fbf6ee'), r=0.012)
    rbox(mb, -0.3, y0 - 0.07, H + 0.38, 0.3, y0, H + 0.92, shade('#3a2a20'), r=0.01)
    rng = random.Random(4)
    for k in range(9):
        a = (-0.25 + k * 0.06, y0 - 0.07, H + 0.4)
        tube(mb, [a, (a[0] + rng.uniform(-0.04, 0.04), y0 - 0.16, H + 0.47 + rng.uniform(0, 0.06))], 0.012, shade('#e4c06a'), seg=4)
    rbox(mb, -0.05, y0 - 0.45, H + 1.12, 0.05, y0 + 0.02, H + 1.2, col_fn('#8a5a34', grain='y'), r=0.01)
    tube(mb, [(0, y0 - 0.4, H + 1.12), (0, y0 - 0.4, H + 0.7)], 0.008, shade('#c8b080'), seg=4)
    rbox(mb, -1.5, y0 - 0.5, 0, -1.0, y0 - 0.1, 0.4, col_fn('#e4c06a', mottle=0.15), r=0.06)
    rbox(mb, 1.0, y0 - 0.55, 0, 1.55, y0 - 0.15, 0.4, col_fn('#e4c06a', mottle=0.15, seed=2), r=0.06)
    rbox(mb, 1.05, y0 - 0.5, 0.4, 1.5, y0 - 0.2, 0.75, col_fn('#e4c06a', mottle=0.15, seed=3), r=0.06)
    return [(mb, 'main'), (gl, 'glass')], []


def cafe():
    """Mugsy's, the coffee shop the living mug opens on the alley's lot (6zs_mug.js): cream walls, a striped awning, a
    big steaming cup on the roof, two little tables out front and a chalkboard by the door"""
    def deco(mb, gl, W, D, H, y0):
        # the cup on the roof: cream with a blue band, a handle, coffee in it and a curl of steam
        cz = H + 0.95
        lathe(mb, [(0.0, 0.0), (0.2, 0.0), (0.24, 0.05), (0.27, 0.42), (0.26, 0.46), (0.22, 0.46), (0.2, 0.06), (0.0, 0.06)], lambda p, n: rgb('#3a6aa8') if 0.12 < p.z - cz < 0.2 else rgb('#f6eedc'), c=(-0.6, 0.15, cz), seg=20)
        lathe(mb, [(0.215, 0.4), (0.0, 0.4)], shade('#6a3a1e'), c=(-0.6, 0.15, cz), seg=20)
        tube(mb, [(-0.34, 0.15, cz + 0.36), (-0.2, 0.15, cz + 0.32), (-0.19, 0.15, cz + 0.16), (-0.33, 0.15, cz + 0.12)], 0.035, shade('#f6eedc'), seg=8)
        tube(gl, [(-0.62, 0.15, cz + 0.5), (-0.52, 0.15, cz + 0.62), (-0.66, 0.15, cz + 0.74), (-0.56, 0.15, cz + 0.88)], 0.03, col_fn('#ffffff', under=0.0), seg=6, r1=0.012)
        lathe(mb, [(0.0, H + 0.62), (0.32, H + 0.62), (0.3, H + 0.95), (0.0, H + 0.95)], col_fn('#8a5a34', grain='z'), c=(-0.6, 0.15, 0), seg=6)
        # two round tables with chairs out front, on the side away from the door
        for k, x in enumerate((-1.45, -0.65)):
            ty = y0 - 0.75
            lathe(mb, [(0.0, 0.0), (0.12, 0.0), (0.03, 0.04), (0.025, 0.42), (0.2, 0.43), (0.2, 0.46), (0.0, 0.46)], shade('#2e3634'), c=(x, ty, 0), seg=14)
            lathe(mb, [(0.0, 0.46), (0.05, 0.46), (0.045, 0.5), (0.0, 0.52)], shade('#f6eedc'), c=(x + 0.06, ty, 0), seg=10)
            for s in (-1, 1):
                cx = x + s * 0.3
                for (dx, dy) in ((-0.08, -0.08), (0.08, -0.08), (-0.08, 0.08), (0.08, 0.08)):
                    tube(mb, [(cx + dx, ty + dy, 0), (cx + dx, ty + dy, 0.27)], 0.012, shade('#2e3634'), seg=4)
                rbox(mb, cx - 0.11, ty - 0.11, 0.27, cx + 0.11, ty + 0.11, 0.3, col_fn('#c8945a', grain='x'), r=0.012)
                rbox(mb, cx + s * 0.09, ty - 0.11, 0.3, cx + s * 0.11, ty + 0.11, 0.55, col_fn('#c8945a', grain='z'), r=0.01)
        # an umbrella over the first table
        ux, uy = -1.05, y0 - 0.75
        tube(mb, [(ux, uy, 0.46), (ux, uy, 1.3)], 0.016, shade('#f4f0e6'), seg=6)
        for k in range(8):
            a0, a1 = k / 8 * math.tau, (k + 1) / 8 * math.tau
            c = '#3a8a8a' if k % 2 else '#f6eedc'
            pts = [Vector((ux, uy, 1.38)), Vector((ux + math.cos(a0) * 0.55, uy + math.sin(a0) * 0.55, 1.18)), Vector((ux + math.cos(a1) * 0.55, uy + math.sin(a1) * 0.55, 1.18))]
            nrm = (pts[1] - pts[0]).cross(pts[2] - pts[0]).normalized()
            if nrm.z < 0:
                nrm = -nrm
            mb.add(pts, [rgb(c)] * 3, [nrm] * 3, [(0, 1, 2), (0, 2, 1)])
        # the chalkboard by the door
        for s in (-1, 1):
            q = [(1.45 - 0.2, y0 - 0.5 + s * 0.14, 0.0), (1.45 + 0.2, y0 - 0.5 + s * 0.14, 0.0), (1.45 + 0.2, y0 - 0.5 + s * 0.02, 0.66), (1.45 - 0.2, y0 - 0.5 + s * 0.02, 0.66)]
            panel(mb, q, 0.03, col_fn('#8a5a34'), Vector((0, s, 0.25)))
        panel(mb, [(1.29, y0 - 0.67, 0.12), (1.61, y0 - 0.67, 0.12), (1.61, y0 - 0.53, 0.6), (1.29, y0 - 0.53, 0.6)], 0.035, shade('#2e3634'), Vector((0, -1, 0.25)))
        lathe(mb, [(0.0, 0.42), (0.05, 0.42), (0.055, 0.5), (0.0, 0.5)], shade('#f6eedc'), c=(1.45, y0 - 0.69, 0), seg=10, sx=1.0, sy=0.3)
        for k in range(2):
            z = 0.32 - k * 0.1
            panel(mb, [(1.33, y0 - 0.68, z), (1.57 - k * 0.06, y0 - 0.68, z), (1.57 - k * 0.06, y0 - 0.675, z + 0.018), (1.33, y0 - 0.675, z + 0.018)], 0.012, shade('#f4f0e6'), Vector((0, -1, 0.25)))
        # a round window up in the gable
        m = len(mb.v)
        lathe(mb, [(0.0, 0.0), (0.26, 0.0), (0.26, 0.05), (0.2, 0.05), (0.2, 0.02), (0.0, 0.02)], shade('#fbf6ec'), seg=24)
        xform(mb, m, Matrix.Translation((0.0, y0 - 0.02, H + 0.5)) @ Euler((math.pi / 2, 0, 0)).to_matrix().to_4x4())
        m = len(gl.v)
        lathe(gl, [(0.2, 0.0), (0.0, 0.0)], col_fn('#ffe8b0', under=0.0), seg=24)
        xform(gl, m, Matrix.Translation((0.0, y0 - 0.015, H + 0.5)) @ Euler((math.pi / 2, 0, 0)).to_matrix().to_4x4())
        # a planter of herbs under the window
        rbox(mb, -1.6, y0 - 0.3, 0, -0.95, y0 - 0.02, 0.24, col_fn('#8a5a34', grain='x'), r=0.02)
        bush_by(mb, -1.28, y0 - 0.16, r=0.15, c='#5aa846', flowers=('#ffffff', '#f6c8d8'), seed=11, z=0.2)
    return shopfront(3.5, 2.6, 1.8, '#f6ecd8', '#3a8a8a', "MUGSY'S", '#fff8ec', roof=('front', '#7a4a30', 0.95), aw=('#7a4a30', '#f6eedc'),
                     deco=deco, door_x=0.5, wins=(-0.85,), box=('#f4f0e6', '#f6c8d8', '#ffffff'), sign_c='#3a8a8a', sign_b='#fff8ec', trim='#fbf6ec')


BUILDINGS = {'postoffice': postoffice, 'bank': bank, 'townhall': townhall, 'museum': museum, 'boutique': boutique, 'salon': salon,
             'studio': studio, 'displays': displays, 'restaurant': restaurant, 'arcade': arcade, 'club': club, 'builder': builder,
             'lighthouse': lighthouse, 'barn': barn, 'cafe': cafe}


def build(name):
    parts, letters = BUILDINGS[name]()
    objs = [mb.obj(f'bld_{name}_{p}', vmat(f'bld_{name}_{p}', rough=0.3 if p == 'glass' else 0.75)) for mb, p in parts if mb.v]
    return objs + letters


if __name__ == '__main__':
    args = sys.argv[1:]
    prev = args[args.index('--preview') + 1] if '--preview' in args else None
    each = args[args.index('--each') + 1] if '--each' in args else None
    only = args[args.index('--only') + 1] if '--only' in args else None
    names = [n for n in BUILDINGS if not only or n == only]
    reset()
    shown = []
    for name in names:
        objs = build(name)
        export(objs, 'bld_' + name)
        shown.append(objs)
        print('built', name)
    if each or prev:
        ground_plane(size=120, color='#a8d088')
        light_rig()
    if each:
        for name, objs in zip(names, shown):
            for o2 in shown:
                for o in o2:
                    o.hide_render = o2 is not objs
            tall = name == 'lighthouse'
            cam = camera((0, -0.6, 2.6 if tall else 1.2), dist=13 if tall else (11 if name in ('townhall', 'museum') else 9), pitch=34)
            render(os.path.join(each, name + '.png'), size=(1000, 700), samples=40)
            bpy.data.objects.remove(cam)
        for o2 in shown:
            for o in o2:
                o.hide_render = False
    if prev and shown:
        cols = 5
        for k, objs in enumerate(shown):
            for o in objs:
                o.matrix_world = Matrix.Translation(((k % cols) * 7.4, (k // cols) * 7.0, 0)) @ o.matrix_world
        rows = (len(shown) + cols - 1) // cols
        camera(((cols - 1) * 3.7, (rows - 1) * 3.5, 0.8), dist=34, pitch=36)
        render(os.path.join(prev, 'buildings.png'), size=(1800, 1150), samples=40)
