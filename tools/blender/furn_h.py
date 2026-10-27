"""Furniture, part eight: the museum's wings (65a_museum_wings.js). The archway from the entrance hall into each wing (on
the back wall, a stone arch round a dim opening, the wing's name on a plaque above it: *_pic, lettered by the game), the
aquarium's tank (a glass tank on a wooden stand, a sea-blue backdrop behind sand, stones and weed; the game puts the fish
in and swims them), the touch pool (a low stone basin of water over sand, where the shellfish sit) and the glass case on
a plinth that each of the island's old mysteries' keepsakes stands in (anchor_top: where the keepsake stands)."""
import math
from mathutils import Vector
from trees_ac import rgb
from kit import col_fn, shade, rbox, lathe, tube, cyl, slab
from folks import ball
from furn_kit import *


def quad(mb, x0, x1, z0, z1, y):
    """a flat face toward the room (-y) at y: the plaque's lettering"""
    mb.add([(x0, y, z0), (x1, y, z0), (x1, y, z1), (x0, y, z1)], [(1, 1, 1)] * 4, [(0, -1, 0)] * 4, [(0, 1, 2), (0, 2, 3)])


def stone(c='#e8e2d6'):
    return col_fn(c, mottle=0.05, under=0.14)


@item('museum_arch', 1, 1)
def museum_arch(P):
    """A doorway through the hall's back wall into a wing: two stone pilasters with a round arch over them and a keystone,
    the opening dim and warm with the wing's floor running in, a plaque above for its name. Its back on the wall (y 0),
    its foot on the floor at the origin."""
    mb, st = P.main, stone()
    W, top = 0.42, 1.22                          # (the opening's half width, where the arch springs)
    # the opening: a dim recess (a warm gradient, darker up high) over a stone threshold
    def dim(p, n, z0=0, z1=1):
        t = max(0.0, min(1.0, p.z / 1.7))
        return rgb('#5a463e').lerp(rgb('#2a2026'), t)
    pts = [(-W, 0.0)] + [(math.cos(math.pi - k / 16 * math.pi) * W, top + math.sin(math.pi - k / 16 * math.pi) * W) for k in range(17)] + [(W, 0.0)]
    slab(mb, pts, 0.02, dim, axis='y', at=-0.005)
    rbox(mb, -W - 0.04, -0.07, 0.0, W + 0.04, 0.0, 0.02, stone('#d8d0c0'), r=0.008, mid=0)
    # the pilasters, with a base and a capital each
    for s in (-1, 1):
        x0, x1 = (W, W + 0.12) if s > 0 else (-W - 0.12, -W)
        rbox(mb, x0 - 0.02, -0.11, 0.0, x1 + 0.02, 0.0, 0.1, st, r=0.015, mid=1)
        rbox(mb, x0, -0.09, 0.1, x1, 0.0, top - 0.06, st, r=0.02, mid=1)
        rbox(mb, x0 - 0.025, -0.11, top - 0.08, x1 + 0.025, 0.0, top, st, r=0.015, mid=1)
    # the arch: a round band of stone over the opening, a keystone at its crown
    ring = [(math.cos(math.pi - k / 20 * math.pi) * (W + 0.06), -0.05, top + math.sin(math.pi - k / 20 * math.pi) * (W + 0.06)) for k in range(21)]
    tube(mb, ring, 0.065, st, seg=8)
    rbox(mb, -0.07, -0.13, top + W - 0.02, 0.07, 0.0, top + W + 0.16, stone('#d8d0c0'), r=0.02, mid=1)
    # the plaque for the wing's name: a gilt-edged board, its face lettered by the game
    rbox(mb, -0.56, -0.05, 1.86, 0.56, 0.0, 2.16, metal('#c8a048'), r=0.02, mid=1)
    rbox(mb, -0.52, -0.06, 1.89, 0.52, -0.04, 2.13, paint('#2c2a3a'), r=0.012, mid=0)
    quad(P.pic, -0.5, 0.5, 1.9, 2.12, -0.062)


