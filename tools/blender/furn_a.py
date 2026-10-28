"""Furniture, part one: Sarah's starter cottage pieces, the beach and the night sky sets, the food stalls' pieces."""
import math
from mathutils import Vector, Matrix, Euler, noise
from trees_ac import rgb
from kit import col_fn, shade, rbox, lathe, tube, xform, cyl
from folks import ball, surf, superq, revolve, mottle
from furn_kit import *
from furn_b import lbox, sheet, ring, counter_body     # (light shapes, the counters' body)


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
    """A hammock on its own wooden stand: a beam along the floor on two feet, a post at each end braced to it, and between
    them a wide bed of cloth (blue, white and yellow stripes along it) held open by a spreader bar at each end, strings
    fanning from each bar to a ring hung on the post."""
    mb = P.main
    post, beam = wood('#8a5a34', 'z'), wood('#7a5232', 'x')
    PX, BX, ZE = 0.82, 0.56, 0.68           # the posts, the spreader bars, the height of the bed's ends
    rope = col_fn('#efe2c4', under=0.0)
    lbox(mb, -PX - 0.04, -0.05, 0.05, PX + 0.04, 0.05, 0.15, beam, r=0.02)
    for s in (-1, 1):
        x = s * PX
        lbox(mb, x - 0.06, -0.36, 0.0, x + 0.06, 0.36, 0.08, beam, r=0.025)
        for y in (-0.3, 0.3):
            cyl(mb, x, y, -0.005, 0.012, 0.05, 0.05, shade('#4a3020'), seg=8)
        lathe(mb, [(0.05, 0.08), (0.048, 0.4), (0.044, 1.16), (0.05, 1.19), (0.032, 1.25), (0.0, 1.26)], post, c=(x, 0, 0), seg=10, cap_top=False)
        # the brace from the beam up to the post
        m = len(mb.v)
        lbox(mb, -0.025, -0.03, -0.2, 0.025, 0.03, 0.2, post, r=0.012)
        xform(mb, m, Matrix.Translation((s * 0.62, 0, 0.34)) @ Matrix.Rotation(s * 0.62, 4, 'Y'))
        # the hook and ring at the post's top, five strings to the spreader bar, the bar with round ends
        rx, rz = s * 0.72, 1.06
        tube(mb, [(x - s * 0.04, 0, 1.12), (rx, 0, 1.12), (rx, 0, rz + 0.03)], 0.011, metal('#5a5a62'), seg=5)
        ring(mb, (rx, 0, rz), 0.026, 0.008, metal('#5a5a62'), n=8)
        bx = s * BX
        for y in (-0.28, -0.14, 0.0, 0.14, 0.28):
            tube(mb, [(bx, y, ZE + 0.04), (rx - s * 0.015, 0, rz - 0.02)], 0.006, rope, seg=4)
        tube(mb, [(bx, -0.33, ZE + 0.02), (bx, 0.33, ZE + 0.02)], 0.024, wood('#b07a48', 'y'), seg=8)
        for y in (-0.33, 0.33):
            ball(mb, (bx, y, ZE + 0.02), 0.032, wood('#9a6a3a'), sub=1)
    # the bed: sagging from bar to bar, flat at the bars, curling up at its sides in the middle
    X0, X1 = -BX + 0.03, BX - 0.03

    def F(u, v):
        sg = math.sin(math.pi * u)
        w = 2 * v - 1
        half = 0.3 - 0.02 * sg
        return Vector((X0 + (X1 - X0) * u, w * half * (1 - 0.06 * sg * w * w), ZE - 0.24 * sg + 0.1 * sg * w * w))
    bands = [(0.0, '#3a8ad8'), (0.08, '#fbf8f2'), (0.22, '#3a8ad8'), (0.34, '#fbf8f2'), (0.42, '#f2c840'), (0.58, '#fbf8f2'), (0.66, '#3a8ad8'),
             (0.78, '#fbf8f2'), (0.92, '#3a8ad8')]

    def col(u, v):
        return rgb([b for b in bands if b[0] <= v + 1e-9][-1][1]) * (0.95 + 0.05 * math.sin(math.pi * u))
    vs = [0.0, 0.5, 1.0]
    for b, _ in bands[1:]:
        vs += [b - 0.005, b + 0.005]
    sheet(mb, F, [k / 12 for k in range(13)], sorted(vs), col, thick=0.018)
    # a little cushion at the head end
    u = 0.18
    c = F(u, 0.5)
    m = len(mb.v)
    surf(mb, superq(0, 0, 0, 0.1, 0.17, 0.045, 0.35, 0.7), col_fn('#fbf8f2', under=0.0), nu=12, nv=6)
    tilt = math.atan2(F(u + 0.01, 0.5).z - F(u - 0.01, 0.5).z, F(u + 0.01, 0.5).x - F(u - 0.01, 0.5).x)
    xform(mb, m, Matrix.Translation(c + Vector((0, 0, 0.04))) @ Euler((0, -tilt, 0)).to_matrix().to_4x4())


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
    """A slouchy beanbag in a night-sky print: a squashed pear sagging wide at the floor, its back risen into a rest and
    a dent pressed in its seat, soft folds round it; little four-pointed stars and a crescent moon on the navy cloth."""
    mb = P.main
    navy = rgb('#2e3268')

    # (the surface's poles at its left and right, so the seat is smooth)
    def D(u, v):
        ph, th = (v - 0.5) * math.pi, u * math.tau
        return Vector((math.sin(ph), math.cos(ph) * math.cos(th), math.cos(ph) * math.sin(th)))

    def UV(d):
        d = d.normalized()
        return (math.atan2(d.z, d.y) % math.tau) / math.tau, math.asin(max(-1.0, min(1.0, d.x))) / math.pi + 0.5

    def B(u, v):
        d = D(u, v)
        sp, cp = d.z, math.hypot(d.x, d.y)
        # (wide and saggy low down, narrower up top; the floor flattens it)
        k = (1 + 0.1 * max(0.0, -sp)) * (1 - 0.15 * max(0.0, sp)) * (1 + 0.025 * math.sin(math.atan2(d.y, d.x) * 7 + math.asin(sp) * 2) * cp)
        x, y = 0.4 * d.x * k, 0.38 * d.y * k
        zb = (0.3 if sp < 0 else 0.26) * sp
        z = zb if zb > -0.17 else -0.17 + (zb + 0.17) * 0.3
        # the back rises into a rounded rest, the front lip sags forward
        z += 0.36 * max(0.0, y / 0.38) ** 1.2 * max(0.0, sp) ** 0.5 - 0.09 * max(0.0, -y / 0.38) * max(0.0, sp)
        y -= 0.05 * max(0.0, -d.y) * max(0.0, 1 - abs(sp + 0.2) * 1.6)
        # the seat's dent, a few creases running out of it
        dd = (x / 0.27) ** 2 + ((y + 0.01) / 0.24) ** 2
        z -= max(0.0, sp) ** 0.6 * (0.2 * math.exp(-dd) - 0.014 * min(1.0, dd) * math.sin(math.atan2(y + 0.01, x) * 6) * math.exp(-(dd - 1.2) ** 2))
        return Vector((x, y, z + 0.209))

    def col(p, n, u=0, v=0):
        # (darker down in the seat's dent, as a painted miniature's creases are)
        dent = math.exp(-((p.x / 0.27) ** 2 + ((p.y + 0.01) / 0.24) ** 2)) * max(0.0, min(1.0, (p.z - 0.25) / 0.12))
        return navy * (0.86 + 0.2 * max(0.0, n.z)) * (0.94 + 0.06 * noise.noise(p * 6)) * (1 - 0.3 * dent)
    surf(mb, B, col, nu=36, nv=22, caps=(False, False))

    def frame(u, v):
        e = 1e-3
        p = B(u, v)
        du, dv = B(u + e, v) - B(u - e, v), B(u, min(1, v + e)) - B(u, max(0, v - e))
        n = du.cross(dv).normalized()
        if n.dot(p - Vector((0, 0, 0.2))) < 0:
            n = -n
        t = du.normalized()
        return p, n, t, n.cross(t)
    # the stars: little four-pointed ones laid on the cloth, here and there (not underneath)
    rng = P.rng
    spots = []
    while len(spots) < 22:
        d = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-0.3, 1)))
        if d.length < 0.3 or d.length > 1 or any((d.normalized() - q).length < 0.32 for q in spots):
            continue
        spots.append(d.normalized())
    for k, d in enumerate(spots):
        p, n, t, b = frame(*UV(d))
        r = 0.022 + 0.012 * (k % 3 == 0)
        pts = [p + n * 0.004] + [p + n * 0.004 + (t * math.cos(j / 8 * math.tau) + b * math.sin(j / 8 * math.tau)) * (r if j % 2 == 0 else r * 0.35) for j in range(8)]
        mb.add(pts, [rgb('#fff0a0')] + [rgb('#f8e070')] * 8, [n] * 9, [(0, 1 + j, 1 + (j + 1) % 8) for j in range(8)])
    # the moon: a crescent on its front
    p, n, t, b = frame(*UV(Vector((-0.4, -0.88, 0.05))))
    t = (Vector((1, 0, 0)) - n * n.x).normalized()
    b = n.cross(t).normalized()
    if b.z < 0:
        b = -b
    outer = [(math.cos(a) * 0.06, math.sin(a) * 0.06) for a in (math.pi * (0.5 + j / 8) for j in range(9))]
    inner = [(0.025 + math.cos(a) * 0.05, 0.008 + math.sin(a) * 0.05) for a in (math.pi * (0.5 + j / 8) for j in range(9))]
    pts, ff = [], []
    for j in range(9):
        for (x, y) in (outer[j], inner[j]):
            pts.append(p + n * 0.005 + t * x + b * y)
        if j:
            ff += [(2 * j - 2, 2 * j, 2 * j + 1), (2 * j - 2, 2 * j + 1, 2 * j - 1)]
    mb.add(pts, [rgb('#fbf0b8')] * len(pts), [n] * len(pts), ff)


