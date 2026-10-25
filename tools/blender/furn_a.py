"""Furniture, part one: Sarah's starter cottage pieces, the beach and the night sky sets, the food stalls' pieces."""
import math
from mathutils import Vector, Matrix, Euler, noise
from trees_ac import rgb
from kit import col_fn, shade, rbox, lathe, tube, xform, cyl
from folks import ball, surf, superq, revolve, mottle
from furn_kit import *


@item('bed_simple', 2, 2)
def bed_simple(P):
    bed(P, 1.7, 1.9, wood('#b8743a', 'y'), '#e8705a', head=0.95, foot=0.42)


@item('table_wood', 2, 1)
def table_wood(P):
    table(P, 1.8, 0.82, 0.72, wood('#c48a4e'), wood('#9a6434', 'z'))
    for k in range(1, 4):
        rbox(P.main, -0.9 + 0.45 * k - 0.004, -0.41, 0.719, -0.9 + 0.45 * k + 0.004, 0.41, 0.722, shade('#8a5a30'), r=0.002, mid=0)


@item('chair_wood', 1, 1)
def chair_wood(P):
    chair(P, 0.46, 0.44, 0.46, 1.0, wood('#b47a40', 'z'), seat_col=wood('#c08a4c'))


@item('lamp_floor', 1, 1)
def lamp_floor(P):
    floor_lamp(P, '#f6e2a0', h=1.5, shade_r=(0.11, 0.22), shade_h=0.26)


@item('shelf_book', 2, 1)
def shelf_book(P):
    shelf(P, 1.7, 0.4, 1.7, wood('#a8683a', 'z'), rows=4)


@item('plant_monstera', 1, 1)
def plant_monstera(P):
    weave = lambda p, n, z0=0, z1=1: rgb('#e6cc98') * (0.86 + 0.16 * (0.5 + 0.5 * math.sin(p.z * 120) * math.sin(math.atan2(p.y, p.x) * 18)))
    pot(P.main, 0.15, 0.2, 0.34, weave, rim='#d8b880')
    rng = P.rng
    for k in range(9):
        a = k / 9 * math.tau + rng.uniform(-0.2, 0.2)
        r = rng.uniform(0.12, 0.3)
        base = Vector((0, 0, 0.34))
        mid = Vector((math.cos(a) * r * 0.5, math.sin(a) * r * 0.5, 0.34 + rng.uniform(0.35, 0.75)))
        tube(P.main, [base, (base + mid) / 2 + Vector((0, 0, 0.08)), mid], 0.012, shade('#4a8a3a'), seg=5)
        tip = mid + Vector((math.cos(a) * 0.32, math.sin(a) * 0.32, rng.uniform(-0.12, 0.06)))
        leaf(P.main, mid, tip, rng.uniform(0.22, 0.3), '#2e7a36', cup=0.4, split=3)


@item('sofa_pink', 2, 1)
def sofa_pink(P):
    sofa(P, 1.82, 0.8, '#ec86ac', cushion='#f4a2c2')


@item('kitchenette', 2, 1)
def kitchenette(P):
    cabinet(P, 1.8, 0.62, 0.92, paint('#f2eee2'), doors=2, knob='#a8a8a8', top_col=metal('#c8ccd0'))
    mb = P.main
    # the stove on the left: two black rings; the sink on the right: a steel basin and a tap
    for x in (-0.62, -0.32):
        lathe(mb, [(0.11, 0.92), (0.115, 0.935), (0.07, 0.94), (0.0, 0.94)], metal('#2a2a2e'), c=(x, -0.05, 0), seg=20)
        lathe(mb, [(0.055, 0.94), (0.06, 0.95), (0.0, 0.95)], metal('#4a4a50'), c=(x, -0.05, 0), seg=16)
    rbox(mb, 0.18, -0.2, 0.86, 0.7, 0.16, 0.925, metal('#9aa2aa'), r=0.03, mid=1)
    rbox(P.gloss, 0.21, -0.17, 0.87, 0.67, 0.13, 0.9, metal('#b8c0c8'), r=0.02, mid=1)
    tube(mb, [(0.44, 0.24, 0.92), (0.44, 0.24, 1.12), (0.44, 0.08, 1.16), (0.44, 0.02, 1.1)], 0.018, metal('#c8ccd0'), seg=8)
    for x in (0.38, 0.5):
        cyl(mb, x, 0.24, 0.92, 0.98, 0.02, 0.02, metal('#c8ccd0'), seg=8)


