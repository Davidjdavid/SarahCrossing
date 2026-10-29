"""Furniture, part twelve: chests that open and chests that lock (David, 29 October). The lighthouse keeper's sea chest
and the barn's old trunk standing open, their lids thrown back on the hinge, something left inside (once opened, a
chest stays open: lh_trunk_open, old_trunk_open), and the Bank's chests shut with a big iron padlock on the hasp
(bank_chest, bank_trunk)."""
import math
from mathutils import Vector, Matrix, noise
from trees_ac import rgb
from kit import col_fn, shade, rbox, lathe, tube, xform, cyl
from folks import ball, surf, superq
from furn_kit import *


def hollow(mb, x0, y0, z0, x1, y1, z1, color, inside, t=0.03):
    """An open box: a bottom and four walls t thick, the inside darker (a chest seen open from above)."""
    rbox(mb, x0, y0, z0, x1, y1, z0 + t, color, r=0.012, mid=1)
    rbox(mb, x0, y0, z0, x0 + t, y1, z1, color, r=0.012, mid=1)
    rbox(mb, x1 - t, y0, z0, x1, y1, z1, color, r=0.012, mid=1)
    rbox(mb, x0, y0, z0, x1, y0 + t, z1, color, r=0.012, mid=1)
    rbox(mb, x0, y1 - t, z0, x1, y1, z1, color, r=0.012, mid=1)
    rbox(mb, x0 + t, y0 + t, z0 + t, x1 - t, y1 - t, z0 + t + 0.004, inside, r=0.004, mid=0)


def hinged(mb, m, hy, hz, deg=-104.0):
    """Swing what was added since m back about the hinge (an axis along x at y hy, height hz): a lid thrown open."""
    xform(mb, m, Matrix.Translation((0, hy, hz)) @ Matrix.Rotation(math.radians(deg), 4, 'X') @ Matrix.Translation((0, -hy, -hz)))


def padlock(mb, x, y, z, s=1.0):
    """A big iron padlock hanging from a hasp at (x, y, z), its face toward the room (-y): a rounded body with a keyhole,
    the shackle a thick loop over it."""
    iron = metal('#3c3a40')
    rbox(mb, x - 0.045 * s, y - 0.03 * s, z - 0.1 * s, x + 0.045 * s, y + 0.0, z - 0.02 * s, iron, r=0.018 * s, mid=1)
    pts = [(x + 0.03 * s * math.cos(a), y - 0.015 * s, z - 0.025 * s + 0.045 * s * math.sin(a)) for a in [k / 10 * math.pi for k in range(11)]]
    tube(mb, pts, 0.009 * s, metal('#8a8a92'), seg=6)
    ball(mb, (x, y - 0.032 * s, z - 0.058 * s), (0.009 * s, 0.004 * s, 0.009 * s), shade('#14141a'), sub=1)
    rbox(mb, x - 0.003 * s, y - 0.034 * s, z - 0.08 * s, x + 0.003 * s, y - 0.03 * s, z - 0.058 * s, shade('#14141a'), r=0.002, mid=0)


# ---------------------------------------------------------------- the lighthouse keeper's sea chest
def sea_lid(mb):
    """the sea chest's domed lid and brass bands, shut (as lh_trunk in furn_c.py), its underside dark"""
    dome = superq(0, 0, 0.3, 0.28, 0.2, 0.12, 0.3, 1.0)
    surf(mb, lambda u, v: dome(u, 0.5 + v * 0.5), lambda p, n, u=0, v=0: wood('#8a5a34')(p, n), nu=24, nv=6, caps=(False, True))
    ball(mb, (0, 0, 0.301), (0.275, 0.195, 0.004), shade('#3a2414'), sub=2)
    brass = metal('#d8a840')
    for x in (-0.16, 0.16):
        pts = [(x, -0.205 * math.cos(a), 0.3 + 0.122 * math.sin(a)) for a in [k / 8 * math.pi for k in range(9)]]
        tube(mb, pts, 0.014, brass, seg=4)
    rbox(mb, -0.05, -0.215, 0.27, 0.05, -0.2, 0.32, brass, r=0.01, mid=0)


def sea_body(mb, open_):
    brass = metal('#d8a840')
    if open_:
        hollow(mb, -0.28, -0.2, 0.0, 0.28, 0.2, 0.3, wood('#7a5030'), shade('#2e1c10'), t=0.028)
    else:
        rbox(mb, -0.28, -0.2, 0.0, 0.28, 0.2, 0.3, wood('#7a5030'), r=0.02, mid=1)
    for x in (-0.16, 0.16):
        rbox(mb, x - 0.025, -0.21, 0.0, x + 0.025, 0.21, 0.31, brass, r=0.008, mid=0)
    rbox(mb, -0.05, -0.215, 0.2, 0.05, -0.2, 0.27, brass, r=0.01, mid=0)


