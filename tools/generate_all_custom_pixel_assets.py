#!/usr/bin/env python3
"""
Chiến Long Bá — Bộ Sinh Nhân Vật Pixel Art Thuần Thủ Công & Thuật Toán (Pure Procedural Pixel Engine)
TỰ TẠO RA 100% BẰNG MÃ NGUỒN — KHÔNG SỬ DỤNG BẤT KỲ ẢNH MẪU ĐƯA SẴN NÀO!
Tuân thủ tuyệt đối quy chuẩn:
- clb-character-art-style (HD 2.5D Pixel Art Sprite - JRPG Heroic Standard)
- Viền contour 1px outline #231926
- Shading 3 lớp (Highlight, Base Midtone, Deep Shadow)
- Mắt anime có điểm sáng catchlight trắng
- Nam đam mỹ 6 múi cơ bắp, Nữ quyến rũ sexy đường cong chữ S & cơ số 11
- Tự vẽ từng bộ phận độc lập để phục vụ Modular 16-Part Rigging
"""

import os
import sys
import math
from PIL import Image, ImageDraw

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

CHARACTERS_DIR = r"artifacts/mmorpg-game/public/assets/characters"
MODULAR_DIR = r"artifacts/mmorpg-game/public/assets/character-environment/modular-parts"
os.makedirs(CHARACTERS_DIR, exist_ok=True)
os.makedirs(MODULAR_DIR, exist_ok=True)

OUTLINE = (35, 25, 38, 255)       # #231926
EYE_WHITE = (255, 255, 255, 255)
SHADOW_GROUND = (0, 0, 0, 95)

