"""The island's wildlife as little painted toys for the new 3D look, after their pictures (6k_wildlife.js): robins,
bluebirds and sparrows pecking in the grass, gulls on the beach, an owl at night, squirrels, rabbits and the odd deer in
the woods, crabs on the sand, ducks on the pond, frogs, butterflies in four colors, and the sea turtle hatchlings of
summer dawns. Made like the folks (folks.py):
colors in the mesh, soft and rounded, the parts that move their own objects with their origins at the joints (wing_l /
wing_r flap, eye_l / eye_r blink). Built in hundredths of a tile, -y the front (the head), z up, feet on the ground.

    python tools/blender/critters.py [--preview DIR] [--only robin,gull]
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from mathutils import Vector, Matrix, Euler, noise
from common import *
from trees_ac import MB, rgb
from kit import shade, rbox, lathe, tube, xform
from folks import Folk, ball, surf, superq, revolve, soft, mottle, objects, DARK
from folks2 import sculpt

S = 0.01     # a hundredth of a tile


def two_tone(top, belly, split=0.0, soft_k=3.0):
    """Painted in two colors: the top one above, the belly's below (and to the front), softly blended."""
    a, b = rgb(top), rgb(belly)

    def f(p, n, u=0, v=0):
        t = max(0.0, min(1.0, 0.5 + (split - n.z) * soft_k * 0.5 - 0.6 * max(0.0, -n.y)))
        return a.lerp(b, t) * (0.95 + 0.06 * noise.noise(p * 0.3))
    return f


def eyes(f, x, y, z, r=1.4, col=DARK, white=False):
    """Two little eyes on the sides of the head, each its own object (it blinks)."""
    for s, key in ((-1, 'eye_l'), (1, 'eye_r')):
        p = Vector((s * x, y, z))
        mb = f.part(key, p)
        if white:
            ball(mb, p, (r * 1.2, r * 1.2, r * 1.2), '#fbf6e8', sub=2)
            ball(mb, p + Vector((s * r * 0.5, -r * 0.6, 0)), (r * 0.75, r * 0.75, r * 0.75), col, sub=2)
        else:
            ball(mb, p, (r, r, r), col, sub=2)
            ball(mb, p + Vector((s * r * 0.5, -r * 0.5, r * 0.45)), r * 0.32, '#ffffff', sub=1)


def wing(f, key, side, shoulder, length, width, col, tip=None, thick=1.2):
    """A wing reaching out sideways from the shoulder (the game folds it down along the side, or flaps it)."""
    mb = f.part(key, shoulder)
    c0, c1 = rgb(col), rgb(tip or col)

    def wc(p, n, u=0, v=0):
        t = min(1.0, abs(p.x - shoulder.x) / length)
        return c0.lerp(c1, t ** 2)
    ball(mb, shoulder + Vector((side * length * 0.5, width * 0.15, 0)), (length * 0.5, width * 0.5, thick), wc, sub=3)


def bird(name, back, belly, beak='#f2a830', size=1.0, tail_up=0.35):
    f = Folk(name)
    k = size
    surf(f.body, superq(0, 1.5 * k, 11 * k, 7.0 * k, 10.5 * k, 7.0 * k, 1.0, 1.0), two_tone(back, belly, 0.1), nu=28, nv=16)
    ball(f.body, (0, -6.5 * k, 17.5 * k), (5.6 * k, 5.6 * k, 5.4 * k), two_tone(back, belly, -0.2), sub=3)
    tube(f.body, [(0, -11.5 * k, 17.5 * k), (0, -13.5 * k, 17.0 * k), (0, -15.5 * k, 16.6 * k)], 1.5 * k, shade(beak), seg=8, r1=0.2 * k)
    m = len(f.body.v)
    ball(f.body, (0, 6.0 * k, 0), (4.0 * k, 7.0 * k, 1.1 * k), shade(back), sub=2)
    xform(f.body, m, Matrix.Translation((0, 9.0 * k, 12.0 * k)) @ Euler((tail_up, 0, 0)).to_matrix().to_4x4())
    for s in (-1, 1):
        tube(f.body, [(s * 2.2 * k, 1.0 * k, 5.5 * k), (s * 2.2 * k, 0.5 * k, 2.5 * k), (s * 2.2 * k, -0.5 * k, 0.4 * k)], 0.6 * k, shade(beak), seg=5)
        tube(f.body, [(s * 2.2 * k, -0.5 * k, 0.4 * k), (s * 2.2 * k, -2.6 * k, 0.3 * k)], 0.45 * k, shade(beak), seg=5)
    eyes(f, 4.3 * k, -8.6 * k, 18.6 * k, 1.1 * k)
    for s, key in ((-1, 'wing_l'), (1, 'wing_r')):
        wing(f, key, s, Vector((s * 5.5 * k, 0.5 * k, 14.0 * k)), 12.0 * k, 9.0 * k, back)
    return f


