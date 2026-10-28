"""What Sarah can carry, lying on the ground, as miniatures in the dollhouse look (small_things.py has the shells, the gems
and what grows in the plots). Each is item_<picture>, the name of the item's picture in the game:

- stand-ins by kind, as Animal Crossing has them: the leaf that stands for a piece of furniture, a wallpaper, a floor or
  an accessory (item_leaf), a folded shirt for clothes (item_shirt: shaded in greys, its 'top' and 'trim' parts painted
  in the outfit's own colors by the game), a fish (item_fish, its 'top' and 'trim' painted in the fish's color), a
  squid, a lobster, the old boot, a seed packet, a sack of rice or flour (item_sack), a covered dish (item_dish), the
  vegetables picked (item_veg_<id>);
- the things themselves: wood, a sapling, a present, a party invite, a package, the money bags, the painted eggs, the
  marshmallows, the tools, the keepsakes, the quest things, and everything the neighbors lose (item_ic_lost_<kind>).

Colors are in the mesh (no baking), a little darker underneath; glossy parts are named *_gloss, glass *_clear.
Units are tiles, z up, -y the front (toward the camera), each a hand's size: about a quarter of a tile across.

    python tools/blender/pocket_things.py [--preview DIR] [--only NAME]
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from mathutils import Vector, Matrix, Euler, noise
from common import *
from trees_ac import MB, vmat, rgb, LIGHT
from kit import col_fn, shade, rbox, lathe, cyl, ball, tube, slab, xform
from small_things import facet, lit, fan, leafy, grid, loft, cap_k, weld


def turn(mb, mark, rx=0.0, ry=0.0, rz=0.0, t=(0, 0, 0)):
    """turn what was added since mark about the origin, then move it to t"""
    xform(mb, mark, Matrix.Translation(t) @ Euler((rx, ry, rz)).to_matrix().to_4x4())


def ring(mb, c, R, r, color, seg=20, rot=(0.0, 0.0, 0.0)):
    """a ring (a torus) round c, lying flat (or turned by rot)"""
    pts = [Vector((math.cos(k / seg * math.tau) * R, math.sin(k / seg * math.tau) * R, 0)) for k in range(seg + 1)]
    m = len(mb.v)
    tube(mb, pts, r, color, seg=6)
    turn(mb, m, *rot, t=c)


def lying_lathe(mb, prof, color, seg=14, t=(0, 0, 0), rz=0.0, caps=(True, True), sx=1.0):
    """a turned shape (prof [(r, along)]) lying along x on the ground"""
    m = len(mb.v)
    lathe(mb, prof, color, seg=seg, cap_top=caps[1], cap_bot=caps[0], sx=sx)
    turn(mb, m, ry=math.pi / 2, rz=rz, t=t)


# ---------------------------------------------------------------- stand-ins by kind
def leaf_item():
    """the leaf that stands for a piece of furniture: broad, its edges and tip lifting off the ground, a pale vein down the
    middle with veins off it, the stem curled"""
    mb = MB()
    L, W, nu, nv = 0.3, 0.12, 14, 6
    for under in (False, True):
        P, C, N, F = [], [], [], []
        for i in range(nu + 1):
            u = i / nu
            w = max(0.004, W * math.sin(math.pi * min(1.0, u * 1.04) ** 0.75) * (1 - 0.18 * u))
            for j in range(nv * 2 + 1):
                v = j / nv - 1
                x, y = -L / 2 + u * L, v * w
                z = 0.014 + 0.04 * v * v + 0.035 * u * u
                dzdy = min(2.0, 0.08 * v / w)
                dzdx = 0.07 * u / L
                n = Vector((-dzdx, -dzdy, 1)).normalized()
                vein = math.exp(-(v * 7) ** 2)
                side = 1.0 if (u * 6 - abs(v) * 1.4) % 1.0 < 0.1 and abs(v) < 0.85 else 0.0
                col = rgb('#3a8a36').lerp(rgb('#78bc54'), 0.3 + 0.45 * u).lerp(rgb('#c4e692'), min(1.0, vein * 0.75 + side * 0.25))
                if under:
                    z -= 0.007
                    n = -n
                    col = rgb('#2e6a2a')
                P.append(Vector((x, y, z))); N.append(n); C.append(col * (0.86 + 0.22 * max(0.0, n.dot(LIGHT))))
        for i in range(nu):
            for j in range(nv * 2):
                a = i * (nv * 2 + 1) + j
                F += [(a, a + 1, a + nv * 2 + 2), (a, a + nv * 2 + 2, a + nv * 2 + 1)]
        mb.add(P, C, N, F)
    tube(mb, [(-L / 2 + 0.01, 0, 0.016), (-L / 2 - 0.03, 0.0, 0.022), (-L / 2 - 0.058, 0.012, 0.04), (-L / 2 - 0.05, 0.035, 0.056), (-L / 2 - 0.03, 0.03, 0.06)], 0.007, shade('#4e8a32'), seg=6, r1=0.004)
    return [(mb, 'main')]


def shirt():
    """a shirt folded square, the sleeves folded in down its sides, the collar and the buttons up its front; shaded in
    greys (top, trim) for the game to paint in the outfit's colors"""
    top, trim, mb = MB(), MB(), MB()
    rbox(top, -0.13, -0.11, 0.0, 0.13, 0.1, 0.045, col_fn('#f4f4f4', under=0.2), r=0.022)
    for s in (-1, 1):
        rbox(top, s * 0.088 - 0.034, -0.105, 0.036, s * 0.088 + 0.034, 0.07, 0.058, col_fn('#e8e8e8', under=0.0), r=0.014)
    # the collar: a band and two points lying over the top
    tube(trim, [(-0.05, 0.085, 0.05), (-0.025, 0.07, 0.056), (0.0, 0.066, 0.057), (0.025, 0.07, 0.056), (0.05, 0.085, 0.05)], 0.011, shade('#fafafa'), seg=6)
    for s in (-1, 1):
        facet(trim, [(0.0, 0.06, 0.06), (s * 0.06, 0.082, 0.058), (s * 0.05, 0.03, 0.06)], '#fafafa', gloss=0.05, out=(0, 0, 1))
    rbox(trim, -0.012, -0.105, 0.044, 0.012, 0.06, 0.05, shade('#f6f6f6'), r=0.004)
    for k in range(4):
        cyl(mb, 0, -0.08 + k * 0.042, 0.049, 0.054, 0.007, color=shade('#f2ead8'), seg=8)
    return [(top, 'top'), (trim, 'trim'), (mb, 'main')]


def fish():
    """a fish lying on its side: the back darker than the belly, a forked tail, a fin on its back, an eye; shaded light
    (top, trim) for the game to paint in the fish's own color"""
    body, fins, mb = MB(), MB(), MB()
    h = 0.032

    def fc(p, n):
        k = 0.5 + 0.5 * max(-1.0, min(1.0, p.y / 0.055))
        return rgb('#ffffff').lerp(rgb('#b8bcc4'), k ** 1.4) * (0.86 + 0.22 * max(0.0, n.dot(LIGHT)))
    m = len(body.v)
    lathe(body, [(0.012, -0.13), (0.026, -0.105), (0.048, -0.055), (0.058, 0.0), (0.052, 0.06), (0.034, 0.11), (0.0, 0.14)], lambda p, n: (0, 0, 0), seg=14, cap_bot=True, cap_top=False, sx=0.5)
    turn(body, m, ry=math.pi / 2, t=(0, 0, h))
    for i in range(m, len(body.v)):
        body.c[i] = fc(body.v[i], body.n[i])
    for tri in (((-0.122, 0, h), (-0.2, 0.075, h - 0.004), (-0.175, 0, h)), ((-0.122, 0, h), (-0.175, 0, h), (-0.2, -0.075, h - 0.004))):
        facet(fins, tri, '#e4e4e4', gloss=0.0, out=(0, 0, 1))
    facet(fins, [(-0.06, 0.05, h), (0.04, 0.054, h), (-0.03, 0.092, h + 0.004)], '#dadada', gloss=0.0, out=(0, 0, 1))
    facet(fins, [(-0.04, -0.048, h), (0.0, -0.052, h), (-0.03, -0.075, h - 0.002)], '#dadada', gloss=0.0, out=(0, 0, 1))
    facet(fins, [(0.06, 0.0, h + 0.03), (0.015, -0.022, h + 0.03), (0.02, 0.016, h + 0.031)], '#d0d0d0', gloss=0.0, out=(0, 0, 1))
    ball(mb, (0.098, 0.012, h + 0.022), (0.014, 0.014, 0.008), shade('#ffffff'), sub=1)
    ball(mb, (0.101, 0.012, h + 0.028), (0.008, 0.008, 0.005), shade('#1a1a22'), sub=1)
    return [(body, 'top'), (fins, 'trim'), (mb, 'main')]


