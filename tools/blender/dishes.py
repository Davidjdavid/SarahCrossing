"""The restaurant's dishes and everything Sarah cooks, as miniatures in the dollhouse look (item_dish_<id>, the name of the
dish's picture in the game): on a plate, in a bowl, on a board or in a steamer, each made after its food, so a dish on a
table, at the restaurant or dropped on the island is that dish, not a covered stand-in (pocket_things.py's item_dish
stays for anything that hasn't one).

Colors are in the mesh (no baking), a little darker underneath; glossy parts (glazes, sauces, syrups) are *_gloss.
Units are tiles, z up, -y the front, about a quarter of a tile across (as pocket_things.py's things).

    python tools/blender/dishes.py [--preview DIR] [--only dish_ramen]
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from mathutils import Vector, Matrix, Euler, noise
from common import *
from trees_ac import MB, vmat, rgb, LIGHT
import kit
from kit import col_fn, shade, rbox, lathe, cyl, ball, tube, slab, xform

# (dozens of little pieces each: rounded edges in two steps, and every point shared by its triangles, weld)
kit.DETAIL['lite'] = True


# ---------------------------------------------------------------- the kit
def C(c, mottle=0.04, under=0.14):
    return col_fn(c, mottle=mottle, under=under)


def turn(mb, mark, rx=0.0, ry=0.0, rz=0.0, t=(0, 0, 0)):
    xform(mb, mark, Matrix.Translation(t) @ Euler((rx, ry, rz)).to_matrix().to_4x4())


def plate(mb, r=0.13, col='#fbf8f2', rim=None):
    """a round plate, its rim a color of its own if given; returns the height food sits at"""
    fn = (lambda p, n, *_: rgb(rim) if math.hypot(p.x, p.y) > r * 0.86 else rgb(col)) if rim else (lambda p, n, *_: rgb(col) * (0.92 + 0.08 * n.z))
    lathe(mb, [(0.0, 0.0), (r * 0.72, 0.0), (r * 0.74, 0.006), (r * 0.97, 0.014), (r, 0.02), (r * 0.9, 0.02), (r * 0.72, 0.01), (0.0, 0.01)], fn, seg=32)
    return 0.01


def bowl(mb, r=0.1, h=0.075, col='#fbf8f2', inside=None, fill=None, fz=None):
    """a bowl on its foot; fill: the color of what's in it (a soup, a sauce) at height fz; returns the radius at a height"""
    ins = inside or col
    fn = lambda p, n, *_: rgb(ins) if n.z > 0.2 and math.hypot(p.x, p.y) < r * 0.9 else rgb(col) * (0.88 + 0.12 * max(0.0, -n.y * 0.5 + 0.5))
    lathe(mb, [(0.0, 0.0), (r * 0.42, 0.0), (r * 0.45, 0.012), (r * 0.82, 0.03), (r, h - 0.006), (r * 0.985, h), (r * 0.945, h), (r * 0.93, h - 0.006), (r * 0.78, 0.035), (r * 0.38, 0.02), (0.0, 0.02)], fn, seg=32)
    rad = lambda z: r * 0.38 + (r * 0.93 - r * 0.38) * max(0.0, min(1.0, (z - 0.02) / (h - 0.02)))
    if fill:
        z = fz if fz is not None else h * 0.8
        lathe(mb, [(rad(z), z), (0.0, z)], C(fill, mottle=0.05, under=0.0), seg=32)
    return rad


def board(mb, w=0.22, d=0.11, col='#c8a070'):
    """a wooden serving board (geta) on two little feet; returns the height food sits at"""
    rbox(mb, -w / 2, -d / 2, 0.012, w / 2, d / 2, 0.03, col_fn(col, grain='x', mottle=0.04, under=0.1), r=0.006)
    for x in (-w * 0.35, w * 0.35):
        rbox(mb, x - 0.012, -d / 2 + 0.008, 0.0, x + 0.012, d / 2 - 0.008, 0.014, col_fn('#a07848', under=0.1), r=0.004)
    return 0.03


def rice_mound(mb, c, rx, ry, rz, z, col='#fbf8f0'):
    ball(mb, (c[0], c[1], z), (rx, ry, rz), col_fn(col, mottle=0.08, under=0.05), sub=2)


def cube(mb, x, y, z, s, col, rng=None, h=None):
    a = rng.uniform(0, math.tau) if rng else 0.0
    m = len(mb.v)
    rbox(mb, -s / 2, -s / 2, 0, s / 2, s / 2, h or s, C(col), r=s * 0.28)
    turn(mb, m, 0, 0, a, (x, y, z))


def noodles(mb, rng, r, z0, col, n=14, thick=0.006, lift=0.02):
    """a tangle of noodles over a disc of radius r from height z0"""
    fn = C(col, mottle=0.04, under=0.1)
    for k in range(n):
        a0, rr = rng.uniform(0, math.tau), rng.uniform(0.2, 0.9) * r
        pts = []
        for j in range(7):
            a = a0 + j * 0.55
            q = rr * (0.6 + 0.4 * math.sin(j * 1.3 + k))
            pts.append((math.cos(a) * q, math.sin(a) * q, z0 + lift * (0.5 + 0.5 * math.sin(j + k)) ))
        tube(mb, pts, thick, fn, seg=5)


def sprinkle(mb, rng, r, z, cols, n=12, s=0.008):
    for k in range(n):
        a, q = rng.uniform(0, math.tau), math.sqrt(rng.random()) * r
        ball(mb, (math.cos(a) * q, math.sin(a) * q, z), (s, s, s * 0.7), shade(rng.choice(cols)), sub=1)


def green_onion(mb, rng, r, z, n=8):
    for k in range(n):
        a, q = rng.uniform(0, math.tau), math.sqrt(rng.random()) * r
        cyl(mb, math.cos(a) * q, math.sin(a) * q, z, z + 0.004, 0.009, color=lambda p, nn: rgb('#6ac04a') if math.hypot(p.x - math.cos(a) * q, p.y - math.sin(a) * q) > 0.005 else rgb('#d8f0b0'), seg=8)


