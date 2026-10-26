"""The small things and the far-off things as miniatures, in the dollhouse look of the props (props_island.py): the
shells and gems lying on the island (item_<id>: a clam, a scallop, a turban, a cowrie, a branch of coral, a conch, a
piece of sea glass, a pearl in its shell, a starfish, a message in a bottle; quartz and amethyst as crystal clusters,
the cut gems as gems; the volleyball, item_vbball), what grows in the garden plots (plot_seed, plot_sprout, then the
vegetables grown, veg_<id>), the boats out at sea (sea_sail, sea_sailb, sea_fish, sea_ferry), Sarah's sailboat at the pier
(boat_docked), a dolphin (sea_dolphin), and what goes over: a little plane (sky_plane, its propeller its own part
sky_plane_prop to spin) and a hot air balloon (sky_balloon).

Colors are in the mesh (no baking), a little darker underneath; glossy parts are named *_gloss, glass *_clear.
Units are tiles, z up, -y the front; a boat's or a plane's nose points +x (the game turns it to where it's going).

    python tools/blender/small_things.py [--preview DIR] [--only NAME]
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from mathutils import Vector, Matrix, Euler, noise
from common import *
from trees_ac import MB, vmat, rgb, LIGHT
from kit import col_fn, shade, rbox, lathe, cyl, ball, tube, slab, xform


def lit(c, n, k=0.22):
    """a painted color, lighter where it faces the painted light"""
    return rgb(c) * (0.86 + k * max(0.0, n.dot(LIGHT)))


def facet(mb, pts, color, gloss=0.25, out=None):
    """one flat face (a triangle or a convex polygon), its own normal, painted by the light (out: a direction it should
    face, to turn it the right way round)"""
    P = [Vector(p) for p in pts]
    n = (P[1] - P[0]).cross(P[2] - P[0]).normalized()
    if out is not None and n.dot(Vector(out)) < 0:
        P.reverse()
        n = -n
    c = rgb(color) * (0.78 + 0.34 * max(0.0, n.dot(LIGHT))) + Vector((1, 1, 1)) * gloss * max(0.0, n.dot(LIGHT)) ** 8
    mb.add(P, [c] * len(P), [n] * len(P), [(0, k, k + 1) for k in range(1, len(P) - 1)])


# ---------------------------------------------------------------- shells
def fan(mb, R, h, ribs, c0, c1, spread=1.25, bands=0, ears=False, rib_k=0.12):
    """a fan-shaped shell lying open side down: ribs from the hinge to the rim, darker at the hinge, lighter at the rim,
    and (bands) rings of a darker shade"""
    nu, nv = 26, 9
    P, C, N, F = [], [], [], []
    for i in range(nv + 1):
        rho = i / nv
        for j in range(nu + 1):
            phi = (j / nu - 0.5) * spread * 2
            rib = 1 + rib_k * math.cos(phi * ribs) * rho
            x, y = math.sin(phi) * R * rho, -math.cos(phi) * R * rho + R * 0.45
            z = h * math.sqrt(max(0.0, 1 - rho ** 2)) ** 0.8 * rib * (0.35 + 0.65 * math.cos(phi / spread * 0.9))
            p = Vector((x, y, z + 0.004))
            n = Vector((math.sin(phi) * rho * 0.6, -math.cos(phi) * rho * 0.6, 1.0)).normalized()
            band = 0.86 if bands and int(rho * bands * 2) % 2 else 1.0
            col = rgb(c0).lerp(rgb(c1), rho ** 0.7) * band * (0.9 + 0.12 * math.cos(phi * ribs)) * (0.86 + 0.2 * max(0.0, n.dot(LIGHT)))
            P.append(p); C.append(col); N.append(n)
    for i in range(nv):
        for j in range(nu):
            a = i * (nu + 1) + j
            F += [(a, a + 1, a + nu + 2), (a, a + nu + 2, a + nu + 1)]
    mb.add(P, C, N, F)
    if ears:
        for s in (-1, 1):
            facet(mb, [(0, R * 0.45, 0.012), (s * R * 0.32, R * 0.5, 0.01), (s * R * 0.3, R * 0.32, 0.014)], c0)


def shell_clam():
    mb = MB(); fan(mb, 0.2, 0.07, 9, '#c9a47a', '#f2dcc0', spread=1.0, bands=3, rib_k=0.04); return [(mb, 'main')]


def shell_scallop():
    mb = MB(); fan(mb, 0.21, 0.065, 14, '#e0785a', '#ffb08a', spread=1.15, ears=True, rib_k=0.16); return [(mb, 'main')]


def spiral(mb, length, r, turns, c0, c1, knobs=0):
    """a spiral shell lying on its side: a cone of whorls, each whorl a bulge, banded"""
    prof = []
    n = 40
    for k in range(n + 1):
        t = k / n
        w = (t * turns) % 1.0
        rr = r * (1 - t) ** 0.9 * (0.86 + 0.14 * math.sin(w * math.pi)) + 0.006
        prof.append((rr, t * length))

    def col(p, nn):
        t = max(0.0, min(1.0, (p.z) / length))
        band = 0.82 if int(t * turns * 2 + 0.5) % 2 else 1.0
        return rgb(c0).lerp(rgb(c1), t) * band * (0.86 + 0.22 * max(0.0, nn.dot(LIGHT)))
    m = len(mb.v)
    lathe(mb, prof, col, seg=16, cap_top=False, cap_bot=True)
    if knobs:
        for k in range(knobs):
            a = k / knobs * math.tau * 2
            t = 0.25 + 0.5 * k / knobs
            rr = r * (1 - t) ** 0.9
            ball(mb, (math.cos(a) * rr, math.sin(a) * rr, t * length), rr * 0.25, shade(c1), sub=1)
    xform(mb, m, Matrix.Translation((0, 0, r * 0.8)) @ Euler((0, math.pi / 2 - 0.2, 0.3)).to_matrix().to_4x4())


def shell_turban():
    mb = MB(); spiral(mb, 0.26, 0.11, 4, '#8a5a3a', '#e8c8a0'); return [(mb, 'main')]


def shell_conch():
    mb = MB()
    spiral(mb, 0.36, 0.14, 4.5, '#e8b88a', '#f6dcc0', knobs=7)
    # the pink lip of its opening
    slab(mb, [(-0.06, 0.0), (0.08, 0.0), (0.1, 0.12), (-0.04, 0.16)], 0.02, shade('#f49aa8'), axis='y', at=-0.12)
    return [(mb, 'main')]


def shell_cowrie():
    mb = MB()

    def col(p, n):
        s = noise.noise(p * 38) > 0.25
        return (rgb('#7a4a2a') if s else rgb('#e8b878')).lerp(rgb('#fff4e0'), max(0.0, -n.y) * 0.3) * (0.86 + 0.22 * max(0.0, n.dot(LIGHT)))
    ball(mb, (0, 0, 0.05), (0.15, 0.1, 0.07), col, sub=3)
    tube(mb, [(-0.13, -0.02, 0.02), (0.0, -0.035, 0.012), (0.13, -0.02, 0.02)], 0.012, shade('#5a3a24'), seg=6)
    return [(mb, 'gloss')]


def shell_coral():
    mb = MB()
    rng = random.Random(4)
    c = col_fn('#f07a6a', under=0.2)

    def branch(p, d, r, depth):
        q = p + d * (0.1 + 0.05 * depth)
        tube(mb, [p, (p + q) / 2 + Vector((0, 0, 0.01)), q], r, c, seg=6, r1=r * 0.75)
        ball(mb, q, r * 0.8, c, sub=1)
        if depth > 0:
            for s in (-1, 1):
                nd = Euler((0, 0, s * rng.uniform(0.4, 0.8))).to_matrix() @ d
                nd.z += rng.uniform(0.2, 0.5)
                branch(q, nd.normalized(), r * 0.72, depth - 1)
    branch(Vector((0, 0, 0.0)), Vector((0.2, 0.0, 0.9)).normalized(), 0.028, 2)
    xform(mb, 0, Euler((0, 1.2, 0.4)).to_matrix().to_4x4())
    return [(mb, 'main')]


def shell_seaglass():
    mb = MB(); ball(mb, (0, 0, 0.04), (0.11, 0.08, 0.045), lambda p, n: lit('#8ed8c0', n, 0.3), sub=3); return [(mb, 'gloss')]


def shell_pearl():
    mb, g = MB(), MB()
    fan(mb, 0.17, 0.035, 7, '#8a8aa0', '#d8d4e4', spread=1.05, rib_k=0.05)
    ball(g, (0, 0.02, 0.06), 0.05, lambda p, n: lit('#fbf6f0', n, 0.35), sub=3)
    return [(mb, 'main'), (g, 'gloss')]


def shell_star():
    mb = MB()
    c = col_fn('#f4904a', under=0.15)
    for k in range(5):
        a = k / 5 * math.tau + math.pi / 2
        d = Vector((math.cos(a), math.sin(a), 0))
        tube(mb, [d * 0.0 + Vector((0, 0, 0.03)), d * 0.1 + Vector((0, 0, 0.032)), d * 0.19 + Vector((0, 0, 0.018))], 0.045, c, seg=8, r1=0.012)
        for t in (0.06, 0.12):
            ball(mb, d * t + Vector((0, 0, 0.065 - t * 0.2)), 0.012, shade('#ffc080'), sub=1)
    ball(mb, (0, 0, 0.035), (0.06, 0.06, 0.03), c, sub=2)
    return [(mb, 'main')]


def shell_bottle():
    glass, cork = MB(), MB()
    m = len(glass.v)
    lathe(glass, [(0.0, 0.0), (0.07, 0.005), (0.075, 0.03), (0.075, 0.2), (0.06, 0.24), (0.028, 0.27), (0.026, 0.32)], lambda p, n: lit('#8ad0a0', n, 0.3), seg=14, cap_top=False)
    xform(glass, m, Matrix.Translation((-0.16, 0, 0.075)) @ Euler((0, math.pi / 2, 0)).to_matrix().to_4x4())
    m = len(cork.v)
    cyl(cork, 0, 0, 0.3, 0.35, 0.022, color=col_fn('#b08050', grain='z'), seg=8)
    lathe(cork, [(0.035, 0.05), (0.035, 0.18)], shade('#f6efe0'), seg=10, cap_top=True, cap_bot=True)
    xform(cork, m, Matrix.Translation((-0.16, 0, 0.075)) @ Euler((0, math.pi / 2, 0)).to_matrix().to_4x4())
    return [(glass, 'gloss'), (cork, 'main')]


# ---------------------------------------------------------------- gems
GEMS = {
    'quartz': ('#f8f6fb', '#bcb6c4'), 'amethyst': ('#cfadee', '#8454b2'), 'topaz': ('#ffd89b', '#ffb84a'),
    'emerald': ('#95dfb6', '#3fc47a'), 'sapphire': ('#95b6ee', '#3f7ae0'), 'ruby': ('#ee8d9b', '#e0304a'), 'diamond': ('#eaf9ff', '#a8d4ee'),
}


def crystal(mb, base, d, h, r, color):
    """a six-sided crystal standing out of the ground along d, pointed at its tip"""
    d = Vector(d).normalized()
    side = d.cross(Vector((0, 0, 1)))
    side = side.normalized() if side.length > 1e-3 else Vector((1, 0, 0))
    up = side.cross(d).normalized()
    ring = lambda t, rr: [Vector(base) + d * t + (side * math.cos(k / 6 * math.tau) + up * math.sin(k / 6 * math.tau)) * rr for k in range(6)]
    a, b, tip = ring(-0.04, r), ring(h * 0.78, r * 0.94), Vector(base) + d * h
    mid = Vector(base) + d * h * 0.5
    for k in range(6):
        k1 = (k + 1) % 6
        facet(mb, [a[k], a[k1], b[k1], b[k]], color, 0.5, out=(a[k] + a[k1]) / 2 - (Vector(base) + d * -0.04))
        facet(mb, [b[k], b[k1], tip], color, 0.7, out=(b[k] + b[k1] + tip) / 3 - mid)


def gem_cluster(c0, c1):
    mb = MB()
    crystal(mb, (0, 0, 0), (0, 0, 1), 0.3, 0.06, c0)
    crystal(mb, (0.05, 0.02, 0), (0.45, 0.1, 1), 0.22, 0.045, c1)
    crystal(mb, (-0.05, -0.02, 0), (-0.5, -0.2, 1), 0.18, 0.04, c0)
    crystal(mb, (0.0, -0.06, 0), (0.1, -0.6, 1), 0.14, 0.035, c1)
    return mb


def gem_cut(c0, c1, r=0.13, h=0.2):
    """a cut gem standing a little tilted on its point: eight crown facets up to the table, eight down to the point"""
    mb = MB()
    n, zg, zt = 8, h * 0.45, h
    G = [Vector((math.cos(k / n * math.tau) * r, math.sin(k / n * math.tau) * r, zg)) for k in range(n)]
    T = [Vector((math.cos((k + 0.5) / n * math.tau) * r * 0.55, math.sin((k + 0.5) / n * math.tau) * r * 0.55, zt)) for k in range(n)]
    tip = Vector((0, 0, 0))
    for k in range(n):
        k1 = (k + 1) % n
        facet(mb, [G[k], G[k1], T[k]], c0, 0.8)
        facet(mb, [T[k], G[k1], T[k1]], c0 if k % 2 else c1, 0.8)
        facet(mb, [G[k1], G[k], tip], c1, 0.4)
    facet(mb, list(reversed(T))[::-1], c0, 0.9)
    xform(mb, 0, Matrix.Translation((0, 0, 0.02)) @ Euler((0.35, 0, 0.3)).to_matrix().to_4x4())
    return mb


# ---------------------------------------------------------------- boats
def hull(mb, L, W, H, top, low, stripe=None, sheer=0.06):
    """a boat's hull from stern (x = -L/2) to bow (+L/2): a round-bottomed shape, its deck edge rising a little to the bow,
    pointed at the bow, with a stripe below the deck edge"""
    nk, ns = 18, 7
    rows = []
    for i in range(nk + 1):
        t = i / nk
        x = -L / 2 + L * t
        w = W / 2 * (1 - max(0.0, (t - 0.55) / 0.45) ** 1.6) * (0.82 + 0.18 * math.sin(min(1.0, t / 0.3) * math.pi / 2)) + 0.004
        zt = H + sheer * t ** 2
        ring = []
        for j in range(ns + 1):
            a = j / ns * math.pi           # from one deck edge down round the keel to the other
            y = math.cos(a) * w
            z = zt - (zt * 0.95) * math.sin(a) ** 0.8 * (1 - 0.4 * t ** 3)
            ring.append(Vector((x, y, z)))
        rows.append(ring)
    P, C, N, F = [], [], [], []
    for i, ring in enumerate(rows):
        for j, p in enumerate(ring):
            a = j / ns * math.pi
            n = Vector((0, math.cos(a), -math.sin(a) * 0.6)).normalized()
            zt = ring[0].z
            depth = (zt - p.z) / max(0.01, zt)
            c = rgb(stripe) if stripe and 0.08 < depth < 0.2 else rgb(top).lerp(rgb(low), min(1.0, depth * 1.6))
            P.append(p); N.append(n); C.append(c * (0.84 + 0.22 * max(0.0, n.dot(LIGHT))))
    for i in range(nk):
        for j in range(ns):
            a = i * (ns + 1) + j
            F += [(a, a + ns + 1, a + ns + 2), (a, a + ns + 2, a + 1)]
    mb.add(P, C, N, F)
    # the deck, planked
    deck = [rows[i][0] for i in range(nk + 1)] + [rows[i][ns] for i in range(nk, -1, -1)]
    cen = sum(deck, Vector()) / len(deck)
    up = Vector((0, 0, 1))
    mb.add([cen] + deck, [rgb('#c89a64')] + [rgb('#b8884f') * (0.94 + 0.08 * math.sin(p.y * 60)) for p in deck], [up] * (len(deck) + 1),
           [(0, k + 1, (k + 1) % len(deck) + 1) for k in range(len(deck))])
    return rows


def sailboat(hull_c=('#f4efe4', '#3a6ab8'), sail_c='#fbf8f0', stripe='#e8443a', furled=False, L=1.6):
    mb, sail = MB(), MB()
    hull(mb, L, 0.62, 0.32, hull_c[0], hull_c[1], stripe)
    cyl(mb, 0.1, 0, 0.3, 1.9 * L / 1.6, 0.025, color=col_fn('#c8945a', grain='z'), seg=8)
    tube(mb, [(0.1, 0, 0.62), (-0.55 * L / 1.6, 0, 0.6)], 0.018, col_fn('#c8945a', grain='x'), seg=6)
    if furled:
        # the sail rolled up along the boom, tied
        tube(sail, [(0.06, 0, 0.66), (-0.5 * L / 1.6, 0, 0.64)], 0.05, shade(sail_c), seg=10, r1=0.035)
        for x in (-0.1, -0.3):
            tube(mb, [(x, -0.055, 0.6), (x, 0, 0.71), (x, 0.055, 0.6)], 0.008, shade('#3a6ab8'), seg=4)
    else:
        mast_top = 1.85 * L / 1.6
        slab(sail, [(0.06, 0.66), (0.06, mast_top), (-0.52 * L / 1.6, 0.66)], 0.012, lambda p, n: lit(sail_c, n, 0.2), axis='y', at=-0.006)
        slab(sail, [(0.14, 0.62), (0.14, mast_top * 0.86), (0.62 * L / 1.6, 0.42)], 0.01, lambda p, n: lit(sail_c, n, 0.2), axis='y', at=-0.005)
    ball(mb, (0.1, 0, 1.92 * L / 1.6), 0.03, shade(stripe), sub=1)
    return [(mb, 'main'), (sail, 'sail')]


def sea_fish():
    mb, glass = MB(), MB()
    hull(mb, 2.0, 0.8, 0.36, '#e8e4dc', '#2e5a8a', '#e8b030')
    rbox(mb, -0.55, -0.26, 0.34, 0.05, 0.26, 0.8, col_fn('#f4efe4'), r=0.04)
    rbox(mb, -0.6, -0.3, 0.78, 0.1, 0.3, 0.84, shade('#e8443a'), r=0.02)
    for y in (-0.265, 0.265):
        rbox(glass, -0.45, y - 0.01, 0.55, -0.05, y + 0.01, 0.72, shade('#8ac8e8'), r=0.01)
    cyl(mb, 0.4, 0, 0.36, 1.25, 0.022, color=shade('#e8e4dc'), seg=8)
    tube(mb, [(0.4, 0, 1.1), (0.95, 0, 0.7)], 0.012, shade('#e8e4dc'), seg=5)
    tube(mb, [(0.95, 0, 0.7), (0.95, 0, 0.42)], 0.004, shade('#3a3a3a'), seg=3)
    for k in range(3):
        ball(mb, (-0.75 + k * 0.08, 0.2 - k * 0.04, 0.38), 0.05, shade(['#e8443a', '#f4c040', '#e8443a'][k]), sub=1)
    return [(mb, 'main'), (glass, 'glass')]


def sea_ferry():
    mb, glass = MB(), MB()
    hull(mb, 3.6, 1.2, 0.45, '#f6f4ee', '#2a4a7a', '#3a8ad8', sheer=0.08)
    rbox(mb, -1.3, -0.45, 0.44, 0.9, 0.45, 0.92, col_fn('#f6f4ee'), r=0.05)
    rbox(mb, -1.0, -0.38, 0.9, 0.5, 0.38, 1.3, col_fn('#f6f4ee'), r=0.05)
    rbox(mb, -1.05, -0.42, 1.28, 0.55, 0.42, 1.34, shade('#3a8ad8'), r=0.02)
    for row, (z0, z1, x0, x1) in enumerate(((0.58, 0.76, -1.2, 0.8), (1.0, 1.18, -0.9, 0.4))):
        n = 8 if row == 0 else 5
        for k in range(n):
            x = x0 + (x1 - x0) * (k + 0.2) / n
            for y in (-0.455 if row == 0 else -0.385, 0.455 if row == 0 else 0.385):
                rbox(glass, x, y - 0.01, z0, x + (x1 - x0) / n * 0.6, y + 0.01, z1, shade('#8ac8e8'), r=0.01)
    cyl(mb, -0.6, 0, 1.3, 1.75, 0.13, 0.12, color=shade('#f6f4ee'), seg=12)
    cyl(mb, -0.6, 0, 1.6, 1.78, 0.125, color=shade('#e8443a'), seg=12)
    return [(mb, 'main'), (glass, 'glass')]


def sea_dolphin():
    mb = MB()

    def col(p, n):
        belly = max(0.0, -n.z) ** 1.5
        return rgb('#6a8aa8').lerp(rgb('#dfe6ec'), belly) * (0.84 + 0.24 * max(0.0, n.dot(LIGHT)))
    # a body along x: a long rounded shape, the beak at +x
    prof = [(0.0, -0.62), (0.05, -0.55), (0.1, -0.4), (0.16, -0.15), (0.18, 0.05), (0.16, 0.25), (0.11, 0.4), (0.06, 0.48), (0.035, 0.6), (0.0, 0.64)]
    m = len(mb.v)
    lathe(mb, prof, col, seg=14, cap_top=False, cap_bot=False, sy=0.85)
    xform(mb, m, Euler((0, math.pi / 2, 0)).to_matrix().to_4x4())
    slab(mb, [(-0.1, 0.12), (0.06, 0.12), (-0.08, 0.34)], 0.025, col, axis='y', at=-0.0125)
    for s in (-1, 1):
        slab(mb, [(-0.66, 0.0), (-0.56, 0.0), (-0.74, s * 0.0 + 0.0)], 0.01, col, axis='y', at=-0.005)
    m = len(mb.v)
    slab(mb, [(-0.56, -0.02), (-0.7, -0.17), (-0.74, -0.12), (-0.66, 0.0), (-0.74, 0.12), (-0.7, 0.17)], 0.02, col, axis='z', at=0.0)
    for s in (-1, 1):
        tube(mb, [(0.1, s * 0.12, -0.06), (0.0, s * 0.24, -0.12)], 0.035, col, seg=6, r1=0.01)
    ball(mb, (0.4, -0.1, 0.06), 0.014, shade('#1e2430'), sub=1)
    ball(mb, (0.4, 0.1, 0.06), 0.014, shade('#1e2430'), sub=1)
    return [(mb, 'main')]


# ---------------------------------------------------------------- what goes over
def sky_plane():
    mb, prop, glass = MB(), MB(), MB()
    body = col_fn('#e8443a', under=0.15)
    m = len(mb.v)
    lathe(mb, [(0.0, -0.75), (0.05, -0.72), (0.09, -0.5), (0.13, -0.1), (0.14, 0.25), (0.13, 0.5), (0.1, 0.62), (0.0, 0.66)], body, seg=16, cap_top=False, cap_bot=False)
    xform(mb, m, Euler((0, math.pi / 2, 0)).to_matrix().to_4x4())
    rbox(mb, -0.15, -0.95, 0.0, 0.18, 0.95, 0.05, col_fn('#f4c040'), r=0.025)
    for y in (-0.6, 0.6):
        rbox(mb, -0.02, y - 0.12, 0.0, 0.12, y + 0.12, 0.052, shade('#e8443a'), r=0.012)
    rbox(mb, -0.78, -0.36, 0.02, -0.6, 0.36, 0.05, col_fn('#f4c040'), r=0.015)
    slab(mb, [(-0.78, 0.04), (-0.6, 0.04), (-0.74, 0.32)], 0.025, shade('#e8443a'), axis='y', at=-0.0125)
    rbox(glass, 0.1, -0.09, 0.08, 0.32, 0.09, 0.2, shade('#8ac8e8'), r=0.04)
    for y in (-0.16, 0.16):
        tube(mb, [(0.25, y, -0.06), (0.25, y, -0.22)], 0.01, shade('#3a3a3a'), seg=4)
        m = len(mb.v)
        lathe(mb, [(0.0, -0.02), (0.05, -0.02), (0.055, 0.0), (0.05, 0.02), (0.0, 0.02)], shade('#2a2a2e'), seg=12, cap_top=False)
        xform(mb, m, Matrix.Translation((0.25, y, -0.24)) @ Euler((math.pi / 2, 0, 0)).to_matrix().to_4x4())
    ball(mb, (0.68, 0, 0), 0.05, shade('#f4efe4'), sub=2)
    # the propeller, spun by the game about x, its middle at the origin of its part
    for s in (-1, 1):
        rbox(prop, -0.012, -0.012, 0.0 if s > 0 else -0.24, 0.012, 0.012, 0.24 if s > 0 else 0.0, shade('#3a3a3a'), r=0.008)
    xform(prop, 0, Matrix.Translation((0.7, 0, 0)))
    return [(mb, 'main'), (glass, 'glass')], [(prop, 'prop')]


def sky_balloon():
    mb, env = MB(), MB()
    cols = ['#e8443a', '#f4c040', '#3a9a5a', '#3a7ad8', '#f08ab0', '#f6f0e4']

    def stripes(p, n):
        a = (math.atan2(p.y, p.x) / math.tau + 0.5) * 12
        return rgb(cols[int(a) % 6]) * (0.84 + 0.24 * max(0.0, n.dot(LIGHT)))
    prof = [(0.12, 0.75), (0.28, 0.9), (0.5, 1.15), (0.62, 1.45), (0.64, 1.7), (0.58, 1.95), (0.44, 2.13), (0.24, 2.24), (0.0, 2.27)]
    lathe(env, prof, stripes, seg=60, cap_top=False, cap_bot=False)
    rbox(mb, -0.17, -0.17, 0.0, 0.17, 0.17, 0.28, col_fn('#b0804a', grain='z', seed=2), r=0.03)
    rbox(mb, -0.185, -0.185, 0.26, 0.185, 0.185, 0.3, shade('#8a5a32'), r=0.015)
    for (x, y) in ((-0.15, -0.15), (0.15, -0.15), (0.15, 0.15), (-0.15, 0.15)):
        a = math.atan2(y, x)
        tube(mb, [(x, y, 0.3), (math.cos(a) * 0.12, math.sin(a) * 0.12, 0.76)], 0.006, shade('#5a4a3a'), seg=3)
    cyl(mb, 0, 0, 0.4, 0.5, 0.06, color=shade('#5a5a60'), seg=10)
    return [(mb, 'main'), (env, 'envelope')]


# ---------------------------------------------------------------- the volleyball, and what grows in the garden plots
def vbball():
    mb = MB()

    def panels(p, n):
        a = math.atan2(n.y, n.x)
        k = int((a / math.tau + 0.5) * 6 + (0.5 if n.z > 0.3 else 0)) % 3
        return rgb(['#f6f4ee', '#3a7ad8', '#f4c040'][k]) * (0.84 + 0.24 * max(0.0, n.dot(LIGHT)))
    ball(mb, (0, 0, 0.13), 0.13, panels, sub=3)
    return [(mb, 'main')]


SOIL = '#6a4a30'
LEAF, LEAF_L = '#3e8a34', '#6ab84a'


def leafy(mb, c, n, length, width, lift, color=LEAF, color2=LEAF_L, seed=1, droop=0.3):
    """a rosette of leaves from a point, each a long pointed blade curving out and down"""
    rng = random.Random(seed)
    c = Vector(c)
    for k in range(n):
        a = k / n * math.tau + rng.uniform(-0.2, 0.2)
        d = Vector((math.cos(a), math.sin(a), 0))
        side = Vector((-d.y, d.x, 0))
        L = length * rng.uniform(0.8, 1.1)
        pts = []
        for j in range(5):
            t = j / 4
            pts.append(c + d * L * t + Vector((0, 0, lift * math.sin(t * math.pi * 0.8) - droop * L * t * t)))
        for j in range(4):
            w0 = width * math.sin(math.pi * (j / 4) ** 0.8 + 0.15) * (1 - j / 5)
            w1 = width * math.sin(math.pi * ((j + 1) / 4) ** 0.8 + 0.15) * (1 - (j + 1) / 5)
            q = [pts[j] - side * w0, pts[j] + side * w0, pts[j + 1] + side * w1, pts[j + 1] - side * w1]
            n_ = (q[1] - q[0]).cross(q[3] - q[0]).normalized()
            if n_.z < 0:
                n_ = -n_
            col = rgb(color).lerp(rgb(color2), (j + 0.5) / 4) * (0.86 + 0.22 * max(0.0, n_.dot(LIGHT)))
            mb.add(q, [col] * 4, [n_ * 0.4 + Vector((0, 0, 0.8))] * 4, [(0, 1, 2), (0, 2, 3)])


def stalk(mb, base, h, r=0.016, color=LEAF):
    tube(mb, [Vector(base), Vector(base) + Vector((0.01, 0, h * 0.5)), Vector(base) + Vector((0, 0.01, h))], r, shade(color), seg=6, r1=r * 0.7)


def plot_seed():
    mb = MB()
    lathe(mb, [(0.2, 0.0), (0.17, 0.035), (0.08, 0.06), (0.0, 0.065)], col_fn(SOIL, mottle=0.2), seg=14, cap_top=False)
    for k in range(4):
        a = k * 1.9
        ball(mb, (math.cos(a) * 0.07, math.sin(a) * 0.07, 0.055), 0.012, shade('#e8d8a0'), sub=1)
    return [(mb, 'main')]


def plot_sprout():
    mb = MB()
    lathe(mb, [(0.2, 0.0), (0.17, 0.03), (0.08, 0.05), (0.0, 0.055)], col_fn(SOIL, mottle=0.2), seg=14, cap_top=False)
    for k, (x, y) in enumerate(((-0.05, 0.02), (0.06, -0.03), (0.0, 0.07))):
        stalk(mb, (x, y, 0.04), 0.1, 0.01, '#5aa840')
        leafy(mb, (x, y, 0.14), 2, 0.07, 0.03, 0.02, '#5aa840', '#9ad860', seed=k, droop=0.1)
    return [(mb, 'main')]


def veg(kind):
    mb, shine = MB(), MB()
    if kind == 'bokchoy':
        for k in range(7):
            a = k / 7 * math.tau
            d = Vector((math.cos(a), math.sin(a), 0))
            tube(mb, [d * 0.02, d * 0.05 + Vector((0, 0, 0.12)), d * 0.08 + Vector((0, 0, 0.22))], 0.025, shade('#e8f4d0'), seg=6, r1=0.018)
            ball(mb, d * 0.11 + Vector((0, 0, 0.3)), (0.07, 0.05, 0.1), shade('#3a8a34'), sub=2)
    elif kind == 'greenonion':
        for k in range(6):
            a = k * 1.05
            b = Vector((math.cos(a) * 0.04, math.sin(a) * 0.04, 0))
            tube(mb, [b, b * 1.4 + Vector((0, 0, 0.1)), b * 1.8 + Vector((0, 0, 0.32)), b * 2.6 + Vector((0, 0, 0.42))], 0.016, lambda p, n: rgb('#f2f6e0').lerp(rgb('#4a9a3a'), min(1.0, p.z / 0.18)), seg=6, r1=0.008)
    elif kind == 'thaibasil':
        stalk(mb, (0, 0, 0), 0.3, 0.014, '#6a4a6a')
        for k, z in enumerate((0.1, 0.18, 0.26, 0.32)):
            leafy(mb, (0, 0, z), 3, 0.09 - z * 0.12, 0.04, 0.02, '#2e6a2e', '#5aa04a', seed=k + 3, droop=0.25)
        ball(mb, (0, 0, 0.36), (0.02, 0.02, 0.05), shade('#9a5ab8'), sub=1)
    elif kind == 'carrot':
        lathe(mb, [(0.0, -0.02), (0.045, 0.02), (0.05, 0.06), (0.0, 0.07)], shade('#f08a2a'), seg=10, cap_top=True)
        for k in range(5):
            a = k / 5 * math.tau
            tube(mb, [(0, 0, 0.06), (math.cos(a) * 0.05, math.sin(a) * 0.05, 0.2), (math.cos(a) * 0.1, math.sin(a) * 0.1, 0.3)], 0.01, shade('#4a9a3a'), seg=4)
            ball(mb, (math.cos(a) * 0.1, math.sin(a) * 0.1, 0.3), (0.05, 0.05, 0.035), shade('#5aaa44'), sub=1)
    elif kind == 'broccoli':
        leafy(mb, (0, 0, 0.05), 5, 0.17, 0.06, 0.08, '#3a7a3a', '#6aa858', seed=7)
        stalk(mb, (0, 0, 0), 0.22, 0.04, '#8ac06a')
        for k in range(7):
            a = k / 7 * math.tau
            ball(mb, (math.cos(a) * 0.06, math.sin(a) * 0.06, 0.26), 0.055, col_fn('#3a8a3a', mottle=0.25), sub=2)
        ball(mb, (0, 0, 0.29), 0.06, col_fn('#3a8a3a', mottle=0.25), sub=2)
    else:
        # a bushy plant with its fruit hanging: chili, cucumber, eggplant, tomato, edamame
        stalk(mb, (0, 0, 0), 0.34, 0.016)
        for k, z in enumerate((0.1, 0.2, 0.3)):
            leafy(mb, (0, 0, z), 4, 0.12, 0.05, 0.03, seed=k * 3 + len(kind), droop=0.3)
        fr = {'tomato': ('#e8342a', 'ball'), 'chili': ('#e8302a', 'pod'), 'cucumber': ('#3a8a34', 'long'), 'eggplant': ('#5a2a6a', 'long'), 'edamame': ('#7ac04a', 'pod')}[kind]
        for k in range(4 if fr[1] == 'ball' else 3):
            a = k / 3.5 * math.tau + 0.4
            p = Vector((math.cos(a) * 0.1, math.sin(a) * 0.1 - 0.03, 0.12 + 0.07 * (k % 2)))
            if fr[1] == 'ball':
                ball(shine, p, 0.05, shade(fr[0]), sub=2)
                ball(mb, p + Vector((0, 0, 0.05)), (0.025, 0.025, 0.01), shade('#3a7a2a'), sub=1)
            elif fr[1] == 'long':
                r0 = 0.04 if kind == 'eggplant' else 0.03
                tube(shine, [p + Vector((0, 0, 0.02)), p - Vector((0, 0, 0.06)), p - Vector((0.01, 0, 0.13))], r0, shade(fr[0]), seg=8, r1=r0 * (1.3 if kind == 'eggplant' else 0.8))
            else:
                tube(shine, [p, p - Vector((0.01, 0, 0.05)), p - Vector((0.03, 0, 0.09))], 0.016, shade(fr[0]), seg=6, r1=0.006)
    lathe(mb, [(0.18, 0.0), (0.15, 0.025), (0.06, 0.04), (0.0, 0.045)], col_fn(SOIL, mottle=0.2), seg=14, cap_top=False)
    return [(mb, 'main'), (shine, 'gloss')] if shine.v else [(mb, 'main')]


VEG = ['bokchoy', 'chili', 'cucumber', 'carrot', 'broccoli', 'eggplant', 'thaibasil', 'greenonion', 'tomato', 'edamame']

THINGS = {
    'item_vbball': vbball, 'plot_seed': plot_seed, 'plot_sprout': plot_sprout,
    **{f'veg_{k}': (lambda k=k: veg(k)) for k in VEG},
    'item_shell_clam': shell_clam, 'item_shell_scallop': shell_scallop, 'item_shell_turban': shell_turban, 'item_shell_cowrie': shell_cowrie,
    'item_shell_coral': shell_coral, 'item_shell_conch': shell_conch, 'item_shell_seaglass': shell_seaglass, 'item_shell_pearl': shell_pearl,
    'item_shell_star': shell_star, 'item_shell_bottle': shell_bottle,
    **{f'item_gem_{k}': (lambda c=c, k=k: [(gem_cluster(*c) if k in ('quartz', 'amethyst') else gem_cut(*c), 'gloss')]) for k, c in GEMS.items()},
    'sea_sail': lambda: sailboat(), 'sea_sailb': lambda: sailboat(('#e8443a', '#7a2a24'), '#fff0d8', '#f6f0e4'),
    'sea_fish': sea_fish, 'sea_ferry': sea_ferry, 'sea_dolphin': sea_dolphin,
    'boat_docked': lambda: sailboat(('#f4efe4', '#b8263a'), '#fbf8f0', '#3a6ab8', furled=True, L=2.0),
    'sky_plane': sky_plane, 'sky_balloon': sky_balloon,
}


def build(name):
    out = THINGS[name]()
    extra = None
    if isinstance(out, tuple):
        out, extra = out
    objs = [mb.obj(f'{name}_{part}', vmat(f'{name}_{part}', rough=0.35 if part in ('gloss', 'glass', 'clear') else 0.75)) for mb, part in out]
    more = [mb.obj(f'{name}_{part}', vmat(f'{name}_{part}', rough=0.6)) for mb, part in (extra or [])]
    return objs, more


def grid(path, objs_list, cols=8, cell=1.8, size=(1800, 1100)):
    ground_plane(color='#e8d4a8')
    light_rig()
    for k, objs in enumerate(objs_list):
        x, y = (k % cols) * cell, (k // cols) * cell * 0.9
        for o in objs:
            o.matrix_world = Matrix.Translation((x, y, 0)) @ o.matrix_world
    rows = (len(objs_list) + cols - 1) // cols
    camera(((cols - 1) * cell / 2, (rows - 1) * cell * 0.45, 0.3), dist=max(9, cols * cell * 1.0), pitch=40)
    render(path, size=size, samples=48)


if __name__ == '__main__':
    args = sys.argv[1:]
    prev = args[args.index('--preview') + 1] if '--preview' in args else None
    only = args[args.index('--only') + 1] if '--only' in args else None
    reset()
    shown = []
    for name in THINGS:
        if only and not name.startswith(only):
            continue
        objs, more = build(name)
        export(objs, name)
        if more:
            export(more, name + '_prop')
        shown.append(objs + more)
        print('built', name)
    if prev and shown:
        os.makedirs(prev, exist_ok=True)
        grid(os.path.join(prev, 'small_things.png'), shown)
