"""The small things and the far-off things as miniatures, in the dollhouse look of the props (props_island.py): the
shells and gems lying on the island (item_<id>: a clam, a scallop, a turban, a cowrie, a branch of coral, a conch, a
piece of sea glass, a pearl in its shell, a starfish, a message in a bottle; quartz and amethyst as crystal clusters,
the cut gems as gems; the volleyball, item_vbball), what grows in the garden plots (plot_seed, plot_sprout, then the
vegetables grown, veg_<id>), the boats out at sea (sea_sail, sea_sailb, sea_fish, sea_ferry), the boat Sarah came on, at the
pier (boat_home, as big as a building), a dolphin (sea_dolphin), a whale's back and tail (sea_whale, sea_whale_tail), and what goes over: a little plane (sky_plane, its propeller its own part
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
        # (a little shine: much more and the crown facets facing the light went white, the gem's color gone)
        facet(mb, [G[k], G[k1], T[k]], c0, 0.22)
        facet(mb, [T[k], G[k1], T[k1]], c0 if k % 2 else c1, 0.22)
        facet(mb, [G[k1], G[k], tip], c1, 0.15)
    facet(mb, list(reversed(T))[::-1], c0, 0.3)
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


def ring(c, R, axis='y', n=24, a0=0.0, a1=math.tau):
    """points round a circle (an arc from a0 to a1) about c, in the plane facing axis"""
    pts = []
    for k in range(n + 1):
        a = a0 + (a1 - a0) * k / n
        u, v = math.cos(a) * R, math.sin(a) * R
        pts.append(Vector(c) + {'y': Vector((u, 0, v)), 'x': Vector((0, u, v)), 'z': Vector((u, v, 0))}[axis])
    return pts


def boat_home():
    """The boat Sarah came on, tied up at the pier: a cabin sloop as big as one of the island's buildings (David, 27
    October: the little one looked like a toy). White over red with a blue stripe like the opening scene's, a teak deck,
    the cabin with brass portholes, the cockpit and its wheel, the mast with its rigging, the mainsail furled under a blue
    cover on the boom and the jib rolled on the forestay, rails all round, a life ring and fenders at the stern. Stern at
    x -L/2 (toward the pier), bow at +x; z 0 is the keel, the game sets the waterline about a third of the way up."""
    mb, sail, glass = MB(), MB(), MB()
    L, W, H = 5.4, 1.75, 1.0
    rows = hull(mb, L, W, H, '#f6f1e6', '#b8263a', '#3a6ab8', sheer=0.3)
    nk, ns = len(rows) - 1, len(rows[0]) - 1
    TEAK, STEEL, ROPE = '#b07a48', '#d6d8da', '#5a5a5a'

    def deck(x):
        """the deck edge's half width and height at x"""
        t = min(1.0, max(0.0, (x + L / 2) / L))
        i = min(nk - 1, int(t * nk))
        k = t * nk - i
        p = rows[i][0].lerp(rows[i + 1][0], k)
        return p.y, p.z
    # the transom (the stern's flat face), and a toe rail of teak along the deck edge
    facet(mb, [p.copy() for p in rows[0]], '#f6f1e6', gloss=0.1, out=(-1, 0, 0))
    for j in (0, ns):
        tube(mb, [rows[i][j] + Vector((0, 0, 0.02)) for i in range(nk + 1)], 0.035, col_fn(TEAK, grain='x'), seg=6)
    tube(mb, [rows[0][0] + Vector((0, 0, 0.02)), rows[0][ns] + Vector((0, 0, 0.02))], 0.035, col_fn(TEAK, grain='y'), seg=6)
    # a blue stripe round the hull just under the deck edge (the hull's own rings are too far apart to paint one)
    for j in (0, ns):
        tube(mb, [Vector((p.x, p.y * 0.995 + (0.012 if p.y > 0 else -0.012), p.z - 0.17)) for p in (rows[i][j] for i in range(nk + 1))], 0.04, shade('#3a6ab8'), seg=6)
    # the cabin: cream sides, a teak roof, brass portholes, the companionway's doors aft and a hatch on top
    cx0, cx1, cy, cz0, cz1 = -1.5, 0.5, 0.56, 0.9, 1.55
    rbox(mb, cx0, -cy, cz0, cx1, cy, cz1, col_fn('#f4efe4', mottle=0.03), r=0.12)
    rbox(mb, cx0 - 0.07, -cy - 0.06, cz1 - 0.04, cx1 + 0.07, cy + 0.06, cz1 + 0.07, col_fn(TEAK, grain='x'), r=0.04)
    rbox(mb, cx0 + 0.05, -0.3, cz1 + 0.06, cx0 + 0.6, 0.3, cz1 + 0.15, col_fn(TEAK, grain='x'), r=0.03)
    rbox(mb, cx0 - 0.04, -0.24, 1.0, cx0 + 0.02, 0.24, 1.47, col_fn('#8a5a34', grain='z'), r=0.02)
    tube(mb, [(cx0 - 0.045, 0, 1.0), (cx0 - 0.045, 0, 1.47)], 0.006, shade('#5a3a20'), seg=4)
    for side in (-1, 1):
        for x in (-1.15, -0.55, 0.05):
            y = side * (cy + 0.005)
            tube(mb, ring((x, y, 1.25), 0.085, n=20), 0.018, shade('#d8a84a'), seg=6)
            rbox(glass, x - 0.068, y - 0.006, 1.182, x + 0.068, y + 0.006, 1.318, shade('#9ad0ec'), r=0.06)
        # grab rails along the roof
        tube(mb, [(cx0 + 0.1, side * (cy - 0.06), cz1 + 0.07), (cx0 + 0.15, side * (cy - 0.06), cz1 + 0.13), (cx1 - 0.15, side * (cy - 0.06), cz1 + 0.13),
                  (cx1 - 0.1, side * (cy - 0.06), cz1 + 0.07)], 0.014, col_fn(TEAK), seg=5)
    # the cockpit: low teak coamings, a bench each side, the wheel on its pedestal (turned a little so it reads)
    for side in (-1, 1):
        rbox(mb, -2.45, side * 0.6 - 0.035, 0.95, cx0 + 0.02, side * 0.6 + 0.035, 1.2, col_fn(TEAK, grain='x'), r=0.02)
        rbox(mb, -2.4, side * 0.42 - 0.13, 0.95, cx0, side * 0.42 + 0.13, 1.07, col_fn('#c89a64', grain='x'), r=0.025)
    cyl(mb, -2.1, 0, 0.95, 1.42, 0.05, 0.035, color=shade('#e8e4dc'), seg=10)
    wc = Vector((-2.16, 0, 1.56))
    turn = Matrix.Rotation(math.radians(-50), 3, 'Z')
    rim = [wc + turn @ (p - wc) for p in ring(wc, 0.24, axis='x', n=28)]
    tube(mb, rim, 0.022, col_fn('#9a6234', grain='z'), seg=6)
    for k in range(8):
        a = k / 8 * math.tau
        d = turn @ Vector((0, math.cos(a), math.sin(a)))
        tube(mb, [wc, wc + d * 0.31], 0.012, col_fn('#9a6234'), seg=4)
        ball(mb, wc + d * 0.32, 0.024, shade('#9a6234'), sub=1)
    ball(mb, wc, 0.045, shade('#d8a84a'), sub=1)
    # the mast, its spreaders and rigging; a pennant at the top
    mx, mz = 0.95, 5.25
    cyl(mb, mx, 0, 0.95, mz, 0.075, 0.048, color=col_fn('#c8945a', grain='z'), seg=10)
    ball(mb, (mx, 0, mz + 0.02), 0.06, shade('#e8443a'), sub=1)
    slab(mb, [(mx + 0.04, mz - 0.18), (mx + 0.04, mz - 0.02), (mx + 0.55, mz - 0.1)], 0.012, lambda p, n: lit('#e8443a', n, 0.2), axis='y', at=-0.006)
    tube(mb, [(mx, -0.55, 3.4), (mx, 0.55, 3.4)], 0.022, col_fn('#c8945a', grain='y'), seg=6)
    bow = Vector((L / 2 + 0.55, 0, deck(L / 2)[1] + 0.06))
    tube(mb, [(L / 2 - 0.25, 0, deck(L / 2 - 0.25)[1] + 0.04), bow], 0.04, col_fn('#c8945a', grain='x'), seg=6)
    for side in (-1, 1):
        yd, zd = deck(mx)
        tube(mb, [(mx, 0, mz - 0.25), (mx, side * 0.55, 3.4), (mx, side * (yd - 0.04), zd + 0.04)], 0.009, shade(ROPE), seg=4)
        tube(mb, [(mx, 0, 3.4), (mx - 0.35, side * (yd - 0.04), deck(mx - 0.35)[1] + 0.04)], 0.008, shade(ROPE), seg=4)
    tube(mb, [(mx, 0, mz - 0.1), bow], 0.009, shade(ROPE), seg=4)
    tube(mb, [(mx, 0, mz - 0.05), (-L / 2 + 0.08, 0, H + 0.06)], 0.009, shade(ROPE), seg=4)
    # the jib rolled up round the forestay
    f0, f1 = Vector((mx, 0, mz - 0.1)), bow
    tube(sail, [f1.lerp(f0, k) for k in (0.04, 0.3, 0.6, 0.86)], 0.07, shade('#fbf8f0'), seg=10, r1=0.025)
    # the boom, the mainsail furled on it under its blue cover, with ties; the topping lift
    bz = 1.95
    tube(mb, [(mx - 0.02, 0, bz), (-2.35, 0, bz - 0.04)], 0.045, col_fn('#c8945a', grain='x'), seg=8)
    tube(sail, [(mx - 0.08, 0, bz + 0.13), (-0.6, 0, bz + 0.13), (-2.15, 0, bz + 0.09)], 0.15, col_fn('#3a6ab8', mottle=0.04), seg=12, r1=0.08)
    for x in (0.3, -0.5, -1.3, -1.95):
        r = 0.155 - (0.3 - x) / 2.45 * 0.07
        tube(mb, ring((x, 0, bz + 0.12), r + 0.01, axis='x', n=14), 0.012, shade('#f4efe4'), seg=4)
    tube(mb, [(mx, 0, mz - 0.3), (-2.3, 0, bz)], 0.006, shade(ROPE), seg=3)
    # rails: steel stanchions with two lifelines, a pulpit at the bow and a pushpit at the stern
    xs = [-2.45 + k * 0.55 for k in range(9)]
    for side in (-1, 1):
        top, mid = [], []
        for x in xs:
            yd, zd = deck(x)
            p = Vector((x, side * (yd - 0.07), zd))
            cyl(mb, p.x, p.y, zd, zd + 0.36, 0.014, color=shade(STEEL), seg=6)
            top.append(p + Vector((0, 0, 0.36))); mid.append(p + Vector((0, 0, 0.19)))
        yb, zb = deck(L / 2 - 0.35)
        nose = Vector((L / 2 - 0.05, 0, deck(L / 2)[1] + 0.4))
        top.append(Vector((L / 2 - 0.35, side * (yb - 0.1), zb + 0.4)))
        top.append(nose)
        tube(mb, top, 0.011, shade(STEEL), seg=5)
        tube(mb, mid, 0.008, shade(STEEL), seg=4)
    ys, zs = deck(-L / 2 + 0.05)
    tube(mb, [(-2.45, -(ys - 0.07), zs + 0.36), (-2.6, -0.3, zs + 0.38), (-2.6, 0.3, zs + 0.38), (-2.45, ys - 0.07, zs + 0.36)], 0.011, shade(STEEL), seg=5)
    # the life ring on the rail facing the front, red and white
    lr = ring((-1.95, -(deck(-1.95)[0] + 0.02), 1.22), 0.13, n=24)
    for k in range(8):
        tube(mb, lr[k * 3:k * 3 + 4], 0.038, shade('#e8443a' if k % 2 else '#fbf8f0'), seg=8)
    # fenders hanging off the stern, ready for the pier
    for y in (-0.42, 0.42):
        cyl(mb, -L / 2 - 0.1, y, 0.5, 0.86, 0.075, color=shade('#f4f4f0'), seg=10, round_=0.05)
        tube(mb, [(-L / 2 - 0.1, y, 0.86), (-L / 2 - 0.06, y, H + 0.04)], 0.008, shade('#e8e0c8'), seg=3)
    # a coil of rope and a little bucket on the deck by the mast
    tube(mb, ring((1.5, 0.3, deck(1.5)[1] + 0.03), 0.12, axis='z', n=16), 0.022, shade('#e8dcc0'), seg=5)
    cyl(mb, 1.55, -0.32, deck(1.55)[1], deck(1.55)[1] + 0.14, 0.07, 0.09, color=shade('#3a8ad8'), seg=12)
    return [(mb, 'main'), (sail, 'sail'), (glass, 'glass')]


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


