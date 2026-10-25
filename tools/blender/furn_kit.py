"""The kit for the rooms' furniture (furniture.py makes the models; the pieces are in furn_*.py): a Piece (its painted,
glossy and lit parts, the height things stand on), paints, and the common shapes (table, chair, bed, sofa, cabinet,
shelf with books or jars, counter, floor lamp, pot, leaf, glass case). Units are tiles, the piece's middle at the
origin, -y the front, z up.
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from mathutils import Vector, Matrix, Euler, noise
from common import *
from trees_ac import MB, vmat, rgb
import kit
from kit import col_fn, shade, rbox, lathe, tube, xform, rot, slab, cyl
from folks import ball, surf, superq, revolve, mottle

ITEMS = {}          # id -> (w, h, builder)
kit.DETAIL['lite'] = True     # (rounded edges in two steps: a room holds dozens of pieces, and every model loads at once)


def item(id, w, h):
    """Register a piece's builder: @item('table_wood', 2, 1)"""
    def deco(fn):
        ITEMS[id] = (w, h, fn)
        return fn
    return deco


class Piece:
    def __init__(self, id, w, h):
        self.id, self.w, self.h = id, w, h
        self.main, self.gloss, self.glow, self.clear = MB(), MB(), MB(), MB()
        self.anchors = {}
        self.rng = random.Random(sum(map(ord, id)))

    def top(self, z):
        """The height things stand on (tabletops, counters, dressers)."""
        self.anchors['top'] = Vector((0, 0, z))

    @property
    def W(self):
        return self.w * 0.92

    @property
    def D(self):
        return self.h * 0.88


# ---------------------------------------------------------------- paints
def wood(c, grain='x', seed=0.0):
    return col_fn(c, grain=grain, mottle=0.04, seed=seed, under=0.16)


def paint(c, under=0.12):
    return col_fn(c, mottle=0.025, under=under)


def fabric(c, seed=0.0):
    return col_fn(c, mottle=0.07, seed=seed, under=0.14)


def metal(c):
    return col_fn(c, under=0.06)


def stripes(c1, c2, n, axis='x', soft_=0.15):
    a, b = rgb(c1), rgb(c2)

    def f(p, nn, z0=0.0, z1=1.0):
        v = {'x': p.x, 'y': p.y, 'z': p.z}[axis] * n
        t = 0.5 + 0.5 * math.sin(v * math.pi)
        return a.lerp(b, max(0.0, min(1.0, (t - 0.5) / soft_ + 0.5))) * (1 - 0.1 * max(0.0, -nn.z))
    return f


# ---------------------------------------------------------------- the kit
def legs(mb, x0, x1, y0, y1, h, col, r=0.03, turned=False, inset=0.05, z0=0.0):
    """Four legs at the corners of a rectangle (square posts, or turned ones)."""
    for x in (x0 + inset, x1 - inset):
        for y in (y0 + inset, y1 - inset):
            if turned:
                lathe(mb, [(r * 0.8, z0), (r, z0 + 0.03), (r * 0.7, z0 + h * 0.3), (r * 1.1, z0 + h * 0.55), (r * 0.75, z0 + h * 0.8), (r, h)], col, c=(x, y, 0), seg=10, cap_top=False)
            else:
                rbox(mb, x - r, y - r, z0, x + r, y + r, h, col, r=r * 0.45, mid=1)


def slab_top(mb, x0, y0, x1, y1, z, t, col, r=0.025):
    rbox(mb, x0, y0, z - t, x1, y1, z, col, r=r, mid=2)


def table(P, w, d, h, top, leg, t=0.06, turned=False, apron=True, leg_r=0.035, cloth=None):
    """A table: a rounded top, an apron under it, four legs. cloth: (color, color2) a checked cloth hanging over."""
    mb = P.main
    slab_top(mb, -w / 2, -d / 2, w / 2, d / 2, h, t, top)
    if apron:
        rbox(mb, -w / 2 + 0.05, -d / 2 + 0.05, h - t - 0.08, w / 2 - 0.05, d / 2 - 0.05, h - t + 0.005, leg, r=0.012, mid=1)
    legs(mb, -w / 2, w / 2, -d / 2, d / 2, h - t, leg, r=leg_r, turned=turned, inset=0.07)
    if cloth:
        c1, c2 = rgb(cloth[0]), rgb(cloth[1])

        def chk(p, n, z0=0, z1=1):
            a = (math.floor(p.x * 9) + math.floor((p.y if abs(n.y) < 0.7 else p.z) * 9)) % 2
            return (c1 if a else c2) * (1 - 0.12 * max(0.0, -n.z))
        rbox(mb, -w / 2 - 0.03, -d / 2 - 0.03, h - 0.16, w / 2 + 0.03, d / 2 + 0.03, h + 0.012, chk, r=0.02, mid=2)
    P.top(h + (0.012 if cloth else 0))


