import os
from PIL import Image, ImageDraw
import numpy as np

OUTPUT_DIR = r"c:\Cassavas\Game2.5D\artifacts\mmorpg-game\public\assets\characters"

OUTLINE = (28, 22, 32, 255)
STEEL_DARK = (45, 50, 62, 255)
STEEL_MID = (78, 86, 102, 255)
STEEL_LIGHT = (145, 156, 175, 255)
STEEL_SPECULAR = (225, 235, 248, 255)

CRIMSON_CORE = (255, 45, 75, 255)
CRIMSON_MID = (215, 25, 55, 255)
CRIMSON_DARK = (135, 15, 35, 255)
CRIMSON_GLOW = (255, 120, 145, 255)
GOLD_SUN = (255, 215, 90, 255)

SKIN_BASE = (255, 218, 190, 255)
SKIN_SHADOW = (225, 175, 145, 255)
HAIR_BASE = (245, 195, 80, 255)
HAIR_HI = (255, 235, 140, 255)
HAIR_SH = (195, 140, 45, 255)
EYE_CYAN = (40, 215, 235, 255)
EYE_WHITE = (255, 255, 255, 255)
SHADOW_GROUND = (0, 0, 0, 95)

def draw_ground_shadow(d, cx, cy, rx, ry):
    for y in range(-ry, ry + 1):
        for x in range(-rx, rx + 1):
            if (x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1.0:
                d.point((cx + x, cy + y), fill=SHADOW_GROUND)

def generate_tank_female():
    # 80x90 canvas, upscaled to 360x360 with nearest neighbor
    img = Image.new("RGBA", (80, 90), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # 1. Ground shadow
    draw_ground_shadow(d, 40, 83, 24, 6)

    # 2. Flowing Crimson Cape with Fiery Aura (Behind character)
    # Left cape flame
    d.polygon([(18, 36), (12, 52), (15, 68), (22, 78), (25, 58)], fill=CRIMSON_DARK, outline=OUTLINE)
    d.polygon([(15, 42), (13, 56), (18, 70), (22, 60)], fill=CRIMSON_MID)
    # Right cape flame
    d.polygon([(56, 36), (68, 52), (65, 70), (58, 80), (52, 60)], fill=CRIMSON_DARK, outline=OUTLINE)
    d.polygon([(58, 42), (65, 56), (62, 72), (55, 62)], fill=CRIMSON_MID)

    # Cape sparks
    d.point((10, 48), fill=CRIMSON_GLOW)
    d.point((8, 42), fill=CRIMSON_CORE)
    d.point((70, 46), fill=CRIMSON_GLOW)
    d.point((72, 40), fill=CRIMSON_CORE)

    # 3. Flowing Blonde Hair Behind
    d.polygon([(26, 26), (22, 46), (27, 54), (29, 36)], fill=HAIR_SH, outline=OUTLINE)
    d.polygon([(51, 26), (56, 46), (50, 54), (48, 36)], fill=HAIR_SH, outline=OUTLINE)

    # 4. Slender Armored Legs & Sabatons
    # Left Leg
    d.rectangle([30, 58, 36, 76], fill=STEEL_MID, outline=OUTLINE)
    d.line([32, 59, 32, 75], fill=STEEL_SPECULAR) # Plate shine
    d.rectangle([28, 75, 37, 80], fill=STEEL_DARK, outline=OUTLINE) # Sabaton
    d.rectangle([29, 79, 38, 82], fill=(20, 22, 28, 255))
    # Right Leg
    d.rectangle([42, 58, 48, 76], fill=STEEL_MID, outline=OUTLINE)
    d.line([44, 59, 44, 75], fill=STEEL_SPECULAR)
    d.rectangle([41, 75, 50, 80], fill=STEEL_DARK, outline=OUTLINE)
    d.rectangle([42, 79, 51, 82], fill=(20, 22, 28, 255))

    # Knee poleyns
    d.rectangle([29, 64, 37, 68], fill=STEEL_LIGHT, outline=OUTLINE)
    d.rectangle([41, 64, 49, 68], fill=STEEL_LIGHT, outline=OUTLINE)

    # 5. Crimson Battle Skirt & Tassets (Hip Guards)
    d.rectangle([29, 52, 49, 60], fill=CRIMSON_MID, outline=OUTLINE) # Crimson skirt
    d.rectangle([36, 52, 42, 68], fill=CRIMSON_DARK, outline=OUTLINE) # Center tabard
    d.line([39, 54, 39, 66], fill=GOLD_SUN) # Tabard golden rune
    # Steel Hip Guards (Tassets)
    d.polygon([(27, 52), (32, 52), (31, 62), (26, 58)], fill=STEEL_MID, outline=OUTLINE)
    d.polygon([(46, 52), (51, 52), (52, 58), (47, 62)], fill=STEEL_MID, outline=OUTLINE)

    # 6. Hourglass Torso with Sculpted Cuirass & Crimson Sunburst Core
    d.rectangle([31, 44, 47, 53], fill=STEEL_DARK, outline=OUTLINE) # Waist armor
    d.line([39, 46, 39, 51], fill=CRIMSON_CORE) # Center energy conduit
    # Breastplate Cuirass
    d.rectangle([29, 35, 49, 45], fill=STEEL_MID, outline=OUTLINE)
    d.rectangle([32, 36, 46, 44], fill=STEEL_LIGHT)
    # Cleavage curve contour
    d.polygon([(36, 35), (39, 39), (42, 35)], fill=STEEL_DARK, outline=OUTLINE)

    # RADIANT SCARLET SUNBURST EMBLEM ON CHEST (Exact match to Tank Male!)
    d.rectangle([37, 38, 41, 42], fill=CRIMSON_CORE)
    d.point((39, 40), fill=GOLD_SUN) # Sun core
    # Radiating solar rays
    d.line([39, 36, 39, 44], fill=CRIMSON_CORE)
    d.line([35, 40, 43, 40], fill=CRIMSON_CORE)
    d.point((36, 37), fill=CRIMSON_GLOW)
    d.point((42, 37), fill=CRIMSON_GLOW)
    d.point((36, 43), fill=CRIMSON_GLOW)
    d.point((42, 43), fill=CRIMSON_GLOW)

    # 7. Left Arm & Giant Scarlet Sunburst Tower Shield
    d.rectangle([22, 38, 28, 48], fill=STEEL_MID, outline=OUTLINE)
    # Giant Kite Shield (Exact match to Tank Male!)
    d.polygon([(11, 38), (27, 34), (28, 66), (20, 76), (10, 64)], fill=STEEL_DARK, outline=OUTLINE)
    d.polygon([(14, 40), (25, 37), (25, 63), (20, 72), (13, 62)], fill=STEEL_LIGHT)
    # Scarlet Sunburst Crest on Shield
    d.rectangle([17, 48, 22, 53], fill=CRIMSON_CORE, outline=OUTLINE)
    d.point((19, 50), fill=GOLD_SUN)
    d.line([19, 44, 19, 57], fill=CRIMSON_CORE, width=2)
    d.line([13, 50, 25, 50], fill=CRIMSON_CORE, width=2)
    d.line([15, 46, 23, 54], fill=CRIMSON_MID)
    d.line([23, 46, 15, 54], fill=CRIMSON_MID)

    # 8. Right Arm & Fiery Crimson Holy Broadsword
    d.rectangle([49, 38, 55, 48], fill=STEEL_MID, outline=OUTLINE)
    # Sword Hilt & Pommel
    d.rectangle([51, 48, 54, 53], fill=(30, 25, 35, 255), outline=OUTLINE)
    d.rectangle([48, 53, 57, 55], fill=STEEL_DARK, outline=OUTLINE) # Crossguard
    d.point((52, 54), fill=CRIMSON_CORE) # Crossguard gem
    # Fiery Crimson Blade pointing down
    d.rectangle([50, 56, 55, 78], fill=STEEL_SPECULAR, outline=OUTLINE)
    d.line([52, 56, 52, 77], fill=(255, 255, 255, 255), width=1) # Blade edge
    d.polygon([(50, 78), (52, 82), (55, 78)], fill=STEEL_SPECULAR, outline=OUTLINE)
    # Crimson Fire Aura on Sword
    d.line([49, 58, 49, 76], fill=CRIMSON_CORE)
    d.line([56, 58, 56, 76], fill=CRIMSON_CORE)
    d.point((48, 62), fill=CRIMSON_GLOW)
    d.point((57, 68), fill=CRIMSON_GLOW)
    d.point((48, 74), fill=CRIMSON_GLOW)

    # 9. Neck & Steel Gorget
    d.rectangle([36, 31, 42, 35], fill=STEEL_DARK, outline=OUTLINE)

    # 10. Head & Beautiful Anime Face
    d.rectangle([31, 16, 47, 31], fill=SKIN_BASE, outline=OUTLINE)

    # Sexy & Determined Anime Eyes (Cyan glowing)
    # Left eye
    d.rectangle([34, 21, 38, 26], fill=EYE_WHITE, outline=OUTLINE)
    d.rectangle([36, 22, 38, 26], fill=EYE_CYAN)
    d.point((36, 22), fill=EYE_WHITE)
    d.line([33, 20, 38, 20], fill=OUTLINE) # Eyelash flick
    # Right eye
    d.rectangle([41, 21, 45, 26], fill=EYE_WHITE, outline=OUTLINE)
    d.rectangle([41, 22, 43, 26], fill=EYE_CYAN)
    d.point((41, 22), fill=EYE_WHITE)
    d.line([41, 20, 46, 20], fill=OUTLINE)

    # Lip tint
    d.point((39, 28), fill=(235, 95, 120, 255))

    # Flowing Blonde Forehead Bangs & Braids
    d.polygon([(30, 16), (35, 11), (39, 15), (36, 20)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(38, 12), (43, 10), (47, 15), (42, 20)], fill=HAIR_HI, outline=OUTLINE)
    d.polygon([(29, 18), (32, 27), (30, 22)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(46, 18), (48, 27), (47, 22)], fill=HAIR_BASE, outline=OUTLINE)

    # 11. Steel Valkyrie Tiara with CURVED FLAMING CRIMSON HORNS (Exact match to Tank Male!)
    d.rectangle([32, 14, 46, 17], fill=STEEL_MID, outline=OUTLINE)
    d.point((39, 15), fill=CRIMSON_CORE) # Tiara gem
    # Left Crimson Flame Horn
    d.polygon([(32, 14), (24, 8), (20, 3), (26, 1), (30, 7)], fill=CRIMSON_CORE, outline=OUTLINE)
    d.line([(22, 3), (25, 2)], fill=CRIMSON_GLOW)
    d.point([(18, 1), (19, 2)], fill=CRIMSON_CORE) # Flame tip spark
    # Right Crimson Flame Horn
    d.polygon([(46, 14), (54, 8), (58, 3), (52, 1), (48, 7)], fill=CRIMSON_CORE, outline=OUTLINE)
    d.line([(56, 3), (53, 2)], fill=CRIMSON_GLOW)
    d.point([(60, 1), (59, 2)], fill=CRIMSON_CORE)

    # Upscale to 360x360 with nearest neighbor
    bbox = img.getbbox()
    cropped = img.crop(bbox)
    target = Image.new("RGBA", (360, 360), (0, 0, 0, 0))
    cw, ch = cropped.size
    scale = min(320 // ch, 320 // cw)
    scale = max(scale, 1)
    nw, nh = cw * scale, ch * scale
    resized = cropped.resize((nw, nh), resample=Image.NEAREST)

    px = (360 - nw) // 2
    py = (360 - nh) // 2 + 5
    target.paste(resized, (px, py), resized)

    out_path = os.path.join(OUTPUT_DIR, "tank_female.png")
    target.save(out_path)
    print("SUCCESS: tank_female.png generated at:", out_path)

def cleanup_legacy_files():
    legacy = [
        os.path.join(OUTPUT_DIR, "tank_male.jpg"),
        os.path.join(OUTPUT_DIR, "tank_female.jpg"),
    ]
    for p in legacy:
        if os.path.exists(p):
            os.remove(p)
            print("Removed legacy file:", p)

if __name__ == "__main__":
    generate_tank_female()
    cleanup_legacy_files()