# ---------------------------------------------------------------- sea creatures: bodies lofted along their length
def spline(pts, t):
    """a smooth value through control points [(t, value), ...] in order of t (Hermite through each, flat past the ends)"""
    if t <= pts[0][0]:
        return pts[0][1]
    if t >= pts[-1][0]:
        return pts[-1][1]
    i = max(k for k in range(len(pts) - 1) if pts[k][0] <= t)
    (t0, p1), (t1, p2) = pts[i], pts[i + 1]

    def slope(k):
        a, b = pts[max(0, k - 1)], pts[min(len(pts) - 1, k + 1)]
        return (b[1] - a[1]) / max(1e-6, b[0] - a[0])
    h, s = t1 - t0, (t - t0) / (t1 - t0)
    return (2 * s ** 3 - 3 * s ** 2 + 1) * p1 + (s ** 3 - 2 * s ** 2 + s) * h * slope(i) + (-2 * s ** 3 + 3 * s ** 2) * p2 + (s ** 3 - s ** 2) * h * slope(i + 1)


def weld(mb):
    """one point for every corner with the same place, normal and color (kit's ball and the rest add each triangle's
    own corners, and the GLB keeps every one of them)"""
    out, seen, remap = MB(), {}, []
    for p, n, c in zip(mb.v, mb.n, mb.c):
        k = (round(p.x, 5), round(p.y, 5), round(p.z, 5), round(n.x, 3), round(n.y, 3), round(n.z, 3), round(c.x, 3), round(c.y, 3), round(c.z, 3))
        if k not in seen:
            seen[k] = len(out.v)
            out.v.append(p); out.n.append(n); out.c.append(c)
        remap.append(seen[k])
    out.f = [tuple(remap[i] for i in f) for f in mb.f if len({remap[i] for i in f}) == 3]
    return out


