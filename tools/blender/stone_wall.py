"""The dry-stone wall where one level of ground meets the next (the concept's wall by the waterfall): big flat-faced
stones of five to seven sides in rough courses, warm greys and browns, a few greener with moss, deep dark gaps between
them, moss along the foot, and the grass of the ground above hanging over the top in a ragged lip.

Pieces: straight lengths of 2 and 1 tiles in a few stone layouts (so a long wall doesn't repeat), and a corner. Each
piece's face is its front (-y here, south in the game), from the lower ground (z 0) to the upper ground (z HEIGHT), its
back hidden in the higher ground. The stones are modelled in full and baked onto a lighter copy of themselves.

    python tools/blender/stone_wall.py [--preview DIR]
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
import numpy as np
from mathutils import Vector, Matrix, noise
from common import *

HEIGHT = 1.5        # ENV.LV in 33a_env.js: one level of ground
DEPTH = 0.55        # how far back the piece goes (into the higher ground)
PIECES = {
    'wall2_a': dict(length=2.0, seed=101), 'wall2_b': dict(length=2.0, seed=202), 'wall2_c': dict(length=2.0, seed=303),
    'wall1_a': dict(length=1.0, seed=404), 'wall1_b': dict(length=1.0, seed=505),
    'wall_corner': dict(length=0.7, seed=606, corner=True),
}
STONE = ['#8a7b6b', '#978877', '#7b6d5f', '#a39380', '#85776a', '#93836f', '#76695d', '#9d8d7a']
MOSS, MOSS2 = '#6a8238', '#86a046'
GAP = '#3a3028'
GRASS = ['#4a7f30', '#5a9638', '#6aa840', '#7cb84a', '#90c656']


def clip(poly, a, b):
    """Keep the part of a convex polygon nearer to point a than to b (the half-plane of their bisector)."""
    m = (a + b) / 2
    n = b - a
    out = []
    for i, p in enumerate(poly):
        q = poly[(i + 1) % len(poly)]
        dp, dq = (p - m).dot(n), (q - m).dot(n)
        if dp <= 0:
            out.append(p)
        if (dp < 0) != (dq < 0) and abs(dp - dq) > 1e-9:
            t = dp / (dp - dq)
            out.append(p + (q - p) * t)
    return out


def layout(rng, L, h):
    """Stone outlines on the face (x along, y up): sites in rough courses, their Voronoi cells within the face."""
    sites = []
    rows = 3 if h > 1.2 else 2
    for r in range(rows):
        z = (r + 0.5) / rows * h + rng.uniform(-0.06, 0.06)
        x = rng.uniform(-0.35, 0.05)
        while x < L + 0.4:
            sites.append(Vector((x + rng.uniform(-0.06, 0.06), z + rng.uniform(-0.08, 0.08))))
            x += rng.uniform(0.5, 0.82)
    rect = [Vector((0, 0)), Vector((L, 0)), Vector((L, h)), Vector((0, h))]
    cells = []
    for i, s in enumerate(sites):
        poly = rect[:]
        for j, t in enumerate(sites):
            if i != j and (t - s).length < 2.0:
                poly = clip(poly, s, t)
                if len(poly) < 3:
                    break
        if len(poly) >= 3:
            cells.append((s, poly))
    return cells


def shrink(poly, d):
    """Pull a convex polygon's corners in by about d (towards its middle, and off its edges)."""
    c = sum(poly, Vector((0, 0))) / len(poly)
    out = []
    for p in poly:
        v = p - c
        l = v.length
        out.append(c + v * max(0.0, (l - d * 1.4) / max(l, 1e-6)))
    return out


