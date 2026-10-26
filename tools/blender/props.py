"""The miniature furniture of the concept, as models: the park bench (warm slats on a black iron frame with curled arms),
the street lamp (a black post on a stepped base, a square lantern with warm glass under a little pyramid roof), the
green mailbox on its post with a red flag, white picket and rustic split-rail fences, a planter of red flowers, and
pumpkins in a cluster with their stems, a vine and leaves.

Each is modelled at its real size with rounded edges, its materials (wood grain, paint, iron) made of nodes and baked
with the shade between its parts into one small picture on its own UVs. A lamp's glass is its own material so it can glow
at night (EnvModels treats any material named glass so).

    python tools/blender/props.py [--only NAME] [--preview DIR]
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
import numpy as np
from mathutils import Vector, Matrix, noise, Euler
from common import *


# ---------------------------------------------------------------- materials (nodes, baked away later)
def wood_mat(name, color, grain=0.18, scale=(1, 1, 24)):
    """Wood: the color in bands along the grain (z of the object's own coordinates stretched), knots of noise."""
    m = material(name, hex_rgb(color), rough=0.85)
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = scale
    nt.links.new(tc.outputs['Object'], mp.inputs['Vector'])
    wv = nt.nodes.new('ShaderNodeTexWave')
    wv.inputs['Scale'].default_value = 3.0
    wv.inputs['Distortion'].default_value = 6.0
    wv.inputs['Detail'].default_value = 3.0
    nt.links.new(mp.outputs['Vector'], wv.inputs['Vector'])
    mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['To Min'].default_value, mr.inputs['To Max'].default_value = 1 - grain, 1 + grain * 0.5
    nt.links.new(wv.outputs['Fac'], mr.inputs['Value'])
    mul = nt.nodes.new('ShaderNodeVectorMath')
    mul.operation = 'SCALE'
    mul.inputs[0].default_value = hex_rgb(color)[:3]
    nt.links.new(mr.outputs['Result'], mul.inputs['Scale'])
    nt.links.new(mul.outputs['Vector'], bsdf.inputs['Base Color'])
    return m


def paint_mat(name, color, speck=0.08, rough=0.6):
    """Paint or iron: the color with a fine mottling."""
    m = material(name, hex_rgb(color), rough=rough)
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord')
    nz = nt.nodes.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = 40
    nz.inputs['Detail'].default_value = 4
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['To Min'].default_value, mr.inputs['To Max'].default_value = 1 - speck, 1 + speck
    nt.links.new(nz.outputs['Fac'], mr.inputs['Value'])
    mul = nt.nodes.new('ShaderNodeVectorMath')
    mul.operation = 'SCALE'
    mul.inputs[0].default_value = hex_rgb(color)[:3]
    nt.links.new(mr.outputs['Result'], mul.inputs['Scale'])
    nt.links.new(mul.outputs['Vector'], bsdf.inputs['Base Color'])
    return m


def vcol_mat(name):
    return material(name, vcol='Col', rough=0.8)


# ---------------------------------------------------------------- building blocks
def cube(name, x0, y0, z0, x1, y1, z1, mat, bevel=0.01, segs=2):
    bpy.ops.mesh.primitive_cube_add(size=1, location=((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2))
    o = bpy.context.active_object
    o.name = name
    o.scale = (x1 - x0, y1 - y0, z1 - z0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        b = o.modifiers.new('bv', 'BEVEL')
        b.width, b.segments = bevel, segs
        b.limit_method = 'NONE'
    o.data.materials.append(mat)
    return o


def cyl(name, x, y, z0, z1, r0, r1=None, mat=None, verts=12, bevel=0.0):
    r1 = r0 if r1 is None else r1
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r0, radius2=r1, depth=z1 - z0, location=(x, y, (z0 + z1) / 2))
    o = bpy.context.active_object
    o.name = name
    if bevel:
        b = o.modifiers.new('bv', 'BEVEL')
        b.width, b.segments = bevel, 2
    if mat:
        o.data.materials.append(mat)
    shade_smooth(o)
    return o


def join(objs, name):
    for o in objs:
        apply_modifiers(o)
    select_only(*objs)
    bpy.ops.object.join()
    o = bpy.context.active_object
    o.name = name
    # (the joined object takes the last part's origin: put it back at the model's own, its foot at the world's)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return o


def bake_self(o, size=512, glass=None):
    """Bake the object's node materials and the shade between its parts into one picture on its own UVs; a glass
    material keeps its own slot (index kept) so the game can light it."""
    smart_uv(o, margin=0.01, angle=66)
    keep = [m for m in o.data.materials]
    diff = bake(o, 'DIFFUSE', size, samples=4, margin=6)
    ao = bake(o, 'AO', size, samples=48, margin=6)
    a = image_array(diff)
    oo = image_array(ao)[..., :1]
    a[..., :3] *= (0.45 + 0.55 * oo ** 1.1)
    img = image_from_array(o.name + '_col', a)
    for i, m in enumerate(keep):
        is_glass = glass and m.name.startswith(glass)
        o.data.materials[i] = material(o.name + ('_glass' if is_glass else '_mat'), image=img, rough=0.3 if is_glass else 0.8)
    return o


# ---------------------------------------------------------------- the props
def bench():
    """A park bench 1.8 long: four seat slats and three back slats, two iron sides (legs, a curled arm, the back post)."""
    wood = wood_mat('bench_wood', '#8a5630')
    iron = paint_mat('bench_iron', '#24252a', 0.06, 0.45)
    parts, rng = [], random.Random(3)
    L, sh = 1.8, 0.48
    for i in range(4):
        y0 = -0.27 + i * 0.125
        w = wood_mat(f'bench_wood{i}', ['#8a5630', '#94603a', '#7e502c', '#986438'][i])
        parts.append(cube(f'seat{i}', -L / 2, y0, sh - 0.04, L / 2, y0 + 0.11, sh, w, 0.012))
    for i in range(3):
        o = cube(f'back{i}', -L / 2, -0.02, 0, L / 2, 0.015, 0.1, wood_mat(f'bench_bw{i}', ['#905c34', '#84542c', '#946038'][i]), 0.012)
        o.rotation_euler = (math.radians(-14), 0, 0)
        o.location = (0, 0.24 + i * 0.03, 0.6 + i * 0.13)
        parts.append(o)
    for sx in (-1, 1):
        x = sx * (L / 2 - 0.12)
        # front leg, back leg (leaning back up to the top slat), the rail under the seat, the arm and its curl
        parts.append(cube(f'fl{sx}', x - 0.035, -0.26, 0, x + 0.035, -0.2, sh - 0.04, iron, 0.012))
        bl = cube(f'bl{sx}', x - 0.035, -0.03, 0, x + 0.035, 0.03, 1.06, iron, 0.012)
        bl.rotation_euler = (math.radians(-12), 0, 0)
        bl.location = (x, 0.2, 0)
        parts.append(bl)
        parts.append(cube(f'rail{sx}', x - 0.03, -0.3, sh - 0.09, x + 0.03, 0.26, sh - 0.04, iron, 0.01))
        parts.append(cube(f'arm{sx}', x - 0.035, -0.32, 0.68, x + 0.035, 0.2, 0.73, iron, 0.015))
        parts.append(cube(f'armpost{sx}', x - 0.03, -0.3, sh - 0.04, x + 0.03, -0.25, 0.7, iron, 0.01))
        bpy.ops.mesh.primitive_torus_add(major_radius=0.05, minor_radius=0.018, location=(x, -0.34, 0.66), rotation=(0, math.pi / 2, 0))
        cu = bpy.context.active_object
        cu.data.materials.append(iron)
        parts.append(cu)
        # feet
        for fy in (-0.23, 0.2):
            parts.append(cube(f'foot{sx}{fy}', x - 0.05, fy - 0.05, 0, x + 0.05, fy + 0.05, 0.03, iron, 0.01))
    o = join(parts, 'bench')
    shade_smooth(o)
    return bake_self(o)


def lamp():
    """A street lamp 2.95 tall: stepped base, a tapering post with rings, a square lantern with glass, a pyramid roof."""
    iron = paint_mat('lamp_iron', '#25272d', 0.07, 0.4)
    glass = material('glass_lamp', hex_rgb('#f6e2a4'), rough=0.2)
    parts = []
    parts.append(cube('b0', -0.17, -0.17, 0, 0.17, 0.17, 0.12, iron, 0.02))
    parts.append(cube('b1', -0.13, -0.13, 0.12, 0.13, 0.13, 0.24, iron, 0.02))
    parts.append(cyl('post', 0, 0, 0.24, 2.32, 0.06, 0.042, iron, verts=16))
    for z, r in ((0.32, 0.075), (0.62, 0.06), (2.24, 0.06)):
        bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=0.016, location=(0, 0, z))
        t = bpy.context.active_object
        t.data.materials.append(iron)
        parts.append(t)
    # the lantern: a plate, four corner bars, glass between, a band at the top, the roof and a finial
    parts.append(cube('plate', -0.17, -0.17, 2.3, 0.17, 0.17, 2.35, iron, 0.01))
    for sx in (-1, 1):
        for sy in (-1, 1):
            parts.append(cube(f'bar{sx}{sy}', sx * 0.14 - 0.02, sy * 0.14 - 0.02, 2.35, sx * 0.14 + 0.02, sy * 0.14 + 0.02, 2.78, iron, 0.006))
    parts.append(cube('glass', -0.125, -0.125, 2.35, 0.125, 0.125, 2.78, glass, 0))
    parts.append(cube('band', -0.18, -0.18, 2.78, 0.18, 0.18, 2.83, iron, 0.01))
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.3, radius2=0.03, depth=0.2, location=(0, 0, 2.93), rotation=(0, 0, math.pi / 4))
    roof = bpy.context.active_object
    roof.data.materials.append(iron)
    parts.append(roof)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.035, location=(0, 0, 3.05))
    fin = bpy.context.active_object
    fin.data.materials.append(iron)
    parts.append(fin)
    o = join(parts, 'lamp')
    return bake_self(o, glass='glass')