def loft(mb, P, color, nu, vs):
    """a closed smooth body: P(u, v) -> point, u round it (0..1), v along it, a ring at each v in vs (the first and last
    are its two tips, each closed to a point); normals from the surface itself, all turned the way that faces out on
    the whole; color(p, n, u, v)"""
    e = 1e-3
    rings = vs[1:-1]
    pts, nrm, cols, faces, mids, raw = [], [], [], [], [], []
    for v in rings:
        ring = [P(i / nu, v) for i in range(nu)]
        mid = sum(ring, Vector()) / nu
        mids.append(mid)
        raw.append([(P(i / nu + e, v) - P(i / nu - e, v)).cross(P(i / nu, min(1.0, v + e)) - P(i / nu, max(0.0, v - e))) for i in range(nu)])
    # (which way is out, from the rings' own way round, the same all over: a dimple pressed in still faces out)
    sgn = 1.0 if sum(n.dot(P(i / nu, v) - mids[k]) for k, v in enumerate(rings) for i, n in enumerate(raw[k])) >= 0 else -1.0
    for k, v in enumerate(rings):
        for i in range(nu):
            u = i / nu
            p = P(u, v)
            n = raw[k][i] * sgn
            n = n.normalized() if n.length > 1e-12 else (p - mids[k]).normalized()
            pts.append(p); nrm.append(n); cols.append(color(p, n, u, v))
    R = len(rings)
    for r in range(R - 1):
        for i in range(nu):
            a, b = r * nu + i, r * nu + (i + 1) % nu
            faces += [(a, b, b + nu), (a, b + nu, a + nu)]
    for v, r in ((vs[0], 0), (vs[-1], R - 1)):
        tip = P(0.0, v)
        n = (tip - mids[r]).normalized()
        k = len(pts)
        pts.append(tip); nrm.append(n); cols.append(color(tip, n, 0.0, v))
        faces += [(k, r * nu + i, r * nu + (i + 1) % nu) for i in range(nu)]
    mb.add(pts, cols, nrm, faces)


