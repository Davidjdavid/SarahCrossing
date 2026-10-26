"""The rooms' furniture for the new 3D look, each piece after its picture in the game (the HD furniture art), in the
dollhouse style of the props: rounded painted pieces with their colors in the mesh (wood grain, fabric, a little
darker underneath), nothing baked.

A piece stands on its footprint (w tiles across, h deep, its middle at the origin, -y the front, z up, one unit a
tile); things that other things stand on mark their top with an empty (anchor_top). Each is one model, furn_<id>:
its painted parts, a glossy part (glass, glaze, screens: furn_<id>_gloss) and a lit part (bulbs, flames:
furn_<id>_glow, drawn unlit); a wall piece (furn_f.py) may have a face the game paints with the piece's own picture
(furn_<id>_pic, or furn_<id>_picglow unlit). The kit (table, chair, bed, sofa, cabinet, shelf, counter, lamp, plant...) makes the
common shapes; the pieces are in furn_*.py, each a function taking a Piece and filling it.

    python tools/blender/furniture.py [--batch furn_a] [--preview DIR] [--only bed_simple,table_wood]
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from common import *
from trees_ac import vmat
from furn_kit import ITEMS, Piece
# the pieces register themselves as their files are read (only the batch asked for, when one is)
_b = sys.argv[sys.argv.index('--batch') + 1] if '--batch' in sys.argv else None
for _m in ([_b] if _b else ['furn_a', 'furn_b', 'furn_c', 'furn_d', 'furn_e', 'furn_f']):
    try:
        __import__(_m)
    except ModuleNotFoundError:
        pass


# ---------------------------------------------------------------- export
def objects(P):
    out = []
    for part, mb, rough in (('main', P.main, 0.75), ('gloss', P.gloss, 0.3), ('glow', P.glow, 0.5), ('clear', P.clear, 0.1), ('pic', P.pic, 0.8), ('picglow', P.picglow, 0.5)):
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
