#!/usr/bin/env python3
"""Build a proportion-based exterior concept model for Kaiyun-2 / Lilac-3.

This is deliberately a visual study, not an engineering drawing.  Public
descriptions establish the disc-shaped configuration and star tracker, but do
not publish dimensions, deployment geometry, or external interfaces.
"""

from math import cos, pi, sin
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "design" / "models"
OUT.mkdir(parents=True, exist_ok=True)

verts, faces, groups = [], [], []
current = "body"


def group(name):
    global current
    current = name
    groups.append((name, len(faces)))


def add_vertex(x, y, z):
    verts.append((x, y, z))
    return len(verts)


def quad(a, b, c, d):
    faces.append((current, (a, b, c, d)))


def cylinder(radius, height, segments=48, z0=0):
    bottom = [add_vertex(radius * cos(2*pi*i/segments), radius * sin(2*pi*i/segments), z0) for i in range(segments)]
    top = [add_vertex(radius * cos(2*pi*i/segments), radius * sin(2*pi*i/segments), z0 + height) for i in range(segments)]
    cb, ct = add_vertex(0, 0, z0), add_vertex(0, 0, z0 + height)
    for i in range(segments):
        j = (i + 1) % segments
        quad(bottom[i], bottom[j], top[j], top[i])
        faces.append((current, (cb, bottom[j], bottom[i])))
        faces.append((current, (ct, top[i], top[j])))


def torus(major, minor, major_segments=64, minor_segments=10, z=0):
    rings = []
    for i in range(major_segments):
        a = 2*pi*i/major_segments
        rings.append([add_vertex((major + minor*cos(2*pi*j/minor_segments))*cos(a),
                                 (major + minor*cos(2*pi*j/minor_segments))*sin(a),
                                 z + minor*sin(2*pi*j/minor_segments)) for j in range(minor_segments)])
    for i in range(major_segments):
        for j in range(minor_segments):
            quad(rings[i][j], rings[(i+1) % major_segments][j], rings[(i+1) % major_segments][(j+1) % minor_segments], rings[i][(j+1) % minor_segments])


def box(cx, cy, cz, sx, sy, sz, angle=0):
    # A rectangular petal or instrument box, rotated about Z.
    pts = []
    for z in (-sz/2, sz/2):
        for x, y in ((-sx/2, -sy/2), (sx/2, -sy/2), (sx/2, sy/2), (-sx/2, sy/2)):
            rx, ry = x*cos(angle) - y*sin(angle), x*sin(angle) + y*cos(angle)
            pts.append(add_vertex(cx + rx, cy + ry, cz + z))
    for f in ((0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)):
        quad(*(pts[i] for i in f))


# Thin circular main bus.  Reference photographs show photovoltaic cells across
# the whole upper face, not deployable wings.
group("body")
cylinder(1.00, 0.16, z0=-0.08)
group("rim")
torus(1.02, 0.045, z=0.02)
group("solar_cells")
for ix in range(-6, 7):
    for iy in range(-6, 7):
        x, y = ix * 0.135, iy * 0.135
        if x*x + y*y < 0.79*0.79:
            box(x, y, 0.092, 0.122, 0.122, 0.014, pi/12)

# Reference photos show small perimeter electronics, optical heads and harnesses.
group("perimeter_modules")
for i, a in enumerate((0.20, 1.28, 2.46, 3.57, 4.65, 5.55)):
    box(1.06*cos(a), 1.06*sin(a), 0.045, 0.18, 0.11, 0.12, a)
group("star_trackers")
for a in (0.65, 3.80):
    box(1.14*cos(a), 1.14*sin(a), 0.13, 0.12, 0.12, 0.24, a)
group("harness")
for a in (0.95, 2.10, 3.25, 4.35, 5.20):
    # Simple short radial harnesses standing proud of the rim.
    box(1.16*cos(a), 1.16*sin(a), -0.02, 0.26, 0.025, 0.025, a)

materials = {
    "body": ("0.10 0.11 0.13", "0.55"),
    "rim": ("0.73 0.50 0.10", "0.75"),
    "solar_cells": ("0.015 0.055 0.095", "0.25"),
    "perimeter_modules": ("0.65 0.65 0.61", "0.7"),
    "star_trackers": ("0.72 0.19 0.08", "0.7"),
    "harness": ("0.48 0.12 0.05", "0.45"),
}

