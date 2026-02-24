#!/usr/bin/env python3
"""Generate desktop icons from the Card Duel logo theme."""

from __future__ import annotations

import math
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ICON_DIR = ROOT / "build" / "icons"
ICONSET_DIR = ICON_DIR / "icon.iconset"


def lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


def draw_gradient_background(img: Image.Image) -> None:
    w, h = img.size
    px = img.load()
    for y in range(h):
        t = y / (h - 1)
        r = lerp(18, 6, t)
        g = lerp(26, 42, t)
        b = lerp(54, 72, t)
        for x in range(w):
            px[x, y] = (r, g, b, 255)


def draw_logo(base: Image.Image) -> Image.Image:
    draw_gradient_background(base)
    d = ImageDraw.Draw(base, "RGBA")
    w, h = base.size
    cx, cy = w // 2, h // 2

    # glow aura
    glow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow, "RGBA")
    for i in range(18):
        radius = int(w * (0.14 + i * 0.018))
        alpha = max(0, 110 - i * 6)
        gd.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=(92, 107, 192, alpha))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=12))
    base.alpha_composite(glow)

    card_w = int(w * 0.23)
    card_h = int(h * 0.34)
    gap = int(w * 0.08)
    top = int(h * 0.31)
    left_card = (cx - gap - card_w, top, cx - gap, top + card_h)
    right_card = (cx + gap, top, cx + gap + card_w, top + card_h)

    # left card
    d.rounded_rectangle(left_card, radius=28, fill=(84, 94, 224, 255), outline=(57, 66, 171, 255), width=8)
    d.ellipse((left_card[0] + 38, left_card[1] + 40, left_card[0] + 92, left_card[1] + 94), fill=(239, 83, 80, 240))

    # right card
    d.rounded_rectangle(right_card, radius=28, fill=(40, 180, 246, 255), outline=(2, 136, 209, 255), width=8)
    d.ellipse((right_card[0] + 38, right_card[1] + 40, right_card[0] + 92, right_card[1] + 94), fill=(255, 215, 0, 240))

    # crossed blades
    blade = Image.new("RGBA", base.size, (0, 0, 0, 0))
    bd = ImageDraw.Draw(blade, "RGBA")
    bd.polygon([(cx - 95, cy + 34), (cx - 15, cy - 46), (cx + 8, cy - 23), (cx - 74, cy + 55)], fill=(255, 215, 0, 255))
    bd.polygon([(cx + 95, cy + 34), (cx + 15, cy - 46), (cx - 8, cy - 23), (cx + 74, cy + 55)], fill=(255, 215, 0, 255))
    bd.line([(cx - 15, cy - 46), (cx + 15, cy - 46)], fill=(255, 159, 0, 255), width=8)
    blade = blade.filter(ImageFilter.GaussianBlur(radius=0.6))
    base.alpha_composite(blade)

    # clash core
    d.ellipse((cx - 42, cy - 42, cx + 42, cy + 42), fill=(255, 255, 255, 210))
    d.ellipse((cx - 30, cy - 30, cx + 30, cy + 30), fill=(255, 179, 0, 255), outline=(255, 235, 59, 255), width=4)

    # particles
    particles = [(cx, int(h * 0.18)), (int(w * 0.21), cy), (int(w * 0.79), cy), (cx, int(h * 0.82))]
    for x, y in particles:
        d.ellipse((x - 9, y - 9, x + 9, y + 9), fill=(41, 182, 246, 220))

    # border ring
    d.ellipse((20, 20, w - 20, h - 20), outline=(255, 193, 7, 170), width=8)

    return base


def save_png_set(base: Image.Image) -> None:
    base.save(ICON_DIR / "icon.png")
    for size in (16, 24, 32, 48, 64, 128, 256, 512):
        resized = base.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(ICON_DIR / f"icon-{size}.png")


def save_ico(base: Image.Image) -> None:
    ico_target = ICON_DIR / "icon.ico"
    icon_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    base.save(ico_target, sizes=icon_sizes)


def save_icns(base: Image.Image) -> None:
    if shutil.which("iconutil") is None:
        print("iconutil not found, skipping .icns generation")
        return

    if ICONSET_DIR.exists():
        shutil.rmtree(ICONSET_DIR)
    ICONSET_DIR.mkdir(parents=True, exist_ok=True)

    entries = {
        "icon_16x16.png": 16,
        "icon_16x16@2x.png": 32,
        "icon_32x32.png": 32,
        "icon_32x32@2x.png": 64,
        "icon_128x128.png": 128,
        "icon_128x128@2x.png": 256,
        "icon_256x256.png": 256,
        "icon_256x256@2x.png": 512,
        "icon_512x512.png": 512,
        "icon_512x512@2x.png": 1024,
    }

    for name, size in entries.items():
        base.resize((size, size), Image.Resampling.LANCZOS).save(ICONSET_DIR / name)

    subprocess.run(
        ["iconutil", "-c", "icns", str(ICONSET_DIR), "-o", str(ICON_DIR / "icon.icns")],
        check=True,
    )


def main() -> None:
    ICON_DIR.mkdir(parents=True, exist_ok=True)
    canvas = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    base = draw_logo(canvas)

    save_png_set(base)
    save_ico(base)
    save_icns(base)

    print(f"Generated icons in {ICON_DIR}")


if __name__ == "__main__":
    main()