def robin():
    return bird('robin', '#7a5238', '#e4582e')


def bluebird():
    return bird('bluebird', '#4a7ad0', '#f0a050')


def sparrow():
    return bird('sparrow', '#9a7450', '#ecdcc4')


def gull():
    f = bird('gull', '#f6f6f2', '#fbfbf8', beak='#f2c030', size=1.25, tail_up=0.2)
    # (grey wings with dark tips over the white)
    for key in ('wing_l', 'wing_r'):
        del f.parts[key]
    k = 1.25
    for s, key in ((-1, 'wing_l'), (1, 'wing_r')):
        wing(f, key, s, Vector((s * 5.5 * k, 0.5 * k, 14.0 * k)), 15.0 * k, 9.0 * k, '#a8adb8', tip='#3a3a44')
    return f


def owl():
    f = Folk('owl')
    brown = '#7a5634'
    surf(f.body, superq(0, 0, 15.0, 10.0, 9.0, 14.0, 1.0, 1.0), two_tone(brown, '#e8d4b0', -0.3, 2.0), nu=32, nv=20)
    for s in (-1, 1):
        ball(f.body, (s * 4.4, -7.2, 21.0), (4.2, 1.8, 4.2), shade('#d8b888'), sub=2)
        m = len(f.body.v)
        ball(f.body, (0, 0, 2.5), (2.0, 1.6, 3.5), shade(brown), sub=2)
        xform(f.body, m, Matrix.Translation((s * 6.5, 0, 26.0)) @ Euler((0, s * 0.35, 0)).to_matrix().to_4x4())
        ball(f.body, (s * 9.5, 1.0, 13.0), (2.5, 6.0, 8.0), shade('#6a4628'), sub=2)
        for t in (-1, 0, 1):
            tube(f.body, [(s * 3 + t * 1.0, -4.0, 2.0), (s * 3 + t * 1.3, -6.0, 0.5)], 0.6, shade('#e8b030'), seg=5)
    tube(f.body, [(0, -8.8, 19.5), (0, -10.0, 17.5)], 1.2, shade('#e8b030'), seg=6, r1=0.2)
    eyes(f, 4.4, -8.6, 21.0, 2.4, col='#e8b828', white=False)
    for key in ('eye_l', 'eye_r'):
        mb, o = f.parts[key]
        ball(mb, o + Vector((0, -1.6, 0)), 1.2, DARK, sub=2)
    return f


def plume(mb, path, radius, flat, color, nu=16, nv=36, tufts=9, ruffle=0.1, seed=0.0):
    """A bushy tail: a soft tube along a smooth path in the yz plane (path: points it passes through), its radius
    radius(t) from base (t 0) to tip (1), flattened side to side by flat, its outline ruffled into tufts of fur"""
    P0 = [Vector(p) for p in path]

    def at(t):
        # (a Catmull-Rom curve through the points)
        n = len(P0) - 1
        x = min(n - 1e-6, max(0.0, t * n))
        i, s = int(x), x - int(x)
        p0, p1, p2, p3 = P0[max(0, i - 1)], P0[i], P0[i + 1], P0[min(n, i + 2)]
        return 0.5 * ((2 * p1) + (-p0 + p2) * s + (2 * p0 - 5 * p1 + 4 * p2 - p3) * s * s + (-p0 + 3 * p1 - 3 * p2 + p3) * s ** 3)

    def P(u, v):
        v = max(0.0, min(1.0, v))
        c = at(v)
        tng = (at(min(1.0, v + 0.01)) - at(max(0.0, v - 0.01))).normalized()
        side = Vector((1, 0, 0))
        nrm = tng.cross(side).normalized()
        th = u * math.tau
        r = radius(v) * (1 + ruffle * math.sin(v * math.pi * tufts * 2) * (0.6 + 0.4 * math.cos(th * 2))
                         + 0.6 * ruffle * noise.noise(c * 0.6 + Vector((seed, th, 0))))
        r *= math.sqrt(max(0.0, 1 - (1 - min(1.0, v / 0.06)) ** 2)) * math.sqrt(max(0.0, 1 - max(0.0, (v - 0.94) / 0.06) ** 2))
        return c + side * (math.cos(th) * r * flat) + nrm * (math.sin(th) * r)
    surf(mb, P, color, nu=nu, nv=nv)