def chair(P, w, d, seat, back, col, seat_col=None, turned=False, back_style='slats', cushion=None):
    """A chair: a seat, four legs, a back at the rear (slats, a panel, or a padded back)."""
    mb = P.main
    seat_col = seat_col or col
    legs(mb, -w / 2, w / 2, -d / 2, d / 2, seat - 0.04, col, r=0.025, turned=turned, inset=0.04)
    rbox(mb, -w / 2, -d / 2, seat - 0.05, w / 2, d / 2, seat, seat_col, r=0.02, mid=1)
    if cushion:
        rbox(mb, -w / 2 + 0.03, -d / 2 + 0.03, seat - 0.01, w / 2 - 0.03, d / 2 - 0.05, seat + 0.05, fabric(cushion), r=0.025, mid=1)
    for x in (-w / 2 + 0.04, w / 2 - 0.04):
        rbox(mb, x - 0.022, d / 2 - 0.06, seat, x + 0.022, d / 2 - 0.016, back, col, r=0.01, mid=1)
    if back_style == 'slats':
        for z in (back - 0.06, back - 0.2):
            rbox(mb, -w / 2 + 0.04, d / 2 - 0.055, z - 0.05, w / 2 - 0.04, d / 2 - 0.02, z, col, r=0.012, mid=1)
    elif back_style == 'panel':
        rbox(mb, -w / 2 + 0.04, d / 2 - 0.06, seat + 0.12, w / 2 - 0.04, d / 2 - 0.015, back, col, r=0.02, mid=1)
    elif back_style == 'pad':
        rbox(mb, -w / 2 + 0.03, d / 2 - 0.09, seat + 0.06, w / 2 - 0.03, d / 2 - 0.01, back, seat_col, r=0.04, mid=2)


def bed(P, w, d, frame, blanket, pillow='#fbf8f2', head=0.95, foot=0.45, top=0.5, sheet='#f6f2ea', pillows=2, blanket_fn=None):
    """A bed: a frame with a headboard at the back, a mattress, a blanket over the front of it turned down, pillows."""
    mb = P.main
    rbox(mb, -w / 2, -d / 2, 0.03, w / 2, d / 2, 0.3, frame, r=0.03, mid=2)
    legs(mb, -w / 2, w / 2, -d / 2, d / 2, 0.05, frame, r=0.04, inset=0.05)
    rbox(mb, -w / 2, d / 2 - 0.1, 0.0, w / 2, d / 2, head, frame, r=0.04, mid=2)
    rbox(mb, -w / 2, -d / 2, 0.0, w / 2, -d / 2 + 0.07, foot, frame, r=0.03, mid=2)
    rbox(mb, -w / 2 + 0.04, -d / 2 + 0.07, 0.28, w / 2 - 0.04, d / 2 - 0.1, top - 0.02, fabric(sheet), r=0.05, mid=2)
    # the blanket: over the front two thirds, hanging down the sides, its top edge turned back white
    bl = blanket_fn or fabric(blanket)
    yb = d / 2 - 0.1 - (d - 0.17) * 0.36
    rbox(mb, -w / 2 + 0.01, -d / 2 + 0.06, 0.24, w / 2 - 0.01, yb, top + 0.02, bl, r=0.05, mid=3)
    rbox(mb, -w / 2 + 0.02, yb - 0.12, top - 0.01, w / 2 - 0.02, yb + 0.02, top + 0.045, fabric(sheet), r=0.03, mid=2)
    pw = (w - 0.2) / pillows
    for k in range(pillows):
        x = -w / 2 + 0.1 + pw * (k + 0.5)
        ball(mb, (x, d / 2 - 0.27, top + 0.06), (pw * 0.44, 0.15, 0.07), fabric(pillow), sub=3)


