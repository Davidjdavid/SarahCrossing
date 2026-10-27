"""The island's pines (stacked skirts of dark needles, lighter at the tips), sunflowers (three together, as behind the
cottage's fence) and clumps of wild flowers (tulips, daisies, cosmos, lilies and a mixed one). (The broadleaf trees,
palms and bushes are trees_ac.py.)

The pines are modelled in full (every branch, every needle tuft) and baked onto a light mesh; the sunflowers bake their
own shade; the flower clumps are small enough to keep their colors in the mesh.

    python tools/blender/vegetation.py [--preview DIR] [--only NAME]
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
import numpy as np
from mathutils import Vector, Matrix, Euler, noise
from common import *
from props import vcol_mat, bake_self

LIGHT = Vector((-0.45, -0.3, 0.84)).normalized()


def rgb(c):
    return hex_rgb(c) if isinstance(c, str) else c


def tone_color(pal, tone):
    tone = min(len(pal) - 1.001, max(0.0, tone))
    i = int(tone)
    return mix(pal[i], pal[i + 1], tone - i)


def bake_low(hi, lo, size, name, extrusion=0.1, max_dist=0.25, ao_floor=0.38):
    smart_uv(lo, margin=0.006)
    lo.data.materials.append(material(lo.name + '_mat', rough=1))
    kw = dict(high=hi, extrusion=extrusion, max_dist=max_dist)
    diff = bake(lo, 'DIFFUSE', size, samples=4, **kw)
    ao = bake(lo, 'AO', size, samples=48, **kw)
    nrm = bake(lo, 'NORMAL', size, samples=4, **kw)
    a = image_array(diff)
    o = image_array(ao)[..., :1]
    a[..., :3] *= (ao_floor + (1 - ao_floor) * o ** 1.3)
    lo.data.materials.clear()
    lo.data.materials.append(material(lo.name + '_mat', image=image_from_array(lo.name + '_col', a), normal=nrm, rough=1))
    return lo


def decimate_to(o, faces):
    n = len(o.data.polygons)
    if n > faces:
        m = o.modifiers.new('dec', 'DECIMATE')
        m.ratio = faces / n
        apply_modifiers(o)


def bark(bm, col, x, y, z0, z1, r0, r1, c0='#4a3424', c1='#6e5038', sides=8):
    res = bmesh.ops.create_cone(bm, cap_ends=True, segments=sides, radius1=r0, radius2=r1, depth=z1 - z0, matrix=Matrix.Translation((x, y, (z0 + z1) / 2)))
    for v in res['verts']:
        k = 0.5 + 0.5 * noise.noise(v.co * 9)
        v[col] = mix(hex_rgb(c0), hex_rgb(c1), k)


# ---------------------------------------------------------------- baking a crown
def leafy_material():
    """The puffs' color with leaves in it: a fine speckle of lighter and darker leaves, darker where leaves overlap."""
    m = material('crown_high', vcol='Col', rough=1)
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    vc = [n for n in nt.nodes if n.bl_idname == 'ShaderNodeVertexColor'][0]
    tc = nt.nodes.new('ShaderNodeTexCoord')
    nz = nt.nodes.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = 38
    nz.inputs['Detail'].default_value = 3
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    vo = nt.nodes.new('ShaderNodeTexVoronoi')
    vo.inputs['Scale'].default_value = 26
    vo.feature = 'DISTANCE_TO_EDGE'
    nt.links.new(tc.outputs['Object'], vo.inputs['Vector'])
    # speckle: 0.8..1.12 from the noise; leaf edges a touch darker
    sp = nt.nodes.new('ShaderNodeMapRange')
    sp.inputs['From Min'].default_value, sp.inputs['From Max'].default_value = 0.3, 0.7
    sp.inputs['To Min'].default_value, sp.inputs['To Max'].default_value = 0.72, 1.16
    nt.links.new(nz.outputs['Fac'], sp.inputs['Value'])
    ed = nt.nodes.new('ShaderNodeMapRange')
    ed.inputs['From Min'].default_value, ed.inputs['From Max'].default_value = 0.0, 0.08
    ed.inputs['To Min'].default_value, ed.inputs['To Max'].default_value = 0.7, 1.0
    nt.links.new(vo.outputs['Distance'], ed.inputs['Value'])
    k = nt.nodes.new('ShaderNodeMath')
    k.operation = 'MULTIPLY'
    nt.links.new(sp.outputs['Result'], k.inputs[0])
    nt.links.new(ed.outputs['Result'], k.inputs[1])
    mul = nt.nodes.new('ShaderNodeVectorMath')
    mul.operation = 'SCALE'
    nt.links.new(vc.outputs['Color'], mul.inputs[0])
    nt.links.new(k.outputs['Value'], mul.inputs['Scale'])
    nt.links.new(mul.outputs['Vector'], bsdf.inputs['Base Color'])
    return m