@item('fish_tank', 3, 1)
def fish_tank(P):
    """The aquarium's tank: a glass tank on a wooden stand with doors, a hood with a light along its front, inside a
    sea-blue backdrop (lighter up high), sand, a few round stones and ribbons of weed. The fish are the game's."""
    rng, mb = P.rng, P.main
    W, D = 2.76, 0.78
    cabinet(P, W, D, 0.56, '#7a5236', doors=3, knob='#d8b060', top_col='#5a3a26')
    z0, z1 = 0.56, 1.42
    # the backdrop and the floor of the tank
    def sea(p, n, a=0, b=1):
        t = max(0.0, min(1.0, (p.z - z0) / (z1 - z0)))
        return rgb('#1e5a8a').lerp(rgb('#7ac8e8'), t)
    rbox(mb, -W / 2 + 0.03, D / 2 - 0.06, z0, W / 2 - 0.03, D / 2 - 0.03, z1 - 0.02, sea, r=0.006, mid=0)
    sand = col_fn('#e8d8a8', mottle=0.1, under=0.0)
    rbox(mb, -W / 2 + 0.03, -D / 2 + 0.03, z0, W / 2 - 0.03, D / 2 - 0.06, z0 + 0.07, sand, r=0.01, mid=1)
    for k in range(9):
        x, y, r = -1.2 + k * 0.3 + rng.uniform(-0.08, 0.08), rng.uniform(0.0, 0.22), rng.uniform(0.04, 0.08)
        ball(mb, (x, y, z0 + 0.06), r, stone(rng.choice(('#a8a098', '#8a8478', '#c8bca8'))), sub=2)
    for k in range(7):
        x, y, h = -1.25 + k * 0.42 + rng.uniform(-0.1, 0.1), rng.uniform(0.05, 0.26), rng.uniform(0.3, 0.6)
        pts = [(x + math.sin(t * 2.4 + k) * 0.04, y, z0 + 0.06 + t * h) for t in (0.0, 0.25, 0.5, 0.75, 1.0)]
        tube(mb, pts, 0.016, col_fn(rng.choice(('#3a9a4a', '#5ab05a', '#2a7a40')), under=0.0), seg=5)
    # the glass, and the hood over it with its light
    glass_box(P, -W / 2, -D / 2, z0, W / 2, D / 2, z1, frame='#3a2a22')
    rbox(mb, -W / 2 - 0.02, -D / 2 - 0.02, z1, W / 2 + 0.02, D / 2 + 0.02, z1 + 0.1, wood('#5a3a26'), r=0.02, mid=1)
    rbox(P.glow, -W / 2 + 0.1, -D / 2 - 0.025, z1 + 0.02, W / 2 - 0.1, -D / 2 - 0.015, z1 + 0.05, '#fff2c8', r=0.004, mid=0)


@item('touch_pool', 3, 1)
def touch_pool(P):
    """The touch pool: a low basin of rounded stones, water over sand, a few stones and a shell; the shellfish are the
    game's (they sit on the sand, under the water)."""
    rng, mb = P.rng, P.main
    W, D, h = 2.7, 0.84, 0.42
    st = stone('#c8c0b0')
    for (x0, y0, x1, y1) in ((-W / 2, -D / 2, W / 2, -D / 2 + 0.12), (-W / 2, D / 2 - 0.12, W / 2, D / 2),
                             (-W / 2, -D / 2, -W / 2 + 0.12, D / 2), (W / 2 - 0.12, -D / 2, W / 2, D / 2)):
        rbox(mb, x0, y0, 0.0, x1, y1, h, st, r=0.04, mid=1)
    rbox(mb, -W / 2 + 0.1, -D / 2 + 0.1, 0.0, W / 2 - 0.1, D / 2 - 0.1, 0.12, col_fn('#e8d8a8', mottle=0.1, under=0.0), r=0.01, mid=1)
    for k in range(6):
        ball(mb, (-1.1 + k * 0.44 + rng.uniform(-0.1, 0.1), rng.uniform(-0.2, 0.2), 0.12), rng.uniform(0.03, 0.06), stone('#9a9488'), sub=2)
    # the water: clear, a little blue
    rbox(P.clear, -W / 2 + 0.1, -D / 2 + 0.1, 0.12, W / 2 - 0.1, D / 2 - 0.1, h - 0.05, col_fn('#5ab8e0', under=0.0), r=0.01, mid=0)
    P.top(0.13)


@item('display_case', 1, 1)
def display_case(P):
    """A glass case on a plinth for a keepsake: a dark wood plinth with a moulded top, a velvet pad, the glass over it
    (anchor_top: where the keepsake stands)."""
    mb = P.main
    rbox(mb, -0.3, -0.28, 0.0, 0.3, 0.28, 0.08, wood('#4a2e22'), r=0.015, mid=1)
    rbox(mb, -0.26, -0.24, 0.08, 0.26, 0.24, 0.74, wood('#5a3a28'), r=0.02, mid=1)
    rbox(mb, -0.3, -0.28, 0.74, 0.3, 0.28, 0.82, wood('#4a2e22'), r=0.015, mid=1)
    rbox(mb, -0.24, -0.22, 0.82, 0.24, 0.22, 0.85, fabric('#8a1e2e'), r=0.01, mid=1)
    rbox(mb, -0.12, -0.282, 0.36, 0.12, -0.27, 0.46, metal('#c8a048'), r=0.006, mid=0)
    glass_box(P, -0.26, -0.24, 0.85, 0.26, 0.24, 1.32, frame='#c8a048')
    P.top(0.85)
