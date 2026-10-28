"""Furniture, part eleven: pieces that do something when Sarah taps them (David's list, 28 October: "a TV switches on to
static..."). A retro television on splayed legs, its screen its own part (furn_tv_retro_screen: the game shows static
on it while it's on, a dark glass while it's off), and a record player on a low cabinet, its record its own part
(furn_record_player_move), centered on the piece's middle so the game can spin it in place while it plays."""
import math
from mathutils import Matrix
from trees_ac import rgb
from kit import col_fn, shade, rbox, lathe, tube, cyl, xform
from folks import ball
from furn_kit import *


def face(mb, x0, x1, z0, z1, y):
    """a flat face toward the room (-y) at y: the screen's (dark glass in the flat picture; the game paints it)"""
    mb.add([(x0, y, z0), (x1, y, z0), (x1, y, z1), (x0, y, z1)], [(0.1, 0.11, 0.14)] * 4, [(0, -1, 0)] * 4, [(0, 1, 2), (0, 2, 3)])


@item('tv_retro', 1, 1)
def tv_retro(P):
    """A chunky wooden television: four splayed legs, the screen in a rounded dark bezel on the left, two knobs and a
    slatted speaker on the right, a little red light, rabbit-ear antennas on a dome on top."""
    mb, body = P.main, wood('#9a6438', grain='x')
    for sx in (-1, 1):
        for sy in (-1, 1):
            tube(mb, [(sx * 0.28, sy * 0.18, 0.22), (sx * 0.34, sy * 0.23, 0.0)], 0.022, wood('#6a4224'), seg=8, r1=0.015)
    rbox(mb, -0.41, -0.3, 0.2, 0.41, 0.3, 0.8, body, r=0.07)
    # the front: a cream panel, the screen in its bezel, the controls beside it
    rbox(mb, -0.38, -0.325, 0.25, 0.38, -0.27, 0.75, paint('#ecdcbc'), r=0.04)
    rbox(mb, -0.35, -0.345, 0.29, 0.12, -0.3, 0.71, '#2a2830', r=0.06)
    face(P.screen, -0.315, 0.085, 0.33, 0.67, -0.347)
    for z in (0.62, 0.49):
        ball(mb, (0.255, -0.345, z), (0.045, 0.03, 0.045), shade('#5a3a22'), sub=2)
        rbox(mb, 0.251, -0.378, z - 0.004, 0.259, -0.37, z + 0.034, '#f2ead8', r=0.003, mid=0)
    for k in range(5):
        z = 0.31 + k * 0.022
        rbox(mb, 0.17, -0.338, z, 0.34, -0.33, z + 0.01, '#6a4a30', r=0.003, mid=0)
    ball(P.glow, (0.33, -0.336, 0.42), 0.013, '#ff4a3a', sub=1)
    # the antennas
    ball(mb, (0.0, 0.06, 0.8), (0.1, 0.07, 0.05), shade('#2a2830'), sub=2)
    for s in (-1, 1):
        tube(mb, [(s * 0.02, 0.06, 0.83), (s * 0.3, 0.12, 1.28)], 0.008, metal('#c8ccd4'), seg=6)
        ball(mb, (s * 0.3, 0.12, 1.29), 0.016, metal('#d8dce4'), sub=1)