def mailbox(color='#3d7a4a', door='#346a40', flag='#c8302a', name='mailbox'):
    """The concept's green mailbox: a wooden post and arm, a round-topped box, a red flag raised. (The other colors are
    the Post Office's: Sarah can have hers painted.)"""
    post = wood_mat('mb_post', '#7a5432')
    paint = paint_mat('mb_paint', color, 0.06, 0.5)
    red = paint_mat('mb_flag', flag, 0.05, 0.5)
    parts = [cube('post', -0.05, -0.05, 0, 0.05, 0.05, 0.86, post, 0.01), cube('arm', -0.06, -0.24, 0.8, 0.06, 0.16, 0.86, post, 0.01)]
    # the box: a half round on a box, along y, from the front (-y) back
    bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=0.13, depth=0.5, location=(0, -0.05, 1.0), rotation=(math.pi / 2, 0, 0))
    top = bpy.context.active_object
    top.data.materials.append(paint)
    parts.append(top)
    parts.append(cube('box', -0.13, -0.3, 0.86, 0.13, 0.2, 1.0, paint, 0.01))
    parts.append(cube('door', -0.115, -0.315, 0.88, 0.115, -0.3, 1.1, paint_mat('mb_door', door, 0.05), 0.005))
    parts.append(cube('handle', -0.02, -0.33, 1.0, 0.02, -0.31, 1.03, paint_mat('mb_handle', '#d8c070'), 0.004))
    parts.append(cube('flagpost', 0.13, -0.02, 0.95, 0.15, 0.02, 1.32, red, 0.004))
    parts.append(cube('flag', 0.135, 0.02, 1.2, 0.145, 0.16, 1.32, red, 0.004))
    o = join(parts, name)
    shade_smooth(o)
    return bake_self(o)


