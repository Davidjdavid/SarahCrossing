"""Furniture, part five: the little things that stand on tables and counters (lamps, vases, plants, a typewriter, a
globe, cakes, jars, trophies, the register...), each small enough to stand on a tabletop (EnvRoom stands it on its
table's anchor_top)."""
import math
from mathutils import Vector, Matrix, Euler, noise
from trees_ac import rgb
from kit import col_fn, shade, rbox, lathe, tube, xform, cyl, slab
from folks import ball, surf, superq, revolve, mottle
from furn_kit import *


def gold():
    return col_fn('#e8b840', under=0.08)


def cup_trophy(P, cup='#e8b840', emblem=None, h=0.42):
    """a trophy cup on a stepped base, two handles, an emblem on its front"""
    mb = P.main
    rbox(mb, -0.11, -0.11, 0.0, 0.11, 0.11, 0.06, wood('#5a3a2a'), r=0.012, mid=1)
    rbox(mb, -0.08, -0.08, 0.06, 0.08, 0.08, 0.1, wood('#6a4a32'), r=0.01, mid=1)
    lathe(P.gloss, [(0.03, 0.1), (0.015, 0.16), (0.02, 0.2), (0.09, h * 0.62), (0.1, h * 0.85), (0.11, h), (0.09, h)], col_fn(cup, under=0.05), seg=20, cap_top=True)
    for s in (-1, 1):
        tube(P.gloss, [(s * 0.09, 0, h * 0.85), (s * 0.15, 0, h * 0.78), (s * 0.13, 0, h * 0.6), (s * 0.07, 0, h * 0.55)], 0.012, col_fn(cup, under=0.0), seg=6)
    if emblem:
        ball(mb, (0, -0.095, h * 0.68), (0.035, 0.01, 0.035), shade(emblem), sub=1)


@item('plant_cactus', 1, 1)
def plant_cactus(P):
    mb = P.main
    pot(mb, 0.09, 0.12, 0.13, '#d8784a')
    c = col_fn('#4a9a4a', mottle=0.08, under=0.1)
    lathe(mb, [(0.06, 0.12), (0.065, 0.2), (0.06, 0.36), (0.04, 0.42), (0.0, 0.44)], c, seg=12)
    for s, z in ((-1, 0.22), (1, 0.27)):
        tube(mb, [(0, 0, z), (s * 0.08, 0, z), (s * 0.09, 0, z + 0.1)], 0.028, c, seg=8, r1=0.024)
    ball(mb, (0, 0, 0.45), 0.03, shade('#f06aa0'), sub=1)


@item('shell_lamp', 1, 1)
def shell_lamp(P):
    mb = P.main
    lathe(mb, [(0.12, 0.0), (0.12, 0.03), (0.04, 0.05)], wood('#c8a878'), seg=18)
    cyl(mb, 0, 0, 0.05, 0.25, 0.015, color=metal('#d8c8a0'), seg=8)
    m = len(mb.v)
    lathe(mb, [(0.0, 0.24), (0.13, 0.3), (0.15, 0.38), (0.08, 0.44), (0.0, 0.45)], lambda p, n, z0=0, z1=1: rgb('#f8e0d0') * (0.86 + 0.14 * abs(math.cos(math.atan2(p.y, p.x) * 7))), seg=28, cap_top=False)
    ball(P.glow, (0, 0, 0.32), 0.05, '#fff0c8', sub=2)


@item('moon_lamp', 1, 1)
def moon_lamp(P):
    lathe(P.main, [(0.1, 0.0), (0.1, 0.03), (0.03, 0.05)], wood('#5a4a6a'), seg=18)
    cyl(P.main, 0, 0, 0.04, 0.12, 0.012, color=metal('#c8c0d8'), seg=8)
    ball(P.glow, (0, 0, 0.26), 0.14, lambda p, n: rgb('#fff4c8') * (0.9 + 0.12 * noise.noise(p * 20)), sub=3)


@item('star_projector', 1, 1)
def star_projector(P):
    mb = P.main
    lathe(mb, [(0.14, 0.0), (0.14, 0.05), (0.12, 0.07)], paint('#3a3a6a'), seg=22)
    m = len(P.gloss.v)
    lathe(P.gloss, [(0.12, 0.07), (0.12, 0.12), (0.09, 0.2), (0.04, 0.24), (0.0, 0.25)], lambda p, n, z0=0, z1=1: rgb('#3a3a7a') * 0.9, seg=24, cap_top=False)
    for k in range(10):
        a, z = k * 2.4, 0.11 + (k % 3) * 0.04
        r = 0.12 - (z - 0.07) * 0.5
        ball(P.glow, (math.cos(a) * r, math.sin(a) * r, z), 0.012, '#fff4a0', sub=1)