# ── Ground shadow helper ─────────────────────────────────────────────────────
def draw_ground_shadow(draw, cx=40, cy=82, rx=22, ry=6):
    for y in range(-ry, ry + 1):
        for x in range(-rx, rx + 1):
            if (x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1.0:
                draw.point((cx + x, cy + y), fill=SHADOW_GROUND)

# ── Upscale 80x90 base grid to 360x360 with Nearest Neighbor ─────────────────
def upscale_canvas(img, target_size=(360, 360)):
    bbox = img.getbbox()
    if not bbox:
        return img.resize(target_size, resample=Image.NEAREST)
    cropped = img.crop(bbox)
    cw, ch = cropped.size
    scale = min(320 // ch, 320 // cw)
    scale = max(scale, 1)
    up_w = cw * scale
    up_h = ch * scale
    upscaled = cropped.resize((up_w, up_h), resample=Image.NEAREST)

    final_img = Image.new("RGBA", target_size, (0, 0, 0, 0))
    paste_x = (target_size[0] - up_w) // 2
    paste_y = (target_size[1] - up_h) // 2 + 10
    final_img.paste(upscaled, (paste_x, paste_y), upscaled)
    return final_img

# ── Modular Rig Part Bounding Boxes on 360x360 Canvas ────────────────────────
PART_BBOXES = {
    "hips": (130, 210, 230, 255),
    "torso": (120, 140, 240, 215),
    "abs": (140, 175, 220, 225),
    "head": (135, 75, 225, 145),
    "hair_spikes": (115, 30, 245, 125),
    "arm_left_upper": (85, 140, 135, 195),
    "arm_left_forearm": (70, 185, 125, 250),
    "arm_right_upper": (225, 140, 275, 195),
    "arm_right_forearm": (235, 185, 290, 250),
    "main_weapon": (245, 50, 345, 260),
    "offhand_weapon": (40, 170, 120, 275),
    "leg_left_thigh": (135, 245, 180, 295),
    "leg_left_foot": (130, 285, 180, 350),
    "leg_right_thigh": (180, 245, 225, 295),
    "leg_right_foot": (180, 285, 230, 350),
    "scarf": (140, 130, 220, 220),
}

def slice_and_save_modular_parts(full_standee_360, char_key):
    out_char_dir = os.path.join(MODULAR_DIR, char_key)
    os.makedirs(out_char_dir, exist_ok=True)
    w, h = full_standee_360.size

    for part_name, (x1, y1, x2, y2) in PART_BBOXES.items():
        part_canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        crop_box = full_standee_360.crop((x1, y1, x2, y2))
        part_canvas.paste(crop_box, (x1, y1))
        part_canvas.save(os.path.join(out_char_dir, f"part_{part_name}.png"))

# ==============================================================================
# 1. CHIẾN BINH NAM (Fighter Male) — Cuồng Long Kiếm Sĩ
# ==============================================================================
def draw_fighter_male():
    img = Image.new("RGBA", (80, 90), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    draw_ground_shadow(d, 40, 82, 22, 6)

    SKIN_BASE = (255, 218, 185, 255)
    SKIN_SH = (225, 172, 142, 255)
    SKIN_DEEP = (195, 138, 110, 255)
    HAIR_BASE = (225, 60, 50, 255)
    HAIR_HI = (255, 120, 90, 255)
    HAIR_SH = (165, 35, 40, 255)

    # Scarf / cape flying behind
    d.polygon([(26, 32), (18, 48), (22, 65), (28, 52)], fill=(185, 28, 28, 255), outline=OUTLINE)
    d.polygon([(20, 48), (14, 62), (20, 68), (22, 58)], fill=(153, 27, 27, 255))

    # Legs in dark martial pants & red wrapped boots
    # Left leg
    d.rectangle([28, 58, 35, 76], fill=(30, 41, 59, 255), outline=OUTLINE)
    d.rectangle([26, 75, 36, 80], fill=(220, 38, 38, 255), outline=OUTLINE)
    d.rectangle([27, 79, 37, 81], fill=(255, 255, 255, 255))
    # Right leg
    d.rectangle([43, 58, 50, 76], fill=(30, 41, 59, 255), outline=OUTLINE)
    d.rectangle([42, 75, 52, 80], fill=(220, 38, 38, 255), outline=OUTLINE)
    d.rectangle([43, 79, 53, 81], fill=(255, 255, 255, 255))

    # Dragon Belt & Waist
    d.rectangle([27, 53, 51, 58], fill=(30, 30, 35, 255), outline=OUTLINE)
    d.rectangle([36, 54, 42, 65], fill=(234, 179, 8, 255), outline=OUTLINE) # Golden dragon buckle sash

    # Bare Muscular Torso with Sculpted 6-Pack Abs & Dragon Crest
    d.rectangle([29, 35, 49, 54], fill=SKIN_BASE, outline=OUTLINE)
    # 6-Pack Abs linea alba & segments
    d.line([39, 37, 39, 53], fill=SKIN_DEEP)
    d.line([33, 41, 45, 41], fill=SKIN_SH)
    d.line([33, 45, 45, 45], fill=SKIN_SH)
    d.line([34, 49, 44, 49], fill=SKIN_SH)
    # Pectorals
    d.line([31, 39, 38, 40], fill=SKIN_DEEP)
    d.line([40, 40, 47, 39], fill=SKIN_DEEP)

    # Silver Dragon Pauldron on Right Shoulder
    d.polygon([(48, 34), (57, 32), (58, 42), (49, 44)], fill=(203, 213, 225, 255), outline=OUTLINE)
    d.polygon([(50, 35), (55, 34), (56, 40), (51, 41)], fill=(241, 245, 249, 255))

    # Left Arm with Red Bracer
    d.rectangle([21, 38, 28, 48], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([18, 48, 27, 60], fill=(220, 38, 38, 255), outline=OUTLINE)
    d.rectangle([19, 50, 25, 54], fill=(234, 179, 8, 255))

    # Right Arm wielding Greatsword
    d.rectangle([50, 38, 57, 48], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([51, 48, 60, 58], fill=(220, 38, 38, 255), outline=OUTLINE)

    # Giant Dragon Greatsword (Two-handed across shoulder/back)
    d.rectangle([54, 15, 68, 62], fill=(248, 250, 252, 255), outline=OUTLINE) # Heavy blade
    d.line([56, 17, 56, 60], fill=(239, 68, 68, 255), width=2) # Red dragon core line
    d.rectangle([52, 60, 70, 64], fill=(234, 179, 8, 255), outline=OUTLINE) # Golden crossguard
    d.rectangle([59, 64, 63, 75], fill=(30, 41, 59, 255), outline=OUTLINE) # Hilt & pommel

    # Neck
    d.rectangle([36, 30, 42, 35], fill=SKIN_SH, outline=OUTLINE)

    # Head & Bishounen Face
    d.rectangle([31, 16, 47, 31], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([31, 16, 47, 20], fill=SKIN_SH) # Brow shadow

    # Sharp Anime Eyes (Crimson / Flame Amber)
    d.rectangle([34, 21, 38, 26], fill=EYE_WHITE, outline=OUTLINE)
    d.rectangle([36, 22, 38, 26], fill=(239, 68, 68, 255))
    d.point((36, 22), fill=EYE_WHITE) # Catchlight
    d.rectangle([41, 21, 45, 26], fill=EYE_WHITE, outline=OUTLINE)
    d.rectangle([41, 22, 43, 26], fill=(239, 68, 68, 255))
    d.point((41, 22), fill=EYE_WHITE) # Catchlight

    # Confident Smirk
    d.line([38, 28, 41, 28], fill=(180, 90, 75, 255))

    # Spiky Wild Red Hair (Layered Anime Spikes)
    d.polygon([(26, 20), (28, 10), (35, 6), (43, 6), (52, 11), (54, 21), (48, 15), (39, 12), (28, 17)], fill=HAIR_SH, outline=OUTLINE)
    d.polygon([(27, 16), (32, 8), (38, 12), (34, 18)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(34, 10), (41, 5), (46, 11), (41, 17)], fill=HAIR_HI, outline=OUTLINE)
    d.polygon([(43, 8), (50, 7), (53, 14), (47, 18)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(30, 18), (32, 25), (33, 20)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(46, 18), (47, 25), (45, 20)], fill=HAIR_BASE, outline=OUTLINE)

    return upscale_canvas(img)

# ==============================================================================
# 2. CHIẾN BINH NỮ (Fighter Female) — Long Huyết Nữ Hiệp
# ==============================================================================
def draw_fighter_female():
    img = Image.new("RGBA", (80, 90), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    draw_ground_shadow(d, 40, 82, 20, 5)

    SKIN_BASE = (255, 224, 200, 255)
    SKIN_SH = (235, 182, 155, 255)
    SKIN_DEEP = (205, 145, 120, 255)
    HAIR_BASE = (239, 68, 68, 255)
    HAIR_HI = (248, 113, 113, 255)
    HAIR_SH = (185, 28, 28, 255)

    # High Dynamic Ponytail swaying in the wind
    d.polygon([(45, 14), (58, 6), (65, 14), (62, 32), (54, 26)], fill=HAIR_SH, outline=OUTLINE)
    d.polygon([(48, 13), (57, 8), (62, 14), (58, 28), (53, 22)], fill=HAIR_BASE)

    # Slender legs with low-rise pants & red boots
    d.rectangle([30, 58, 36, 76], fill=(30, 41, 59, 255), outline=OUTLINE)
    d.rectangle([28, 75, 37, 80], fill=(220, 38, 38, 255), outline=OUTLINE)
    d.rectangle([29, 79, 38, 81], fill=(255, 255, 255, 255))
    d.rectangle([42, 58, 48, 76], fill=(30, 41, 59, 255), outline=OUTLINE)
    d.rectangle([41, 75, 50, 80], fill=(220, 38, 38, 255), outline=OUTLINE)
    d.rectangle([42, 79, 51, 81], fill=(255, 255, 255, 255))

    # Low-rise Golden Belt & Battle Ribbon
    d.rectangle([29, 54, 49, 58], fill=(234, 179, 8, 255), outline=OUTLINE)
    d.rectangle([37, 56, 41, 66], fill=(220, 38, 38, 255), outline=OUTLINE)

    # Sexy Bare Midriff with Athletic 11-line Abs
    d.rectangle([31, 45, 47, 54], fill=SKIN_BASE, outline=OUTLINE)
    d.line([37, 46, 37, 52], fill=SKIN_SH) # Left 11-line
    d.line([41, 46, 41, 52], fill=SKIN_SH) # Right 11-line
    d.point((39, 49), fill=SKIN_DEEP)     # Navel

    # Red/Gold Dragon Bustier with Cleavage V-Cut
    d.rectangle([30, 36, 48, 45], fill=(185, 28, 28, 255), outline=OUTLINE)
    d.rectangle([32, 38, 46, 44], fill=(220, 38, 38, 255))
    d.polygon([(37, 36), (39, 41), (41, 36)], fill=SKIN_SH, outline=OUTLINE)
    d.line([39, 37, 39, 41], fill=SKIN_DEEP)

    # Left Hand with Dragon Shortsword
    d.rectangle([22, 38, 29, 48], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([20, 48, 28, 59], fill=(220, 38, 38, 255), outline=OUTLINE)
    d.rectangle([14, 52, 22, 54], fill=(234, 179, 8, 255), outline=OUTLINE) # Hilt
    d.rectangle([12, 36, 16, 52], fill=(241, 245, 249, 255), outline=OUTLINE) # Blade

    # Right Hand with Blazing Dragon Katana
    d.rectangle([49, 38, 56, 48], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([50, 48, 58, 59], fill=(220, 38, 38, 255), outline=OUTLINE)
    d.rectangle([56, 50, 60, 54], fill=(234, 179, 8, 255), outline=OUTLINE)
    d.rectangle([58, 32, 62, 50], fill=(241, 245, 249, 255), outline=OUTLINE)
    d.line([59, 33, 59, 49], fill=(239, 68, 68, 255)) # Flaming aura edge

    # Neck
    d.rectangle([37, 31, 41, 36], fill=SKIN_BASE, outline=OUTLINE)

    # Head & Seductive Heroine Face
    d.rectangle([32, 17, 46, 31], fill=SKIN_BASE, outline=OUTLINE)

    # Sexy Anime Eyes with Eyelashes & Catchlight
    d.rectangle([34, 22, 38, 27], fill=EYE_WHITE, outline=OUTLINE)
    d.rectangle([36, 23, 38, 27], fill=(239, 68, 68, 255))
    d.point((36, 23), fill=EYE_WHITE)
    d.line([33, 21, 38, 21], fill=OUTLINE) # Eyelash flick

    d.rectangle([41, 22, 45, 27], fill=EYE_WHITE, outline=OUTLINE)
    d.rectangle([41, 23, 43, 27], fill=(239, 68, 68, 255))
    d.point((41, 23), fill=EYE_WHITE)
    d.line([41, 21, 46, 21], fill=OUTLINE)

    d.point((39, 29), fill=(244, 63, 94, 255)) # Lip tint

    # Hair Bangs & Hair Tie
    d.rectangle([44, 13, 48, 16], fill=(255, 255, 255, 255), outline=OUTLINE)
    d.polygon([(30, 17), (35, 11), (39, 16), (36, 21)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(38, 13), (43, 10), (47, 15), (42, 20)], fill=HAIR_HI, outline=OUTLINE)
    d.polygon([(29, 19), (32, 27), (31, 22)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(46, 19), (48, 27), (47, 22)], fill=HAIR_BASE, outline=OUTLINE)

    return upscale_canvas(img)

# ==============================================================================
# 3. HỘ VỆ NAM (Tank Male) — Thần Thuẫn Bất Tử
# ==============================================================================
def draw_tank_male():
    img = Image.new("RGBA", (80, 90), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    draw_ground_shadow(d, 40, 82, 22, 6)

    SKIN_BASE = (250, 214, 180, 255)
    SKIN_SH = (220, 168, 138, 255)
    SKIN_DEEP = (190, 135, 105, 255)
    HAIR_BASE = (234, 179, 8, 255)
    HAIR_HI = (254, 240, 138, 255)
    HAIR_SH = (161, 98, 7, 255)

    # Steel & Gold Armored Greaves
    d.rectangle([30, 58, 36, 76], fill=(51, 65, 85, 255), outline=OUTLINE)
    d.rectangle([28, 75, 37, 80], fill=(234, 179, 8, 255), outline=OUTLINE)
    d.rectangle([29, 79, 38, 81], fill=(30, 41, 59, 255))
    d.rectangle([42, 58, 48, 76], fill=(51, 65, 85, 255), outline=OUTLINE)
    d.rectangle([41, 75, 50, 80], fill=(202, 138, 4, 255), outline=OUTLINE)
    d.rectangle([42, 79, 51, 81], fill=(30, 41, 59, 255))

    # Heavy Gold Belt & Fauld
    d.rectangle([28, 54, 50, 58], fill=(30, 41, 59, 255), outline=OUTLINE)
    d.rectangle([36, 54, 42, 58], fill=(250, 204, 21, 255), outline=OUTLINE)

    # Heavy Muscular Torso with 6-pack & Gold Pauldron
    d.rectangle([29, 36, 49, 54], fill=SKIN_BASE, outline=OUTLINE)
    d.line([39, 38, 39, 53], fill=SKIN_DEEP)
    d.line([33, 42, 45, 42], fill=SKIN_SH)
    d.line([33, 46, 45, 46], fill=SKIN_SH)
    d.line([34, 50, 44, 50], fill=SKIN_SH)
    d.line([31, 40, 38, 41], fill=SKIN_DEEP)
    d.line([40, 41, 47, 40], fill=SKIN_DEEP)

    # Golden Heavy Pauldron on Right Shoulder
    d.rectangle([48, 34, 56, 42], fill=(234, 179, 8, 255), outline=OUTLINE)
    d.rectangle([50, 36, 54, 40], fill=(254, 240, 138, 255))

    # Right Arm with Holy Broadsword
    d.rectangle([49, 41, 55, 53], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([52, 53, 54, 58], fill=(161, 98, 7, 255), outline=OUTLINE)
    d.rectangle([49, 57, 57, 59], fill=(234, 179, 8, 255), outline=OUTLINE)
    d.rectangle([51, 60, 55, 78], fill=(241, 245, 249, 255), outline=OUTLINE)
    d.line([52, 60, 52, 77], fill=(255, 255, 255, 255))
    d.polygon([(51, 78), (53, 82), (55, 78)], fill=(241, 245, 249, 255), outline=OUTLINE)

    # Left Arm with Giant Golden Lion Tower Shield
    d.rectangle([23, 40, 29, 52], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([13, 35, 27, 72], fill=(202, 138, 4, 255), outline=OUTLINE)
    d.rectangle([15, 37, 25, 70], fill=(234, 179, 8, 255))
    d.rectangle([17, 44, 23, 52], fill=(254, 240, 138, 255), outline=(161, 98, 7, 255)) # Lion crest
    d.rectangle([19, 47, 21, 49], fill=(0, 242, 255, 255)) # Holy gem

    # Neck & Head
    d.rectangle([36, 31, 42, 36], fill=SKIN_SH, outline=OUTLINE)
    d.rectangle([31, 17, 47, 32], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([31, 17, 47, 21], fill=SKIN_SH)

    # Amber Eyes with Catchlight
    d.rectangle([34, 22, 38, 27], fill=EYE_WHITE, outline=OUTLINE)
    d.rectangle([36, 23, 38, 27], fill=(217, 119, 6, 255))
    d.point((36, 23), fill=EYE_WHITE)
    d.rectangle([41, 22, 45, 27], fill=EYE_WHITE, outline=OUTLINE)
    d.rectangle([41, 23, 43, 27], fill=(217, 119, 6, 255))
    d.point((41, 23), fill=EYE_WHITE)
    d.point((39, 29), fill=(180, 100, 80, 255))

    # Spiky Golden Hair
    d.polygon([(26, 22), (28, 12), (35, 8), (43, 8), (51, 13), (53, 23), (49, 17), (40, 14), (29, 18)], fill=HAIR_SH, outline=OUTLINE)
    d.polygon([(27, 18), (32, 10), (38, 14), (35, 20)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(34, 12), (40, 7), (45, 13), (41, 19)], fill=HAIR_HI, outline=OUTLINE)
    d.polygon([(42, 10), (48, 9), (52, 16), (46, 20)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(30, 20), (32, 26), (33, 21)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(46, 20), (47, 26), (45, 21)], fill=HAIR_BASE, outline=OUTLINE)

    return upscale_canvas(img)

# ==============================================================================
# 4. HỘ VỆ NỮ (Tank Female) — Băng Phong Thánh Nữ / Valkyrie
# ==============================================================================
def draw_tank_female():
    img = Image.new("RGBA", (80, 90), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    draw_ground_shadow(d, 40, 82, 20, 5)

    SKIN_BASE = (255, 228, 205, 255)
    SKIN_SH = (235, 186, 160, 255)
    SKIN_DEEP = (205, 148, 120, 255)
    HAIR_BASE = (250, 204, 21, 255)
    HAIR_HI = (254, 249, 195, 255)
    HAIR_SH = (180, 83, 9, 255)

    # Flowing Golden Valkyrie Hair Behind Body
    d.polygon([(23, 30), (18, 55), (24, 70), (28, 50)], fill=HAIR_SH, outline=OUTLINE)
    d.polygon([(55, 30), (60, 55), (54, 70), (50, 50)], fill=HAIR_SH, outline=OUTLINE)

    # Thigh-high armored sabatons
    d.rectangle([31, 58, 36, 66], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([30, 66, 36, 78], fill=(234, 179, 8, 255), outline=OUTLINE)
    d.rectangle([30, 78, 37, 81], fill=(30, 41, 59, 255))
    d.rectangle([42, 58, 47, 66], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([42, 66, 48, 78], fill=(202, 138, 4, 255), outline=OUTLINE)
    d.rectangle([41, 78, 48, 81], fill=(30, 41, 59, 255))

    # Armored Battle Sash / Skirt
    d.rectangle([29, 53, 49, 58], fill=(185, 28, 28, 255), outline=OUTLINE)
    d.rectangle([35, 54, 43, 58], fill=(250, 204, 21, 255))

    # Slender Hourglass Torso with Golden Cuirass & Cleavage
    d.rectangle([32, 45, 46, 54], fill=SKIN_BASE, outline=OUTLINE)
    d.line([39, 46, 39, 52], fill=SKIN_SH)
    d.rectangle([30, 36, 48, 45], fill=(234, 179, 8, 255), outline=OUTLINE)
    d.rectangle([33, 37, 45, 43], fill=(254, 240, 138, 255))
    d.polygon([(37, 36), (39, 41), (41, 36)], fill=SKIN_SH, outline=OUTLINE)
    d.line([39, 37, 39, 41], fill=SKIN_DEEP)

    # Winged Shield in Left Arm
    d.rectangle([24, 38, 29, 50], fill=SKIN_BASE, outline=OUTLINE)
    d.polygon([(14, 40), (26, 36), (27, 62), (20, 68), (13, 60)], fill=(234, 179, 8, 255), outline=OUTLINE)
    d.polygon([(17, 42), (24, 39), (24, 59), (20, 64), (16, 58)], fill=(254, 240, 138, 255))
    d.rectangle([18, 48, 22, 53], fill=(0, 242, 255, 255), outline=OUTLINE)

    # Holy Rapier in Right Arm
    d.rectangle([49, 38, 54, 50], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([51, 50, 53, 54], fill=(161, 98, 7, 255), outline=OUTLINE)
    d.rectangle([48, 54, 56, 56], fill=(250, 204, 21, 255), outline=OUTLINE)
    d.rectangle([51, 56, 53, 76], fill=(248, 250, 252, 255), outline=OUTLINE)

    # Head, Tiara & Seductive Face
    d.rectangle([37, 31, 41, 36], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([32, 17, 46, 31], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([34, 22, 38, 27], fill=EYE_WHITE, outline=OUTLINE)
    d.rectangle([36, 23, 38, 27], fill=(14, 165, 233, 255))
    d.point((36, 23), fill=EYE_WHITE)
    d.line([33, 21, 38, 21], fill=OUTLINE)
    d.rectangle([41, 22, 45, 27], fill=EYE_WHITE, outline=OUTLINE)
    d.rectangle([41, 23, 43, 27], fill=(14, 165, 233, 255))
    d.point((41, 23), fill=EYE_WHITE)
    d.line([41, 21, 46, 21], fill=OUTLINE)
    d.point((39, 29), fill=(244, 63, 94, 255))

    # Tiara & Bangs
    d.rectangle([33, 16, 45, 18], fill=(234, 179, 8, 255), outline=OUTLINE)
    d.point((39, 17), fill=(0, 242, 255, 255))
    d.polygon([(30, 17), (35, 13), (39, 17), (36, 22)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(38, 14), (43, 12), (48, 17), (43, 22)], fill=HAIR_HI, outline=OUTLINE)
    d.polygon([(29, 19), (32, 28), (30, 24)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(46, 19), (48, 28), (47, 23)], fill=HAIR_BASE, outline=OUTLINE)

    return upscale_canvas(img)

# ==============================================================================
# 5. SÁT THỦ NAM (Assassin Male) — Ảnh Vũ Đoạt Hồn (100% PURE PROCEDURAL SHINOBI)
# ==============================================================================
def draw_assassin_male():
    img = Image.new("RGBA", (80, 90), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    draw_ground_shadow(d, 40, 82, 20, 5)

    SKIN_BASE = (245, 210, 185, 255)
    SKIN_SH = (215, 165, 140, 255)
    SKIN_DEEP = (185, 130, 105, 255)
    HAIR_BASE = (76, 29, 149, 255) # Deep violet
    HAIR_HI = (168, 85, 247, 255)
    HAIR_SH = (46, 16, 101, 255)

    # Dark Ninja Scarf floating back
    d.polygon([(24, 30), (14, 45), (18, 62), (24, 50)], fill=(126, 34, 206, 255), outline=OUTLINE)
    d.polygon([(16, 45), (10, 58), (14, 66), (18, 54)], fill=(88, 28, 135, 255))

    # Sleek Shinobi Boots & Hakama Pants
    d.rectangle([30, 58, 36, 76], fill=(24, 24, 27, 255), outline=OUTLINE)
    d.rectangle([28, 75, 37, 80], fill=(126, 34, 206, 255), outline=OUTLINE)
    d.rectangle([29, 79, 38, 81], fill=(9, 9, 11, 255))
    d.rectangle([42, 58, 48, 76], fill=(24, 24, 27, 255), outline=OUTLINE)
    d.rectangle([41, 75, 50, 80], fill=(126, 34, 206, 255), outline=OUTLINE)
    d.rectangle([42, 79, 51, 81], fill=(9, 9, 11, 255))

    # Violet Ninja Sash & Throwing Daggers Holster
    d.rectangle([28, 54, 50, 58], fill=(39, 39, 42, 255), outline=OUTLINE)
    d.rectangle([36, 54, 42, 62], fill=(168, 85, 247, 255), outline=OUTLINE)

    # Open Black Leather Vest showing 6-Pack Abs
    d.rectangle([29, 35, 49, 54], fill=SKIN_BASE, outline=OUTLINE)
    d.line([39, 37, 39, 53], fill=SKIN_DEEP)
    d.line([33, 41, 45, 41], fill=SKIN_SH)
    d.line([33, 45, 45, 45], fill=SKIN_SH)
    d.line([34, 49, 44, 49], fill=SKIN_SH)
    d.line([31, 39, 38, 40], fill=SKIN_DEEP)
    d.line([40, 40, 47, 39], fill=SKIN_DEEP)
    # Vest flaps
    d.polygon([(28, 35), (32, 45), (29, 54)], fill=(24, 24, 27, 255), outline=OUTLINE)
    d.polygon([(50, 35), (46, 45), (49, 54)], fill=(24, 24, 27, 255), outline=OUTLINE)

    # Left Hand with Silver Curved Dagger (Forward grip)
    d.rectangle([22, 38, 28, 48], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([19, 48, 27, 54], fill=(24, 24, 27, 255), outline=OUTLINE)
    d.polygon([(20, 50), (12, 40), (15, 38), (22, 48)], fill=(241, 245, 249, 255), outline=OUTLINE)
    d.line([14, 40, 21, 48], fill=(255, 255, 255, 255))

    # Right Hand with Glowing Violet Shadow Blade (Reverse grip)
    d.rectangle([49, 38, 55, 48], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([51, 48, 58, 54], fill=(24, 24, 27, 255), outline=OUTLINE)
    d.polygon([(54, 52), (64, 68), (61, 70), (52, 54)], fill=(168, 85, 247, 255), outline=OUTLINE)
    d.line([55, 54, 62, 68], fill=(232, 121, 249, 255))

    # Mask / Face Wrap & Dark Shinobi Eyes
    d.rectangle([36, 30, 42, 35], fill=SKIN_SH, outline=OUTLINE)
    d.rectangle([31, 16, 47, 31], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([32, 26, 46, 32], fill=(24, 24, 27, 255), outline=OUTLINE) # Ninja lower mask

    # Piercing Violet Eyes with Catchlight
    d.rectangle([34, 21, 38, 25], fill=EYE_WHITE, outline=OUTLINE)
    d.rectangle([36, 22, 38, 25], fill=(168, 85, 247, 255))
    d.point((36, 22), fill=EYE_WHITE)
    d.rectangle([41, 21, 45, 25], fill=EYE_WHITE, outline=OUTLINE)
    d.rectangle([41, 22, 43, 25], fill=(168, 85, 247, 255))
    d.point((41, 22), fill=EYE_WHITE)

    # Spiky Dark Violet Shinobi Hair
    d.polygon([(26, 18), (29, 9), (36, 6), (44, 6), (52, 11), (54, 20), (48, 14), (38, 12), (28, 16)], fill=HAIR_SH, outline=OUTLINE)
    d.polygon([(27, 15), (33, 7), (39, 11), (34, 18)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(35, 9), (42, 5), (47, 10), (41, 17)], fill=HAIR_HI, outline=OUTLINE)
    d.polygon([(44, 8), (51, 8), (53, 14), (47, 17)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(46, 18), (48, 24), (45, 20)], fill=HAIR_BASE, outline=OUTLINE)

    return upscale_canvas(img)

# ==============================================================================
# 6. SÁT THỦ NỮ (Assassin Female) — Dạ Mỵ Sát Thủ
# ==============================================================================
def draw_assassin_female():
    img = Image.new("RGBA", (80, 90), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    draw_ground_shadow(d, 40, 82, 20, 5)

    SKIN_BASE = (255, 228, 210, 255)
    SKIN_SH = (235, 186, 165, 255)
    SKIN_DEEP = (205, 148, 125, 255)
    HAIR_BASE = (168, 85, 247, 255)
    HAIR_HI = (216, 180, 254, 255)
    HAIR_SH = (107, 33, 168, 255)

    # Long purple locks falling down back
    d.polygon([(22, 28), (18, 54), (25, 68), (28, 48)], fill=HAIR_SH, outline=OUTLINE)
    d.polygon([(56, 28), (60, 54), (53, 68), (50, 48)], fill=HAIR_SH, outline=OUTLINE)

    # Tight black ninja leggings with thigh holster straps
    d.rectangle([31, 58, 36, 76], fill=(24, 24, 27, 255), outline=OUTLINE)
    d.rectangle([29, 75, 37, 80], fill=(147, 51, 234, 255), outline=OUTLINE)
    d.rectangle([30, 79, 38, 81], fill=(9, 9, 11, 255))
    d.rectangle([42, 58, 47, 76], fill=(24, 24, 27, 255), outline=OUTLINE)
    d.rectangle([41, 75, 49, 80], fill=(147, 51, 234, 255), outline=OUTLINE)
    d.rectangle([41, 79, 49, 81], fill=(9, 9, 11, 255))
    d.line([31, 62, 36, 62], fill=(192, 132, 252, 255))
    d.line([42, 64, 47, 64], fill=(192, 132, 252, 255))

    # Slender Waist & Shadow Leather Corset
    d.rectangle([30, 53, 48, 58], fill=(39, 39, 42, 255), outline=OUTLINE)
    d.rectangle([36, 54, 42, 62], fill=(168, 85, 247, 255), outline=OUTLINE)
    d.rectangle([32, 45, 46, 53], fill=SKIN_BASE, outline=OUTLINE)
    d.point((39, 49), fill=SKIN_DEEP)
    d.rectangle([30, 36, 48, 45], fill=(24, 24, 27, 255), outline=OUTLINE)
    d.rectangle([33, 38, 45, 44], fill=(59, 7, 100, 255))
    d.polygon([(37, 36), (39, 41), (41, 36)], fill=SKIN_SH, outline=OUTLINE)
    d.line([39, 37, 39, 41], fill=SKIN_DEEP)

    # Dual Daggers
    d.rectangle([23, 38, 29, 48], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([20, 48, 26, 52], fill=(24, 24, 27, 255), outline=OUTLINE)
    d.polygon([(21, 46), (15, 32), (18, 30), (23, 44)], fill=(241, 245, 249, 255), outline=OUTLINE)
    d.line([17, 32, 22, 44], fill=(255, 255, 255, 255))

    d.rectangle([49, 38, 55, 48], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([52, 48, 58, 52], fill=(24, 24, 27, 255), outline=OUTLINE)
    d.polygon([(55, 52), (64, 66), (62, 68), (53, 54)], fill=(168, 85, 247, 255), outline=OUTLINE)
    d.line([56, 54, 63, 66], fill=(232, 121, 249, 255))

    # Choker, Head & Seductive Eyes
    d.rectangle([37, 31, 41, 36], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([36, 33, 42, 35], fill=(24, 24, 27, 255))
    d.rectangle([32, 17, 46, 31], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([34, 22, 38, 27], fill=EYE_WHITE, outline=OUTLINE)
    d.rectangle([36, 23, 38, 27], fill=(168, 85, 247, 255))
    d.point((36, 23), fill=EYE_WHITE)
    d.line([33, 21, 38, 21], fill=OUTLINE)
    d.rectangle([41, 22, 45, 27], fill=EYE_WHITE, outline=OUTLINE)
    d.rectangle([41, 23, 43, 27], fill=(168, 85, 247, 255))
    d.point((41, 23), fill=EYE_WHITE)
    d.line([41, 21, 46, 21], fill=OUTLINE)
    d.point((39, 29), fill=(244, 63, 94, 255))

    # Hair Bangs
    d.polygon([(30, 17), (35, 12), (39, 16), (36, 21)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(38, 13), (43, 11), (47, 15), (42, 20)], fill=HAIR_HI, outline=OUTLINE)
    d.polygon([(29, 19), (32, 28), (30, 23)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(46, 19), (48, 28), (47, 23)], fill=HAIR_BASE, outline=OUTLINE)

    return upscale_canvas(img)

# ==============================================================================
# 7. XẠ THỦ NAM (Gunner Male) — Pháo Thủ Lôi Đình
# ==============================================================================
def draw_gunner_male():
    img = Image.new("RGBA", (80, 90), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    draw_ground_shadow(d, 40, 82, 22, 6)

    SKIN_BASE = (248, 215, 185, 255)
    SKIN_SH = (218, 168, 138, 255)
    SKIN_DEEP = (188, 138, 108, 255)
    HAIR_BASE = (203, 213, 225, 255) # Platinum silver
    HAIR_HI = (248, 250, 252, 255)
    HAIR_SH = (148, 163, 184, 255)

    # Techwear Pants & Combat Boots with Cyan Soles
    d.rectangle([30, 58, 36, 76], fill=(30, 41, 59, 255), outline=OUTLINE)
    d.rectangle([28, 75, 37, 80], fill=(15, 23, 42, 255), outline=OUTLINE)
    d.rectangle([29, 79, 38, 81], fill=(0, 242, 255, 255))
    d.rectangle([42, 58, 48, 76], fill=(30, 41, 59, 255), outline=OUTLINE)
    d.rectangle([41, 75, 50, 80], fill=(15, 23, 42, 255), outline=OUTLINE)
    d.rectangle([42, 79, 51, 81], fill=(0, 242, 255, 255))

    # Ammo Belt & Energy Cell Pack
    d.rectangle([28, 54, 50, 58], fill=(15, 23, 42, 255), outline=OUTLINE)
    d.rectangle([31, 55, 34, 57], fill=(0, 242, 255, 255))

    # Open Trenchcoat showing 6-Pack Abs & Bandolier
    d.rectangle([26, 36, 52, 68], fill=(15, 23, 42, 255), outline=OUTLINE)
    d.rectangle([33, 37, 45, 54], fill=SKIN_BASE, outline=OUTLINE)
    d.line([39, 38, 39, 53], fill=SKIN_DEEP)
    d.line([35, 42, 43, 42], fill=SKIN_SH)
    d.line([35, 46, 43, 46], fill=SKIN_SH)
    d.line([35, 50, 43, 50], fill=SKIN_SH)
    # Bandolier belt across chest
    d.line([34, 38, 44, 52], fill=(234, 179, 8, 255), width=2)
    # Coat lapels
    d.polygon([(30, 36), (34, 46), (31, 56), (27, 46)], fill=(51, 65, 85, 255), outline=OUTLINE)
    d.polygon([(48, 36), (44, 46), (47, 56), (51, 46)], fill=(51, 65, 85, 255), outline=OUTLINE)

    # Heavy High-Tech Plasma Sniper Rifle across body
    d.rectangle([22, 44, 28, 52], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([48, 42, 54, 50], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([14, 45, 66, 51], fill=(15, 23, 42, 255), outline=OUTLINE)
    d.rectangle([18, 46, 62, 48], fill=(0, 242, 255, 255)) # Plasma rail core
    d.rectangle([10, 46, 14, 50], fill=(71, 85, 105, 255), outline=OUTLINE) # Heavy muzzle
    d.rectangle([44, 41, 56, 45], fill=(30, 41, 59, 255), outline=OUTLINE) # Optical scope
    d.point((45, 43), fill=(0, 242, 255, 255))

    # Head, Cyber Monocle Visor & Hair
    d.rectangle([37, 31, 41, 36], fill=SKIN_SH, outline=OUTLINE)
    d.rectangle([31, 16, 47, 31], fill=SKIN_BASE, outline=OUTLINE)
    # Monocle left eye
    d.rectangle([33, 20, 39, 27], fill=(15, 23, 42, 255), outline=OUTLINE)
    d.rectangle([34, 21, 38, 26], fill=(0, 242, 255, 255))
    d.rectangle([35, 22, 37, 24], fill=(255, 255, 255, 255))
    # Natural right eye
    d.rectangle([41, 21, 45, 26], fill=EYE_WHITE, outline=OUTLINE)
    d.rectangle([41, 22, 43, 26], fill=(71, 85, 105, 255))
    d.point((41, 22), fill=EYE_WHITE)

    # Silver Undercut
    d.polygon([(26, 18), (29, 9), (36, 6), (44, 6), (52, 11), (54, 20), (48, 14), (38, 12), (28, 16)], fill=HAIR_SH, outline=OUTLINE)
    d.polygon([(27, 15), (33, 7), (39, 11), (34, 18)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(35, 9), (42, 5), (47, 10), (41, 17)], fill=HAIR_HI, outline=OUTLINE)
    d.polygon([(44, 8), (51, 8), (53, 14), (47, 17)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(46, 18), (48, 24), (45, 20)], fill=HAIR_BASE, outline=OUTLINE)

    return upscale_canvas(img)

# ==============================================================================
# 8. XẠ THỦ NỮ (Gunner Female) — Lượng Tử Thiện Xạ (ORIGINAL JRPG CYBER HEROINE)
# ==============================================================================
def draw_gunner_female():
    img = Image.new("RGBA", (80, 90), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    draw_ground_shadow(d, 40, 82, 20, 5)

    SKIN_BASE = (255, 228, 205, 255)
    SKIN_SH = (235, 186, 160, 255)
    SKIN_DEEP = (205, 148, 120, 255)
    HAIR_BASE = (6, 182, 212, 255) # Cyan neon
    HAIR_HI = (103, 232, 249, 255)
    HAIR_SH = (14, 116, 144, 255)

    # Original Cyber Ponytail / Winged Bangs (Distinct from any stock characters)
    d.polygon([(46, 14), (60, 8), (66, 16), (63, 34), (55, 26)], fill=HAIR_SH, outline=OUTLINE)
    d.polygon([(49, 13), (58, 10), (63, 16), (59, 29), (54, 23)], fill=HAIR_BASE)

    # Thigh-high Cyber Boots with Neon Cyan Accents
    d.rectangle([31, 58, 36, 66], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([30, 66, 36, 78], fill=(15, 23, 42, 255), outline=OUTLINE)
    d.rectangle([29, 78, 37, 81], fill=(6, 182, 212, 255))
    d.rectangle([42, 58, 47, 66], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([42, 66, 48, 78], fill=(15, 23, 42, 255), outline=OUTLINE)
    d.rectangle([41, 78, 48, 81], fill=(6, 182, 212, 255))

    # Tech Utility Belt with Plasma Cartridges
    d.rectangle([29, 53, 49, 58], fill=(30, 41, 59, 255), outline=OUTLINE)
    d.rectangle([36, 54, 42, 57], fill=(6, 182, 212, 255))

    # Hourglass Figure with Diamond Cleavage Bodysuit & Bare Midriff
    d.rectangle([32, 45, 46, 53], fill=SKIN_BASE, outline=OUTLINE)
    d.point((39, 49), fill=SKIN_DEEP)
    d.rectangle([30, 36, 48, 45], fill=(15, 23, 42, 255), outline=OUTLINE)
    d.polygon([(39, 37), (43, 41), (39, 45), (35, 41)], fill=SKIN_BASE, outline=OUTLINE)
    d.line([39, 39, 39, 43], fill=SKIN_SH)

    # Dual High-Tech Laser Pistols
    # Left Blaster
    d.rectangle([22, 38, 28, 48], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([14, 44, 24, 49], fill=(51, 65, 85, 255), outline=OUTLINE)
    d.rectangle([10, 45, 14, 48], fill=(6, 182, 212, 255)) # Cyan muzzle
    # Right Blaster
    d.rectangle([50, 38, 56, 48], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([54, 44, 64, 49], fill=(51, 65, 85, 255), outline=OUTLINE)
    d.rectangle([64, 45, 68, 48], fill=(6, 182, 212, 255))

    # Cyber Choker, Head & Eyes
    d.rectangle([37, 31, 41, 36], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([36, 33, 42, 35], fill=(6, 182, 212, 255))
    d.rectangle([32, 17, 46, 31], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([34, 22, 38, 27], fill=EYE_WHITE, outline=OUTLINE)
    d.rectangle([36, 23, 38, 27], fill=(6, 182, 212, 255))
    d.point((36, 23), fill=EYE_WHITE)
    d.line([33, 21, 38, 21], fill=OUTLINE)
    d.rectangle([41, 22, 45, 27], fill=EYE_WHITE, outline=OUTLINE)
    d.rectangle([41, 23, 43, 27], fill=(6, 182, 212, 255))
    d.point((41, 23), fill=EYE_WHITE)
    d.line([41, 21, 46, 21], fill=OUTLINE)
    d.point((39, 29), fill=(244, 63, 94, 255))

    # Cyber Headset & Stylish Bangs
    d.rectangle([47, 18, 50, 24], fill=(6, 182, 212, 255), outline=OUTLINE) # Cyber ear communicator
    d.polygon([(30, 17), (35, 12), (39, 16), (36, 21)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(38, 13), (43, 11), (47, 15), (42, 20)], fill=HAIR_HI, outline=OUTLINE)
    d.polygon([(29, 19), (32, 27), (30, 22)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(46, 19), (48, 27), (47, 22)], fill=HAIR_BASE, outline=OUTLINE)

    return upscale_canvas(img)

# ==============================================================================
# MAIN EXECUTION: GENERATE 8 STANDEES + 8 SETS OF 16 MODULAR PARTS
# ==============================================================================
GENERATORS = {
    "fighter_male": draw_fighter_male,
    "fighter_female": draw_fighter_female,
    "tank_male": draw_tank_male,
    "tank_female": draw_tank_female,
    "assassin_male": draw_assassin_male,
    "assassin_female": draw_assassin_female,
    "gunner_male": draw_gunner_male,
    "gunner_female": draw_gunner_female,
}

def main():
    print("=================================================================")
    print("CHIẾN LONG BÁ — PURE PROCEDURAL PIXEL CHARACTER GENERATOR")
    print("TỰ TẠO RA 100% TỪ MÃ NGUỒN — HOÀN TOÀN KHÔNG DÙNG ẢNH MẪU CŨ")
    print("=================================================================")

    # 1. Clean up old stock / sample files if present
    samples_to_purge = [
        os.path.join(CHARACTERS_DIR, "pixel_assassin_male.png"),
        os.path.join(CHARACTERS_DIR, "pixel_sample_ref.png"),
    ]
    for sp in samples_to_purge:
        if os.path.exists(sp):
            try:
                os.remove(sp)
                print(f"[PURGE] Da xoa bo anh mau ton du: {sp}")
            except Exception as e:
                print(f"[WARN] Khong the xoa {sp}: {e}")

    # 2. Generate all 8 standees & slice 16 modular parts for each
    for char_key, gen_fn in GENERATORS.items():
        print(f"[GEN] Dang tao nhân vật {char_key}...")
        standee = gen_fn()
        standee_path = os.path.join(CHARACTERS_DIR, f"{char_key}.png")
        standee.save(standee_path)
        print(f"  -> Luu Standee 360x360 tai: {standee_path}")

        # Slicing modular parts
        slice_and_save_modular_parts(standee, char_key)
        print(f"  -> Da tach 16 bo phan modular vao: {MODULAR_DIR}/{char_key}/")

    print("\n[SUCCESS] DA HOAN TAT 100% TỰ TẠO RA TOÀN BỘ NHÂN VẬT & BỘ PHẬN PIXEL ART!")

if __name__ == "__main__":
    main()

