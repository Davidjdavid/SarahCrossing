"""The autumn tree (the concept's maples): a crown of many round leaf puffs, orange, amber and yellow, each lit on top
and shadowed beneath, so the outline is bumpy all round; a slender trunk that leans and forks into the crown.

The detail is made at full size (a few hundred puffs, each a ball of leaf clumps) and baked onto a light crown mesh
(the puffs fused into one surface and simplified): its colors, the dark gaps between puffs, and their bumps as a
normal map. Phones get the same crown simplified further (lod1).

    python tools/blender/tree_autumn.py [--preview DIR] [--only NAME]
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
import numpy as np
from mathutils import Vector, Matrix, noise
from common import *

# each variant: its seed, the crown's colors (light to dark), its shape
VARIANTS = {
    'tree_maple_orange': dict(seed=11, pal=['#ffd84e', '#ffb22a', '#f98a14', '#e2620c', '#a83e08'], height=3.9, lean=0.22),
    'tree_maple_amber': dict(seed=23, pal=['#ffe866', '#ffcf34', '#f8a91e', '#e07e12', '#a5540a'], height=3.6, lean=-0.18),
    'tree_maple_red': dict(seed=37, pal=['#ffb84a', '#fb8a2a', '#ea5c18', '#c63c12', '#86240c'], height=4.1, lean=0.1),
}


def lobes_for(rng, height, lean):
    """The crown's shape (centre, radii): like the concept's maples, taller than wide, three masses stacked up a leaning
    axis, each a little to one side of the last, with smaller lobes bulging out of them, so the outline is irregular."""
    zb, top = height * 0.38, height
    a0, a1 = Vector((lean * 0.45, 0, zb + 0.55)), Vector((lean + rng.uniform(-0.15, 0.15), rng.uniform(-0.1, 0.1), top - 0.5))
    L, side = [], rng.choice((-1, 1))
    for t, r in ((0.12, 0.82), (0.52, 0.74), (0.9, 0.56)):
        c = a0.lerp(a1, t) + Vector((side * rng.uniform(0.1, 0.24), rng.uniform(-0.1, 0.1), 0))
        side = -side
        L.append((c, Vector((r, r * 0.9, r * 0.86))))
        for k in range(rng.randint(3, 5)):
            a = rng.uniform(0, math.tau)
            d = r * rng.uniform(0.62, 0.86)
            rr = r * rng.uniform(0.42, 0.6)
            L.append((c + Vector((math.cos(a) * d, math.sin(a) * d * 0.8, rng.uniform(-0.35, 0.3) * r)), Vector((rr, rr * 0.92, rr * 0.85))))
    return L


def inside(p, L, skip=-1, k=1.0):
    for i, (c, r) in enumerate(L):
        if i == skip:
            continue
        d = p - c
        if (d.x / (r.x * k)) ** 2 + (d.y / (r.y * k)) ** 2 + (d.z / (r.z * k)) ** 2 < 1:
            return True
    return False


def puff_points(rng, L, min_d):
    """Points over the crown's outer surface, spread evenly (none closer than min_d), with the outward normal."""
    cand = []
    for i, (c, r) in enumerate(L):
        area = 4 * math.pi * (((r.x * r.y) ** 1.6 + (r.x * r.z) ** 1.6 + (r.y * r.z) ** 1.6) / 3) ** (1 / 1.6)
        for _ in range(int(area * 90)):
            u = rng.uniform(-1, 1)
            th = rng.uniform(0, math.tau)
            s = math.sqrt(1 - u * u)
            n = Vector((s * math.cos(th), s * math.sin(th), u))
            p = c + Vector((n.x * r.x, n.y * r.y, n.z * r.z))
            if not inside(p, L, i, 0.98):
                g = Vector((n.x / r.x, n.y / r.y, n.z / r.z)).normalized()
                cand.append((p, g))
    rng.shuffle(cand)
    out, grid = [], {}
    cell = min_d
    for p, g in cand:
        k = (int(p.x // cell), int(p.y // cell), int(p.z // cell))
        ok = True
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                for dz in (-1, 0, 1):
                    for q in grid.get((k[0] + dx, k[1] + dy, k[2] + dz), ()):
                        if (q - p).length < min_d:
                            ok = False
                            break
                    if not ok:
                        break
                if not ok:
                    break
            if not ok:
                break
        if ok:
            out.append((p, g))
            grid.setdefault(k, []).append(p)
    return out


def tube(bm, pts, radii, uv_v0=0.0, sides=10, bark=None):
    """A tapering tube along pts (bark UVs: u round, v along)."""
    rings = []
    vlen = uv_v0
    for i, p in enumerate(pts):
        t = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
        up = Vector((0, 0, 1)) if abs(t.z) < 0.95 else Vector((1, 0, 0))
        a = t.cross(up).normalized()
        b = t.cross(a).normalized()
        ring = []
        for k in range(sides + 1):
            th = k / sides * math.tau
            wob = 1 + 0.08 * noise.noise(Vector((math.cos(th) * 2, math.sin(th) * 2, i * 0.7)))
            ring.append(bm.verts.new(p + (a * math.cos(th) + b * math.sin(th)) * radii[i] * wob))
        if i:
            vlen += (p - pts[i - 1]).length
        rings.append((ring, vlen))
    uv = bm.loops.layers.uv.verify()
    for i in range(len(rings) - 1):
        (r0, v0), (r1, v1) = rings[i], rings[i + 1]
        for k in range(sides):
            f = bm.faces.new((r0[k], r0[k + 1], r1[k + 1], r1[k]))
            for l, (uu, vv) in zip(f.loops, ((k / sides, v0), ((k + 1) / sides, v0), ((k + 1) / sides, v1), (k / sides, v1))):
                l[uv].uv = (uu, vv * 0.6)
    return rings


def trunk(rng, height, lean, L):
    """The trunk and its branches up into the lobes."""
    bm = bmesh.new()
    base_r = 0.12
    crown_base = height * 0.38
    pts, radii = [], []
    n = 9
    for i in range(n + 1):
        t = i / n
        z = t * (crown_base + 0.75)
        x = lean * t * t + 0.04 * math.sin(t * 5 + rng.random())
        pts.append(Vector((x, 0.03 * math.sin(t * 4), z)))
        radii.append(base_r * (1 - 0.5 * t) * (1.45 if i == 0 else 1.12 if i == 1 else 1))
    tube(bm, pts, radii)
    top = pts[-3]
    for c, r in L:
        if r.x > 0.5 or rng.random() < 0.35:
            mid = top.lerp(c, 0.5) + Vector((0, 0, 0.12))
            bp = [top, top.lerp(mid, 0.5), mid, mid.lerp(c, 0.7)]
            tube(bm, bp, [0.055, 0.045, 0.034, 0.022], sides=7)
    # a little flare where it meets the ground
    for k in range(5):
        a = k / 5 * math.tau + rng.uniform(-0.3, 0.3)
        d = Vector((math.cos(a), math.sin(a), 0))
        tube(bm, [Vector((0, 0, 0.16)), d * 0.1 + Vector((0, 0, 0.04)), d * 0.19 + Vector((0, 0, -0.02))], [0.06, 0.045, 0.03], sides=6)
    o = mesh_obj('trunk', bm)
    shade_smooth(o)
    return o


def bark_image(rng, name):
    """Bark: dark grey-brown with vertical furrows and a lighter weathered sheen."""
    W, H = 128, 256
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    f = np.zeros((H, W), np.float32)
    for k, amp in ((5, 0.5), (11, 0.3), (23, 0.2)):
        ph = rng.random() * 10
        f += amp * np.sin((x / W * math.tau * k) + np.sin(y / H * math.tau * 3 + ph) * 1.5 + ph)
    n = np.random.default_rng(rng.randint(0, 1 << 30)).random((H, W)).astype(np.float32)
    f = f * 0.5 + 0.5 + (n - 0.5) * 0.15
    dark, lite = np.array(hex_rgb('#4a3222')[:3]), np.array(hex_rgb('#a07a56')[:3])
    col = dark + (lite - dark) * np.clip(f, 0, 1)[..., None]
    return image_from_array(name, col.astype(np.float32))


def crown_high(rng, L, pal):
    """The crown at full detail, as the concept paints it: some thirty clusters of leaves over the crown's outline, each
    covered in small leaf clumps, lighter and yellower on top and deeper orange underneath (painted in, as the concept's
    light is), every small clump lit on its own top and shaded under (the concept's cauliflower texture), with gaps
    between clusters; balls inside close it."""
    bm = bmesh.new()
    col = bm.verts.layers.float_color.new('Col')
    lay_base = bm.verts.layers.float.new('base')
    lay_peak = bm.verts.layers.float.new('peak')
    lay_lit = bm.verts.layers.float.new('lit')
    pts = puff_points(rng, L, 0.36)
    zs = [p.z for p, _ in pts]
    z0, z1 = min(zs), max(zs)
    pal = [hex_rgb(c) for c in pal]
    light = Vector((-0.45, -0.3, 0.84)).normalized()
    shaded = []

    def cluster(c, r, base, detail=4, shade=True):
        n0 = len(bm.verts)
        res = bmesh.ops.create_icosphere(bm, subdivisions=detail, radius=r, matrix=Matrix.Translation(c))
        if shade:
            shaded.append((n0, len(bm.verts)))
        seed = Vector((rng.random() * 50, rng.random() * 50, rng.random() * 50))
        for v in res['verts']:
            dn = (v.co - c).normalized()
            # leaf clumps about 6 cm across, raised in rounded bumps; a lumpiness over the cluster
            f1 = noise.voronoi(dn * (r / 0.065) + seed, distance_metric='DISTANCE')[0][0]
            peak = (1 - min(1.0, f1 * 1.6)) ** 1.5
            bump = 0.058 * peak + 0.07 * r * noise.noise(dn * 2.0 + seed)
            v.co = c + dn * (r + bump)
            if shade:
                v[lay_base], v[lay_peak], v[lay_lit] = base, peak, dn.dot(light)
            else:
                cc = mix(pal[-2], pal[-1], 0.2)
                v[col] = (cc[0], cc[1], cc[2], 1)

    for p, g in pts:
        h = (p.z - z0) / max(0.01, z1 - z0)
        r = rng.uniform(0.22, 0.4) * (0.9 + 0.2 * h)
        # higher clusters a little lighter; each cluster its own shade of orange
        base = (1 - h) * 0.9 + 1.5 + rng.uniform(-0.5, 0.5)
        cluster(p - g * r * rng.uniform(0.2, 0.55), r, base)
    for c, r in L:
        cluster(c, min(r.x, r.y, r.z) * 0.9, 0, detail=3, shade=False)
    # now every leaf clump's own slope: its side toward the sun lighter, its underside a shade deeper
    bm.normal_update()
    bm.verts.ensure_lookup_table()
    for v in (bm.verts[i] for a, b in shaded for i in range(a, b)):
        own = v.normal.dot(light) - v[lay_lit]
        tone = v[lay_base] - v[lay_lit] * 1.8 - own * 1.3 + (1 - v[lay_peak]) * 0.75
        tone = min(len(pal) - 1.001, max(0.0, tone))
        i = int(tone)
        cc = mix(pal[i], pal[i + 1], tone - i)
        k = 0.96 + 0.08 * noise.noise(v.co * 9)
        v[col] = (cc[0] * k, cc[1] * k, cc[2] * k, 1)
    o = mesh_obj('crown_high', bm)
    shade_smooth(o)
    o.data.materials.append(leafy_material())
    return o


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


def build(name, spec, lod_ratios=(None,), tex=1024):
    rng = random.Random(spec['seed'])
    L = lobes_for(rng, spec['height'], spec['lean'])
    hi = crown_high(rng, L, spec['pal'])
    tr = trunk(rng, spec['height'], spec['lean'], L)
    tr.data.materials.append(material(name + '_bark', image=bark_image(rng, name + '_bark'), rough=1))
    out = {}
    for lod, target in enumerate(lod_ratios):
        lo = crown_low(hi, 1.0, f'{name}_crown{lod}')
        faces = len(lo.data.polygons)
        want = target if target else 7000
        if faces > want:
            m = lo.modifiers.new('dec', 'DECIMATE')
            m.ratio = want / faces
            apply_modifiers(lo)
        smart_uv(lo, margin=0.006)
        lo.data.materials.append(material(lo.name + '_mat', rough=1))
        size = tex if lod == 0 else tex // 2
        diff = bake(lo, 'DIFFUSE', size, high=hi, extrusion=0.12, max_dist=0.3, samples=4)
        ao = bake(lo, 'AO', size, high=hi, extrusion=0.12, max_dist=0.3, samples=48)
        nrm = bake(lo, 'NORMAL', size, high=hi, extrusion=0.12, max_dist=0.3, samples=4)
        # the color with the gaps between puffs darkened (the concept's crisp separations)
        a = image_array(diff)
        o = image_array(ao)[..., :1]
        a[..., :3] *= (0.56 + 0.44 * o ** 1.3)
        colimg = image_from_array(lo.name + '_col', a)
        lo.data.materials.clear()
        lo.data.materials.append(material(lo.name + '_mat', image=colimg, normal=nrm, rough=1))
        out[lod] = lo
    return hi, tr, out


def preview(path, objs, height):
    for o in objs:
        o.hide_render = False
    ground_plane()
    person(x=1.9, y=-0.9)
    light_rig()
    camera((0.3, 0, height * 0.48), dist=9.5)
    render(path, size=(720, 720), samples=64)


if __name__ == '__main__':
    args = sys.argv[1:]
    prev = args[args.index('--preview') + 1] if '--preview' in args else None
    only = args[args.index('--only') + 1] if '--only' in args else None
    for name, spec in VARIANTS.items():
        if only and name != only:
            continue
        reset()
        hi, tr, lods = build(name, spec, lod_ratios=(7000, 2000))
        for lod, lo in lods.items():
            tr2 = tr if lod == 0 else tr.copy()
            if lod:
                tr2.data = tr.data.copy()
                link(tr2)
            export([lo, tr2], name + ('' if lod == 0 else f'_lod{lod}'))
        if prev:
            for o in bpy.context.scene.objects:
                o.hide_render = True
            preview(os.path.join(prev, name + '.png'), [lods[0], tr], spec['height'])
            for o in bpy.context.scene.objects:
                if o.name in ('Cam', 'Sun', 'Ground'):
                    continue
                o.hide_render = o is not hi and not o.name.startswith(('Cylinder', 'Sphere'))
            tr.hide_render = False
            bpy.context.scene.render.filepath = ''
            render(os.path.join(prev, name + '_high.png'), size=(720, 720), samples=48)
        print('built', name)