def section(w, top, bot, phi, e_top=2.0, e_bot=2.0):
    """a point round a body's cross-section (half width w, top above and bot below its axis; phi 0 at the top), its
    upper and lower halves each a superellipse"""
    s, c = math.sin(phi), math.cos(phi)
    e = e_top if c >= 0 else e_bot
    return w * sgnp(s, 2 / e), (top if c >= 0 else bot) * sgnp(c, 2 / e)


def sgnp(c, k):
    return math.copysign(abs(c) ** k, c)


def cap_k(a, a0=0.05, a1=0.985):
    """how far a body's cross-section has grown at a (0..1 along it): rounding to its tips at both ends"""
    k = 1.0
    if a0 > 0 and a < a0:
        k *= math.sqrt(max(0.0, 1 - (1 - a / a0) ** 2))
    if a > a1:
        k *= math.sqrt(max(0.0, 1 - ((a - a1) / (1 - a1)) ** 2))
    return k


def on_body(P, a, phi, out=0.0):
    """a point on a lofted body's surface (a from its front tip, P's v being 1 - a; phi round from the top), pushed out
    along the surface's normal, and that normal"""
    v, u = 1 - a, phi / math.tau
    p = P(u, v)
    mid = sum((P(i / 12, v) for i in range(12)), Vector()) / 12
    n = (P(u + 1e-3, v) - P(u - 1e-3, v)).cross(P(u, v + 1e-3) - P(u, v - 1e-3)).normalized()
    if n.dot(p - mid) < 0:
        n = -n
    return p + n * out, n


def fin(mb, root, span, chord, L, c0, c1, t0, color, nu=8, n=7, sweep=0.0, droop=0.0, bumps=0, le=0.35):
    """a flipper or fin lofted from its root (buried in the body) out along span: chord the way its leading edge faces,
    c0 at the root narrowing to c1 at the tip, t0 thick; sweep bends it back (against chord) and droop down along its
    length; bumps: knobs along the leading edge (a humpback's)"""
    span, chord = Vector(span).normalized(), Vector(chord)
    chord = (chord - span * chord.dot(span)).normalized()
    thick = span.cross(chord).normalized()
    root = Vector(root)

    def P(u, v):
        th = u * math.tau
        c = (c0 + (c1 - c0) * v ** 0.8) * cap_k(v, 0.0, 0.8)
        b = (0.045 * abs(math.sin(v * math.pi * bumps)) * (1 - 0.6 * v) if bumps else 0.0)
        k = math.cos(th)
        along = (c * le + b) * k if k > 0 else c * (1 - le) * k
        t = t0 * (1 - 0.6 * v) * cap_k(v, 0.0, 0.8) * math.sin(th) * (0.55 + 0.45 * (1 - abs(k)) ** 0.5)
        return root + span * (v * L) + chord * (along - sweep * v * v) + thick * t - Vector((0, 0, droop * v * v))
    vs = [0.0] + [0.04 + 0.96 * (k / (n - 1)) ** 0.9 for k in range(n)][:-1] + [1.0]
    loft(mb, P, color, nu, vs)