@item('lh_trunk_open', 1, 1)
def lh_trunk_open(P):
    """The sea chest after Sarah opened it: the lid thrown back, inside a coil of rope, a lantern wick and the silk
    handkerchief the mustache was folded in."""
    mb = P.main
    sea_body(mb, True)
    m = len(mb.v)
    sea_lid(mb)
    hinged(mb, m, 0.2, 0.3)
    # what's left inside: a coil of rope, the handkerchief, a wick
    rope = col_fn('#c8a46a', mottle=0.08, under=0.1)
    for k in range(3):
        lathe(mb, [(0.085 - k * 0.012, 0.05 + k * 0.022), (0.1 - k * 0.012, 0.062 + k * 0.022), (0.085 - k * 0.012, 0.074 + k * 0.022)], rope, c=(-0.12, 0.04, 0), seg=16, cap_top=False)
    rbox(mb, 0.02, -0.12, 0.03, 0.22, 0.06, 0.06, fabric('#f4ecdc'), r=0.02, mid=1)
    rbox(mb, 0.08, -0.06, 0.06, 0.16, 0.02, 0.075, fabric('#e85a5a'), r=0.01, mid=0)
    tube(mb, [(-0.2, -0.13, 0.04), (-0.12, -0.15, 0.05), (-0.05, -0.12, 0.04)], 0.008, shade('#e8e0c8'), seg=5)


@item('bank_trunk', 1, 1)
def bank_trunk(P):
    """The Bank's sea chest, shut and padlocked."""
    mb = P.main
    sea_body(mb, False)
    sea_lid(mb)
    padlock(mb, 0, -0.22, 0.27, 1.1)


# ---------------------------------------------------------------- the barn's old trunk
def old_board():
    return lambda p, n, z0=0, z1=1: rgb('#5e5238') * (0.8 + 0.25 * (0.5 + 0.5 * noise.noise(Vector((p.x * 3, p.y * 3, p.z * 22))))) * (0.82 if abs(math.sin(p.z * 34)) < 0.12 else 1.0)


@item('old_trunk_open', 1, 1)
def old_trunk_open(P):
    """The barn's old trunk after Sarah opened it: the lid back on its hinge, inside the moth's sock and dust."""
    mb, board = P.main, old_board()
    iron = shade('#34302c')
    hollow(mb, -0.36, -0.25, 0.0, 0.36, 0.25, 0.4, board, shade('#2a2418'), t=0.035)
    for x in (-0.24, 0.24):
        rbox(mb, x - 0.03, -0.27, 0.0, x + 0.03, -0.24, 0.4, iron, r=0.008, mid=0)
    for s in (-1, 1):
        rbox(mb, s * 0.36 - 0.015, -0.26, 0.0, s * 0.36 + 0.015, 0.26, 0.05, iron, r=0.006, mid=0)
    rbox(mb, -0.05, -0.285, 0.33, 0.05, -0.25, 0.4, metal('#c8a040'), r=0.01, mid=0)
    m = len(mb.v)
    rbox(mb, -0.37, -0.26, 0.4, 0.37, 0.26, 0.56, board, r=0.07, mid=2)
    rbox(mb, -0.35, -0.24, 0.398, 0.35, 0.24, 0.402, shade('#2a2418'), r=0.004, mid=0)
    for x in (-0.24, 0.24):
        rbox(mb, x - 0.03, -0.27, 0.4, x + 0.03, -0.24, 0.55, iron, r=0.008, mid=0)
        rbox(mb, x - 0.03, -0.26, 0.545, x + 0.03, 0.26, 0.575, iron, r=0.008, mid=0)
    hinged(mb, m, 0.25, 0.4)
    # the very old sock
    tube(mb, [(-0.12, -0.08, 0.05), (0.02, -0.06, 0.06), (0.08, 0.02, 0.055)], 0.03, fabric('#c8b8a0'), seg=8, r1=0.035)
    ball(mb, (0.1, 0.05, 0.055), (0.045, 0.035, 0.025), fabric('#a89880'), sub=2)


# ---------------------------------------------------------------- the Bank's treasure chest
@item('bank_chest', 1, 1)
def bank_chest(P):
    """A treasure chest for the Bank's vault: Captain Gouda's chest's shape, iron-banded instead of gold, padlocked."""
    mb = P.main
    w, d, h = 0.6, 0.42, 0.34
    rbox(mb, -w / 2, -d / 2, 0.0, w / 2, d / 2, h, wood('#7a4a24'), r=0.02, mid=1)
    dome = superq(0, 0, h, w / 2, d / 2, 0.13, 0.25, 1.0)
    surf(mb, lambda u, v: dome(u, 0.5 + v * 0.5), lambda p, n, u=0, v=0: wood('#8a5428')(p, n), nu=24, nv=6, caps=(False, True))
    iron = metal('#4a4850')
    for x in (-w / 2 + 0.06, 0.0, w / 2 - 0.06):
        rbox(mb, x - 0.022, -d / 2 - 0.012, 0.0, x + 0.022, d / 2 + 0.012, h, iron, r=0.008, mid=0)
        tube(mb, [Vector((x, math.sin((i / 10 - 0.5) * math.pi) * (d / 2 + 0.012), h + math.cos((i / 10 - 0.5) * math.pi) * 0.142)) for i in range(11)], 0.018, iron, seg=5)
    rbox(mb, -w / 2 - 0.01, -d / 2 - 0.012, h - 0.03, w / 2 + 0.01, d / 2 + 0.012, h + 0.005, iron, r=0.008, mid=0)
    rbox(mb, -0.04, -d / 2 - 0.02, h - 0.06, 0.04, -d / 2, h + 0.04, metal('#c8a048'), r=0.01, mid=1)
    padlock(mb, 0, -d / 2 - 0.022, h - 0.04, 1.25)