def crown_low(high, ratio, name):
    """The crown as one closed surface (the puffs fused) at game weight."""
    me = high.data.copy()
    o = link(bpy.data.objects.new(name, me))
    o.data.materials.clear()
    select_only(o)
    o.data.remesh_voxel_size = 0.035
    bpy.ops.object.voxel_remesh()
    # smooth away the leaf bumps (the normal map has them) so the simplified outline keeps clusters, not spikes
    sm = o.modifiers.new('sm', 'SMOOTH')
    sm.factor, sm.iterations = 0.6, 3
    m = o.modifiers.new('dec', 'DECIMATE')
    m.ratio = ratio
    apply_modifiers(o)
    shade_smooth(o)
    return o


# ---------------------------------------------------------------- pines
PINES = {
    'pine_a': dict(seed=5, height=4.7, radius=1.25, tiers=7),
    'pine_b': dict(seed=9, height=3.9, radius=1.05, tiers=6),
}
PINE_PAL = [hex_rgb(c) for c in ('#78b070', '#4e9058', '#336f46', '#224f37', '#163a2b', '#0f2a20')]


def pine_high(rng, spec):
    """Tiers of drooping branches round the trunk, each branch a flat sprig of needle tufts: lit and lighter on top and
    at the tips, dark underneath and toward the trunk, as the concept's pines are."""
    bm = bmesh.new()
    col = bm.verts.layers.float_color.new('Col')
    Hh, Rb, n = spec['height'], spec['radius'], spec['tiers']
    for i in range(n):
        t = i / (n - 1)
        z = 0.75 + t * (Hh - 1.35) + rng.uniform(-0.05, 0.05)
        R = Rb * (1 - t) ** 0.85 + 0.22
        droop = 0.32 * R
        m = max(5, int(math.tau * R / 0.42))
        off = rng.random() * math.tau
        for j in range(m):
            a = off + j / m * math.tau + rng.uniform(-0.15, 0.15)
            L = R * rng.uniform(0.86, 1.08)
            wid = 0.2 + 0.24 * L
            th = 0.1 + 0.05 * R
            d = Vector((math.cos(a), math.sin(a), 0))
            s = Vector((-d.y, d.x, 0))
            res = bmesh.ops.create_icosphere(bm, subdivisions=3, radius=1)
            seed = Vector((rng.random() * 40, rng.random() * 40, rng.random() * 40))
            for v in res['verts']:
                p = v.co.copy()
                u = (p.x + 1) / 2                      # 0 at the trunk, 1 at the tip
                # a sprig: narrow at the trunk, widest two thirds out, rounded at the tip; sagging toward the tip
                w = wid * (0.45 + 0.75 * math.sin(min(1.0, u * 1.15) * math.pi * 0.62))
                q = d * (u * L) + s * (p.y * w / 2) + Vector((0, 0, p.z * th / 2 - droop * u ** 1.7 + 0.06 * u))
                nrm = (d * p.x * 0.6 + s * p.y + Vector((0, 0, p.z * 1.4))).normalized()
                # needle tufts: pointed bumps over the sprig, and a ragged edge
                f1 = noise.voronoi(q * 16 + seed, distance_metric='DISTANCE')[0][0]
                peak = (1 - min(1.0, f1 * 1.8)) ** 1.6
                q += nrm * (0.045 * peak + 0.03 * noise.noise(q * 5 + seed))
                v.co = Vector((0, 0, z)) + q
                lit = nrm.dot(LIGHT)
                tone = 3.3 - t * 0.6 - lit * 1.5 - u * 1.1 + (1 - peak) * 0.7 + rng.uniform(-0.15, 0.15)
                cc = tone_color(PINE_PAL, tone)
                k = 0.95 + 0.1 * noise.noise(q * 7 + seed)
                v[col] = (cc[0] * k, cc[1] * k, cc[2] * k, 1)
    # a dark core up the middle so no light shows through, a point on top
    res = bmesh.ops.create_cone(bm, cap_ends=True, segments=10, radius1=Rb * 0.42, radius2=0.04, depth=Hh - 0.9, matrix=Matrix.Translation((0, 0, 0.6 + (Hh - 0.9) / 2)))
    for v in res['verts']:
        v[col] = PINE_PAL[4]
    res = bmesh.ops.create_cone(bm, cap_ends=True, segments=8, radius1=0.16, radius2=0.0, depth=0.5, matrix=Matrix.Translation((0, 0, Hh - 0.2)))
    for v in res['verts']:
        v[col] = tone_color(PINE_PAL, 1.6 - v.co.z * 0.0)
    o = mesh_obj('pine_high', bm)
    shade_smooth(o)
    o.data.materials.append(leafy_material())
    return o


