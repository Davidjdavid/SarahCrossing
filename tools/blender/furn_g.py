"""Furniture, part seven: what was still a picture in the new look. The arcade's cabinets (a screen the game shows its
game on, live: *_screen) and the claw machine (its claw rides along the top: *_move), the sushi conveyor (its plates go
round: *_move), the holiday prizes, the island flag, and the shops' fittings: the easel the day's wallpaper stands on (its
canvas wears the picture: *_pic), the board a wall piece for sale hangs on (anchor_face), the mannequins' stand, a vase
for flowers on a table, the arcade's back door."""
import math
from mathutils import Vector, Matrix
from trees_ac import rgb
from kit import col_fn, shade, rbox, lathe, tube, xform, cyl, slab
from folks import ball
from furn_kit import *


def quad(mb, x0, x1, z0, z1, y):
    """a flat face toward the room (-y) at y: a picture's or a screen's"""
    mb.add([(x0, y, z0), (x1, y, z0), (x1, y, z1), (x0, y, z1)], [(1, 1, 1)] * 4, [(0, -1, 0)] * 4, [(0, 1, 2), (0, 2, 3)])


def tilt(mb, mark, a, pivot):
    """what was made since mark, leaned back by a (radians) about a line along x through pivot"""
    pv = Vector(pivot)
    xform(mb, mark, Matrix.Translation(pv) @ Matrix.Rotation(a, 4, 'X') @ Matrix.Translation(-pv))


def star(r0, r1, n=5, a0=math.pi / 2):
    return [(math.cos(a0 + k * math.pi / n) * (r0 if k % 2 == 0 else r1), math.sin(a0 + k * math.pi / n) * (r0 if k % 2 == 0 else r1)) for k in range(2 * n)]


# ---------------------------------------------------------------- the arcade
CABS = {    # each game's cabinet: its body, the marquee's light and the stripe down the sides
    'blocks': ('#c0283a', '#ffd45a', '#2a2228'), 'capsules': ('#f2f0ea', '#e0405a', '#8cc152'),
    'fruit': ('#ff8a3a', '#8cc152', '#ffd84a'), 'stack': ('#7acc5e', '#ffd0e0', '#d8283f'),
    'surf': ('#3a9ad8', '#ffd84a', '#f2f0ea'), 'garden': ('#8a5a3a', '#7acc5e', '#ffd84a'),
    'noodle': ('#f2c84a', '#d84a3a', '#f2f0ea'), 'dumpling': ('#ff8aa8', '#ffffff', '#c0283a'),
    'sushi': ('#2a2a3a', '#ff8a6a', '#f2f0ea'), 'fortune': ('#d8283f', '#ffd84a', '#2a2228'),
}


