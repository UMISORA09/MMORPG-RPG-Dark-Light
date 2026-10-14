import os
from PIL import Image, ImageDraw
import numpy as np

OUTPUT_DIR = r"c:\Cassavas\Game2.5D\artifacts\mmorpg-game\public\assets\characters"
os.makedirs(OUTPUT_DIR, exist_ok=True)

OUTLINE = (35, 25, 38, 255)
SKIN_BASE = (255, 218, 185, 255)
SKIN_SHADOW = (225, 172, 142, 255)
SKIN_DEEP = (195, 138, 110, 255)
SKIN_HIGHLIGHT = (255, 238, 218, 255)
EYE_WHITE = (255, 255, 255, 255)
SHADOW_GROUND = (0, 0, 0, 95)

def draw_ground_shadow(draw, cx, cy, rx, ry):
    for y in range(-ry, ry + 1):
        for x in range(-rx, rx + 1):
            if (x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1.0:
                draw.point((cx + x, cy + y), fill=SHADOW_GROUND)

def upscale(img, target_size=(360, 360)):
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

# ==============================================================================
# 1. TANK MALE (Paladin - Golden Hair, 6-Pack Torso, Heavy Golden Shield & Sword)
# ==============================================================================
def gen_tank_male():
    img = Image.new("RGBA", (80, 90), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Ground shadow
    draw_ground_shadow(d, 40, 82, 22, 6)

    # Legs & Sabatons
    # Left leg
    d.rectangle([30, 58, 36, 76], fill=(50, 60, 75, 255), outline=OUTLINE)
    d.rectangle([28, 75, 37, 80], fill=(215, 175, 60, 255), outline=OUTLINE) # Gold boot
    d.rectangle([29, 79, 38, 81], fill=(25, 25, 30, 255))
    # Right leg
    d.rectangle([42, 58, 48, 76], fill=(40, 50, 65, 255), outline=OUTLINE)
    d.rectangle([41, 75, 50, 80], fill=(195, 155, 45, 255), outline=OUTLINE) # Gold boot
    d.rectangle([42, 79, 51, 81], fill=(25, 25, 30, 255))

    # Waist & Belt
    d.rectangle([28, 54, 50, 58], fill=(30, 30, 35, 255), outline=OUTLINE)
    d.rectangle([36, 54, 42, 58], fill=(240, 200, 80, 255), outline=OUTLINE) # Belt buckle

    # Muscular Torso with 6-pack & open golden pauldron
    d.rectangle([29, 36, 49, 54], fill=SKIN_BASE, outline=OUTLINE)
    # 6-Pack Abs definition lines
    d.line([39, 38, 39, 53], fill=SKIN_DEEP) # Sternum / linea alba
    d.line([33, 42, 45, 42], fill=SKIN_SHADOW) # Upper abs
    d.line([33, 46, 45, 46], fill=SKIN_SHADOW) # Mid abs
    d.line([34, 50, 44, 50], fill=SKIN_SHADOW) # Lower abs
    # Pectoral lines
    d.line([31, 40, 38, 41], fill=SKIN_DEEP)
    d.line([40, 41, 47, 40], fill=SKIN_DEEP)

    # Golden Pauldron on Right shoulder
    d.rectangle([48, 34, 56, 42], fill=(245, 200, 70, 255), outline=OUTLINE)
    d.rectangle([50, 36, 54, 40], fill=(255, 230, 130, 255))

    # Right Arm with Golden Sword
    d.rectangle([49, 41, 55, 53], fill=SKIN_BASE, outline=OUTLINE)
    # Sword hilt
    d.rectangle([52, 53, 54, 58], fill=(180, 140, 40, 255), outline=OUTLINE)
    d.rectangle([49, 57, 57, 59], fill=(235, 190, 60, 255), outline=OUTLINE) # Crossguard
    # Sword blade (shining silver-blue)
    d.rectangle([51, 60, 55, 78], fill=(225, 240, 255, 255), outline=OUTLINE)
    d.line([52, 60, 52, 77], fill=(255, 255, 255, 255)) # Blade highlight
    d.polygon([(51, 78), (53, 82), (55, 78)], fill=(225, 240, 255, 255), outline=OUTLINE)

    # Left Arm with Giant Golden Lion Tower Shield
    d.rectangle([23, 40, 29, 52], fill=SKIN_BASE, outline=OUTLINE)
    # Shield Body
    d.rectangle([13, 35, 27, 72], fill=(215, 165, 40, 255), outline=OUTLINE)
    d.rectangle([15, 37, 25, 70], fill=(245, 205, 80, 255))
    # Shield Lion / Rune Crest
    d.rectangle([17, 44, 23, 52], fill=(255, 235, 140, 255), outline=(170, 120, 25, 255))
    d.rectangle([18, 54, 22, 62], fill=(185, 135, 30, 255))
    # Shield gem (cyan glowing)
    d.rectangle([19, 47, 21, 49], fill=(40, 215, 235, 255))

    # Neck
    d.rectangle([36, 31, 42, 36], fill=SKIN_SHADOW, outline=OUTLINE)

    # Head & Face
    d.rectangle([31, 17, 47, 32], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([31, 17, 47, 21], fill=SKIN_SHADOW) # Forehead shadow

    # Anime Eyes (Amber / Gold)
    # Left eye
    d.rectangle([34, 22, 38, 27], fill=EYE_WHITE, outline=OUTLINE)
    d.rectangle([36, 23, 38, 27], fill=(215, 140, 30, 255))
    d.point((36, 23), fill=EYE_WHITE) # Catchlight
    # Right eye
    d.rectangle([41, 22, 45, 27], fill=EYE_WHITE, outline=OUTLINE)
    d.rectangle([41, 23, 43, 27], fill=(215, 140, 30, 255))
    d.point((41, 23), fill=EYE_WHITE) # Catchlight

    # Confident Smile
    d.point((39, 29), fill=(180, 100, 80, 255))
    d.point((40, 29), fill=(180, 100, 80, 255))

    # Spiky Anime Hair (Blonde / Gold with highlights)
    HAIR_BASE = (245, 195, 65, 255)
    HAIR_HI = (255, 235, 140, 255)
    HAIR_SH = (195, 140, 35, 255)

    # Hair back volume
    d.polygon([(26, 22), (28, 12), (35, 8), (43, 8), (51, 13), (53, 23), (49, 17), (40, 14), (29, 18)], fill=HAIR_SH, outline=OUTLINE)
    # Main spiky bangs
    d.polygon([(27, 18), (32, 10), (38, 14), (35, 20)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(34, 12), (40, 7), (45, 13), (41, 19)], fill=HAIR_HI, outline=OUTLINE)
    d.polygon([(42, 10), (48, 9), (52, 16), (46, 20)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(48, 15), (54, 16), (51, 22), (47, 21)], fill=HAIR_SH, outline=OUTLINE)
    # Sideburns
    d.polygon([(30, 20), (32, 26), (33, 21)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(46, 20), (47, 26), (45, 21)], fill=HAIR_BASE, outline=OUTLINE)

    return upscale(img)

# ==============================================================================
# 2. TANK FEMALE (Valkyrie - Blonde Flowing Hair, Sexy Golden Cuirass, Shield)
# ==============================================================================
def gen_tank_female():
    img = Image.new("RGBA", (80, 90), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    draw_ground_shadow(d, 40, 82, 20, 5)

    # Flowing Hair Behind Body
    HAIR_BASE = (250, 215, 95, 255)
    HAIR_HI = (255, 240, 160, 255)
    HAIR_SH = (205, 160, 50, 255)
    d.polygon([(23, 30), (18, 55), (24, 70), (28, 50)], fill=HAIR_SH, outline=OUTLINE)
    d.polygon([(55, 30), (60, 55), (54, 70), (50, 50)], fill=HAIR_SH, outline=OUTLINE)

    # Legs in thigh-high armored boots
    # Left leg
    d.rectangle([31, 58, 36, 66], fill=SKIN_BASE, outline=OUTLINE) # Thigh
    d.rectangle([30, 66, 36, 78], fill=(225, 185, 65, 255), outline=OUTLINE) # Gold boot
    d.rectangle([30, 78, 37, 81], fill=(45, 35, 40, 255))
    # Right leg
    d.rectangle([42, 58, 47, 66], fill=SKIN_BASE, outline=OUTLINE) # Thigh
    d.rectangle([42, 66, 48, 78], fill=(205, 165, 50, 255), outline=OUTLINE) # Gold boot
    d.rectangle([41, 78, 48, 81], fill=(45, 35, 40, 255))

    # Miniskirt / Battle sash
    d.rectangle([29, 53, 49, 58], fill=(160, 40, 55, 255), outline=OUTLINE)
    d.rectangle([35, 54, 43, 58], fill=(245, 205, 80, 255))

    # Hourglass Torso with Sexy Golden Cuirass & Cleavage
    d.rectangle([32, 45, 46, 54], fill=SKIN_BASE, outline=OUTLINE) # Slender midriff
    d.line([39, 46, 39, 52], fill=SKIN_SHADOW) # Navel line
    # Golden Bustier / Cuirass with cleavage
    d.rectangle([30, 36, 48, 45], fill=(235, 190, 60, 255), outline=OUTLINE)
    d.rectangle([33, 37, 45, 43], fill=(255, 225, 110, 255))
    # Cleavage V-cut
    d.polygon([(37, 36), (39, 41), (41, 36)], fill=SKIN_SHADOW, outline=OUTLINE)
    d.line([(39, 37), (39, 41)], fill=SKIN_DEEP)

    # Left Arm with Golden Shield
    d.rectangle([24, 38, 29, 50], fill=SKIN_BASE, outline=OUTLINE)
    # Valkyrie Shield with wings
    d.polygon([(14, 40), (26, 36), (27, 62), (20, 68), (13, 60)], fill=(245, 200, 75, 255), outline=OUTLINE)
    d.polygon([(17, 42), (24, 39), (24, 59), (20, 64), (16, 58)], fill=(255, 235, 140, 255))
    d.rectangle([18, 48, 22, 53], fill=(40, 215, 235, 255), outline=OUTLINE) # Center gem

    # Right Arm with Rapier / Light Sword
    d.rectangle([49, 38, 54, 50], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([51, 50, 53, 54], fill=(200, 160, 50, 255), outline=OUTLINE) # Hilt
    d.rectangle([48, 54, 56, 56], fill=(245, 205, 75, 255), outline=OUTLINE) # Guard
    d.rectangle([51, 56, 53, 76], fill=(240, 250, 255, 255), outline=OUTLINE) # Thin blade

    # Neck
    d.rectangle([37, 31, 41, 36], fill=SKIN_BASE, outline=OUTLINE)

    # Head & Face
    d.rectangle([32, 17, 46, 31], fill=SKIN_BASE, outline=OUTLINE)

    # Sexy Anime Eyes with Eyelashes
    # Left eye
    d.rectangle([34, 22, 38, 27], fill=EYE_WHITE, outline=OUTLINE)
    d.rectangle([36, 23, 38, 27], fill=(40, 170, 230, 255)) # Blue iris
    d.point((36, 23), fill=EYE_WHITE)
    d.line([33, 21, 38, 21], fill=OUTLINE) # Eyelash flick
    # Right eye
    d.rectangle([41, 22, 45, 27], fill=EYE_WHITE, outline=OUTLINE)
    d.rectangle([41, 23, 43, 27], fill=(40, 170, 230, 255))
    d.point((41, 23), fill=EYE_WHITE)
    d.line([41, 21, 46, 21], fill=OUTLINE) # Eyelash flick

    # Cute Lip Tint
    d.point((39, 29), fill=(235, 110, 130, 255))

    # Long Blonde Valkyrie Hair & Tiara
    # Tiara
    d.rectangle([33, 16, 45, 18], fill=(245, 200, 60, 255), outline=OUTLINE)
    d.point((39, 17), fill=(40, 215, 235, 255)) # Tiara gem
    # Forehead Bangs
    d.polygon([(30, 17), (35, 13), (39, 17), (36, 22)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(38, 14), (43, 12), (48, 17), (43, 22)], fill=HAIR_HI, outline=OUTLINE)
    d.polygon([(29, 19), (32, 28), (30, 24)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(46, 19), (48, 28), (47, 23)], fill=HAIR_BASE, outline=OUTLINE)

    return upscale(img)

# ==============================================================================
# 3. FIGHTER MALE (Dragon Brawler - Crimson Spiky Hair, 6-Pack, Dragon Tattoo)
# ==============================================================================
def gen_fighter_male():
    img = Image.new("RGBA", (80, 90), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    draw_ground_shadow(d, 40, 82, 22, 6)

    # Wide martial arts stance
    # Left leg
    d.rectangle([28, 58, 35, 76], fill=(35, 35, 45, 255), outline=OUTLINE)
    d.rectangle([26, 75, 36, 80], fill=(185, 40, 45, 255), outline=OUTLINE) # Red wrap boot
    d.rectangle([27, 79, 37, 81], fill=(255, 255, 255, 255)) # White sole
    # Right leg
    d.rectangle([43, 58, 50, 76], fill=(30, 30, 40, 255), outline=OUTLINE)
    d.rectangle([42, 75, 52, 80], fill=(185, 40, 45, 255), outline=OUTLINE)
    d.rectangle([43, 79, 53, 81], fill=(255, 255, 255, 255))

    # Red martial sash / belt
    d.rectangle([27, 53, 51, 58], fill=(195, 45, 45, 255), outline=OUTLINE)
    d.rectangle([36, 54, 42, 64], fill=(225, 60, 60, 255), outline=OUTLINE) # Hanging sash

    # Bare Torso with Ripped 6-Pack Abs & Dragon Tattoo
    d.rectangle([29, 35, 49, 54], fill=SKIN_BASE, outline=OUTLINE)
    # 6-Pack Abs
    d.line([39, 37, 39, 53], fill=SKIN_DEEP)
    d.line([33, 41, 45, 41], fill=SKIN_SHADOW)
    d.line([33, 45, 45, 45], fill=SKIN_SHADOW)
    d.line([34, 49, 44, 49], fill=SKIN_SHADOW)
    # Pectorals
    d.line([31, 39, 38, 40], fill=SKIN_DEEP)
    d.line([40, 40, 47, 39], fill=SKIN_DEEP)

    # Crimson Dragon Tattoo on Right Shoulder & Chest
    d.line([42, 36, 46, 40], fill=(185, 35, 45, 255), width=2)
    d.line([46, 40, 48, 44], fill=(185, 35, 45, 255))
    d.point((43, 37), fill=(255, 180, 50, 255)) # Dragon eye spark

    # Arms with Flaming Gauntlets
    # Left Arm
    d.rectangle([21, 38, 28, 48], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([18, 48, 27, 60], fill=(195, 40, 45, 255), outline=OUTLINE) # Red gauntlet
    d.rectangle([19, 50, 25, 54], fill=(245, 185, 55, 255)) # Gold plate
    # Fire aura spark
    d.point((17, 55), fill=(255, 120, 30, 255))
    d.point((16, 52), fill=(255, 220, 80, 255))

    # Right Arm
    d.rectangle([50, 38, 57, 48], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([51, 48, 60, 60], fill=(195, 40, 45, 255), outline=OUTLINE)
    d.rectangle([53, 50, 59, 54], fill=(245, 185, 55, 255))
    d.point((61, 55), fill=(255, 120, 30, 255))
    d.point((62, 52), fill=(255, 220, 80, 255))

    # Neck
    d.rectangle([36, 30, 42, 35], fill=SKIN_SHADOW, outline=OUTLINE)

    # Head & Face
    d.rectangle([31, 16, 47, 31], fill=SKIN_BASE, outline=OUTLINE)

    # Fiery Anime Eyes (Amber / Flame)
    # Left eye
    d.rectangle([34, 21, 38, 26], fill=EYE_WHITE, outline=OUTLINE)
    d.rectangle([36, 22, 38, 26], fill=(235, 75, 35, 255))
    d.point((36, 22), fill=EYE_WHITE)
    # Right eye
    d.rectangle([41, 21, 45, 26], fill=EYE_WHITE, outline=OUTLINE)
    d.rectangle([41, 22, 43, 26], fill=(235, 75, 35, 255))
    d.point((41, 22), fill=EYE_WHITE)

    # Smirk
    d.line([38, 28, 41, 28], fill=(180, 90, 75, 255))

    # Spiky Wild Red Hair
    HAIR_BASE = (225, 60, 50, 255)
    HAIR_HI = (255, 120, 90, 255)
    HAIR_SH = (165, 35, 40, 255)

    d.polygon([(26, 20), (28, 10), (35, 6), (43, 6), (52, 11), (54, 21), (48, 15), (39, 12), (28, 17)], fill=HAIR_SH, outline=OUTLINE)
    d.polygon([(27, 16), (32, 8), (38, 12), (34, 18)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(34, 10), (41, 5), (46, 11), (41, 17)], fill=HAIR_HI, outline=OUTLINE)
    d.polygon([(43, 8), (50, 7), (53, 14), (47, 18)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(30, 18), (32, 25), (33, 20)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(46, 18), (47, 25), (45, 20)], fill=HAIR_BASE, outline=OUTLINE)

    return upscale(img)

# ==============================================================================
# 4. FIGHTER FEMALE (Flame Martial Artist - Red Ponytail, Crop Top, 11-Line Abs)
# ==============================================================================
def gen_fighter_female():
    img = Image.new("RGBA", (80, 90), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    draw_ground_shadow(d, 40, 82, 20, 5)

    HAIR_BASE = (230, 65, 60, 255)
    HAIR_HI = (255, 130, 110, 255)
    HAIR_SH = (170, 35, 45, 255)

    # High Ponytail swaying behind
    d.polygon([(45, 14), (58, 6), (65, 14), (62, 32), (54, 26)], fill=HAIR_SH, outline=OUTLINE)
    d.polygon([(48, 13), (57, 8), (62, 14), (58, 28), (53, 22)], fill=HAIR_BASE)

    # Legs in low-rise martial pants & sneakers
    # Left leg
    d.rectangle([30, 58, 36, 76], fill=(35, 35, 45, 255), outline=OUTLINE)
    d.rectangle([28, 75, 37, 80], fill=(225, 60, 65, 255), outline=OUTLINE)
    d.rectangle([29, 79, 38, 81], fill=(255, 255, 255, 255))
    # Right leg
    d.rectangle([42, 58, 48, 76], fill=(30, 30, 40, 255), outline=OUTLINE)
    d.rectangle([41, 75, 50, 80], fill=(225, 60, 65, 255), outline=OUTLINE)
    d.rectangle([42, 79, 51, 81], fill=(255, 255, 255, 255))

    # Low-rise waist sash
    d.rectangle([29, 54, 49, 58], fill=(195, 45, 50, 255), outline=OUTLINE)

    # Sexy Bare Midriff with Athletic 11-line Abs
    d.rectangle([31, 45, 47, 54], fill=SKIN_BASE, outline=OUTLINE)
    d.line([37, 46, 37, 52], fill=SKIN_SHADOW) # Left 11-line
    d.line([41, 46, 41, 52], fill=SKIN_SHADOW) # Right 11-line
    d.point((39, 49), fill=SKIN_DEEP) # Navel

    # Red/Black Sports Crop Top with Cleavage
    d.rectangle([30, 36, 48, 45], fill=(30, 30, 35, 255), outline=OUTLINE)
    d.rectangle([32, 38, 46, 44], fill=(215, 55, 60, 255))
    # Cleavage V
    d.polygon([(37, 36), (39, 41), (41, 36)], fill=SKIN_SHADOW, outline=OUTLINE)
    d.line([39, 37, 39, 41], fill=SKIN_DEEP)

    # Arms with Flaming Gauntlets
    # Left
    d.rectangle([22, 38, 29, 48], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([20, 48, 28, 59], fill=(215, 55, 60, 255), outline=OUTLINE)
    d.point((19, 53), fill=(255, 180, 50, 255))
    # Right
    d.rectangle([49, 38, 56, 48], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([50, 48, 58, 59], fill=(215, 55, 60, 255), outline=OUTLINE)
    d.point((59, 53), fill=(255, 180, 50, 255))

    # Neck
    d.rectangle([37, 31, 41, 36], fill=SKIN_BASE, outline=OUTLINE)

    # Head & Face
    d.rectangle([32, 17, 46, 31], fill=SKIN_BASE, outline=OUTLINE)

    # Sexy Anime Eyes
    d.rectangle([34, 22, 38, 27], fill=EYE_WHITE, outline=OUTLINE)
    d.rectangle([36, 23, 38, 27], fill=(225, 75, 55, 255))
    d.point((36, 23), fill=EYE_WHITE)
    d.line([33, 21, 38, 21], fill=OUTLINE)

    d.rectangle([41, 22, 45, 27], fill=EYE_WHITE, outline=OUTLINE)
    d.rectangle([41, 23, 43, 27], fill=(225, 75, 55, 255))
    d.point((41, 23), fill=EYE_WHITE)
    d.line([41, 21, 46, 21], fill=OUTLINE)

    d.point((39, 29), fill=(240, 100, 120, 255)) # Lip tint

    # Hair Bangs & Red Ribbon
    d.rectangle([44, 13, 48, 16], fill=(255, 255, 255, 255), outline=OUTLINE) # White hair tie
    d.polygon([(30, 17), (35, 11), (39, 16), (36, 21)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(38, 13), (43, 10), (47, 15), (42, 20)], fill=HAIR_HI, outline=OUTLINE)
    d.polygon([(29, 19), (32, 27), (31, 22)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(46, 19), (48, 27), (47, 22)], fill=HAIR_BASE, outline=OUTLINE)

    return upscale(img)

# ==============================================================================
# 5. ASSASSIN MALE (Use Clean Extracted Sample Sprite)
# ==============================================================================
def gen_assassin_male():
    sample_path = os.path.join(OUTPUT_DIR, "pixel_assassin_male.png")
    if os.path.exists(sample_path):
        im = Image.open(sample_path).convert("RGBA")
        return upscale(im)
    # Fallback to gen
    return gen_fighter_male()

# ==============================================================================
# 6. ASSASSIN FEMALE (Shadow Kunoichi - Purple/Crimson Hair, Corset, Dual Daggers)
# ==============================================================================
def gen_assassin_female():
    img = Image.new("RGBA", (80, 90), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    draw_ground_shadow(d, 40, 82, 20, 5)

    HAIR_BASE = (165, 65, 160, 255)
    HAIR_HI = (210, 115, 205, 255)
    HAIR_SH = (110, 35, 115, 255)

    # Long hair falling behind shoulders
    d.polygon([(22, 28), (18, 54), (25, 68), (28, 48)], fill=HAIR_SH, outline=OUTLINE)
    d.polygon([(56, 28), (60, 54), (53, 68), (50, 48)], fill=HAIR_SH, outline=OUTLINE)

    # Legs in tight dark ninja leggings & purple wrap boots
    d.rectangle([31, 58, 36, 76], fill=(30, 25, 38, 255), outline=OUTLINE)
    d.rectangle([29, 75, 37, 80], fill=(155, 60, 150, 255), outline=OUTLINE)
    d.rectangle([30, 79, 38, 81], fill=(20, 18, 26, 255))

    d.rectangle([42, 58, 47, 76], fill=(25, 22, 34, 255), outline=OUTLINE)
    d.rectangle([41, 75, 49, 80], fill=(135, 48, 130, 255), outline=OUTLINE)
    d.rectangle([41, 79, 49, 81], fill=(20, 18, 26, 255))

    # Thigh straps
    d.line([31, 62, 36, 62], fill=(190, 80, 185, 255))
    d.line([42, 64, 47, 64], fill=(190, 80, 185, 255))

    # Waist & Shadow Sash
    d.rectangle([30, 53, 48, 58], fill=(45, 32, 55, 255), outline=OUTLINE)
    d.rectangle([36, 54, 42, 62], fill=(160, 65, 155, 255), outline=OUTLINE)

    # Sexy Bare Waist & Cleavage Bodysuit
    d.rectangle([32, 45, 46, 53], fill=SKIN_BASE, outline=OUTLINE) # Bare midriff
    d.point((39, 49), fill=SKIN_DEEP) # Navel
    # Leather Corset Top
    d.rectangle([30, 36, 48, 45], fill=(30, 25, 38, 255), outline=OUTLINE)
    d.rectangle([33, 38, 45, 44], fill=(60, 42, 75, 255))
    # Cleavage V
    d.polygon([(37, 36), (39, 41), (41, 36)], fill=SKIN_SHADOW, outline=OUTLINE)
    d.line([39, 37, 39, 41], fill=SKIN_DEEP)

    # Dual Curved Shadow Daggers (Reverse Grip)
    # Left Arm & Dagger
    d.rectangle([23, 38, 29, 48], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([20, 48, 26, 52], fill=(45, 35, 55, 255), outline=OUTLINE) # Glove
    # Left Dagger (Curved upward)
    d.polygon([(21, 46), (15, 32), (18, 30), (23, 44)], fill=(215, 225, 245, 255), outline=OUTLINE)
    d.line([17, 32, 22, 44], fill=(255, 255, 255, 255)) # Silver edge

    # Right Arm & Dagger
    d.rectangle([49, 38, 55, 48], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([52, 48, 58, 52], fill=(45, 35, 55, 255), outline=OUTLINE)
    # Right Dagger (Glowing Violet Blade pointing down)
    d.polygon([(55, 52), (64, 66), (62, 68), (53, 54)], fill=(185, 75, 215, 255), outline=OUTLINE)
    d.line([56, 54, 63, 66], fill=(245, 185, 255, 255)) # Violet glow edge

    # Neck & Choker
    d.rectangle([37, 31, 41, 36], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([36, 33, 42, 35], fill=(30, 25, 38, 255)) # Choker

    # Head & Face
    d.rectangle([32, 17, 46, 31], fill=SKIN_BASE, outline=OUTLINE)

    # Seductive Violet Eyes
    d.rectangle([34, 22, 38, 27], fill=EYE_WHITE, outline=OUTLINE)
    d.rectangle([36, 23, 38, 27], fill=(175, 65, 195, 255))
    d.point((36, 23), fill=EYE_WHITE)
    d.line([33, 21, 38, 21], fill=OUTLINE)

    d.rectangle([41, 22, 45, 27], fill=EYE_WHITE, outline=OUTLINE)
    d.rectangle([41, 23, 43, 27], fill=(175, 65, 195, 255))
    d.point((41, 23), fill=EYE_WHITE)
    d.line([41, 21, 46, 21], fill=OUTLINE)

    d.point((39, 29), fill=(225, 95, 135, 255)) # Lip tint

    # Hair Bangs
    d.polygon([(30, 17), (35, 12), (39, 16), (36, 21)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(38, 13), (43, 11), (47, 15), (42, 20)], fill=HAIR_HI, outline=OUTLINE)
    d.polygon([(29, 19), (32, 28), (30, 23)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(46, 19), (48, 28), (47, 23)], fill=HAIR_BASE, outline=OUTLINE)

    return upscale(img)

# ==============================================================================
# 7. GUNNER MALE (Cyberpunk Ranger - Silver Hair, Cyber Monocle, Plasma Rifle)
# ==============================================================================
def gen_gunner_male():
    img = Image.new("RGBA", (80, 90), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    draw_ground_shadow(d, 40, 82, 22, 6)

    # Tactical combat pants & techwear boots
    d.rectangle([30, 58, 36, 76], fill=(35, 42, 50, 255), outline=OUTLINE)
    d.rectangle([28, 75, 37, 80], fill=(25, 30, 38, 255), outline=OUTLINE)
    d.rectangle([29, 79, 38, 81], fill=(40, 215, 235, 255)) # Cyan sole

    d.rectangle([42, 58, 48, 76], fill=(30, 36, 44, 255), outline=OUTLINE)
    d.rectangle([41, 75, 50, 80], fill=(25, 30, 38, 255), outline=OUTLINE)
    d.rectangle([42, 79, 51, 81], fill=(40, 215, 235, 255))

    # Belt with ammo packs
    d.rectangle([28, 54, 50, 58], fill=(20, 25, 32, 255), outline=OUTLINE)
    d.rectangle([31, 55, 34, 57], fill=(40, 215, 235, 255)) # Battery cell

    # Open Trench Coat showing 6-pack
    d.rectangle([26, 36, 52, 68], fill=(30, 36, 45, 255), outline=OUTLINE) # Coat back
    # Muscular Chest & 6-pack visible in open coat
    d.rectangle([33, 37, 45, 54], fill=SKIN_BASE, outline=OUTLINE)
    d.line([39, 38, 39, 53], fill=SKIN_DEEP)
    d.line([35, 42, 43, 42], fill=SKIN_SHADOW)
    d.line([35, 46, 43, 46], fill=SKIN_SHADOW)
    d.line([35, 50, 43, 50], fill=SKIN_SHADOW)
    # Coat lapels
    d.polygon([(30, 36), (34, 46), (31, 56), (27, 46)], fill=(45, 55, 70, 255), outline=OUTLINE)
    d.polygon([(48, 36), (44, 46), (47, 56), (51, 46)], fill=(45, 55, 70, 255), outline=OUTLINE)

    # Left Hand supporting Heavy Plasma Rifle
    d.rectangle([22, 44, 28, 52], fill=SKIN_BASE, outline=OUTLINE)

    # Right Hand holding Grip
    d.rectangle([48, 42, 54, 50], fill=SKIN_BASE, outline=OUTLINE)

    # Heavy High-Tech Plasma Sniper Rifle across body
    d.rectangle([14, 45, 66, 51], fill=(25, 30, 38, 255), outline=OUTLINE)
    d.rectangle([18, 46, 62, 48], fill=(40, 215, 235, 255)) # Plasma barrel rail
    d.rectangle([10, 46, 14, 50], fill=(60, 75, 95, 255), outline=OUTLINE) # Muzzle
    d.rectangle([44, 41, 56, 45], fill=(35, 45, 58, 255), outline=OUTLINE) # Optical scope
    d.point((45, 43), fill=(40, 215, 235, 255)) # Scope lens

    # Neck
    d.rectangle([37, 31, 41, 36], fill=SKIN_SHADOW, outline=OUTLINE)

    # Head & Face
    d.rectangle([31, 16, 47, 31], fill=SKIN_BASE, outline=OUTLINE)

    # Cyber Monocle Visor on Left Eye (Cyan Glowing)
    d.rectangle([33, 20, 39, 27], fill=(20, 35, 48, 255), outline=OUTLINE)
    d.rectangle([34, 21, 38, 26], fill=(40, 215, 235, 255))
    d.rectangle([35, 22, 37, 24], fill=(220, 250, 255, 255)) # Crosshair spark

    # Natural Right Eye
    d.rectangle([41, 21, 45, 26], fill=EYE_WHITE, outline=OUTLINE)
    d.rectangle([41, 22, 43, 26], fill=(45, 60, 75, 255))
    d.point((41, 22), fill=EYE_WHITE)

    # Silver / Platinum Undercut Hair
    HAIR_BASE = (215, 225, 238, 255)
    HAIR_HI = (250, 252, 255, 255)
    HAIR_SH = (155, 170, 190, 255)

    d.polygon([(26, 18), (29, 9), (36, 6), (44, 6), (52, 11), (54, 20), (48, 14), (38, 12), (28, 16)], fill=HAIR_SH, outline=OUTLINE)
    d.polygon([(27, 15), (33, 7), (39, 11), (34, 18)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(35, 9), (42, 5), (47, 10), (41, 17)], fill=HAIR_HI, outline=OUTLINE)
    d.polygon([(44, 8), (51, 8), (53, 14), (47, 17)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(46, 18), (48, 24), (45, 20)], fill=HAIR_BASE, outline=OUTLINE)

    return upscale(img)

# ==============================================================================
# 8. GUNNER FEMALE (Cyber Gunner - Cyan Twin-Tails, Cutout Bodysuit, Dual Pistols)
# ==============================================================================
def gen_gunner_female():
    img = Image.new("RGBA", (80, 90), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    draw_ground_shadow(d, 40, 82, 20, 5)

    HAIR_BASE = (40, 215, 235, 255)
    HAIR_HI = (130, 245, 255, 255)
    HAIR_SH = (20, 150, 175, 255)

    # Dynamic Cyber Twin-Tails
    # Left tail
    d.polygon([(26, 16), (12, 18), (8, 38), (14, 52), (18, 36), (22, 22)], fill=HAIR_SH, outline=OUTLINE)
    d.polygon([(24, 18), (14, 22), (11, 38), (16, 48), (19, 32)], fill=HAIR_BASE)
    # Right tail
    d.polygon([(52, 16), (66, 18), (70, 38), (64, 52), (60, 36), (56, 22)], fill=HAIR_SH, outline=OUTLINE)
    d.polygon([(54, 18), (64, 22), (67, 38), (62, 48), (59, 32)], fill=HAIR_BASE)

    # Legs in thigh-high tech boots
    d.rectangle([31, 58, 36, 66], fill=SKIN_BASE, outline=OUTLINE) # Thigh
    d.rectangle([30, 66, 36, 78], fill=(30, 35, 45, 255), outline=OUTLINE)
    d.rectangle([29, 78, 37, 81], fill=(40, 215, 235, 255)) # Cyan sole

    d.rectangle([42, 58, 47, 66], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([42, 66, 48, 78], fill=(25, 30, 40, 255), outline=OUTLINE)
    d.rectangle([41, 78, 48, 81], fill=(40, 215, 235, 255))

    # Tech Utility Belt
    d.rectangle([29, 53, 49, 58], fill=(20, 25, 35, 255), outline=OUTLINE)
    d.rectangle([36, 54, 42, 57], fill=(40, 215, 235, 255))

    # Hourglass Silhouette with Cutout Cyber Bodysuit
    d.rectangle([32, 45, 46, 53], fill=SKIN_BASE, outline=OUTLINE) # Bare midriff
    d.point((39, 49), fill=SKIN_DEEP) # Navel
    # Bodysuit with diamond chest cutout
    d.rectangle([30, 36, 48, 45], fill=(30, 36, 48, 255), outline=OUTLINE)
    # Diamond cutout showing cleavage
    d.polygon([(39, 37), (43, 41), (39, 45), (35, 41)], fill=SKIN_BASE, outline=OUTLINE)
    d.line([39, 39, 39, 43], fill=SKIN_SHADOW)

    # Dual Laser Pistols in Hands
    # Left Hand & Blaster
    d.rectangle([22, 38, 28, 48], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([14, 44, 24, 49], fill=(35, 45, 60, 255), outline=OUTLINE)
    d.rectangle([10, 45, 14, 48], fill=(40, 215, 235, 255)) # Muzzle glow

    # Right Hand & Blaster
    d.rectangle([50, 38, 56, 48], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([54, 44, 64, 49], fill=(35, 45, 60, 255), outline=OUTLINE)
    d.rectangle([64, 45, 68, 48], fill=(40, 215, 235, 255))

    # Neck & Choker
    d.rectangle([37, 31, 41, 36], fill=SKIN_BASE, outline=OUTLINE)
    d.rectangle([36, 33, 42, 35], fill=(40, 215, 235, 255))

    # Head & Face
    d.rectangle([32, 17, 46, 31], fill=SKIN_BASE, outline=OUTLINE)

    # Cute & Sexy Anime Eyes
    d.rectangle([34, 22, 38, 27], fill=EYE_WHITE, outline=OUTLINE)
    d.rectangle([36, 23, 38, 27], fill=(30, 195, 225, 255))
    d.point((36, 23), fill=EYE_WHITE)
    d.line([33, 21, 38, 21], fill=OUTLINE)

    d.rectangle([41, 22, 45, 27], fill=EYE_WHITE, outline=OUTLINE)
    d.rectangle([41, 23, 43, 27], fill=(30, 195, 225, 255))
    d.point((41, 23), fill=EYE_WHITE)
    d.line([41, 21, 46, 21], fill=OUTLINE)

    d.point((39, 29), fill=(245, 110, 150, 255)) # Lip tint

    # Hair Bangs & Hairclips
    d.rectangle([28, 14, 32, 18], fill=(255, 255, 255, 255), outline=OUTLINE) # Left clip
    d.rectangle([46, 14, 50, 18], fill=(255, 255, 255, 255), outline=OUTLINE) # Right clip
    d.polygon([(30, 17), (35, 12), (39, 16), (36, 21)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(38, 13), (43, 11), (47, 15), (42, 20)], fill=HAIR_HI, outline=OUTLINE)
    d.polygon([(29, 19), (32, 27), (30, 22)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(46, 19), (48, 27), (47, 22)], fill=HAIR_BASE, outline=OUTLINE)

    return upscale(img)

def main():
    print("Generating Tank Male...")
    gen_tank_male().save(os.path.join(OUTPUT_DIR, "tank_male.png"))

    print("Generating Tank Female...")
    gen_tank_female().save(os.path.join(OUTPUT_DIR, "tank_female.png"))

    print("Generating Fighter Male...")
    gen_fighter_male().save(os.path.join(OUTPUT_DIR, "fighter_male.png"))

    print("Generating Fighter Female...")
    gen_fighter_female().save(os.path.join(OUTPUT_DIR, "fighter_female.png"))

    print("Generating Assassin Male (Reference Exact Sample)...")
    gen_assassin_male().save(os.path.join(OUTPUT_DIR, "assassin_male.png"))

    print("Generating Assassin Female...")
    gen_assassin_female().save(os.path.join(OUTPUT_DIR, "assassin_female.png"))

    print("Generating Gunner Male...")
    gen_gunner_male().save(os.path.join(OUTPUT_DIR, "gunner_male.png"))

    print("Generating Gunner Female...")
    gen_gunner_female().save(os.path.join(OUTPUT_DIR, "gunner_female.png"))

    print("ALL 8 PIXEL ART SPRITES GENERATED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