def pine(name, spec):
    rng = random.Random(spec['seed'])
    hi = pine_high(rng, spec)
    bm = bmesh.new()
    col = bm.verts.layers.float_color.new('Col')
    bark(bm, col, 0, 0, 0, 1.2, 0.14, 0.08)
    tr = mesh_obj(name + '_trunk', bm)
    shade_smooth(tr)
    tr.data.materials.append(vcol_mat(name + '_bark'))
    bake_self(tr, size=128)
    out = {}
    for lod, faces in enumerate((5000, 1500)):
        lo = crown_low(hi, 1.0, f'{name}_crown{lod}')
        decimate_to(lo, faces)
        out[lod] = bake_low(hi, lo, 1024 if lod == 0 else 512, name, extrusion=0.12, max_dist=0.3)
    return hi, tr, out


# ---------------------------------------------------------------- sunflowers
def petal(bm, col, origin, frame, length, width, color, base, tilt=0.0, seg=(8, 5)):
    """A petal: a flattened, slightly cupped ellipsoid from origin outward along frame[0]."""
    d, s, n = frame
    res = bmesh.ops.create_uvsphere(bm, u_segments=seg[0], v_segments=seg[1], radius=1)
    for v in res['verts']:
        p = v.co.copy()
        u = (p.x + 1) / 2
        w = width / 2 * math.sin(max(0.0, min(1.0, u)) * math.pi) ** 0.7
        q = origin + d * (u * length) + s * (p.y * w) + n * (p.z * 0.006 + 0.02 * (p.y ** 2) - tilt * u * length)
        v.co = q
        v[col] = mix(rgb(base), rgb(color), min(1.0, u * 1.6))