def squirrel():
    """A red squirrel sitting up on its haunches, its front paws held to its chest round an acorn: a pear of a body with a
    cream front, a round head with a cream muzzle and puffed cheeks, tufted ears, long hind feet, and the big bushy tail
    rising behind in an S, its top curling back, frosted paler round its edge."""
    f = Folk('squirrel')
    fur, cream, dk = '#c4662a', '#f2dcbc', '#8a4220'
    furc, creamc = rgb(fur), rgb(cream)

    def body(p, n, u=0, v=0):
        # (one cream patch down the front, from the chin to the belly)
        k = max(0.0, min(1.0, (-n.y - 0.25) * 2.2)) * max(0.0, min(1.0, (13.5 - p.z) / 2.0)) * max(0.0, min(1.0, (p.z - 2.5) / 2.0))
        return furc.lerp(creamc, k) * (0.95 + 0.06 * noise.noise(p * 0.3))
    ball(f.body, (0, 2.0, 6.0), (5.4, 5.8, 5.6), body, sub=3)
    ball(f.body, (0, -0.8, 11.2), (4.3, 4.4, 5.0), body, sub=3)
    # haunches, long hind feet flat on the ground
    for s in (-1, 1):
        ball(f.body, (s * 4.0, 3.0, 4.2), (2.4, 4.0, 3.4), shade(fur), sub=2)
        ball(f.body, (s * 3.0, -1.6, 1.0), (1.5, 3.3, 1.0), shade('#b8582a'), sub=2)
    # the head: round, a cream muzzle and cheeks, the nose; ears up with dark tufts
    ball(f.body, (0, -3.8, 16.6), (4.5, 4.3, 4.1), shade(fur), sub=3)
    for s in (-1, 1):
        ball(f.body, (s * 2.4, -6.2, 15.0), (2.1, 1.9, 1.9), shade(cream), sub=2)
    ball(f.body, (0, -7.2, 15.6), (2.0, 1.9, 1.7), shade(cream), sub=2)
    ball(f.body, (0, -9.0, 16.2), (0.85, 0.65, 0.7), shade('#3a2420'), sub=1)
    for s in (-1, 1):
        m = len(f.body.v)
        ball(f.body, (0, 0, 2.2), (1.5, 0.85, 2.7), shade(fur), sub=2)
        ball(f.body, (0, 0.1, 4.7), (0.8, 0.6, 1.3), shade(dk), sub=2)
        xform(f.body, m, Matrix.Translation((s * 2.5, -2.6, 19.4)) @ Euler((0.15, s * 0.32, 0)).to_matrix().to_4x4())
    # front paws at the chest, holding an acorn
    for s in (-1, 1):
        tube(f.body, [(s * 3.2, -2.2, 12.0), (s * 2.6, -4.6, 10.8), (s * 1.6, -5.6, 10.6)], 1.1, shade(fur), seg=8, r1=0.95)
        ball(f.body, (s * 1.3, -5.9, 10.7), (1.0, 1.0, 1.1), shade('#d08a50'), sub=2)
    ball(f.body, (0, -6.4, 10.0), (1.25, 1.2, 1.5), shade('#a8642e'), sub=2)
    ball(f.body, (0, -6.4, 11.2), (1.45, 1.4, 0.75), mottle('#6a4428', 0.12, 1.5), sub=2)
    # the bushy tail
    core, rim = rgb('#c4622a'), rgb('#f2aa68')

    def tail(p, n, u=0, v=0):
        k = (1 - abs(n.x)) ** 1.4
        return core.lerp(rim, 0.05 + 0.8 * k ** 1.8) * (0.92 + 0.12 * noise.noise(p * 0.7)) * (0.9 + 0.12 * max(0.0, n.z))
    plume(f.body, [(0, 5.5, 4.0), (0, 10.0, 6.5), (0, 12.6, 12.0), (0, 11.8, 18.0), (0, 12.2, 23.5), (0, 14.8, 26.4), (0, 17.6, 25.4), (0, 18.6, 22.6)],
          lambda t: 1.6 + 4.3 * math.sin(min(1.0, t / 0.35) * math.pi / 2) - 1.8 * max(0.0, (t - 0.7) / 0.3) ** 1.5, 0.6, tail, nu=20, nv=48, tufts=7, ruffle=0.2)
    # (all of it melted into one soft piece, as the folks are)
    sculpt(f, 'body', voxel=0.26, smooth=3, verts=2600, ao=0.25, reach=2.0)
    eyes(f, 2.9, -7.0, 17.6, 1.25)
    return f