def squid():
    """a squid (or an octopus) lying: a rounded hood, big eyes, the arms trailing; shaded light for the game to paint"""
    body, mb = MB(), MB()
    m = len(body.v)
    lathe(body, [(0.0, -0.02), (0.045, 0.0), (0.06, 0.05), (0.05, 0.1), (0.0, 0.14)], shade('#f2f2f2'), seg=12, cap_top=False, sx=0.6)
    turn(body, m, ry=-math.pi / 2, t=(0.02, 0, 0.034))
    for k in range(6):
        a = (k - 2.5) * 0.28
        tube(body, [(0.02, 0, 0.03), (0.07, math.sin(a) * 0.05, 0.02), (0.13, math.sin(a) * 0.09 + 0.01 * (k % 2), 0.012), (0.17, math.sin(a) * 0.1, 0.01)], 0.014, shade('#e8e8e8'), seg=6, r1=0.004)
    for s in (-1, 1):
        ball(mb, (0.03, s * 0.026, 0.055), 0.013, shade('#ffffff'), sub=1)
        ball(mb, (0.036, s * 0.028, 0.06), 0.007, shade('#1a1a22'), sub=1)
    return [(body, 'top'), (mb, 'main')]


def lobster():
    """a lobster, a crawfish or a shrimp: a curled tail in segments, two claws; shaded light for the game to paint"""
    body = MB()
    for k in range(5):
        x = -0.02 - k * 0.032
        rbox(body, x - 0.02, -0.035 + k * 0.004, 0.0, x + 0.016, 0.035 - k * 0.004, 0.05 - k * 0.006, col_fn('#f0f0f0', under=0.2), r=0.012)
    facet(body, [(-0.175, 0, 0.02), (-0.215, 0.04, 0.012), (-0.215, -0.04, 0.012)], '#e0e0e0', gloss=0.0, out=(0, 0, 1))
    ball(body, (0.04, 0, 0.032), (0.05, 0.036, 0.032), shade('#f4f4f4'), sub=2)
    for s in (-1, 1):
        tube(body, [(0.07, s * 0.02, 0.025), (0.1, s * 0.06, 0.02), (0.13, s * 0.07, 0.02)], 0.009, shade('#e8e8e8'), seg=6)
        ball(body, (0.155, s * 0.072, 0.022), (0.03, 0.018, 0.016), shade('#f4f4f4'), sub=2)
        tube(body, [(0.08, s * 0.01, 0.04), (0.16, s * 0.04, 0.05), (0.24, s * 0.03, 0.03)], 0.003, shade('#e0e0e0'), seg=3)
    return [(body, 'top')]


def boot():
    """the old boot fishing brings up: scuffed brown leather, the sole worn, a lace trailing"""
    mb = MB()
    leather = col_fn('#6a4a30', mottle=0.2)
    rbox(mb, -0.12, -0.05, 0.0, 0.1, 0.05, 0.05, leather, r=0.025)
    rbox(mb, -0.12, -0.048, 0.03, -0.03, 0.048, 0.17, leather, r=0.03)
    rbox(mb, -0.125, -0.052, -0.002, 0.105, 0.052, 0.014, shade('#3a2a20'), r=0.006)
    for k in range(3):
        tube(mb, [(-0.03, -0.045, 0.06 + k * 0.03), (-0.025, 0.0, 0.065 + k * 0.03), (-0.03, 0.045, 0.06 + k * 0.03)], 0.004, shade('#d8c8a8'), seg=4)
    tube(mb, [(-0.03, 0.04, 0.12), (0.02, 0.07, 0.03), (0.09, 0.09, 0.005)], 0.004, shade('#d8c8a8'), seg=4)
    return [(mb, 'main')]


def seedbag():
    """a paper seed packet: a sprout on the front, a red band at the top, its top edge crimped"""
    mb = MB()
    rbox(mb, -0.08, -0.11, 0.0, 0.08, 0.1, 0.018, col_fn('#f2e6c8', under=0.0), r=0.008)
    rbox(mb, -0.081, 0.055, 0.004, 0.081, 0.088, 0.021, shade('#c8503a'), r=0.004)
    rbox(mb, -0.078, 0.092, 0.005, 0.078, 0.112, 0.016, shade('#e0d2ae'), r=0.003)
    z = 0.0186
    facet(mb, [(-0.004, -0.08, z), (0.004, -0.08, z), (0.004, 0.0, z), (-0.004, 0.0, z)], '#4a8a34', gloss=0.0, out=(0, 0, 1))
    for s in (-1, 1):
        facet(mb, [(0.0, -0.01, z + 0.0004), (s * 0.05, 0.02, z + 0.0004), (s * 0.06, -0.03, z + 0.0004), (s * 0.02, -0.04, z + 0.0004)], '#6ab84a', gloss=0.0, out=(0, 0, 1))
    facet(mb, [(-0.05, -0.095, z), (0.05, -0.095, z), (0.04, -0.075, z), (-0.04, -0.075, z)], '#8a5a34', gloss=0.0, out=(0, 0, 1))
    return [(mb, 'main')]


def sack(c='#cfae7e', tie='#8a6a42'):
    """a little sack tied at the neck (rice, flour, sugar...)"""
    mb = MB()
    lathe(mb, [(0.07, 0.0), (0.105, 0.02), (0.115, 0.07), (0.095, 0.12), (0.045, 0.15), (0.034, 0.16), (0.05, 0.185), (0.03, 0.2), (0.0, 0.2)], col_fn(c, mottle=0.12, under=0.2), seg=14, cap_top=False)
    ring(mb, (0, 0, 0.158), 0.038, 0.008, shade(tie), seg=14)
    return [(mb, 'main')]


def money_bag():
    """a sack of sand dollars: cream canvas tied at the neck, a gold coin sewn on its front"""
    out = sack('#f0e2c2', '#b8863a')
    gold = MB()
    m = len(gold.v)
    cyl(gold, 0, 0, 0.0, 0.01, 0.042, color=shade('#f2c43a'), seg=18, round_=0.004)
    cyl(gold, 0, 0, 0.01, 0.013, 0.03, color=shade('#ffd85a'), seg=18)
    turn(gold, m, rx=math.pi / 2 + 0.18, t=(0, -0.104, 0.075))
    return out + [(gold, 'gloss')]


def dish():
    """a dish under a silver cover (any of the restaurant's dishes)"""
    mb, cover = MB(), MB()
    lathe(mb, [(0.0, 0.0), (0.1, 0.0), (0.13, 0.014), (0.136, 0.02), (0.12, 0.02), (0.0, 0.012)], shade('#fbf8f2'), seg=24, cap_top=True)
    lathe(cover, [(0.104, 0.016), (0.1, 0.045), (0.086, 0.075), (0.056, 0.098), (0.0, 0.108)], shade('#d8dce4'), seg=24, cap_top=False)
    ball(cover, (0, 0, 0.116), (0.015, 0.015, 0.012), shade('#c8ccd4'), sub=1)
    return [(mb, 'main'), (cover, 'gloss')]


def marshmallow(burnt=False):
    mb = MB()
    tube(mb, [(-0.17, 0.0, 0.012), (0.12, 0.0, 0.014)], 0.006, col_fn('#b08050', grain='x'), seg=6)
    c = '#2e2420' if burnt else '#e8b070'

    def fn(p, n):
        k = 0.5 + 0.5 * noise.noise(p * 40)
        base = rgb(c).lerp(rgb('#1e1814' if burnt else '#a8642e'), k * 0.6)
        if not burnt and n.z < -0.2:
            base = rgb('#fff6e8')
        return base * (0.86 + 0.22 * max(0.0, n.dot(LIGHT)))
    rbox(mb, 0.04, -0.035, 0.0, 0.135, 0.035, 0.064, fn, r=0.022)
    return [(mb, 'main')]