@item('coffee_maker', 1, 1)
def coffee_maker(P):
    mb = P.main
    rbox(mb, -0.12, -0.1, 0.0, 0.12, 0.12, 0.03, paint('#2a2a2e'), r=0.01, mid=1)
    rbox(mb, -0.12, 0.02, 0.03, 0.12, 0.12, 0.36, paint('#c83a3a'), r=0.02, mid=1)
    rbox(mb, -0.12, -0.1, 0.3, 0.12, 0.12, 0.38, paint('#c83a3a'), r=0.02, mid=1)
    lathe(P.clear, [(0.07, 0.03), (0.075, 0.14), (0.05, 0.2), (0.055, 0.22)], col_fn('#e8f0f4', under=0.0), seg=16, c=(0, -0.03, 0), cap_top=False, cap_bot=True)
    lathe(mb, [(0.068, 0.035), (0.072, 0.1)], shade('#4a2a1a'), seg=16, c=(0, -0.03, 0), cap_top=True)
    ball(P.glow, (0.08, -0.105, 0.33), 0.01, '#80ff80', sub=1)


@item('bonsai', 1, 1)
def bonsai(P):
    mb = P.main
    rbox(mb, -0.15, -0.09, 0.0, 0.15, 0.09, 0.07, paint('#3a5a7a'), r=0.015, mid=1)
    rbox(mb, -0.13, -0.075, 0.06, 0.13, 0.075, 0.075, shade('#4a3a2a'), r=0.01, mid=1)
    bark = col_fn('#6a4a32', grain='z', under=0.1)
    tube(mb, [(0.0, 0, 0.07), (0.03, 0, 0.14), (-0.03, 0, 0.22), (0.02, 0, 0.3)], 0.025, bark, seg=8, r1=0.012)
    tube(mb, [(-0.02, 0, 0.2), (-0.1, 0, 0.24)], 0.012, bark, seg=6, r1=0.008)
    for (x, z, rx) in ((0.02, 0.32, 0.1), (-0.11, 0.26, 0.07), (0.1, 0.22, 0.06)):
        ball(mb, (x, 0, z), (rx, rx * 0.75, rx * 0.45), col_fn('#3a8a3a', mottle=0.2, under=0.15), sub=2)


@item('lucky_cat', 1, 1)
def lucky_cat(P):
    mb = P.gloss
    white = col_fn('#fbf8f2', under=0.12)
    ball(mb, (0, 0, 0.12), (0.1, 0.085, 0.12), white, sub=3)
    ball(mb, (0, -0.01, 0.28), (0.09, 0.08, 0.08), white, sub=3)
    for s in (-1, 1):
        ball(mb, (s * 0.055, -0.01, 0.35), (0.025, 0.02, 0.035), white, sub=1)
        ball(P.main, (s * 0.055, -0.025, 0.35), (0.014, 0.008, 0.02), shade('#f4a0a8'), sub=1)
        ball(P.main, (s * 0.03, -0.075, 0.29), (0.012, 0.005, 0.008), shade('#2a2a2e'), sub=1)
    tube(mb, [(0.09, 0, 0.16), (0.13, -0.02, 0.26), (0.12, -0.03, 0.33)], 0.024, white, seg=8)
    ball(P.main, (0, -0.08, 0.2), (0.07, 0.02, 0.012), shade('#e8343a'), sub=1)
    ball(P.gloss, (0, -0.088, 0.18), 0.022, gold(), sub=2)
    ball(P.main, (0, -0.08, 0.06), (0.05, 0.02, 0.05), shade('#e8b840'), sub=1)