def rabbit():
    f = Folk('rabbit')
    fur = '#cdbca4'
    surf(f.body, superq(0, 2.0, 8.5, 7.0, 9.5, 8.0, 1.0, 1.0), two_tone(fur, '#f4ece0', -0.3), nu=28, nv=16)
    ball(f.body, (0, -6.0, 13.0), (5.0, 5.5, 4.8), two_tone(fur, '#f4ece0', -0.5), sub=3)
    ball(f.body, (0, -11.2, 12.4), (1.0, 0.8, 0.8), shade('#e89aa0'), sub=1)
    for s in (-1, 1):
        m = len(f.body.v)
        ball(f.body, (0, 0, 5.0), (1.8, 1.0, 5.5), lambda p, n: rgb('#f0b8b8') if n.y < -0.4 and abs(p.x) < 1.0 else rgb(fur), sub=2)
        xform(f.body, m, Matrix.Translation((s * 2.0, -4.5, 16.0)) @ Euler((-0.25, s * 0.25, 0)).to_matrix().to_4x4())
        ball(f.body, (s * 3.5, -4.0, 1.5), (1.6, 2.6, 1.5), shade(fur), sub=2)
        ball(f.body, (s * 4.5, 5.0, 2.2), (2.2, 4.4, 2.4), shade(fur), sub=2)
    ball(f.body, (0, 11.0, 8.0), 2.6, shade('#fbf8f4'), sub=2)
    eyes(f, 3.4, -9.2, 14.2, 1.0)
    return f


def deer():
    f = Folk('deer')
    coat = '#b07a48'
    surf(f.body, superq(0, 3.0, 62.0, 13.0, 28.0, 14.0, 1.0, 1.0), two_tone(coat, '#f0e2c8', -0.5, 2.0), nu=32, nv=18)
    tube(f.body, [(0, -18.0, 66.0), (0, -24.0, 80.0), (0, -27.0, 90.0)], 7.0, shade(coat), seg=14, r1=5.5)
    surf(f.body, superq(0, -31.0, 94.0, 6.0, 9.0, 6.5, 1.0, 1.0), shade(coat), nu=24, nv=14)
    ball(f.body, (0, -40.0, 92.0), (2.0, 1.4, 1.6), shade('#2a1e1c'), sub=2)
    for s in (-1, 1):
        m = len(f.body.v)
        ball(f.body, (0, 0, 0), (6.0, 2.0, 3.0), lambda p, n: rgb('#f2d8c0') if n.y < -0.5 else rgb(coat), sub=2)
        xform(f.body, m, Matrix.Translation((s * 9.5, -28.0, 99.0)) @ Euler((0, s * -0.5, s * 0.25)).to_matrix().to_4x4())
        # antlers: a beam back and up, two tines off it
        base = Vector((s * 3.0, -29.0, 100.0))
        pts = [base, base + Vector((s * 3.5, 1.5, 9.0)), base + Vector((s * 7.0, 4.5, 16.0)), base + Vector((s * 8.0, 8.0, 22.0))]
        tube(f.body, pts, 1.3, mottle('#d8c4a0', 0.06, 0.6), seg=6, r1=0.6)
        tube(f.body, [pts[1], pts[1] + Vector((s * 1.0, -4.0, 6.0))], 0.9, shade('#d8c4a0'), seg=5, r1=0.4)
        tube(f.body, [pts[2], pts[2] + Vector((s * 3.5, -2.5, 5.0))], 0.9, shade('#d8c4a0'), seg=5, r1=0.4)
        for y in (-18.0, 22.0):
            tube(f.body, [(s * 7.0, y, 54.0), (s * 7.0, y + 1.0, 28.0), (s * 7.0, y, 5.0)], 2.6, shade(coat), seg=10, r1=1.9)
            lathe(f.body, [(2.2, 0.0), (2.3, 2.0), (2.0, 5.0), (0.0, 5.1)], '#2e2420', c=(s * 7.0, y, 0), seg=10, cap_top=True)
    for (x, y, z) in ((4, -4, 72), (-5, 6, 73), (6, 14, 70), (-4, 16, 71), (2, 24, 69)):
        ball(f.body, (x, y, z), 1.5, shade('#f6eedc'), sub=1)
    ball(f.body, (0, 30.5, 66.0), (3.0, 2.5, 5.0), two_tone(coat, '#fbf8f4', -0.2), sub=2)
    eyes(f, 5.4, -34.0, 97.0, 1.5)
    return f


