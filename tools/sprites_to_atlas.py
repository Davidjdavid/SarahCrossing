"""Add pictures rendered from models (tools/blender/furniture.py --sprites DIR) to the sprite atlas, at the classic art's size.

    python3 tools/sprites_to_atlas.py DIR [--only f_od_] [--add]

Each picture (8 pixels for each of the classic art's) is shrunk to the classic size (a tile 16 pixels across), its edge
made crisp (each pixel there or not, as the classic art is) and added to game/assets/atlas.png below the atlas's own
1024 rows, packed in shelves; game/assets/atlas.json gets its frame ([x, y, w, h, ax, ay], ax/ay its footprint's front
edge). Running it again packs them all afresh: everything below row 1024 is made again from DIR. With --add, the pictures
already below row 1024 are kept (cut from the atlas as they are) and packed in with DIR's, which replace any of the same
name: a new batch's pictures go in without rendering the earlier ones again.
"""
import json, os, sys
from PIL import Image, ImageEnhance

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
ATLAS, FRAMES = os.path.join(ROOT, 'game', 'assets', 'atlas.png'), os.path.join(ROOT, 'game', 'assets', 'atlas.json')
BASE = 1024         # the atlas's own rows (the one-page game's sprites); what's below them is made here
K = 8               # the rendered pictures' pixels to one of the classic art's


def shrink(path, meta):
    im = Image.open(path).convert('RGBA')
    w, h = max(1, round(meta['w'] / K)), max(1, round(meta['h'] / K))
    small = im.convert('RGBa').resize((w, h), Image.LANCZOS).convert('RGBA')
    # (a little more color and contrast, as the classic art has; then each pixel there or not)
    rgb = ImageEnhance.Contrast(ImageEnhance.Color(small.convert('RGB')).enhance(1.15)).enhance(1.08)
    a = small.getchannel('A').point(lambda v: 255 if v >= 110 else 0)
    out = rgb.convert('RGBA')
    out.putalpha(a)
    # (trim empty rows and columns, keeping the anchor where it was)
    box = a.getbbox() or (0, 0, w, h)
    ax, ay = meta['ax'] / K, meta['ay'] / K
    out = out.crop(box)
    return out, round(ax - box[0]), round(ay - box[1])


def main():
    src = sys.argv[1]
    only = sys.argv[sys.argv.index('--only') + 1] if '--only' in sys.argv else ''
    meta = json.load(open(os.path.join(src, 'sprites.json')))
    pics = []
    for name in sorted(meta):
        if only and not name.startswith(only):
            continue
        p = os.path.join(src, name + '.png')
        if os.path.exists(p):
            pics.append((name,) + shrink(p, meta[name]))
    frames = json.load(open(FRAMES))
    full = Image.open(ATLAS).convert('RGBA')
    if '--add' in sys.argv:
        have = {p[0] for p in pics}
        for k, (fx, fy, fw, fh, fax, fay) in frames.items():
            if fy >= BASE and k not in have:
                pics.append((k, full.crop((fx, fy, fx + fw, fy + fh)), fax, fay))
    frames = {k: v for k, v in frames.items() if v[1] < BASE}
    base = full.crop((0, 0, 1024, BASE))
    # shelves, tallest first
    pics.sort(key=lambda t: -t[1].height)
    x = y = shelf = 0
    spots = []
    for name, im, ax, ay in pics:
        if x + im.width + 1 > 1024:
            x, y, shelf = 0, y + shelf + 1, 0
        spots.append((name, im, ax, ay, x, y))
        x += im.width + 1
        shelf = max(shelf, im.height)
    extra = (y + shelf + 1 + 15) // 16 * 16
    atlas = Image.new('RGBA', (1024, BASE + extra), (0, 0, 0, 0))
    atlas.paste(base, (0, 0))
    for name, im, ax, ay, x, y in spots:
        atlas.paste(im, (x, BASE + y))
        frames[name] = [x, BASE + y, im.width, im.height, ax, ay]
    atlas.save(ATLAS, optimize=True)
    with open(FRAMES, 'w') as f:
        f.write('{\n' + ',\n'.join(f'  {json.dumps(k)}: [{",".join(str(int(n)) for n in v)}]' for k, v in frames.items()) + '\n}\n')
    print(f'{len(spots)} pictures added below row {BASE}: the atlas is now 1024 x {BASE + extra}')


if __name__ == '__main__':
    main()