# the colors the Post Office paints mailboxes (game/src/6zf_post.js MAILBOX_COLORS): body, door, flag
MAILBOX_COLORS = {'red': ('#c8463a', '#a8362c', '#f4c040'), 'blue': ('#3d6fb6', '#335d98', '#c8302a'), 'yellow': ('#e8b83a', '#c89a2a', '#c8302a'),
                  'pink': ('#e88aaa', '#c86f8e', '#c8302a'), 'white': ('#ece6dc', '#d0c8bc', '#c8302a'), 'black': ('#3b2f32', '#2a2124', '#c8302a')}


def fence_picket():
    """One tile of white picket fence: four pointed pickets on two rails, a post at each end."""
    white = paint_mat('pk_white', '#f2efe6', 0.05, 0.6)
    parts = []
    for sx in (-0.5, 0.5):
        parts.append(cube(f'post{sx}', sx - 0.045, -0.045, 0, sx + 0.045, 0.045, 0.82, white, 0.012))
        bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.07, radius2=0, depth=0.08, location=(sx, 0, 0.86), rotation=(0, 0, math.pi / 4))
        c = bpy.context.active_object
        c.data.materials.append(white)
        parts.append(c)
    for z in (0.2, 0.52):
        parts.append(cube(f'rail{z}', -0.5, 0.03, z, 0.5, 0.06, z + 0.06, white, 0.008))
    for i in range(4):
        x = -0.375 + i * 0.25
        parts.append(cube(f'pk{i}', x - 0.04, -0.015, 0.03, x + 0.04, 0.015, 0.66, white, 0.008))
        # the point
        bm = bmesh.new()
        v = [bm.verts.new(p) for p in ((x - 0.04, -0.015, 0.66), (x + 0.04, -0.015, 0.66), (x, -0.015, 0.73), (x - 0.04, 0.015, 0.66), (x + 0.04, 0.015, 0.66), (x, 0.015, 0.73))]
        for f in ((0, 1, 2), (5, 4, 3), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)):
            bm.faces.new([v[k] for k in f])
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        o = mesh_obj(f'tip{i}', bm)
        o.data.materials.append(white)
        parts.append(o)
    o = join(parts, 'fence_picket')
    return bake_self(o, size=256)