def sunflowers():
    """Three sunflowers together, a tall one in the middle: heavy heads turned to the south and a little up, a brown
    seed disc in two rings of yellow petals, big leaves down the stems."""
    rng = random.Random(21)
    bm = bmesh.new()
    col = bm.verts.layers.float_color.new('Col')
    for (x, y, h) in ((-0.32, 0.03, 1.18), (0.02, -0.02, 1.46), (0.34, 0.05, 1.05)):
        # the stem, leaning a touch
        lean = Vector((rng.uniform(-0.06, 0.06), rng.uniform(-0.06, 0.0), 0))
        top = Vector((x, y, h)) + lean
        res = bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=0.024, radius2=0.017, depth=h, matrix=Matrix.Translation((x, y, h / 2)))
        for v in res['verts']:
            f = v.co.z / h
            v.co += lean * f
            v[col] = mix(hex_rgb('#3a6a26'), hex_rgb('#5a9036'), f)
        # leaves: broad hearts drooping from the stem
        for k in range(4):
            f = 0.26 + k * 0.15 + rng.uniform(-0.03, 0.03)
            a = rng.uniform(0, math.tau)
            o = Vector((x, y, h * f)) + lean * f
            d = Vector((math.cos(a), math.sin(a), 0.25)).normalized()
            s = Vector((-math.sin(a), math.cos(a), 0))
            nrm = d.cross(s).normalized()
            if nrm.z < 0:
                nrm = -nrm
            res = bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=6, radius=1)
            L = rng.uniform(0.2, 0.26)
            for v in res['verts']:
                p = v.co.copy()
                u = (p.x + 1) / 2
                w = L * 0.36 * math.sin(max(0.0, min(1.0, u)) * math.pi) ** 0.6 * (1.15 - 0.4 * u)
                q = o + d * (u * L) + s * (p.y * w) + nrm * (p.z * 0.008 - 0.09 * u * u + 0.03 * p.y ** 2)
                v.co = q
                v[col] = mix(hex_rgb('#2f5e22'), hex_rgb('#5c9a38'), 0.35 + 0.4 * u + 0.25 * max(0.0, p.z))
        # the head: facing south (-y) and up a little
        face = Vector((rng.uniform(-0.25, 0.25), -1, 0.55)).normalized()
        up = Vector((0, 0, 1))
        sx = face.cross(up).normalized()
        sy = sx.cross(face).normalized()
        c = top + face * 0.02
        R = rng.uniform(0.1, 0.12)
        # the back: a green cup
        res = bmesh.ops.create_uvsphere(bm, u_segments=14, v_segments=7, radius=1)
        for v in res['verts']:
            p = v.co.copy()
            v.co = c + sx * p.x * R * 1.05 + sy * p.y * R * 1.05 + face * (p.z * 0.04 - 0.03)
            v[col] = hex_rgb('#3f7028')
        # petals: two rings, yellow with a warmer base, the back ring a shade deeper
        for ring, (cnt, Lp, colr, base, lift) in enumerate(((16, R * 1.25, '#ffc824', '#f09a1c', 0.012), (14, R * 1.1, '#ffdc44', '#f8b02a', 0.022))):
            for i in range(cnt):
                a = (i + ring * 0.5) / cnt * math.tau + rng.uniform(-0.05, 0.05)
                d = sx * math.cos(a) + sy * math.sin(a)
                s2 = face.cross(d).normalized()
                petal(bm, col, c + d * R * 0.62 + face * lift, (d, s2, face), Lp * rng.uniform(0.9, 1.1), R * 0.52, colr, base, tilt=0.12)
        # the seed disc: domed, dark brown, a ring of lighter florets at its edge
        res = bmesh.ops.create_uvsphere(bm, u_segments=18, v_segments=8, radius=1)
        for v in res['verts']:
            p = v.co.copy()
            rr = math.hypot(p.x, p.y)
            v.co = c + sx * p.x * R * 0.66 + sy * p.y * R * 0.66 + face * (max(0.0, p.z) * 0.035 + 0.024)
            k = 0.5 + 0.5 * noise.noise(Vector((p.x, p.y, 0)) * 9)
            cc = mix(hex_rgb('#2e1a0c'), hex_rgb('#5a3418'), k)
            if rr > 0.8 and p.z > 0:
                cc = mix(cc, hex_rgb('#8a5a20'), 0.6)
            v[col] = cc
    o = mesh_obj('sunflowers', bm)
    shade_smooth(o)
    o.data.materials.append(vcol_mat('sf_mat'))
    return bake_self(o, size=512)


# ---------------------------------------------------------------- wild flowers
FLOWERS = {
    'flowers_tulip': dict(seed=61, shape='cup', cols=['#e8324a', '#ff5a6a', '#ffcf3a', '#ff8ab8'], centre=None, n=6),
    'flowers_daisy': dict(seed=67, shape='star', cols=['#ffffff', '#fffaf0', '#f8f4e8'], centre='#ffcc2a', n=7, petals=12),
    'flowers_cosmos': dict(seed=71, shape='star', cols=['#ff8ac0', '#f06aa8', '#ffffff', '#e050a0'], centre='#ffd040', n=6, petals=8),
    'flowers_lily': dict(seed=73, shape='lily', cols=['#ffffff', '#ffd0dc', '#fff2c0'], centre='#f0a030', n=5),
    'flowers_mixed': dict(seed=79, shape='star', cols=['#ffffff', '#ff8ac0', '#ffd44a', '#b48af0', '#ff6a5a'], centre='#ffcc2a', n=8, petals=7),
}


