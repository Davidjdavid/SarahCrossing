"""The ground's surfaces for the new 3D look, as textures that tile every 4 tiles (the ground shader repeats them so):

- flagstones: the concept's square paving, flat stones of four to six sides with softened corners, light warm and cool
  greys, each a little lighter on its top edge, moss and grass in the gaps, a few fallen leaves
- path: packed brown earth, lighter where it's dusty, pebbles pressed into it, a few leaves and blades
- lawn: grass blades in many greens, clover, tiny white, yellow, pink and lilac flowers

Each is modelled (stones, pebbles, blades as real geometry, wrapped round the tile's edges so the texture has no seams)
and baked from above onto a 4 x 4 square: its color (with the shade between things), a normal map, and its height (where
the stones and pebbles stand up: the shader keeps those longest where a path or the square runs into the grass).
Written to game/assets/textures/<name>_col.jpg, _nrm.jpg, _hgt.png.

    python tools/blender/ground_textures.py [--only NAME] [--preview DIR]
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
import numpy as np
from mathutils import Vector, Matrix, noise
from common import *

T = 4.0                 # the tile the texture covers (game tiles)
OUT = os.path.join(ROOT, 'game', 'assets', 'textures')


def wrapped(x, y, r):
    """The copies of a point that matter for a seamless tile (itself, and across any edge it's within r of)."""
    out = [(x, y)]
    for dx in (-T, 0, T):
        for dy in (-T, 0, T):
            if (dx or dy) and -r < x + dx < T + r and -r < y + dy < T + r:
                out.append((x + dx, y + dy))
    return out


def blades(bm, col, rng, x, y, n, h, palette, spread=0.03, lean=0.4):
    """A tuft: n thin curved blades from one spot."""
    for _ in range(n):
        a = rng.uniform(0, math.tau)
        bx, by = x + math.cos(a) * rng.uniform(0, spread), y + math.sin(a) * rng.uniform(0, spread)
        ln = h * rng.uniform(0.6, 1.2)
        d = rng.uniform(0, math.tau)
        lx, ly = math.cos(d) * ln * lean, math.sin(d) * ln * lean
        w = rng.uniform(0.006, 0.011)
        px, py = -math.sin(d) * w, math.cos(d) * w
        c = hex_rgb(rng.choice(palette))
        v0 = bm.verts.new((bx - px, by - py, 0.002))
        v1 = bm.verts.new((bx + px, by + py, 0.002))
        v2 = bm.verts.new((bx + lx * 0.5 + px * 0.6, by + ly * 0.5 + py * 0.6, ln * 0.6))
        v3 = bm.verts.new((bx + lx * 0.5 - px * 0.6, by + ly * 0.5 - py * 0.6, ln * 0.6))
        v4 = bm.verts.new((bx + lx, by + ly, ln * 0.8))
        for f in ((v0, v1, v2, v3), (v3, v2, v4)):
            face = bm.faces.new(f)
            face.normal_update()
            if face.normal.z < 0:
                face.normal_flip()
        dark = mix(c, (0.05, 0.1, 0.03, 1), 0.45)
        for v in (v0, v1):
            v[col] = dark
        for v in (v2, v3):
            v[col] = mix(dark, c, 0.7)
        v4[col] = mix(c, (1, 1, 0.8, 1), 0.12)


def leaf(bm, col, rng, x, y, z, s):
    """A fallen leaf: a small pointed oval, orange to yellow."""
    a = rng.uniform(0, math.tau)
    c = hex_rgb(rng.choice(['#e8781e', '#f0a02a', '#d85a18', '#f4c040', '#c8481a']))
    pts = []
    for k in range(8):
        t = k / 8 * math.tau
        r = s * (1.0 if k in (0, 4) else 0.55) * (1.3 if k == 0 else 1)
        pts.append((x + math.cos(t + a) * r, y + math.sin(t + a) * r * 0.75, z + 0.004 * math.sin(t * 2)))
    v = [bm.verts.new(p) for p in pts]
    f = bm.faces.new(v)
    f.normal_update()
    if f.normal.z < 0:
        f.normal_flip()
    for vv in v:
        vv[col] = c


def soil(bm, col, color_a, color_b, rng, bumps=0.0):
    """The ground under everything: a square a little larger than the tile, gently uneven."""
    n = 64
    vs = []
    seed = Vector((rng.random() * 9, rng.random() * 9, 0))
    for j in range(n + 1):
        row = []
        for i in range(n + 1):
            x, y = -0.2 + i / n * (T + 0.4), -0.2 + j / n * (T + 0.4)
            # (periodic noise: sampled on a torus so the tile wraps)
            u, w = x / T * math.tau, y / T * math.tau
            p = Vector((math.cos(u), math.sin(u), math.cos(w))) * 1.2 + Vector((0, 0, math.sin(w) * 1.2)) + seed
            k = noise.noise(p * 1.6) * 0.5 + 0.5
            v = bm.verts.new((x, y, bumps * (k - 0.5)))
            v[col] = mix(hex_rgb(color_a), hex_rgb(color_b), k)
            row.append(v)
        vs.append(row)
    for j in range(n):
        for i in range(n):
            bm.faces.new((vs[j][i], vs[j][i + 1], vs[j + 1][i + 1], vs[j + 1][i]))


def poisson(rng, r, tries=30):
    """Points over the tile (wrapping round it), none closer than r."""
    pts = []
    cand = 0
    while cand < 4000:
        cand += 1
        p = (rng.uniform(0, T), rng.uniform(0, T))
        ok = True
        for q in pts:
            dx = abs(p[0] - q[0]); dy = abs(p[1] - q[1])
            dx, dy = min(dx, T - dx), min(dy, T - dy)
            if dx * dx + dy * dy < r * r:
                ok = False
                break
        if ok:
            pts.append(p)
    return pts


def cell(sites, i):
    """The Voronoi cell of site i, the sites wrapping round the tile."""
    sx, sy = sites[i]
    near = []
    for j, (x, y) in enumerate(sites):
        for (wx, wy) in wrapped(x, y, T):
            if (j == i and (wx, wy) == (x, y)):
                continue
            if abs(wx - sx) < 1.2 and abs(wy - sy) < 1.2:
                near.append(Vector((wx, wy)))
    s = Vector((sx, sy))
    poly = [s + Vector(v) for v in ((-1.5, -1.5), (1.5, -1.5), (1.5, 1.5), (-1.5, 1.5))]
    for t in near:
        m, n = (s + t) / 2, t - s
        out = []
        for k, p in enumerate(poly):
            q = poly[(k + 1) % len(poly)]
            dp, dq = (p - m).dot(n), (q - m).dot(n)
            if dp <= 0:
                out.append(p)
            if (dp < 0) != (dq < 0) and abs(dp - dq) > 1e-9:
                out.append(p + (q - p) * (dp / (dp - dq)))
        poly = out
    return poly


def round_poly(poly, inset, r, steps=3):
    """Pull a convex polygon in by `inset` and round its corners with radius r."""
    c = sum(poly, Vector((0, 0))) / len(poly)
    # inset each edge
    lines = []
    n = len(poly)
    for k in range(n):
        p, q = poly[k], poly[(k + 1) % n]
        d = (q - p).normalized()
        nrm = Vector((d.y, -d.x))
        if (c - p).dot(nrm) < 0:
            nrm = -nrm
        lines.append((p + nrm * inset, d))
    pts = []
    for k in range(n):
        (p1, d1), (p2, d2) = lines[k - 1], lines[k]
        den = d1.x * d2.y - d1.y * d2.x
        if abs(den) < 1e-6:
            continue
        t = ((p2.x - p1.x) * d2.y - (p2.y - p1.y) * d2.x) / den
        pts.append(p1 + d1 * t)
    if len(pts) < 3:
        return []
    out = []
    m = len(pts)
    for k in range(m):
        a, b, cc = pts[k - 1], pts[k], pts[(k + 1) % m]
        da, dc = (a - b), (cc - b)
        la, lc = da.length, dc.length
        rr = min(r, la * 0.45, lc * 0.45)
        pa, pc = b + da.normalized() * rr, b + dc.normalized() * rr
        for s in range(steps + 1):
            t = s / steps
            # a quadratic curve through the corner
            out.append(pa * (1 - t) ** 2 + b * 2 * t * (1 - t) + pc * t * t)
    return out


def flagstones(rng):
    bm = bmesh.new()
    col = bm.verts.layers.float_color.new('Col')
    # (the gaps are moss, as the concept's: green, darker where it's deep)
    soil(bm, col, '#405a26', '#5e7e34', rng)
    tones = ['#aaa69c', '#9a978f', '#b5ae9f', '#8e8d88', '#a49c8c', '#bab4a7', '#958f84', '#9fa2a0', '#aca290', '#88857e', '#b0aca2']
    sites = poisson(rng, 0.36)
    for i in range(len(sites)):
        poly = cell(sites, i)
        if len(poly) < 3:
            continue
        shape = round_poly(poly, rng.uniform(0.022, 0.04), rng.uniform(0.05, 0.1))
        if len(shape) < 3:
            continue
        top = rng.uniform(0.05, 0.075)
        tilt = Vector((rng.uniform(-0.05, 0.05), rng.uniform(-0.05, 0.05)))
        base = hex_rgb(rng.choice(tones))
        cx, cy = sites[i]
        for (ox, oy) in wrapped(cx, cy, 0.7):
            dx, dy = ox - cx, oy - cy
            # the stone: a slab with a softened top edge (an inner ring a little higher), its top lighter at the north edge
            outer, inner = [], []
            c = sum(shape, Vector((0, 0))) / len(shape)
            for p in shape:
                q = c + (p - c) * 0.86
                h0 = top + tilt.dot(p - c)
                outer.append(bm.verts.new((p.x + dx, p.y + dy, h0 - 0.022)))
                inner.append(bm.verts.new((q.x + dx, q.y + dy, h0 + 0.004 * noise.noise(Vector((q.x * 7, q.y * 7, i))))))
            bottom = [bm.verts.new((p.x + dx, p.y + dy, 0.0)) for p in shape]
            m = len(shape)
            bm.faces.new(inner)
            for k in range(m):
                j = (k + 1) % m
                bm.faces.new((outer[k], outer[j], inner[j], inner[k]))
                bm.faces.new((bottom[k], bottom[j], outer[j], outer[k]))
            for v in inner:
                # lighter toward the north (top) edge of the stone, a fleck of variation
                t = (v.co.y - dy - c.y) * 2.2
                k2 = 1 + max(-0.06, min(0.08, t * 0.12)) + (rng.random() - 0.5) * 0.04
                v[col] = (base[0] * k2, base[1] * k2, base[2] * k2, 1)
            for v in outer:
                v[col] = mix(base, (0.25, 0.24, 0.22, 1), 0.25)
            for v in bottom:
                v[col] = mix(base, (0.1, 0.1, 0.08, 1), 0.6)
    # moss and grass in the gaps: tufts along the gaps (where no stone covers), and moss clumps
    for _ in range(3200):
        x, y = rng.uniform(0, T), rng.uniform(0, T)
        # in a gap: nearer the boundary between two sites than either centre by enough
        d = sorted(min(math.hypot(min(abs(x - sx), T - abs(x - sx)), min(abs(y - sy), T - abs(y - sy))) for sx, sy in [s]) for s in sites)
        if len(d) > 1 and d[1] - d[0] < 0.085:
            for (wx, wy) in wrapped(x, y, 0.1):
                blades(bm, col, rng, wx, wy, 2, rng.uniform(0.04, 0.08), ['#4f8a30', '#5f9e38', '#6ead42', '#3f7428', '#80b84a'], spread=0.012, lean=0.6)
    for _ in range(14):
        x, y = rng.uniform(0, T), rng.uniform(0, T)
        for (wx, wy) in wrapped(x, y, 0.1):
            leaf(bm, col, rng, wx, wy, 0.085, rng.uniform(0.035, 0.055))
    return bm


def path(rng):
    bm = bmesh.new()
    col = bm.verts.layers.float_color.new('Col')
    soil(bm, col, '#7a5638', '#a07a52', rng, bumps=0.025)
    # the concept's trail is smooth packed dirt: a few small stones sunk in it, close to the soil's own color
    pal = ['#6e5640', '#7c6450', '#5e4a38', '#8a735c', '#685444']
    for _ in range(170):
        x, y = rng.uniform(0, T), rng.uniform(0, T)
        s = rng.uniform(0.008, 0.022) if rng.random() < 0.9 else rng.uniform(0.022, 0.034)
        c = hex_rgb(rng.choice(pal))
        for (wx, wy) in wrapped(x, y, s):
            res = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1, matrix=Matrix.Translation((wx, wy, -s * 0.1)) @ Matrix.Diagonal((s, s * rng.uniform(0.7, 1), s * 0.45, 1)))
            for v in res['verts']:
                k = 0.9 + 0.2 * max(0, v.co.z) / max(0.001, s * 0.35)
                v[col] = (c[0] * k, c[1] * k, c[2] * k, 1)
    for _ in range(36):
        x, y = rng.uniform(0, T), rng.uniform(0, T)
        for (wx, wy) in wrapped(x, y, 0.1):
            leaf(bm, col, rng, wx, wy, 0.012, rng.uniform(0.03, 0.05))
    for _ in range(40):
        x, y = rng.uniform(0, T), rng.uniform(0, T)
        for (wx, wy) in wrapped(x, y, 0.1):
            blades(bm, col, rng, wx, wy, 3, 0.06, ['#6a8a3a', '#7a9a44', '#8aa850'], spread=0.02)
    return bm


