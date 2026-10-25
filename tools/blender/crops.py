"""The farm's fields as miniatures: a tilled ridge of soil (crop_soil, a tile long, laid in rows across a field) and the
crops that grow on them, in the style of the trees (colors in the mesh, soft and rounded): a cabbage (a pale round head
in a cup of curling leaves), a bunch of wheat (golden stalks, ears heavy at the top, a few blades), a pumpkin on its
vine (ribbed, a curly stem, broad leaves).

    python tools/blender/crops.py [--preview DIR]
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from mathutils import Vector, Matrix, Euler, noise
from common import *
from trees_ac import MB, vmat, rgb
from kit import col_fn, shade, rbox, lathe, ball, tube, xform


def soil():
    mb = MB()
    rbox(mb, -0.5, -0.14, 0.0, 0.5, 0.14, 0.1, col_fn('#5e3c22', mottle=0.12, under=0.2), r=0.07, mid=6)
    rng = random.Random(4)
    # clods and a stone or two on top
    for k in range(9):
        ball(mb, (rng.uniform(-0.45, 0.45), rng.uniform(-0.08, 0.08), 0.09), rng.uniform(0.015, 0.03), shade('#6e4a2c' if k % 3 else '#8a8478'), sub=1)
    return [(mb, 'main')]


def cabbage():
    mb = MB()
    # the head: pale and round, a little flattened
    ball(mb, (0, 0, 0.13), (0.13, 0.13, 0.11), col_fn('#c8e49a', mottle=0.06, under=0.0), sub=3)
    # leaves curling up round it, two rings, each a cupped oval darker at its middle
    rng = random.Random(7)
    for ring, (n, rad, tilt, size, c) in enumerate(((7, 0.13, 0.85, (0.17, 0.12), '#5aa846'), (5, 0.09, 1.15, (0.13, 0.1), '#7cc05a'))):
        for k in range(n):
            a = k / n * math.tau + ring * 0.4 + rng.uniform(-0.15, 0.15)
            m = len(mb.v)

            def leafc(p, nn, c=c):
                d = math.hypot(p.x, p.y) / size[0]
                return rgb(c) * (0.82 + 0.3 * min(1.0, d)) * (0.9 + 0.1 * max(0.0, nn.z))
            ball(mb, (0, 0, 0), (size[0], size[1], 0.022), leafc, sub=2)
            # cupped: the edge lifted
            for i in range(m, len(mb.v)):
                p = mb.v[i]
                mb.v[i] = Vector((p.x, p.y, p.z + 0.5 * (p.x * p.x + p.y * p.y)))
            xform(mb, m, Matrix.Translation((math.cos(a) * rad, math.sin(a) * rad, 0.05 + ring * 0.04)) @ Euler((0, -tilt, a), 'XYZ').to_matrix().to_4x4()
                  @ Matrix.Translation((size[0] * 0.7, 0, 0)))
    return [(mb, 'main')]


def wheat():
    mb = MB()
    rng = random.Random(11)
    for k in range(15):
        a, d = rng.uniform(0, math.tau), math.sqrt(rng.random()) * 0.14
        x, y = math.cos(a) * d, math.sin(a) * d
        h = rng.uniform(0.62, 0.86)
        lean = Vector((x * 0.6 + rng.uniform(-0.05, 0.05), y * 0.6 + rng.uniform(-0.05, 0.05), 0))
        top = Vector((x, y, 0)) + lean + Vector((0, 0, h))
        tube(mb, [(x, y, 0), ((x + top.x) / 2, (y + top.y) / 2, h * 0.5), tuple(top)], 0.009, col_fn('#c8a040', under=0.3), seg=5)
        # the ear: a fat golden spike of grains, nodding a little
        m = len(mb.v)
        for j in range(5):
            for s in (-1, 1):
                ball(mb, (s * 0.012, 0, j * 0.022), (0.014, 0.012, 0.02), shade('#e8c460' if j % 2 else '#dcb050'), sub=1)
        ball(mb, (0, 0, 0.11), (0.006, 0.006, 0.03), shade('#e8d080'), sub=1)
        xform(mb, m, Matrix.Translation(top) @ Euler((rng.uniform(-0.3, 0.3), rng.uniform(-0.3, 0.3), rng.uniform(0, math.tau))).to_matrix().to_4x4())
    for k in range(5):
        a = k / 5 * math.tau + 0.3
        tube(mb, [(0, 0, 0.02), (math.cos(a) * 0.12, math.sin(a) * 0.12, 0.2), (math.cos(a) * 0.2, math.sin(a) * 0.2, 0.16)], 0.012, shade('#a8b048'), seg=4)
    return [(mb, 'main')]


def pumpkin():
    mb = MB()
    R, rings, seg = 0.2, 14, 30
    base, groove = rgb('#f08420'), rgb('#b8500e')
    pts, cols, nrms, faces = [], [], [], []
    for i in range(rings + 1):
        t = i / rings * math.pi
        for j in range(seg):
            a = j / seg * math.tau
            ribs = abs(math.cos(a * 4))
            rib = 1 - 0.1 * (1 - ribs ** 0.5)
            sx, sz = math.sin(t), -math.cos(t)
            z = sz * 0.78 - 0.12 * max(0.0, sz) ** 6
            p = Vector((math.cos(a) * sx * R * rib * 1.12, math.sin(a) * sx * R * rib * 1.12, (z + 0.78) * R))
            n = Vector((math.cos(a) * sx, math.sin(a) * sx, sz)).normalized()
            pts.append(p); nrms.append(n)
            cols.append(groove.lerp(base, 0.35 + 0.65 * ribs ** 0.4) * (1.0 - 0.15 * max(0.0, -sz)))
    for i in range(rings):
        for j in range(seg):
            a, b = i * seg + j, i * seg + (j + 1) % seg
            faces += [(a, b + seg, b), (a, a + seg, b + seg)]
    mb.add(pts, cols, nrms, faces)
    tube(mb, [(0, 0, R * 1.45), (0.02, 0.01, R * 1.75), (0.05, -0.02, R * 1.85)], 0.02, shade('#6a6a2a'), seg=6)
    # the vine curling off along the ground, broad leaves on it
    path = [(0.05, -0.02, 0.03)] + [(0.08 + t * 0.05 + math.cos(t * 4) * 0.06, 0.12 + math.sin(t * 4) * 0.06, 0.03) for t in [k * 0.25 for k in range(1, 9)]]
    tube(mb, path, 0.012, shade('#5a8a2a'), seg=5)
    for (x, y, a, s) in ((0.2, 0.18, 0.5, 1.0), (-0.18, 0.12, 2.3, 0.9), (0.3, -0.06, 1.2, 0.8), (-0.06, 0.28, 1.8, 0.85)):
        m = len(mb.v)

        def lf(p, nn):
            return rgb('#3e8a34') * (0.85 + 0.25 * min(1.0, math.hypot(p.x, p.y) / 0.14)) * (0.9 + 0.1 * max(0.0, nn.z))
        ball(mb, (0, 0, 0), (0.14 * s, 0.12 * s, 0.014), lf, sub=2)
        for i in range(m, len(mb.v)):
            p = mb.v[i]
            mb.v[i] = Vector((p.x, p.y, p.z + 0.8 * (p.x * p.x + p.y * p.y)))
        xform(mb, m, Matrix.Translation((x, y, 0.04)) @ Euler((0.2, 0.15, a)).to_matrix().to_4x4())
    return [(mb, 'main')]


CROPS = {'crop_soil': soil, 'crop_cabbage': cabbage, 'crop_wheat': wheat, 'crop_pumpkin': pumpkin}


if __name__ == '__main__':
    args = sys.argv[1:]
    prev = args[args.index('--preview') + 1] if '--preview' in args else None
    reset()
    shown = []
    for name, fn in CROPS.items():
        objs = [mb.obj(f'{name}_{p}', vmat(f'{name}_{p}', rough=0.8)) for mb, p in fn()]
        export(objs, name)
        shown.append(objs)
        print('built', name)
    if prev:
        ground_plane(color='#a8d088')
        light_rig()
        # a little field: soil rows with each crop
        row = 0
        for k, objs in enumerate(shown):
            for o in objs:
                o.matrix_world = Matrix.Translation((k * 1.2 - 1.8, 0, 0)) @ o.matrix_world
        camera((0, 0, 0.2), dist=4.2, pitch=34)
        render(os.path.join(prev, 'crops.png'), size=(1000, 560), samples=40)