EGGS = [('#ffb4cc', '#ffffff', '#7cc8f0'), ('#8cc8f2', '#ffe070', '#ffffff'), ('#ffe27a', '#6cc070', '#ffffff'), ('#c8a8f2', '#ff8ab8', '#ffffff')]


def egg(k):
    """a painted egg for the egg hunt: bands and zigzags in its colors"""
    mb = MB()
    base, a, b = EGGS[k]

    def fn(p, n):
        z = p.z / 0.15
        ang = math.atan2(p.y, p.x)
        zig = 0.03 * math.sin(ang * 8)
        if abs(z - 0.5 - zig) < 0.06:
            c = a
        elif abs(z - 0.3) < 0.035 or abs(z - 0.7) < 0.035:
            c = b
        elif k % 2 and (int((ang + math.pi) * 4) + int(z * 9)) % 3 == 0 and abs(z - 0.5) > 0.12 and 0.1 < z < 0.9:
            c = b
        else:
            c = base
        return rgb(c) * (0.86 + 0.24 * max(0.0, n.dot(LIGHT)))
    prof = [(0.055 * math.sin(math.pi * t) ** 0.62 * (1.0 + 0.1 * (0.5 - t)), 0.15 * t) for t in [i / 12 for i in range(13)]]
    m = len(mb.v)
    lathe(mb, prof, fn, seg=16, cap_top=False)
    turn(mb, m, rx=0.25, t=(0, 0, 0.006))
    return [(mb, 'gloss')]


# ---------------------------------------------------------------- things themselves
def wood():
    """three logs, two below and one on top, their cut ends showing the rings"""
    mb = MB()

    def fn(p, n):
        if abs(n.z) > 0.9:
            r = math.hypot(p.x, p.y)
            return rgb('#ecc890') * (0.82 + 0.18 * math.cos(r * 170)) * (0.9 + 0.15 * max(0.0, n.dot(LIGHT)))
        return rgb('#8a5a34') * (0.8 + 0.25 * (0.5 + 0.5 * noise.noise(Vector((p.x * 30, p.y * 30, p.z * 4))))) * (0.86 + 0.22 * max(0.0, n.dot(LIGHT)))
    for (y, z, x) in ((-0.045, 0.04, 0.0), (0.045, 0.04, 0.01), (0.0, 0.112, -0.01)):
        m = len(mb.v)
        lathe(mb, [(0.04, -0.11), (0.042, 0.0), (0.04, 0.11)], fn, seg=12, cap_top=True, cap_bot=True)
        for i in range(m, len(mb.v)):
            mb.c[i] = fn(mb.v[i], mb.n[i])
        turn(mb, m, ry=math.pi / 2, t=(x, y, z))
    return [(mb, 'main')]


def sapling():
    """a sapling with its roots in a ball of burlap"""
    mb = MB()
    ball(mb, (0, 0, 0.045), (0.07, 0.07, 0.05), col_fn('#c8a070', mottle=0.2, under=0.2), sub=2)
    ring(mb, (0, 0, 0.085), 0.03, 0.006, shade('#8a6a42'), seg=10)
    tube(mb, [(0, 0, 0.08), (0.006, 0.0, 0.16), (0.0, 0.004, 0.25)], 0.009, col_fn('#7a5234', grain='z'), seg=6, r1=0.005)
    leafy(mb, (0, 0.004, 0.25), 6, 0.08, 0.03, 0.03, '#3e8a34', '#7ac050', seed=4, droop=0.2)
    leafy(mb, (0.006, 0.0, 0.19), 3, 0.06, 0.025, 0.02, '#3e8a34', '#7ac050', seed=9, droop=0.25)
    return [(mb, 'main')]


def present():
    """a present wrapped in red with a gold ribbon and a bow"""
    mb, rib = MB(), MB()
    rbox(mb, -0.09, -0.09, 0.0, 0.09, 0.09, 0.13, col_fn('#e4413a', under=0.15), r=0.01)
    rbox(mb, -0.096, -0.096, 0.11, 0.096, 0.096, 0.15, shade('#d4363a'), r=0.01)
    rbox(rib, -0.02, -0.1, -0.001, 0.02, 0.1, 0.153, shade('#f6c840'), r=0.006)
    rbox(rib, -0.1, -0.02, -0.001, 0.1, 0.02, 0.153, shade('#f6c840'), r=0.006)
    for s in (-1, 1):
        tube(rib, [(0, 0, 0.152), (s * 0.03, -0.01, 0.19), (s * 0.06, 0.0, 0.17), (s * 0.04, 0.012, 0.155), (0, 0, 0.152)], 0.01, shade('#ffd450'), seg=6)
    ball(rib, (0, 0, 0.158), 0.014, shade('#f6c840'), sub=1)
    return [(mb, 'main'), (rib, 'gloss')]


def invite():
    """the lost party invite: a cream envelope, its flap sealed with a red heart"""
    mb = MB()
    rbox(mb, -0.12, -0.08, 0.0, 0.12, 0.08, 0.012, col_fn('#fff4e0', under=0.0), r=0.004)
    facet(mb, [(-0.118, 0.078, 0.0125), (0.118, 0.078, 0.0125), (0.0, -0.012, 0.0125)], '#f2dfc2', gloss=0.0, out=(0, 0, 1))
    for s in (-1, 1):
        ball(mb, (s * 0.011, -0.004, 0.015), (0.015, 0.015, 0.005), shade('#d43a4a'), sub=1)
    facet(mb, [(-0.024, -0.002, 0.019), (0.024, -0.002, 0.019), (0.0, -0.03, 0.019)], '#d43a4a', gloss=0.0, out=(0, 0, 1))
    return [(mb, 'main')]


def package():
    """a cardboard parcel: tape across its top, an address label"""
    mb = MB()
    rbox(mb, -0.11, -0.08, 0.0, 0.11, 0.08, 0.13, col_fn('#c89a62', under=0.15), r=0.008)
    rbox(mb, -0.112, -0.016, 0.0, 0.112, 0.016, 0.133, shade('#e6d4aa'), r=0.003)
    rbox(mb, 0.025, -0.07, 0.126, 0.095, -0.025, 0.134, shade('#fbf8f0'), r=0.003)
    for k in range(3):
        rbox(mb, 0.035, -0.062 + k * 0.012, 0.133, 0.085 - k * 0.012, -0.058 + k * 0.012, 0.1345, shade('#6a6a7a'), r=0.0005)
    return [(mb, 'main')]


def tool(kind):
    """a tool lying in the grass: the axe, the shovel or the fishing rod"""
    mb, metal = MB(), MB()
    wood_c = col_fn('#b07a48', grain='x')
    if kind == 'axe':
        tube(mb, [(-0.17, 0.0, 0.014), (0.13, 0.0, 0.016)], 0.012, wood_c, seg=6)
        rbox(metal, 0.075, -0.075, 0.0, 0.125, 0.02, 0.032, shade('#a8acb4'), r=0.006)
        rbox(mb, 0.07, 0.0, 0.002, 0.13, 0.03, 0.03, shade('#c84a3a'), r=0.006)
    elif kind == 'shovel':
        tube(mb, [(-0.19, 0.0, 0.014), (0.06, 0.0, 0.014)], 0.011, wood_c, seg=6)
        rbox(mb, -0.21, -0.03, 0.006, -0.18, 0.03, 0.024, shade('#3a7ac8'), r=0.008)
        rbox(metal, 0.05, -0.05, 0.0, 0.18, 0.05, 0.014, shade('#a8acb4'), r=0.012)
    else:
        tube(mb, [(-0.2, 0.0, 0.012), (0.0, 0.0, 0.01), (0.22, 0.01, 0.006)], 0.008, wood_c, seg=6, r1=0.003)
        m = len(metal.v)
        cyl(metal, 0, 0, 0.0, 0.018, 0.022, color=shade('#c8ccd4'), seg=12)
        turn(metal, m, rx=math.pi / 2, t=(-0.12, 0.01, 0.024))
        tube(mb, [(-0.12, 0.0, 0.03), (0.0, 0.03, 0.004), (0.22, 0.04, 0.003)], 0.0015, shade('#f0f0f0'), seg=3)
    return [(mb, 'main'), (metal, 'gloss')]