def lawn(rng):
    bm = bmesh.new()
    col = bm.verts.layers.float_color.new('Col')
    soil(bm, col, '#365e22', '#4a7a2c', rng)
    greens = ['#4a8a2e', '#5a9c36', '#6aac40', '#7cbc4a', '#3c7428', '#8cc456', '#a2d062']
    seed = Vector((rng.random() * 9, 3, 1))
    for _ in range(2600):
        x, y = rng.uniform(0, T), rng.uniform(0, T)
        u, w = x / T * math.tau, y / T * math.tau
        patch = noise.noise(Vector((math.cos(u), math.sin(u), math.cos(w) + math.sin(w) * 0.7)) * 1.4 + seed) * 0.5 + 0.5
        # warmer, yellower patches and cooler deep ones, as the concept's lawn
        pal = greens[2:] if patch > 0.55 else greens[:5]
        for (wx, wy) in wrapped(x, y, 0.06):
            blades(bm, col, rng, wx, wy, 3, rng.uniform(0.05, 0.1), pal, spread=0.03, lean=0.5)
    # clover: small round three-leaf clusters
    for _ in range(90):
        x, y = rng.uniform(0, T), rng.uniform(0, T)
        for (wx, wy) in wrapped(x, y, 0.05):
            for k in range(3):
                a = k / 3 * math.tau + rng.random()
                res = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1, matrix=Matrix.Translation((wx + math.cos(a) * 0.012, wy + math.sin(a) * 0.012, 0.03)) @ Matrix.Diagonal((0.013, 0.013, 0.004, 1)))
                for v in res['verts']:
                    v[col] = hex_rgb('#5c9c3a')
    # tiny flowers
    for _ in range(46):
        x, y = rng.uniform(0, T), rng.uniform(0, T)
        c = hex_rgb(rng.choice(['#ffffff', '#ffffff', '#ffe066', '#f6a8c8', '#c8a6f0']))
        for (wx, wy) in wrapped(x, y, 0.05):
            for k in range(5):
                a = k / 5 * math.tau
                res = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1, matrix=Matrix.Translation((wx + math.cos(a) * 0.012, wy + math.sin(a) * 0.012, 0.075)) @ Matrix.Diagonal((0.01, 0.01, 0.003, 1)))
                for v in res['verts']:
                    v[col] = c
            res = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.007, matrix=Matrix.Translation((wx, wy, 0.078)))
            for v in res['verts']:
                v[col] = hex_rgb('#f2c23a')
    return bm