def sofa(P, w, d, col, cushion=None, seat=0.42, back=0.85, arm=0.6, feet='#5a3a2a'):
    mb = P.main
    cushion = cushion or col
    rbox(mb, -w / 2, -d / 2 + 0.02, 0.08, w / 2, d / 2, seat - 0.08, fabric(col), r=0.05, mid=2)
    rbox(mb, -w / 2 + 0.02, d / 2 - 0.24, 0.1, w / 2 - 0.02, d / 2, back, fabric(col), r=0.09, mid=2)
    for s in (-1, 1):
        rbox(mb, s * w / 2 - (0.17 if s > 0 else 0), -d / 2 + 0.02, 0.08, s * w / 2 + (0.17 if s < 0 else 0), d / 2, arm, fabric(col), r=0.08, mid=2)
    n = max(1, round((w - 0.34) / 0.75))
    cw = (w - 0.34) / n
    for k in range(n):
        x0 = -w / 2 + 0.17 + cw * k
        rbox(mb, x0 + 0.01, -d / 2 + 0.04, seat - 0.1, x0 + cw - 0.01, d / 2 - 0.22, seat, fabric(cushion, k), r=0.06, mid=2)
        rbox(mb, x0 + 0.02, d / 2 - 0.34, seat - 0.04, x0 + cw - 0.02, d / 2 - 0.2, back - 0.06, fabric(cushion, k + 3), r=0.07, mid=2)
    for x in (-w / 2 + 0.08, w / 2 - 0.08):
        for y in (-d / 2 + 0.1, d / 2 - 0.08):
            cyl(mb, x, y, 0, 0.09, 0.03, 0.025, feet, seg=8)


def cabinet(P, w, d, h, col, drawers=0, doors=0, knob='#c8a048', top_col=None, plinth=0.06, gap=0.012, cols=1):
    """A chest or cupboard: drawers (rows, in cols across) and/or doors on its front, knobs, a top a little wider."""
    mb = P.main
    rbox(mb, -w / 2 + 0.02, -d / 2 + 0.02, 0.0, w / 2 - 0.02, d / 2, plinth, shade('#3a2a22'), r=0.01, mid=0)
    rbox(mb, -w / 2, -d / 2, plinth, w / 2, d / 2, h - 0.04, col, r=0.025, mid=2)
    rbox(mb, -w / 2 - 0.015, -d / 2 - 0.015, h - 0.045, w / 2 + 0.015, d / 2 + 0.01, h, top_col or col, r=0.02, mid=2)
    fy = -d / 2 - 0.012
    rows = drawers + (1 if doors else 0)
    if rows:
        hh = (h - 0.05 - plinth) / (drawers + (2 if doors else 0)) if drawers else (h - 0.05 - plinth)
        z = h - 0.05
        for r in range(drawers):
            for c in range(cols):
                x0 = -w / 2 + 0.04 + (w - 0.08) * c / cols
                x1 = x0 + (w - 0.08) / cols
                rbox(mb, x0 + gap, fy - 0.006, z - hh + gap, x1 - gap, fy + 0.03, z - gap, col, r=0.012, mid=1)
                ball(mb, ((x0 + x1) / 2, fy - 0.025, z - hh / 2), 0.022, metal(knob), sub=2)
            z -= hh
        if doors:
            for c in range(doors):
                x0 = -w / 2 + 0.04 + (w - 0.08) * c / doors
                x1 = x0 + (w - 0.08) / doors
                rbox(mb, x0 + gap, fy - 0.006, plinth + gap, x1 - gap, fy + 0.03, z - gap, col, r=0.015, mid=1)
                kx = x1 - 0.06 if c % 2 == 0 else x0 + 0.06
                rbox(mb, kx - 0.012, fy - 0.03, (plinth + z) / 2 - 0.06, kx + 0.012, fy - 0.004, (plinth + z) / 2 + 0.06, metal(knob), r=0.008, mid=0)
    P.top(h)