# ---------------------------------------------------------------- keepsakes
def moonrock():
    mb = MB()
    ball(mb, (0, 0, 0.05), (0.08, 0.065, 0.055), col_fn('#a8a8b2', mottle=0.3, under=0.2), sub=2)
    for (x, y, r) in ((0.03, -0.02, 0.016), (-0.03, 0.01, 0.012), (0.0, 0.03, 0.01)):
        ball(mb, (x, y, 0.095), (r, r, 0.004), shade('#7a7a84'), sub=1)
    return [(mb, 'gloss')]


def pressedflower():
    mb = MB()
    rbox(mb, -0.08, -0.1, 0.0, 0.08, 0.1, 0.008, col_fn('#f6eedc', under=0.0), r=0.004)
    z = 0.0086
    facet(mb, [(-0.003, -0.08, z), (0.003, -0.08, z), (0.003, 0.02, z), (-0.003, 0.02, z)], '#5a8a3a', gloss=0.0, out=(0, 0, 1))
    for k in range(5):
        a = k / 5 * math.tau + 0.3
        c, s = math.cos(a), math.sin(a)
        facet(mb, [(0, 0.03, z + 0.0004), (c * 0.03 - s * 0.012, 0.03 + s * 0.03 + c * 0.012, z + 0.0004), (c * 0.045, 0.03 + s * 0.045, z + 0.0004), (c * 0.03 + s * 0.012, 0.03 + s * 0.03 - c * 0.012, z + 0.0004)], '#e888b0', gloss=0.0, out=(0, 0, 1))
    ball(mb, (0, 0.03, z + 0.002), (0.01, 0.01, 0.002), shade('#f6c840'), sub=1)
    return [(mb, 'main')]


def rubberduck():
    mb, beak = MB(), MB()
    ball(mb, (0, 0, 0.045), (0.08, 0.06, 0.045), shade('#ffd23a'), sub=2)
    ball(mb, (0.04, 0, 0.11), 0.038, shade('#ffd23a'), sub=2)
    ball(mb, (-0.07, 0, 0.07), (0.02, 0.02, 0.03), shade('#ffd23a'), sub=1)
    ball(beak, (0.08, 0, 0.1), (0.024, 0.022, 0.01), shade('#ff8a2a'), sub=1)
    for s in (-1, 1):
        ball(beak, (0.06, s * 0.022, 0.122), 0.007, shade('#1a1a22'), sub=1)
    return [(mb, 'gloss'), (beak, 'main')]


def compass():
    mb, face = MB(), MB()
    cyl(mb, 0, 0, 0.0, 0.026, 0.07, color=shade('#c8a04a'), seg=24, round_=0.008)
    ring(mb, (0, 0.078, 0.014), 0.014, 0.004, shade('#c8a04a'), seg=10, rot=(math.pi / 2, 0, 0))
    cyl(face, 0, 0, 0.02, 0.027, 0.058, color=shade('#f6eedc'), seg=24)
    facet(face, [(0, 0.05, 0.028), (0.008, 0, 0.028), (-0.008, 0, 0.028)], '#d43a3a', gloss=0.0, out=(0, 0, 1))
    facet(face, [(0, -0.05, 0.028), (-0.008, 0, 0.028), (0.008, 0, 0.028)], '#3a3a44', gloss=0.0, out=(0, 0, 1))
    return [(mb, 'gloss'), (face, 'main')]


def shipbottle():
    glass, mb = MB(), MB()
    lying_lathe(glass, [(0.0, -0.13), (0.055, -0.125), (0.06, -0.1), (0.06, 0.06), (0.045, 0.09), (0.022, 0.11), (0.02, 0.15)], '#d8f0f4', seg=14, t=(0, 0, 0.062), caps=(False, False))
    lying_lathe(mb, [(0.026, 0.14), (0.026, 0.18)], shade('#b08050'), seg=8, t=(0, 0, 0.062))
    rbox(mb, -0.07, -0.022, 0.025, 0.05, 0.022, 0.045, shade('#8a4a2a'), r=0.01)
    cyl(mb, -0.01, 0, 0.04, 0.1, 0.004, color=shade('#6a4a2a'), seg=5)
    facet(mb, [(-0.008, 0.002, 0.05), (-0.008, 0.002, 0.098), (0.04, 0.002, 0.052)], '#fbf8f0', gloss=0.0, out=(0, -1, 0))
    facet(mb, [(-0.008, 0.002, 0.05), (-0.008, 0.002, 0.098), (0.04, 0.002, 0.052)], '#fbf8f0', gloss=0.0, out=(0, 1, 0))
    return [(glass, 'clear'), (mb, 'main')]


def luckypenny():
    mb = MB()
    cyl(mb, 0, 0, 0.0, 0.012, 0.052, color=shade('#c8784a'), seg=24, round_=0.004)
    ring(mb, (0, 0, 0.012), 0.04, 0.003, shade('#e0905a'), seg=20)
    ball(mb, (0, 0.004, 0.013), (0.016, 0.02, 0.004), shade('#b0643a'), sub=1)
    return [(mb, 'gloss')]


def scroll(paper='#efe0b8', band='#c83a3a', open_map=False):
    """a rolled-up paper tied round the middle (or, open_map, half unrolled with its red X)"""
    mb = MB()
    if open_map:
        rbox(mb, -0.11, -0.09, 0.0, 0.07, 0.09, 0.006, col_fn(paper, mottle=0.12, under=0.0), r=0.003)
        lying_lathe(mb, [(0.026, -0.095), (0.028, 0.0), (0.026, 0.095)], col_fn(paper, mottle=0.1), seg=12, t=(0.09, 0, 0.026), rz=math.pi / 2)
        z = 0.0064
        for s in (-1, 1):
            facet(mb, [(-0.03 - 0.004, -0.02 * s - 0.004 * s, z), (0.01 + 0.004, 0.02 * s - 0.004 * s, z), (0.01 - 0.004, 0.02 * s + 0.004 * s, z), (-0.03 + 0.004, -0.02 * s + 0.004 * s, z)], '#c83a3a', gloss=0.0, out=(0, 0, 1))
        for k in range(5):
            ball(mb, (-0.09 + k * 0.014, -0.06 + k * 0.008, z), (0.004, 0.004, 0.001), shade('#7a5a3a'), sub=1)
    else:
        lying_lathe(mb, [(0.03, -0.12), (0.032, 0.0), (0.03, 0.12)], col_fn(paper, mottle=0.1), seg=12, t=(0, 0, 0.032), rz=0.4)
        ring(mb, (0, 0, 0.032), 0.034, 0.005, shade(band), seg=12, rot=(0, math.pi / 2, 0.4))
    return [(mb, 'main')]


def starcrystal():
    mb = MB()
    pts = []
    for k in range(10):
        a = k / 10 * math.tau + math.pi / 2
        r = 0.09 if k % 2 == 0 else 0.04
        pts.append((math.cos(a) * r, math.sin(a) * r))
    slab(mb, pts, 0.035, shade('#fff2a8'), axis='z', at=0.0)
    ball(mb, (0, 0, 0.036), (0.035, 0.035, 0.012), shade('#fffbe0'), sub=1)
    return [(mb, 'gloss')]


# ---------------------------------------------------------------- quest things
def tincan():
    mb = MB()

    def fn(p, n):
        c = '#d84a3a' if 0.03 < p.x + 0.06 < 0.09 and abs(n.x) < 0.9 else '#c8ccd4'
        return rgb(c) * (0.86 + 0.24 * max(0.0, n.dot(LIGHT)))
    m = len(mb.v)
    lying_lathe(mb, [(0.048, -0.06), (0.05, -0.055), (0.05, 0.055), (0.048, 0.06)], lambda p, n: (0, 0, 0), seg=16, t=(0, 0, 0.05))
    for i in range(m, len(mb.v)):
        mb.c[i] = fn(mb.v[i], mb.n[i])
    return [(mb, 'gloss')]