def crab():
    f = Folk('crab')
    red = '#d8402e'
    surf(f.body, superq(0, 0, 6.0, 10.0, 7.0, 4.5, 1.0, 1.0), two_tone(red, '#f0a080', -0.5), nu=28, nv=14)
    for s in (-1, 1):
        for i in range(3):
            y = -2.5 + i * 3.0
            tube(f.body, [(s * 9.0, y, 5.0), (s * 13.0, y + 0.5, 7.0), (s * 15.5, y + 1.0, 0.5)], 0.9, shade(red), seg=5, r1=0.5)
        tube(f.body, [(s * 7.0, -5.0, 6.0), (s * 10.0, -9.0, 7.0), (s * 11.0, -12.0, 7.5)], 1.4, shade(red), seg=6)
        ball(f.body, (s * 11.5, -14.0, 7.8), (3.2, 3.6, 2.4), shade(red), sub=2)
        ball(f.body, (s * 10.0, -16.5, 7.8), (1.2, 2.4, 1.0), shade('#c83424'), sub=1)
        tube(f.body, [(s * 3.0, -5.0, 8.0), (s * 3.2, -5.8, 11.5)], 0.6, shade(red), seg=5)
    eyes(f, 3.2, -6.0, 12.2, 1.2, white=True)
    return f


def duck():
    f = Folk('duck')

    def body(p, n, u=0, v=0):
        return rgb('#c8b89a').lerp(rgb('#8a7e6e'), max(0.0, min(1.0, (p.y - 2) / 10))) * (0.95 + 0.05 * noise.noise(p * 0.4))
    surf(f.body, superq(0, 2.0, 5.0, 8.0, 12.0, 6.0, 1.0, 1.0), body, nu=28, nv=14)
    m = len(f.body.v)
    ball(f.body, (0, 0, 0), (4.0, 3.0, 2.5), shade('#3a3632'), sub=2)
    xform(f.body, m, Matrix.Translation((0, 13.0, 8.0)) @ Euler((0.5, 0, 0)).to_matrix().to_4x4())
    tube(f.body, [(0, -6.0, 8.0), (0, -8.0, 13.0)], 3.2, shade('#2e7a44'), seg=10)
    lathe(f.body, [(3.3, 7.6), (3.5, 8.6), (3.3, 9.4)], '#fbfbf8', c=(0, -6.6, 0), seg=16, cap_top=False)
    ball(f.body, (0, -8.6, 16.5), (4.4, 4.8, 4.4), mottle('#2e7a44', 0.08, 0.6, c2='#2a6a5a'), sub=3)
    tube(f.body, [(0, -12.5, 15.8), (0, -15.5, 15.2)], 1.6, shade('#f2c030'), seg=8, r1=1.1)
    ball(f.body, (0, -15.6, 15.2), (1.4, 1.0, 0.8), shade('#f2c030'), sub=1)
    for s in (-1, 1):
        ball(f.body, (s * 7.0, 3.0, 7.0), (2.0, 8.0, 3.0), shade('#9a8a74'), sub=2)
        ball(f.body, (s * 7.2, 6.0, 7.5), (1.0, 2.6, 1.2), shade('#3a6ac8'), sub=1)
    eyes(f, 3.6, -10.0, 17.8, 0.9)
    return f


def frog():
    f = Folk('frog')
    green = '#5aaa48'
    surf(f.body, superq(0, 0, 5.5, 7.5, 8.0, 5.0, 1.0, 1.0), two_tone(green, '#e0eab0', -0.4), nu=28, nv=14)
    for s in (-1, 1):
        ball(f.body, (s * 4.0, -4.0, 9.5), (2.8, 2.8, 2.6), shade(green), sub=2)
        ball(f.body, (s * 7.0, 4.0, 2.5), (3.0, 5.5, 2.4), shade('#4a9a3c'), sub=2)
        ball(f.body, (s * 9.0, -1.0, 0.8), (2.4, 2.0, 0.8), shade('#4a9a3c'), sub=1)
        ball(f.body, (s * 4.5, -7.0, 0.8), (1.8, 2.2, 0.8), shade('#4a9a3c'), sub=1)
    tube(f.body, [(-4.5, -7.2, 5.0), (0, -8.0, 4.4), (4.5, -7.2, 5.0)], 0.4, shade('#2a4a20'), seg=5)
    eyes(f, 4.0, -5.8, 10.8, 1.4)
    return f