SURFACES = {'flagstones': flagstones, 'path': path, 'lawn': lawn}


def height_material():
    """An emission of the height (0 at the ground, 1 at 9 cm), for baking the height picture."""
    m = bpy.data.materials.new('height')
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    geo = nt.nodes.new('ShaderNodeNewGeometry')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    nt.links.new(geo.outputs['Position'], sep.inputs['Vector'])
    mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['From Min'].default_value, mr.inputs['From Max'].default_value = 0.0, 0.09
    nt.links.new(sep.outputs['Z'], mr.inputs['Value'])
    em = nt.nodes.new('ShaderNodeEmission')
    nt.links.new(mr.outputs['Result'], em.inputs['Color'])
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(em.outputs['Emission'], out.inputs['Surface'])
    return m


def build(name, size=1024):
    reset()
    rng = random.Random({'flagstones': 11, 'path': 22, 'lawn': 33}[name])
    hi = mesh_obj(name + '_high', SURFACES[name](rng))
    shade_smooth(hi, False)
    m = material(name + '_high', vcol='Col', rough=0.9)
    hi.data.materials.append(m)
    # the square it's baked onto (uv 0..1 over the tile)
    bm = bmesh.new()
    uv = bm.loops.layers.uv.verify()
    v = [bm.verts.new(p) for p in ((0, 0, 0.0), (T, 0, 0.0), (T, T, 0.0), (0, T, 0.0))]
    f = bm.faces.new(v)
    for l, (a, b) in zip(f.loops, ((0, 0), (1, 0), (1, 1), (0, 1))):
        l[uv].uv = (a, b)
    lo = mesh_obj(name, bm)
    lo.data.materials.append(material(name + '_lo'))
    kw = dict(high=hi, extrusion=0.3, max_dist=0.45, margin=0)
    diff = bake(lo, 'DIFFUSE', size, samples=4, **kw)
    ao = bake(lo, 'AO', size, samples=64, **kw)
    nrm = bake(lo, 'NORMAL', size, samples=4, **kw)
    hi.data.materials.clear()
    hi.data.materials.append(height_material())
    hgt = bake(lo, 'EMIT', size // 4, samples=4, **kw)
    a = image_array(diff)[..., :3]
    o = image_array(ao)[..., :1]
    a *= (0.5 + 0.5 * o ** 1.2)
    os.makedirs(OUT, exist_ok=True)
    _save(a, os.path.join(OUT, name + '_col.jpg'), 'JPEG')
    _save(image_array(nrm)[..., :3], os.path.join(OUT, name + '_nrm.jpg'), 'JPEG', data=True)
    _save(image_array(hgt)[..., :1].repeat(3, axis=2), os.path.join(OUT, name + '_hgt.png'), 'PNG', data=True)
    return a


def _save(arr, path, fmt, data=False):
    """Write a float picture (rows bottom first, as Blender keeps them) as a file."""
    h, w = arr.shape[:2]
    img = bpy.data.images.new(os.path.basename(path), w, h, alpha=False)
    if data:
        img.colorspace_settings.name = 'Non-Color'
    rgba = np.concatenate([arr[..., :3], np.ones((h, w, 1), np.float32)], axis=2)
    img.pixels.foreach_set(np.ascontiguousarray(rgba, np.float32).ravel())
    img.file_format = fmt
    img.save(filepath=path, quality=90)


if __name__ == '__main__':
    args = sys.argv[1:]
    only = args[args.index('--only') + 1] if '--only' in args else None
    for name in SURFACES:
        if only and name != only:
            continue
        build(name)
        print('built', name)