def fence_rustic():
    """One tile of rustic fence: round weathered posts at the ends, two split rails sagging a little between."""
    wood = wood_mat('rf_wood', '#8a6440', 0.25, (1, 1, 14))
    parts, rng = [], random.Random(5)
    for sx in (-0.5, 0.5):
        parts.append(cyl(f'post{sx}', sx, 0, 0, 0.78, 0.055, 0.05, wood, verts=8))
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.052, location=(sx, 0, 0.78), segments=8, ring_count=5)
        c = bpy.context.active_object
        c.scale = (1, 1, 0.45)
        c.data.materials.append(wood)
        parts.append(c)
    for z in (0.3, 0.6):
        bm = bmesh.new()
        n = 8
        ring = []
        for i in range(n + 1):
            x = -0.5 + i / n
            sag = -0.025 * math.sin(i / n * math.pi)
            r = [bm.verts.new((x, math.cos(a) * 0.035, z + sag + math.sin(a) * 0.028)) for a in (k / 6 * math.tau for k in range(6))]
            ring.append(r)
        for i in range(n):
            for k in range(6):
                bm.faces.new((ring[i][k], ring[i + 1][k], ring[i + 1][(k + 1) % 6], ring[i][(k + 1) % 6]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        o = mesh_obj(f'rail{z}', bm)
        o.data.materials.append(wood)
        shade_smooth(o)
        parts.append(o)
    o = join(parts, 'fence_rustic')
    return bake_self(o, size=256)


def planter():
    """A wooden planter box of red and pink flowers with leaves."""
    wood = wood_mat('pl_wood', '#8a5a33', 0.2, (1, 1, 18))
    soil = paint_mat('pl_soil', '#4a3424', 0.1, 1)
    parts = []
    W, D, H = 1.6, 0.46, 0.32
    for i, (y0, y1) in enumerate(((-D / 2, -D / 2 + 0.05), (D / 2 - 0.05, D / 2))):
        parts.append(cube(f'side{i}', -W / 2, y0, 0, W / 2, y1, H, wood, 0.01))
    for x0 in (-W / 2, W / 2 - 0.05):
        parts.append(cube(f'end{x0}', x0, -D / 2, 0, x0 + 0.05, D / 2, H, wood, 0.01))
    parts.append(cube('soil', -W / 2 + 0.05, -D / 2 + 0.05, H - 0.08, W / 2 - 0.05, D / 2 - 0.05, H - 0.04, soil, 0))
    # plank lines on the front
    for k in range(1, 3):
        parts.append(cube(f'line{k}', -W / 2, -D / 2 - 0.004, k * H / 3 - 0.006, W / 2, -D / 2, k * H / 3, paint_mat(f'pl_line{k}', '#5a3a20'), 0))
    rng = random.Random(9)
    bm = bmesh.new()
    col = bm.verts.layers.float_color.new('Col')
    for _ in range(46):
        x, y = rng.uniform(-W / 2 + 0.1, W / 2 - 0.1), rng.uniform(-D / 2 + 0.1, D / 2 - 0.1)
        # leaves: flattened green balls; blooms: clusters of petals
        res = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1, matrix=Matrix.Translation((x, y, H - 0.02 + rng.uniform(0.02, 0.08))) @ Matrix.Diagonal((0.07, 0.07, 0.04, 1)))
        for v in res['verts']:
            v[col] = mix(hex_rgb('#3c7a30'), hex_rgb('#5a9c3c'), rng.random())
    for _ in range(26):
        x, y, z = rng.uniform(-W / 2 + 0.1, W / 2 - 0.1), rng.uniform(-D / 2 + 0.08, D / 2 - 0.08), H + rng.uniform(0.06, 0.14)
        c = hex_rgb(rng.choice(['#d8283a', '#e8384a', '#c41e30', '#f06478', '#ffffff']))
        for k in range(5):
            a = k / 5 * math.tau
            res = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1, matrix=Matrix.Translation((x + math.cos(a) * 0.025, y + math.sin(a) * 0.025, z)) @ Matrix.Diagonal((0.026, 0.026, 0.012, 1)))
            for v in res['verts']:
                v[col] = c
        res = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.014, matrix=Matrix.Translation((x, y, z + 0.01)))
        for v in res['verts']:
            v[col] = hex_rgb('#f2c23a')
    fl = mesh_obj('flowers', bm)
    shade_smooth(fl)
    fl.data.materials.append(vcol_mat('pl_flowers'))
    parts.append(fl)
    o = join(parts, 'planter')
    return bake_self(o)