def hotsauce():
    glass, mb = MB(), MB()

    def fn(p, n):
        c = '#fbf4e4' if -0.03 < p.x < 0.03 and abs(n.x) < 0.9 else '#d4302a'
        return rgb(c) * (0.86 + 0.24 * max(0.0, n.dot(LIGHT)))
    m = len(glass.v)
    lying_lathe(glass, [(0.0, -0.09), (0.04, -0.088), (0.042, 0.04), (0.02, 0.07), (0.016, 0.1)], lambda p, n: (0, 0, 0), seg=14, t=(0, 0, 0.042), caps=(True, False))
    for i in range(m, len(glass.v)):
        glass.c[i] = fn(glass.v[i], glass.n[i])
    lying_lathe(mb, [(0.019, 0.095), (0.019, 0.13)], shade('#3a8a3a'), seg=10, t=(0, 0, 0.042))
    return [(glass, 'gloss'), (mb, 'main')]


def necklace():
    mb = MB()
    ring(mb, (0, 0, 0.006), 0.085, 0.0035, shade('#8a6a4a'), seg=28)
    for k in range(9):
        a = k / 9 * math.tau
        p = (math.cos(a) * 0.085, math.sin(a) * 0.085, 0.012)
        ball(mb, p, (0.016, 0.012, 0.011), shade(['#f6dcc8', '#ffb8a0', '#fbf4e8'][k % 3]), sub=1)
    return [(mb, 'main')]


def scarf():
    mb = MB()
    for k, (y, c) in enumerate(((-0.05, '#e88ab8'), (0.0, '#b48ae8'), (0.05, '#e88ab8'))):
        rbox(mb, -0.12 + k * 0.01, y - 0.03, k * 0.012, 0.11 - k * 0.012, y + 0.03, 0.014 + k * 0.012, col_fn(c, under=0.0), r=0.008)
    for k in range(6):
        tube(mb, [(0.105, -0.08 + k * 0.012, 0.006), (0.13, -0.08 + k * 0.012, 0.004)], 0.0025, shade('#e88ab8'), seg=3)
    return [(mb, 'main')]


def goatpic():
    mb = MB()
    rbox(mb, -0.09, -0.07, 0.0, 0.09, 0.07, 0.016, shade('#c8a04a'), r=0.006)
    rbox(mb, -0.075, -0.055, 0.012, 0.075, 0.055, 0.018, shade('#a8d4f0'), r=0.002)
    z = 0.0184
    facet(mb, [(-0.075, -0.055, z), (0.075, -0.055, z), (0.075, -0.01, z), (-0.075, -0.02, z)], '#6ab84a', gloss=0.0, out=(0, 0, 1))
    ball(mb, (0.0, -0.01, z), (0.025, 0.016, 0.002), shade('#fbf8f0'), sub=1)
    ball(mb, (0.024, 0.004, z + 0.0005), (0.01, 0.01, 0.002), shade('#fbf8f0'), sub=1)
    return [(mb, 'main')]


def bell():
    mb = MB()
    lathe(mb, [(0.068, 0.0), (0.064, 0.012), (0.05, 0.04), (0.042, 0.08), (0.036, 0.1), (0.0, 0.112)], shade('#f2c43a'), seg=18, cap_top=False)
    ring(mb, (0, 0, 0.122), 0.014, 0.004, shade('#e0b030'), seg=10, rot=(math.pi / 2, 0, 0))
    ball(mb, (0, 0, 0.006), 0.016, shade('#c8962a'), sub=1)
    return [(mb, 'gloss')]


def cog():
    mb, hub = MB(), MB()
    pts = []
    teeth = 10
    for k in range(teeth * 4):
        a = k / (teeth * 4) * math.tau
        r = 0.09 if (k % 4) in (1, 2) else 0.07
        pts.append((math.cos(a) * r, math.sin(a) * r))
    slab(mb, pts, 0.028, col_fn('#8a8a92', mottle=0.12), axis='z', at=0.0)
    cyl(hub, 0, 0, 0.026, 0.034, 0.03, color=shade('#5a5a62'), seg=14)
    cyl(hub, 0, 0, 0.03, 0.036, 0.012, color=shade('#2a2a30'), seg=10)
    return [(mb, 'gloss'), (hub, 'main')]


# ---------------------------------------------------------------- lost things
def wallet():
    mb = MB()
    rbox(mb, -0.1, -0.07, 0.0, 0.1, 0.07, 0.032, col_fn('#7a4a2a', under=0.2), r=0.012)
    rbox(mb, -0.1, -0.072, 0.02, 0.1, 0.0, 0.034, shade('#6a3e22'), r=0.01)
    ball(mb, (0.0, -0.06, 0.03), (0.012, 0.008, 0.008), shade('#d8b860'), sub=1)
    return [(mb, 'main')]


def keys():
    mb = MB()
    ring(mb, (0, 0, 0.006), 0.03, 0.004, shade('#c8ccd4'), seg=16)
    for k, (a, c) in enumerate(((-0.5, '#d8b860'), (0.6, '#c8ccd4'))):
        m = len(mb.v)
        cyl(mb, 0.0, 0.0, 0.0, 0.008, 0.022, color=shade(c), seg=12)
        rbox(mb, 0.018, -0.006, 0.0, 0.11, 0.006, 0.008, shade(c), r=0.002)
        for j in range(3):
            rbox(mb, 0.07 + j * 0.013, -0.016, 0.0, 0.078 + j * 0.013, -0.004, 0.008, shade(c), r=0.001)
        turn(mb, m, rz=a, t=(math.cos(a) * 0.045, math.sin(a) * 0.045, 0.0))
    return [(mb, 'gloss')]


def handheld():
    mb, scr = MB(), MB()
    rbox(mb, -0.11, -0.065, 0.0, 0.11, 0.065, 0.026, shade('#ee6a9a'), r=0.02)
    rbox(scr, -0.05, -0.04, 0.022, 0.05, 0.04, 0.028, shade('#2a3a44'), r=0.004)
    rbox(scr, -0.09, -0.006, 0.024, -0.064, 0.006, 0.03, shade('#3a3a44'), r=0.002)
    rbox(scr, -0.083, -0.013, 0.024, -0.071, 0.013, 0.03, shade('#3a3a44'), r=0.002)
    for (x, y) in ((0.072, 0.012), (0.088, -0.006)):
        cyl(scr, x, y, 0.022, 0.031, 0.008, color=shade('#f6c840'), seg=10)
    return [(mb, 'main'), (scr, 'gloss')]


def book(cover, page='#fbf6ea', strap=None):
    mb = MB()
    rbox(mb, -0.08, -0.105, 0.0, 0.08, 0.105, 0.012, shade(cover), r=0.006)
    rbox(mb, -0.074, -0.1, 0.01, 0.078, 0.1, 0.03, shade(page), r=0.004)
    rbox(mb, -0.08, -0.105, 0.028, 0.08, 0.105, 0.04, shade(cover), r=0.006)
    rbox(mb, -0.08, -0.105, 0.0, -0.066, 0.105, 0.04, shade(cover), r=0.008)
    if strap:
        rbox(mb, 0.06, -0.015, 0.0, 0.088, 0.015, 0.044, shade(strap), r=0.004)
    return [(mb, 'main')]


def glasses():
    mb = MB()
    for s in (-1, 1):
        ring(mb, (s * 0.042, 0, 0.032), 0.032, 0.005, shade('#3a2a24'), seg=18, rot=(math.pi / 2 - 0.2, 0, 0))
    tube(mb, [(-0.012, 0.004, 0.04), (0.0, 0.0, 0.045), (0.012, 0.004, 0.04)], 0.004, shade('#3a2a24'), seg=4)
    for s in (-1, 1):
        tube(mb, [(s * 0.074, 0.006, 0.032), (s * 0.07, 0.07, 0.006), (s * 0.03, 0.09, 0.006)], 0.004, shade('#3a2a24'), seg=4)
    return [(mb, 'main')]