mtl = ["# Kaiyun-2 concept materials"]
for name, (color, shine) in materials.items():
    mtl += [f"newmtl {name}", f"Kd {color}", f"Ks 0.35 0.35 0.35", f"Ns {float(shine)*100:.0f}", ""]
(OUT / "kaiyun-2-concept.mtl").write_text("\n".join(mtl), encoding="utf-8")

obj = ["# Kaiyun-2 / Lilac-3 exterior concept", "# Proportions are inferred; not for manufacture.", "mtllib kaiyun-2-concept.mtl"]
obj += [f"v {x:.6f} {y:.6f} {z:.6f}" for x, y, z in verts]
last = None
for name, face in faces:
    if name != last:
        obj += [f"g {name}", f"usemtl {name}"]
        last = name
    obj.append("f " + " ".join(str(i) for i in face))
(OUT / "kaiyun-2-concept.obj").write_text("\n".join(obj) + "\n", encoding="utf-8")

# A lightweight isometric preview: it documents the intended visual silhouette.
svg = '''<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
<defs><radialGradient id="space"><stop stop-color="#23344c"/><stop offset="1" stop-color="#05070c"/></radialGradient><pattern id="cells" width="52" height="42" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)"><rect width="52" height="42" fill="#061a2d"/><path d="M2 2h48v38H2z M14 2v38 M26 2v38 M38 2v38 M2 21h48" fill="none" stroke="#64819b" stroke-width="1.5"/></pattern><linearGradient id="body" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#3a4149"/><stop offset="1" stop-color="#0f141a"/></linearGradient></defs>
<rect width="1600" height="1000" fill="url(#space)"/>
<g fill="#fff" opacity=".65"> <circle cx="130" cy="155" r="2"/><circle cx="300" cy="80" r="1.5"/><circle cx="1240" cy="160" r="2"/><circle cx="1450" cy="320" r="1"/><circle cx="1120" cy="80" r="1"/><circle cx="220" cy="770" r="1"/></g>
<g transform="translate(800 500) rotate(-8)">
<ellipse cx="0" cy="38" rx="300" ry="139" fill="#0b1017" stroke="#9b7421" stroke-width="13"/>
<ellipse cx="0" cy="-5" rx="286" ry="128" fill="url(#body)" stroke="#d4a830" stroke-width="10"/>
<ellipse cx="0" cy="-18" rx="268" ry="118" fill="url(#cells)" stroke="#5d6e78" stroke-width="4"/>
<g stroke="#8d6c21" stroke-width="8" fill="#d8d7c7"><rect x="-275" y="-45" width="45" height="35" rx="5"/><rect x="225" y="-45" width="45" height="35" rx="5"/><rect x="-35" y="-140" width="45" height="35" rx="5"/><rect x="-40" y="100" width="45" height="35" rx="5"/></g>
<g fill="#d35335" stroke="#f0d7a0" stroke-width="4"><path d="M-245 -115l-32-45 18-18 44 32z"/><path d="M245 80l32 45-18 18-44-32z"/></g>
<g stroke="#d8832e" stroke-width="4" fill="none"><path d="M-290 35q-65 48-44 110"/><path d="M285 15q70 42 44 102"/><path d="M110 125q42 65 104 55"/></g>
</g>
<text x="85" y="875" fill="#f3f6f8" font-family="Arial, sans-serif" font-size="42" font-weight="700">开运二号 / 紫丁香三号</text><text x="88" y="925" fill="#aebdca" font-family="Arial, sans-serif" font-size="26">碟形卫星 · 外观概念模型（比例与细节按公开资料推定）</text>
</svg>'''
(OUT / "kaiyun-2-concept-preview.svg").write_text(svg, encoding="utf-8")

readme = """# 开运二号（紫丁香三号）外观概念模型

文件：`kaiyun-2-concept.obj`（含材质引用）、`kaiyun-2-concept.mtl`、`kaiyun-2-concept-preview.svg`。

依据公开资料：超薄扁平碟形构型、星敏感器、空间态势感知任务。直径、厚度、太阳翼展开方式、接口和内部结构均未见正式公开参数，因此采用视觉比例推定；不可用于制造、装配或性能判断。
"""
(OUT / "README.md").write_text(readme, encoding="utf-8")
print(OUT)