@item('steamer_stack', 1, 1)
def steamer_stack(P):
    mb = P.main
    bam = col_fn('#d8b878', grain='z', under=0.1)
    for k in range(3):
        z = k * 0.09
        lathe(mb, [(0.14, z), (0.145, z + 0.01), (0.145, z + 0.08), (0.135, z + 0.09)], bam, seg=24, cap_top=False, cap_bot=k == 0)
        lathe(mb, [(0.146, z + 0.035), (0.148, z + 0.045)], shade('#a8884a'), seg=24, cap_top=False)
    lathe(mb, [(0.14, 0.27), (0.1, 0.33), (0.03, 0.35), (0.0, 0.36)], bam, seg=24, cap_top=False)
    rbox(mb, -0.03, -0.01, 0.35, 0.03, 0.01, 0.38, shade('#8a6a3a'), r=0.006, mid=0)


@item('choc_fountain', 1, 1)
def choc_fountain(P):
    mb = P.main
    lathe(P.gloss, [(0.16, 0.0), (0.16, 0.06), (0.06, 0.08)], metal('#d8d8e0'), seg=24)
    choc = col_fn('#6a3a22', under=0.05)
    for (r, z) in ((0.14, 0.08), (0.1, 0.2), (0.065, 0.32)):
        lathe(P.gloss, [(0.02, z), (r, z + 0.02), (r * 1.05, z + 0.05), (r * 0.9, z + 0.06)], choc, seg=24, cap_top=True)
    cyl(P.gloss, 0, 0, 0.08, 0.44, 0.022, color=choc, seg=10)
    ball(P.gloss, (0, 0, 0.45), 0.035, choc, sub=2)


@item('cake_stand', 1, 1)
def cake_stand(P):
    lathe(P.gloss, [(0.08, 0.0), (0.08, 0.02), (0.02, 0.04), (0.02, 0.12), (0.17, 0.13), (0.17, 0.145)], col_fn('#f4f0ea', under=0.05), seg=28)
    lathe(P.main, [(0.13, 0.145), (0.13, 0.24), (0.0, 0.25)], lambda p, n, z0=0, z1=1: rgb('#f8c8d8') if p.z < 0.22 else rgb('#fbf4ee'), seg=28)
    for k in range(6):
        a = k / 6 * math.tau
        ball(P.gloss, (math.cos(a) * 0.09, math.sin(a) * 0.09, 0.265), 0.022, shade('#d82a3a'), sub=1)


@item('nameplate', 1, 1)
def nameplate(P):
    mb = P.main
    slab(mb, [(-0.15, 0.0), (0.15, 0.0), (0.15, 0.04), (-0.15, 0.04)], 0.08, wood('#6a4228'), axis='y', at=-0.04)
    m = len(P.gloss.v)
    rbox(P.gloss, -0.14, -0.05, 0.04, 0.14, 0.0, 0.1, gold(), r=0.008, mid=0)
    xform(P.gloss, m, Matrix.Translation((0, 0.0, 0.0)) @ Matrix.Rotation(-0.5, 4, 'X'))


@item('globe', 1, 1)
def globe(P):
    lathe(P.main, [(0.1, 0.0), (0.1, 0.02), (0.03, 0.05), (0.015, 0.1)], wood('#7a4a2a'), seg=18)

    def earth(p, n):
        land = noise.noise(n * 2.3 + Vector((3, 1, 2))) > 0.08
        return (rgb('#5aa850') if land else rgb('#4a8ad8')) * (0.86 + 0.2 * max(0.0, n.dot(Vector((-0.35, -0.55, 0.76)).normalized())))
    ball(P.gloss, (0, 0, 0.24), 0.13, earth, sub=3)
    tube(P.main, [(0.0, 0.0, 0.1), (0.1, 0.0, 0.14), (0.14, 0.0, 0.24), (0.1, 0.0, 0.34), (0.0, 0.0, 0.38)], 0.01, gold(), seg=6)


@item('herb_pot', 1, 1)
def herb_pot(P):
    mb = P.main
    pot(mb, 0.08, 0.1, 0.12, '#c86a3a')
    for k in range(7):
        a = k / 7 * math.tau
        leaf(mb, Vector((0, 0, 0.11)), Vector((math.cos(a) * 0.12, math.sin(a) * 0.12, 0.24 + (k % 2) * 0.04)), 0.05, '#4a9a3a', cup=0.2, sub=1)