def sea_dolphin():
    """A bottlenose dolphin leaping (the game arcs it up out of the water and back in, its nose +x): a short beak under the
    round melon of its forehead, a streamlined body grey on top with a darker cape along the back and a pale belly, a
    curved dorsal fin, two small flippers, the flukes level, a dark eye and the line of its smile."""
    mb = MB()
    L0, L1 = -0.6, 0.64        # the tail's end to the beak's tip (the flukes reach on to -0.74)
    TOP = [(0.0, 0.0), (0.03, 0.028), (0.07, 0.034), (0.1, 0.07), (0.14, 0.13), (0.2, 0.17), (0.3, 0.19), (0.42, 0.19), (0.56, 0.155),
           (0.72, 0.1), (0.88, 0.05), (1.0, 0.032)]
    BOT = [(0.0, 0.0), (0.03, 0.03), (0.07, 0.038), (0.12, 0.07), (0.2, 0.135), (0.32, 0.18), (0.44, 0.175), (0.58, 0.13), (0.72, 0.08),
           (0.88, 0.042), (1.0, 0.03)]
    W = [(0.0, 0.0), (0.03, 0.03), (0.07, 0.036), (0.11, 0.07), (0.18, 0.125), (0.28, 0.16), (0.4, 0.165), (0.54, 0.13), (0.7, 0.078),
         (0.88, 0.035), (1.0, 0.022)]
    ZC = [(0.0, -0.045), (0.08, -0.04), (0.3, 0.0), (1.0, 0.0)]
    grey, cape, pale = rgb('#6c869c'), rgb('#4a6076'), rgb('#eef2f4')

    def P(u, v):
        a = 1 - v                                  # (0 at the beak's tip)
        k = cap_k(a, 0.03, 0.97)
        y, z = section(spline(W, a) * k, spline(TOP, a) * k, spline(BOT, a) * k, u * math.tau, 2.0, 2.0)
        return Vector((L0 + (L1 - L0) * v, y, z + spline(ZC, a)))

    def col(p, n, u, v):
        a = 1 - v
        phi = (u * math.tau + math.pi) % math.tau - math.pi
        c = grey.lerp(cape, max(0.0, min(1.0, (0.5 - abs(phi)) / 0.35)) * max(0.0, min(1.0, (a - 0.16) / 0.1)) * max(0.0, min(1.0, (0.9 - a) / 0.2)))
        # (the pale belly sweeps up the flank, the smile a dark line where the beak's jaws meet)
        belly = max(0.0, min(1.0, (abs(phi) - 1.75 + 0.3 * math.sin(a * 7)) / 0.3))
        c = c.lerp(pale, belly)
        return c * (0.84 + 0.24 * max(0.0, n.dot(LIGHT)))
    vs = [0.0, 0.03, 0.08, 0.14, 0.22, 0.32, 0.42, 0.52, 0.62, 0.7, 0.77, 0.83, 0.87, 0.9, 0.925, 0.95, 0.975, 1.0]
    loft(mb, P, col, 16, vs)
    fl = lambda p, n, *_: grey.lerp(cape, 0.5) * (0.84 + 0.24 * max(0.0, n.dot(LIGHT)))
    # the dorsal fin, curving back, a flipper each side angled down and back
    fin(mb, (-0.02, 0, 0.13), (-0.25, 0, 1), (1, 0, 0), 0.2, 0.22, 0.02, 0.03, fl, nu=6, n=5, sweep=0.14)
    for s in (-1, 1):
        fin(mb, (0.24, s * 0.09, -0.08), (-0.35, s * 1, -0.75), (1, 0, 0), 0.14, 0.08, 0.016, 0.022, fl, nu=6, n=4, sweep=0.05)
    # the flukes, level, a notch between them
    for s in (-1, 1):
        fin(mb, (-0.56, s * 0.0, 0.0), (-0.45, s * 1, 0.0), (1, 0, 0), 0.2, 0.13, 0.025, 0.022, fl, nu=6, n=5, sweep=0.06)
    dark = shade('#1e2430')
    for s in (-1, 1):
        ball(mb, on_body(P, 0.155, s * 1.25, -0.004)[0], 0.018, dark, sub=1)
        # (the smile: where the beak's jaws meet, curling up a little at its corner)
        tube(mb, [on_body(P, a, s * phi, 0.003)[0] for a, phi in ((0.02, 1.62), (0.06, 1.66), (0.1, 1.6), (0.125, 1.45))], 0.007, dark, seg=3)
    return [(weld(mb), 'main')]