def books(mb, x0, x1, y0, y1, z, hmax, rng, cols=('#c8384a', '#3a6ac8', '#e8b030', '#4a9a5a', '#8a4ac0', '#e86a3a', '#2a2a4a', '#f2e8d0')):
    """A row of books standing on a shelf (random widths, heights and colors), the last ones leaning."""
    x = x0
    while x < x1 - 0.03:
        bw = rng.uniform(0.035, 0.07)
        if x + bw > x1:
            break
        bh = hmax * rng.uniform(0.7, 1.0)
        c = rng.choice(cols)
        rbox(mb, x, y0 + rng.uniform(0, 0.03), z, x + bw - 0.004, y1, z + bh, paint(c, 0.05), r=0.006, mid=0)
        if rng.random() < 0.5:
            rbox(mb, x + 0.004, y0 - 0.002, z + bh * 0.7, x + bw - 0.008, y0 + 0.005, z + bh * 0.78, shade('#e8d8a0'), r=0.002, mid=0)
        x += bw
        if rng.random() < 0.08:
            x += rng.uniform(0.05, 0.12)


def shelf(P, w, d, h, col, rows=4, fill='books', back_col=None, side=0.035):
    """An open shelf unit: sides, a back, shelves, filled (books, jars, or a function(mb, x0, x1, y0, y1, z, hh))."""
    mb = P.main
    rbox(mb, -w / 2, -d / 2, 0, -w / 2 + side, d / 2, h, col, r=0.012, mid=1)
    rbox(mb, w / 2 - side, -d / 2, 0, w / 2, d / 2, h, col, r=0.012, mid=1)
    rbox(mb, -w / 2, d / 2 - 0.025, 0, w / 2, d / 2, h, back_col or col, r=0.008, mid=1)
    hh = (h - 0.08) / rows
    for r in range(rows + 1):
        z = 0.04 + hh * r
        rbox(mb, -w / 2 + 0.01, -d / 2, z - 0.025, w / 2 - 0.01, d / 2 - 0.01, z + (0.03 if r == rows else 0.0), col, r=0.01, mid=1)
        if r < rows and fill:
            y0, y1, x0, x1 = -d / 2 + 0.04, d / 2 - 0.04, -w / 2 + side + 0.02, w / 2 - side - 0.02
            if fill == 'books':
                books(mb, x0, x1, y0, y1, z, hh * 0.78, P.rng)
            elif callable(fill):
                fill(mb, x0, x1, y0, y1, z, hh, P.rng)
    P.top(h + 0.03)


def jars(mb, x0, x1, y0, y1, z, hh, rng, cols=('#e8484a', '#f2c040', '#4aa85a', '#4a7ad8', '#e87ac0', '#f2f0e8')):
    """Cans and jars along a shelf, a label round each."""
    x = x0 + 0.05
    while x < x1 - 0.05:
        r = rng.uniform(0.035, 0.05)
        h = hh * rng.uniform(0.45, 0.7)
        c = rng.choice(cols)

        def lab(p, n, z0=0, z1=1, c=c, h=h):
            t = (p.z - z) / h
            return rgb(c) if 0.2505 <= t <= 0.7495 else rgb('#f4f0e6') if t < 0.25 else rgb('#a8a49c')
        # (rings at the label's edges, so its band shows crisp)
        lathe(mb, [(r, z), (r, z + h * 0.25), (r * 1.005, z + h * 0.251), (r * 1.005, z + h * 0.749), (r, z + h * 0.75), (r, z + h), (r * 0.6, z + h + 0.01), (0, z + h + 0.012)], lab, c=(x, (y0 + y1) / 2, 0), seg=14)
        x += r * 2 + rng.uniform(0.02, 0.05)


def counter(P, w, d, h, top, front, panels=0, trim=None, back_shelf=None, kick='#3a2a22', top_t=0.05):
    """A shop counter: a body with panels across its front, a top a little proud of it, a kick strip at the floor."""
    mb = P.main
    rbox(mb, -w / 2 + 0.02, -d / 2 + 0.03, 0, w / 2 - 0.02, d / 2, 0.07, shade(kick), r=0.01, mid=0)
    rbox(mb, -w / 2, -d / 2, 0.06, w / 2, d / 2, h - top_t, front, r=0.02, mid=2)
    rbox(mb, -w / 2 - 0.03, -d / 2 - 0.04, h - top_t, w / 2 + 0.03, d / 2 + 0.01, h, top, r=0.02, mid=2)
    if panels:
        pw = (w - 0.1) / panels
        for k in range(panels):
            x0 = -w / 2 + 0.05 + pw * k
            rbox(mb, x0 + 0.03, -d / 2 - 0.018, 0.14, x0 + pw - 0.03, -d / 2 + 0.01, h - top_t - 0.08, front, r=0.012, mid=1)
    if trim:
        rbox(mb, -w / 2 - 0.005, -d / 2 - 0.02, h - top_t - 0.05, w / 2 + 0.005, -d / 2 + 0.01, h - top_t - 0.02, trim, r=0.008, mid=0)
    P.top(h)