@item('dresser', 2, 1)
def dresser(P):
    cabinet(P, 1.62, 0.52, 0.86, wood('#c88a4e'), drawers=2, cols=1, knob='#e0b048')


@item('mirror_stand', 1, 1)
def mirror_stand(P):
    mb = P.main
    fr = wood('#c88a4a', 'z')
    for s in (-1, 1):
        rbox(mb, s * 0.2 - 0.03, -0.18, 0.0, s * 0.2 + 0.03, 0.18, 0.05, fr, r=0.02, mid=1)
        rbox(mb, s * 0.2 - 0.025, -0.025, 0.0, s * 0.2 + 0.025, 0.025, 0.95, fr, r=0.01, mid=1)
    # the oval mirror in its frame, tipped back a touch
    m = len(mb.v)
    ring = [(math.cos(t / 40 * math.tau) * 0.19, 0, 0.42 + math.sin(t / 40 * math.tau) * 0.36) for t in range(41)]
    tube(mb, ring, 0.028, fr, seg=8)
    xform(mb, m, Matrix.Translation((0, 0, 0.6)) @ Euler((-0.08, 0, 0)).to_matrix().to_4x4() @ Matrix.Translation((0, 0, -0.6)))
    g = len(P.gloss.v)
    ball(P.gloss, (0, 0, 0.42), (0.18, 0.012, 0.35), col_fn('#c8e6f4', under=0.0), sub=3)
    xform(P.gloss, g, Matrix.Translation((0, 0, 0.6)) @ Euler((-0.08, 0, 0)).to_matrix().to_4x4() @ Matrix.Translation((0, 0, -0.6)))


