"""A small kit for miniature props with their colors in the mesh (no baking): rounded boxes (the soft edges that make a
thing look like a toy or a dollhouse piece), turned shapes (posts, pots, barrels, basins), balls, tubes along a path
(ropes, rails, branches), flat shapes pushed out into slabs (signs, sails, flames). Each piece is painted as it's made,
by a color function of its point and normal; painted wood has a grain, stone a mottle, and everything is a little darker
underneath and where it meets the ground, as a painted miniature is.

Built on trees_ac.MB (positions, faces, a color and a normal per vertex). Units are tiles, z up, -y the front.
"""
import math, random
from mathutils import Vector, Matrix, Euler, noise
from trees_ac import MB, vmat, rgb, bmesh_ico, LIGHT


def col_fn(c, grain=None, mottle=0.0, seed=0.0, under=0.25, dark=None):
    """A color function: the color c, with wood grain along an axis ('x', 'y', 'z'), or a stone mottle, darker toward
    the bottom of the piece (under) and on faces turned down."""
    base = rgb(c)
    off = Vector((seed * 3.1, seed * 1.7, seed * 2.3))

    def f(p, n, z0=0.0, z1=1.0):
        k = 1.0
        if grain:
            a = {'x': (p.y * 9, p.z * 9, p.x * 0.8), 'y': (p.x * 9, p.z * 9, p.y * 0.8), 'z': (p.x * 9, p.y * 9, p.z * 0.8)}[grain]
            k *= 0.88 + 0.2 * (0.5 + 0.5 * noise.noise(Vector(a) * 2.2 + off))
        if mottle:
            k *= 1 - mottle + 2 * mottle * (0.5 + 0.5 * noise.noise(p * 5 + off))
        k *= 1.0 - 0.12 * max(0.0, -n.z)
        k *= 1.0 - under * max(0.0, 1 - (p.z - z0) / max(0.05, (z1 - z0))) ** 3
        return base * k
    return f


def shade(c):
    return col_fn(c, under=0.0)


def _axis_vals(a0, a1, r, n_mid=2):
    r = min(r, (a1 - a0) / 2 * 0.999)
    out = [a0, a0 + r * 0.29, a0 + r * 0.71, a0 + r]
    for k in range(1, n_mid + 1):
        out.append(a0 + r + (a1 - a0 - 2 * r) * k / (n_mid + 1))
    out += [a1 - r, a1 - r * 0.71, a1 - r * 0.29, a1]
    return out


def rbox(mb, x0, y0, z0, x1, y1, z1, color, r=0.03, mid=2):
    """A rounded box: its edges and corners rounded by r. color is a color, or a function (p, n) -> color."""
    fn = color if callable(color) else shade(color)
    r = max(0.0005, min(r, (x1 - x0) / 2 * 0.99, (y1 - y0) / 2 * 0.99, (z1 - z0) / 2 * 0.99))
    lo, hi = Vector((x0 + r, y0 + r, z0 + r)), Vector((x1 - r, y1 - r, z1 - r))
    X, Y, Z = _axis_vals(x0, x1, r, mid), _axis_vals(y0, y1, r, mid), _axis_vals(z0, z1, r, mid)

    def put(q):
        c = Vector((min(max(q.x, lo.x), hi.x), min(max(q.y, lo.y), hi.y), min(max(q.z, lo.z), hi.z)))
        d = q - c
        n = d.normalized() if d.length > 1e-9 else Vector((0, 0, 1))
        return c + n * r, n
    for axis, fixed, sgn in (('z', z1, 1), ('z', z0, -1), ('y', y0, -1), ('y', y1, 1), ('x', x0, -1), ('x', x1, 1)):
        U, V = {'z': (X, Y), 'y': (X, Z), 'x': (Y, Z)}[axis]
        pts, cols, nrms, faces = [], [], [], []
        for j, v in enumerate(V):
            for i, u in enumerate(U):
                q = {'z': Vector((u, v, fixed)), 'y': Vector((u, fixed, v)), 'x': Vector((fixed, u, v))}[axis]
                p, n = put(q)
                pts.append(p); nrms.append(n); cols.append(fn(p, n, z0, z1) if fn.__code__.co_argcount > 2 else fn(p, n))
        w = len(U)
        for j in range(len(V) - 1):
            for i in range(w - 1):
                a, b, c, d = j * w + i, j * w + i + 1, (j + 1) * w + i + 1, (j + 1) * w + i
                # (wound so the face looks out)
                flip = {('z', 1): False, ('z', -1): True, ('y', -1): False, ('y', 1): True, ('x', -1): True, ('x', 1): False}[(axis, sgn)]
                faces += [(a, c, b), (a, d, c)] if flip else [(a, b, c), (a, c, d)]
        mb.add(pts, cols, nrms, faces)