def flower_clump(name, spec, lod=0):
    """A clump of wild flowers: leaves at the foot, five to eight blossoms on stems of different heights, the colors
    darker toward the ground (the shade among the leaves is painted in, the clump is too small to bake). The phones'
    version (lod 1) has the same blossoms in the same places, each petal and leaf a coarser shape, fewer petals to a
    daisy."""
    rng = random.Random(spec['seed'])
    bm = bmesh.new()
    col = bm.verts.layers.float_color.new('Col')
    seg = (8, 5) if lod == 0 else (5, 3)
    # leaves: blades and ovals fanning out from the middle
    # (the same random numbers drawn either way, so the phones' clump has its blossoms in the same places)
    for k in range(15):
        a = k / 15 * math.tau + rng.uniform(-0.3, 0.3)
        d = Vector((math.cos(a), math.sin(a), rng.uniform(0.5, 1.5))).normalized()
        s = Vector((-math.sin(a), math.cos(a), 0))
        L = rng.uniform(0.13, 0.22)
        if lod and k % 3 == 2:
            continue
        res = bmesh.ops.create_uvsphere(bm, u_segments=6 if lod == 0 else 4, v_segments=4 if lod == 0 else 3, radius=1)
        for v in res['verts']:
            p = v.co.copy()
            u = (p.x + 1) / 2
            w = L * 0.3 * math.sin(max(0.0, min(1.0, u)) * math.pi) ** 0.7
            q = d * (u * L) + s * (p.y * w) + Vector((0, 0, p.z * 0.005 - 0.04 * u * u))
            v.co = q
            v[col] = mix(hex_rgb('#2a5420'), hex_rgb('#5e9a3a'), 0.25 + 0.6 * u)
    cols = spec['cols']
    for i in range(spec['n']):
        a = rng.uniform(0, math.tau)
        rr = rng.uniform(0.0, 0.17)
        base = Vector((math.cos(a) * rr, math.sin(a) * rr * 0.8, 0))
        h = rng.uniform(0.18, 0.34)
        top = base + Vector((rng.uniform(-0.04, 0.04), rng.uniform(-0.04, 0.02), h))
        # the stem
        res = bmesh.ops.create_cone(bm, cap_ends=False, segments=4, radius1=0.008, radius2=0.006, depth=1, matrix=Matrix.Translation((0, 0, 0.5)))
        for v in res['verts']:
            f = v.co.z
            v.co = base.lerp(top, f) + Vector((v.co.x, v.co.y, 0))
            v[col] = mix(hex_rgb('#2e5a22'), hex_rgb('#4e8a30'), f)
        c = hex_rgb(rng.choice(cols))
        cd = mix(c, hex_rgb('#40301e'), 0.35)
        face = Vector((rng.uniform(-0.4, 0.4), rng.uniform(-0.7, -0.1), 1)).normalized()
        sx = face.cross(Vector((0.3, 0.1, 0.9))).normalized()
        sy = sx.cross(face).normalized()
        if spec['shape'] == 'cup':
            # a tulip: four petals standing round a cup
            for k in range(5):
                an = k / 5 * math.tau
                d = (sx * math.cos(an) + sy * math.sin(an)) * 0.35 + face
                d.normalize()
                s2 = face.cross(d)
                if s2.length < 1e-4:
                    s2 = sx
                s2.normalize()
                petal(bm, col, top - face * 0.01 + (sx * math.cos(an) + sy * math.sin(an)) * 0.012, (d, s2, -(d.cross(s2)).normalized()), 0.075, 0.05, c, cd, seg=seg)
        elif spec['shape'] == 'lily':
            for k in range(6):
                an = k / 6 * math.tau
                d = ((sx * math.cos(an) + sy * math.sin(an)) * 0.9 + face * 0.6).normalized()
                s2 = face.cross(d).normalized()
                petal(bm, col, top, (d, s2, face), 0.075, 0.03, c, cd, tilt=-0.25, seg=seg)
        else:
            m = spec['petals'] if lod == 0 else min(spec['petals'], 8)
            jit = [rng.uniform(-0.05, 0.05) for _ in range(spec['petals'])]
            for k in range(m):
                an = k / m * math.tau + jit[k]
                d = (sx * math.cos(an) + sy * math.sin(an))
                s2 = face.cross(d).normalized()
                petal(bm, col, top + d * 0.012, (d, s2, face), 0.05 if spec['petals'] > 9 else 0.055, (0.02 if spec['petals'] > 9 else 0.034) * (1 if m == spec['petals'] else 1.3), c, mix(c, cd, 0.5), tilt=0.12, seg=seg)
        if spec.get('centre'):
            res = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1, matrix=Matrix.Translation(top + face * 0.006) @ Matrix.Diagonal((0.014, 0.014, 0.01, 1)))
            for v in res['verts']:
                v[col] = hex_rgb(spec['centre'])
    o = mesh_obj(name, bm)
    shade_smooth(o)
    o.data.materials.append(vcol_mat(name + '_mat'))
    # (drawn at the concept's size: a clump reaches a person's knee, a blossom is as big as a hand)
    o.scale = (1.35, 1.35, 1.35)
    bpy.ops.object.select_all(action='DESELECT')
    select_only(o)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return o