def floor_lamp(P, shade_col, pole='#c8a048', base='#3a3436', h=1.45, shade_r=(0.12, 0.2), shade_h=0.24, shape='cone'):
    mb = P.main
    lathe(mb, [(0.14, 0.0), (0.15, 0.02), (0.13, 0.05), (0.03, 0.07)], metal(base), seg=24)
    cyl(mb, 0, 0, 0.05, h - shade_h * 0.6, 0.016, 0.016, metal(pole), seg=10)
    r0, r1 = shade_r
    if shape == 'cone':
        lathe(mb, [(r1, h - shade_h), (r1 * 0.98, h - shade_h + 0.01), (r0, h), (r0 * 0.96, h + 0.006)], fabric(shade_col), seg=28, cap_top=False)
    else:
        lathe(mb, [(r0, h - shade_h), (r1, h - shade_h * 0.5), (r0, h)], fabric(shade_col), seg=28, cap_top=False)
    ball(P.glow, (0, 0, h - shade_h * 0.55), 0.05, '#fff2c0', sub=2)


def pot(mb, r0, r1, h, col, rim=None, z=0.0, soil='#4a3020'):
    """A flower pot with a rolled rim and soil at the top."""
    lathe(mb, [(r0, z), (r1, z + h * 0.82)], col_fn(col, under=0.25) if isinstance(col, str) else col, seg=22, cap_top=False, cap_bot=True)
    lathe(mb, [(r1, z + h * 0.82), (r1 * 1.1, z + h * 0.84), (r1 * 1.1, z + h), (r1 * 0.96, z + h)], shade(rim or col) if isinstance(rim or col, str) else (rim or col), seg=22, cap_top=False)
    lathe(mb, [(r1 * 0.96, z + h - 0.012), (0.0, z + h - 0.02)], shade(soil), seg=22, cap_top=False)


def leaf(mb, base, tip, w, col, cup=0.3, sub=2, split=0):
    """A leaf from its base to its tip, w wide at its widest, cupped up a little (split: notches like a monstera's)."""
    m = len(mb.v)
    L = (tip - base).length
    c0, c1 = rgb(col), rgb(col) * 1.25

    def lc(p, n, u=0, v=0):
        return c0.lerp(c1, max(0.0, min(1.0, 0.5 + 0.5 * n.z))) * (0.9 + 0.1 * (p.x / L + 0.5))
    ball(mb, (L / 2, 0, 0), (L / 2, w / 2, 0.012), lc, sub=sub)
    for i in range(m, len(mb.v)):
        q = mb.v[i]
        z = q.z + cup * (q.y ** 2) * 6
        if split and abs(q.y) > w * 0.2:
            z += 0.01 * math.sin(q.x / L * math.pi * split * 2)
        mb.v[i] = Vector((q.x, q.y, z))
    d = (tip - base).normalized()
    yaw = math.atan2(d.y, d.x)
    pitch = -math.asin(max(-1, min(1, d.z)))
    xform(mb, m, Matrix.Translation(base) @ Euler((0, pitch, yaw), 'XYZ').to_matrix().to_4x4())


def glass_box(P, x0, y0, z0, x1, y1, z1, frame='#e8e0d0', r=0.012):
    """A display case's glass (see-through in the game: the clear part) with a thin frame round its edges."""
    rbox(P.clear, x0, y0, z0, x1, y1, z1, col_fn('#e4f4fa', under=0.0), r=r, mid=1)
    for (a, b, c, d) in ((x0, y0, x1, y0 + 0.02), (x0, y1 - 0.02, x1, y1)):
        rbox(P.main, a, b, z1 - 0.02, c, d, z1 + 0.005, frame, r=0.006, mid=0)
    for x in (x0, x1 - 0.02):
        for y in (y0, y1 - 0.02):
            rbox(P.main, x, y, z0, x + 0.02, y + 0.02, z1 + 0.005, frame, r=0.006, mid=0)