def lathe(mb, prof, color, c=(0, 0, 0), seg=20, cap_top=True, cap_bot=False, sx=1.0, sy=1.0):
    """A turned shape: prof is [(radius, z), ...] from bottom to top, spun round the z axis at c."""
    fn = color if callable(color) else shade(color)
    c = Vector(c)
    z0, z1 = min(z for _, z in prof), max(z for _, z in prof)
    pts, cols, nrms, faces = [], [], [], []
    for k, (r, z) in enumerate(prof):
        a = prof[max(0, k - 1)]; b = prof[min(len(prof) - 1, k + 1)]
        dr, dz = b[0] - a[0], b[1] - a[1]
        ln = math.hypot(dr, dz) or 1
        nr, nz = dz / ln, -dr / ln
        for j in range(seg):
            ph = j / seg * math.tau
            d = Vector((math.cos(ph) * sx, math.sin(ph) * sy, 0))
            p = c + Vector((d.x * r, d.y * r, z))
            n = Vector((math.cos(ph) * nr, math.sin(ph) * nr, nz)).normalized()
            pts.append(p); nrms.append(n); cols.append(fn(p, n, c.z + z0, c.z + z1) if fn.__code__.co_argcount > 2 else fn(p, n))
    for k in range(len(prof) - 1):
        for j in range(seg):
            a, b = k * seg + j, k * seg + (j + 1) % seg
            faces += [(a, b, b + seg), (a, b + seg, a + seg)]
    mb.add(pts, cols, nrms, faces)
    for cap, (r, z), up in ((cap_top, prof[-1], 1), (cap_bot, prof[0], -1)):
        if not cap or r < 1e-4:
            continue
        P = [c + Vector((0, 0, z))] + [c + Vector((math.cos(j / seg * math.tau) * r * sx, math.sin(j / seg * math.tau) * r * sy, z)) for j in range(seg)]
        n = Vector((0, 0, up))
        F = [(0, 1 + j, 1 + (j + 1) % seg) if up > 0 else (0, 1 + (j + 1) % seg, 1 + j) for j in range(seg)]
        mb.add(P, [(fn(p, n, c.z + z0, c.z + z1) if fn.__code__.co_argcount > 2 else fn(p, n)) for p in P], [n] * len(P), F)


def cyl(mb, x, y, z0, z1, r0, r1=None, color='#888888', seg=16, round_=0.0, caps=True):
    """A post or a disc, its top edge rounded a little."""
    r1 = r0 if r1 is None else r1
    rr = min(round_, (z1 - z0) / 2, r1)
    prof = [(r0, z0)]
    if rr > 0:
        prof += [(r1, z1 - rr), (r1 - rr * 0.3, z1 - rr * 0.3), (r1 - rr, z1)]
    else:
        prof += [(r1, z1)]
    lathe(mb, prof, color, c=(x, y, 0), seg=seg, cap_top=caps, cap_bot=False)


def ball(mb, c, r, color, sub=3):
    fn = color if callable(color) else shade(color)
    ico = bmesh_ico(sub)
    c = Vector(c)
    r = (r, r, r) if isinstance(r, (int, float)) else r
    for tri in ico['f']:
        ps = [ico['v'][i] for i in tri]
        P = [c + Vector((p.x * r[0], p.y * r[1], p.z * r[2])) for p in ps]
        N = [Vector((p.x / r[0], p.y / r[1], p.z / r[2])).normalized() for p in ps]
        mb.add(P, [fn(p, n) for p, n in zip(P, N)], N, [(0, 1, 2)])