@item('hammock', 2, 1)
def hammock(P):
    mb = P.main
    post = wood('#7a5232', 'z')
    for s in (-1, 1):
        cyl(mb, s * 0.86, 0, 0.0, 1.25, 0.045, 0.04, post, seg=10)
        lathe(mb, [(0.06, 0.0), (0.07, 0.04), (0.0, 0.05)], shade('#5a3a22'), c=(s * 0.86, 0, 0), seg=10)
    # the striped cloth hanging in a curve between them, ropes to the posts
    pts = []
    for i in range(13):
        t = i / 12
        pts.append((-0.62 + 1.24 * t, 0.0, 0.62 - 0.22 * math.sin(t * math.pi)))
    cols = ['#3a8ad8', '#f2c840', '#fbf8f2']
    for i in range(12):
        a, b = Vector(pts[i]), Vector(pts[i + 1])
        c = cols[(i // 2) % 3]
        rbox(mb, min(a.x, b.x), -0.26, min(a.z, b.z) - 0.02, max(a.x, b.x) + 0.01, 0.26, max(a.z, b.z) + 0.01, fabric(c), r=0.01, mid=1)
    for s in (-1, 1):
        for y in (-0.24, 0.24):
            tube(mb, [(s * 0.62, y, 0.62), (s * 0.84, 0.0, 1.05)], 0.008, shade('#e8d8b0'), seg=4)


@item('surfboard', 1, 1)
def surfboard(P):
    mb = P.main
    rbox(mb, -0.2, -0.1, 0.0, 0.2, 0.12, 0.08, wood('#9a6a3a'), r=0.02, mid=1)
    m = len(mb.v)
    board = lambda p, n, u=0, v=0: rgb('#f2c840') if abs(p.z - 0.75) < 0.04 else rgb('#5ac4e8') * (1.0 + 0.1 * max(0.0, -n.y))
    surf(mb, superq(0, 0, 0.78, 0.17, 0.03, 0.78, 1.0, 0.9), board, nu=28, nv=24)
    tube(mb, [(0, -0.032, 0.1), (0, -0.034, 1.45)], 0.006, shade('#3a8ab8'), seg=4)
    xform(mb, m, Matrix.Translation((0, 0.05, 0.02)) @ Euler((-0.12, 0, 0)).to_matrix().to_4x4())


@item('driftwood_table', 2, 1)
def driftwood_table(P):
    mb = P.main
    dw = lambda p, n, z0=0, z1=1: rgb('#c8b494') * (0.85 + 0.2 * (0.5 + 0.5 * noise.noise(Vector((p.x * 3, p.y * 20, p.z * 20))))) * (1 - 0.15 * max(0.0, -n.z))
    rbox(mb, -0.86, -0.38, 0.62, 0.88, 0.4, 0.72, dw, r=0.05, mid=3)
    for (x, y) in ((-0.7, -0.24), (0.72, -0.22), (-0.66, 0.26), (0.7, 0.25)):
        tube(mb, [(x, y, 0.0), (x + 0.03, y, 0.3), (x - 0.02, y, 0.64)], 0.06, dw, seg=10, r1=0.05)
    P.top(0.72)


@item('beach_umbrella', 1, 1)
def beach_umbrella(P):
    mb = P.main
    lathe(mb, [(0.16, 0.0), (0.16, 0.05), (0.04, 0.07)], metal('#d8d4cc'), seg=20)
    cyl(mb, 0, 0, 0.05, 1.95, 0.02, 0.02, metal('#e8e4dc'), seg=8)
    can = lambda p, n, z0=0, z1=1: (rgb('#e83848') if int((math.atan2(p.y, p.x) / math.tau + 1) * 8) % 2 else rgb('#fbf8f2')) * (1 - 0.15 * max(0.0, -n.z))
    lathe(mb, [(0.72, 1.62), (0.7, 1.64), (0.45, 1.78), (0.0, 1.9)], can, seg=32, cap_top=False, cap_bot=False)
    lathe(mb, [(0.0, 1.88), (0.7, 1.615)], can, seg=32, cap_top=False)
    ball(mb, (0, 0, 1.93), 0.03, shade('#e83848'), sub=1)


@item('cloud_bed', 2, 2)
def cloud_bed(P):
    def night(p, n, z0=0, z1=1):
        star = noise.noise(p * 26) > 0.62
        return rgb('#f8e488') if star else rgb('#262a5a') * (0.92 + 0.12 * noise.noise(p * 5))
    bed(P, 1.7, 1.9, paint('#8890e0'), None, pillow='#fbfbff', blanket_fn=night, head=0.9, foot=0.4)
    # a puffy cloud along the top of the headboard
    for k, (x, r) in enumerate(((-0.6, 0.18), (-0.3, 0.22), (0.02, 0.24), (0.34, 0.21), (0.62, 0.17))):
        ball(P.main, (x, 0.88, 0.92 + (0.03 if k % 2 else 0)), (r, 0.1, r * 0.8), col_fn('#f2f2ff', under=0.0), sub=3)


@item('beanbag', 1, 1)
def beanbag(P):
    def night(p, n, u=0, v=0):
        return rgb('#f8e488') if noise.noise(p * 24) > 0.64 else rgb('#2e3268') * (0.9 + 0.15 * max(0.0, n.z))
    surf(P.main, superq(0, 0, 0.24, 0.36, 0.34, 0.25, 1.0, 1.0, mod=lambda u, v: 1 + 0.06 * math.sin(u * math.tau * 3) * math.sin(v * math.pi)), night, nu=36, nv=20)
    # the dent where you sit
    ball(P.main, (0, -0.05, 0.42), (0.22, 0.2, 0.08), night, sub=3)


@item('sushi_counter', 3, 1)
def sushi_counter(P):
    counter(P, 2.8, 0.7, 1.0, wood('#ecd6a4'), wood('#6a4228', 'z'), panels=6)
    rbox(P.main, -1.38, 0.18, 1.0, 1.38, 0.36, 1.22, paint('#2a4a3c'), r=0.03, mid=1)
    rbox(P.clear, -1.36, 0.0, 1.0, 1.36, 0.06, 1.18, col_fn('#e4f4fa', under=0.0), r=0.01, mid=1)
    P.top(1.0)


@item('paper_lantern', 1, 1)
def paper_lantern(P):
    mb = P.main
    lathe(mb, [(0.15, 0.0), (0.15, 0.04), (0.06, 0.07)], wood('#6a4228'), seg=20)
    cyl(mb, 0, 0, 0.05, 0.75, 0.02, 0.02, wood('#5a3820'), seg=8)
    paper = lambda p, n, z0=0, z1=1: rgb('#f8ecd0') * (0.82 if abs(math.sin((p.z - 0.8) * 60)) < 0.12 else 1.0)
    lathe(mb, [(0.06, 0.75), (0.17, 0.82), (0.2, 0.98), (0.17, 1.14), (0.07, 1.2)], paper, seg=28, cap_top=False, cap_bot=True)
    lathe(mb, [(0.08, 1.19), (0.08, 1.24), (0.0, 1.25)], shade('#2a2a2e'), seg=16)
    ball(P.glow, (0, 0, 0.98), 0.06, '#ffe8b0', sub=2)


@item('takeout_lamp', 1, 1)
def takeout_lamp(P):
    mb = P.main
    lathe(mb, [(0.13, 0.0), (0.13, 0.04), (0.05, 0.06)], metal('#3a3436'), seg=20)
    cyl(mb, 0, 0, 0.05, 1.05, 0.016, 0.016, metal('#4a4448'), seg=8)
    # the shade: a takeout box upside down, white with a red mark, its wire handle
    m = len(mb.v)
    lathe(mb, [(0.1, 1.0), (0.2, 1.3)], col_fn('#fbf8f2', under=0.0), seg=4, cap_top=True, cap_bot=False)
    xform(mb, m, Matrix.Rotation(math.pi / 4, 4, 'Z'))
    ball(mb, (0, -0.12, 1.2), (0.035, 0.01, 0.035), shade('#d83838'), sub=1)
    tube(mb, [(-0.12, 0, 1.3), (0, 0, 1.42), (0.12, 0, 1.3)], 0.006, metal('#a8a8a8'), seg=4)
    ball(P.glow, (0, 0, 1.1), 0.05, '#fff2c8', sub=2)


@item('red_lantern', 1, 1)
def red_lantern(P):
    mb = P.main
    lathe(mb, [(0.15, 0.0), (0.15, 0.04), (0.06, 0.07)], wood('#5a3420'), seg=20)
    cyl(mb, 0, 0, 0.05, 0.75, 0.022, 0.022, wood('#5a3420'), seg=8)
    rib = lambda p, n, z0=0, z1=1: rgb('#e02a2a') * (0.8 if abs(math.sin(math.atan2(p.y, p.x) * 6)) < 0.15 else 1.0)
    lathe(mb, [(0.1, 0.8), (0.23, 0.88), (0.27, 1.02), (0.23, 1.16), (0.1, 1.24)], rib, seg=36, cap_top=False, cap_bot=False)
    for z in (0.8, 1.24):
        lathe(mb, [(0.11, z - 0.03), (0.11, z + 0.03)], metal('#e8b830'), seg=20)
    tube(mb, [(0, 0, 0.77), (0, 0, 0.66)], 0.012, shade('#e8b830'), seg=4)
    ball(P.glow, (0, 0, 1.02), 0.08, '#ffb070', sub=2)


@item('wok_stove', 2, 1)
def wok_stove(P):
    cabinet(P, 1.8, 0.62, 0.88, paint('#e8e4d8'), doors=2, knob='#8a8a8a', top_col=metal('#8a98ac'))
    mb = P.main
    lathe(mb, [(0.13, 0.88), (0.13, 0.9), (0.0, 0.9)], metal('#2a2a2e'), c=(-0.4, -0.02, 0), seg=20)
    lathe(mb, [(0.0, 0.92), (0.12, 0.95), (0.2, 1.02), (0.22, 1.05)], metal('#3a3a40'), c=(-0.4, -0.02, 0), seg=24, cap_top=False)
    tube(mb, [(-0.18, -0.02, 1.04), (0.05, -0.02, 1.08)], 0.015, wood('#6a4228'), seg=6)
    for k, c in enumerate(('#e8483a', '#f2c040', '#4aa84a')):
        ball(mb, (-0.44 + k * 0.05, -0.03 + (k % 2) * 0.05, 0.97), 0.03, shade(c), sub=1)
    lathe(mb, [(0.1, 0.88), (0.1, 0.9), (0.0, 0.9)], metal('#2a2a2e'), c=(0.35, -0.02, 0), seg=20)
    lathe(mb, [(0.0, 0.91), (0.13, 0.92), (0.14, 0.96)], metal('#4a4a50'), c=(0.35, -0.02, 0), seg=20, cap_top=False)
    tube(mb, [(0.49, -0.02, 0.95), (0.72, -0.02, 0.98)], 0.012, metal('#2a2a2e'), seg=6)


@item('silk_cushion', 1, 1)
def silk_cushion(P):
    mb = P.main
    rbox(mb, -0.3, -0.28, 0.0, 0.3, 0.28, 0.16, col_fn('#eeb030', mottle=0.03, under=0.2), r=0.07, mid=2)
    ball(mb, (0, 0, 0.165), (0.04, 0.04, 0.015), shade('#c82a2a'), sub=2)
    for x in (-0.3, 0.3):
        for y in (-0.28, 0.28):
            ball(mb, (x, y, 0.08), (0.04, 0.04, 0.03), shade('#d89820'), sub=1)


@item('cheesecake_case', 2, 1)
def cheesecake_case(P):
    mb = P.main
    rbox(mb, -0.86, -0.36, 0.0, 0.86, 0.36, 0.72, wood('#e4c28c'), r=0.025, mid=2)
    rbox(mb, -0.8, -0.38, 0.12, 0.8, -0.355, 0.6, wood('#d4b07a'), r=0.015, mid=1)
    glass_box(P, -0.84, -0.34, 0.72, 0.84, 0.34, 1.12, frame='#f4ecdc')
    for k in range(4):
        x = -0.6 + 0.4 * k
        rbox(mb, x - 0.1, -0.12, 0.74, x + 0.1, 0.1, 0.84, lambda p, n, z0=0, z1=1: rgb('#c8925a') if p.z < 0.765 else rgb('#fbf2dc'), r=0.015, mid=1)
        rbox(mb, x - 0.1, -0.12, 0.835, x + 0.1, 0.1, 0.85, shade('#d8303a'), r=0.01, mid=0)
        ball(mb, (x, -0.01, 0.875), 0.03, shade('#e02a3a'), sub=2)
    P.top(1.12)


@item('cafe_table', 1, 1)
def cafe_table(P):
    mb = P.main
    lathe(mb, [(0.2, 0.0), (0.2, 0.02), (0.05, 0.04)], metal('#2a2a30'), seg=20)
    cyl(mb, 0, 0, 0.02, 0.7, 0.025, 0.025, metal('#2a2a30'), seg=10)
    lathe(mb, [(0.34, 0.69), (0.36, 0.7), (0.36, 0.73), (0.34, 0.74), (0.0, 0.74)], col_fn('#fbfaf6', under=0.0), seg=36)
    P.top(0.74)


@item('macaron_stool', 1, 1)
def macaron_stool(P):
    mb = P.main
    for z0, c in ((0.0, '#f4a2c4'), (0.28, '#f4a2c4')):
        lathe(mb, [(0.0, z0), (0.2, z0 + 0.005), (0.24, z0 + 0.06), (0.22, z0 + 0.15), (0.12, z0 + 0.18), (0.0, z0 + 0.185)], col_fn(c, mottle=0.04, under=0.1), seg=32)
    lathe(mb, [(0.215, 0.15), (0.225, 0.2), (0.215, 0.28)], col_fn('#fbf2e2', mottle=0.03), seg=32, cap_top=False)
    P.top(0.465)


@item('study_desk', 2, 1)
def study_desk(P):
    mb = P.main
    w, d, h = 1.7, 0.66, 0.76
    dk = wood('#7a4a2a')
    slab_top(mb, -w / 2, -d / 2, w / 2, d / 2, h, 0.05, dk)
    rbox(mb, 0.28, -d / 2 + 0.02, 0.0, w / 2 - 0.02, d / 2 - 0.02, h - 0.05, dk, r=0.02, mid=2)
    for z0, z1 in ((0.05, 0.36), (0.38, 0.69)):
        rbox(mb, 0.32, -d / 2 + 0.005, z0, w / 2 - 0.06, -d / 2 + 0.04, z1, wood('#8a5634'), r=0.012, mid=1)
        ball(mb, ((0.32 + w / 2 - 0.06) / 2, -d / 2 - 0.01, (z0 + z1) / 2), 0.022, metal('#d8b048'), sub=2)
    legs(mb, -w / 2, -0.1, -d / 2, d / 2, h - 0.05, dk, r=0.03, inset=0.05)
    # a laptop open on it, a stack of papers
    rbox(mb, -0.55, -0.18, h, -0.15, 0.1, h + 0.02, metal('#c8ccd4'), r=0.01, mid=1)
    m = len(mb.v)
    rbox(mb, -0.55, 0.0, 0.0, -0.15, 0.02, 0.26, metal('#c8ccd4'), r=0.01, mid=1)
    xform(mb, m, Matrix.Translation((0, 0.1, h + 0.015)) @ Euler((-0.25, 0, 0)).to_matrix().to_4x4())
    g = len(P.gloss.v)
    rbox(P.gloss, -0.53, -0.006, 0.02, -0.17, 0.0, 0.24, col_fn('#7ac8e8', under=0.0), r=0.005, mid=0)
    xform(P.gloss, g, Matrix.Translation((0, 0.1, h + 0.015)) @ Euler((-0.25, 0, 0)).to_matrix().to_4x4())
    for k in range(4):
        rbox(mb, 0.35 + k * 0.004, -0.1, h + k * 0.008, 0.62, 0.12, h + k * 0.008 + 0.006, shade('#fbfaf4'), r=0.002, mid=0)
    P.top(h)


@item('crimson_chair', 1, 1)
def crimson_chair(P):
    mb = P.main
    red = fabric('#c4283a')
    legs(mb, -0.34, 0.34, -0.32, 0.32, 0.1, wood('#3a2418'), r=0.03, inset=0.05)
    rbox(mb, -0.36, -0.34, 0.08, 0.36, 0.34, 0.4, red, r=0.06, mid=2)
    rbox(mb, -0.33, 0.12, 0.3, 0.33, 0.36, 1.12, red, r=0.1, mid=2)
    for s in (-1, 1):
        rbox(mb, s * 0.36 - (0.1 if s > 0 else 0), -0.34, 0.3, s * 0.36 + (0.1 if s < 0 else 0), 0.3, 0.66, red, r=0.06, mid=2)
        ball(mb, (s * 0.31, 0.3, 1.0), (0.1, 0.12, 0.18), red, sub=3)
    rbox(mb, -0.26, -0.3, 0.38, 0.26, 0.14, 0.48, fabric('#d43448'), r=0.05, mid=2)


@item('sunflower', 1, 1)
def sunflower(P):
    mb = P.main
    pot(mb, 0.12, 0.16, 0.28, '#d0703a', rim='#c0602e')
    tube(mb, [(0, 0, 0.27), (0.02, 0, 0.7), (0, 0.01, 1.05), (0, -0.04, 1.2)], 0.018, shade('#4a8a3a'), seg=6)
    for z, s in ((0.55, 1), (0.8, -1)):
        leaf(mb, Vector((0.01, 0, z)), Vector((s * 0.24, -0.04, z + 0.05)), 0.12, '#3e8a34', cup=0.4)
    # the head facing out: petals round a brown middle
    m = len(mb.v)
    for k in range(16):
        a = k / 16 * math.tau
        mm = len(mb.v)
        ball(mb, (0.12, 0, 0), (0.07, 0.032, 0.01), shade('#f6c820' if k % 2 else '#f0b818'), sub=2)
        xform(mb, mm, Matrix.Rotation(a, 4, 'Y'))
    lathe(mb, [(0.085, -0.02), (0.09, 0.01), (0.06, 0.03), (0.0, 0.035)], lambda p, n, z0=0, z1=1: rgb('#6a4020') * (0.8 + 0.3 * (0.5 + 0.5 * math.sin(p.x * 300) * math.sin(p.y * 300))), seg=24)
    xform(mb, m, Matrix.Translation((0, -0.05, 1.24)) @ Euler((math.pi / 2 - 0.3, 0, 0)).to_matrix().to_4x4())


@item('veggie_planter', 2, 1)
def veggie_planter(P):
    mb = P.main
    for k in range(3):
        rbox(mb, -0.86, -0.36, k * 0.12, 0.86, 0.36, k * 0.12 + 0.115, wood('#c8925a', seed=k), r=0.015, mid=1)
    rbox(mb, -0.82, -0.32, 0.3, 0.82, 0.32, 0.35, shade('#4a3020'), r=0.01, mid=1)
    rng = P.rng
    for k in range(6):
        x = -0.68 + 0.27 * k
        top = '#c82a5a' if k % 3 == 1 else '#e8e0c8' if k % 3 == 2 else None
        if top:
            ball(mb, (x, 0.0, 0.37), (0.06, 0.06, 0.05), shade(top), sub=2)
        for j in range(5):
            a = j / 5 * math.tau + k
            leaf(mb, Vector((x, 0, 0.36)), Vector((x + math.cos(a) * 0.12, math.sin(a) * 0.12, 0.6 + rng.uniform(-0.05, 0.05))), 0.09, '#4aa040', cup=0.5)