def spoon():
    mb = MB()
    ball(mb, (0.08, 0, 0.012), (0.04, 0.028, 0.012), shade('#d8dce4'), sub=2)
    tube(mb, [(0.04, 0, 0.01), (-0.04, 0, 0.012), (-0.13, 0, 0.012)], 0.006, shade('#d8dce4'), seg=6, r1=0.01)
    return [(mb, 'gloss')]


def hammer():
    mb, metal = MB(), MB()
    tube(mb, [(-0.16, 0, 0.014), (0.09, 0, 0.014)], 0.012, col_fn('#c88a50', grain='x'), seg=6)
    rbox(metal, 0.07, -0.06, 0.0, 0.12, 0.05, 0.036, shade('#8a8e98'), r=0.01)
    return [(mb, 'main'), (metal, 'gloss')]


def sweatband():
    mb = MB()

    def fn(p, n):
        c = '#e8443a' if 0.016 < p.z < 0.026 else '#fbfbf6'
        return rgb(c) * (0.86 + 0.22 * max(0.0, n.dot(LIGHT)))
    m = len(mb.v)
    lathe(mb, [(0.05, 0.0), (0.066, 0.0), (0.068, 0.02), (0.066, 0.042), (0.05, 0.042), (0.048, 0.02), (0.05, 0.0)], lambda p, n: (0, 0, 0), seg=20, cap_top=False)
    for i in range(m, len(mb.v)):
        mb.c[i] = fn(mb.v[i], mb.n[i])
    return [(mb, 'main')]


def brush():
    mb, metal = MB(), MB()
    tube(mb, [(-0.16, 0, 0.012), (0.06, 0, 0.012)], 0.008, shade('#d84a3a'), seg=6, r1=0.01)
    tube(metal, [(0.06, 0, 0.012), (0.1, 0, 0.012)], 0.011, shade('#c8ccd4'), seg=6)
    tube(mb, [(0.1, 0, 0.012), (0.135, 0, 0.012), (0.155, 0, 0.012)], 0.011, shade('#e8a83a'), seg=6, r1=0.002)
    return [(mb, 'main'), (metal, 'gloss')]


def cap():
    mb = MB()
    lathe(mb, [(0.075, 0.0), (0.072, 0.03), (0.056, 0.06), (0.03, 0.078), (0.0, 0.082)], col_fn('#3a6ab8', under=0.15), seg=18, cap_top=False)
    slab(mb, [(-0.07, -0.05), (0.07, -0.05), (0.06, -0.11), (0.0, -0.13), (-0.06, -0.11)], 0.008, shade('#2e5a9a'), axis='z', at=0.002)
    ball(mb, (0, 0, 0.083), (0.01, 0.01, 0.005), shade('#2e5a9a'), sub=1)
    return [(mb, 'main')]


def recipe():
    mb = MB()
    rbox(mb, -0.1, -0.07, 0.0, 0.1, 0.07, 0.006, col_fn('#fbf8f0', under=0.0), r=0.003)
    rbox(mb, -0.1, 0.045, 0.004, 0.1, 0.055, 0.0068, shade('#e8443a'), r=0.001)
    for k in range(4):
        rbox(mb, -0.085, 0.02 - k * 0.018, 0.0055, 0.03 - (k % 2) * 0.03, 0.024 - k * 0.018, 0.0066, shade('#8a8a9a'), r=0.0005)
    ball(mb, (0.06, -0.02, 0.0065), (0.022, 0.022, 0.003), shade('#f0b050'), sub=1)
    return [(mb, 'main')]


def chopsticks():
    mb = MB()
    for s in (-1, 1):
        tube(mb, [(-0.14, s * 0.014, 0.008), (0.12, s * 0.006, 0.006)], 0.007, shade('#b8323a'), seg=6, r1=0.004)
        tube(mb, [(-0.15, s * 0.0145, 0.008), (-0.12, s * 0.0135, 0.008)], 0.0075, shade('#e8c050'), seg=6)
    return [(mb, 'gloss')]


# ---------------------------------------------------------------- vegetables picked
def cucumber_item():
    """a cucumber lying on its side: long, a little curved and fuller toward its flower end, both ends rounded, dark green
    with pale stripes running back from the flower end and rows of little pale bumps; a stub of stem"""
    mb, shine = MB(), MB()
    L, R, NU = 0.24, 0.03, 10
    dark, pale, wart = rgb('#2c6c28'), rgb('#86c060'), rgb('#c8e0a0')

    def P(u, v):
        x = -L / 2 + L * v
        r = R * (0.88 + 0.12 * math.sin(v * math.pi * 0.9 + 0.3)) * cap_k(v, 0.08, 0.9)
        th = u * math.tau
        i, k = round(u * NU), round((v - 0.08) / 0.14)
        r *= 1.1 if (i + 2 * k) % 4 == 1 and 0.12 < v < 0.88 else 1.0         # (the little bumps, here and there)
        bend = 0.012 * math.sin(v * math.pi)
        return Vector((x, math.cos(th) * r + bend, R + math.sin(th) * r * 0.94))

    def col(p, n, u, v):
        i, k = round(u * NU), round((v - 0.08) / 0.14)
        stripe = (i % 3 == 0) * max(0.0, (v - 0.4) / 0.6)
        c = dark.lerp(pale, 0.65 * stripe)
        if (i + 2 * k) % 4 == 1 and 0.12 < v < 0.88:
            c = c.lerp(wart, 0.18)                                    # (a bump, a touch paler)
        return c * (0.84 + 0.24 * max(0.0, n.dot(LIGHT)))
    loft(shine, P, col, NU, [0.0, 0.03] + [0.08 + 0.84 * k / 6 for k in range(7)] + [0.97, 1.0])
    # the stem's stub and the dried flower end
    tube(mb, [(-L / 2 + 0.004, 0.0, R), (-L / 2 - 0.016, 0.002, R + 0.004)], 0.006, shade('#4a7a2a'), seg=5, r1=0.0045)
    ball(mb, (L / 2 - 0.002, 0.0, R), 0.006, shade('#d8c870'), sub=1)
    return [(weld(mb), 'main'), (weld(shine), 'gloss')]


