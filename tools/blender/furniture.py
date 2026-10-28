"""The rooms' furniture for the new 3D look, each piece after its picture in the game (the HD furniture art), in the
dollhouse style of the props: rounded painted pieces with their colors in the mesh (wood grain, fabric, a little
darker underneath), nothing baked.

A piece stands on its footprint (w tiles across, h deep, its middle at the origin, -y the front, z up, one unit a
tile); things that other things stand on mark their top with an empty (anchor_top). Each is one model, furn_<id>:
its painted parts, a glossy part (glass, glaze, screens: furn_<id>_gloss) and a lit part (bulbs, flames:
furn_<id>_glow, drawn unlit); a wall piece (furn_f.py) may have a face the game paints with the piece's own picture
(furn_<id>_pic, or furn_<id>_picglow unlit); an arcade cabinet a screen the game shows its game on (furn_<id>_screen), and
what moves is its own part (furn_<id>_move: the claw, a conveyor's plates). The kit (table, chair, bed, sofa, cabinet, shelf, counter, lamp, plant...) makes the
common shapes; the pieces are in furn_*.py, each a function taking a Piece and filling it.

    python tools/blender/furniture.py [--batch furn_a] [--preview DIR] [--only bed_simple,table_wood] [--sprites DIR]

--sprites DIR renders each piece on its own, from the classic art's three-quarter view with nothing behind it, into
DIR/f_<id>.png at 8 pixels for each of the classic art's (and DIR/sprites.json: each one's size and where its footprint's
front edge is); tools/sprites_to_atlas.py shrinks them to the classic art's size and adds them to the sprite atlas (the
pictures the flat views and the menus show of a piece that only exists as a model).
"""
import sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from common import *
from trees_ac import vmat
from furn_kit import ITEMS, Piece
# the pieces register themselves as their files are read (only the batch asked for, when one is)
_b = sys.argv[sys.argv.index('--batch') + 1] if '--batch' in sys.argv else None
for _m in ([_b] if _b else ['furn_a', 'furn_b', 'furn_c', 'furn_d', 'furn_e', 'furn_f', 'furn_g', 'furn_h', 'furn_i', 'furn_j', 'furn_k']):
    try:
        __import__(_m)
    except ModuleNotFoundError:
        pass


# ---------------------------------------------------------------- sprites
SPRITE_ELEV, SPRITE_PPU = 41.0, 128     # the classic art's view (its heights about three quarters of its widths), 8x its 16 a tile


def sprite_sheet(shown, out):
    """each piece alone, lit by the game's sun and sky, from the three-quarter view, orthographic, nothing behind it"""
    import json
    os.makedirs(out, exist_ok=True)
    light_rig(sun_strength=3.4, sky_strength=1.1)
    e = math.radians(SPRITE_ELEV)
    up = Vector((0, math.sin(e), math.cos(e)))
    cd = bpy.data.cameras.new('SpriteCam')
    cd.type = 'ORTHO'
    cam = link(bpy.data.objects.new('SpriteCam', cd))
    cam.rotation_euler = (math.pi / 2 - e, 0, 0)
    bpy.context.scene.camera = cam
    # (a run with --only adds to what's there)
    mp = os.path.join(out, 'sprites.json')
    meta = json.load(open(mp)) if os.path.exists(mp) else {}
    for id, w, h, objs in shown:
        mine = set(o.name for o in objs)
        for o in bpy.data.objects:
            if o.type == 'MESH':
                o.hide_render = o.name not in mine
        pts = [o.matrix_world @ Vector(c) for o in objs if o.type == 'MESH' for c in o.bound_box]
        if not pts:
            continue
        xs = [p.x for p in pts]
        ys = [p.dot(up) for p in pts]
        x0, x1, y0, y1 = min(xs) - 0.04, max(xs) + 0.04, min(min(ys), -h / 2 * math.sin(e)) - 0.04, max(ys) + 0.04
        rx, ry = x1 - x0, y1 - y0
        cd.ortho_scale = max(rx, ry)
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        # (the camera's middle on the box's middle: across is x, up the picture is `up`, back along the view)
        fwd = Vector((0, math.cos(e), -math.sin(e)))
        cam.location = Vector((cx, 0, 0)) + up * cy - fwd * 20
        W, H = max(8, round(rx * SPRITE_PPU)), max(8, round(ry * SPRITE_PPU))
        render(os.path.join(out, f'f_{id}.png'), size=(W, H), samples=24, transparent=True)
        # (where the footprint's front edge is, in the picture: the classic art's anchor)
        fy = -h / 2 * math.sin(e)
        meta[f'f_{id}'] = {'w': W, 'h': H, 'ax': (0 - x0) / rx * W, 'ay': (y1 - fy) / ry * H}
    for o in bpy.data.objects:
        o.hide_render = False
    with open(os.path.join(out, 'sprites.json'), 'w') as f:
        json.dump(meta, f, indent=1)


# ---------------------------------------------------------------- export
def objects(P):
    out = []
    for part, mb, rough in (('main', P.main, 0.75), ('gloss', P.gloss, 0.3), ('glow', P.glow, 0.5), ('clear', P.clear, 0.1), ('pic', P.pic, 0.8), ('picglow', P.picglow, 0.5),
                            ('screen', P.screen, 0.3), ('move', P.move, 0.6), ('hour', P.hour, 0.5), ('minute', P.minute, 0.5)):
        if not mb.v:
            continue
        out.append(mb.obj(f'furn_{P.id}_{part}', vmat(f'furn_{P.id}' + ('' if part == 'main' else '_' + part), rough=rough)))
    for k, p in P.anchors.items():
        e = bpy.data.objects.new(f'anchor_{k}', None)
        e.location = p
        link(e)
        out.append(e)
    return out


if __name__ == '__main__':
    args = sys.argv[1:]
    prev = args[args.index('--preview') + 1] if '--preview' in args else None
    only = args[args.index('--only') + 1].split(',') if '--only' in args else None
    batch = args[args.index('--batch') + 1] if '--batch' in args else None
    sprites = args[args.index('--sprites') + 1] if '--sprites' in args else None
    reset()
    shown = []
    for id, (w, h, fn) in ITEMS.items():
        if only and id not in only:
            continue
        if batch and fn.__module__ != batch:
            continue
        P = Piece(id, w, h)
        fn(P)
        objs = objects(P)
        export(objs, f'furn_{id}')
        for o in objs:
            if o.name.startswith('anchor_'):
                o.name = f'done_{id}_{o.name}'
        shown.append((id, w, h, objs))
        print('built', id, sum(len(o.data.vertices) for o in objs if o.type == 'MESH'), 'vertices')
    if sprites:
        sprite_sheet(shown, sprites)
    if prev:
        # a sheet of them on a floor, in rows of six, a stand-in for Sarah for their size
        ground_plane(size=200, color='#c8a878')
        light_rig()
        cols = 6
        for k, (id, w, h, objs) in enumerate(shown):
            x, y = (k % cols) * 2.6, -(k // cols) * 2.4
            for o in objs:
                o.location.x += x
                o.location.y += y
        rows = (len(shown) + cols - 1) // cols
        person(x=-1.4, y=0.0, h=1.62)
        camera(((cols - 1) * 1.3 - 0.5, -(rows - 1) * 1.2, 0.6), dist=4.5 + rows * 2.3, pitch=40)
        render(os.path.join(prev, f'furn_{batch or "all"}.png'), size=(1600, 300 + rows * 260), samples=28)
