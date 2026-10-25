"""The island's wildlife as little painted toys for the new 3D look, after their pictures (6k_wildlife.js): robins,
bluebirds and sparrows pecking in the grass, gulls on the beach, an owl at night, squirrels, rabbits and the odd deer in
the woods, crabs on the sand, ducks on the pond, frogs, and butterflies in four colors. Made like the folks (folks.py):
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


def squirrel():
    f = Folk('squirrel')
    fur = '#c06a30'
    surf(f.body, superq(0, 1.0, 9.5, 6.0, 9.0, 7.5, 1.0, 1.0), two_tone(fur, '#f0dcc0', -0.1), nu=28, nv=16)
    ball(f.body, (0, -7.5, 15.5), (5.0, 5.2, 5.0), two_tone(fur, '#f0dcc0', -0.4), sub=3)
    ball(f.body, (0, -12.2, 14.6), (1.0, 0.8, 0.9), shade('#3a2420'), sub=1)
    for s in (-1, 1):
        m = len(f.body.v)
        ball(f.body, (0, 0, 2.0), (1.4, 0.8, 2.6), shade(fur), sub=2)
        xform(f.body, m, Matrix.Translation((s * 3.0, -6.5, 19.0)) @ Euler((0, s * 0.3, 0)).to_matrix().to_4x4())
        ball(f.body, (s * 3.2, -3.0, 2.0), (1.6, 3.0, 1.6), shade(fur), sub=2)
        ball(f.body, (s * 3.8, 5.5, 3.0), (2.4, 4.0, 3.0), shade(fur), sub=2)
    # the big bushy tail curling up behind
    for i in range(9):
        t = i / 8
        ball(f.body, (0, 9.5 + 5 * math.sin(t * 2.4), 5.0 + 20 * t), (4.5 + 2.5 * math.sin(t * math.pi), 4.5, 5.0), mottle('#d0783a', 0.06, 0.5), sub=2)
    eyes(f, 3.6, -10.0, 16.6, 1.1)
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


def butterfly(name, col, edge):
    f = Folk(name)
    tube(f.body, [(0, -4.5, 6.0), (0, 0, 6.0), (0, 5.0, 5.6)], 0.9, shade('#2a2224'), seg=6, r1=0.6)
    ball(f.body, (0, -5.2, 6.2), 1.2, shade('#2a2224'), sub=1)
    for s in (-1, 1):
        tube(f.body, [(s * 0.3, -5.8, 6.8), (s * 1.6, -8.0, 9.0)], 0.2, shade('#2a2224'), seg=4)
    c0, c1 = rgb(col), rgb(edge)
    for s, key in ((-1, 'wing_l'), (1, 'wing_r')):
        o = Vector((s * 0.6, 0, 6.0))
        mb = f.part(key, o)

        def wc(p, n, u=0, v=0, s=s):
            d = math.hypot(p.x - o.x, (p.y - o.y) * 0.8)
            return c0.lerp(c1, max(0.0, min(1.0, (d - 4.5) / 2.5)))
        ball(mb, o + Vector((s * 4.6, -2.2, 0)), (4.8, 3.6, 0.35), wc, sub=3)
        ball(mb, o + Vector((s * 3.6, 3.0, 0)), (3.6, 3.0, 0.35), wc, sub=3)
    return f


CRITTERS = {
    'robin': robin, 'bluebird': bluebird, 'sparrow': sparrow, 'gull': gull, 'owl': owl, 'squirrel': squirrel,
    'rabbit': rabbit, 'deer': deer, 'crab': crab, 'duck': duck, 'frog': frog,
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