def stones(rng, L, h):
    """The stones as one mesh: each cell pushed out as a block with rounded edges and a rough, bulging face."""
    bm = bmesh.new()
    col = bm.verts.layers.float_color.new('Col')
    for s, poly in layout(rng, L, h):
        poly = shrink(poly, 0.028)
        area = abs(sum(poly[i].x * poly[(i + 1) % len(poly)].y - poly[(i + 1) % len(poly)].x * poly[i].y for i in range(len(poly)))) / 2
        if area < 0.01:
            continue
        depth = rng.uniform(0.16, 0.26)
        out = rng.uniform(-0.03, 0.03)
        base = hex_rgb(rng.choice(STONE))
        mossy = rng.random() < 0.3
        front = [bm.verts.new((p.x, -(depth + out), p.y)) for p in poly]
        back = [bm.verts.new((p.x, 0.05, p.y)) for p in poly]
        f = bm.faces.new(front)
        f.normal_update()
        if f.normal.y > 0:
            f.normal_flip()
        b = bm.faces.new(list(reversed(back)) if f.normal.y < 0 else back)
        n = len(poly)
        for i in range(n):
            j = (i + 1) % n
            sf = bm.faces.new((front[i], front[j], back[j], back[i]))
            sf.normal_update()
            mid = (front[i].co + front[j].co) / 2
            if sf.normal.dot(Vector((mid.x - s.x, 0, mid.z - s.y))) < 0:
                sf.normal_flip()
        zlo, zhi = min(p.y for p in poly), max(p.y for p in poly)
        for v in front + back:
            m = 0.0
            if mossy:
                m = 0.35
            # moss along each stone's top edge (as the concept paints it), and over the foot of the wall
            t = (v.co.z - zlo) / max(0.01, zhi - zlo)
            m += max(0.0, t - 0.62) * 1.6 * rng.uniform(0.5, 1.0)
            m += max(0.0, 0.3 - v.co.z / h) * 1.5
            m = min(0.85, m)
            c = mix(base, hex_rgb(MOSS2 if t > 0.8 else MOSS), m)
            k = 0.92 + 0.16 * rng.random()
            v[col] = (c[0] * k, c[1] * k, c[2] * k, 1)
    o = mesh_obj('stones', bm)
    # round the edges, smooth, then roughen the faces (a noise pushes every point a little)
    bv = o.modifiers.new('bevel', 'BEVEL')
    bv.width, bv.segments, bv.limit_method = 0.045, 3, 'ANGLE'
    o.modifiers.new('sub', 'SUBSURF').levels = 2
    tex = bpy.data.textures.new('rock', 'CLOUDS')
    tex.noise_scale = 0.12
    tex.noise_depth = 3
    dp = o.modifiers.new('disp', 'DISPLACE')
    dp.texture = tex
    dp.strength = 0.035
    dp.mid_level = 0.5
    apply_modifiers(o)
    shade_smooth(o)
    return o


def backing(L, h, corner=False):
    """The dark fill behind the stones (what shows in the gaps)."""
    bm = bmesh.new()
    col = bm.verts.layers.float_color.new('Col')
    v = [bm.verts.new(p) for p in ((0, -0.02, 0), (L, -0.02, 0), (L, -0.02, h), (0, -0.02, h))]
    f = bm.faces.new(v)
    f.normal_update()
    if f.normal.y > 0:
        f.normal_flip()
    for vv in v:
        vv[col] = hex_rgb(GAP)
    return mesh_obj('backing', bm)