# (the one-plant-per-kind flowers, flower_<kind>, are flowers.py's)


# ---------------------------------------------------------------- main
def lineup(path, objs, dist=None, target_z=0.9, size=(1200, 600)):
    ground_plane()
    person(x=-1.2, y=-0.3)
    light_rig()
    x = 0
    for o in objs:
        for p in o if isinstance(o, (list, tuple)) else [o]:
            p.location.x += x
            p.hide_render = False
        w = max(p.dimensions.x for p in (o if isinstance(o, (list, tuple)) else [o]))
        x += max(0.9, w + 0.4)
    camera((x / 2 - 0.5, 0, target_z), dist=dist or max(6, x * 1.1))
    render(path, size=size, samples=64)


if __name__ == '__main__':
    args = sys.argv[1:]
    prev = args[args.index('--preview') + 1] if '--preview' in args else None
    only = args[args.index('--only') + 1] if '--only' in args else None
    want = lambda n: not only or n == only or n.startswith(only)
    shown = {'trees': [], 'small': []}
    reset()
    for name, spec in PINES.items():
        if not want(name):
            continue
        hi, tr, lods = pine(name, spec)
        hi.hide_render = True
        export([lods[0], tr], name)
        tr1 = tr.copy()
        tr1.data = tr.data.copy()
        link(tr1)
        export([lods[1], tr1], name + '_lod1')
        lods[1].hide_render = tr1.hide_render = True
        shown['trees'].append([lods[0], tr])
        print('built', name)
    if want('sunflowers'):
        o = sunflowers()
        export([o], 'sunflowers')
        shown['small'].append(o)
        print('built sunflowers')
    for name, spec in FLOWERS.items():
        if not want(name):
            continue
        o = flower_clump(name, spec)
        export([o], name)
        o1 = flower_clump(name + '_lod1', spec, lod=1)
        export([o1], name + '_lod1')
        o1.hide_render = True
        shown['small'].append(o)
        print('built', name)
    if prev:
        objs = shown['trees'] + shown['small']
        for o in bpy.context.scene.objects:
            o.hide_render = True
        lineup(os.path.join(prev, 'vegetation.png'), objs, target_z=1.2)
        if shown['small']:
            # the small things close up, in their own row
            small = [o if isinstance(o, (list, tuple)) else [o] for o in shown['small']]
            flat = [p for g in small for p in g]
            for o in bpy.context.scene.objects:
                o.hide_render = o.name not in ('Cam', 'Sun', 'Ground') and o not in flat
            xs = [g[0].location.x for g in small]
            x0 = min(xs)
            for i, g in enumerate(small):
                for o in g:
                    o.location.x = x0 + i * 0.75
            camera((x0 + (len(xs) - 1) * 0.375, 0, 0.3), dist=max(2.6, len(xs) * 0.62))
            render(os.path.join(prev, 'small.png'), size=(1200, 600), samples=64)