def pumpkin_item():
    """(Captain Shrimpy's far-island seeds) a squat pumpkin: ten plump lobes with deep creases between them running
    from the dimpled top to the dimpled bottom, orange, lighter on top, darker in the creases; a thick ridged stem
    curling over, with a leaf and a curly tendril"""
    mb, shine = MB(), MB()
    R, H, NL = 0.08, 0.105, 10
    orange, crease, top = rgb('#f08a28'), rgb('#b8521a'), rgb('#ffb04a')

    def lobe(th):
        return abs(math.cos(th * NL / 2)) ** 0.6

    def P(u, v):
        th = u * math.tau
        a = v * math.pi                               # (from the bottom's dimple round to the top's)
        k = 0.82 + 0.18 * lobe(th)
        rr = R * math.sin(a) ** 0.9 * k
        z = H / 2 - H / 2 * math.cos(a) * (0.9 + 0.1 * k)
        dimple = 0.018 * math.exp(-(a / 0.5) ** 2) - 0.022 * math.exp(-((math.pi - a) / 0.55) ** 2)
        return Vector((math.cos(th) * rr, math.sin(th) * rr, z + dimple + 0.002))

    def col(p, n, u, v):
        fade = min(1.0, math.sin(v * math.pi) * 2.2)          # (the creases fading out where they meet at top and bottom)
        c = orange.lerp(crease, (1 - lobe(u * math.tau)) ** 2.2 * 0.85 * fade).lerp(top, 0.3 * max(0.0, n.z) * (1 - abs(v - 0.7)))
        c = c * (0.95 + 0.06 * math.sin(u * math.tau * 40))        # (fine streaks down each lobe)
        return c * (0.84 + 0.24 * max(0.0, n.dot(LIGHT)))
    loft(shine, P, col, 56, [0.0, 0.04] + [0.1 + 0.8 * k / 11 for k in range(12)] + [0.96, 1.0])
    # the stem: thick, ridged, curling over at its end, dry and paler there
    zt = H - 0.016
    path = [Vector(p) for p in ((0, 0, zt), (0.002, 0, zt + 0.02), (0.008, 0.002, zt + 0.036), (0.02, 0.004, zt + 0.044), (0.03, 0.003, zt + 0.04))]

    def stem(u, v):
        n = len(path) - 1
        x = min(n - 1e-6, v * n)
        i, t = int(x), x - int(x)
        c = path[i].lerp(path[i + 1], t)
        d = (path[min(n, i + 1)] - path[i]).normalized()
        side = d.cross(Vector((0, 1, 0))).normalized()
        up = side.cross(d).normalized()
        th = u * math.tau
        r = (0.011 - 0.005 * v) * (1 + 0.14 * (round(u * 12) % 2)) * cap_k(v, 0.0, 0.88)
        return c + (side * math.cos(th) + up * math.sin(th)) * r
    loft(mb, stem, lambda p, n, u, v: rgb('#5a7028').lerp(rgb('#b0a060'), v ** 1.5) * (0.84 + 0.24 * max(0.0, n.dot(LIGHT))), 12,
         [0.0, 0.02, 0.2, 0.4, 0.6, 0.78, 0.92, 1.0])
    # a leaf lying over the shoulder, and a tendril curling off the stem
    leaf_c = lambda p, n, *_: rgb('#3e8a34').lerp(rgb('#6ab84a'), 0.5 + 0.5 * n.z) * (0.86 + 0.2 * max(0.0, n.dot(LIGHT)))

    def leaf(u, v):
        th = u * math.tau
        w = 0.024 * math.sin(math.pi * v ** 0.65) ** 0.8
        base = Vector((-0.004, -0.008, zt + 0.004))
        d = Vector((-0.62, -0.78, -0.1)).normalized()
        q = base + d * (0.05 * v) + Vector((0, 0, -0.016 * v * v))
        return q + Vector((-d.y, d.x, 0)) * (math.cos(th) * w) + Vector((0, 0, 1)) * (math.sin(th) * 0.003 + 0.004 * math.cos(th) ** 2)
    loft(mb, leaf, leaf_c, 8, [0.0, 0.1, 0.3, 0.5, 0.7, 0.88, 1.0])
    tendril = [Vector((0.006 + 0.004 * t * 12, -0.004 + math.sin(t * 15) * 0.009 * (1 - t * 0.5), zt + 0.022 + math.cos(t * 15) * 0.009 * (1 - t * 0.5))) for t in [k / 15 * 0.75 for k in range(16)]]
    tube(mb, tendril, 0.0022, shade('#6aa040'), seg=4, r1=0.0014)
    return [(weld(mb), 'main'), (weld(shine), 'gloss')]


def corn_item():
    """(Captain Shrimpy's far-island seeds) an ear of sweet corn lying on its side: the cob tapering to its rounded tip,
    covered in plump kernels packed in staggered rows (each a bright bump with darker between, the points round the
    cob's top half closer together, where they're seen), the husk leaves peeled back from its foot onto the ground"""
    mb = MB()
    L, R, NU = 0.2, 0.03, 15
    gold, mid, shadow = rgb('#ffdc48'), rgb('#e8b22a'), rgb('#b88014')
    x0 = -0.08
    vs = [0.0, 0.03] + [0.08 + 0.84 * k / 4 for k in range(5)] + [0.97, 1.0]
    ring_of = {round(v, 6): k for k, v in enumerate(vs)}

    def theta(u):
        # (twelve steps over the top half, three under it, lying on the ground)
        u = u % 1.0
        return u / 0.8 * math.pi if u < 0.8 else math.pi + (u - 0.8) / 0.2 * math.pi

    def kernel(i, k):
        q = i - (k - (k & 1)) // 2
        return (q - k) % 3

    def P(u, v):
        k = ring_of.get(round(v, 6), 0)
        if k % 2:
            u += 0.5 / NU                                         # (each ring half a kernel round from the last)
        x = x0 + L * v
        r = R * (1 - 0.42 * v ** 1.6) * cap_k(v, 0.05, 0.86)
        i = round((u - (0.5 / NU if k % 2 else 0.0)) * NU) % NU
        if kernel(i, k) == 0 and 0.06 < v < 0.95 and i < 13:
            r *= 1.08
        th = theta(u)
        return Vector((x, math.cos(th) * r, R + math.sin(th) * r))

    def col(p, n, u, v):
        k = ring_of.get(round(v, 6), 0)
        i = round(u * NU) % NU
        c = (gold, mid, shadow)[kernel(i, k)]
        if v < 0.06:
            c = rgb('#e8d8a0')                                    # (the cut end)
        return c * (0.84 + 0.24 * max(0.0, n.dot(LIGHT)))
    loft(mb, P, col, NU, vs)
    # the husk: two leaves peeled back from the foot, lying on the ground either side (seen only from above)
    for side in (-1, 1):
        d = Vector((-0.9, side * 0.42, 0.0)).normalized()
        sw = Vector((-d.y, d.x, 0))
        V, C_, N = [], [], []
        for j in range(4):
            t = j / 3
            q = Vector((x0 + 0.012, side * 0.01, R * 0.95)) + d * (0.1 * t)
            q.z = max(0.004, q.z - 0.03 * t ** 0.7)
            w = 0.022 * math.sin(math.pi * min(1.0, t * 1.1 + 0.08) ** 0.8) * (1 - 0.25 * t) + 0.001
            for e in (-1, 1):
                V.append(q + sw * (e * w) + Vector((0, 0, 0.003 * (1 - abs(e) * 0.5))))
                N.append((Vector((0, 0, 1)) + sw * (e * 0.35)).normalized())
                C_.append(rgb('#5aa84a').lerp(rgb('#b8d880'), 0.25 + 0.6 * t) * (0.86 + 0.2 * (e > 0)))
        F = []
        for j in range(3):
            a0 = j * 2
            F += [(a0, a0 + 1, a0 + 3), (a0, a0 + 3, a0 + 2)]
        mb.add(V, C_, N, F)
    return [(weld(mb), 'main')]


def veg_item(kind):
    mb, shine = MB(), MB()
    if kind == 'tomato':
        ball(shine, (0, 0, 0.05), (0.06, 0.06, 0.05), shade('#e8342a'), sub=2)
        leafy(mb, (0, 0, 0.098), 5, 0.035, 0.012, 0.0, '#3a7a2a', '#5aa040', seed=2, droop=0.2)
    elif kind == 'cucumber':
        return cucumber_item()
    elif kind in ('chili', 'eggplant'):
        c, r0, r1, L = {'chili': ('#e8302a', 0.022, 0.004, 0.2), 'eggplant': ('#5a2a6a', 0.03, 0.05, 0.2)}[kind]
        tube(shine, [(-L / 2, 0, r0), (0.0, 0.01, max(r0, r1) * 0.95), (L / 2, 0.03 if kind == 'chili' else 0.0, r1)], r0, shade(c), seg=10, r1=r1)
        ball(mb, (-L / 2, 0, r0), (0.02, r0 * 1.1, r0 * 1.1), shade('#3a7a2a'), sub=1)
        tube(mb, [(-L / 2, 0, r0), (-L / 2 - 0.03, 0, r0 + 0.01)], 0.005, shade('#3a7a2a'), seg=4)
    elif kind == 'carrot':
        tube(mb, [(0.13, 0, 0.006), (0.04, 0, 0.022), (-0.04, 0, 0.03)], 0.004, shade('#f08a2a'), seg=10, r1=0.03)
        for k in range(3):
            a = (k - 1) * 0.4
            tube(mb, [(-0.04, 0, 0.03), (-0.1, math.sin(a) * 0.04, 0.03), (-0.16, math.sin(a) * 0.07, 0.02)], 0.006, shade('#4a9a3a'), seg=4)
            ball(mb, (-0.16, math.sin(a) * 0.07, 0.02), (0.03, 0.02, 0.01), shade('#5aaa44'), sub=1)
    elif kind == 'broccoli':
        tube(mb, [(-0.12, 0, 0.025), (-0.02, 0, 0.03)], 0.022, shade('#8ac06a'), seg=8)
        for k in range(6):
            a = k / 6 * math.tau
            ball(mb, (0.03 + math.cos(a) * 0.022, math.sin(a) * 0.045, 0.04 + 0.01 * (k % 2)), 0.04, col_fn('#3a8a3a', mottle=0.25), sub=2)
    elif kind == 'thaibasil':
        tube(mb, [(-0.13, 0, 0.008), (0.1, 0.0, 0.008)], 0.005, shade('#6a4a6a'), seg=4)
        for k in range(4):
            leafy(mb, (-0.08 + k * 0.05, 0, 0.01), 2, 0.05, 0.02, 0.01, '#2e6a2e', '#5aa04a', seed=k, droop=0.1)
        ball(mb, (0.11, 0, 0.012), (0.03, 0.012, 0.012), shade('#9a5ab8'), sub=1)
    elif kind == 'greenonion':
        for k in range(4):
            y = (k - 1.5) * 0.016
            tube(mb, [(-0.14, y, 0.012), (-0.06, y, 0.012), (0.06, y * 1.5, 0.012), (0.16, y * 2.5, 0.008)], 0.01, lambda p, n: rgb('#f2f6e0').lerp(rgb('#4a9a3a'), max(0.0, min(1.0, (p.x + 0.08) / 0.1))), seg=6, r1=0.005)
    elif kind == 'bokchoy':
        for k in range(5):
            y = (k - 2) * 0.016
            tube(mb, [(-0.12, y * 0.5, 0.02), (-0.02, y, 0.024)], 0.016, shade('#e8f4d0'), seg=6, r1=0.012)
            ball(mb, (0.06, y * 2.2, 0.026), (0.08, 0.026, 0.016), shade('#3a8a34'), sub=2)
    elif kind == 'pumpkin':
        return pumpkin_item()
    elif kind == 'corn':
        return corn_item()
    else:  # edamame
        for k in range(3):
            m = len(shine.v)
            tube(shine, [(-0.07, 0, 0.014), (0.0, 0.01, 0.016), (0.07, 0, 0.014)], 0.014, shade('#7ac04a'), seg=8, r1=0.008)
            for j in range(3):
                ball(shine, (-0.04 + j * 0.04, 0.0, 0.022), (0.016, 0.012, 0.008), shade('#8ad05a'), sub=1)
            turn(shine, m, rz=(k - 1) * 0.5, t=(0, (k - 1) * 0.03, 0))
    return [(mb, 'main'), (shine, 'gloss')] if shine.v else [(mb, 'main')]