def sea_whale():
    """A humpback's back far out at sea (only the top breaks the water): long and slate-blue, the broad flat head at +x
    knobbly with tubercles, the mouth's line arching back to the eye, the blowhole at x 0.5 (the game's spout rises over
    it), a little dorsal fin on its hump toward the tail, under the water the pale grooved throat and the long white
    flippers. The game raises it out of the water (its middle at z 0) and tips it nose down to dive; sea_whale_tail is the
    tail it lifts as it goes."""
    mb = MB()
    TOP = [(0.0, 0.05), (0.05, 0.12), (0.13, 0.22), (0.22, 0.33), (0.32, 0.43), (0.44, 0.47), (0.56, 0.44), (0.64, 0.4), (0.72, 0.33),
           (0.8, 0.24), (0.9, 0.13), (1.0, 0.07)]
    BOT = [(0.0, 0.04), (0.05, 0.16), (0.13, 0.3), (0.22, 0.41), (0.34, 0.48), (0.46, 0.46), (0.58, 0.38), (0.7, 0.27), (0.8, 0.18),
           (0.9, 0.11), (1.0, 0.06)]
    W = [(0.0, 0.05), (0.05, 0.15), (0.13, 0.25), (0.22, 0.32), (0.34, 0.365), (0.46, 0.36), (0.58, 0.3), (0.7, 0.21), (0.8, 0.13),
         (0.9, 0.07), (1.0, 0.04)]
    ZC = [(0.0, 0.04), (0.2, 0.0), (1.0, 0.0)]
    X0, X1 = -1.6, 1.5
    slate, mott, pale, groove = rgb('#3c4a5c'), rgb('#56667a'), rgb('#e6ecef'), rgb('#6e7c8a')

    def frame(a):
        k = cap_k(a, 0.045, 0.9)
        return spline(W, a) * k, spline(TOP, a) * k, spline(BOT, a) * k

    def P(u, v):
        a = 1 - v
        w, t, b = frame(a)
        phi = u * math.tau
        y, z = section(w, t, b, phi, 2.0 + 0.7 * max(0.0, 1 - a / 0.3), 2.0 - 0.35 * max(0.0, (a - 0.75) / 0.25))
        # (the throat's grooves pressed in, every other point round the underside from the chin back to the middle)
        if math.cos(phi) < -0.3 and 0.03 < a < 0.52 and int(round(u * NU)) % 2:
            y, z = y * 0.975, z * 0.975
        return Vector((X0 + (X1 - X0) * v, y, z + spline(ZC, a)))
    NU = 20

    def col(p, n, u, v):
        a = 1 - v
        c = slate.lerp(mott, max(0.0, noise.noise(p * 4.0)) * 0.9)
        # (a few pale scars over the head, as humpbacks have)
        if a < 0.3 and noise.noise(p * 11.0 + Vector((2.0, 0, 0))) > 0.5:
            c = c.lerp(rgb('#b8c0c6'), 0.45)
        down = -math.cos(u * math.tau)
        if down > 0.25 and a < 0.55:
            # the pale throat with its dark grooves, softening toward the belly
            k = min(1.0, (down - 0.25) / 0.3) * min(1.0, (0.55 - a) / 0.12)
            g = groove if int(round(u * NU)) % 2 else pale
            c = c.lerp(g, k)
        elif down > 0.4:
            c = c.lerp(pale.lerp(slate, 0.45), min(1.0, (down - 0.4) / 0.3) * 0.7)
        return c * (0.84 + 0.26 * max(0.0, n.dot(LIGHT)))
    vs = [0.0, 0.04, 0.1, 0.17, 0.25, 0.33, 0.41, 0.49, 0.56, 0.62, 0.68, 0.73, 0.78, 0.83, 0.87, 0.91, 0.945, 0.975, 1.0]
    loft(mb, P, col, NU, vs)

    on = lambda a, phi, out=0.0: on_body(P, a, phi, out)
    dark = shade('#1f262f')
    # the mouth's line from the snout back, arching down to the eye; the eye just behind its end
    for s in (-1, 1):
        line = [on(a, s * (math.pi / 2 + 0.05 + 0.5 * (a / 0.27) ** 2), 0.004)[0] for a in (0.02, 0.06, 0.11, 0.16, 0.21, 0.25, 0.28)]
        tube(mb, line, 0.012, dark, seg=4, r1=0.008)
        e, _ = on(0.29, s * (math.pi / 2 + 0.25), 0.0)
        ball(mb, e, 0.03, dark, sub=1)
    # tubercles: knobs along the top of the head and down the jaw
    knob = lambda p, n: slate.lerp(mott, 0.5) * (0.84 + 0.26 * max(0.0, n.dot(LIGHT)))
    for a in (0.05, 0.12, 0.19):
        ball(mb, on(a, 0.0, -0.006)[0], 0.036, knob, sub=1)
    for s in (-1, 1):
        for a in (0.085, 0.16):
            ball(mb, on(a, s * 0.62, -0.006)[0], 0.032, knob, sub=1)
        for a in (0.08, 0.16):
            ball(mb, on(a, s * (math.pi / 2 + 0.55), -0.004)[0], 0.026, knob, sub=1)
        # (barnacles on the chin)
        ball(mb, on(0.05, s * 2.3, -0.004)[0], 0.03, shade('#c8ccc6'), sub=1)
    # the blowhole: two dark slits at x 0.5, where the game's spout rises
    for s in (-1, 1):
        ball(mb, on(0.323, s * 0.07, -0.004)[0], (0.04, 0.012, 0.01), dark, sub=1)
    # the long white flippers, knobbly along their leading edges, sweeping back and down under the water
    flip = lambda p, n, *_: rgb('#eef2f4').lerp(slate, 0.55 * max(0.0, n.z) * max(0.0, min(1.0, 1.2 - (abs(p.y) - 0.3) * 2.2))) * (0.86 + 0.2 * max(0.0, n.dot(LIGHT)))
    for s in (-1, 1):
        r, _ = on(0.36, s * (math.pi / 2 + 0.7), -0.05)
        fin(mb, r, (-0.75, s * 0.85, -0.5), (1, 0, 0.3), 0.95, 0.36, 0.17, 0.07, flip, nu=6, n=11, sweep=-0.08, droop=0.08, bumps=4, le=0.3)
    # the little dorsal fin on its hump
    r, _ = on(0.67, 0.0, -0.06)
    fin(mb, r, (-0.45, 0, 1), (1, 0, 0), 0.21, 0.46, 0.05, 0.07, lambda p, n, *_: slate * (0.84 + 0.26 * max(0.0, n.dot(LIGHT))), nu=6, n=5, sweep=0.1)
    return [(weld(mb), 'main')]