@item('record_player', 1, 1)
def record_player(P):
    """A low wooden cabinet with cloth speakers either side, and on top a turntable: the platter, the record on it (its
    own part, the label half red and half cream so it shows turning) and the tone arm resting on its edge."""
    mb, body = P.main, wood('#7a4626', grain='x')
    for sx in (-1, 1):
        for sy in (-1, 1):
            tube(mb, [(sx * 0.33, sy * 0.2, 0.18), (sx * 0.36, sy * 0.24, 0.0)], 0.02, wood('#4a2a18'), seg=8, r1=0.014)
    rbox(mb, -0.43, -0.31, 0.16, 0.43, 0.31, 0.6, body, r=0.04)
    for x0 in (-0.39, 0.13):
        rbox(mb, x0, -0.322, 0.21, x0 + 0.26, -0.3, 0.55, fabric('#cdb48a', seed=x0), r=0.02)
    rbox(mb, -0.11, -0.32, 0.36, 0.11, -0.3, 0.4, wood('#5a321c'), r=0.01)
    rbox(mb, -0.42, -0.3, 0.6, 0.42, 0.3, 0.64, wood('#5a321c', grain='x'), r=0.015)
    # the platter, round the piece's middle (the record turns about it)
    cyl(mb, 0, 0, 0.64, 0.665, 0.25, color=metal('#b8bcc4'), seg=28, round_=0.006)
    # (the record turned from rings across its top, so its grooves, label and spindle each keep their own color)
    def vinyl(p, n, *_):
        r = math.hypot(p.x, p.y)
        if r < 0.016:
            return rgb('#c8ccd4')
        if r < 0.076:
            return rgb('#d8403a') if p.x > 0 else rgb('#f2e6c8')
        return rgb('#1a1a20') * (1.0 if int(r / 0.011) % 2 else 0.78)
    prof, r = [(0.235, 0.665), (0.235, 0.676)], 0.226
    while r > 0.08:
        prof.append((r, 0.676))
        r -= 0.011
    prof += [(0.077, 0.676), (0.075, 0.68), (0.05, 0.68), (0.03, 0.68), (0.017, 0.68), (0.015, 0.685), (0.0, 0.685)]
    lathe(P.move, prof, vinyl, seg=36, cap_top=False)
    # the tone arm: its post at the back right, the arm reaching onto the record's edge
    cyl(mb, 0.32, 0.2, 0.64, 0.7, 0.03, color=metal('#c8ccd4'), seg=12, round_=0.008)
    tube(mb, [(0.32, 0.2, 0.71), (0.26, 0.05, 0.705), (0.17, -0.1, 0.695)], 0.009, metal('#d8dce4'), seg=6)
    rbox(mb, 0.14, -0.13, 0.68, 0.19, -0.09, 0.7, '#2a2830', r=0.006, mid=0)


@item('stamp_stand', 1, 1)
def stamp_stand(P):
    """Museum Day's stamp stand: a little wooden lectern on a round foot, its top tilted toward the room with a cream stamp
    card on it, a red ink pad and a rubber stamp with a round wooden knob; a brass plate on the front of the top."""
    mb = P.main
    cyl(mb, 0, 0, 0.0, 0.045, 0.2, color=wood('#4a2a18'), seg=20, round_=0.012)
    cyl(mb, 0, 0, 0.045, 0.6, 0.045, 0.035, color=wood('#6a3e22', grain='z'), seg=12, round_=0.008)
    cyl(mb, 0, 0, 0.58, 0.62, 0.07, color=wood('#4a2a18'), seg=14, round_=0.01)
    # the top, tilted 25 degrees toward the room, and what lies on it
    m = len(mb.v)
    rbox(mb, -0.25, -0.17, -0.022, 0.25, 0.17, 0.022, wood('#7a4626', grain='x'), r=0.012)
    rbox(mb, -0.23, -0.15, 0.022, 0.23, -0.12, 0.034, wood('#5a321c', grain='x'), r=0.006, mid=0)
    rbox(mb, -0.2, -0.09, 0.022, 0.06, 0.12, 0.028, paint('#f4ead2'), r=0.004, mid=0)
    for k in range(6):
        cx, cy = -0.155 + (k % 3) * 0.085, 0.07 - (k // 3) * 0.1
        rbox(mb, cx - 0.026, cy - 0.026, 0.028, cx + 0.026, cy + 0.026, 0.03, paint('#d8c8a4'), r=0.004, mid=0)
    rbox(mb, 0.1, 0.0, 0.022, 0.21, 0.1, 0.04, '#2a2830', r=0.01, mid=0)
    rbox(mb, 0.11, 0.01, 0.04, 0.2, 0.09, 0.045, paint('#c8443a'), r=0.006, mid=0)
    rbox(mb, 0.115, -0.1, 0.022, 0.185, -0.04, 0.05, paint('#3a2a20'), r=0.008, mid=0)
    cyl(mb, 0.15, -0.07, 0.05, 0.1, 0.012, color=wood('#8a5a32'), seg=8)
    from folks import ball
    ball(mb, (0.15, -0.07, 0.115), 0.026, wood('#a8703c'), sub=2)
    rbox(mb, -0.07, -0.19, -0.012, 0.07, -0.168, 0.012, metal('#d8b048'), r=0.004, mid=0)
    xform(mb, m, Matrix.Translation((0, 0, 0.66)) @ Matrix.Rotation(math.radians(25), 4, 'X'))