def turf(rng, L, h, low=False):
    """The grass of the ground above, rolling over the top edge: a lip with a ragged hanging edge, and (high only)
    blades falling over the stones."""
    bm = bmesh.new()
    col = bm.verts.layers.float_color.new('Col')
    n = max(8, int(L * 14))
    top, edge, hang = [], [], []
    for i in range(n + 1):
        x = i / n * L
        drop = 0.07 + 0.07 * (0.5 + 0.5 * noise.noise(Vector((x * 2.3, 0.5, 0)))) + (0.05 if rng.random() < 0.18 else 0)
        # (only the edge: the ground's own grass is behind it)
        top.append(bm.verts.new((x, 0.02, h + 0.012)))
        edge.append(bm.verts.new((x, -0.2, h + 0.022)))
        hang.append(bm.verts.new((x, -0.25, h - drop)))
    for i in range(n):
        for a, b in ((top, edge), (edge, hang)):
            f = bm.faces.new((a[i], a[i + 1], b[i + 1], b[i]))
            f.normal_update()
            if f.normal.z < -0.2 or (b is hang and f.normal.y > 0):
                f.normal_flip()
    for vv in top + edge:
        vv[col] = hex_rgb(rng.choice(GRASS[2:]))
    for vv in hang:
        vv[col] = hex_rgb(rng.choice(GRASS[:2]))
    if not low:
        # blades: thin curved triangles over the lip, the longest falling down the stones
        for k in range(int(L * 260)):
            x = rng.uniform(0, L)
            y = rng.uniform(-0.24, 0.1)
            z0 = h + 0.02
            ln = rng.uniform(0.06, 0.16) * (1.8 if y < -0.15 and rng.random() < 0.5 else 1)
            ang = rng.uniform(-0.6, 0.6)
            out = -1 if y < -0.1 else 0
            tip = Vector((x + math.sin(ang) * ln * 0.4, y + out * ln * 0.6, z0 + (ln * 0.7 if out == 0 else -ln * 0.5)))
            w = rng.uniform(0.008, 0.016)
            a = bm.verts.new((x - w, y, z0))
            b2 = bm.verts.new((x + w, y, z0))
            t = bm.verts.new(tip)
            f = bm.faces.new((a, b2, t))
            f.normal_update()
            if f.normal.y > 0:
                f.normal_flip()
            c = hex_rgb(rng.choice(GRASS))
            for vv in (a, b2):
                vv[col] = mix(c, (0.16, 0.26, 0.08, 1), 0.25)
            t[col] = c
        # a few tiny flowers in the grass
        for k in range(int(L * 4)):
            x, y = rng.uniform(0.05, L - 0.05), rng.uniform(-0.2, 0.05)
            c = hex_rgb(rng.choice(['#ffffff', '#ffe066', '#f3a6c8']))
            res = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.025, matrix=Matrix.Translation((x, y, h + 0.1)))
            for vv in res['verts']:
                vv[col] = c
    o = mesh_obj('turf', bm)
    shade_smooth(o)
    return o


def corner_stones(rng, h):
    """A corner: a stack of big squarish stones, faced on the front and the side."""
    bm = bmesh.new()
    col = bm.verts.layers.float_color.new('Col')
    z = 0
    while z < h - 0.05:
        sh = min(h - z, rng.uniform(0.32, 0.5))
        w = rng.uniform(0.62, 0.72)
        res = bmesh.ops.create_cube(bm, size=1, matrix=Matrix.Translation((0.35, -0.12, z + sh / 2)) @ Matrix.Diagonal((w, 0.62, sh - 0.03, 1)))
        c = hex_rgb(rng.choice(STONE))
        for vv in res['verts']:
            vv[col] = mix(c, hex_rgb(MOSS), max(0, 0.3 - z / h))
        z += sh
    o = mesh_obj('stones', bm)
    bv = o.modifiers.new('bevel', 'BEVEL')
    bv.width, bv.segments = 0.05, 3
    o.modifiers.new('sub', 'SUBSURF').levels = 2
    tex = bpy.data.textures.new('rock', 'CLOUDS')
    tex.noise_scale = 0.12
    dp = o.modifiers.new('disp', 'DISPLACE')
    dp.texture = tex
    dp.strength = 0.035
    apply_modifiers(o)
    shade_smooth(o)
    return o