def cabinet_arcade(P, body, light, stripe):
    """An upright cabinet: the body, cheeks either side of a screen leaned back toward the player, a control shelf with
    a joystick and three buttons, a lit marquee, a coin door."""
    mb, W = P.main, 0.74
    paint_b = paint(body)
    rbox(mb, -W / 2 + 0.05, -0.25, 0.04, W / 2 - 0.05, 0.3, 0.74, paint_b, r=0.03)
    rbox(mb, -W / 2 + 0.03, -0.24, 0.0, W / 2 - 0.03, 0.29, 0.06, '#2a2228', r=0.02)
    # the cheeks, floor to top, framing the screen
    for x0 in (-W / 2, W / 2 - 0.07):
        rbox(mb, x0, -0.27, 0.0, x0 + 0.07, 0.31, 1.47, paint_b, r=0.03)
        # (a stripe down the outside of each cheek)
        xs = x0 - 0.006 if x0 < 0 else x0 + 0.064
        for z0, z1 in ((0.92, 1.02), (0.4, 0.46)):
            rbox(mb, xs, -0.25, z0, xs + 0.012, 0.29, z1, paint(stripe), r=0.005, mid=0)
    rbox(mb, -W / 2 + 0.05, -0.08, 0.74, W / 2 - 0.05, 0.3, 1.25, paint_b, r=0.03)
    # the screen in its bezel, leaned back a little toward the player
    m, ms = len(mb.v), len(P.screen.v)
    rbox(mb, -0.3, -0.15, 0.84, 0.3, -0.07, 1.22, '#1c1a22', r=0.025)
    quad(P.screen, -0.255, 0.255, 0.885, 1.19, -0.152)
    tilt(mb, m, 0.22, (0, -0.11, 0.84))
    tilt(P.screen, ms, 0.22, (0, -0.11, 0.84))
    # the control shelf: a joystick and buttons
    rbox(mb, -W / 2 + 0.06, -0.38, 0.72, W / 2 - 0.06, -0.05, 0.8, '#2a2228', r=0.025)
    rbox(mb, -W / 2 + 0.07, -0.37, 0.795, W / 2 - 0.07, -0.06, 0.81, paint(stripe), r=0.006, mid=0)
    cyl(mb, -0.14, -0.22, 0.8, 0.88, 0.012, color=metal('#c8c8d0'), seg=8)
    ball(mb, (-0.14, -0.22, 0.9), 0.035, shade('#e0303a'), sub=2)
    for k, c in enumerate((light, '#4ec3d9', '#f2f0ea')):
        cyl(mb, 0.02 + k * 0.08, -0.2 + 0.02 * k, 0.8, 0.825, 0.024, color=shade(c), seg=12, round_=0.008)
    # the marquee, lit
    rbox(mb, -W / 2 + 0.04, -0.2, 1.25, W / 2 - 0.04, 0.3, 1.47, paint_b, r=0.03)
    rbox(P.glow, -0.31, -0.215, 1.28, 0.31, -0.19, 1.44, col_fn(light, under=0.0), r=0.02)
    # the coin door
    rbox(mb, -0.12, -0.275, 0.3, 0.12, -0.24, 0.56, '#3a3440', r=0.012)
    for x in (-0.05, 0.05):
        rbox(P.glow, x - 0.012, -0.282, 0.46, x + 0.012, -0.27, 0.5, '#ff9a3a', r=0.004, mid=0)


for _g, (_b, _l, _s) in CABS.items():
    item('cab_' + _g, 1, 1)(lambda P, b=_b, l=_l, s=_s: cabinet_arcade(P, b, l, s))


@item('claw_machine', 2, 1)
def claw_machine(P):
    """A double claw machine: a pink base, a glass case heaped with plushies, the claw hanging from the top on its
    cable (the game moves it along), a lit canopy with a row of bulbs, a joystick and button, the prize chute."""
    mb = P.main
    rbox(mb, -0.86, -0.36, 0.0, 0.86, 0.36, 0.6, paint('#ff8ab0'), r=0.04)
    rbox(mb, -0.87, -0.37, 0.52, 0.87, 0.37, 0.6, '#fff4f8', r=0.02)
    glass_box(P, -0.82, -0.32, 0.6, 0.82, 0.32, 1.32, frame='#fff4f8')
    rbox(mb, -0.88, -0.38, 1.32, 0.88, 0.38, 1.52, paint('#ff8ab0'), r=0.04)
    for k in range(13):
        ball(P.glow, (-0.78 + k * 0.13, -0.385, 1.42), 0.025, '#fff0b0', sub=1)
    # the plushies: round, eared, all colors (the prize chute on the right left clear)
    rng = P.rng
    cols = ('#ffd84a', '#7ab0ff', '#ff7aa8', '#8cc152', '#f28a3a', '#b37cf0', '#f2f0ea', '#4ec3d9')
    for k in range(18):
        x, y = rng.uniform(-0.74, 0.42), rng.uniform(-0.24, 0.24)
        z = 0.66 + rng.uniform(0.0, 0.12)
        r, c = rng.uniform(0.06, 0.085), rng.choice(cols)
        ball(mb, (x, y, z), (r, r * 0.9, r * 0.92), fabric(c, seed=k), sub=2)
        for s in (-1, 1):
            ball(mb, (x + s * r * 0.6, y, z + r * 0.8), r * 0.32, fabric(c, seed=k + 9), sub=1)
        ball(mb, (x - r * 0.3, y - r * 0.85, z + r * 0.15), 0.008, '#2a2228', sub=1)
        ball(mb, (x + r * 0.3, y - r * 0.85, z + r * 0.15), 0.008, '#2a2228', sub=1)
    # the chute: a clear wall round the hole on the right, a flap low on the front
    rbox(P.clear, 0.5, -0.3, 0.6, 0.52, 0.3, 0.86, col_fn('#e4f4fa', under=0.0), r=0.005, mid=0)
    rbox(mb, 0.5, -0.385, 0.12, 0.78, -0.355, 0.36, '#3a3440', r=0.015)
    # the joystick and the button
    rbox(mb, -0.5, -0.46, 0.46, 0.1, -0.34, 0.54, '#fff4f8', r=0.02)
    cyl(mb, -0.3, -0.4, 0.54, 0.62, 0.012, color=metal('#c8c8d0'), seg=8)
    ball(mb, (-0.3, -0.4, 0.64), 0.034, shade('#e0303a'), sub=2)
    cyl(mb, -0.08, -0.4, 0.54, 0.565, 0.03, color=shade('#ffd84a'), seg=12, round_=0.01)
    # the claw on its cable: its own part, which the game slides along the top
    cl = P.move
    cyl(cl, 0, 0, 1.06, 1.32, 0.006, color=metal('#8a96a8'), seg=6)
    ball(cl, (0, 0, 1.05), (0.045, 0.045, 0.035), metal('#c8ccd8'), sub=2)
    for k in range(3):
        a = k * math.tau / 3
        tube(cl, [(0, 0, 1.04), (math.cos(a) * 0.06, math.sin(a) * 0.06, 0.98), (math.cos(a) * 0.045, math.sin(a) * 0.045, 0.92)], 0.008, metal('#c8ccd8'), seg=6)