def sea_whale_tail():
    """A humpback's tail as it dives: the narrow stock rising out of the water and the broad flukes spread across it,
    their tips swept up, the trailing edge along the top ragged with a notch in the middle; toward the camera the white
    underside with its black margin and marks, the top dark slate. The origin is where the stock meets the water."""
    mb = MB()
    slate, white, black = rgb('#36424f'), rgb('#f0f3f2'), rgb('#232a33')

    def stock(u, v):
        # (narrow side to side as a whale's tail stock is, deep front to back, narrowing up to the flukes, then
        # broadening into them)
        z = -0.3 + 1.0 * v
        k = cap_k(v, 0.04, 0.92)
        w = spline([(0.0, 0.17), (0.3, 0.15), (0.6, 0.1), (0.8, 0.085), (0.9, 0.13), (1.0, 0.16)], v)
        d = spline([(0.0, 0.22), (0.3, 0.2), (0.6, 0.14), (0.8, 0.1), (0.9, 0.06), (1.0, 0.04)], v)
        x, y = section(w, d, d, u * math.tau, 1.7, 1.7)
        return Vector((x * k, y * k, z))
    loft(mb, stock, lambda p, n, *_: slate * (0.84 + 0.26 * max(0.0, n.dot(LIGHT))), 8, [0.0, 0.04, 0.3, 0.6, 0.78, 0.88, 0.94, 1.0])
    LE = [(0.0, 0.6), (0.2, 0.66), (0.45, 0.76), (0.7, 0.88), (0.9, 0.99), (1.0, 1.07)]
    TE = [(0.0, 0.915), (0.07, 0.975), (0.25, 1.02), (0.5, 1.04), (0.75, 1.06), (0.92, 1.08), (1.0, 1.07)]

    def P(u, v):
        s = v * 2 - 1
        q = abs(s)
        th = u * math.tau
        k = (1 - math.cos(th)) / 2                         # 0 at the leading edge, 1 at the trailing one
        zl, zt = spline(LE, q), spline(TE, q)
        z = zl + (zt - zl) * k
        if 0.1 < q < 0.9 and round(v * 12) % 2:
            z += 0.024 * k ** 3                            # (the ragged trailing edge)
        t = (0.03 * (1 - q) ** 0.6 + 0.007) * 2.6 * math.sqrt(k) * (1 - k) * (1 if math.sin(th) >= 0 else -1)
        return Vector((0.84 * s, t, z))

    def col(p, n, u, v):
        th = u * math.tau
        if math.sin(th) > 0.05:
            return slate * (0.84 + 0.26 * max(0.0, n.dot(LIGHT)))
        q, k = abs(v * 2 - 1), (1 - math.cos(th)) / 2
        edge = k > 0.85 or q > 0.84 or (k < 0.05 and q < 0.2)
        mark = (0.3 < k < 0.7 and 0.25 < q < 0.6 and round(v * 12) in (3, 4, 9)) or (k < 0.2 and 0.5 < q < 0.7)
        c = black if edge or mark else white
        return c * (0.88 + 0.16 * max(0.0, -n.y))
    loft(mb, P, col, 10, [0.0] + [0.04 + 0.92 * k / 12 for k in range(13)] + [1.0])
    return [(weld(mb), 'main')]


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