def lucky_shell():
    mb = MB()
    fan(mb, 0.2, 0.065, 14, '#e0a840', '#fff0a8', spread=1.15, ears=True, rib_k=0.16)
    return [(mb, 'gloss')]


VEG = ['bokchoy', 'chili', 'cucumber', 'carrot', 'broccoli', 'eggplant', 'thaibasil', 'greenonion', 'tomato', 'edamame', 'pumpkin', 'corn']
LOST = {'wallet': wallet, 'keys': keys, 'handheld': handheld, 'notebook': lambda: book('#4a7ab8'), 'diary': lambda: book('#c8508a', strap='#e8c050'),
        'glasses': glasses, 'spoon': spoon, 'hammer': hammer, 'sweatband': sweatband, 'hotsauce': hotsauce,
        'shell': lambda: lucky_shell(),
        'brush': brush, 'scarf': scarf, 'cap': cap, 'recipe': recipe, 'chopsticks': chopsticks}

def leaf_pile():
    """a heap of autumn leaves to sweep off the square (an island job: 6zi_jobs.js), a low mound of little leaves in
    orange, red, gold and brown, some lying loose round its foot"""
    mb, r = MB(), random.Random(11)
    LEAF = [(-0.036, 0.0), (-0.01, -0.02), (0.03, -0.008), (0.038, 0.0), (0.03, 0.008), (-0.01, 0.02)]

    def flat(c):
        # (one face up, a fan round its middle: seen from above, as everything on the ground is)
        col = rgb(c)
        pts = [(0, 0, 0.001)] + [(x, y, 0) for x, y in LEAF]
        mb.add(pts, [col * 1.06] + [col * 0.92] * len(LEAF), [(0, 0, 1)] * len(pts), [(0, 1 + i, 1 + (i + 1) % len(LEAF)) for i in range(len(LEAF))])
    cols = ['#d8843a', '#c8502e', '#e8b040', '#9a5a2a', '#e06a30']
    for k in range(70):
        a, d = r.random() * math.tau, r.random() ** 0.6
        x, y = math.cos(a) * d * 0.2, math.sin(a) * d * 0.15
        z = 0.012 + 0.07 * (1 - d * d) + r.random() * 0.01
        m = len(mb.v)
        flat(cols[k % len(cols)])
        turn(mb, m, (r.random() - 0.5) * 0.9, (r.random() - 0.5) * 0.9, r.random() * math.tau, (x, y, z))
    for k in range(7):
        a = r.random() * math.tau
        m = len(mb.v)
        flat(cols[k % len(cols)])
        turn(mb, m, 0, 0, r.random() * math.tau, (math.cos(a) * 0.27, math.sin(a) * 0.2, 0.006))
    return [(mb, 'main')]


THINGS = {
    'item_leaf': leaf_item, 'item_ic_leafpile': leaf_pile, 'item_shirt': shirt, 'item_fish': fish, 'item_squid': squid, 'item_lobster': lobster, 'item_fish_boot': boot,
    'item_seedbag': seedbag, 'item_sack': sack, 'item_dish': dish, 'item_money_bag': money_bag,
    'item_ic_marsh_toasted': marshmallow, 'item_ic_marsh_burnt': lambda: marshmallow(True),
    **{f'item_ev_egg_{k}': (lambda k=k: egg(k)) for k in range(4)},
    'item_ic_wood': wood, 'item_ic_sapling': sapling, 'item_ui_present': present, 'item_ui_invite': invite, 'item_ic_package': package,
    'item_tool_axe': lambda: tool('axe'), 'item_tool_shovel': lambda: tool('shovel'), 'item_tool_rod': lambda: tool('rod'),
    'item_ic_moonrock': moonrock, 'item_ic_pressedflower': pressedflower, 'item_ic_rubberduck': rubberduck, 'item_ic_compass': compass,
    'item_ic_shipbottle': shipbottle, 'item_ic_luckypenny': luckypenny, 'item_ic_oldmap': lambda: scroll(open_map=True), 'item_ic_starcrystal': starcrystal,
    'item_ic_q_note': scroll, 'item_ic_q_tincan': tincan, 'item_ic_q_hotsauce': hotsauce, 'item_ic_q_necklace': necklace, 'item_ic_q_scarf': scarf,
    'item_ic_q_goatpic': goatpic, 'item_ic_q_bell': bell, 'item_ic_q_cog': cog,
    **{f'item_ic_lost_{k}': f for k, f in LOST.items()},
    **{f'item_veg_{k}': (lambda k=k: veg_item(k)) for k in VEG},
}


def build(name):
    out = THINGS[name]()
    return [mb.obj(f'{name}_{part}', vmat(f'{name}_{part}', rough=0.35 if part in ('gloss', 'glass', 'clear') else 0.75)) for mb, part in out if mb.v]


if __name__ == '__main__':
    args = sys.argv[1:]
    prev = args[args.index('--preview') + 1] if '--preview' in args else None
    only = args[args.index('--only') + 1] if '--only' in args else None
    reset()
    shown = []
    for name in THINGS:
        if only and not name.startswith(only):
            continue
        objs = build(name)
        export(objs, name)
        shown.append(objs)
        print('built', name)
    if prev and shown:
        # (close up, a row of eight at a time from the game's camera)
        os.makedirs(prev, exist_ok=True)
        ground_plane(color='#7aa850')
        light_rig()
        cols, cell = 8, 0.42
        for k, objs in enumerate(shown):
            for o in objs:
                o.matrix_world = Matrix.Translation(((k % cols) * cell, (k // cols) * cell, 0)) @ o.matrix_world
        rows = (len(shown) + cols - 1) // cols
        for r in range(rows):
            for k, objs in enumerate(shown):
                for o in objs:
                    o.hide_render = k // cols != r
            camera(((cols - 1) * cell / 2, r * cell, 0.05), dist=2.4)
            render(os.path.join(prev, f'pocket_{r}.png'), size=(1600, 420), samples=32)