@item('sushi_conveyor', 3, 1)
def sushi_conveyor(P):
    """A counter with a belt along its top and plates of sushi riding it (their own part: the game moves them along,
    each end's cover hiding where they come round)."""
    mb = P.main
    rbox(mb, -1.38, -0.36, 0.0, 1.38, 0.36, 0.7, wood('#a8743a'), r=0.03)
    rbox(mb, -1.4, -0.38, 0.7, 1.4, 0.38, 0.75, wood('#e8d0a0'), r=0.02)
    belt = lambda p, n: rgb('#5a5a64') * (0.85 + 0.15 * (math.sin(p.x * 70) > 0.6))
    rbox(mb, -1.2, -0.13, 0.75, 1.2, 0.13, 0.775, belt, r=0.008, mid=1)
    for xa, xb in ((-1.38, -1.06), (1.06, 1.38)):
        rbox(mb, xa, -0.18, 0.75, xb, 0.18, 0.9, paint('#c0283a'), r=0.04)
    rng = P.rng
    for k in range(6):
        x = -1.2 + k * 0.4
        rim = ('#4a7ad8', '#e0303a', '#ffd84a')[k % 3]
        lathe(P.move, [(0.0, 0.78), (0.1, 0.78), (0.12, 0.8), (0.11, 0.805), (0.0, 0.795)], lambda p, n, *_, r=rim: rgb(r) if math.hypot(p.x - x, p.y) > 0.085 else rgb('#fbf8f2'), c=(x, 0, 0), seg=18)
        if k % 2 == 0:
            for dx in (-0.035, 0.035):
                rbox(P.move, x + dx - 0.028, -0.05, 0.8, x + dx + 0.028, 0.05, 0.84, '#fbf8f0', r=0.015)
                rbox(P.move, x + dx - 0.031, -0.055, 0.835, x + dx + 0.031, 0.055, 0.855, ('#f28a6a', '#e04050')[k % 4 // 2], r=0.01)
        else:
            for dx in (-0.04, 0.04):
                cyl(P.move, x + dx, 0, 0.8, 0.86, 0.034, color=shade('#2a3a2a'), seg=12)
                cyl(P.move, x + dx, 0, 0.86, 0.862, 0.026, color=shade('#fbf8f0'), seg=12)
                ball(P.move, (x + dx, 0, 0.862), (0.012, 0.012, 0.006), shade(('#f28a6a', '#8cc152', '#ffd84a')[k % 3]), sub=1)


# ---------------------------------------------------------------- the holidays' prizes
@item('toy_star', 1, 1)
def toy_star(P):
    """Toy Day's star lamp: a gold star on a tall pole, lit."""
    lathe(P.main, [(0.15, 0.0), (0.15, 0.04), (0.05, 0.07), (0.0, 0.07)], wood('#6b4a2b'), seg=20)
    cyl(P.main, 0, 0, 0.06, 1.15, 0.018, color=metal('#8a8a9a'), seg=8)
    m = len(P.glow.v)
    slab(P.glow, star(0.22, 0.095), 0.07, col_fn('#ffd84a', under=0.0), axis='y', at=-0.035, r=0.02)
    xform(P.glow, m, Matrix.Translation((0, 0, 1.32)))


@item('recycle_bin', 1, 1)
def recycle_bin(P):
    """Cuke's recycling bin: green, a darker lid, the three white arrows round on its front."""
    mb = P.main
    lathe(mb, [(0.0, 0.0), (0.2, 0.0), (0.24, 0.6), (0.0, 0.6)], paint('#4f9a5a'), seg=28)
    lathe(mb, [(0.0, 0.6), (0.26, 0.6), (0.26, 0.65), (0.2, 0.68), (0.0, 0.69)], paint('#2f6a3a'), seg=28)
    for k in range(3):
        a0 = k * math.tau / 3 + 0.25
        pts = [(math.cos(a0 + t * 1.7) * 0.075, -0.235, 0.33 + math.sin(a0 + t * 1.7) * 0.075) for t in (0.0, 0.33, 0.66, 1.0)]
        tube(mb, pts, 0.012, '#ffffff', seg=6)
        ball(mb, pts[-1], (0.022, 0.012, 0.022), '#ffffff', sub=1)


def wood_stand(mb, w=0.12, d=0.08, h=0.045):
    rbox(mb, -w, -d, 0.0, w, d, h, wood('#6b4a2b'), r=0.012)
    rbox(mb, -w * 0.8, -d * 0.8, h, w * 0.8, d * 0.8, h + 0.015, wood('#a8743a'), r=0.006)


GOLD = lambda p, n: rgb('#ffd84a').lerp(rgb('#b8860b'), 0.45 * max(0.0, -n.z) + 0.2 * max(0.0, n.x)) * (1.06 if n.z > 0.6 else 1.0)


@item('golden_egg', 1, 1)
def golden_egg(P):
    wood_stand(P.main, 0.09, 0.09)
    lathe(P.main, [(0.04, 0.06), (0.05, 0.075), (0.045, 0.08)], wood('#a8743a'), seg=16)
    ball(P.gloss, (0, 0, 0.16), (0.07, 0.07, 0.095), GOLD, sub=3)


@item('fish_trophy', 1, 1)
def fish_trophy(P):
    wood_stand(P.main)
    cyl(P.gloss, 0, 0, 0.06, 0.15, 0.014, color=GOLD, seg=10)
    ball(P.gloss, (0, 0, 0.21), (0.1, 0.035, 0.055), GOLD, sub=3)
    slab(P.gloss, [(0.08, 0.21), (0.17, 0.15), (0.15, 0.21), (0.17, 0.27)], 0.02, GOLD, axis='y', at=-0.01, r=0.006)
    slab(P.gloss, [(-0.02, 0.25), (0.05, 0.25), (0.03, 0.29)], 0.015, GOLD, axis='y', at=-0.0075, r=0.004)
    ball(P.main, (-0.06, -0.03, 0.225), 0.009, '#3b2a45', sub=1)


@item('candy_bowl', 1, 1)
def candy_bowl(P):
    """A pumpkin bowl heaped with candy, a carved face on its front."""
    mb = P.main
    pumpkin = lambda p, n: rgb('#ff8a3a') * (0.84 + 0.16 * abs(math.cos(math.atan2(p.y, p.x) * 4)))
    lathe(mb, [(0.0, 0.0), (0.08, 0.005), (0.13, 0.04), (0.14, 0.08), (0.12, 0.115), (0.11, 0.12), (0.1, 0.1), (0.0, 0.09)], lambda p, n, *_: pumpkin(p, n), seg=32)
    for x, w in ((-0.05, 0.022), (0.05, 0.022)):
        slab(mb, [(x - w, 0.07), (x + w, 0.07), (x, 0.095)], 0.01, '#3b2a45', axis='y', at=-0.143, r=0.0)
    slab(mb, [(-0.06, 0.04), (-0.04, 0.025), (0.04, 0.025), (0.06, 0.04)], 0.01, '#3b2a45', axis='y', at=-0.141, r=0.0)
    rng = P.rng
    for k in range(14):
        a, r = rng.uniform(0, math.tau), rng.uniform(0, 0.08)
        c = rng.choice(('#ff7aa8', '#ffd84a', '#7acc5e', '#7ab0ff', '#ffffff', '#e0303a'))
        rbox(mb, math.cos(a) * r - 0.018, math.sin(a) * r - 0.012, 0.1 + rng.uniform(0, 0.03), math.cos(a) * r + 0.018, math.sin(a) * r + 0.012, 0.125 + rng.uniform(0, 0.03), c, r=0.008)


@item('golden_spoon', 1, 1)
def golden_spoon(P):
    wood_stand(P.main, 0.1, 0.07)
    tube(P.gloss, [(0, 0, 0.06), (0, 0.0, 0.16)], 0.011, GOLD, seg=8)
    ball(P.gloss, (0, 0, 0.22), (0.045, 0.02, 0.06), GOLD, sub=3)


# ---------------------------------------------------------------- the Town Hall's flag
@item('island_flag', 1, 1)
def island_flag(P):
    """The island's flag on the wall: a little pole with a brass top on the left and the cloth (the flag itself, painted
    by the game from the Town Hall's design: *_pic) flying from it."""
    tube(P.main, [(-0.46, -0.05, -0.5), (-0.46, -0.05, 0.47)], 0.025, wood('#7a5234'), seg=8)
    ball(P.main, (-0.46, -0.05, 0.5), 0.035, metal('#e8c070'), sub=2)
    rbox(P.main, -0.5, -0.03, -0.12, -0.42, 0.0, -0.02, metal('#8a8a9a'), r=0.008)
    quad(P.pic, -0.43, 0.48, -0.15, 0.42, -0.05)


# ---------------------------------------------------------------- the shops' fittings
@item('shop_easel', 1, 1)
def shop_easel(P):
    """The easel Fortune stands the day's wallpaper on: an A-frame, a ledge, a canvas leaning back on it whose face is
    the sample (*_pic)."""
    mb, w = P.main, wood('#a8743a')
    for s in (-1, 1):
        tube(mb, [(s * 0.2, -0.1, 0.0), (s * 0.06, 0.02, 1.22)], 0.022, w, seg=8)
    tube(mb, [(0.0, 0.3, 0.0), (0.0, 0.04, 1.12)], 0.02, w, seg=8)
    rbox(mb, -0.27, -0.14, 0.48, 0.27, -0.04, 0.52, w, r=0.012)
    m, mp = len(mb.v), len(P.pic.v)
    rbox(mb, -0.28, -0.085, 0.52, 0.28, -0.05, 1.1, '#fbf8f2', r=0.01)
    quad(P.pic, -0.26, 0.26, 0.54, 1.08, -0.088)
    rbox(mb, -0.05, -0.1, 1.08, 0.05, -0.04, 1.13, w, r=0.01)
    tilt(mb, m, 0.12, (0, -0.07, 0.52))
    tilt(P.pic, mp, 0.12, (0, -0.07, 0.52))


@item('shop_board', 2, 1)
def shop_board(P):
    """The board a wall piece for sale hangs on in Fortune's: a cream panel in a wooden frame on two legs; the piece
    itself (its own model) hangs at anchor_face."""
    mb, w = P.main, wood('#9a6b45')
    for x in (-0.9, 0.9):
        rbox(mb, x - 0.04, -0.03, 0.0, x + 0.04, 0.03, 0.45, wood('#8a5a33'), r=0.015)
        rbox(mb, x - 0.16, -0.12, 0.0, x + 0.16, 0.12, 0.05, wood('#6b4a2a'), r=0.02)
    rbox(mb, -1.1, -0.05, 0.42, 1.1, 0.05, 1.5, w, r=0.035)
    rbox(mb, -1.0, -0.065, 0.5, 1.0, 0.0, 1.42, col_fn('#f2e6cc', mottle=0.02, under=0.0), r=0.01, mid=1)
    rbox(mb, 0.62, -0.075, 0.54, 0.9, -0.06, 0.66, '#fbf8f2', r=0.006, mid=0)
    P.anchors['face'] = Vector((0.0, -0.07, 0.96))


@item('mannequin_stand', 1, 1)
def mannequin_stand(P):
    """What a mannequin stands on in Clementine's: a round wooden base with a brass rim, a brass pole up to the hips."""
    lathe(P.main, [(0.0, 0.0), (0.2, 0.0), (0.21, 0.02), (0.2, 0.045), (0.0, 0.045)], wood('#5a3a2a'), seg=28)
    lathe(P.main, [(0.205, 0.035), (0.215, 0.04), (0.205, 0.048)], metal('#d8b858'), seg=28, cap_top=False)
    cyl(P.main, 0, 0.02, 0.045, 0.5, 0.012, color=metal('#d8b858'), seg=8)


@item('flower_vase', 1, 1)
def flower_vase(P):
    """A vase for flowers on a table (the flowers themselves stand in it at anchor_top)."""
    glaze = lambda p, n: rgb('#e8f0f8').lerp(rgb('#7aa0d8'), max(0.0, min(1.0, (0.12 - p.z) / 0.1)))
    lathe(P.gloss, [(0.0, 0.0), (0.045, 0.0), (0.06, 0.04), (0.055, 0.1), (0.035, 0.14), (0.04, 0.16), (0.03, 0.16), (0.0, 0.15)], lambda p, n, *_: glaze(p, n), seg=24)
    P.anchors['top'] = Vector((0, 0, 0.15))


@item('arcade_backdoor', 1, 1)
def arcade_backdoor(P):
    """The back room's door in the arcade, on the wall: purple panels, a gold knob, a STAFF ONLY plate. Its back on the
    wall (y 0), its foot on the floor at the origin."""
    mb = P.main
    rbox(mb, -0.44, -0.04, 0.0, 0.44, 0.0, 1.5, '#3b2a45', r=0.02)
    rbox(mb, -0.38, -0.07, 0.0, 0.38, -0.02, 1.42, paint('#5a4060'), r=0.015)
    for z0, z1 in ((0.12, 0.62), (0.72, 1.06)):
        rbox(mb, -0.3, -0.085, z0, 0.3, -0.06, z1, paint('#6a4c72'), r=0.012)
    ball(mb, (0.28, -0.1, 0.68), 0.03, metal('#ffd84a'), sub=2)
    rbox(mb, -0.3, -0.09, 1.14, 0.3, -0.07, 1.32, '#f2e6c8', r=0.01)
    for k in range(7):
        rbox(mb, -0.24 + k * 0.07, -0.096, 1.2, -0.2 + k * 0.07, -0.088, 1.26, '#c0283a', r=0.003, mid=0)


@item('diner_stool', 1, 1)
def diner_stool(P):
    """Mac's stools (David, 27 October: every seat at the restaurant a stool, so the round folks fit): a fat red cushion
    with white piping on a short chrome post and a round foot, no back; the seat at a chair's height (0.46)."""
    steel = lambda p, n, *_: rgb('#c8ccd4') * (0.72 + 0.34 * max(0.0, n.z * 0.5 + 0.5))
    lathe(P.gloss, [(0.0, 0.0), (0.17, 0.0), (0.18, 0.012), (0.16, 0.026), (0.05, 0.036), (0.0, 0.036)], steel, seg=28)
    cyl(P.gloss, 0, 0, 0.03, 0.34, 0.032, 0.03, steel, seg=12)
    lathe(P.gloss, [(0.0, 0.33), (0.13, 0.335), (0.16, 0.35), (0.0, 0.352)], steel, seg=24)
    vinyl = lambda p, n, *_: rgb('#d8343a') * (0.8 + 0.22 * max(0.0, n.z))
    lathe(P.gloss, [(0.0, 0.35), (0.19, 0.352), (0.215, 0.37), (0.225, 0.4), (0.22, 0.43), (0.2, 0.452), (0.12, 0.462), (0.0, 0.464)], vinyl, seg=32)
    ring = [(math.cos(k / 32 * math.tau) * 0.224, math.sin(k / 32 * math.tau) * 0.224, 0.405) for k in range(33)]
    tube(P.main, ring, 0.009, shade('#fbf6ee'), seg=6)
    P.top(0.46)