def pumpkins():
    """Three pumpkins together (a big one, two small): squat and ribbed, deep orange in the grooves, with stems and a
    couple of leaves (all in the mesh's own colors)."""
    rng = random.Random(13)
    bm = bmesh.new()
    col = bm.verts.layers.float_color.new('Col')
    for (x, y, r, c) in ((0.0, 0.02, 0.23, '#f08420'), (0.29, -0.12, 0.15, '#f49430'), (-0.25, -0.15, 0.13, '#ec7a1c')):
        res = bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=1)
        base, groove = hex_rgb(c), hex_rgb('#b8500e')
        for v in res['verts']:
            p = v.co.copy()
            a = math.atan2(p.y, p.x)
            ribs = abs(math.cos(a * 5))
            rib = 1 - 0.1 * (1 - ribs ** 0.5)
            # squat: wider than tall, a dimple at the top and the bottom
            z = p.z * 0.78 - 0.12 * max(0.0, p.z) ** 6
            v.co = Vector((x + p.x * r * rib * 1.12, y + p.y * r * rib * 1.12, (z + 0.78) * r))
            cc = mix(groove, base, 0.35 + 0.65 * ribs ** 0.4)
            k = 1.0 - 0.15 * max(0.0, -p.z)
            v[col] = (cc[0] * k, cc[1] * k, cc[2] * k, 1)
        # the stem: a short twisted green-brown cylinder
        top = (x, y, r * 1.5)
        res = bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=r * 0.12, radius2=r * 0.08, depth=r * 0.45,
                                    matrix=Matrix.Translation((x, y, r * 1.5 + r * 0.2)) @ Euler((rng.uniform(-0.3, 0.3), rng.uniform(-0.3, 0.3), 0)).to_matrix().to_4x4())
        for v in res['verts']:
            v[col] = hex_rgb('#6a6a2a')
    for (x, y, a) in ((0.18, 0.2, 0.5), (-0.16, 0.16, 2.3), (0.38, 0.04, 1.2)):
        res = bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=6, radius=1)
        for v in res['verts']:
            p = v.co.copy()
            q = Vector((p.x * 0.14, p.y * 0.09, p.z * 0.012 + 0.015))
            q.rotate(Euler((0, 0, a)))
            v.co = Vector((x, y, 0)) + q
            v[col] = mix(hex_rgb('#3f6e28'), hex_rgb('#5a8a34'), 0.5 + 0.5 * p.x)
    o = mesh_obj('pumpkins', bm)
    shade_smooth(o)
    # (their colors stay in the mesh: baked, the pumpkins shade each other into brown bands)
    o.data.materials.append(vcol_mat('pk_mat'))
    return o


PROPS = {'bench': bench, 'lamp': lamp, 'mailbox': mailbox, 'fence_picket': fence_picket, 'fence_rustic': fence_rustic,
         'planter': planter, 'pumpkins': pumpkins}
for _k, (_c, _d, _f) in MAILBOX_COLORS.items():
    PROPS['mailbox_' + _k] = (lambda c=_c, d=_d, f=_f, n='mailbox_' + _k: mailbox(c, d, f, n))


def preview(path, objs):
    ground_plane()
    person(x=-1.4, y=-0.4)
    light_rig()
    x = 0
    for o in objs:
        o.location.x = x
        x += max(1.2, o.dimensions.x + 0.5)
    camera((x / 2 - 0.6, 0, 0.9), dist=max(6.5, x * 1.15))
    render(path, size=(1200, 600), samples=64)


if __name__ == '__main__':
    args = sys.argv[1:]
    only = args[args.index('--only') + 1] if '--only' in args else None
    prev = args[args.index('--preview') + 1] if '--preview' in args else None
    reset()
    made = []
    for name, fn in PROPS.items():
        if only and name != only:
            continue
        o = fn()
        o.location = (0, 0, 0)
        export([o], name)
        made.append(o)
        print('built', name)
    if prev:
        preview(os.path.join(prev, 'props.png' if not only else only + '.png'), made)