@item('sushi_counter', 3, 1)
def sushi_counter(P):
    """A sushi bar's counter: a thick top of pale hinoki with a lip, the dark wooden front in a lattice of slender slats
    between rails, a pale bamboo skirting."""
    mb, w, d, h = P.main, 2.8, 0.7, 1.0
    darkw, slat = wood('#6a4228', 'z'), wood('#7a5032', 'z')
    z0, z1 = counter_body(P, w, d, h, wood('#ecd6a4'), darkw, wood('#d8c08a'), '#3a2414', top_t=0.075)
    y = -d / 2
    for zz in (z0 + 0.04, z1 - 0.04):
        lbox(mb, -w / 2 + 0.02, y - 0.03, zz - 0.025, w / 2 - 0.02, y + 0.01, zz + 0.025, wood('#5a3620'), r=0.008)
    n = 26
    for k in range(n + 1):
        x = -1.3 + k * 2.6 / n
        lbox(mb, x - 0.016, y - 0.024, z0 + 0.065, x + 0.016, y + 0.01, z1 - 0.065, slat, r=0.008)
    # a little noren-blue panel in the middle of the lattice, a pale wave on it
    lbox(mb, -0.2, y - 0.03, z0 + 0.12, 0.2, y - 0.016, z1 - 0.12, paint('#2e4a7a'), r=0.01)
    for k in range(3):
        m = len(mb.v)
        tube(mb, [(-0.14 + k * 0.1 + 0.05 * math.cos(a), y - 0.034, (z0 + z1) / 2 - 0.02 + 0.05 * math.sin(a)) for a in (math.pi * j / 6 for j in range(7))], 0.007, shade('#f0ece0'), seg=4)


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