def sky_jet():
    """A passenger jet seen far off (David, 27 October: a real plane in the distance, not a toy): white with a blue stripe
    and tail, swept wings, two engines, a row of windows. Its nose is +x, about one and a half units long; the game
    flies it high in the haze with its contrails."""
    mb, dark = MB(), MB()
    white, blue, grey = col_fn('#f4f4f0', under=0.18), col_fn('#3a64c0', under=0.1), col_fn('#c8ccd2', under=0.12)
    m = len(mb.v)
    lathe(mb, [(0.0, -0.78), (0.03, -0.74), (0.06, -0.62), (0.085, -0.4), (0.09, 0.0), (0.09, 0.42), (0.08, 0.58), (0.055, 0.68), (0.0, 0.74)],
          lambda p, n, *_: rgb('#3a64c0') if abs(p.z + 0.012) < 0.012 and p.x < 0.6 else rgb('#f4f4f0') * (0.84 + 0.16 * max(0.0, n.z)), seg=16, cap_top=False, cap_bot=False)
    xform(mb, m, Euler((0, math.pi / 2, 0)).to_matrix().to_4x4())
    # the tail cone sweeps up a little
    for i in range(len(mb.v) - m):
        v = mb.v[m + i]
        if v.x < -0.4:
            v.z += (-0.4 - v.x) * 0.12
    # swept wings and the tailplanes
    for s in (-1, 1):
        slab(mb, [(0.18, 0.0), (0.02, 0.0), (-0.24, 0.76 * s), (-0.12, 0.76 * s)], 0.022, grey, axis='z', at=-0.03)
        slab(mb, [(-0.56, 0.0), (-0.66, 0.0), (-0.8, 0.28 * s), (-0.73, 0.28 * s)], 0.016, grey, axis='z', at=0.02)
        # an engine under each wing, its dark intake to the front
        m = len(mb.v)
        cyl(mb, 0, 0, 0, 0.2, 0.042, 0.038, color=col_fn('#dfe2e8', under=0.1), seg=12)
        xform(mb, m, Matrix.Translation((0.12, 0.3 * s, -0.08)) @ Euler((0, -math.pi / 2, 0)).to_matrix().to_4x4())
        m = len(dark.v)
        lathe(dark, [(0.0, 0.0), (0.032, 0.0)], shade('#2a2e38'), seg=12, cap_top=False)
        xform(dark, m, Matrix.Translation((0.121, 0.3 * s, -0.08)) @ Euler((0, -math.pi / 2, 0)).to_matrix().to_4x4())
    # the fin
    slab(mb, [(-0.5, 0.0), (-0.72, 0.0), (-0.82, 0.32), (-0.7, 0.32)], 0.014, blue, axis='y', at=-0.007)
    # windows and the cockpit
    for k in range(16):
        x = 0.44 - k * 0.06
        for s in (-1, 1):
            ball(dark, (x, 0.088 * s, 0.03), (0.012, 0.004, 0.009), shade('#2a3448'), sub=1)
    for s in (-1, 1):
        ball(dark, (0.62, 0.05 * s, 0.045), (0.03, 0.012, 0.014), shade('#2a3448'), sub=1)
    return [(mb, 'main'), (dark, 'gloss')]

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
    elif kind == 'pumpkin':
        # a sprawling vine: big round leaves low on the soil and the pumpkin sitting among them
        for k in range(5):
            a = k / 5 * math.tau + 0.3
            d = Vector((math.cos(a), math.sin(a), 0))
            tube(mb, [d * 0.02 + Vector((0, 0, 0.04)), d * 0.08 + Vector((0, 0, 0.07)), d * 0.13 + Vector((0, 0, 0.08))], 0.008, shade('#5a8a2a'), seg=5)
            ball(mb, d * 0.14 + Vector((0, 0, 0.09)), (0.06, 0.06, 0.012), col_fn('#3e8a34', mottle=0.2), sub=2)
        rib = lambda p, n: rgb('#f28a2a').lerp(rgb('#c8601a'), 0.6 * (0.5 + 0.5 * math.cos(math.atan2(p.y + 0.02, p.x - 0.01) * 8)) ** 6) * (0.84 + 0.16 * max(0.0, n.z))
        ball(shine, (0.01, -0.02, 0.1), (0.09, 0.09, 0.065), rib, sub=3)
        tube(mb, [(0.01, -0.02, 0.16), (0.016, -0.02, 0.19), (0.03, -0.016, 0.2)], 0.01, shade('#5a7a2a'), seg=6, r1=0.007)
    elif kind == 'corn':
        # a tall stalk with long leaves arching out and two cobs in their husks
        stalk(mb, (0, 0, 0), 0.56, 0.02, '#5aa040')
        for k, z in enumerate((0.1, 0.2, 0.3, 0.4, 0.48)):
            a = k * 2.4
            d = Vector((math.cos(a), math.sin(a), 0))
            tube(mb, [Vector((0, 0, z)), d * 0.1 + Vector((0, 0, z + 0.06)), d * 0.2 + Vector((0, 0, z + 0.02)), d * 0.26 + Vector((0, 0, z - 0.06))], 0.016, lambda p, n: rgb('#4a9a3a').lerp(rgb('#7ac04a'), 0.5 + 0.5 * n.z), seg=4, r1=0.004)
        for k, (a, z) in enumerate(((0.6, 0.26), (3.6, 0.34))):
            d = Vector((math.cos(a), math.sin(a), 0))
            tube(shine, [d * 0.02 + Vector((0, 0, z)), d * 0.05 + Vector((0, 0, z + 0.08))], 0.024, shade('#f6d040'), seg=8, r1=0.014)
            tube(mb, [d * 0.015 + Vector((0, 0, z - 0.01)), d * 0.04 + Vector((0, 0, z + 0.05))], 0.028, shade('#8ac860'), seg=8, r1=0.012)
            tube(mb, [d * 0.05 + Vector((0, 0, z + 0.08)), d * 0.07 + Vector((0, 0, z + 0.11))], 0.006, shade('#c8a060'), seg=4)
        ball(mb, (0, 0, 0.58), (0.02, 0.02, 0.04), shade('#d8c070'), sub=1)
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


VEG = ['bokchoy', 'chili', 'cucumber', 'carrot', 'broccoli', 'eggplant', 'thaibasil', 'greenonion', 'tomato', 'edamame', 'pumpkin', 'corn']

THINGS = {
    'item_vbball': vbball, 'plot_seed': plot_seed, 'plot_sprout': plot_sprout,
    **{f'veg_{k}': (lambda k=k: veg(k)) for k in VEG},
    'item_shell_clam': shell_clam, 'item_shell_scallop': shell_scallop, 'item_shell_turban': shell_turban, 'item_shell_cowrie': shell_cowrie,
    'item_shell_coral': shell_coral, 'item_shell_conch': shell_conch, 'item_shell_seaglass': shell_seaglass, 'item_shell_pearl': shell_pearl,
    'item_shell_star': shell_star, 'item_shell_bottle': shell_bottle,
    **{f'item_gem_{k}': (lambda c=c, k=k: [(gem_cluster(*c) if k in ('quartz', 'amethyst') else gem_cut(*c), 'gloss')]) for k, c in GEMS.items()},
    'sea_sail': lambda: sailboat(), 'sea_sailb': lambda: sailboat(('#e8443a', '#7a2a24'), '#fff0d8', '#f6f0e4'),
    'sea_fish': sea_fish, 'sea_ferry': sea_ferry, 'sea_dolphin': sea_dolphin, 'sea_whale': sea_whale, 'sea_whale_tail': sea_whale_tail,
    'boat_home': boat_home,
    'sky_plane': sky_plane, 'sky_jet': sky_jet, 'sky_balloon': sky_balloon,
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