def slice_wedge(mb, z, r, h, top, body, crust, a=0.0, layers=None):
    """a slice of cake: a wedge (a fat triangle seen from above) on its crust, its top a color of its own"""
    outline = [(0.0, -r * 0.55), (r * 0.5, r * 0.45), (r * 0.25, r * 0.55), (-r * 0.25, r * 0.55), (-r * 0.5, r * 0.45)]
    m = len(mb.v)
    slab(mb, outline, 0.018, C(crust), axis='z', at=z, r=0.006)
    def fn(p, n):
        if n.z > 0.6:
            return rgb(top) * (0.92 + 0.08 * n.z)
        k = (p.z - z) / h
        for lz, lc in (layers or []):
            if abs(k - lz) < 0.06:
                return rgb(lc)
        return rgb(body) * (0.86 + 0.14 * k)
    slab(mb, outline, h, fn, axis='z', at=z + 0.016, r=0.012)
    turn(mb, m, 0, 0, a)


# ---------------------------------------------------------------- the dishes
def nigiri():
    mb, r = MB(), random.Random(1)
    z = board(mb)
    for k, (x, fish) in enumerate(((-0.06, '#f28a6a'), (0.0, '#d8384a'), (0.06, '#f28a6a'))):
        rbox(mb, x - 0.024, -0.035, z, x + 0.024, 0.035, z + 0.032, col_fn('#fbf8f0', mottle=0.08, under=0.05), r=0.012)
        fat = lambda p, n: rgb(fish).lerp(rgb('#fff0e8'), 0.5 if math.sin(p.y * 160 + p.x * 40) > 0.75 and fish == '#f28a6a' else 0.0)
        rbox(mb, x - 0.028, -0.045, z + 0.028, x + 0.028, 0.045, z + 0.042, fat, r=0.008)
    ball(mb, (0.095, 0.03, z + 0.008), (0.012, 0.012, 0.008), shade('#8cc152'), sub=1)
    return [(mb, 'main')]


