"""Shared helpers for the Blender asset scripts (tools/blender/*.py).

Blender runs here as a Python module (pip install bpy, Blender 5.x), headless. Each asset script builds its model from
nothing with a fixed seed (the same script always makes the same model), bakes what the game can't afford to draw
(the detail of hundreds of leaf puffs, every stone's chips) into textures on a lighter mesh, renders previews from the
game's own camera and light, and exports a GLB into game/assets/models/ for the game to load (33a_env.js).

Axes: Blender is z-up with y north; the glTF export turns that into three.js's y-up, Blender's -y becoming the game's
+z (south, towards the camera). So a building's front faces -y here. One unit is one tile across.
"""
import bpy, bmesh, math, os, random
import numpy as np
from mathutils import Vector, Matrix

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MODELS = os.path.join(ROOT, 'game', 'assets', 'models')

# the game's camera (ENV.cam in 33a_env.js) and sun (31_render3d.js), in Blender's axes
CAM_PITCH, CAM_FOV = 34.0, 44.0
SUN_DIR = Vector((-0.55, -0.32, 0.78)).normalized()       # towards the sun: from the west, the south and above


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    s = bpy.context.scene
    s.render.engine = 'CYCLES'
    s.cycles.device = 'CPU'
    s.view_settings.view_transform = 'Standard'
    s.view_settings.look = 'None'
    return s


def link(obj):
    bpy.context.scene.collection.objects.link(obj)
    return obj


def mesh_obj(name, bm):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return link(bpy.data.objects.new(name, me))


def select_only(*objs):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[-1]


def apply_modifiers(obj):
    select_only(obj)
    for m in list(obj.modifiers):
        bpy.ops.object.modifier_apply(modifier=m.name)


def shade_smooth(obj, on=True):
    for p in obj.data.polygons:
        p.use_smooth = on


def smart_uv(obj, margin=0.004, angle=66):
    select_only(obj)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(angle), island_margin=margin)
    bpy.ops.object.mode_set(mode='OBJECT')


def hex_rgb(h, a=1.0):
    h = h.lstrip('#')
    srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]
    return (lin[0], lin[1], lin[2], a)


def mix(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(len(a)))