def tube(mb, path, r, color, seg=8, r1=None):
    """A round tube along a path of points (radius r, or tapering to r1)."""
    fn = color if callable(color) else shade(color)
    path = [Vector(p) for p in path]
    r1 = r if r1 is None else r1
    rings = []
    prev_side = None
    for i, p in enumerate(path):
        a, b = path[max(0, i - 1)], path[min(len(path) - 1, i + 1)]
        d = (b - a).normalized()
        side = d.cross(Vector((0, 0, 1)))
        if side.length < 1e-3:
            side = d.cross(Vector((1, 0, 0)))
        side.normalize()
        if prev_side is not None and side.dot(prev_side) < 0:
            side = -side
        prev_side = side
        up = side.cross(d).normalized()
        rr = r + (r1 - r) * i / max(1, len(path) - 1)
        rings.append([(p + (side * math.cos(j / seg * math.tau) + up * math.sin(j / seg * math.tau)) * 1, side * math.cos(j / seg * math.tau) + up * math.sin(j / seg * math.tau), rr) for j in range(seg)])
    pts, cols, nrms, faces = [], [], [], []
    for i, ring in enumerate(rings):
        for (p, o, rr) in ring:
            q = path[i] + o * rr
            pts.append(q); nrms.append(o); cols.append(fn(q, o))
    for i in range(len(rings) - 1):
        for j in range(seg):
            a, b = i * seg + j, i * seg + (j + 1) % seg
            faces += [(a, b, b + seg), (a, b + seg, a + seg)]
    mb.add(pts, cols, nrms, faces)


def slab(mb, outline, depth, color, axis='y', at=0.0, r=0.0):
    """A flat shape (outline: [(u, v), ...] counter-clockwise, convex or star-shaped about its middle) pushed out depth
    along axis, its front face at `at`. For y: u is x, v is z, and the front looks toward -y."""
    fn = color if callable(color) else shade(color)
    cu = sum(u for u, _ in outline) / len(outline)
    cv = sum(v for _, v in outline) / len(outline)

    def P(u, v, w):
        return {'y': Vector((u, w, v)), 'x': Vector((w, u, v)), 'z': Vector((u, v, w))}[axis]
    front_n = {'y': Vector((0, -1, 0)), 'x': Vector((-1, 0, 0)), 'z': Vector((0, 0, 1))}[axis]
    n = len(outline)
    for w, nn, rev in ((at, front_n, False), (at + depth, -front_n, True)):
        pts = [P(cu, cv, w)] + [P(u, v, w) for u, v in outline]
        F = [(0, 1 + (k + 1) % n, 1 + k) if not rev else (0, 1 + k, 1 + (k + 1) % n) for k in range(n)]
        if axis == 'z':
            F = [(a, c, b) for a, b, c in F]
        mb.add(pts, [fn(p, nn) for p in pts], [nn] * len(pts), F)
    # the edge
    pts, cols, nrms, faces = [], [], [], []
    for k in range(n):
        (u0, v0), (u1, v1) = outline[k], outline[(k + 1) % n]
        e = P(u1, v1, 0) - P(u0, v0, 0)
        side = e.cross(front_n).normalized()
        if side.dot(P(u0, v0, 0) - P(cu, cv, 0)) < 0:
            side = -side
        quad = [P(u0, v0, at), P(u1, v1, at), P(u1, v1, at + depth), P(u0, v0, at + depth)]
        b = len(pts)
        pts += quad; nrms += [side] * 4; cols += [fn(q, side) for q in quad]
        faces += [(b, b + 1, b + 2), (b, b + 2, b + 3)] if axis != 'z' else [(b, b + 2, b + 1), (b, b + 3, b + 2)]
    mb.add(pts, cols, nrms, faces)


