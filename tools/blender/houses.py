"""The neighbors' houses as dollhouse pieces, in parts the game puts together and paints from each house's look (the
look Ginger changes: wall, roof, door and trim colors, the roof's style, the walls' pattern, the add-ons).

Parts (3 by 3 tiles; the body's middle is the footprint's middle, the door on the front at x 0):
- house_body_<style>: walls (house_wall), corner boards, frieze, frames and sills (house_trim), the door (house_door),
  the window glass (house_glass), the stone footing and step (their own colors)
- house_roof_<style>: the roof (house_roof) with its fascia (house_trim); and house_roof_<style>_rainbow, David's
- house_pattern_<pattern>: a skin over the walls (siding, brick, shingles, stripes, timber framing)
- house_<addon>: flower boxes, shutters, porch lamps, potted plants, a chimney, an awning, a trim stripe, a wreath

Every part is shaded in greys in its mesh (a board's edge darker, the dark under the eaves) and named by its role, so
the game multiplies in the house's colors. Styles: gable (ridge side to side), peaked (gable to the front), tiled (a
hipped roof of clay tiles), flat (a parapet), thatch (a thick rounded straw roof).

    python tools/blender/houses.py [--preview DIR]
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from mathutils import Vector, Matrix, Euler, noise
from common import *
from trees_ac import MB, vmat, rgb, bmesh_ico
from kit import col_fn, shade, rbox, lathe, cyl, ball, tube, slab, plank_row, xform, rot

W, D, H = 2.7, 2.1, 1.55          # the walls: across, deep, high
FOOT = 0.14
DOOR_W, DOOR_H = 0.62, 1.1
WIN_X, WIN_Z, WIN_W, WIN_H = 0.82, 0.62, 0.48, 0.52
GREY = '#ffffff'


def g(v):
    """A grey for shading a tinted part (1 is the house's own color)."""
    return (v, v, v)


def grey_fn(base=1.0, grain=None, mottle=0.0, under=0.15, seed=0.0):
    f = col_fn('#ffffff', grain=grain, mottle=mottle, under=under, seed=seed)
    return lambda p, n, z0=0.0, z1=1.0: f(p, n, z0, z1) * base


# ---------------------------------------------------------------- the body
def body(style):
    walls, trim, door, glass, stone = MB(), MB(), MB(), MB(), MB()
    x0, x1, y0, y1 = -W / 2, W / 2, -D / 2, D / 2
    rbox(walls, x0, y0, FOOT, x1, y1, H, grey_fn(0.98, under=0.12), r=0.02, mid=4)
    if style == 'peaked':
        # the gable to the front and back: walls up to the ridge
        rise = 1.15
        for y, s in ((y0, -1), (y1, 1)):
            slab(walls, [(x0 + 0.02, H), (x1 - 0.02, H), (0.0, H + rise - 0.04)], 0.04, grey_fn(0.96), axis='y', at=y - (0.04 if s < 0 else 0))
    elif style in ('gable',):
        rise = 0.9
        for x, s in ((x0, -1), (x1, 1)):
            slab(walls, [(y0 + 0.02, H), (y1 - 0.02, H), (0.0, H + rise - 0.04)], 0.04, grey_fn(0.96), axis='x', at=x - (0.04 if s < 0 else 0))
    # the stone footing and the step
    rbox(stone, x0 - 0.04, y0 - 0.04, 0, x1 + 0.04, y1 + 0.04, FOOT, col_fn('#b8b0a2', mottle=0.12), r=0.02)
    rbox(stone, -0.45, y0 - 0.42, 0, 0.45, y0 - 0.02, 0.1, col_fn('#c8c0b2', mottle=0.1), r=0.03)
    # corner boards, a frieze under the roof
    for x in (x0, x1):
        for y in (y0, y1):
            rbox(trim, x - 0.06, y - 0.06, FOOT, x + 0.06, y + 0.06, H, grey_fn(1.0), r=0.02)
    rbox(trim, x0 - 0.04, y0 - 0.05, H - 0.12, x1 + 0.04, y0 + 0.01, H, grey_fn(1.0), r=0.015)
    # the door: frame, panels, a little window, a knob
    rbox(trim, -DOOR_W / 2 - 0.08, y0 - 0.045, FOOT, DOOR_W / 2 + 0.08, y0 + 0.01, FOOT + DOOR_H + 0.08, grey_fn(1.0), r=0.015)
    rbox(door, -DOOR_W / 2, y0 - 0.06, FOOT, DOOR_W / 2, y0 - 0.02, FOOT + DOOR_H, grey_fn(1.0, grain='z'), r=0.015)
    for z in (FOOT + 0.12, FOOT + 0.5):
        for sx in (-1, 1):
            rbox(door, sx * 0.15 - 0.11, y0 - 0.072, z, sx * 0.15 + 0.11, y0 - 0.058, z + 0.3, grey_fn(0.86), r=0.008)
    ball(door, (0.22, y0 - 0.08, FOOT + 0.55), 0.028, shade('#e8c050'), sub=2)
    # windows either side: frame, sill, panes in four
    for sx in (-1, 1):
        cx = sx * WIN_X
        rbox(trim, cx - WIN_W / 2 - 0.06, y0 - 0.045, WIN_Z - 0.06, cx + WIN_W / 2 + 0.06, y0 + 0.01, WIN_Z + WIN_H + 0.06, grey_fn(1.0), r=0.015)
        rbox(trim, cx - WIN_W / 2 - 0.1, y0 - 0.1, WIN_Z - 0.1, cx + WIN_W / 2 + 0.1, y0 + 0.01, WIN_Z - 0.05, grey_fn(0.95), r=0.012)
        rbox(glass, cx - WIN_W / 2, y0 - 0.05, WIN_Z, cx + WIN_W / 2, y0 - 0.035, WIN_Z + WIN_H, col_fn('#9fd0e8', under=0.0), r=0.004)
        rbox(trim, cx - 0.015, y0 - 0.06, WIN_Z, cx + 0.015, y0 - 0.045, WIN_Z + WIN_H, grey_fn(1.0), r=0.004)
        rbox(trim, cx - WIN_W / 2, y0 - 0.06, WIN_Z + WIN_H / 2 - 0.015, cx + WIN_W / 2, y0 - 0.045, WIN_Z + WIN_H / 2 + 0.015, grey_fn(1.0), r=0.004)
        # (a curtain each side, behind the glass)
        rbox(glass, cx - WIN_W / 2 + 0.02, y0 - 0.034, WIN_Z + 0.04, cx - WIN_W / 2 + 0.12, y0 - 0.03, WIN_Z + WIN_H - 0.03, col_fn('#f4ecd8', under=0.0), r=0.004)
        rbox(glass, cx + WIN_W / 2 - 0.12, y0 - 0.034, WIN_Z + 0.04, cx + WIN_W / 2 - 0.02, y0 - 0.03, WIN_Z + WIN_H - 0.03, col_fn('#f4ecd8', under=0.0), r=0.004)
    # side windows
    for sx in (-1, 1):
        x = sx * W / 2
        rbox(trim, x - 0.05 if sx < 0 else x - 0.01, -0.3, WIN_Z - 0.06, x + 0.01 if sx < 0 else x + 0.05, 0.3, WIN_Z + WIN_H + 0.06, grey_fn(1.0), r=0.015)
        rbox(glass, x - 0.055 if sx < 0 else x + 0.035, -0.24, WIN_Z, x - 0.035 if sx < 0 else x + 0.055, 0.24, WIN_Z + WIN_H, col_fn('#9fd0e8', under=0.0), r=0.004)
    return [(walls, 'house_wall'), (trim, 'house_trim'), (door, 'house_door'), (glass, 'house_glass'), (stone, 'house_stone')]


# ---------------------------------------------------------------- roofs
def board(mb, quad, t, fn, up):
    """A thick quad (a roof slab): its four corners, pushed t along up."""
    q = [Vector(p) for p in quad]
    up = Vector(up).normalized()
    top = [p + up * t for p in q]
    cols = lambda pts, n: [fn(p, n) for p in pts]
    mb.add(top, cols(top, up), [up] * 4, [(0, 1, 2), (0, 2, 3)])
    mb.add(q, cols(q, -up), [-up] * 4, [(0, 2, 1), (0, 3, 2)])
    for i in range(4):
        j = (i + 1) % 4
        e = q[j] - q[i]
        side = e.cross(up).normalized()
        if side.dot(q[i] - sum(q, Vector()) / 4) < 0:
            side = -side
        pts = [q[i], q[j], top[j], top[i]]
        mb.add(pts, cols(pts, side), [side] * 4, [(0, 1, 2), (0, 2, 3)])


def rows_on(mb, A, B, Cc, Dd, up, rows, fn, lift=0.012, scallop=False, rng=None):
    """Courses of shingles or tiles over a sloping quad (A, B along the eave; D, C up at the ridge)."""
    up = Vector(up).normalized()
    A, B, Cc, Dd = (Vector(v) for v in (A, B, Cc, Dd))
    for r in range(rows):
        t0, t1 = r / rows, (r + 1.25) / rows
        a0, b0 = A.lerp(Dd, t0), B.lerp(Cc, t0)
        a1, b1 = A.lerp(Dd, min(1.0, t1)), B.lerp(Cc, min(1.0, t1))
        k = 0.86 + 0.14 * (r % 2) + (rng.uniform(-0.04, 0.04) if rng else 0)
        lv = up * (lift + 0.01 * (r % 2))
        board(mb, [a0 + lv, b0 + lv, b1 + lv, a1 + lv], 0.015, lambda p, n, k=k: fn(p, n) * k, up)


def roof(style, rainbow=False):
    mb, fascia = MB(), MB()
    x0, x1, y0, y1 = -W / 2, W / 2, -D / 2, D / 2
    rng = random.Random(5)
    bands = [rgb(c) for c in ('#ff5a6a', '#ffa24a', '#ffd84a', '#5ed17a', '#4ea8f0', '#b37cf0')]

    def tint(p, n):
        if rainbow:
            k = int((p.z - H) / 0.16) % 6
            return bands[k] * (0.85 + 0.15 * max(0.0, n.z))
        return Vector(g(1.0)) * (0.8 + 0.2 * max(0.0, n.z))
    over, T = 0.22, 0.08
    if style in ('gable', 'peaked'):
        rise = 0.9 if style == 'gable' else 1.15
        if style == 'gable':
            # the ridge side to side: a slope to the front, one to the back
            for s in (-1, 1):
                A = Vector((x0 - over, s * (D / 2 + over), H - over * rise / (D / 2)))
                B = Vector((x1 + over, s * (D / 2 + over), H - over * rise / (D / 2)))
                C = Vector((x1 + over, 0, H + rise))
                Dd = Vector((x0 - over, 0, H + rise))
                up = (B - A).cross(Dd - A).normalized()
                if up.z < 0:
                    up = -up
                board(mb, [A, B, C, Dd], T, tint, up)
                rows_on(mb, A + up * T, B + up * T, C + up * T, Dd + up * T, up, 7, tint, rng=rng)
                rbox(fascia, x0 - over - 0.02, s * (D / 2 + over) - 0.04, A.z - 0.1, x1 + over + 0.02, s * (D / 2 + over) + 0.04, A.z + 0.04, grey_fn(1.0), r=0.015)
            rbox(mb, x0 - over, -0.07, H + rise + T - 0.02, x1 + over, 0.07, H + rise + T + 0.08, tint, r=0.03)
        else:
            # the gable to the front: a slope to each side
            for s in (-1, 1):
                A = Vector((s * (W / 2 + over), y0 - over, H - over * rise / (W / 2)))
                B = Vector((s * (W / 2 + over), y1 + over, H - over * rise / (W / 2)))
                C = Vector((0, y1 + over, H + rise))
                Dd = Vector((0, y0 - over, H + rise))
                up = (B - A).cross(Dd - A).normalized()
                if up.z < 0:
                    up = -up
                board(mb, [A, B, C, Dd], T, tint, up)
                rows_on(mb, A + up * T, B + up * T, C + up * T, Dd + up * T, up, 8, tint, rng=rng)
            rbox(mb, -0.07, y0 - over, H + rise + T - 0.02, 0.07, y1 + over, H + rise + T + 0.08, tint, r=0.03)
            # barge boards up the front rake
            for s in (-1, 1):
                a = Vector((s * (W / 2 + over), y0 - over - 0.05, H - over * rise / (W / 2) - 0.08))
                c = Vector((0, y0 - over - 0.05, H + rise + 0.02))
                d = (c - a).normalized()
                m = len(fascia.v)
                rbox(fascia, 0, -0.03, -0.07, (c - a).length, 0.03, 0.07, grey_fn(1.0), r=0.015)
                ang = math.atan2(d.z, d.x)
                xform(fascia, m, Matrix.Translation(a) @ Euler((0, -ang, 0)).to_matrix().to_4x4())
    elif style == 'tiled':
        # a hipped roof of clay tiles: four slopes to a short ridge
        rise, inset = 0.85, 0.55
        E = [Vector((x0 - over, y0 - over, H - 0.08)), Vector((x1 + over, y0 - over, H - 0.08)), Vector((x1 + over, y1 + over, H - 0.08)), Vector((x0 - over, y1 + over, H - 0.08))]
        R = [Vector((x0 + inset, 0, H + rise)), Vector((x1 - inset, 0, H + rise))]
        nud = Vector((0, 0.002, 0))
        faces = [(E[0], E[1], R[1], R[0]), (E[2], E[3], R[0], R[1]), (E[1], E[2], R[1] + nud, R[1] - nud), (E[3], E[0], R[0] - nud, R[0] + nud)]
        for A, B, C, Dd in faces:
            up = (B - A).cross((C + Dd) / 2 - A).normalized()
            if up.z < 0:
                up = -up
            board(mb, [A, B, C, Dd], T, tint, up)
            # tile courses: ridged rows
            for r in range(8):
                t = (r + 0.5) / 8
                a, b = A.lerp(Dd, t), B.lerp(C, t)
                tube(mb, [a + up * (T + 0.02), b + up * (T + 0.02)], 0.03, lambda p, n, r=r: tint(p, n) * (0.88 + 0.08 * (r % 2)), seg=6)
        tube(mb, [R[0] + Vector((0, 0, T + 0.04)), R[1] + Vector((0, 0, T + 0.04))], 0.06, tint, seg=8)
        for e in E:
            pass
        rbox(fascia, x0 - over - 0.02, y0 - over - 0.03, H - 0.2, x1 + over + 0.02, y0 - over + 0.03, H - 0.06, grey_fn(1.0), r=0.015)
    elif style == 'flat':
        # a flat roof behind a parapet, a cornice band
        rbox(mb, x0 - 0.08, y0 - 0.08, H - 0.02, x1 + 0.08, y1 + 0.08, H + 0.1, tint, r=0.03)
        for (a, b, c, d) in ((x0 - 0.1, y0 - 0.1, x1 + 0.1, y0 + 0.02), (x0 - 0.1, y1 - 0.02, x1 + 0.1, y1 + 0.1), (x0 - 0.1, y0 - 0.1, x0 + 0.02, y1 + 0.1), (x1 - 0.02, y0 - 0.1, x1 + 0.1, y1 + 0.1)):
            rbox(mb, a, b, H + 0.08, c, d, H + 0.32, tint, r=0.03)
        rbox(fascia, x0 - 0.13, y0 - 0.13, H + 0.28, x1 + 0.13, y1 + 0.13, H + 0.36, grey_fn(1.0), r=0.02)
        rbox(fascia, x0 - 0.11, y0 - 0.11, H - 0.1, x1 + 0.11, y1 + 0.11, H - 0.02, grey_fn(1.0), r=0.015)
    elif style == 'thatch':
        # a thick rounded straw roof: a squashed dome, straw streaks running down it, the eave cut straight
        def straw(p, n):
            k = 0.86 + 0.14 * math.sin(math.atan2(p.y, p.x) * 60 + p.z * 4)
            return tint(p, n) * k
        prof = [(1.0, 0.0), (1.02, 0.1), (0.95, 0.3), (0.8, 0.55), (0.55, 0.8), (0.28, 0.95), (0.0, 1.0)]
        lathe(mb, [(r * (W / 2 + 0.38) * 1.0, H - 0.18 + z * 1.15) for r, z in prof], straw, c=(0, 0, 0), seg=40, cap_top=False, cap_bot=True, sx=1.0, sy=(D / 2 + 0.38) / (W / 2 + 0.38))
        lathe(fascia, [(W / 2 + 0.39, H - 0.2), (W / 2 + 0.41, H - 0.12)], grey_fn(0.9), c=(0, 0, 0), seg=40, cap_top=False, sy=(D / 2 + 0.38) / (W / 2 + 0.38))
    return [(mb, 'house_roof_rainbow' if rainbow else 'house_roof'), (fascia, 'house_trim')]


# ---------------------------------------------------------------- the walls' patterns
def pattern(kind):
    """A skin over the front and sides of the walls (a hair in front of them), shaded to show the pattern."""
    mb, tr = MB(), MB()
    x0, x1, y0, y1 = -W / 2, W / 2, -D / 2, D / 2
    out = 0.012
    faces = [('y', y0 - out, x0 + 0.07, x1 - 0.07), ('x', x0 - out, y0 + 0.07, y1 - 0.07), ('x', x1 + out, y0 + 0.07, y1 - 0.07), ('y', y1 + out, x0 + 0.07, x1 - 0.07)]
    holes = [(-DOOR_W / 2 - 0.08, DOOR_W / 2 + 0.08, FOOT, FOOT + DOOR_H + 0.08)] + [(sx * WIN_X - WIN_W / 2 - 0.1, sx * WIN_X + WIN_W / 2 + 0.1, WIN_Z - 0.1, WIN_Z + WIN_H + 0.06) for sx in (-1, 1)]
    side_hole = (-0.3, 0.3, WIN_Z - 0.06, WIN_Z + WIN_H + 0.06)

    def blocked(axis, fixed, u0, u1, z0, z1):
        hs = holes if (axis == 'y' and fixed < 0) else [side_hole] if axis == 'x' else holes
        return any(not (u1 <= a or u0 >= b or z1 <= c or z0 >= d) for a, b, c, d in hs)

    def piece(axis, fixed, u0, u1, z0, z1, fn, depth=0.012, target=mb):
        if blocked(axis, fixed, u0, u1, z0, z1):
            return
        if axis == 'y':
            s = 1 if fixed > 0 else -1
            rbox(target, u0, fixed - (depth if s < 0 else 0), z0, u1, fixed + (depth if s > 0 else 0), z1, fn, r=0.004)
        else:
            s = 1 if fixed > 0 else -1
            rbox(target, fixed - (depth if s < 0 else 0), u0, z0, fixed + (depth if s > 0 else 0), u1, z1, fn, r=0.004)
    rng = random.Random(3)
    for axis, fixed, a0, a1 in faces:
        z = FOOT
        if kind == 'siding':
            while z < H - 0.14:
                piece(axis, fixed, a0, a1, z, z + 0.1, grey_fn(0.94 + 0.04 * rng.random(), grain='x' if axis == 'y' else 'y'), depth=0.016)
                z += 0.11
        elif kind == 'brick':
            row = 0
            while z < H - 0.14:
                u = a0 - (0.09 if row % 2 else 0)
                while u < a1:
                    piece(axis, fixed, max(a0, u + 0.008), min(a1, u + 0.18 - 0.008), z + 0.008, z + 0.082, grey_fn(0.88 + 0.12 * rng.random(), mottle=0.06), depth=0.014)
                    u += 0.18
                z += 0.09
                row += 1
        elif kind == 'shingle':
            row = 0
            while z < H - 0.14:
                u = a0 - (0.07 if row % 2 else 0)
                while u < a1:
                    piece(axis, fixed, max(a0, u + 0.006), min(a1, u + 0.14 - 0.006), z, z + 0.14, grey_fn(0.9 + 0.1 * rng.random()), depth=0.012 + 0.006 * (row % 2))
                    u += 0.14
                z += 0.1
                row += 1
        elif kind == 'stripes':
            u = a0
            k = 0
            while u < a1:
                piece(axis, fixed, u, min(a1, u + 0.14), FOOT, H - 0.14, grey_fn(1.0 if k % 2 else 0.78), depth=0.01)
                u += 0.14
                k += 1
        elif kind == 'timber':
            # dark beams (in the trim's color) on the plaster: posts, a rail, braces
            for u in (a0, (a0 + a1) / 2 - 0.04, a1 - 0.08):
                piece(axis, fixed, u, u + 0.08, FOOT, H - 0.12, grey_fn(0.55, grain='z'), depth=0.02, target=tr)
            piece(axis, fixed, a0, a1, 0.98, 1.05, grey_fn(0.55, grain='x'), depth=0.02, target=tr)
    return [(mb, 'house_wall'), (tr, 'house_trim')] if kind == 'timber' else [(mb, 'house_wall')]


# ---------------------------------------------------------------- add-ons
def addon(kind):
    y0 = -D / 2
    if kind == 'boxes':
        mb, fl = MB(), MB()
        rng = random.Random(4)
        for sx in (-1, 1):
            cx = sx * WIN_X
            plank_row(mb, cx - WIN_W / 2 - 0.08, cx + WIN_W / 2 + 0.08, y0 - 0.26, y0 - 0.1, WIN_Z - 0.3, WIN_Z - 0.12, 2, '#a8743e', stack='z', seed=sx + 2)
            for k in range(7):
                x = cx - WIN_W / 2 + (k + 0.5) / 7 * WIN_W
                ball(fl, (x, y0 - 0.18, WIN_Z - 0.1), 0.05, shade('#4a8a3a'), sub=1)
                ball(fl, (x + rng.uniform(-0.02, 0.02), y0 - 0.2, WIN_Z - 0.04 + rng.uniform(0, 0.04)), 0.04, shade(rng.choice(['#f0507a', '#ffd040', '#ffffff', '#f080c0', '#ff8a3a'])), sub=1)
        return [(mb, 'main'), (fl, 'flowers')]
    if kind == 'shutters':
        mb = MB()
        for sx in (-1, 1):
            for s2 in (-1, 1):
                cx = sx * WIN_X + s2 * (WIN_W / 2 + 0.15)
                rbox(mb, cx - 0.1, y0 - 0.06, WIN_Z - 0.02, cx + 0.1, y0 - 0.02, WIN_Z + WIN_H + 0.02, grey_fn(1.0), r=0.012)
                for k in range(6):
                    z = WIN_Z + 0.04 + k * 0.085
                    rbox(mb, cx - 0.08, y0 - 0.068, z, cx + 0.08, y0 - 0.058, z + 0.03, grey_fn(0.82), r=0.004)
        return [(mb, 'house_door')]
    if kind == 'lamps':
        mb, gl = MB(), MB()
        for sx in (-1, 1):
            x = sx * (DOOR_W / 2 + 0.22)
            rbox(mb, x - 0.02, y0 - 0.06, 1.08, x + 0.02, y0 - 0.02, 1.2, shade('#2a2a2e'), r=0.005)
            lathe(mb, [(0.06, 1.02), (0.07, 1.04)], shade('#2a2a2e'), c=(x, y0 - 0.13, 0), seg=10)
            rbox(gl, x - 0.05, y0 - 0.18, 1.04, x + 0.05, y0 - 0.08, 1.16, col_fn('#ffe8a0', under=0.0), r=0.01)
            lathe(mb, [(0.075, 1.16), (0.0, 1.24)], shade('#2a2a2e'), c=(x, y0 - 0.13, 0), seg=10, cap_top=False)
        return [(mb, 'main'), (gl, 'glass')]
    if kind == 'plants':
        mb = MB()
        for sx in (-1, 1):
            x = sx * 0.62
            lathe(mb, [(0.1, 0.0), (0.13, 0.22), (0.14, 0.24)], col_fn('#c8643a'), c=(x, y0 - 0.32, 0), seg=14, cap_top=False, cap_bot=True)
            for k in range(7):
                a = k / 7 * math.tau
                ball(mb, (x + math.cos(a) * 0.08, y0 - 0.32 + math.sin(a) * 0.08, 0.3 + 0.04 * (k % 2)), 0.08, shade('#4a9a3c' if k % 2 else '#5aaa48'), sub=2)
            ball(mb, (x, y0 - 0.32, 0.4), 0.09, shade('#5aaa48'), sub=2)
        return [(mb, 'main')]
    if kind == 'chimney':
        mb = MB()
        rbox(mb, 0.55, 0.2, 1.4, 0.85, 0.5, 2.85, col_fn('#a8584a', mottle=0.1), r=0.02)
        rbox(mb, 0.51, 0.16, 2.85, 0.89, 0.54, 2.95, col_fn('#7a6a60'), r=0.02)
        return [(mb, 'main')]
    if kind == 'awning':
        mb = MB()
        def stripes(p, n):
            return Vector(g(1.0 if int(math.floor((p.x + 2) / 0.12)) % 2 else 0.62)) * (0.9 + 0.1 * max(0.0, n.z))
        for sx in (-1, 1):
            cx = sx * WIN_X
            m = len(mb.v)
            rbox(mb, cx - WIN_W / 2 - 0.12, 0, -0.012, cx + WIN_W / 2 + 0.12, 0.36, 0.012, stripes, r=0.008, mid=8)
            xform(mb, m, Matrix.Translation((0, y0 - 0.02, WIN_Z + WIN_H + 0.26)) @ Euler((math.pi + 0.55, 0, 0)).to_matrix().to_4x4())
        return [(mb, 'house_trim')]
    if kind == 'band':
        mb = MB()
        rbox(mb, -W / 2 - 0.03, -D / 2 - 0.03, 1.28, W / 2 + 0.03, D / 2 + 0.03, 1.36, grey_fn(1.0), r=0.012)
        return [(mb, 'house_trim')]
    if kind == 'wreath':
        mb = MB()
        for k in range(16):
            a = k / 16 * math.tau
            ball(mb, (math.cos(a) * 0.12, y0 - 0.1, FOOT + 0.82 + math.sin(a) * 0.12), 0.045, shade('#2f6a2a' if k % 3 else '#3f8a34'), sub=1)
        ball(mb, (0, y0 - 0.12, FOOT + 0.68), (0.05, 0.02, 0.04), shade('#d0302a'), sub=1)
        return [(mb, 'main')]
    raise ValueError(kind)


STYLES = ['gable', 'peaked', 'tiled', 'flat', 'thatch']
PATTERNS = ['siding', 'brick', 'shingle', 'stripes', 'timber']
ADDONS = ['boxes', 'shutters', 'lamps', 'plants', 'chimney', 'awning', 'band', 'wreath']


def objs(parts, prefix):
    return [mb.obj(f'{prefix}_{role}', vmat(role if role.startswith('house_') else f'{prefix}_{role}')) for mb, role in parts if mb.v]


# the neighbors' houses as they start (scripts: game/src/2b_exterior.js HOUSE_BASE), for the catalog render
HOUSES = {
    'h_david': dict(wall='#ffd1ea', roof='rainbow', trim='#ffffff', door='#b37cf0'),
    'h_maki': dict(wall='#efe4cf', roof='#34473e', trim='#5a4633', door='#6b4a35'),
    'h_coco': dict(wall='#8a5a3c', roof='#ff9ec0', trim='#f7d6e6', door='#5a3322'),
    'h_chili': dict(wall='#fff1e4', roof='#e2382b', trim='#7a1512', door='#5aa844'),
    'h_cece': dict(wall='#fff4dc', roof='#f5d68e', trim='#c98a4b', door='#ff8aa8', awning=1),
    'h_clementine': dict(wall='#fff6ea', roof='#f7962d', trim='#ffffff', door='#3f8f45', style='flat', band=1),
    'h_basil': dict(wall='#e7f2dc', roof='#4a9a52', trim='#2f6b36', door='#c4843f', lamps=1),
    'h_kai': dict(wall='#e9d3a8', roof='#caa55f', trim='#8a6a3a', door='#4f86c6', style='thatch'),
    'h_cuke': dict(wall='#eaf6e0', roof='#3f8a3a', trim='#ffffff', door='#e84a5a', style='peaked'),
    'h_joe': dict(wall='#d6dde8', roof='#3d5a6c', trim='#fff7e6', door='#d4a03a', pattern='siding', boxes=1),
    'h_sully': dict(wall='#b0533c', roof='#4a4450', trim='#fbf6ee', door='#2f6b4a', style='flat', pattern='brick', band=1, plants=1),
    'h_ginger': dict(wall='#b8733d', roof='#7a4422', trim='#ffffff', door='#e0405a', pattern='timber', chimney=1),
    'h_brulee': dict(wall='#f7e7c4', roof='#c98a3a', trim='#8a5a2b', door='#6b3f2a', style='tiled', shutters=1),
    'h_mac': dict(wall='#ffe08a', roof='#3f6fb8', trim='#ffffff', door='#e0405a', pattern='shingle', wreath=1),
}


def tinted(o, colors):
    """A copy of a part's material with its role's color multiplied in (the catalog's stand-in for the game's paint)."""
    for i, m in enumerate(o.data.materials):
        role = m.name.split('.')[0]
        c = {'house_wall': colors['wall'], 'house_roof': colors['roof'], 'house_trim': colors['trim'], 'house_door': colors['door']}.get(role)
        if not c or c == 'rainbow':
            continue
        nm = m.copy()
        nt = nm.node_tree
        bsdf = nt.nodes['Principled BSDF']
        vc = [n for n in nt.nodes if n.bl_idname == 'ShaderNodeVertexColor'][0]
        mix_ = nt.nodes.new('ShaderNodeMix')
        mix_.data_type = 'RGBA'
        mix_.blend_type = 'MULTIPLY'
        mix_.inputs['Factor'].default_value = 1.0
        A = [x for x in mix_.inputs if x.name == 'A' and x.type == 'RGBA'][0]
        B = [x for x in mix_.inputs if x.name == 'B' and x.type == 'RGBA'][0]
        out = [x for x in mix_.outputs if x.name == 'Result' and x.type == 'RGBA'][0]
        nt.links.new(vc.outputs['Color'], A)
        B.default_value = hex_rgb(c)
        nt.links.new(out, bsdf.inputs['Base Color'])
        o.data.materials[i] = nm


if __name__ == '__main__':
    args = sys.argv[1:]
    prev = args[args.index('--preview') + 1] if '--preview' in args else None
    reset()
    built = {}
    for st in STYLES:
        built['body_' + st] = (objs(body(st), 'house_body_' + st))
        export(built['body_' + st], 'house_body_' + st)
        built['roof_' + st] = objs(roof(st), 'house_roof_' + st)
        export(built['roof_' + st], 'house_roof_' + st)
        built['roofbow_' + st] = objs(roof(st, rainbow=True), 'house_roof_' + st + '_rainbow')
        export(built['roofbow_' + st], 'house_roof_' + st + '_rainbow')
        print('built', st)
    for pt in PATTERNS:
        built['pattern_' + pt] = objs(pattern(pt), 'house_pattern_' + pt)
        export(built['pattern_' + pt], 'house_pattern_' + pt)
    for ad in ADDONS:
        built['addon_' + ad] = objs(addon(ad), 'house_' + ad)
        export(built['addon_' + ad], 'house_' + ad)
    print('built parts')
    if prev:
        for o in bpy.context.scene.objects:
            o.hide_render = True
        ground_plane(color='#8cc46a')
        light_rig()
        k = 0
        for hid, L in HOUSES.items():
            st = L.get('style', 'gable')
            names = ['body_' + st, ('roofbow_' if L['roof'] == 'rainbow' else 'roof_') + st]
            if L.get('pattern', 'plain') != 'plain':
                names.append('pattern_' + L['pattern'])
            names += ['addon_' + a for a in ADDONS if L.get(a)]
            x, y = (k % 7) * 4.0, (k // 7) * 4.6
            for n in names:
                for o in built[n]:
                    c = o.copy()
                    c.data = o.data.copy()
                    link(c)
                    c.hide_render = False
                    c.matrix_world = Matrix.Translation((x, y, 0)) @ c.matrix_world
                    tinted(c, L)
            k += 1
        camera((12, 2.3, 1.0), dist=24, pitch=30)
        render(os.path.join(prev, 'houses.png'), size=(1600, 900), samples=64)