def closed_curve(pts, n):
    """n points evenly round a smooth closed curve through pts (Catmull-Rom), with the parameter (0..1) of each"""
    P = [Vector(p) for p in pts]
    m, out = len(P), []
    for k in range(n):
        x = k / n * m
        i, s = int(x), x - int(x)
        p0, p1, p2, p3 = P[(i - 1) % m], P[i % m], P[(i + 1) % m], P[(i + 2) % m]
        out.append((0.5 * ((2 * p1) + (-p0 + p2) * s + (2 * p0 - 5 * p1 + 4 * p2 - p3) * s * s + (-p0 + 3 * p1 - 3 * p2 + p3) * s ** 3), k / n))
    return out


def wing_panel(mb, o, side, outline, paint, thick=0.3, n=20, scallop=0.0, rings=(0.45, 0.78, 0.92, 1.0)):
    """One wing (a fore or a hind wing) lying flat from the hinge o: a soft lens, thickest in its middle, its outline the
    smooth curve through outline (x out from the body, y back; side mirrors it), its outer margin scalloped; painted
    by paint(q, f, i, top): q where on the wing (from the hinge), f the ring (0 the middle, 1 the edge), i the spoke,
    top which face"""
    pts = closed_curve([(x, y, 0.0) for x, y in outline], n)
    cen = sum((p for p, _ in pts), Vector()) / n
    edge = []
    for p, t in pts:
        r = p - cen
        d = p.length
        if scallop and d > 3.5:
            p = p + r.normalized() * scallop * math.sin(t * math.tau * 5) * min(1.0, (d - 3.5) / 1.5)
        edge.append(p)
    V, C, N, F = [], [], [], []

    def put(q, nn, f, i, top):
        V.append(Vector((o.x + side * q.x, o.y + q.y, o.z + q.z)))
        N.append(Vector((side * nn.x, nn.y, nn.z)).normalized())
        C.append(paint(Vector((q.x, q.y, 0)), f, i, top))
        return len(V) - 1
    rim = []
    for i, e in enumerate(edge):
        out = Vector(((e - cen).x, (e - cen).y, 0)).normalized()
        rim.append(put(Vector((e.x, e.y, 0)), out, 1.0, i, True))
    for top in (True, False):
        z = 1 if top else -1
        c = put(Vector((cen.x, cen.y, z * thick)), Vector((0, 0, z)), 0.0, -1, top)
        idx = []
        for f in rings[:-1]:
            row = []
            for i, e in enumerate(edge):
                q = cen + (e - cen) * f
                out = Vector(((e - cen).x, (e - cen).y, 0)).normalized()
                row.append(put(Vector((q.x, q.y, z * thick * (1 - f * f))), out * (f ** 3 * 1.6) + Vector((0, 0, z)), f, i, top))
            idx.append(row)
        idx.append(rim)
        F += [(c, idx[0][i], idx[0][(i + 1) % n]) for i in range(n)]
        for r in range(len(idx) - 1):
            for i in range(n):
                a, b, cc, d = idx[r][i], idx[r][(i + 1) % n], idx[r + 1][(i + 1) % n], idx[r + 1][i]
                F += [(a, b, cc), (a, cc, d)]
    mb.add(V, C, N, F)


# each butterfly's wings: (root, main, border, dots, a mark) and where its marks go
BFLY = {
    'butterfly0': dict(root='#e8a828', main='#f8d84a', border='#2e2620', dots='#fff2b0', mark='#f07a30', under='#f6e6a0', tail=True),
    'butterfly1': dict(root='#e066a0', main='#f8b0d0', border='#a83a70', dots='#fff2f8', mark='#ffffff', under='#f8d4e4'),
    'butterfly2': dict(root='#1a4ab8', main='#58b0f4', border='#14223c', dots='#d0ecff', mark='#9adcff', under='#a8c8e0'),
    'butterfly3': dict(root='#d0cec6', main='#fbfaf6', border='#34343a', dots='#fbfaf6', mark='#34343a', under='#eef0e0', white=True),
}