def rock_material(name):
    """Stone with a fine grain and pits (baked into the piece's color and normal map)."""
    m = material(name, vcol='Col', rough=0.95)
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    vc = [n for n in nt.nodes if n.bl_idname == 'ShaderNodeVertexColor'][0]
    tc = nt.nodes.new('ShaderNodeTexCoord')
    nz = nt.nodes.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = 14
    nz.inputs['Detail'].default_value = 6
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['From Min'].default_value, mr.inputs['From Max'].default_value = 0.3, 0.7
    mr.inputs['To Min'].default_value, mr.inputs['To Max'].default_value = 0.82, 1.1
    nt.links.new(nz.outputs['Fac'], mr.inputs['Value'])
    mul = nt.nodes.new('ShaderNodeVectorMath')
    mul.operation = 'SCALE'
    nt.links.new(vc.outputs['Color'], mul.inputs[0])
    nt.links.new(mr.outputs['Result'], mul.inputs['Scale'])
    nt.links.new(mul.outputs['Vector'], bsdf.inputs['Base Color'])
    bump = nt.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.35
    nt.links.new(nz.outputs['Fac'], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    return m


def build(name, spec, tex=1024):
    rng = random.Random(spec['seed'])
    L, h = spec['length'], HEIGHT
    corner = spec.get('corner')
    st = corner_stones(rng, h) if corner else stones(rng, L, h)
    bk = backing(L, h)
    tf = turf(rng, L, h)
    for o in (st, bk, tf):
        o.data.materials.append(rock_material(name + '_hi'))
    select_only(st, bk, tf)
    bpy.ops.object.join()
    hi = bpy.context.active_object
    hi.name = name + '_high'
    # the game's piece: the stones simplified, the backing, the lip without its blades
    rng2 = random.Random(spec['seed'])
    st2 = corner_stones(rng2, h) if corner else stones(rng2, L, h)
    m = st2.modifiers.new('dec', 'DECIMATE')
    m.ratio = 0.05 if not corner else 0.08
    apply_modifiers(st2)
    bk2 = backing(L, h)
    tf2 = turf(random.Random(spec['seed'] + 1), L, h, low=True)
    select_only(st2, bk2, tf2)
    bpy.ops.object.join()
    lo = bpy.context.active_object
    lo.name = name
    shade_smooth(lo)
    lo.data.materials.clear()
    lo.data.materials.append(material(name + '_mat'))
    smart_uv(lo, margin=0.004)
    diff = bake(lo, 'DIFFUSE', tex, high=hi, extrusion=0.08, max_dist=0.3, samples=4)
    ao = bake(lo, 'AO', tex, high=hi, extrusion=0.08, max_dist=0.3, samples=48)
    nrm = bake(lo, 'NORMAL', tex, high=hi, extrusion=0.08, max_dist=0.3, samples=4)
    a = image_array(diff)
    o = image_array(ao)[..., :1]
    a[..., :3] *= (0.45 + 0.55 * o ** 1.2)
    colimg = image_from_array(name + '_col', a)
    lo.data.materials.clear()
    lo.data.materials.append(material(name + '_mat', image=colimg, normal=nrm, rough=0.95))
    hi.hide_render = True
    return hi, lo


def preview(path, los):
    ground_plane()
    # the higher ground behind the wall, a run of pieces along it
    bpy.ops.mesh.primitive_cube_add(size=1, location=(2.5, 3.0, HEIGHT / 2 - 0.001))
    up = bpy.context.active_object
    up.scale = (12, 6, HEIGHT)
    up.data.materials.append(material('upper', hex_rgb('#5f9a3a'), rough=1))
    person(x=1.0, y=-1.0)
    light_rig()
    camera((2.0, -0.5, 0.9), dist=7.0)
    render(path, size=(900, 600), samples=64)


if __name__ == '__main__':
    args = sys.argv[1:]
    prev = args[args.index('--preview') + 1] if '--preview' in args else None
    reset()
    built = {}
    for name, spec in PIECES.items():
        hi, lo = build(name, spec)
        export([lo], name)
        built[name] = (hi, lo)
        print('built', name)
    if prev:
        # a run: 2 + 2 + 1 + 2 with a corner, as the game will lay them
        x = -1.0
        for nm in ('wall2_a', 'wall2_b', 'wall1_a', 'wall2_c'):
            lo = built[nm][1]
            lo.location = (x, 0, 0)
            x += PIECES[nm]['length']
        for nm in ('wall1_b',):
            built[nm][1].hide_render = True
        built['wall_corner'][1].location = (x, 0, 0)
        preview(os.path.join(prev, 'stone_wall.png'), [])