# ---------------------------------------------------------------- materials
def material(name, color=(0.8, 0.8, 0.8, 1), rough=0.9, vcol=None, image=None, normal=None, alpha=None):
    """A Principled material: a flat color, the mesh's color attribute (vcol), and/or image textures."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes.get('Principled BSDF')
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Base Color'].default_value = color
    if vcol:
        v = nt.nodes.new('ShaderNodeVertexColor')
        v.layer_name = vcol
        nt.links.new(v.outputs['Color'], bsdf.inputs['Base Color'])
    if image:
        t = nt.nodes.new('ShaderNodeTexImage')
        t.image = image
        nt.links.new(t.outputs['Color'], bsdf.inputs['Base Color'])
        if alpha:
            nt.links.new(t.outputs['Alpha'], bsdf.inputs['Alpha'])
            m.blend_method = 'CLIP' if hasattr(m, 'blend_method') else None
    if normal:
        t = nt.nodes.new('ShaderNodeTexImage')
        t.image = normal
        t.image.colorspace_settings.name = 'Non-Color'
        nm = nt.nodes.new('ShaderNodeNormalMap')
        nt.links.new(t.outputs['Color'], nm.inputs['Color'])
        nt.links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
    return m


def new_image(name, size, alpha=False, data=False):
    img = bpy.data.images.new(name, size, size, alpha=alpha, float_buffer=False)
    if data:
        img.colorspace_settings.name = 'Non-Color'
    return img


def image_from_array(name, arr, data=False):
    """An image from a float array (h, w, 3 or 4) in 0..1, row 0 at the bottom (Blender's order)."""
    h, w = arr.shape[:2]
    if arr.shape[2] == 3:
        arr = np.concatenate([arr, np.ones((h, w, 1), np.float32)], axis=2)
    img = bpy.data.images.new(name, w, h, alpha=True, float_buffer=False)
    if data:
        img.colorspace_settings.name = 'Non-Color'
    img.pixels.foreach_set(np.ascontiguousarray(arr, np.float32).ravel())
    img.pack()
    return img


def image_array(img):
    w, h = img.size
    a = np.empty(w * h * 4, np.float32)
    img.pixels.foreach_get(a)
    return a.reshape(h, w, 4)


# ---------------------------------------------------------------- baking
def bake(low, kind, size, high=None, name=None, extrusion=0.08, max_dist=0.0, samples=24, margin=12, data=False):
    """Bake one pass of `high` (or `low` itself) into a new image on `low`'s UVs: kind DIFFUSE (the color alone), AO,
    NORMAL (tangent space) or EMIT."""
    s = bpy.context.scene
    s.cycles.samples = samples
    img = new_image(name or f'{low.name}_{kind.lower()}', size, data=data or kind in ('NORMAL', 'AO'))
    for m in low.data.materials:
        nt = m.node_tree
        for n in [n for n in nt.nodes if n.name == '_bake']:
            nt.nodes.remove(n)
        t = nt.nodes.new('ShaderNodeTexImage')
        t.name = '_bake'
        t.image = img
        nt.nodes.active = t
    bk = s.render.bake
    bk.use_selected_to_active = high is not None
    bk.cage_extrusion = extrusion
    bk.max_ray_distance = max_dist
    bk.margin = margin
    if kind == 'DIFFUSE':
        bk.use_pass_direct = False
        bk.use_pass_indirect = False
        bk.use_pass_color = True
    if high is not None:
        select_only(high, low)
    else:
        select_only(low)
    bpy.ops.object.bake(type=kind)
    for m in low.data.materials:
        nt = m.node_tree
        n = nt.nodes.get('_bake')
        if n:
            nt.nodes.remove(n)
    img.pack()
    return img


# ---------------------------------------------------------------- the preview: the game's camera, sun and sky
def light_rig(sun_strength=4.0, sky=(0.62, 0.76, 0.92), sky_strength=0.85, warm=True):
    s = bpy.context.scene
    sun = bpy.data.lights.new('Sun', 'SUN')
    sun.energy = sun_strength
    sun.angle = math.radians(4)
    sun.color = (1.0, 0.94, 0.84) if warm else (1, 1, 1)
    so = link(bpy.data.objects.new('Sun', sun))
    so.rotation_euler = SUN_DIR.to_track_quat('Z', 'Y').to_euler()
    w = bpy.data.worlds.new('World')
    w.use_nodes = True
    bg = w.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = (*sky, 1)
    bg.inputs['Strength'].default_value = sky_strength
    s.world = w
    return so


def ground_plane(size=40, color='#5f9a3a'):
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=size / 2)
    o = mesh_obj('Ground', bm)
    o.data.materials.append(material('ground', hex_rgb(color), rough=1))
    return o


def person(x=1.6, y=-0.6, h=1.8):
    """A stand-in for Sarah at the size people stand in the new look (to judge scale)."""
    bpy.ops.mesh.primitive_cylinder_add(radius=0.24, depth=h * 0.62, location=(x, y, h * 0.31))
    body = bpy.context.active_object
    body.data.materials.append(material('shirt', hex_rgb('#c0304a')))
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.27, location=(x, y, h * 0.62 + 0.24))
    head = bpy.context.active_object
    head.data.materials.append(material('hair', hex_rgb('#8a4a2a')))
    return [body, head]


def camera(target, dist, pitch=CAM_PITCH, fov=CAM_FOV):
    c = bpy.data.cameras.new('Cam')
    c.sensor_fit = 'VERTICAL'
    c.angle_y = math.radians(fov)
    o = link(bpy.data.objects.new('Cam', c))
    p = math.radians(pitch)
    t = Vector(target)
    o.location = t + Vector((0, -dist * math.cos(p), dist * math.sin(p)))
    o.rotation_euler = (math.pi / 2 - p, 0, 0)
    bpy.context.scene.camera = o
    return o


def render(path, size=(900, 560), samples=48, transparent=False):
    s = bpy.context.scene
    s.render.resolution_x, s.render.resolution_y = size
    s.render.resolution_percentage = 100
    s.cycles.samples = samples
    s.cycles.use_denoising = True
    s.render.film_transparent = transparent
    s.render.image_settings.file_format = 'PNG'
    s.render.filepath = path
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.render.render(write_still=True)
    return path


# ---------------------------------------------------------------- export
def export(objs, name, jpeg=True):
    os.makedirs(MODELS, exist_ok=True)
    path = os.path.join(MODELS, name + '.glb')
    select_only(*objs)
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
                              export_texcoords=True, export_normals=True, export_materials='EXPORT',
                              export_image_format='JPEG' if jpeg else 'AUTO', export_jpeg_quality=88,
                              export_extras=False, export_animations=False)
    return path
