"""The island's props as miniatures, in the dollhouse look: painted wood with a grain, soft rounded edges, warm stone,
bright toy colors, every one a little darker underneath. One model per kind of prop on Sarah's island (scripts/island/
plan.mjs): the square's fountain, drinking fountain, notice board, plaque, trash cans and David's statue; signposts; the
farm's windmill (its sails a model of their own, to turn), well, scarecrow, hay, crate, wheelbarrow and trough; the
neighborhood's birdhouses and flamingos; the forest's logs, tents, campfire and picnic table; the lookout's telescope
and the harbor's coin viewer and tackle; the beach's driftwood, rocks, bonfire, ice cream stand, sandcastle and
volleyball net; Basil's noodle cart; barrels.

Colors are in the mesh (no baking). A part named *_glow (flames) is drawn unlit; *_water is water.

    python tools/blender/props_island.py [--preview DIR] [--only NAME]
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from mathutils import Vector, Matrix, Euler, noise
from common import *
from trees_ac import MB, vmat, rgb, bmesh_ico, anchor_empties
from kit import col_fn, shade, rbox, lathe, cyl, ball, tube, slab, plank_row, flame, rocks, xform, rot
import kit
kit.DETAIL['lite'] = True

WOOD = '#a8743e'
WOOD_D = '#7a5230'
WOOD_L = '#c8945a'
STONE = '#c4bcae'
CREAM = '#f2e8d2'
IRON = '#34343a'


def wood(c=WOOD, axis='z', seed=0):
    return col_fn(c, grain=axis, seed=seed)


def stone(c=STONE, seed=0):
    return col_fn(c, mottle=0.1, seed=seed)


def gable(mb, x0, x1, y0, y1, z, rise, color, over=0.06, t=0.05):
    """A gable roof over x0..x1 (its ridge along x) from the eaves at z up rise: two thick boards meeting at the ridge."""
    ym = (y1 - y0) / 2 + y0
    run = (y1 - y0) / 2 + over
    ang = math.atan2(rise, (y1 - y0) / 2)
    L = run / math.cos(ang)
    for s in (-1, 1):
        m = len(mb.v)
        rbox(mb, x0 - over, 0, -t / 2, x1 + over, L, t / 2, color, r=0.02)
        # local +y runs down the slope: toward +y world on one side, -y on the other
        th = -ang if s > 0 else math.pi + ang
        xform(mb, m, Matrix.Translation((0, ym, z + rise)) @ Euler((th, 0, 0)).to_matrix().to_4x4())


def checker(a, b, size):
    A, B = rgb(a), rgb(b)

    def f(p, n):
        return A if (int(math.floor(p.x / size)) + int(math.floor(p.y / size))) % 2 else B
    return f


def stripes(a, b, n, around=True):
    A, B = rgb(a), rgb(b)

    def f(p, nn):
        ang = math.atan2(p.y, p.x)
        return A if int((ang / math.tau + 0.5) * n) % 2 else B
    return f


# ---------------------------------------------------------------- the square
def fountain():
    mb, water = MB(), MB()
    lathe(mb, [(1.42, 0.0), (1.5, 0.05), (1.52, 0.38), (1.47, 0.48), (1.36, 0.5), (1.3, 0.44), (1.3, 0.3)], stone(), seg=40, cap_top=False)
    lathe(mb, [(1.3, 0.3), (0.3, 0.3)], stone('#b0a898'), seg=40, cap_top=False)
    lathe(mb, [(0.34, 0.3), (0.26, 0.4), (0.2, 0.8), (0.26, 0.92), (0.62, 1.02), (0.66, 1.12), (0.6, 1.16), (0.5, 1.1)], stone(), seg=28, cap_top=False)
    lathe(mb, [(0.16, 1.1), (0.12, 1.36), (0.18, 1.44), (0.1, 1.5)], stone('#d0c8ba'), seg=16)
    ball(mb, (0, 0, 1.56), 0.08, stone('#d0c8ba'))
    lathe(water, [(1.31, 0.4), (0.3, 0.4)], col_fn('#78c4e4'), seg=40, cap_top=False)
    lathe(water, [(0.51, 1.09), (0.0, 1.09)], col_fn('#8ad0ec'), seg=24, cap_top=False)
    # water falling from the top bowl in eight soft arcs
    for k in range(8):
        a = k / 8 * math.tau
        d = Vector((math.cos(a), math.sin(a), 0))
        pts = [d * (0.62 + 0.25 * t) + Vector((0, 0, 1.12 - 0.72 * t * t)) for t in (0, 0.2, 0.4, 0.6, 0.8, 1.0)]
        tube(water, pts, 0.035, col_fn('#a8e0f4'), seg=6, r1=0.02)
    return [(mb, 'stone'), (water, 'water')]


def drinkfountain():
    mb = MB()
    rbox(mb, -0.16, -0.16, 0, 0.16, 0.16, 0.08, stone('#b8b0a2'), r=0.02)
    lathe(mb, [(0.1, 0.08), (0.08, 0.7), (0.12, 0.74)], stone(), seg=16, cap_top=False)
    lathe(mb, [(0.12, 0.74), (0.22, 0.8), (0.24, 0.86), (0.2, 0.86), (0.12, 0.8)], col_fn('#9aa4aa'), seg=20, cap_top=True)
    tube(mb, [(0.0, 0.0, 0.84), (0.0, 0.0, 0.94), (0.05, 0.0, 0.98), (0.08, 0.0, 0.95)], 0.018, shade('#c8ccd0'), seg=6)
    ball(mb, (0.0, -0.13, 0.66), 0.03, shade('#4a78c8'))
    return [(mb, 'main')]


def board():
    """The notice board: a little roofed frame on two legs, papers pinned on cork."""
    mb = MB()
    for x in (-0.62, 0.62):
        rbox(mb, x - 0.05, -0.05, 0, x + 0.05, 0.05, 1.55, wood(WOOD_D), r=0.02)
    rbox(mb, -0.62, -0.06, 0.62, 0.62, 0.04, 1.4, wood(WOOD, 'x'), r=0.03)
    rbox(mb, -0.55, -0.075, 0.68, 0.55, -0.04, 1.34, col_fn('#c89a64', mottle=0.12), r=0.01)
    rng = random.Random(7)
    for k in range(6):
        x, z = rng.uniform(-0.42, 0.42), rng.uniform(0.78, 1.22)
        w, h = rng.uniform(0.12, 0.2), rng.uniform(0.12, 0.18)
        c = rng.choice(['#fff8e8', '#ffd8e0', '#d8f0ff', '#fff0a8', '#e0ffd8'])
        m = len(mb.v)
        rbox(mb, x - w / 2, -0.09, z - h / 2, x + w / 2, -0.078, z + h / 2, c, r=0.004)
        xform(mb, m, rot(y=rng.uniform(-0.15, 0.15), at=(x, 0, z)))
        ball(mb, (x, -0.095, z + h / 2 - 0.02), 0.014, shade(rng.choice(['#d8302a', '#3a78d8', '#f0c020'])), sub=1)
    gable(mb, -0.72, 0.72, -0.18, 0.12, 1.5, 0.16, wood('#9a4a32', 'x'))
    return [(mb, 'main')]


def plaque():
    mb = MB()
    m = len(mb.v)
    rbox(mb, -0.3, -0.08, 0, 0.3, 0.08, 0.42, stone('#a8a094'), r=0.04)
    xform(mb, m, rot(x=-0.2, at=(0, 0, 0)))
    m = len(mb.v)
    rbox(mb, -0.22, -0.11, 0.12, 0.22, -0.085, 0.36, col_fn('#c09040', mottle=0.06), r=0.01)
    xform(mb, m, rot(x=-0.2, at=(0, 0, 0)))
    return [(mb, 'main')]


def trashcan():
    mb = MB()
    lathe(mb, [(0.2, 0.0), (0.22, 0.05), (0.23, 0.6), (0.25, 0.62), (0.25, 0.66)], col_fn('#3f7a4a', under=0.3), seg=24, cap_top=False)
    for z in (0.18, 0.42):
        lathe(mb, [(0.235, z), (0.245, z + 0.01), (0.245, z + 0.04), (0.235, z + 0.05)], shade('#2e5a36'), seg=24, cap_top=False)
    lathe(mb, [(0.26, 0.66), (0.24, 0.72), (0.16, 0.78), (0.0, 0.8)], shade('#3f7a4a'), seg=24, cap_top=False)
    tube(mb, [(-0.06, 0, 0.79), (-0.05, 0, 0.84), (0.05, 0, 0.84), (0.06, 0, 0.79)], 0.014, shade(IRON), seg=6)
    return [(mb, 'main')]


def statue():
    """David's statue: him in bronze on a stone plinth, holding up a fish (as he'd want)."""
    mb = MB()
    rbox(mb, -0.5, -0.5, 0, 0.5, 0.5, 0.18, stone('#a8a094'), r=0.03)
    rbox(mb, -0.4, -0.4, 0.18, 0.4, 0.4, 0.8, stone('#c4bcae'), r=0.03)
    rbox(mb, -0.45, -0.45, 0.8, 0.45, 0.45, 0.9, stone('#b0a89a'), r=0.03)
    rbox(mb, -0.22, -0.415, 0.36, 0.22, -0.4, 0.58, col_fn('#c09040'), r=0.005)
    return [(mb, 'main')], 'statue_doll'


def sign(kind):
    """A signpost: a post, arrow boards pointing off in different directions, a cap."""
    mb = MB()
    rbox(mb, -0.05, -0.05, 0, 0.05, 0.05, 1.5, wood(WOOD_D), r=0.02)
    ball(mb, (0, 0, 1.53), 0.065, shade('#c84a3a'))
    cols = {'trail': ['#f2e2c0', '#e8d0a0'], 'farm': ['#f0d070', '#d8a048'], 'camp': ['#c8e0a8', '#e8d0a0'],
            'club': ['#f4b8d8', '#c8b0f0'], 'bonfire': ['#f4b070', '#f0d8a0'], 'island': ['#a8d8f0', '#f2e2c0']}[kind]
    for k, (z, ang, c) in enumerate(((1.22, 0.25, cols[0]), (0.92, -0.5, cols[1]))):
        outline = [(0.0, -0.09), (0.5, -0.09), (0.62, 0.0), (0.5, 0.09), (0.0, 0.09)]
        if k == 1:
            outline = [(-u, v) for u, v in outline[::-1]]
        m = len(mb.v)
        slab(mb, [(u, v + z) for u, v in outline], 0.05, wood(c, 'x', seed=k), axis='y', at=-0.075)
        xform(mb, m, rot(z=ang, at=(0, 0, 0)))
    return [(mb, 'main')]


def signboard():
    """A welcome board on two legs under a little roof (the island's, the club's)."""
    mb = MB()
    for x in (-0.75, 0.75):
        rbox(mb, x - 0.06, -0.06, 0, x + 0.06, 0.06, 1.45, wood(WOOD_D), r=0.02)
    rbox(mb, -0.78, -0.05, 0.72, 0.78, 0.05, 1.3, wood('#e8d4a8', 'x'), r=0.04)
    rbox(mb, -0.7, -0.07, 0.8, 0.7, -0.045, 1.22, wood('#5a8ac0', 'x'), r=0.02)
    # a little sun and waves painted on
    ball(mb, (-0.38, -0.08, 1.04), (0.1, 0.015, 0.1), shade('#ffd040'))
    for k in range(3):
        z = 0.9 + k * 0.012
        tube(mb, [(-0.1 + i * 0.1, -0.08, z + 0.02 * math.sin(i * 1.8)) for i in range(7)], 0.012, shade('#e8f4ff'), seg=5)
    gable(mb, -0.88, 0.88, -0.16, 0.16, 1.42, 0.14, wood('#b04a3a', 'x'))
    return [(mb, 'main')]


# ---------------------------------------------------------------- the farm
def windmill():
    mb = MB()
    lathe(mb, [(1.12, 0.0), (1.15, 0.1), (1.0, 1.8), (0.82, 3.4), (0.86, 3.45), (0.86, 3.55)], col_fn(CREAM, under=0.15), seg=32, cap_top=False)
    lathe(mb, [(1.06, 1.1), (1.08, 1.14), (1.08, 1.24), (1.06, 1.28)], wood(WOOD_D), seg=32, cap_top=False)
    lathe(mb, [(0.95, 3.5), (0.98, 3.56), (0.7, 4.1), (0.35, 4.45), (0.0, 4.6)], wood('#a84a32', 'z'), seg=32, cap_top=False)
    # the door and two windows on the front
    rbox(mb, -0.3, -1.18, 0.0, 0.3, -1.05, 0.9, wood('#6a4a2a'), r=0.04)
    rbox(mb, -0.36, -1.2, 0.0, 0.36, -1.04, 0.06, stone(), r=0.02)
    for z, x in ((1.8, 0.0), (2.6, 0.0)):
        y = -1.0 + (z - 1.8) * 0.11 - 0.02
        rbox(mb, x - 0.16, y - 0.06, z - 0.2, x + 0.16, y + 0.04, z + 0.2, shade('#f2ece0'), r=0.03)
        rbox(mb, x - 0.12, y - 0.075, z - 0.16, x + 0.12, y - 0.05, z + 0.16, shade('#3a4a6a'), r=0.01)
    # the hub's axle
    tube(mb, [(0, -0.6, 3.75), (0, -1.08, 3.75)], 0.09, shade(IRON), seg=10)
    sails = MB()
    ball(sails, (0, 0, 0), 0.16, shade('#8a5a34'))
    for k in range(4):
        m = len(sails.v)
        rbox(sails, -0.05, -0.04, 0.1, 0.05, 0.04, 2.3, wood(WOOD_L), r=0.015)
        # the lattice and the cloth
        for j in range(7):
            z = 0.55 + j * 0.25
            rbox(sails, 0.05, -0.03, z - 0.02, 0.62, 0.0, z + 0.02, wood(WOOD_L), r=0.008)
        rbox(sails, 0.6, -0.03, 0.5, 0.64, 0.0, 2.25, wood(WOOD_L), r=0.008)
        rbox(sails, 0.06, -0.012, 0.52, 0.6, 0.0, 2.23, col_fn('#f4ecdc'), r=0.004)
        xform(sails, m, Euler((0, k * math.pi / 2 + 0.3, 0)).to_matrix().to_4x4())
    return [(mb, 'main')], [(sails, 'sails')], [Vector((0, -1.12, 3.75))]


def well():
    mb, water = MB(), MB()
    lathe(mb, [(0.6, 0.0), (0.62, 0.05), (0.62, 0.62), (0.66, 0.66), (0.66, 0.72), (0.5, 0.72), (0.48, 0.66), (0.48, 0.2)], stone('#b8ae9e', seed=2), seg=32, cap_top=False)
    lathe(water, [(0.49, 0.32), (0.0, 0.32)], col_fn('#3a6a8a'), seg=24, cap_top=False)
    for x in (-0.6, 0.6):
        rbox(mb, x - 0.05, -0.05, 0.6, x + 0.05, 0.05, 1.7, wood(WOOD_D), r=0.02)
    gable(mb, -0.78, 0.78, -0.5, 0.5, 1.62, 0.36, wood('#b04a3a', 'x'))
    tube(mb, [(-0.6, 0, 1.25), (0.72, 0, 1.25)], 0.04, wood(WOOD), seg=8)
    tube(mb, [(0.72, 0, 1.25), (0.72, -0.16, 1.25), (0.72, -0.16, 1.12)], 0.018, shade(IRON), seg=6)
    tube(mb, [(0.0, 0.0, 1.22), (0.0, 0.0, 0.92)], 0.008, shade('#d8c8a0'), seg=5)
    lathe(mb, [(0.08, 0.78), (0.1, 0.92), (0.11, 0.93)], wood(WOOD), seg=12, cap_top=False, cap_bot=True)
    return [(mb, 'main'), (water, 'water')]


def scarecrow():
    mb = MB()
    rbox(mb, -0.04, -0.04, 0, 0.04, 0.04, 1.6, wood(WOOD_D), r=0.015)
    rbox(mb, -0.6, -0.035, 1.1, 0.6, 0.035, 1.17, wood(WOOD_D, 'x'), r=0.015)
    ball(mb, (0, 0, 1.45), (0.17, 0.16, 0.18), col_fn('#d8b880', mottle=0.08))
    for x in (-0.06, 0.06):
        ball(mb, (x, -0.155, 1.48), 0.022, shade('#2a2018'), sub=1)
    tube(mb, [(-0.06, -0.16, 1.38), (0.0, -0.17, 1.36), (0.06, -0.16, 1.38)], 0.008, shade('#2a2018'), seg=5)
    lathe(mb, [(0.34, 1.56), (0.34, 1.58), (0.15, 1.6), (0.13, 1.76), (0.0, 1.78)], col_fn('#e0c070', grain='z'), seg=20, cap_top=False)
    lathe(mb, [(0.15, 1.6), (0.155, 1.64), (0.135, 1.64)], shade('#c83a2a'), seg=20, cap_top=False)
    rbox(mb, -0.2, -0.13, 0.75, 0.2, 0.13, 1.22, col_fn('#4a7ac0', mottle=0.05), r=0.06)
    rbox(mb, -0.55, -0.1, 1.06, 0.55, 0.1, 1.21, col_fn('#4a7ac0', mottle=0.05), r=0.05)
    rbox(mb, -0.07, -0.135, 0.9, 0.07, -0.13, 1.05, shade('#e8c040'), r=0.005)
    rng = random.Random(3)
    for sx in (-1, 1):
        for k in range(5):
            tube(mb, [(sx * 0.55, 0, 1.13), (sx * (0.6 + rng.uniform(0.02, 0.08)), rng.uniform(-0.04, 0.04), 1.13 - rng.uniform(0.03, 0.12))], 0.008, shade('#e8c870'), seg=4)
    return [(mb, 'main')]


def hay():
    mb = MB()
    rng = random.Random(2)
    f = col_fn('#e4c06a', grain='y', seed=3)

    def straw(p, n):
        return f(p, n) * (0.9 + 0.2 * (0.5 + 0.5 * math.sin(p.x * 80 + p.z * 37)))
    rbox(mb, -0.45, -0.32, 0, 0.45, 0.32, 0.5, straw, r=0.07, mid=4)
    for x in (-0.22, 0.22):
        rbox(mb, x - 0.02, -0.335, 0.02, x + 0.02, 0.335, 0.515, shade('#a07a4a'), r=0.01)
    for k in range(10):
        p = Vector((rng.uniform(-0.45, 0.45), rng.uniform(-0.3, 0.3), 0.5))
        tube(mb, [p, p + Vector((rng.uniform(-0.1, 0.1), rng.uniform(-0.1, 0.1), rng.uniform(0.02, 0.06)))], 0.006, shade('#f0d080'), seg=4)
    return [(mb, 'main')]


def crate():
    mb = MB()
    plank_row(mb, -0.35, 0.35, -0.3, -0.26, 0.04, 0.56, 4, WOOD_L, along='x', seed=1, stack='z')
    plank_row(mb, -0.35, 0.35, 0.26, 0.3, 0.04, 0.56, 4, WOOD_L, along='x', seed=2, stack='z')
    for x0 in (-0.35, 0.31):
        rbox(mb, x0, -0.3, 0.04, x0 + 0.04, 0.3, 0.56, wood(WOOD_L, 'y'), r=0.01)
    rbox(mb, -0.35, -0.3, 0.0, 0.35, 0.3, 0.06, wood(WOOD), r=0.01)
    for (x, y) in ((-0.33, -0.28), (0.33, -0.28), (-0.33, 0.28), (0.33, 0.28)):
        rbox(mb, x - 0.035, y - 0.035, 0.0, x + 0.035, y + 0.035, 0.58, wood(WOOD_D), r=0.012)
    m = len(mb.v)
    rbox(mb, -0.34, -0.315, 0.08, -0.3, -0.3, 0.52, wood(WOOD_D), r=0.008)
    xform(mb, m, rot(y=-0.95, at=(0, -0.31, 0.3)))
    rng = random.Random(4)
    for k in range(9):
        ball(mb, (rng.uniform(-0.24, 0.24), rng.uniform(-0.2, 0.2), 0.52 + rng.uniform(0, 0.06)), 0.07, shade(rng.choice(['#d83028', '#e8442a', '#f0b030'])), sub=2)
    return [(mb, 'main')]


def wheelbarrow():
    mb = MB()
    # the tray, splayed boards
    rbox(mb, -0.3, -0.42, 0.34, 0.3, 0.3, 0.38, wood('#5a8a5a', 'y'), r=0.015)
    for s in (-1, 1):
        m = len(mb.v)
        rbox(mb, s * 0.3 - 0.02, -0.42, 0.36, s * 0.3 + 0.02, 0.32, 0.62, wood('#5a8a5a', 'y'), r=0.015)
        xform(mb, m, rot(y=-s * 0.35, at=(s * 0.3, 0, 0.36)))
    m = len(mb.v)
    rbox(mb, -0.38, -0.44, 0.36, 0.38, -0.4, 0.62, wood('#5a8a5a', 'x'), r=0.015)
    xform(mb, m, rot(x=0.4, at=(0, -0.42, 0.36)))
    rbox(mb, -0.38, 0.3, 0.36, 0.38, 0.34, 0.6, wood('#5a8a5a', 'x'), r=0.015)
    # the wheel in front, the handles back, two legs
    m = len(mb.v)
    lathe(mb, [(0.0, -0.05), (0.16, -0.05), (0.2, -0.03), (0.2, 0.03), (0.16, 0.05), (0.0, 0.05)], shade('#3a3a3a'), seg=24, cap_top=False)
    xform(mb, m, Matrix.Translation((0, -0.6, 0.2)) @ Euler((0, math.pi / 2, 0)).to_matrix().to_4x4())
    for s in (-1, 1):
        tube(mb, [(s * 0.06, -0.62, 0.2), (s * 0.22, -0.3, 0.32), (s * 0.24, 0.4, 0.45), (s * 0.26, 0.8, 0.55)], 0.022, wood(WOOD_D), seg=6)
        rbox(mb, s * 0.22 - 0.025, 0.25, 0.0, s * 0.22 + 0.025, 0.3, 0.36, wood(WOOD_D), r=0.01)
    rng = random.Random(5)
    for k in range(6):
        ball(mb, (rng.uniform(-0.18, 0.18), rng.uniform(-0.25, 0.15), 0.42 + rng.uniform(0, 0.05)), (0.08, 0.08, 0.06), shade(rng.choice(['#f08a20', '#e87a1a', '#8a6a3a'])), sub=2)
    return [(mb, 'main')]


def trough():
    mb, water = MB(), MB()
    plank_row(mb, -0.6, 0.6, -0.26, -0.22, 0.08, 0.42, 3, WOOD, along='x', seed=3, stack='z')
    plank_row(mb, -0.6, 0.6, 0.22, 0.26, 0.08, 0.42, 3, WOOD, along='x', seed=4, stack='z')
    for x0 in (-0.64, 0.6):
        rbox(mb, x0, -0.26, 0.04, x0 + 0.04, 0.26, 0.44, wood(WOOD, 'y'), r=0.01)
    rbox(mb, -0.62, -0.24, 0.06, 0.62, 0.24, 0.1, wood(WOOD_D), r=0.01)
    for x in (-0.5, 0.5):
        rbox(mb, x - 0.05, -0.3, 0.0, x + 0.05, 0.3, 0.1, wood(WOOD_D, 'y'), r=0.015)
    rbox(water, -0.6, -0.22, 0.3, 0.6, 0.22, 0.33, col_fn('#6ab4d8'), r=0.005)
    return [(mb, 'main'), (water, 'water')]


# ---------------------------------------------------------------- the neighborhood
def birdhouse():
    mb = MB()
    rbox(mb, -0.035, -0.035, 0, 0.035, 0.035, 1.2, wood(WOOD_D), r=0.012)
    rbox(mb, -0.17, -0.15, 1.2, 0.17, 0.15, 1.5, wood('#f0e0b8', 'z'), r=0.025)
    gable(mb, -0.2, 0.2, -0.15, 0.15, 1.48, 0.14, wood('#c8443a', 'x'), over=0.05, t=0.035)
    ball(mb, (0, -0.152, 1.38), (0.05, 0.01, 0.05), shade('#3a2a20'), sub=2)
    tube(mb, [(0, -0.15, 1.28), (0, -0.24, 1.28)], 0.012, wood(WOOD_D), seg=5)
    return [(mb, 'main')]


def flamingo():
    mb = MB()
    pink, pink_d = '#f48aac', '#e0688e'
    ball(mb, (0, 0.02, 0.72), (0.12, 0.22, 0.11), col_fn(pink, under=0.0))
    tube(mb, [(0, -0.14, 0.76), (0, -0.2, 0.9), (0, -0.16, 1.05), (0, -0.2, 1.14)], 0.03, shade(pink), seg=8, r1=0.026)
    ball(mb, (0, -0.22, 1.17), 0.05, shade(pink))
    tube(mb, [(0, -0.26, 1.18), (0, -0.33, 1.14), (0, -0.34, 1.1)], 0.018, shade('#2a2a2a'), seg=6, r1=0.008)
    ball(mb, (0.03, -0.23, 1.19), 0.01, shade('#1a1a1a'), sub=1)
    ball(mb, (-0.03, -0.23, 1.19), 0.01, shade('#1a1a1a'), sub=1)
    for x in (-0.04, 0.04):
        tube(mb, [(x, 0.0, 0.66), (x, 0.0, 0.0)], 0.008, shade('#3a3a3a'), seg=5)
    ball(mb, (0, 0.2, 0.75), (0.06, 0.08, 0.04), shade(pink_d))
    return [(mb, 'main')]


# ---------------------------------------------------------------- the forest and the campsite
def log():
    mb = MB()
    m = len(mb.v)
    lathe(mb, [(0.2, -0.6), (0.22, -0.55), (0.21, 0.0), (0.22, 0.55), (0.2, 0.6)], col_fn('#7a5a3a', grain='z', seed=2, under=0.0), seg=18, cap_top=False)
    lathe(mb, [(0.19, 0.6), (0.12, 0.6), (0.05, 0.6), (0.0, 0.6)], lambda p, n: rgb('#d8b080') * (0.85 + 0.15 * math.sin(math.hypot(p.x, p.y) * 60)), seg=18, cap_top=False)
    lathe(mb, [(0.0, -0.6), (0.19, -0.6)], lambda p, n: rgb('#d8b080') * (0.85 + 0.15 * math.sin(math.hypot(p.x, p.y) * 60)), seg=18, cap_top=False)
    xform(mb, m, Matrix.Translation((0, 0, 0.19)) @ Euler((0, math.pi / 2, 0)).to_matrix().to_4x4())
    ball(mb, (0.15, -0.12, 0.3), (0.05, 0.04, 0.02), shade('#5a8a3a'), sub=2)
    return [(mb, 'main')]


def tent_ac(colors):
    """A ridge tent: two cloth sides on a ridge pole, the ends closed but for the open front door, ropes and pegs."""
    mb = MB()
    c, c2 = colors
    L, H, W = 1.5, 1.0, 0.85                    # length (front to back), height, half width at the foot
    for s in (-1, 1):
        pts = [(s * W, -L / 2, 0.0), (0.0, -L / 2, H), (0.0, L / 2, H), (s * W, L / 2, 0.0)]
        base = len(mb.v)
        # a cloth panel with a little thickness, sagging between the poles
        quad = []
        for j in range(5):
            for i in range(6):
                u, v = i / 5, j / 4
                a = Vector(pts[0]).lerp(Vector(pts[3]), u)
                b = Vector(pts[1]).lerp(Vector(pts[2]), u)
                p = a.lerp(b, v)
                p.z -= 0.035 * math.sin(math.pi * v) * (0.6 + 0.4 * math.sin(math.pi * u))
                quad.append(p)
        n = (Vector(pts[1]) - Vector(pts[0])).cross(Vector(pts[3]) - Vector(pts[0])).normalized()
        if n.dot(Vector((s, 0, 0.5))) < 0:
            n = -n
        f = col_fn(c if s < 0 else c2, under=0.0)
        cols = [f(p, n) * (0.9 + 0.1 * (int(i % 6 / 1.5) % 2)) for i, p in enumerate(quad)]
        faces = []
        for j in range(4):
            for i in range(5):
                a = j * 6 + i
                faces += [(a, a + 1, a + 7), (a, a + 7, a + 6)]
        mb.add(quad, cols, [n] * len(quad), faces)
        # (the inside a little in from the outside, so the two never fight)
        mb.add([q - n * 0.01 for q in quad], [x * 0.7 for x in cols], [-n] * len(quad), faces)
    for y, door in ((-L / 2, True), (L / 2, False)):
        if door:
            for s in (-1, 1):
                outline = [(s * W, 0.0), (s * 0.18, 0.0), (0.0, H)] if s > 0 else [(s * W, 0.0), (0.0, H), (s * 0.18, 0.0)]
                slab(mb, [(u, v) for u, v in outline], 0.02, col_fn(colors[1], under=0.0), axis='y', at=y - 0.01)
            slab(mb, [(-0.18, 0.0), (0.18, 0.0), (0.0, H * 0.8)], 0.01, shade('#2a2a2a'), axis='y', at=y + 0.05)
        else:
            slab(mb, [(-W, 0.0), (W, 0.0), (0.0, H)], 0.02, col_fn(colors[1], under=0.0), axis='y', at=y - 0.01)
    tube(mb, [(0, -L / 2 - 0.05, H), (0, L / 2 + 0.05, H)], 0.025, wood(WOOD_D), seg=6)
    for y in (-L / 2 - 0.02, L / 2 + 0.02):
        tube(mb, [(0, y, 0), (0, y, H + 0.12)], 0.022, wood(WOOD_D), seg=6)
        for s in (-1, 1):
            tube(mb, [(0, y, H + 0.08), (s * 0.15, y + math.copysign(0.55, y), 0.0)], 0.006, shade('#e8dcc0'), seg=4)
            rbox(mb, s * 0.15 - 0.015, y + math.copysign(0.55, y) - 0.015, 0, s * 0.15 + 0.015, y + math.copysign(0.55, y) + 0.015, 0.08, wood(WOOD_D), r=0.005)
    return [(mb, 'main')]


def campfire(big=False):
    mb, fire = MB(), MB()
    k = 1.6 if big else 1.0
    for j in range(9 if not big else 12):
        a = j / (9 if not big else 12) * math.tau
        rocks(mb, (math.cos(a) * 0.36 * k, math.sin(a) * 0.36 * k, 0.0), 0.09 * k, color='#8a8478', seed=j)
    if big:
        for j in range(7):
            a = j / 7 * math.tau
            tube(mb, [(math.cos(a) * 0.4, math.sin(a) * 0.4, 0.02), (math.cos(a) * 0.05, math.sin(a) * 0.05, 0.8)], 0.05, col_fn('#6a4a2a', grain='z'), seg=7, r1=0.035)
    else:
        for a in (0.3, 1.9):
            m = len(mb.v)
            lathe(mb, [(0.05, -0.28), (0.055, 0.28)], col_fn('#6a4a2a', grain='z'), seg=8)
            xform(mb, m, Matrix.Translation((0, 0, 0.06)) @ Euler((0, math.pi / 2, a)).to_matrix().to_4x4())
    ball(mb, (0, 0, 0.02), (0.22 * k, 0.22 * k, 0.03), shade('#3a2a20'), sub=2)
    flame(fire, (0, 0, 0.04), 0.55 * k, 0.32 * k)
    return [(mb, 'main'), (fire, 'glow')]


def picnic():
    mb, cloth = MB(), MB()
    plank_row(mb, -0.75, 0.75, -0.4, 0.4, 0.68, 0.74, 4, WOOD_L, along='x', seed=5)
    for s in (-1, 1):
        plank_row(mb, -0.75, 0.75, s * 0.7 - 0.15, s * 0.7 + 0.15, 0.4, 0.45, 2, WOOD_L, along='x', seed=6 + s)
        for x in (-0.55, 0.55):
            m = len(mb.v)
            rbox(mb, x - 0.04, -0.03, 0.0, x + 0.04, 0.03, 0.78, wood(WOOD), r=0.012)
            xform(mb, m, rot(x=s * 0.62, at=(x, 0, 0.7)))
    for x in (-0.55, 0.55):
        rbox(mb, x - 0.04, -0.85, 0.36, x + 0.04, 0.85, 0.4, wood(WOOD, 'y'), r=0.012)
    rbox(cloth, -0.5, -0.42, 0.74, 0.5, 0.42, 0.75, checker('#e8443a', '#fff6ee', 0.1), r=0.003, mid=8)
    lathe(cloth, [(0.07, 0.75), (0.08, 0.86), (0.06, 0.9)], shade('#c8823a'), c=(0.2, 0.1, 0), seg=10)
    ball(cloth, (-0.22, -0.05, 0.79), (0.1, 0.07, 0.04), shade('#f0c070'))
    return [(mb, 'main'), (cloth, 'cloth')]


# ---------------------------------------------------------------- lookout, harbor
def telescope():
    mb = MB()
    for a in (0.0, 2.1, 4.2):
        tube(mb, [(0, 0, 0.9), (math.cos(a) * 0.35, math.sin(a) * 0.35, 0.0)], 0.02, wood(WOOD_D), seg=6)
    ball(mb, (0, 0, 0.92), 0.05, shade('#5a3a20'))
    m = len(mb.v)
    lathe(mb, [(0.05, -0.35), (0.06, -0.3), (0.07, 0.2), (0.1, 0.25), (0.1, 0.42)], col_fn('#c8963a', under=0.0), seg=16)
    lathe(mb, [(0.03, -0.42), (0.035, -0.35)], shade(IRON), seg=10)
    xform(mb, m, Matrix.Translation((0, 0, 1.0)) @ Euler((-1.1, 0, 0)).to_matrix().to_4x4())
    return [(mb, 'main')]


def viewer():
    mb = MB()
    lathe(mb, [(0.22, 0.0), (0.16, 0.06), (0.06, 0.12), (0.05, 0.85), (0.08, 0.9)], col_fn('#3a8a9a', under=0.2), seg=16)
    rbox(mb, -0.2, -0.15, 0.88, 0.2, 0.15, 1.14, shade('#3a8a9a'), r=0.06)
    for x in (-0.08, 0.08):
        m = len(mb.v)
        lathe(mb, [(0.06, 0.0), (0.065, 0.1), (0.05, 0.12)], shade('#2a2a2e'), seg=12)
        xform(mb, m, Matrix.Translation((x, -0.14, 1.03)) @ Euler((math.pi / 2, 0, 0)).to_matrix().to_4x4())
    rbox(mb, 0.19, -0.03, 0.95, 0.22, 0.03, 1.02, shade('#d8c070'), r=0.005)
    return [(mb, 'main')]


def tackle():
    mb = MB()
    rbox(mb, -0.25, -0.15, 0.0, 0.25, 0.15, 0.24, col_fn('#3a7a4a'), r=0.03)
    rbox(mb, -0.26, -0.16, 0.2, 0.26, 0.16, 0.26, shade('#2e6a3e'), r=0.02)
    tube(mb, [(-0.1, 0, 0.26), (-0.1, 0, 0.32), (0.1, 0, 0.32), (0.1, 0, 0.26)], 0.012, shade(IRON), seg=5)
    rbox(mb, -0.04, -0.162, 0.17, 0.04, -0.15, 0.22, shade('#d8c070'), r=0.004)
    for k, x in enumerate((0.4, 0.5)):
        tube(mb, [(x, 0.1, 0.0), (x - 0.08, 0.12, 1.4)], 0.012, wood('#c8a060'), seg=5, r1=0.006)
        tube(mb, [(x - 0.01, 0.1, 0.25), (x - 0.01, 0.06, 0.29)], 0.03, shade('#3a3a3a'), seg=8)
    lathe(mb, [(0.13, 0.0), (0.15, 0.26), (0.16, 0.27)], col_fn('#4a78c8'), c=(-0.45, 0.05, 0), seg=16, cap_top=False, cap_bot=True)
    return [(mb, 'main')]


# ---------------------------------------------------------------- the beach
def driftwood():
    mb = MB()
    f = col_fn('#c8b8a0', grain='x', seed=4, under=0.1)
    tube(mb, [(-0.8, 0.05, 0.08), (-0.4, 0.0, 0.12), (0.0, 0.04, 0.13), (0.4, -0.02, 0.11), (0.85, 0.06, 0.08)], 0.11, f, seg=10, r1=0.06)
    tube(mb, [(0.1, 0.02, 0.14), (0.3, -0.25, 0.2), (0.45, -0.4, 0.18)], 0.045, f, seg=7, r1=0.02)
    tube(mb, [(-0.4, 0.02, 0.15), (-0.55, 0.3, 0.32)], 0.04, f, seg=7, r1=0.018)
    return [(mb, 'main')]


def rock(seed):
    mb = MB()
    rocks(mb, (0, 0, 0), 0.42, color='#a09a90', seed=seed, n=1)
    rocks(mb, (0.36, -0.2, 0), 0.2, color='#948e84', seed=seed + 5, n=1)
    ball(mb, (-0.1, -0.1, 0.3), (0.12, 0.1, 0.03), shade('#7a9a4a'), sub=2)
    return [(mb, 'main')]


def icecream():
    mb, top = MB(), MB()
    rbox(mb, -0.6, -0.35, 0.3, 0.6, 0.35, 1.0, col_fn('#f8d8e4'), r=0.05)
    rbox(mb, -0.62, -0.37, 0.95, 0.62, 0.37, 1.05, shade('#f4f0ea'), r=0.03)
    rbox(mb, -0.55, -0.37, 0.4, 0.55, -0.34, 0.86, shade('#8ad0e8'), r=0.02)
    for x in (-0.45, 0.45):
        m = len(mb.v)
        lathe(mb, [(0.0, -0.05), (0.2, -0.05), (0.22, -0.03), (0.22, 0.03), (0.2, 0.05), (0.0, 0.05)], shade('#e8443a'), seg=20, cap_top=False)
        xform(mb, m, Matrix.Translation((x, -0.32, 0.22)) @ Euler((0, math.pi / 2, 0)).to_matrix().to_4x4())
    tube(mb, [(0, 0.1, 1.05), (0, 0.1, 2.0)], 0.025, shade('#f4f0ea'), seg=6)
    # (a profile runs from the bottom up, so its surface faces out: the umbrella's rim first)
    lathe(top, [(0.98, 1.9), (0.95, 1.95), (0.0, 2.25)], stripes('#ff8ab0', '#fff8f0', 12), c=(0, 0.1, 0), seg=36, cap_top=False, cap_bot=False)
    lathe(top, [(0.0, 1.93), (0.94, 1.92)], shade('#f0d8e0'), c=(0, 0.1, 0), seg=36, cap_top=False)
    for k, (x, c) in enumerate(((-0.3, '#ffd0e0'), (0.0, '#fff0b0'), (0.3, '#c8f0d0'))):
        lathe(mb, [(0.0, 1.05), (0.07, 1.22)], col_fn('#d8a050'), c=(x, -0.1, 0), seg=10, cap_top=False)
        ball(mb, (x, -0.1, 1.27), 0.075, shade(c))
    return [(mb, 'main'), (top, 'umbrella')]


def sandcastle():
    mb = MB()
    sand = col_fn('#e8d0a0', mottle=0.06, under=0.1)
    rbox(mb, -0.5, -0.4, 0.0, 0.5, 0.4, 0.22, sand, r=0.06)
    for (x, y, h) in ((-0.35, -0.25, 0.55), (0.35, -0.25, 0.55), (-0.35, 0.25, 0.5), (0.35, 0.25, 0.5), (0.0, 0.05, 0.75)):
        lathe(mb, [(0.13, 0.15), (0.11, h), (0.14, h + 0.02), (0.14, h + 0.06)], sand, c=(x, y, 0), seg=14, cap_top=True)
        for j in range(4):
            a = j / 4 * math.tau
            rbox(mb, x + math.cos(a) * 0.1 - 0.03, y + math.sin(a) * 0.1 - 0.03, h + 0.06, x + math.cos(a) * 0.1 + 0.03, y + math.sin(a) * 0.1 + 0.03, h + 0.11, sand, r=0.01)
    tube(mb, [(0.0, 0.05, 0.8), (0.0, 0.05, 1.1)], 0.008, shade('#5a4a3a'), seg=4)
    slab(mb, [(0.0, 1.0), (0.18, 1.04), (0.0, 1.09)], 0.01, shade('#e8443a'), axis='y', at=0.04)
    rbox(mb, -0.15, -0.42, 0.0, 0.15, -0.38, 0.14, sand, r=0.02)
    lathe(mb, [(0.06, 0.0), (0.09, 0.12), (0.1, 0.13)], shade('#4a8ad8'), c=(0.62, -0.1, 0), seg=12, cap_top=False, cap_bot=True)
    return [(mb, 'main')]


def volleyball():
    """The net across the 7-tile court (the game keeps its own ball, which bounces)."""
    mb = MB()
    for x in (-3.4, 3.4):
        cyl(mb, x, 0, 0, 1.55, 0.045, color=shade('#f4f0ea'), round_=0.02)
        ball(mb, (x, 0, 1.58), 0.055, shade('#e8443a'))
        tube(mb, [(x, 0, 1.5), (x * 1.12, 0, 0.0)], 0.006, shade('#e8dcc0'), seg=4)
    rbox(mb, -3.4, -0.012, 1.32, 3.4, 0.012, 1.4, shade('#f4f0ea'), r=0.005)
    for k in range(69):
        x = -3.4 + k * 0.1
        rbox(mb, x - 0.004, -0.004, 0.82, x + 0.004, 0.004, 1.32, shade('#2a2a2e'), r=0.002)
    for k in range(6):
        z = 0.82 + k * 0.1
        rbox(mb, -3.4, -0.004, z - 0.004, 3.4, 0.004, z + 0.004, shade('#2a2a2e'), r=0.002)
    return [(mb, 'main')]


def noodle_cart():
    """Basil's noodle cart (out at night): a red-orange plank body on four small wheels, its counter with a pot of broth
    steaming, bowls and chopsticks, a cream sign with a bowl of noodles on it, a red cloth roof on two posts with a
    scalloped valance, a paper lantern lit under it, Joe's poem taped to the side, two stools."""
    mb, lamp = MB(), MB()
    RED, ORANGE = '#c9542e', '#e8763c'
    # the body: planks standing side by side, a darker plinth, the counter on top overhanging the front
    for k in range(11):
        x0 = -1.1 + k * 0.2
        rbox(mb, x0 + 0.005, -0.42, 0.3, x0 + 0.195, 0.42, 1.0, col_fn(tuple(rgb(RED) * (0.92 + 0.1 * ((k * 7) % 3) / 2)), grain='z', seed=k), r=0.012)
    rbox(mb, -1.12, -0.44, 0.24, 1.12, 0.44, 0.32, shade('#8a3a20'), r=0.02)
    rbox(mb, -1.18, -0.56, 1.0, 1.18, 0.5, 1.08, col_fn(ORANGE, grain='x'), r=0.02)
    # the sign: a cream panel, a red bowl with noodles hanging over its rim, chopsticks, steam
    rbox(mb, -0.78, -0.45, 0.42, 0.78, -0.42, 0.9, shade('#fff1e4'), r=0.02)
    m = len(mb.v)
    slab(mb, [(-0.2, 0.0), (0.2, 0.0), (0.16, -0.08), (0.08, -0.13), (-0.08, -0.13), (-0.16, -0.08)], 0.012, shade(RED), axis='y', at=-0.006)
    for k in range(5):
        tube(mb, [(-0.12 + k * 0.06, -0.012, 0.0), (-0.1 + k * 0.06, -0.012, 0.06), (-0.13 + k * 0.06, -0.012, 0.11)], 0.008, shade('#e8c070'), seg=4)
    for d in (0.0, 0.03):
        tube(mb, [(0.04 + d, -0.014, 0.08), (0.22 + d, -0.014, 0.2)], 0.007, shade('#7a3a20'), seg=4)
    for x in (-0.07, 0.03):
        tube(mb, [(x, -0.012, 0.15), (x + 0.02, -0.012, 0.19), (x - 0.01, -0.012, 0.23), (x + 0.01, -0.012, 0.27)], 0.007, shade('#d8b8a8'), seg=4)
    xform(mb, m, Matrix.Translation((0, -0.45, 0.56)))
    # four little wheels, front and back
    for x in (-0.72, 0.72):
        for y in (-0.47, 0.47):
            m = len(mb.v)
            lathe(mb, [(0.0, -0.035), (0.2, -0.035), (0.22, -0.015), (0.22, 0.015), (0.2, 0.035), (0.0, 0.035)], shade('#2d2832'), seg=22, cap_top=False)
            lathe(mb, [(0.0, 0.036), (0.07, 0.036), (0.07, 0.05), (0.0, 0.05)], shade('#7a7686'), seg=12, cap_top=False)
            xform(mb, m, Matrix.Translation((x, y + (-0.02 if y < 0 else 0.02), 0.22)) @ Euler((math.pi / 2 if y < 0 else -math.pi / 2, 0, 0)).to_matrix().to_4x4())
    # a push handle at the right
    tube(mb, [(1.12, -0.3, 0.8), (1.42, -0.3, 0.86), (1.42, 0.3, 0.86), (1.12, 0.3, 0.8)], 0.025, wood(WOOD_D, 'x'), seg=6)
    # the posts and the roof: a red cloth sloping back, a scalloped valance in front
    for x in (-1.08, 1.08):
        rbox(mb, x - 0.045, 0.32, 1.08, x + 0.045, 0.41, 2.08, wood(WOOD_D), r=0.015)
        rbox(mb, x - 0.045, -0.5, 1.08, x + 0.045, -0.42, 1.95, wood(WOOD_D), r=0.015)

    def cloth(p, n):
        k = int(math.floor((p.x + 2) / 0.24)) % 2
        return rgb('#e0405a') * (0.84 + 0.1 * k + 0.08 * abs(n.z))
    m = len(mb.v)
    rbox(mb, -1.3, 0.0, -0.025, 1.3, 1.26, 0.025, cloth, r=0.015, mid=10)
    xform(mb, m, Matrix.Translation((0, -0.7, 2.0)) @ Euler((math.atan2(0.16, 1.25), 0, 0)).to_matrix().to_4x4())
    rbox(mb, -1.32, -0.73, 1.86, 1.32, -0.69, 2.02, cloth, r=0.012, mid=10)
    for k in range(11):
        ball(mb, (-1.2 + k * 0.24, -0.71, 1.86), (0.12, 0.02, 0.07), shade('#e0405a' if k % 2 == 0 else '#c8304a'), sub=2)
    # the paper lantern, lit, hanging from the roof: dark caps, a red word down it
    tube(mb, [(-0.55, -0.55, 1.98), (-0.55, -0.55, 1.82)], 0.006, shade('#3f3a4a'), seg=4)
    lathe(lamp, [(0.0, 1.5), (0.1, 1.5), (0.15, 1.56), (0.17, 1.66), (0.15, 1.76), (0.1, 1.8), (0.0, 1.8)], shade('#ffd35a'), c=(-0.55, -0.55, 0), seg=16)
    for z in (1.48, 1.8):
        lathe(mb, [(0.0, z), (0.085, z), (0.085, z + 0.03), (0.0, z + 0.03)], shade('#3a3340'), c=(-0.55, -0.55, 0), seg=12)
    for z in (1.58, 1.66, 1.74):
        rbox(lamp, -0.57, -0.73, z - 0.02, -0.53, -0.7, z + 0.02, shade('#c0302a'), r=0.006)
    # the counter's things: a pot of broth steaming, a stack of bowls, chopsticks in a cup, a bottle
    lathe(mb, [(0.0, 1.08), (0.22, 1.08), (0.24, 1.12), (0.24, 1.36), (0.26, 1.38), (0.22, 1.38), (0.22, 1.34), (0.0, 1.34)], shade('#8a8a94'), c=(0.45, 0.05, 0), seg=20)
    for k, (dx, dz) in enumerate(((0.0, 0.0), (0.06, 0.12), (-0.04, 0.24))):
        ball(mb, (0.45 + dx, 0.05, 1.46 + dz), 0.07 + 0.015 * k, shade('#f4f0ec'), sub=2)
    for k in range(4):
        lathe(mb, [(0.0, 1.08 + k * 0.05), (0.08, 1.08 + k * 0.05), (0.13, 1.13 + k * 0.05), (0.12, 1.135 + k * 0.05), (0.0, 1.11 + k * 0.05)], shade('#fbf6ee' if k % 2 else '#e0405a'), c=(-0.3, -0.15, 0), seg=16)
    lathe(mb, [(0.0, 1.08), (0.05, 1.08), (0.05, 1.22), (0.0, 1.22)], shade('#2a5a8a'), c=(0.0, -0.25, 0), seg=10)
    for k in range(6):
        tube(mb, [(0.0 + (k % 3 - 1) * 0.015, -0.25 + (k // 3 - 0.5) * 0.02, 1.15), (0.0 + (k % 3 - 1) * 0.03, -0.25 + (k // 3 - 0.5) * 0.04, 1.36)], 0.006, wood(WOOD_L), seg=4)
    lathe(mb, [(0.0, 1.08), (0.045, 1.08), (0.045, 1.24), (0.02, 1.28), (0.02, 1.33), (0.0, 1.33)], shade('#7a2a1a'), c=(0.88, -0.2, 0), seg=10)
    # Joe's poem taped to the side
    rbox(mb, 1.12, -0.22, 0.5, 1.13, 0.12, 0.88, shade('#fbfbf6'), r=0.004)
    for k in range(5):
        rbox(mb, 1.13, -0.18, 0.8 - k * 0.06, 1.135, 0.04 - (k % 2) * 0.06, 0.81 - k * 0.06, shade('#5a6a8a'), r=0.002)
    rbox(mb, 1.13, -0.1, 0.86, 1.137, -0.02, 0.9, shade('#e8e0b8'), r=0.002)
    # two stools in front
    for x in (-0.45, 0.35):
        lathe(mb, [(0.0, 0.5), (0.16, 0.5), (0.17, 0.53), (0.16, 0.56), (0.0, 0.56)], col_fn('#c8945a', grain='x'), c=(x, -0.85, 0), seg=16)
        for k in range(3):
            a = k / 3 * math.tau + 0.3
            tube(mb, [(x + math.cos(a) * 0.12, -0.85 + math.sin(a) * 0.12, 0.0), (x + math.cos(a) * 0.06, -0.85 + math.sin(a) * 0.06, 0.5)], 0.02, wood(WOOD_D), seg=5)
    return [(mb, 'main'), (lamp, 'glow')]


def barrel():
    mb = MB()
    prof = [(0.22, 0.0)] + [(0.22 + 0.06 * math.sin(math.pi * k / 8), 0.62 * k / 8) for k in range(1, 8)] + [(0.22, 0.62)]
    lathe(mb, prof, col_fn(WOOD, grain='z', seed=3), seg=24, cap_top=True)
    for z in (0.08, 0.5):
        r = 0.22 + 0.06 * math.sin(math.pi * z / 0.62) + 0.008
        lathe(mb, [(r, z), (r + 0.004, z + 0.01), (r + 0.004, z + 0.05), (r, z + 0.06)], shade('#4a4a50'), seg=24, cap_top=False)
    return [(mb, 'main')]


# ---------------------------------------------------------------- the water's edges
def reeds():
    """A clump of cattails: long blades leaning out, velvety brown heads on stems."""
    mb = MB()
    rng = random.Random(11)
    for k in range(9):
        a = rng.uniform(0, math.tau)
        base = Vector((math.cos(a) * 0.06, math.sin(a) * 0.06, 0))
        lean = Vector((math.cos(a), math.sin(a), 0)) * rng.uniform(0.08, 0.25)
        h = rng.uniform(0.45, 0.8)
        # a blade: a thin strip curving out
        side = Vector((-math.sin(a), math.cos(a), 0))
        pts, cols, ns, faces = [], [], [], []
        for j in range(6):
            t = j / 5
            c = base + lean * t * t + Vector((0, 0, h * t))
            w = 0.03 * (1 - t) + 0.004
            pts += [c - side * w, c + side * w]
            col = rgb('#4a7a30').lerp(rgb('#8ab850'), t)
            cols += [col, col]
            nn = Vector((math.cos(a), math.sin(a), 0.4)).normalized()
            ns += [nn, nn]
        for j in range(5):
            i = j * 2
            faces += [(i, i + 1, i + 3), (i, i + 3, i + 2)]
        mb.add(pts, cols, ns, faces)
        mb.add(pts, [c * 0.8 for c in cols], [-n for n in ns], faces)
    for k in range(4):
        a = rng.uniform(0, math.tau)
        b = Vector((math.cos(a) * 0.05, math.sin(a) * 0.05, 0))
        top = b + Vector((math.cos(a) * 0.06, math.sin(a) * 0.06, rng.uniform(0.6, 0.85)))
        tube(mb, [b, b.lerp(top, 0.5), top], 0.008, shade('#5a8a3a'), seg=5)
        ball(mb, top - Vector((0, 0, 0.08)), (0.028, 0.028, 0.08), col_fn('#6a3e22', mottle=0.06), sub=2)
    return [(mb, 'main')]


def lilypad(flower=False):
    mb = MB()
    pts, cols, ns, faces = [Vector((0, 0, 0.01))], [rgb('#3a7a30')], [Vector((0, 0, 1))], []
    n = 18
    for j in range(n + 1):
        a = 0.35 + j / n * (math.tau - 0.7)
        r = 0.26 * (1 + 0.04 * math.sin(a * 5))
        pts.append(Vector((math.cos(a) * r, math.sin(a) * r, 0.0)))
        cols.append(rgb('#4c9a3a').lerp(rgb('#6ab84a'), 0.5 + 0.5 * math.sin(a * 3)))
        ns.append(Vector((0, 0, 1)))
    for j in range(n):
        faces.append((0, 1 + j, 2 + j))
    mb.add(pts, cols, ns, faces)
    # veins
    for j in range(5):
        a = 0.6 + j / 4 * (math.tau - 1.2)
        tube(mb, [(0, 0, 0.012), (math.cos(a) * 0.22, math.sin(a) * 0.22, 0.012)], 0.004, shade('#7ac860'), seg=3)
    if flower:
        for ring, (cnt, L, c, tilt) in enumerate(((8, 0.085, '#f8c0d4', 0.5), (6, 0.065, '#ffdce8', 0.9))):
            for k in range(cnt):
                a = (k + ring * 0.5) / cnt * math.tau
                d = Vector((math.cos(a), math.sin(a), tilt)).normalized()
                ball(mb, Vector((-0.06, 0.04, 0.04)) + d * L * 0.6, (0.035, 0.035, 0.02), shade(c), sub=2)
        ball(mb, (-0.06, 0.04, 0.07), 0.025, shade('#ffd84a'), sub=2)
    return [(mb, 'main')]


def pebbles():
    mb = MB()
    rng = random.Random(21)
    for k in range(5):
        a, d = rng.uniform(0, math.tau), rng.uniform(0, 0.22)
        c = (math.cos(a) * d, math.sin(a) * d, -0.01)
        rocks(mb, c, rng.uniform(0.05, 0.11), color=rng.choice(['#a8a298', '#968f86', '#b8b2a6', '#8a8aa0']), seed=k)
    return [(mb, 'main')]


def falls_rocks():
    """Rocks to sit either side of a waterfall: a big mossy one and two small, dark and wet."""
    mb = MB()
    rocks(mb, (0, 0, -0.05), 0.42, color='#7a7a74', seed=31)
    rocks(mb, (0.36, -0.22, -0.03), 0.18, color='#6e6e6a', seed=32)
    rocks(mb, (-0.3, -0.25, -0.03), 0.14, color='#86847c', seed=33)
    ball(mb, (-0.05, 0.05, 0.19), (0.2, 0.16, 0.08), col_fn('#5a8a3a', mottle=0.1), sub=2)
    return [(mb, 'main')]


# ---------------------------------------------------------------- the Post Office's mailbox styles
# (game/src/6zf_post.js MAILBOX_STYLES) the part named body is painted in white and greys, and the game multiplies in
# the color Sarah picked for her mailbox (MAILBOX_COLORS); the rest keeps its own colors
def mb_post(mb, top=0.86):
    rbox(mb, -0.045, -0.045, 0, 0.045, 0.045, top, wood(WOOD_D), r=0.012)
    rbox(mb, -0.07, -0.2, top - 0.06, 0.07, 0.16, top, wood(WOOD_D, 'y'), r=0.01)


def mb_flag(mb, x, y, z, h=0.36):
    rbox(mb, x - 0.012, y - 0.02, z, x + 0.012, y + 0.02, z + h, shade('#c8302a'), r=0.004)
    rbox(mb, x - 0.008, y + 0.02, z + h - 0.12, x + 0.008, y + 0.17, z + h, shade('#c8302a'), r=0.004)


def mailbox_cottage():
    """A little house on a post: walls in the mailbox's color, a shingled roof, a round-topped door for the letters,
    a window each side, a chimney."""
    body, main = MB(), MB()
    mb_post(main)
    rbox(body, -0.16, -0.22, 0.86, 0.16, 0.2, 1.14, col_fn('#ffffff', grain='z', under=0.1), r=0.015)
    # the roof: two boards of shingles, a darker line under each row; a brick chimney
    tile = rgb('#7a4a3a')
    gable(main, -0.16, 0.16, -0.22, 0.2, 1.13, 0.15, lambda p, n: tile * (0.82 if int((p.z - 1.1) / 0.03) % 2 else 1.0), over=0.05, t=0.035)
    rbox(main, 0.06, 0.02, 1.18, 0.12, 0.08, 1.34, stone('#b0583e', 3), r=0.008)
    # the door: cream, round topped, a brass knob; a window each side, white framed
    slab(main, [(-0.07, 0.88), (0.07, 0.88)] + [(math.cos(i * math.pi / 8) * 0.07, 1.02 + math.sin(i * math.pi / 8) * 0.07) for i in range(9)],
         0.02, col_fn(CREAM, grain='z'), axis='y', at=-0.235)
    ball(main, (0.04, -0.24, 0.96), 0.012, shade('#d8b860'), sub=1)
    for sx in (-1, 1):
        rbox(main, sx * 0.16 - 0.01, -0.08, 0.96, sx * 0.16 + 0.01, 0.06, 1.08, shade('#ffffff'), r=0.005)
        rbox(main, sx * 0.16 - 0.015, -0.06, 0.98, sx * 0.16 + 0.015, 0.04, 1.06, shade('#6a8aa8'), r=0.003)
    mb_flag(main, 0.17, 0.06, 0.9, 0.22)
    return [(body, 'body'), (main, 'main')]


def mailbox_lighthouse():
    """A lighthouse as tall as a mailbox: bands of the mailbox's color and white, a slot for the letters, a little
    gallery, the lamp lit, a red cap."""
    body, main = MB(), MB()
    rbox(main, -0.2, -0.2, 0, 0.2, 0.2, 0.06, stone(STONE, 5), r=0.015)
    r = lambda z: 0.16 - z * 0.055
    z, k = 0.06, 0
    while z < 1.0:
        z1 = min(1.0, z + 0.16)
        lathe(body if k % 2 == 0 else main, [(r(z), z), (r(z1), z1)], col_fn('#ffffff', under=0.0), seg=24, cap_top=False)
        z, k = z1, k + 1
    # the slot on the front, with a flap
    rbox(main, -0.07, -r(0.78) - 0.018, 0.74, 0.07, -r(0.78) + 0.01, 0.8, shade('#2a2420'), r=0.006)
    rbox(main, -0.075, -r(0.8) - 0.026, 0.79, 0.075, -r(0.8) + 0.0, 0.815, shade('#d8b860'), r=0.005)
    # the door
    slab(main, [(-0.04, 0.06), (0.04, 0.06)] + [(math.cos(i * math.pi / 6) * 0.04, 0.2 + math.sin(i * math.pi / 6) * 0.04) for i in range(7)],
         0.02, col_fn(WOOD, grain='z'), axis='y', at=-r(0.12) - 0.012)
    # the gallery, its rail, the lamp room and the cap
    cyl(main, 0, 0, 1.0, 1.03, 0.14, color=shade(IRON), seg=24)
    for i in range(12):
        a = i / 12 * math.tau
        rbox(main, math.cos(a) * 0.13 - 0.006, math.sin(a) * 0.13 - 0.006, 1.03, math.cos(a) * 0.13 + 0.006, math.sin(a) * 0.13 + 0.006, 1.1, shade(IRON), r=0.002)
    tube(main, [(math.cos(i / 24 * math.tau) * 0.13, math.sin(i / 24 * math.tau) * 0.13, 1.1) for i in range(25)], 0.008, shade(IRON), seg=5)
    glow = MB()
    cyl(glow, 0, 0, 1.03, 1.16, 0.075, color=shade('#ffe08a'), seg=16)
    for i in range(6):
        a = i / 6 * math.tau
        rbox(main, math.cos(a) * 0.078 - 0.007, math.sin(a) * 0.078 - 0.007, 1.03, math.cos(a) * 0.078 + 0.007, math.sin(a) * 0.078 + 0.007, 1.16, shade(IRON), r=0.002)
    lathe(main, [(0.1, 1.16), (0.1, 1.18), (0.03, 1.27), (0.0, 1.28)], shade('#c8302a'), seg=20)
    ball(main, (0, 0, 1.3), 0.02, shade(IRON), sub=1)
    return [(body, 'body'), (main, 'main'), (glow, 'glow')]


def mailbox_fish():
    """A fat fish on a post, mouth open for the letters: its body in the mailbox's color with scales, its fins a shade
    darker, big eyes."""
    body, main = MB(), MB()
    mb_post(main, 0.82)
    sc = col_fn('#ffffff', under=0.0)

    def scales(p, n):
        # rows of scales from behind the head to the tail, each row offset from the last
        row = (p.y + 0.15) * 20
        k = 1.0 if p.y < -0.15 else 0.9 + 0.1 * math.cos((row + 0.5 * (int(row) % 2) + math.atan2(p.z - 1.0, p.x) * 1.5) * math.tau)
        return sc(p, n) * k
    ball(body, (0, 0.0, 1.0), (0.14, 0.27, 0.15), scales, sub=4)
    g = col_fn('#b4b4b4', under=0.0)
    # the tail, the fin on top and the two at its sides (outlines across y and z)
    m = len(body.v)
    slab(body, [(0.22, 0.0), (0.38, 0.14), (0.42, 0.1), (0.4, 0.0), (0.42, -0.1), (0.38, -0.14)], 0.03, g, axis='x', at=-0.015)
    xform(body, m, Matrix.Translation((0, 0, 1.0)))
    m = len(body.v)
    slab(body, [(-0.08, 0.13), (0.06, 0.12), (0.12, 0.2), (0.0, 0.22)], 0.025, g, axis='x', at=-0.0125)
    xform(body, m, Matrix.Translation((0, 0, 1.0)))
    for sx in (-1, 1):
        ball(body, (sx * 0.13, -0.02, 0.93), (0.02, 0.07, 0.035), g, sub=2)
        ball(main, (sx * 0.1, -0.17, 1.05), (0.04, 0.04, 0.045), shade('#ffffff'), sub=2)
        ball(main, (sx * 0.125, -0.185, 1.05), (0.02, 0.022, 0.026), shade('#1e1a1a'), sub=2)
    # the mouth: a dark round opening and a lip round it
    m = len(main.v)
    lathe(main, [(0.06, 0.0), (0.075, 0.015), (0.06, 0.03)], shade('#e88a7a'), c=(0, -0.26, 0.98), seg=16, cap_top=False)
    xform(main, m, rot(x=math.pi / 2, at=(0, -0.26, 0.98)))
    ball(main, (0, -0.272, 0.98), (0.055, 0.01, 0.055), shade('#2a2020'), sub=2)
    mb_flag(main, 0.16, 0.08, 0.88, 0.3)
    return [(body, 'body'), (main, 'main')]


# ---------------------------------------------------------------- things seen only at certain times (33q_env_sights.js)
def fairy_mushroom():
    """A toadstool from the ring that comes up in the woods at night: a pale stem, a round cap that glows aqua (drawn
    unlit), paler spots, darker gills under it."""
    main, glow = MB(), MB()
    lathe(main, [(0.022, 0.0), (0.019, 0.04), (0.016, 0.08), (0.02, 0.1)], col_fn('#efe6d0', under=0.3), seg=12)
    lathe(main, [(0.02, 0.098), (0.06, 0.092), (0.064, 0.096)], shade('#b8b098'), seg=18, cap_top=False)
    top, low = rgb('#a8fff0'), rgb('#38b8d8')

    def cap(p, n):
        t = max(0.0, min(1.0, (p.z - 0.095) / 0.06))
        spot = noise.noise(p * 70) > 0.42
        return rgb('#f0fff8') if spot and t > 0.2 else low.lerp(top, t)
    lathe(glow, [(0.064, 0.096), (0.066, 0.104), (0.058, 0.125), (0.04, 0.143), (0.018, 0.152), (0.0, 0.154)], cap, seg=18)
    return [(main, 'main'), (glow, 'glow')]


def bunting(cols):
    """Holiday bunting across three tiles of the plaza (54_events.js decorateIsland): two posts, a rope sagging between
    them, little triangle flags hanging along it in turn."""
    mb = MB()
    for sx in (-1.38, 1.38):
        cyl(mb, sx, 0, 0, 1.32, 0.035, 0.03, wood(WOOD_D), seg=8, round_=0.01)
        ball(mb, (sx, 0, 1.34), 0.045, shade('#e8c048'), sub=2)
    rope = lambda x: 1.24 - 0.22 * (1 - (x / 1.38) ** 2)
    tube(mb, [(x / 10 * 1.38, 0, rope(x / 10 * 1.38)) for x in range(-10, 11)], 0.008, shade('#f2ead8'), seg=5)
    n = 11
    for i in range(n):
        x = -1.2 + i * 2.4 / (n - 1)
        z = rope(x)
        slab(mb, [(x - 0.095, z), (x, z - 0.22), (x + 0.095, z)], 0.012, shade(cols[i % len(cols)]), axis='y', at=-0.006)
    return [(mb, 'main')]


def bigtree_planter():
    """The square's big tree stands in a raised ring of rounded stones (David, 27 October: not a giant tree on the
    flagstones): two courses of stones under a capping, grass and soil inside with the tree's roots showing and little
    flowers round the edge. About three tiles across (the tiles round the tree that nobody walks on: 20_world.js); the
    game stretches it in depth to the grid and stands the tree on the soil at z 0.27."""
    mb, r = MB(), random.Random(41)
    R0, R1 = 1.42, 1.62
    for course, (z0, z1, n, off) in enumerate(((0.0, 0.15, 30, 0.0), (0.15, 0.29, 29, 0.5))):
        for k in range(n):
            a0, a1 = (k + off + 0.04) / n * math.tau, (k + off + 0.96) / n * math.tau
            c = r.choice(('#c4bcae', '#b8b0a2', '#cfc6b6', '#aea594'))
            m = len(mb.v)
            w = (a1 - a0) * (R0 + R1) / 2
            rbox(mb, -w / 2, R0 + r.uniform(-0.01, 0.02), z0 + 0.005, w / 2, R1 + r.uniform(-0.02, 0.01), z1 - 0.004 + r.uniform(-0.01, 0.01), stone(c, seed=k + course * 9), r=0.035)
            xform(mb, m, Matrix.Rotation((a0 + a1) / 2 - math.pi / 2, 4, 'Z'))
    lathe(mb, [(R1 + 0.03, 0.28), (R1 + 0.04, 0.31), (R1 + 0.02, 0.33), (R0 - 0.02, 0.33), (R0 - 0.04, 0.31), (R0 - 0.03, 0.27)], stone('#d6cebe'), seg=48, cap_top=False)
    # inside: soil darkening toward the wall, grass over it
    lathe(mb, [(R0 - 0.02, 0.25), (R0 - 0.3, 0.262), (0.0, 0.27)], lambda p, n, *_: rgb('#6aa846').lerp(rgb('#7a5a38'), max(0.0, min(1.0, (math.hypot(p.x, p.y) - (R0 - 0.32)) / 0.28)) * 0.6) * (0.9 + 0.12 * noise.noise(p * 6)), seg=48)
    for k in range(120):
        a, q = r.uniform(0, math.tau), math.sqrt(r.uniform(0.04, 1.0)) * (R0 - 0.1)
        x, y = math.cos(a) * q, math.sin(a) * q
        lathe(mb, [(0.026, 0.0), (0.0, 0.07 + r.uniform(0, 0.04))], shade(r.choice(('#5f9a3a', '#6aa848', '#78b450'))), c=(x, y, 0.265), seg=5)
    # the roots reaching out from the trunk into the soil
    bark = col_fn('#7a5230', grain='z', under=0.0)
    for k in range(6):
        a = k / 6 * math.tau + r.uniform(-0.2, 0.2)
        d, L = Vector((math.cos(a), math.sin(a), 0)), r.uniform(0.45, 0.8)
        side = Vector((-d.y, d.x, 0)) * r.uniform(-0.12, 0.12)
        tube(mb, [d * 0.12 + Vector((0, 0, 0.34)), d * L * 0.5 + side * 0.5 + Vector((0, 0, 0.3)), d * L * 0.8 + side + Vector((0, 0, 0.275)), d * L + side * 1.2 + Vector((0, 0, 0.262))], 0.06, bark, seg=7, r1=0.015)
    # little flowers round the inside of the wall
    for k in range(28):
        a = k / 28 * math.tau + r.uniform(-0.08, 0.08)
        q = R0 - 0.12 + r.uniform(-0.04, 0.03)
        x, y = math.cos(a) * q, math.sin(a) * q
        col = r.choice(('#f8f2f6', '#ffd84a', '#f48ab0', '#c8a0f0'))
        ball(mb, (x, y, 0.335), (0.036, 0.036, 0.01), shade(col), sub=1)
        ball(mb, (x, y, 0.342), 0.012, shade('#f8c040'), sub=1)
        lathe(mb, [(0.008, 0.0), (0.006, 0.07)], shade('#4a8a30'), c=(x, y, 0.265), seg=4, cap_top=False)
    return [(mb, 'main')]


PROPS = {
    'fountain': fountain, 'drinkfountain': drinkfountain, 'board': board, 'plaque': plaque, 'trashcan': trashcan, 'statue_david': statue,
    'signpost_trail': lambda: sign('trail'), 'signpost_farm': lambda: sign('farm'), 'signpost_camp': lambda: sign('camp'),
    'signpost_club': lambda: sign('club'), 'signpost_bonfire': lambda: sign('bonfire'), 'signboard': signboard,
    'windmill': windmill, 'well': well, 'scarecrow': scarecrow, 'hay': hay, 'crate': crate, 'wheelbarrow': wheelbarrow, 'trough': trough,
    'birdhouse': birdhouse, 'flamingo': flamingo, 'log': log,
    'tent_0': lambda: tent_ac(('#f08a3a', '#f4b060')), 'tent_1': lambda: tent_ac(('#3aa0a8', '#6ac8c8')), 'tent_2': lambda: tent_ac(('#e8c040', '#f4dc78')),
    'campfire': campfire, 'bonfire': lambda: campfire(True), 'picnic': picnic, 'telescope': telescope, 'viewer': viewer, 'tackle': tackle,
    'driftwood': driftwood, 'rock_a': lambda: rock(1), 'rock_b': lambda: rock(7), 'icecream': icecream, 'sandcastle': sandcastle,
    'volleyball': volleyball, 'noodle_cart': noodle_cart, 'barrel': barrel,
    'fairy_mushroom': fairy_mushroom, 'bunting': lambda: bunting(['#e85a5a', '#f8c040', '#5ab0e0', '#f088b0', '#7ac860']),
    'bunting_green': lambda: bunting(['#3a9a4a', '#8ad070', '#f4f0e0', '#5ab85a']), 'mailbox_cottage': mailbox_cottage, 'mailbox_lighthouse': mailbox_lighthouse, 'mailbox_fish': mailbox_fish,
    'bigtree_planter': bigtree_planter, 'reeds': reeds, 'lilypad': lilypad, 'lilypad_flower': lambda: lilypad(True), 'pebbles': pebbles, 'falls_rocks': falls_rocks,
}


def statue_doll():
    """David in bronze, from the doll kit, one arm up."""
    import doll
    spec = {'look': dict(hair='spiky', hairCol='#a87a3a', skin='#b8863e', eyes='#5a3a1a', beard='#a87a3a'),
            'clothes': dict(style='jacket', top='#a87a3a', trim='#c8964a', bottom='#9a6e34', shoes='#8a6230')}
    parts = doll.doll(spec, 'statue_', pose=0.0)
    # all of it cast in one bronze: each color's lightness picks a shade between dark and bright bronze
    dark, light = Vector(hex_rgb('#4a3014')[:3]), Vector(hex_rgb('#c89848')[:3])
    for o in parts:
        o.matrix_world = Matrix.Translation((0, 0, 0.9)) @ Matrix.Diagonal((1.15, 1.15, 1.15, 1)) @ o.matrix_world
        ca = o.data.color_attributes.get('Col')
        if ca:
            for d in ca.data:
                c = d.color
                lum = min(1.0, (0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]) * 1.6 + 0.15)
                v = dark.lerp(light, lum)
                d.color = (v.x, v.y, v.z, 1)
        for m in o.data.materials:
            m.name = 'statue_bronze_gloss'
    return parts


def build(name):
    out = PROPS[name]()
    objs, anchors = [], []
    extra = None
    if isinstance(out, tuple) and len(out) == 2 and isinstance(out[1], str):
        out, extra = out
    sails = None
    if isinstance(out, tuple) and len(out) == 3:
        out, sails, anchors = out
    for mb, part in out:
        objs.append(mb.obj(f'{name}_{part}', vmat(f'{name}_{part}', rough=0.35 if part == 'water' else 0.75)))
    if extra == 'statue_doll':
        objs += statue_doll()
    return objs, sails, anchors


def grid(path, objs_list, cols=8, cell=3.2, size=(1800, 1200)):
    ground_plane(color='#a8d088')
    light_rig()
    for k, objs in enumerate(objs_list):
        x, y = (k % cols) * cell, (k // cols) * cell * 0.9
        for o in objs:
            o.matrix_world = Matrix.Translation((x, y, 0)) @ o.matrix_world
    rows = (len(objs_list) + cols - 1) // cols
    camera(((cols - 1) * cell / 2, (rows - 1) * cell * 0.45, 0.4), dist=max(16, cols * cell * 1.05), pitch=38)
    render(path, size=size, samples=48)


if __name__ == '__main__':
    args = sys.argv[1:]
    prev = args[args.index('--preview') + 1] if '--preview' in args else None
    only = args[args.index('--only') + 1] if '--only' in args else None
    reset()
    shown = []
    for name in PROPS:
        if only and not name.startswith(only):
            continue
        objs, sails, anchors = build(name)
        es = anchor_empties(anchors, prefix='anchor_hub_') if anchors else []
        export(objs + es, name)
        if sails:
            so = [mb.obj(f'{name}_{part}', vmat(f'{name}_{part}')) for mb, part in sails]
            export(so, name + '_sails')
            for o in so:
                o.matrix_world = Matrix.Translation(anchors[0]) @ o.matrix_world
            objs = objs + so
        for e in es:
            bpy.data.objects.remove(e)
        shown.append(objs)
        print('built', name)
    if prev and shown:
        grid(os.path.join(prev, (only or 'props_island') + '.png'), shown, cols=min(8, len(shown)))