@item('watering_can', 1, 1)
def watering_can(P):
    mb = P.main
    c = paint('#4aa8a0')
    lathe(mb, [(0.1, 0.0), (0.11, 0.04), (0.1, 0.18), (0.06, 0.21), (0.0, 0.215)], c, seg=20)
    tube(mb, [(0.08, 0, 0.06), (0.17, 0, 0.16), (0.24, 0, 0.24)], 0.018, c, seg=8, r1=0.012)
    lathe(mb, [(0.0, -0.01), (0.03, 0.0), (0.035, 0.01)], c, seg=10, c=(0.24, 0, 0.24))
    tube(mb, [(-0.1, 0, 0.12), (-0.11, 0, 0.26), (0.02, 0, 0.27)], 0.012, c, seg=6)


@item('typewriter', 1, 1)
def typewriter(P):
    mb = P.main
    body = paint('#3a5a4a')
    rbox(mb, -0.16, -0.12, 0.0, 0.16, 0.1, 0.09, body, r=0.025, mid=1)
    rbox(mb, -0.15, -0.02, 0.09, 0.15, 0.1, 0.15, body, r=0.025, mid=1)
    m = len(mb.v)
    lathe(mb, [(0.03, -0.17), (0.03, 0.17)], shade('#2a2a2e'), seg=12, cap_top=True, cap_bot=True)
    xform(mb, m, Matrix.Translation((0, 0.06, 0.17)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
    slab(mb, [(-0.1, 0.17), (0.1, 0.17), (0.1, 0.33), (-0.1, 0.33)], 0.004, shade('#fbf8f2'), axis='y', at=0.07)
    for r_ in range(3):
        for k in range(8):
            ball(P.gloss, (-0.12 + k * 0.034 + r_ * 0.01, -0.1 + r_ * 0.03, 0.09 + r_ * 0.012), 0.012, shade('#f4f0e6'), sub=1)


@item('rose_vase', 1, 1)
def rose_vase(P):
    lathe(P.gloss, [(0.04, 0.0), (0.07, 0.06), (0.06, 0.14), (0.03, 0.2), (0.04, 0.22)], col_fn('#8ad0e8', under=0.05), seg=20, cap_bot=True, cap_top=False)
    for k in range(3):
        a = k * 2.1
        tip = Vector((math.cos(a) * 0.06, math.sin(a) * 0.06, 0.38 + (k % 2) * 0.04))
        tube(P.main, [(0, 0, 0.18), tip], 0.007, shade('#3a8a34'), seg=5)
        ball(P.main, tip, (0.04, 0.04, 0.035), lambda p, n: rgb('#e8344a') * (0.8 + 0.25 * abs(math.sin(math.atan2(n.y, n.x) * 3))), sub=2)
        leaf(P.main, tip - Vector((0, 0, 0.08)), tip - Vector((-0.06, 0.02, 0.06)), 0.03, '#3a8a34', sub=1)


@item('sonnet_stack', 1, 1)
def sonnet_stack(P):
    mb = P.main
    for k, c in enumerate(('#c83a4a', '#3a6ac8', '#e8b030', '#4a9a5a')):
        rbox(mb, -0.12 + k * 0.006, -0.09, k * 0.04, 0.12 + k * 0.006, 0.09, k * 0.04 + 0.038, paint(c), r=0.008, mid=1)
    rbox(mb, -0.1, -0.08, 0.16, 0.1, 0.08, 0.17, shade('#fbf8f2'), r=0.004, mid=0)
    tube(mb, [(-0.04, 0.0, 0.17), (0.06, 0.04, 0.3)], 0.006, shade('#f4f0ea'), seg=4)
    slab(mb, [(0.03, 0.22), (0.07, 0.24), (0.1, 0.34), (0.06, 0.32)], 0.004, shade('#fbf8f2'), axis='y', at=0.03)


@item('mirror_lamp', 1, 1)
def mirror_lamp(P):
    mb = P.main
    lathe(mb, [(0.1, 0.0), (0.1, 0.03), (0.02, 0.05)], gold(), seg=18)
    cyl(mb, 0, 0, 0.04, 0.14, 0.012, color=gold(), seg=8)
    m = len(P.gloss.v)
    lathe(P.gloss, [(0.0, -0.005), (0.13, -0.005), (0.14, 0.0), (0.13, 0.005), (0.0, 0.005)], col_fn('#c8e4f0', under=0.0), seg=24)
    xform(P.gloss, m, Matrix.Translation((0, 0, 0.27)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    for k in range(8):
        a = k / 8 * math.tau
        ball(P.glow, (math.cos(a) * 0.15, -0.01, 0.27 + math.sin(a) * 0.15), 0.016, '#fff2c0', sub=1)


@item('party_console', 1, 1)
def party_console(P):
    mb = P.main
    rbox(mb, -0.14, -0.08, 0.0, 0.14, 0.08, 0.06, paint('#3a3a42'), r=0.02, mid=1)
    ball(P.glow, (0.1, -0.082, 0.03), 0.008, '#6aff6a', sub=1)
    for x, c in ((-0.18, '#e8344a'), (0.18, '#3a7ad8')):
        ball(mb, (x, -0.06, 0.03), (0.06, 0.035, 0.025), paint(c), sub=2)
        tube(mb, [(x * 0.8, -0.04, 0.04), (x * 0.5, 0.0, 0.04)], 0.004, shade('#2a2a2e'), seg=3)


@item('jackbox_trophy', 1, 1)
def jackbox_trophy(P):
    cup_trophy(P, '#e8b840', '#e8344a')


@item('trophy_hot', 1, 1)
def trophy_hot(P):
    cup_trophy(P, '#e8b840')
    ball(P.main, (0, 0, 0.48), (0.035, 0.035, 0.07), shade('#e8302a'), sub=2)
    tube(P.main, [(0, 0, 0.54), (0.02, 0, 0.58)], 0.008, shade('#3a8a34'), seg=4)


@item('trophy_arcade', 1, 1)
def trophy_arcade(P):
    cup_trophy(P, '#e8b840', '#7a4ae8')


@item('trophy_rope', 1, 1)
def trophy_rope(P):
    cup_trophy(P, '#c8ccd4', '#4ab0e8')


@item('trophy_karaoke', 1, 1)
def trophy_karaoke(P):
    cup_trophy(P, '#e8b840', '#f06aa0')
    cyl(P.main, 0, 0, 0.42, 0.5, 0.015, color=shade('#2a2a2e'), seg=8)
    ball(P.main, (0, 0, 0.53), 0.035, metal('#a8a8b0'), sub=2)


@item('plaque_gold', 1, 1)
def plaque_gold(P):
    mb = P.main
    rbox(mb, -0.14, -0.04, 0.0, 0.14, 0.04, 0.03, wood('#5a3a2a'), r=0.01, mid=1)
    m = len(mb.v)
    rbox(mb, -0.12, -0.02, 0.03, 0.12, 0.0, 0.3, wood('#6a4228'), r=0.012, mid=1)
    rbox(P.gloss, -0.09, -0.03, 0.08, 0.09, -0.015, 0.26, gold(), r=0.008, mid=0)


@item('snow_globe', 1, 1)
def snow_globe(P):
    lathe(P.main, [(0.1, 0.0), (0.11, 0.04), (0.08, 0.07)], wood('#7a4a2a'), seg=20)
    ball(P.clear, (0, 0, 0.17), 0.1, col_fn('#e8f4fb', under=0.0), sub=3)
    rbox(P.main, -0.03, -0.025, 0.07, 0.03, 0.025, 0.12, paint('#e8443a'), r=0.006, mid=0)
    lathe(P.main, [(0.045, 0.12), (0.0, 0.16)], shade('#fbf8f2'), seg=4)
    for k in range(9):
        a, z = k * 2.3, 0.1 + (k % 4) * 0.035
        ball(P.main, (math.cos(a) * 0.06, math.sin(a) * 0.06, z), 0.006, shade('#ffffff'), sub=1)


@item('birthday_cake', 1, 1)
def birthday_cake(P):
    lathe(P.gloss, [(0.17, 0.0), (0.17, 0.015), (0.0, 0.02)], col_fn('#f4f0ea', under=0.05), seg=28)
    lathe(P.main, [(0.14, 0.02), (0.14, 0.12), (0.1, 0.13), (0.1, 0.2), (0.0, 0.21)], lambda p, n, z0=0, z1=1: rgb('#f8c8d8') if p.z < 0.125 else rgb('#fbf4ee'), seg=28)
    for k in range(5):
        a = k / 5 * math.tau
        x, y = math.cos(a) * 0.06, math.sin(a) * 0.06
        cyl(P.main, x, y, 0.2, 0.27, 0.008, color=shade(['#6ac8f0', '#f4c040', '#f06aa0', '#7ad86a', '#b07ae8'][k]), seg=6)
        ball(P.glow, (x, y, 0.285), (0.01, 0.01, 0.018), '#ffc840', sub=1)


@item('heart_lamp', 1, 1)
def heart_lamp(P):
    lathe(P.main, [(0.09, 0.0), (0.09, 0.03), (0.03, 0.05)], paint('#f4f0ea'), seg=18)
    m = len(P.glow.v)
    for s in (-1, 1):
        ball(P.glow, (s * 0.06, 0, 0.26), (0.08, 0.05, 0.08), '#ff8ab8', sub=2)
    lathe(P.glow, [(0.0, 0.06), (0.13, 0.24), (0.0, 0.25)], '#ff8ab8', seg=4)


@item('star_jar', 1, 1)
def star_jar(P):
    lathe(P.clear, [(0.07, 0.0), (0.09, 0.03), (0.09, 0.2), (0.06, 0.24), (0.06, 0.26)], col_fn('#e8f4fb', under=0.0), seg=20, cap_bot=True, cap_top=False)
    cyl(P.main, 0, 0, 0.25, 0.29, 0.065, color=wood('#a8784a'), seg=16)
    for k in range(7):
        a, z = k * 2.2, 0.04 + (k % 4) * 0.045
        ball(P.glow, (math.cos(a) * 0.045, math.sin(a) * 0.045, z), 0.016, '#fff4a0', sub=1)


@item('keeper_lantern', 1, 1)
def keeper_lantern(P):
    mb = P.main
    iron = metal('#3a3a40')
    lathe(mb, [(0.09, 0.0), (0.09, 0.03), (0.07, 0.04)], iron, seg=8)
    for k in range(4):
        a = k / 4 * math.tau + math.pi / 4
        tube(mb, [(math.cos(a) * 0.075, math.sin(a) * 0.075, 0.03), (math.cos(a) * 0.075, math.sin(a) * 0.075, 0.26)], 0.008, iron, seg=4)
    lathe(P.clear, [(0.07, 0.04), (0.07, 0.25)], col_fn('#fff4d8', under=0.0), seg=8, cap_top=False)
    ball(P.glow, (0, 0, 0.13), (0.025, 0.025, 0.045), '#ffc040', sub=1)
    lathe(mb, [(0.095, 0.25), (0.05, 0.31), (0.0, 0.32)], iron, seg=8)
    tube(mb, [(-0.04, 0, 0.31), (0, 0, 0.38), (0.04, 0, 0.31)], 0.006, iron, seg=4)


@item('mini_windmill', 1, 1)
def mini_windmill(P):
    mb = P.main
    rbox(mb, -0.1, -0.1, 0.0, 0.1, 0.1, 0.03, wood('#7a5a3a'), r=0.01, mid=1)
    lathe(mb, [(0.08, 0.03), (0.06, 0.3)], paint('#f4ecdc'), seg=8, cap_top=False)
    lathe(mb, [(0.075, 0.3), (0.0, 0.38)], paint('#c8443a'), seg=8)
    for k in range(4):
        a = k / 4 * math.tau + 0.3
        m = len(mb.v)
        rbox(mb, 0.0, -0.09, -0.006, 0.17, -0.082, 0.006, wood('#8a6a3a'), r=0.002, mid=0)
        rbox(mb, 0.04, -0.088, 0.006, 0.16, -0.084, 0.04, shade('#fbf8f2'), r=0.002, mid=0)
        xform(mb, m, Matrix.Translation((0, 0, 0.3)) @ Matrix.Rotation(-a, 4, 'Y'))


@item('register', 1, 1)
def register(P):
    mb = P.main
    body = paint('#c8a048')
    rbox(mb, -0.15, -0.12, 0.0, 0.15, 0.12, 0.08, body, r=0.015, mid=1)
    m = len(mb.v)
    rbox(mb, -0.13, -0.08, 0.08, 0.13, 0.1, 0.2, body, r=0.015, mid=1)
    rbox(P.gloss, -0.08, -0.02, 0.2, 0.08, 0.06, 0.28, paint('#2a3a2a'), r=0.01, mid=0)
    for r_ in range(3):
        for k in range(4):
            ball(P.gloss, (-0.09 + k * 0.06, -0.1 + r_ * 0.035, 0.09 + r_ * 0.03), 0.014, shade('#fbf8f2'), sub=1)
    rbox(mb, -0.14, -0.13, 0.02, 0.14, -0.1, 0.06, paint('#a8803a'), r=0.008, mid=0)


@item('cookie_jar', 1, 1)
def cookie_jar(P):
    lathe(P.clear, [(0.08, 0.0), (0.1, 0.04), (0.1, 0.2), (0.08, 0.23)], col_fn('#eef6fb', under=0.0), seg=20, cap_bot=True, cap_top=False)
    lathe(P.main, [(0.085, 0.22), (0.09, 0.25), (0.03, 0.27), (0.02, 0.3), (0.0, 0.31)], paint('#e8443a'), seg=20)
    for k in range(6):
        a, z = k * 2.4, 0.03 + (k % 3) * 0.05
        ball(P.main, (math.cos(a) * 0.05, math.sin(a) * 0.05, z), (0.04, 0.04, 0.012), mottle('#c88a4a', 0.15), sub=1)


@item('orange_vase', 1, 1)
def orange_vase(P):
    lathe(P.gloss, [(0.05, 0.0), (0.1, 0.08), (0.11, 0.16), (0.06, 0.26), (0.05, 0.3), (0.06, 0.32)], col_fn('#f28a1a', under=0.05), seg=24, cap_bot=True, cap_top=False)
    for k in range(3):
        a = k * 2.1
        tip = Vector((math.cos(a) * 0.08, math.sin(a) * 0.08, 0.48))
        tube(P.main, [(0, 0, 0.28), tip], 0.006, shade('#4a7a34'), seg=5)
        ball(P.main, tip, 0.03, shade('#fbf6f0'), sub=2)


@item('paper_pile', 1, 1)
def paper_pile(P):
    mb = P.main
    for k in range(7):
        a = (k * 0.37) % 0.4 - 0.2
        m = len(mb.v)
        rbox(mb, -0.12, -0.09, k * 0.015, 0.12, 0.09, k * 0.015 + 0.012, shade('#fbf8f2' if k % 2 else '#f2ecdc'), r=0.003, mid=0)
        xform(mb, m, Matrix.Rotation(a, 4, 'Z'))


@item('rice_cooker', 1, 1)
def rice_cooker(P):
    lathe(P.gloss, [(0.12, 0.0), (0.14, 0.03), (0.14, 0.17), (0.12, 0.19)], col_fn('#fbf8f2', under=0.08), seg=24, cap_bot=True, cap_top=False)
    lathe(P.main, [(0.125, 0.19), (0.12, 0.23), (0.04, 0.26), (0.0, 0.265)], paint('#e8e4dc'), seg=24)
    tube(P.main, [(-0.04, 0, 0.26), (0, 0, 0.3), (0.04, 0, 0.26)], 0.01, paint('#3a3a42'), seg=5)
    ball(P.glow, (0, -0.14, 0.1), 0.01, '#ff7a3a', sub=1)


@item('gossip_phone', 1, 1)
def gossip_phone(P):
    mb = P.gloss
    pink = col_fn('#f48ab8', under=0.1)
    rbox(mb, -0.12, -0.1, 0.0, 0.12, 0.1, 0.1, pink, r=0.03, mid=1)
    ball(P.main, (0, -0.05, 0.1), (0.06, 0.04, 0.012), shade('#fbf8f2'), sub=2)
    tube(mb, [(-0.12, 0.0, 0.16), (-0.08, 0.0, 0.18), (0.08, 0.0, 0.18), (0.12, 0.0, 0.16)], 0.03, pink, seg=8)
    tube(P.main, [(0.12, 0.05, 0.05), (0.18, 0.08, 0.02), (0.2, 0.0, 0.0)], 0.006, shade('#f48ab8'), seg=4)


@item('toolbox', 1, 1)
def toolbox(P):
    mb = P.main
    rbox(mb, -0.16, -0.08, 0.0, 0.16, 0.08, 0.13, paint('#d83a3a'), r=0.015, mid=1)
    rbox(mb, -0.165, -0.085, 0.11, 0.165, 0.085, 0.14, paint('#b82a2a'), r=0.01, mid=1)
    tube(mb, [(-0.08, 0, 0.14), (-0.07, 0, 0.2), (0.07, 0, 0.2), (0.08, 0, 0.14)], 0.01, metal('#3a3a40'), seg=5)
    rbox(P.gloss, -0.02, -0.088, 0.09, 0.02, -0.08, 0.12, metal('#d8d8e0'), r=0.004, mid=0)


@item('house_model', 1, 1)
def house_model(P):
    mb = P.main
    rbox(mb, -0.15, -0.12, 0.0, 0.15, 0.12, 0.02, wood('#c8a878'), r=0.008, mid=0)
    rbox(mb, -0.1, -0.07, 0.02, 0.1, 0.07, 0.15, paint('#f4ecdc'), r=0.008, mid=1)
    slab(mb, [(-0.12, 0.15), (0.12, 0.15), (0.0, 0.25)], 0.16, paint('#c84a3a'), axis='y', at=-0.08)
    rbox(mb, -0.02, -0.075, 0.02, 0.02, -0.07, 0.09, paint('#7a4a2a'), r=0.004, mid=0)
    for x in (-0.06, 0.06):
        rbox(P.gloss, x - 0.018, -0.075, 0.07, x + 0.018, -0.07, 0.11, shade('#8ac8e8'), r=0.004, mid=0)


@item('art_supplies', 1, 1)
def art_supplies(P):
    lathe(P.main, [(0.05, 0.0), (0.055, 0.12), (0.06, 0.13)], paint('#4a7ad8'), seg=14, c=(-0.06, 0.02, 0), cap_bot=True, cap_top=False)
    for k, c in enumerate(('#e8443a', '#f4c040', '#3aa85a', '#7a4ae8')):
        a = k * 1.6
        tube(P.main, [(-0.06 + math.cos(a) * 0.02, 0.02 + math.sin(a) * 0.02, 0.05), (-0.06 + math.cos(a) * 0.05, 0.02 + math.sin(a) * 0.05, 0.25)], 0.006, wood('#d8b878'), seg=4)
        ball(P.main, (-0.06 + math.cos(a) * 0.05, 0.02 + math.sin(a) * 0.05, 0.26), (0.008, 0.008, 0.02), shade(c), sub=1)
    m = len(P.main.v)
    ball(P.main, (0.07, -0.04, 0.012), (0.09, 0.07, 0.01), wood('#d8b878'), sub=2)
    for k, c in enumerate(('#e8443a', '#f4c040', '#3aa85a', '#3a7ad8', '#fbf8f2')):
        a = k * 0.9 + 0.3
        ball(P.gloss, (0.07 + math.cos(a) * 0.055, -0.04 + math.sin(a) * 0.04, 0.024), (0.016, 0.016, 0.006), shade(c), sub=1)


@item('table_setting', 1, 1)
def table_setting(P):
    lathe(P.gloss, [(0.0, 0.0), (0.11, 0.004), (0.13, 0.014), (0.13, 0.018)], col_fn('#fbf8f2', under=0.05), seg=24, c=(0, 0, 0), cap_top=False)
    lathe(P.gloss, [(0.08, 0.016), (0.0, 0.02)], shade('#e8f0f4'), seg=24, cap_top=False)
    for x in (-0.17, 0.17):
        rbox(P.gloss, x - 0.008, -0.08, 0.0, x + 0.008, 0.08, 0.008, metal('#c8ccd4'), r=0.003, mid=0)
    lathe(P.clear, [(0.025, 0.0), (0.035, 0.12), (0.04, 0.14)], col_fn('#e8f4fb', under=0.0), seg=14, c=(0.12, 0.1, 0), cap_bot=True, cap_top=False)


@item('laptop', 1, 1)
def laptop(P):
    mb = P.main
    rbox(mb, -0.16, -0.11, 0.0, 0.16, 0.09, 0.018, metal('#c8ccd4'), r=0.008, mid=0)
    m = len(mb.v)
    rbox(mb, -0.16, -0.008, 0.0, 0.16, 0.008, 0.2, metal('#c8ccd4'), r=0.008, mid=0)
    xform(mb, m, Matrix.Translation((0, 0.09, 0.012)) @ Matrix.Rotation(-0.25, 4, 'X'))
    m = len(P.glow.v)
    rbox(P.glow, -0.14, -0.012, 0.015, 0.14, -0.009, 0.185, col_fn('#a8d8f8', under=0.0), r=0.004, mid=0)
    xform(P.glow, m, Matrix.Translation((0, 0.09, 0.012)) @ Matrix.Rotation(-0.25, 4, 'X'))
    rbox(mb, -0.13, -0.09, 0.018, 0.13, 0.02, 0.022, shade('#3a3a42'), r=0.003, mid=0)