def maki_board(spicy=False):
    mb, r = MB(), random.Random(2)
    z = board(mb, 0.24, 0.12)
    for k in range(6):
        x, y = -0.08 + (k % 3) * 0.08, -0.025 + (k // 3) * 0.05
        cyl(mb, x, y, z, z + 0.034, 0.022, color=C('#2a3a2a', mottle=0.06), seg=14)
        cyl(mb, x, y, z + 0.034, z + 0.036, 0.018, color=C('#fbf8f0', mottle=0.08, under=0.0), seg=14)
        cyl(mb, x, y, z + 0.036, z + 0.038, 0.008, color=shade('#d8384a'), seg=10)
        if spicy:
            ball(mb, (x, y, z + 0.04), (0.012, 0.012, 0.006), shade('#f28a3a'), sub=1)
    ball(mb, (0.105, -0.03, z + 0.008), (0.012, 0.012, 0.008), shade('#8cc152'), sub=1)
    rbox(mb, 0.09, 0.0, z, 0.115, 0.045, z + 0.008, shade('#f4b8b0'), r=0.004)
    return [(mb, 'main')]


def don(top='eel'):
    mb, gl, r = MB(), MB(), random.Random(3)
    rad = bowl(mb, 0.1, 0.07, '#2a1e1e', inside='#c0283a')
    rice_mound(mb, (0, 0), rad(0.06) * 0.95, rad(0.06) * 0.95, 0.03, 0.055)
    for k in range(3):
        x = -0.05 + k * 0.05
        m = len(gl.v)
        rbox(gl, -0.022, -0.06, 0, 0.022, 0.06, 0.016, lambda p, n: rgb('#8a4a1e').lerp(rgb('#c87a3a'), 0.5 + 0.5 * math.sin(p.y * 90)), r=0.008)
        turn(gl, m, 0.0, -0.1, 0.2, (x, 0.0, 0.075 + 0.006 * (k % 2)))
    sprinkle(mb, r, 0.06, 0.092, ['#f2e6c8'], n=14, s=0.004)
    green_onion(mb, r, 0.05, 0.09, n=6)
    return [(mb, 'main'), (gl, 'gloss')]


def poke(fish):
    mb, r = MB(), random.Random(4)
    rad = bowl(mb, 0.105, 0.07, '#f2f0ea', inside='#e8f0f8')
    rice_mound(mb, (0, 0), rad(0.06) * 0.95, rad(0.06) * 0.95, 0.025, 0.055)
    for k in range(7):
        a = k * 0.8 + 0.3
        cube(mb, math.cos(a) * 0.04 - 0.02, math.sin(a) * 0.035 + 0.01, 0.068, 0.024, fish, r)
    for k in range(3):
        m = len(mb.v)
        rbox(mb, -0.01, -0.03, 0, 0.01, 0.03, 0.01, lambda p, n: rgb('#8cc152') if p.x < 0.004 else rgb('#d8e890'), r=0.005)
        turn(mb, m, 0, 0.3, 0.4 + k * 0.2, (0.045 + k * 0.016, -0.03 + k * 0.012, 0.075))
    sprinkle(mb, r, 0.03, 0.082, ['#7acc5e'], n=5, s=0.008)
    tube(mb, [(-0.06, 0.05, 0.075), (-0.03, 0.06, 0.08), (0.0, 0.055, 0.076)], 0.008, shade('#2a4a2a'), seg=5)
    return [(mb, 'main')]


def pad_thai():
    mb, r = MB(), random.Random(5)
    z = plate(mb, 0.13, '#f2f0ea', rim='#4a7ad8')
    noodles(mb, r, 0.08, z + 0.01, '#e8b878', n=16, thick=0.007)
    for k in range(3):
        a = k * 2.1
        m = len(mb.v)
        tube(mb, [(0.0, 0.0, 0.0), (0.012, 0.01, 0.004), (0.02, 0.0, 0.006), (0.014, -0.012, 0.004)], 0.008, shade('#f28a6a'), seg=6)
        turn(mb, m, 0, 0, a, (math.cos(a) * 0.04, math.sin(a) * 0.04, z + 0.035))
    sprinkle(mb, r, 0.06, z + 0.04, ['#c89050', '#d8a060'], n=14, s=0.006)
    m = len(mb.v)
    lathe(mb, [(0.0, 0.0), (0.025, 0.0), (0.0, 0.03)], lambda p, n, *_: rgb('#8cc152') if n.z < 0.5 else rgb('#d8f0a0'), seg=10)
    turn(mb, m, 0, 1.4, 0.4, (0.085, -0.05, z + 0.01))
    return [(mb, 'main')]


def curry_bowl(sauce, bits, leaf='#3a8a3a'):
    mb, gl, r = MB(), MB(), random.Random(6)
    bowl(mb, 0.105, 0.07, '#f2f0ea', fill=sauce, fz=0.058)
    for k in range(9):
        a, q = k * 2.4 + r.uniform(-0.3, 0.3), 0.015 + 0.05 * math.sqrt((k + 0.5) / 9)
        cube(mb, math.cos(a) * q, math.sin(a) * q, 0.054, 0.022, bits[k % len(bits)], r, h=0.016)
    for k in range(3):
        a = k * 2.0 + 0.4
        m = len(mb.v)
        ball(mb, (0, 0, 0), (0.016, 0.008, 0.003), shade(leaf), sub=2)
        turn(mb, m, 0, 0, a, (math.cos(a) * 0.035, math.sin(a) * 0.035, 0.064))
    return [(mb, 'main'), (gl, 'gloss')]


def mango_sticky():
    mb, r = MB(), random.Random(7)
    z = plate(mb, 0.13, '#f2f0ea')
    rice_mound(mb, (-0.035, 0.01), 0.05, 0.045, 0.035, z + 0.01)
    for k in range(5):
        m = len(mb.v)
        ball(mb, (0, 0, 0), (0.04, 0.014, 0.01), C('#ffc33a', mottle=0.03), sub=2)
        turn(mb, m, 0, 0, -0.5 + k * 0.25, (0.05 + k * 0.004, -0.04 + k * 0.022, z + 0.012 + k * 0.004))
    lathe(mb, [(0.025, z + 0.044), (0.0, z + 0.046)], shade('#fffaf0'), c=(-0.035, 0.01, 0), seg=16)
    sprinkle(mb, r, 0.02, z + 0.048, ['#f2e6c8'], n=5, s=0.004)
    return [(mb, 'main')]


def dumplings():
    """a bamboo steamer with four pleated dumplings in it"""
    mb, r = MB(), random.Random(8)
    lathe(mb, [(0.0, 0.0), (0.115, 0.0), (0.12, 0.012), (0.12, 0.05), (0.11, 0.05), (0.108, 0.012), (0.0, 0.012)], lambda p, n, *_: rgb('#d8b878') * (0.82 + 0.18 * (math.sin(p.z * 260) > 0)), seg=32)
    for k in range(4):
        a = k * math.pi / 2 + 0.4
        x, y = math.cos(a) * 0.05, math.sin(a) * 0.05
        ball(mb, (x, y, 0.03), (0.034, 0.03, 0.026), C('#f6f0e2', mottle=0.03), sub=2)
        for j in range(5):
            b = j * 0.6 - 1.2
            ball(mb, (x + math.cos(b + a) * 0.005, y + math.sin(b + a) * 0.005, 0.054), (0.008, 0.008, 0.008), C('#f0e8d4'), sub=1)
    return [(mb, 'main')]


def plate_bits(base, bits, n=12, rim=None, extra=None):
    """a plate heaped with pieces (stir-fries, kung pao, salads)"""
    mb, r = MB(), random.Random(9 + n)
    z = plate(mb, 0.13, base, rim=rim)
    for k in range(n):
        a, q = r.uniform(0, math.tau), math.sqrt(r.random()) * 0.075
        col, s = r.choice(bits)
        cube(mb, math.cos(a) * q, math.sin(a) * q, z + 0.004 + r.uniform(0, 0.012), s, col, r, h=s * 0.8)
    if extra:
        extra(mb, r, z)
    return [(mb, 'main')]


def kungpao():
    return plate_bits('#f2f0ea', [('#a8582a', 0.026), ('#a8582a', 0.024), ('#d8b878', 0.014), ('#e0303a', 0.016), ('#6ac04a', 0.012)], n=18, rim='#c0283a')


def stir_fry():
    def broccoli(mb, r, z):
        for k in range(4):
            a = k * 1.6
            x, y = math.cos(a) * 0.05, math.sin(a) * 0.05
            cyl(mb, x, y, z, z + 0.02, 0.006, color=shade('#8cc152'), seg=6)
            ball(mb, (x, y, z + 0.026), 0.016, C('#3a8a3a', mottle=0.12), sub=2)
    return plate_bits('#f2f0ea', [('#f28a3a', 0.02), ('#e0303a', 0.018), ('#ffd84a', 0.018), ('#f6f0e2', 0.016)], n=14, extra=broccoli)


def fried_rice():
    mb, r = MB(), random.Random(10)
    z = plate(mb, 0.13, '#f2f0ea', rim='#4a7ad8')
    ball(mb, (0, 0, z + 0.01), (0.085, 0.08, 0.045), col_fn('#f0d890', mottle=0.2, under=0.05), sub=3)
    for k in range(18):
        a, q = r.uniform(0, math.tau), math.sqrt(r.random()) * 0.07
        zz = z + 0.01 + 0.045 * math.sqrt(max(0.0, 1 - (q / 0.085) ** 2))
        c = r.choice(('#6ac04a', '#f28a3a', '#ffd84a'))
        ball(mb, (math.cos(a) * q, math.sin(a) * q, zz), 0.007, shade(c), sub=1)
    return [(mb, 'main')]


def truffles():
    mb, r = MB(), random.Random(11)
    z = plate(mb, 0.12, '#f2f0ea')
    for k, (x, y, c) in enumerate(((-0.04, -0.03, '#5a3020'), (0.04, -0.03, '#7a4a30'), (-0.04, 0.04, '#3a2018'), (0.04, 0.04, '#c89a6a'))):
        lathe(mb, [(0.0, z), (0.026, z), (0.03, z + 0.016), (0.027, z + 0.016)], lambda p, n, *_: rgb('#c8a878') * (0.85 + 0.15 * (math.sin(math.atan2(p.y - y, p.x - x) * 12) > 0)), c=(x, y, 0), seg=24, cap_top=False)
        ball(mb, (x, y, z + 0.026), 0.024, col_fn(c, mottle=0.12, under=0.1), sub=2)
    return [(mb, 'main')]


def cake_slice(top, body, crust='#d8a060', layers=None, berries=None, cream=None):
    mb, gl, r = MB(), MB(), random.Random(12)
    z = plate(mb, 0.12, '#f2f0ea')
    slice_wedge(mb, z, 0.15, 0.05, top, body, crust, a=-0.3, layers=layers)
    if berries:
        for k in range(berries[1]):
            ball(gl, (-0.02 + (k % 3) * 0.022, 0.02 + (k // 3) * 0.02, z + 0.074), 0.013, shade(berries[0]), sub=2)
    if cream:
        for (x, y) in ((-0.03, 0.04), (0.0, 0.05), (0.03, 0.04)):
            ball(mb, (x, y, z + 0.074), (0.014, 0.014, 0.012), shade('#fffaf2'), sub=2)
            if cream == 'strawberry':
                ball(gl, (x, y, z + 0.09), (0.011, 0.011, 0.014), shade('#e0303a'), sub=2)
    return [(mb, 'main'), (gl, 'gloss')]


def fruit_salad():
    mb, gl, r = MB(), MB(), random.Random(13)
    bowl(mb, 0.1, 0.065, '#e8f4fa', inside='#d8eef8', fill='#fff0d0', fz=0.05)
    for k in range(16):
        a, q = r.uniform(0, math.tau), math.sqrt(r.random()) * 0.065
        c = r.choice(('#e0303a', '#ffc33a', '#8cc152', '#ff8a3a', '#7a4ad8', '#f2f0ea'))
        if r.random() < 0.5:
            ball(gl, (math.cos(a) * q, math.sin(a) * q, 0.062), 0.013, shade(c), sub=2)
        else:
            cube(mb, math.cos(a) * q, math.sin(a) * q, 0.052, 0.02, c, r)
    return [(mb, 'main'), (gl, 'gloss')]


def cuke_salad():
    mb, r = MB(), random.Random(14)
    z = plate(mb, 0.12, '#f2f0ea', rim='#3a8a5a')
    for k in range(9):
        a, q = r.uniform(0, math.tau), math.sqrt(r.random()) * 0.07
        x, y = math.cos(a) * q, math.sin(a) * q
        cyl(mb, x, y, z + 0.003 * k, z + 0.003 * k + 0.008, 0.02, color=lambda p, n: rgb('#3a8a3a') if math.hypot(p.x - x, p.y - y) > 0.016 else rgb('#d8f0b0'), seg=14)
    sprinkle(mb, r, 0.07, z + 0.035, ['#f2e6c8', '#e0303a'], n=12, s=0.004)
    return [(mb, 'main')]


def edamame_bowl():
    mb, r = MB(), random.Random(15)
    rad = bowl(mb, 0.1, 0.065, '#2a2a32', inside='#3a3a44')
    for k in range(13):
        a, q = r.uniform(0, math.tau), math.sqrt(r.random()) * 0.06
        m = len(mb.v)
        for j in range(3):
            ball(mb, ((j - 1) * 0.014, 0, 0), (0.011, 0.009, 0.008), C('#7acc5e', mottle=0.06), sub=2)
        turn(mb, m, 0, 0, r.uniform(0, math.tau), (math.cos(a) * q, math.sin(a) * q, 0.055 + r.uniform(0, 0.012)))
    sprinkle(mb, r, 0.05, 0.072, ['#ffffff'], n=8, s=0.003)
    return [(mb, 'main')]


def lychee_ice():
    """three scoops of pale pink sorbet in a glass, a peeled lychee and one in its red shell beside them, a mint leaf"""
    mb, gl, r = MB(), MB(), random.Random(16)
    lathe(gl, [(0.0, 0.0), (0.045, 0.0), (0.04, 0.008), (0.012, 0.016), (0.011, 0.04), (0.05, 0.05), (0.078, 0.07), (0.082, 0.075), (0.076, 0.075), (0.046, 0.056), (0.0, 0.052)],
          lambda p, n, *_: rgb('#cfe6ee') * (0.9 + 0.1 * n.z), seg=28)
    sorbet = lambda p, n: rgb('#fbe4ea').lerp(rgb('#f6c4d2'), 0.5 + 0.5 * noise.noise(p * 70)) * (0.94 + 0.06 * n.z)
    for k in range(3):
        a = k * math.tau / 3 + 0.5
        ball(mb, (math.cos(a) * 0.03, math.sin(a) * 0.03, 0.082), 0.033, sorbet, sub=2)
    ball(mb, (0.0, 0.0, 0.115), 0.03, sorbet, sub=2)
    ball(gl, (0.03, -0.04, 0.1), (0.016, 0.016, 0.019), shade('#f8f4ea'), sub=2)
    ball(mb, (-0.03, -0.045, 0.095), 0.018, lambda p, n: rgb('#d8384a') * (0.8 + 0.2 * (noise.noise(p * 400) > 0)), sub=2)
    m = len(mb.v)
    ball(mb, (0, 0, 0), (0.016, 0.008, 0.003), shade('#4aa84a'), sub=2)
    turn(mb, m, 0.3, 0, 0.7, (0.004, 0.012, 0.146))
    return [(mb, 'main'), (gl, 'gloss')]


def soup_bowl(broth, bits, cream=None, herbs=True, col='#f2f0ea', inside=None):
    mb, gl, r = MB(), MB(), random.Random(17)
    bowl(mb, 0.105, 0.07, col, inside=inside)
    lathe(gl, [(0.086, 0.058), (0.0, 0.058)], C(broth, mottle=0.04, under=0.0), seg=32)
    for (c, s, n) in bits:
        for k in range(n):
            a, q = r.uniform(0, math.tau), math.sqrt(r.random()) * 0.06
            cube(mb, math.cos(a) * q, math.sin(a) * q, 0.052, s, c, r, h=s * 0.7)
    if cream:
        tube(mb, [(math.cos(t) * (0.004 + t * 0.0045), math.sin(t) * (0.004 + t * 0.0045), 0.0595) for t in [k * 0.35 for k in range(34)]], 0.0035, shade(cream), seg=5)
    if herbs:
        green_onion(mb, r, 0.05, 0.06, n=5)
    return [(mb, 'main'), (gl, 'gloss')]


def tom_yum():
    out = soup_bowl('#f28a3a', [('#f28a6a', 0.024, 3), ('#d8c8a8', 0.02, 4)])
    return out


def chowder():
    """in a bread bowl on a plate, its lid beside it"""
    mb, r = MB(), random.Random(18)
    z = plate(mb, 0.14, '#f2f0ea', rim='#3a6aa8')
    crust = lambda p, n, *_: rgb('#c8803a').lerp(rgb('#8a5020'), 0.35 * max(0.0, n.z)) * (0.9 + 0.1 * noise.noise(p * 60))
    m = len(mb.v)
    lathe(mb, [(0.0, 0.0), (0.07, 0.0), (0.088, 0.026), (0.086, 0.052), (0.075, 0.066), (0.06, 0.066), (0.056, 0.062), (0.0, 0.058)], crust, seg=32)
    lathe(mb, [(0.057, 0.061), (0.0, 0.061)], C('#f6ecd8', mottle=0.05, under=0.0), seg=32)
    for k in range(5):
        a, q = r.uniform(0, math.tau), r.uniform(0, 0.035)
        cube(mb, math.cos(a) * q, math.sin(a) * q, 0.057, 0.014, r.choice(('#f2dca0', '#e8a8a0', '#f6e8c8')), r, h=0.009)
    green_onion(mb, r, 0.03, 0.062, n=4)
    turn(mb, m, 0, 0, 0, (-0.02, 0.0, z))
    m = len(mb.v)
    lathe(mb, [(0.05, 0.0), (0.056, 0.008), (0.05, 0.02), (0.03, 0.028), (0.0, 0.03)], crust, seg=24)
    turn(mb, m, 0.25, -0.2, 0, (0.075, -0.06, z + 0.004))
    return [(mb, 'main')]


def lobster_roll():
    mb, r = MB(), random.Random(19)
    rbox(mb, -0.12, -0.065, 0.0, 0.12, 0.065, 0.012, shade('#f2e6c8'), r=0.005)
    bun = lambda p, n: rgb('#e8b060').lerp(rgb('#a86a2a'), 0.45 * max(0.0, n.z) + 0.1)
    for s in (-1, 1):
        m = len(mb.v)
        ball(mb, (0, 0, 0), (0.1, 0.028, 0.03), bun, sub=2)
        turn(mb, m, s * 0.25, 0, 0, (0, s * 0.024, 0.04))
    for k in range(9):
        cube(mb, -0.075 + k * 0.019, r.uniform(-0.012, 0.012), 0.05 + r.uniform(0, 0.01), 0.022, r.choice(('#f28a6a', '#f6c0a8', '#e0603a')), r)
    for k in range(4):
        ball(mb, (-0.07 + k * 0.045, 0.02, 0.055), (0.018, 0.01, 0.004), shade('#8cc152'), sub=1)
    return [(mb, 'main')]


def gingerbread():
    mb, r = MB(), random.Random(20)
    z = plate(mb, 0.12, '#f2f0ea', rim='#c0283a')
    body = [(0.0, 0.09), (0.03, 0.08), (0.03, 0.05), (0.075, 0.035), (0.075, 0.015), (0.03, 0.02), (0.05, -0.07), (0.025, -0.08), (0.0, -0.035),
            (-0.025, -0.08), (-0.05, -0.07), (-0.03, 0.02), (-0.075, 0.015), (-0.075, 0.035), (-0.03, 0.05), (-0.03, 0.08)]
    m = len(mb.v)
    slab(mb, body, 0.016, col_fn('#c8783a', mottle=0.06, under=0.1), axis='z', at=z, r=0.006)
    turn(mb, m, 0, 0, 0.2)
    for (x, y) in ((-0.012, 0.072), (0.012, 0.072), (0.0, 0.03), (0.0, 0.005)):
        ball(mb, (x, y, z + 0.018), 0.006, shade('#fbf8f2'), sub=1)
    tube(mb, [(-0.012, 0.055, z + 0.018), (0.0, 0.05, z + 0.018), (0.012, 0.055, z + 0.018)], 0.003, shade('#fbf8f2'), seg=4)
    return [(mb, 'main')]


def mac_cheese():
    mb, r = MB(), random.Random(21)
    lathe(mb, [(0.0, 0.0), (0.08, 0.0), (0.09, 0.05), (0.095, 0.055), (0.088, 0.055), (0.084, 0.052), (0.0, 0.05)], lambda p, n, *_: rgb('#f2f0ea') if n.z < 0.5 or math.hypot(p.x, p.y) > 0.086 else rgb('#f2b830'), seg=28)
    for k in range(18):
        a, q = r.uniform(0, math.tau), math.sqrt(r.random()) * 0.065
        m = len(mb.v)
        tube(mb, [(math.cos(t) * 0.01, math.sin(t) * 0.01, 0) for t in (0.0, 0.8, 1.6, 2.4)], 0.005, C('#f8c840', mottle=0.03), seg=5)
        turn(mb, m, 0, 0, r.uniform(0, math.tau), (math.cos(a) * q, math.sin(a) * q, 0.056))
    sprinkle(mb, r, 0.06, 0.06, ['#c8803a'], n=10, s=0.005)
    return [(mb, 'main')]


def creme_brulee():
    mb, gl, r = MB(), MB(), random.Random(22)
    lathe(mb, [(0.0, 0.0), (0.075, 0.0), (0.08, 0.04), (0.085, 0.045), (0.075, 0.045), (0.0, 0.04)], lambda p, n, *_: rgb('#fbfaf8') * (0.86 + 0.14 * (math.sin(math.atan2(p.y, p.x) * 18) > 0)) if n.z < 0.5 else rgb('#fbfaf8'), seg=36)
    lathe(gl, [(0.074, 0.042), (0.0, 0.042)], lambda p, n, *_: rgb('#d8902a').lerp(rgb('#8a4a1a'), 0.4 * (0.5 + 0.5 * noise.noise(p * 50))), seg=28)
    ball(gl, (0.02, 0.01, 0.05), 0.011, shade('#3a3a8a'), sub=2)
    ball(gl, (0.034, -0.004, 0.05), 0.011, shade('#e0303a'), sub=2)
    ball(mb, (0.01, 0.025, 0.048), (0.012, 0.006, 0.003), shade('#3a8a3a'), sub=1)
    return [(mb, 'main'), (gl, 'gloss')]


def ramen():
    mb, gl, r = MB(), MB(), random.Random(23)
    bowl(mb, 0.11, 0.075, '#c0283a', inside='#f2f0ea')
    lathe(gl, [(0.092, 0.062), (0.0, 0.062)], C('#e8b878', mottle=0.03, under=0.0), seg=32)
    noodles(mb, r, 0.05, 0.06, '#f2d898', n=8, thick=0.005, lift=0.008)
    # half an egg, the chashu, a sheet of nori, the naruto
    m = len(mb.v)
    ball(mb, (0, 0, 0), (0.024, 0.018, 0.014), shade('#fbf8f2'), sub=2)
    ball(mb, (0, -0.002, 0.008), (0.012, 0.01, 0.008), shade('#f8a830'), sub=2)
    turn(mb, m, 0, 0, 0.3, (0.035, -0.03, 0.062))
    for k in range(2):
        m = len(mb.v)
        lathe(mb, [(0.0, 0.0), (0.024, 0.0), (0.026, 0.008), (0.0, 0.008)], lambda p, n, *_: rgb('#c8784a') if math.hypot(p.x, p.y) > 0.018 else rgb('#f2d8c0'), seg=16)
        turn(mb, m, 0.3, 0, 0, (-0.03 + k * 0.022, 0.025, 0.063 + k * 0.004))
    rbox(mb, 0.05, 0.0, 0.05, 0.058, 0.04, 0.1, shade('#2a3a2a'), r=0.003)
    cyl(mb, -0.04, -0.03, 0.062, 0.068, 0.014, color=lambda p, n: rgb('#f2a8c0') if 0.004 < math.hypot(p.x + 0.04, p.y + 0.03) < 0.008 else rgb('#fbf8f2'), seg=14)
    green_onion(mb, r, 0.06, 0.066, n=6)
    return [(mb, 'main'), (gl, 'gloss')]


def mochi():
    mb, r = MB(), random.Random(24)
    z = plate(mb, 0.11, '#2a2a32')
    for k, (x, y, c) in enumerate(((-0.035, 0.0, '#f8b8c8'), (0.035, 0.0, '#fbf8f2'), (0.0, 0.035, '#a8d890'))):
        ball(mb, (x, y, z + 0.022), (0.03, 0.03, 0.024), C(c, mottle=0.02, under=0.08), sub=2)
    return [(mb, 'main')]


def takoyaki():
    mb, r = MB(), random.Random(25)
    rbox(mb, -0.11, -0.06, 0.0, 0.11, 0.06, 0.02, col_fn('#d8b878', grain='x', under=0.1), r=0.006)
    for k in range(6):
        x, y = -0.07 + (k % 3) * 0.07, -0.024 + (k // 3) * 0.048
        ball(mb, (x, y, 0.038), 0.024, lambda p, n: rgb('#c8803a').lerp(rgb('#6a3a1a'), 0.55 * max(0.0, n.z)), sub=2)
        tube(mb, [(x - 0.015, y - 0.01, 0.062), (x, y + 0.01, 0.063), (x + 0.015, y - 0.01, 0.062)], 0.003, shade('#fbf8f0'), seg=4)
    sprinkle(mb, r, 0.09, 0.064, ['#d8a878', '#6ac04a'], n=16, s=0.004)
    return [(mb, 'main')]


def pancakes():
    mb, gl, r = MB(), MB(), random.Random(26)
    z = plate(mb, 0.12, '#f2f0ea')
    for k in range(3):
        cyl(mb, 0, 0, z + k * 0.018, z + k * 0.018 + 0.017, 0.07 - k * 0.002, color=lambda p, n: rgb('#d8903a') if abs(n.z) > 0.5 else rgb('#f2d090'), seg=28, round_=0.006)
    rbox(mb, -0.016, -0.012, z + 0.054, 0.016, 0.012, z + 0.068, shade('#fff0a0'), r=0.004)
    lathe(gl, [(0.055, z + 0.055), (0.0, z + 0.055)], shade('#a85a1a'), seg=24)
    for a in (0.5, 2.3, 4.0):
        tube(gl, [(math.cos(a) * 0.055, math.sin(a) * 0.055, z + 0.055), (math.cos(a) * 0.07, math.sin(a) * 0.07, z + 0.04), (math.cos(a) * 0.072, math.sin(a) * 0.072, z + 0.02)], 0.005, shade('#a85a1a'), seg=5, r1=0.003)
    ball(gl, (0.03, 0.03, z + 0.06), 0.011, shade('#e0303a'), sub=2)
    return [(mb, 'main'), (gl, 'gloss')]


def mooncakes():
    mb, r = MB(), random.Random(27)
    z = plate(mb, 0.12, '#f2f0ea', rim='#c0283a')
    for k, (x, y) in enumerate(((-0.035, -0.01), (0.04, 0.02))):
        cyl(mb, x, y, z, z + 0.03, 0.034, color=lambda p, n: rgb('#c8803a').lerp(rgb('#8a4a1a'), 0.3 * (n.z > 0.5) * (0.5 + 0.5 * math.sin(math.hypot(p.x - x, p.y - y) * 300))), seg=24, round_=0.008)
        for j in range(8):
            a = j * math.tau / 8
            ball(mb, (x + math.cos(a) * 0.034, y + math.sin(a) * 0.034, z + 0.015), 0.008, shade('#c8803a'), sub=1)
    m = len(mb.v)
    slab(mb, [(-0.012, 0.0), (0.012, 0.0), (0.0, 0.03)], 0.016, shade('#d8a060'), axis='z', at=z, r=0.003)
    turn(mb, m, 0, 0, 0.5, (0.02, -0.06, 0.0))
    return [(mb, 'main')]


def chili_crisp():
    """noodles in a bowl, chili crisp spooned over them"""
    mb, gl, r = MB(), MB(), random.Random(28)
    bowl(mb, 0.1, 0.07, '#fbf8f2', inside='#f2f0ea')
    noodles(mb, r, 0.06, 0.05, '#f2d898', n=14, thick=0.006, lift=0.015)
    lathe(gl, [(0.035, 0.068), (0.0, 0.07)], shade('#c8301a'), c=(0.01, 0.0, 0), seg=18)
    sprinkle(mb, r, 0.04, 0.072, ['#8a2a1a', '#e0603a', '#f2e6c8'], n=16, s=0.005)
    green_onion(mb, r, 0.05, 0.072, n=5)
    return [(mb, 'main'), (gl, 'gloss')]


# (Captain Shrimpy's dishes from his travels, 6zr_seafarer.js)
def sailor_stew():
    """a hearty stew in a blue-rimmed bowl: fish, carrot and tomato"""
    out = soup_bowl('#b8743a', [('#f6ecd8', 0.024, 4), ('#f08a2a', 0.018, 4), ('#d8402a', 0.016, 3)], col='#f2f0ea', inside='#3a6aa8')
    return out


def fish_tacos():
    """two soft tacos side by side on a plate, a lime wedge"""
    mb, r = MB(), random.Random(41)
    z = plate(mb, 0.135, '#f2f0ea')
    shell = lambda p, n, *_: rgb('#f2cf80').lerp(rgb('#c8902e'), 0.25 + 0.15 * noise.noise(p * 90))
    half = [(math.cos(t) * 0.048, math.sin(t) * 0.042) for t in [math.pi * (1 - k / 12) for k in range(13)]]
    for s in (-1, 1):
        x0 = s * 0.052
        # the folded tortilla: two half rounds leaning apart, standing on the fold, the filling between
        for side in (-1, 1):
            m = len(mb.v)
            slab(mb, half, 0.004, shell, axis='y', at=-0.002, r=0.0)
            turn(mb, m, side * 0.32, 0, 0, (x0, side * 0.006, z + 0.002))
        for k in range(6):
            cube(mb, x0 - 0.03 + k * 0.012, r.uniform(-0.006, 0.006), z + 0.026 + r.uniform(0, 0.008), 0.014, r.choice(('#f6ecd8', '#f6ecd8', '#e8403a', '#8cc152')), r, h=0.012)
        for k in range(4):
            ball(mb, (x0 - 0.027 + k * 0.018, 0.0, z + 0.04), (0.011, 0.012, 0.005), shade('#8cc152'), sub=1)
    m = len(mb.v)
    ball(mb, (0, 0, 0), (0.022, 0.012, 0.012), lambda p, n: rgb('#9ad84a') if n.y < 0.3 else rgb('#e8f6c0'), sub=2)
    turn(mb, m, 0, 0, 0.4, (0.07, -0.085, z + 0.01))
    return [(mb, 'main')]


def pumpkin_soup():
    """orange and smooth, a swirl of cream, in a little pumpkin-colored bowl"""
    return soup_bowl('#f2a03a', [('#c86a1e', 0.012, 3)], cream='#fbf8f2', herbs=True, col='#e8603e', inside='#f6f0e2')


def grilled_corn():
    """two cobs off the grill on a long plate, charred stripes and a dusting of chili"""
    mb, r = MB(), random.Random(43)
    rbox(mb, -0.12, -0.06, 0.0, 0.12, 0.06, 0.012, shade('#f2f0ea'), r=0.006)
    for s in (-1, 1):
        y = s * 0.026
        kern = lambda p, n, y=y: (rgb('#7a4a1e') if (int((p.x + 0.2) * 70) % 4 == 0) else rgb('#f6d040').lerp(rgb('#d8a020'), 0.5 + 0.5 * noise.noise(p * 300))) * (0.86 + 0.14 * max(0.0, n.z))
        m = len(mb.v)
        tube(mb, [(-0.085, 0, 0), (0.0, 0, 0.002), (0.085, 0, 0)], 0.022, kern, seg=12, r1=0.018)
        turn(mb, m, 0, 0, 0, (0.0, y, 0.034))
        tube(mb, [(0.085, y, 0.034), (0.105, y, 0.034)], 0.01, shade('#e8d8a8'), seg=6)
    sprinkle(mb, r, 0.06, 0.056, ['#d8402a', '#c03020'], n=14, s=0.004)
    return [(mb, 'main')]


# (Muggy's café drinks, 6zs_mug.js: item_drink_<id>)
def cafe_mug(top, foam=None, art=None, cream=None, drizzle=None, col='#f6eedc', band='#3a6aa8'):
    """a café mug on its saucer: what's in it, latte art, whipped cream"""
    mb, gl, r = MB(), MB(), random.Random(51)
    lathe(mb, [(0.0, 0.0), (0.075, 0.0), (0.08, 0.008), (0.06, 0.012), (0.0, 0.012)], shade('#fbf8f2'), seg=28)
    cup = lambda p, n, *_: rgb(band) if 0.045 < p.z < 0.055 else rgb(col) * (0.9 + 0.1 * max(0.0, -n.y * 0.5 + 0.5))
    lathe(mb, [(0.0, 0.012), (0.034, 0.012), (0.042, 0.03), (0.046, 0.085), (0.044, 0.088), (0.04, 0.088), (0.038, 0.03), (0.0, 0.02)], cup, seg=28)
    tube(mb, [(0.044, 0.0, 0.074), (0.07, 0.0, 0.07), (0.072, 0.0, 0.04), (0.044, 0.0, 0.034)], 0.007, shade(col), seg=6)
    lathe(gl, [(0.04, 0.08), (0.0, 0.08)], C(top, mottle=0.03, under=0.0), seg=28)
    if foam:
        lathe(mb, [(0.039, 0.081), (0.025, 0.083), (0.0, 0.0835)], C(foam, mottle=0.02, under=0.0), seg=28)
    if art:
        # a heart poured in the foam
        for k in range(14):
            t = k / 14 * math.tau
            x, y = 16 * math.sin(t) ** 3, 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
            ball(mb, (x * 0.0011, y * 0.0011 + 0.002, 0.0838), (0.004, 0.004, 0.0006), shade(art), sub=1)
    if cream:
        for k, (q, z) in enumerate(((0.03, 0.09), (0.022, 0.102), (0.012, 0.112), (0.0, 0.12))):
            lathe(mb, [(q + 0.006, z - 0.006), (q + 0.006, z), (q, z + 0.008), (0.0, z + 0.008)], C(cream, mottle=0.02, under=0.05), seg=20)
        if drizzle:
            tube(gl, [(math.cos(t) * (0.024 - t * 0.0018), math.sin(t) * (0.024 - t * 0.0018), 0.1 + t * 0.0018) for t in [k * 0.4 for k in range(28)]], 0.0022, shade(drizzle), seg=4)
    return [(mb, 'main'), (gl, 'gloss')]


def iced_coffee():
    """a tall glass, coffee swirled with milk, ice cubes and a striped straw"""
    mb, gl, r = MB(), MB(), random.Random(52)
    # (the glass is only its foot and rim, so the swirl of milk shows: nothing in the game draws glass see-through)
    lathe(gl, [(0.0, 0.0), (0.036, 0.0), (0.04, 0.004), (0.04, 0.01), (0.0, 0.01)], col_fn('#d8eef4', under=0.0), seg=24)
    lathe(gl, [(0.041, 0.128), (0.045, 0.13), (0.045, 0.138), (0.042, 0.14), (0.04, 0.132)], col_fn('#e8f6fa', under=0.0), seg=24)
    milk = lambda p, n, *_: rgb('#8a5a34').lerp(rgb('#ead8bc'), max(0.0, min(1.0, (p.z - 0.04) / 0.07 + 0.25 * math.sin(math.atan2(p.y, p.x) * 3)))) * (0.92 + 0.08 * max(0.0, -n.y))
    lathe(mb, [(0.0, 0.01), (0.037, 0.01), (0.042, 0.13), (0.0, 0.13)], milk, seg=24)
    for k in range(4):
        a = k / 4 * math.tau + 0.3
        cube(gl, math.cos(a) * 0.016, math.sin(a) * 0.016, 0.122 + (k % 2) * 0.006, 0.018, '#f4fbff', r, h=0.016)
    straw = lambda p, n, *_: rgb('#e8403a') if int(p.z * 120) % 2 else rgb('#ffffff')
    tube(mb, [(0.01, 0.0, 0.03), (0.016, 0.0, 0.17), (0.03, 0.0, 0.19)], 0.004, straw, seg=6)
    return [(mb, 'main'), (gl, 'gloss')]


DISHES = {
    'dish_nigiri': nigiri, 'dish_tuna_roll': maki_board, 'dish_spicy_tuna': lambda: maki_board(True), 'dish_unagi_don': don,
    'dish_ahi_poke': lambda: poke('#d8384a'), 'dish_salmon_poke': lambda: poke('#f28a6a'), 'dish_pad_thai': pad_thai,
    'dish_green_curry': lambda: curry_bowl('#9ac85a', ['#f2e6c8', '#f6f0e2', '#c8a070']), 'dish_mango_sticky': mango_sticky,
    'dish_mapo_tofu': lambda: curry_bowl('#d8402a', ['#fbf8f0', '#fbf8f0', '#f2f0e6'], leaf='#6ac04a'), 'dish_dumplings': dumplings,
    'dish_kungpao': kungpao, 'dish_chili_crisp': chili_crisp, 'dish_fried_rice': fried_rice, 'dish_truffles': truffles,
    'dish_cheesecake': lambda: cake_slice('#f6e8c8', '#fbf2dc'), 'dish_cherry_cheesecake': lambda: cake_slice('#c0283a', '#fbf2dc', berries=('#c0283a', 5)),
    'dish_choc_cheesecake': lambda: cake_slice('#5a3020', '#8a5a3a', crust='#3a2018'), 'dish_fruit_salad': fruit_salad, 'dish_stir_fry': stir_fry,
    'dish_cuke_salad': cuke_salad, 'dish_edamame_bowl': edamame_bowl, 'dish_lychee_ice': lychee_ice, 'dish_tom_yum': tom_yum,
    'dish_lobster_roll': lobster_roll, 'dish_chowder': chowder, 'dish_gingerbread': gingerbread, 'dish_mac_cheese': mac_cheese,
    'dish_tomato_soup': lambda: soup_bowl('#d8402a', [('#e8b860', 0.016, 4)], cream='#fbf8f2', herbs=False), 'dish_creme_brulee': creme_brulee, 'dish_ramen': ramen,
    'dish_mochi': mochi, 'dish_takoyaki': takoyaki, 'dish_pancakes': pancakes, 'dish_mooncakes': mooncakes,
    'dish_shortcake': lambda: cake_slice('#fffaf2', '#f6e0b8', crust='#e8b878', layers=[(0.45, '#fffaf2'), (0.5, '#e0303a')], cream='strawberry'),
    'dish_sailor_stew': sailor_stew, 'dish_fish_tacos': fish_tacos, 'dish_pumpkin_soup': pumpkin_soup, 'dish_grilled_corn': grilled_corn,
    'drink_latte': lambda: cafe_mug('#c8945a', foam='#f6ead8', art='#c8945a'), 'drink_mocha': lambda: cafe_mug('#5a3020', cream='#fbf6ee', drizzle='#5a3020', col='#f6eedc', band='#7a4a30'),
    'drink_iced': iced_coffee, 'drink_matcha': lambda: cafe_mug('#8ac060', foam='#e8f4d8', art='#6aa040', col='#f6eedc', band='#3a8a8a'),
}


def weld(mb):
    """one point for every corner with the same place, normal and color (ball() and the rest add each triangle's own)"""
    out, seen, remap = MB(), {}, []
    for p, n, c in zip(mb.v, mb.n, mb.c):
        k = (round(p.x, 5), round(p.y, 5), round(p.z, 5), round(n.x, 3), round(n.y, 3), round(n.z, 3), round(c.x, 3), round(c.y, 3), round(c.z, 3))
        if k not in seen:
            seen[k] = len(out.v)
            out.v.append(p); out.n.append(n); out.c.append(c)
        remap.append(seen[k])
    out.f = [tuple(remap[i] for i in f) for f in mb.f if len({remap[i] for i in f}) == 3]
    return out


def build(name):
    out = [(weld(mb), part) for mb, part in DISHES[name]()]
    return [mb.obj(f'item_{name}_{part}', vmat(f'item_{name}_{part}', rough=0.35 if part == 'gloss' else 0.75)) for mb, part in out if mb.v]


if __name__ == '__main__':
    args = sys.argv[1:]
    prev = args[args.index('--preview') + 1] if '--preview' in args else None
    only = args[args.index('--only') + 1] if '--only' in args else None
    reset()
    shown = []
    for name in DISHES:
        if only and not name.startswith(only):
            continue
        objs = build(name)
        export(objs, 'item_' + name)
        shown.append(objs)
        print('built', name, sum(len(o.data.vertices) for o in objs), 'vertices')
    if prev and shown:
        os.makedirs(prev, exist_ok=True)
        ground_plane(color='#c8a878')
        light_rig()
        cols, cell = 6, 0.32
        for k, objs in enumerate(shown):
            for o in objs:
                o.matrix_world = Matrix.Translation(((k % cols) * cell, (k // cols) * cell, 0)) @ o.matrix_world
        rows = (len(shown) + cols - 1) // cols
        for r in range(rows):
            for k, objs in enumerate(shown):
                for o in objs:
                    o.hide_render = k // cols != r
            camera(((cols - 1) * cell / 2, r * cell, 0.04), dist=0.8, pitch=40)
            render(os.path.join(prev, f'dishes_{r}.png'), size=(1500, 400), samples=24)