def plank_row(mb, x0, x1, y0, y1, z0, z1, n, color, gap=0.012, along='x', r=0.012, seed=0, stack=None):
    """n planks side by side (each its own shade of the wood), filling the box: split across y (planks running along
    x), across x (along y), or stacked up z (stack='z', planks running along `along`)."""
    rng = random.Random(seed)
    for k in range(n):
        tone = rgb(color) * rng.uniform(0.88, 1.08)
        c = col_fn(tuple(tone), grain=along, seed=rng.random() * 9)
        if stack == 'z':
            a = z0 + (z1 - z0) * k / n
            rbox(mb, x0, y0, a + gap / 2, x1, y1, a + (z1 - z0) / n - gap / 2, c, r=r)
        elif along == 'x':
            a = y0 + (y1 - y0) * k / n
            rbox(mb, x0, a + gap / 2, z0, x1, a + (y1 - y0) / n - gap / 2, z1, c, r=r)
        elif along == 'y':
            a = x0 + (x1 - x0) * k / n
            rbox(mb, a + gap / 2, y0, z0, a + (x1 - x0) / n - gap / 2, y1, z1, c, r=r)
        else:
            a = x0 + (x1 - x0) * k / n
            rbox(mb, a + gap / 2, y0, z0, a + (x1 - x0) / n - gap / 2, y1, z1, c, r=r)


def xform(mb, mark, M):
    """Move everything added to mb since mark by the matrix M (normals turned with it)."""
    R = M.to_3x3()
    for i in range(mark, len(mb.v)):
        mb.v[i] = M @ mb.v[i]
        mb.n[i] = (R @ mb.n[i]).normalized()


def rot(x=0.0, y=0.0, z=0.0, at=(0, 0, 0)):
    at = Vector(at)
    return Matrix.Translation(at) @ Euler((x, y, z)).to_matrix().to_4x4() @ Matrix.Translation(-at)


def flame(mb, c, h, w):
    """A flame: three tongues (orange, amber, pale yellow, each smaller and in front), crossed in two planes so it
    reads from any side; meant for an unlit (glowing) part."""
    c = Vector(c)
    for ang in (0.0, math.pi / 2):
        for k, (col, s) in enumerate((('#ff7a1a', 1.0), ('#ffb42a', 0.72), ('#fff07a', 0.42))):
            pts = []
            for j in range(16):
                a = j / 16 * math.tau
                # a teardrop: round at the foot, a point at the top
                t = 0.5 - 0.5 * math.cos(a)                 # 0 at the foot's middle, 1 at the top
                u = math.sin(a) * w * s * 0.5 * (1 - t) ** 0.6 * (0.6 + 0.8 * t) ** 0.5
                pts.append((u, t * h * s))
            m = len(mb.v)
            slab(mb, pts, 0.008, col, axis='y', at=-0.004 - k * 0.012)
            xform(mb, m, Matrix.Translation(c) @ Euler((0, 0, ang)).to_matrix().to_4x4())


def rocks(mb, c, r, color='#9a948a', seed=0, n=1):
    rng = random.Random(seed)
    for k in range(n):
        cc = Vector(c) + Vector((rng.uniform(-1, 1) * r * 0.8, rng.uniform(-1, 1) * r * 0.8, 0)) * (1 if k else 0)
        rr = r * rng.uniform(0.6, 1.0)
        f = col_fn(color, mottle=0.12, seed=rng.random() * 9)
        ico = bmesh_ico(2)
        sd = Vector((rng.random() * 9, rng.random() * 9, 0))
        for tri in ico['f']:
            ps = [ico['v'][i] for i in tri]
            P, N = [], []
            for p in ps:
                bump = 1 + 0.18 * noise.noise(p * 1.6 + sd)
                q = Vector((p.x * rr * 1.15 * bump, p.y * rr * bump, max(-0.1, p.z) * rr * 0.75 * bump))
                P.append(cc + q); N.append(p)
            mb.add(P, [f(q, n) for q, n in zip(P, N)], N, [(0, 1, 2)])