def butterfly(name, col, edge):
    """A butterfly: a fore and a hind wing each side (wing_l / wing_r, hinged along the body at x 0.6 for the game to
    flap and fold), each a soft rounded lens with a scalloped margin, painted with its colors: a deeper root by the body,
    a dark border with a row of pale dots, veins, a mark or two (a cabbage white just its dark tips and spot); a furry
    body, a round head and a pair of clubbed antennae."""
    f = Folk(name)
    B = BFLY[name]
    body = '#2a2224'
    ball(f.body, (0, -1.6, 6.2), (1.15, 1.7, 1.1), mottle('#4a3a34', 0.1, 1.2), sub=2)
    tube(f.body, [(0, 0.0, 6.1), (0, 2.4, 6.0), (0, 4.6, 5.7), (0, 6.2, 5.5)], 0.95, lambda p, n: rgb(body) * (1.0 + 0.35 * (math.sin(p.y * 4.0) > 0.4)), seg=8, r1=0.4)
    ball(f.body, (0, -3.7, 6.5), 1.05, shade('#3a2e2c'), sub=2)
    for s in (-1, 1):
        tube(f.body, [(s * 0.35, -4.4, 7.2), (s * 1.2, -6.0, 8.8), (s * 2.2, -7.2, 10.4)], 0.28, shade(body), seg=4)
        ball(f.body, (s * 2.3, -7.35, 10.6), 0.6, shade(body), sub=1)
    R, M, Bo, D, K, U = (rgb(B[k]) for k in ('root', 'main', 'border', 'dots', 'mark', 'under'))
    white = B.get('white')

    def painter(fore):
        def paint(q, f, i, top):
            d = q.length
            if not top:
                c = U.lerp(R, 0.35 * max(0.0, 1 - d / 3.0))
                return c.lerp(Bo, 0.35) if f > 0.95 else c
            c = R.lerp(M, min(1.0, max(0.0, (d - 1.0) / 2.6)))
            if i >= 0 and i % 4 == 1 and 0.3 < f < 0.9:
                c = c * 0.86                                        # (veins)
            if white:
                if fore and f > 0.7 and q.x > 5.7 and q.y < -2.1:
                    c = Bo                                          # (dark wingtips)
                if fore and (q - Vector((5.5, -2.1, 0))).length < 0.9 and f < 0.9:
                    c = K                                           # (the spot)
                return c
            if f > 0.97:
                c = Bo
            elif f > 0.9:
                c = D if i % 3 == 0 else Bo                         # (the pale dots in the border)
            elif fore and f > 0.6 and q.y < -2.0 and abs(q.x - (4.2 if name == 'butterfly0' else 6.6)) < 0.85:
                c = Bo if name == 'butterfly0' else K               # (a band from the leading edge, or a pale mark)
            elif not fore and 0.6 < f < 0.9 and q.y > 3.8:
                c = K                                               # (a spot on the hind wing)
            return c
        return paint
    fore_o = [(0.2, -0.8), (1.8, -3.0), (4.0, -5.0), (6.4, -6.4), (8.6, -7.0), (9.8, -6.2), (9.9, -4.0), (9.2, -1.6), (7.6, 0.4), (4.8, 0.9), (2.0, 0.8), (0.4, 0.4)]
    hind_o = [(0.3, 0.2), (2.6, 0.0), (5.4, 0.6), (7.4, 2.0), (8.0, 4.0), (7.2, 6.0), (5.6, 7.6), (3.6, 8.0), (1.8, 7.0), (0.7, 4.8), (0.2, 2.4)]
    if B.get('tail'):
        hind_o = [(0.3, 0.2), (2.6, 0.0), (5.4, 0.6), (7.4, 2.0), (8.0, 4.0), (7.2, 6.0), (6.0, 7.2), (5.8, 9.6), (4.8, 7.8), (3.4, 7.8), (1.7, 6.8), (0.7, 4.7), (0.2, 2.4)]
    # (the wings drawn a little larger than they're made: as big as the first butterflies' all told)
    fore_o = [(x * 0.95, y * 0.82) for x, y in fore_o]
    hind_o = [(x * 0.95, y * 0.82) for x, y in hind_o]
    for s, key in ((-1, 'wing_l'), (1, 'wing_r')):
        o = Vector((s * 0.6, 0, 6.0))
        mb = f.part(key, o)
        wing_panel(mb, o + Vector((0, 0, -0.12)), s, hind_o, painter(False), thick=0.26, n=20, scallop=0.22)
        wing_panel(mb, o + Vector((0, 0, 0.12)), s, fore_o, painter(True), thick=0.28, n=20, scallop=0.0)
    return f


def turtle():
    """A sea turtle hatchling (the far beach on summer dawns: 33q_env_sights.js): a shell of dark scutes with pale seams
    on a cream underside, a round head, four flippers that paddle (fin_fl, fin_fr, fin_bl, fin_br, each from its
    shoulder)."""
    f = Folk('turtle')
    base, seam, rim = rgb('#46563a'), rgb('#b4bc8a'), rgb('#62724a')

    plates = [(0, y) for y in (-5.2, -2.0, 1.2, 4.4, 7.4)] + [(sx * 4.0, y) for sx in (-1, 1) for y in (-3.6, -0.2, 3.2, 6.4)]

    def shell(p, n, u=0, v=0):
        # the scutes: five down the middle, four each side, the rim of small ones round the edge; pale seams between
        r = math.hypot(p.x / 6.4, (p.y - 1.0) / 8.4)
        d = sorted(math.hypot(p.x - x, (p.y - y) * 0.9) for x, y in plates)
        if r > 0.84:
            c = seam if abs(math.sin(math.atan2(p.y - 1.0, p.x) * 11)) < 0.18 or r < 0.87 else rim
        else:
            c = seam if d[1] - d[0] < 0.42 else base * (1.08 - 0.05 * min(d[0], 3.0))
        return c * (0.96 + 0.06 * noise.noise(p * 0.5))
    surf(f.body, superq(0, 1.0, 3.0, 6.4, 8.4, 3.4, 0.8, 1.0), shell, nu=64, nv=30)
    surf(f.body, superq(0, 1.0, 1.7, 5.6, 7.4, 1.7, 1.0, 1.0), shade('#e6dcb8'), nu=24, nv=10)
    ball(f.body, (0, -8.6, 3.4), (2.5, 3.0, 2.2), two_tone('#5e6c48', '#d8d0a8', -0.3), sub=3)
    ball(f.body, (0, 10.0, 1.8), (0.9, 1.8, 0.6), shade('#4a5636'), sub=1)
    eyes(f, 1.75, -10.6, 4.4, 0.75)
    fin = shade('#3e4a30')
    for s, sfx in ((-1, 'l'), (1, 'r')):
        o = Vector((s * 4.6, -4.2, 2.0))
        ball(f.part('fin_f' + sfx, o), o + Vector((s * 3.8, 1.4, -0.7)), (4.4, 1.7, 0.55), fin, sub=2)
        o = Vector((s * 3.8, 6.4, 1.8))
        ball(f.part('fin_b' + sfx, o), o + Vector((s * 1.6, 1.6, -0.6)), (2.2, 1.5, 0.5), fin, sub=2)
    return f


CRITTERS = {
    'robin': robin, 'bluebird': bluebird, 'sparrow': sparrow, 'gull': gull, 'owl': owl, 'squirrel': squirrel,
    'rabbit': rabbit, 'deer': deer, 'crab': crab, 'duck': duck, 'frog': frog, 'turtle': turtle,
    'butterfly0': lambda: butterfly('butterfly0', '#f6d040', '#c88a20'), 'butterfly1': lambda: butterfly('butterfly1', '#f6a2c4', '#d86a9a'),
    'butterfly2': lambda: butterfly('butterfly2', '#a8d4f4', '#5a9ad8'), 'butterfly3': lambda: butterfly('butterfly3', '#fbfaf6', '#c8c4bc'),
}


if __name__ == '__main__':
    args = sys.argv[1:]
    prev = args[args.index('--preview') + 1] if '--preview' in args else None
    only = args[args.index('--only') + 1].split(',') if '--only' in args else None
    reset()
    shown = []
    for name, fn in CRITTERS.items():
        if only and name not in only:
            continue
        objs = objects(fn(), scale=S, prefix='critter')
        export(objs, f'critter_{name}')
        for o in objs:
            if o.name.startswith('anchor_'):
                o.name = f'done_{name}_{o.name}'
        shown.append((name, objs))
        print('built', name, sum(len(o.data.vertices) for o in objs if o.type == 'MESH'), 'vertices')
    if prev:
        ground_plane(size=200, color='#8cc070')
        light_rig()
        n = len(shown)
        for k, (name, objs) in enumerate(shown):
            for o in objs:
                o.location.x += (k % 5) * 0.75 - 1.5
                o.location.y += (k // 5) * 0.9
        camera((0, 0.9, 0.2), dist=4.0, pitch=34)
        render(os.path.join(prev, 'critters3d.png'), size=(1200, 760), samples=32)
