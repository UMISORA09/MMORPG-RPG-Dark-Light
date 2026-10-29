#!/usr/bin/env python3
"""
Chiến Long Bá — Bộ Công Cụ Tạo Spritesheet Chiến Đấu Pixel Art Toàn Diện (All 8 Characters)
Tạo ra đầy đủ 8 tệp spritesheet chuẩn 512x576 px (8 cột x 9 hàng, 64x64 px / frame)
theo chuẩn clb-combat-animation và clb-character-art-style cho 4 hệ phái x 2 giới tính:
- fighter_male_combat_sheet.png & fighter_female_combat_sheet.png
- tank_male_combat_sheet.png & tank_female_combat_sheet.png
- assassin_male_combat_sheet.png & assassin_female_combat_sheet.png
- gunner_male_combat_sheet.png & gunner_female_combat_sheet.png
"""

import os
import sys
import math
from PIL import Image, ImageDraw

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

OUTPUT_DIR = r"artifacts/mmorpg-game/public/assets/sprites"
os.makedirs(OUTPUT_DIR, exist_ok=True)

FRAME_W = 64
FRAME_H = 64
COLS = 8
ROWS = 9
SHEET_W = COLS * FRAME_W
SHEET_H = ROWS * FRAME_H

OUTLINE = (35, 25, 38, 255) # 1px contour outline
EYE_WHITE = (255, 255, 255, 255)
SHADOW_GROUND = (0, 0, 0, 85)

CHARACTER_THEMES = {
    "fighter_male": {
        "skin_base": (255, 218, 185, 255),
        "skin_shadow": (225, 172, 142, 255),
        "hair_base": (225, 95, 60, 255),
        "hair_hi": (255, 145, 95, 255),
        "hair_sh": (165, 55, 40, 255),
        "cloth_primary": (185, 28, 28, 255),   # Red dragon coat
        "cloth_accent": (234, 179, 8, 255),    # Gold belt
        "cloth_pants": (30, 41, 59, 255),      # Navy pants
        "weapon_main": (245, 245, 250, 255),   # Greatsword blade
        "weapon_edge": (239, 68, 68, 255),     # Flaming red edge
        "slash_color": (239, 68, 68, 220),     # Red dragon fire
        "slash_inner": (255, 255, 255, 250),
        "is_female": False,
        "weapon_type": "greatsword"
    },
    "fighter_female": {
        "skin_base": (255, 224, 200, 255),
        "skin_shadow": (235, 182, 155, 255),
        "hair_base": (239, 68, 68, 255),
        "hair_hi": (248, 113, 113, 255),
        "hair_sh": (185, 28, 28, 255),
        "cloth_primary": (220, 38, 38, 255),
        "cloth_accent": (250, 204, 21, 255),
        "cloth_pants": (153, 27, 27, 255),
        "weapon_main": (245, 245, 250, 255),
        "weapon_edge": (249, 115, 22, 255),
        "slash_color": (249, 115, 22, 220),
        "slash_inner": (255, 255, 255, 250),
        "is_female": True,
        "weapon_type": "twin_blades"
    },
    "tank_male": {
        "skin_base": (250, 214, 180, 255),
        "skin_shadow": (220, 168, 138, 255),
        "hair_base": (234, 179, 8, 255),
        "hair_hi": (254, 240, 138, 255),
        "hair_sh": (161, 98, 7, 255),
        "cloth_primary": (234, 179, 8, 255),   # Gold plate
        "cloth_accent": (71, 85, 105, 255),    # Steel blue
        "cloth_pants": (51, 65, 85, 255),
        "weapon_main": (254, 240, 138, 255),   # Golden broadsword
        "weapon_edge": (202, 138, 4, 255),
        "slash_color": (250, 204, 21, 220),    # Holy golden light
        "slash_inner": (255, 255, 255, 250),
        "is_female": False,
        "weapon_type": "sword_shield"
    },
    "tank_female": {
        "skin_base": (255, 228, 205, 255),
        "skin_shadow": (235, 186, 160, 255),
        "hair_base": (250, 204, 21, 255),
        "hair_hi": (254, 249, 195, 255),
        "hair_sh": (180, 83, 9, 255),
        "cloth_primary": (250, 204, 21, 255),
        "cloth_accent": (241, 245, 249, 255),
        "cloth_pants": (148, 163, 184, 255),
        "weapon_main": (255, 255, 255, 255),
        "weapon_edge": (234, 179, 8, 255),
        "slash_color": (253, 224, 71, 220),
        "slash_inner": (255, 255, 255, 250),
        "is_female": True,
        "weapon_type": "sword_shield"
    },
    "assassin_male": {
        "skin_base": (245, 210, 185, 255),
        "skin_shadow": (210, 165, 140, 255),
        "hair_base": (49, 46, 129, 255),       # Dark violet/indigo
        "hair_hi": (99, 102, 241, 255),
        "hair_sh": (30, 27, 75, 255),
        "cloth_primary": (39, 39, 42, 255),    # Obsidian shadow cloak
        "cloth_accent": (147, 51, 234, 255),   # Violet trim
        "cloth_pants": (24, 24, 27, 255),
        "weapon_main": (192, 132, 252, 255),   # Void daggers
        "weapon_edge": (147, 51, 234, 255),
        "slash_color": (168, 85, 247, 220),    # Violet eclipse
        "slash_inner": (255, 255, 255, 250),
        "is_female": False,
        "weapon_type": "dual_daggers"
    },
    "assassin_female": {
        "skin_base": (255, 225, 205, 255),
        "skin_shadow": (230, 180, 155, 255),
        "hair_base": (126, 34, 206, 255),      # Purple hair
        "hair_hi": (192, 132, 252, 255),
        "hair_sh": (88, 28, 135, 255),
        "cloth_primary": (24, 24, 27, 255),
        "cloth_accent": (217, 70, 239, 255),   # Pink/violet accents
        "cloth_pants": (15, 23, 42, 255),
        "weapon_main": (244, 114, 182, 255),
        "weapon_edge": (168, 85, 247, 255),
        "slash_color": (217, 70, 239, 220),
        "slash_inner": (255, 255, 255, 250),
        "is_female": True,
        "weapon_type": "dual_daggers"
    },
    "gunner_male": {
        "skin_base": (250, 215, 185, 255),
        "skin_shadow": (220, 170, 140, 255),
        "hair_base": (203, 213, 225, 255),     # Silver-white hair
        "hair_hi": (248, 250, 252, 255),
        "hair_sh": (148, 163, 184, 255),
        "cloth_primary": (15, 23, 42, 255),    # Cyber trenchcoat
        "cloth_accent": (6, 182, 212, 255),    # Cyan glow circuits
        "cloth_pants": (30, 41, 59, 255),
        "weapon_main": (15, 23, 42, 255),      # Plasma rifle
        "weapon_edge": (0, 242, 255, 255),
        "slash_color": (0, 242, 255, 220),     # Laser cyan plasma
        "slash_inner": (255, 255, 255, 250),
        "is_female": False,
        "weapon_type": "rifle"
    },
    "gunner_female": {
        "skin_base": (255, 225, 205, 255),
        "skin_shadow": (230, 180, 155, 255),
        "hair_base": (6, 182, 212, 255),       # Cyan hair
        "hair_hi": (103, 232, 249, 255),
        "hair_sh": (14, 116, 144, 255),
        "cloth_primary": (15, 23, 42, 255),
        "cloth_accent": (56, 189, 248, 255),
        "cloth_pants": (30, 41, 59, 255),
        "weapon_main": (51, 65, 85, 255),
        "weapon_edge": (0, 242, 255, 255),
        "slash_color": (56, 189, 248, 220),
        "slash_inner": (255, 255, 255, 250),
        "is_female": True,
        "weapon_type": "dual_blasters"
    }
}

def draw_ground_shadow(d, cx, cy, rx, ry):
    for y in range(-ry, ry + 1):
        for x in range(-rx, rx + 1):
            if (x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1.0:
                d.point((cx + x, cy + y), fill=SHADOW_GROUND)

def draw_character_frame(d, cfg, cx, cy, bob_y=0, leg_l=(0, 0), leg_r=(0, 0), arm_l=(0, 0), arm_r=(0, 0), head_tilt=0, eyes_closed=False, crouch=0, weapon_action=None):
    draw_ground_shadow(d, cx, 58, 14, 4)

    body_y = cy + bob_y + crouch
    is_fem = cfg["is_female"]

    # 1. Legs
    ll_x = cx - 5 + leg_l[0]
    ll_y = body_y + 16 + leg_l[1]
    d.rectangle([ll_x, ll_y, ll_x + 4, ll_y + 12 - crouch], fill=cfg["cloth_pants"], outline=OUTLINE)
    d.rectangle([ll_x - 1, ll_y + 11 - crouch, ll_x + 4, ll_y + 14 - crouch], fill=(20, 20, 25, 255), outline=OUTLINE)

    rl_x = cx + 2 + leg_r[0]
    rl_y = body_y + 16 + leg_r[1]
    d.rectangle([rl_x, rl_y, rl_x + 4, rl_y + 12 - crouch], fill=cfg["cloth_pants"], outline=OUTLINE)
    d.rectangle([rl_x, rl_y + 11 - crouch, rl_x + 5, rl_y + 14 - crouch], fill=(20, 20, 25, 255), outline=OUTLINE)

    # 2. Torso & Outfits
    tw = 5 if is_fem else 7
    d.rectangle([cx - tw, body_y + 2, cx + tw, body_y + 16], fill=cfg["cloth_primary"], outline=OUTLINE)

    # Abs or Cleavage
    if not is_fem:
        # 6-Pack Abs V-Line
        d.rectangle([cx - 2, body_y + 4, cx + 2, body_y + 15], fill=cfg["skin_base"])
        d.line([cx, body_y + 5, cx, body_y + 14], fill=cfg["skin_shadow"])
        d.line([cx - 2, body_y + 8, cx + 2, body_y + 8], fill=cfg["skin_shadow"])
        d.line([cx - 2, body_y + 11, cx + 2, body_y + 11], fill=cfg["skin_shadow"])
    else:
        # Feminine waist & cleavage
        d.rectangle([cx - 2, body_y + 4, cx + 2, body_y + 9], fill=cfg["skin_base"])
        d.line([cx - 1, body_y + 7, cx + 1, body_y + 7], fill=cfg["skin_shadow"])
        # Belt accent
        d.rectangle([cx - tw, body_y + 13, cx + tw, body_y + 15], fill=cfg["cloth_accent"])

    # 3. Head & Hair
    hy = body_y - 12 + head_tilt
    hx = cx
    d.rectangle([hx - 5, hy, hx + 5, hy + 11], fill=cfg["skin_base"], outline=OUTLINE)
    d.rectangle([hx - 2, hy + 11, hx + 2, hy + 13], fill=cfg["skin_shadow"])

    if eyes_closed:
        d.line([hx - 4, hy + 5, hx - 1, hy + 5], fill=OUTLINE)
        d.line([hx + 1, hy + 5, hx + 4, hy + 5], fill=OUTLINE)
    else:
        # Eye Catchlights
        d.rectangle([hx - 4, hy + 4, hx - 1, hy + 7], fill=EYE_WHITE, outline=OUTLINE)
        d.point((hx - 2, hy + 5), fill=OUTLINE)
        d.point((hx - 3, hy + 4), fill=EYE_WHITE)

        d.rectangle([hx + 1, hy + 4, hx + 4, hy + 7], fill=EYE_WHITE, outline=OUTLINE)
        d.point((hx + 2, hy + 5), fill=OUTLINE)
        d.point((hx + 1, hy + 4), fill=EYE_WHITE)

    # Hair Geometry
    hb = cfg["hair_base"]
    hh = cfg["hair_hi"]
    hs = cfg["hair_sh"]

    if not is_fem:
        d.polygon([(hx - 8, hy + 1), (hx - 6, hy - 7), (hx - 1, hy - 9), (hx + 5, hy - 8), (hx + 8, hy - 4), (hx + 8, hy + 2), (hx + 5, hy - 2), (hx, hy - 4), (hx - 6, hy)], fill=hs, outline=OUTLINE)
        d.polygon([(hx - 7, hy - 2), (hx - 4, hy - 7), (hx, hy - 5), (hx - 2, hy + 1)], fill=hb, outline=OUTLINE)
        d.polygon([(hx - 2, hy - 7), (hx + 3, hy - 10), (hx + 6, hy - 5), (hx + 2, hy)], fill=hh, outline=OUTLINE)
    else:
        # Feminine ponytail
        d.polygon([(hx - 7, hy), (hx - 5, hy - 6), (hx + 1, hy - 8), (hx + 6, hy - 5), (hx + 7, hy + 2), (hx + 3, hy - 2), (hx - 5, hy)], fill=hb, outline=OUTLINE)
        d.polygon([(hx + 5, hy - 4), (hx + 12, hy - 10), (hx + 15, hy - 6), (hx + 10, hy + 1)], fill=hh, outline=OUTLINE)

    # 4. Arms & Weapons
    wtype = cfg["weapon_type"]
    al_x = cx - tw - 2 + arm_l[0]
    al_y = body_y + 3 + arm_l[1]
    ar_x = cx + tw - 1 + arm_r[0]
    ar_y = body_y + 3 + arm_r[1]

    d.rectangle([al_x, al_y, al_x + 3, al_y + 8], fill=cfg["cloth_primary"], outline=OUTLINE)
    d.rectangle([ar_x, ar_y, ar_x + 3, ar_y + 8], fill=cfg["cloth_primary"], outline=OUTLINE)

    # Weapon rendering based on type
    if weapon_action:
        # Slash / Action VFX
        wa = weapon_action.get("type", "slash")
        if wa == "slash":
            arc_r = weapon_action.get("radius", 20)
            d.arc([cx - arc_r, cy - arc_r, cx + arc_r, cy + arc_r], start=-60, end=70, fill=cfg["slash_color"], width=4)
            d.arc([cx - arc_r + 2, cy - arc_r + 2, cx + arc_r - 2, cy + arc_r - 2], start=-50, end=60, fill=cfg["slash_inner"], width=2)
        elif wa == "spin":
            d.ellipse([cx - 22, cy - 8, cx + 22, cy + 12], outline=cfg["slash_color"], width=3)
            d.ellipse([cx - 18, cy - 6, cx + 18, cy + 10], outline=cfg["slash_inner"], width=1)
        elif wa == "thrust":
            d.line([cx, cy + 8, cx + 28, cy + 8], fill=cfg["slash_color"], width=3)
            d.line([cx, cy + 8, cx + 32, cy + 8], fill=cfg["slash_inner"], width=1)
    else:
        # Idle weapons
        if wtype in ("greatsword", "sword_shield"):
            d.line([ar_x + 1, ar_y + 6, ar_x + 14, ar_y - 12], fill=cfg["weapon_edge"], width=3)
            d.line([ar_x + 1, ar_y + 6, ar_x + 13, ar_y - 11], fill=cfg["weapon_main"], width=1)
            if wtype == "sword_shield":
                d.rectangle([al_x - 4, al_y + 2, al_x + 2, al_y + 12], fill=cfg["cloth_accent"], outline=OUTLINE)
        elif wtype == "dual_daggers" or wtype == "twin_blades":
            d.line([ar_x + 2, ar_y + 6, ar_x + 9, ar_y - 4], fill=cfg["weapon_edge"], width=2)
            d.line([al_x + 1, al_y + 6, al_x - 6, al_y - 4], fill=cfg["weapon_edge"], width=2)
        elif wtype in ("rifle", "dual_blasters"):
            d.rectangle([ar_x + 2, ar_y + 4, ar_x + 16, ar_y + 8], fill=cfg["weapon_main"], outline=OUTLINE)
            d.point((ar_x + 16, ar_y + 6), fill=cfg["weapon_edge"])

def generate_full_combat_sheet(char_id, cfg):
    sheet = Image.new("RGBA", (SHEET_W, SHEET_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(sheet)

    for row in range(ROWS):
        for col in range(COLS):
            cx = col * FRAME_W + 32
            cy = row * FRAME_H + 34

            # ── ROW 0: IDLE (8 frames @ 8 FPS) ──
            if row == 0:
                bob = -1 if col in (2, 3, 4) else 0
                closed = col == 6
                draw_character_frame(d, cfg, cx, cy, bob_y=bob, eyes_closed=closed)

            # ── ROW 1: WALK / RUN (8 frames @ 12 FPS) ──
            elif row == 1:
                t = (col / 8.0) * 2 * math.pi
                leg_l = (int(math.sin(t) * 4), int(-abs(math.cos(t)) * 2))
                leg_r = (int(-math.sin(t) * 4), int(-abs(math.sin(t)) * 2))
                arm_l = (int(-math.sin(t) * 4), 0)
                arm_r = (int(math.sin(t) * 4), 0)
                bob = -int(abs(math.sin(t * 2)) * 2)
                draw_character_frame(d, cfg, cx, cy, bob_y=bob, leg_l=leg_l, leg_r=leg_r, arm_l=arm_l, arm_r=arm_r)

            # ── ROW 2: JUMP & FALL (8 frames @ 10 FPS) ──
            elif row == 2:
                if col == 0: # Squat prep
                    draw_character_frame(d, cfg, cx, cy, crouch=3)
                elif col in (1, 2, 3): # Rising
                    draw_character_frame(d, cfg, cx, cy - 8, leg_l=(-2, -3), leg_r=(2, -3))
                elif col == 4: # Apex
                    draw_character_frame(d, cfg, cx, cy - 10, leg_l=(-1, -2), leg_r=(1, -2))
                elif col in (5, 6): # Falling
                    draw_character_frame(d, cfg, cx, cy - 4, leg_l=(0, 2), leg_r=(0, 2))
                else: # Landing
                    draw_character_frame(d, cfg, cx, cy, crouch=2)

            # ── ROW 3: ATTACK 1 (Horizontal Combo Slash @ 14 FPS) ──
            elif row == 3:
                if col in (0, 1): # Windup
                    draw_character_frame(d, cfg, cx - 2, cy, arm_r=(-4, -2))
                elif col in (2, 3): # Active Impact Slash
                    draw_character_frame(d, cfg, cx + 4, cy, arm_r=(6, 0), weapon_action={"type": "slash", "radius": 22})
                elif col in (4, 5): # Follow Through
                    draw_character_frame(d, cfg, cx + 2, cy, arm_r=(4, 2))
                else: # Recovery
                    draw_character_frame(d, cfg, cx, cy)

            # ── ROW 4: ATTACK 2 (Whirlwind 360 Spin @ 14 FPS) ──
            elif row == 4:
                if col in (0, 1):
                    draw_character_frame(d, cfg, cx, cy, crouch=2)
                elif col in (2, 3, 4): # Spin
                    draw_character_frame(d, cfg, cx, cy - 2, weapon_action={"type": "spin"})
                else:
                    draw_character_frame(d, cfg, cx, cy)

            # ── ROW 5: AIR ATTACK (Ground Slam @ 12 FPS) ──
            elif row == 5:
                if col in (0, 1, 2): # Dive down
                    draw_character_frame(d, cfg, cx, cy - 6, arm_r=(0, -6))
                elif col in (3, 4): # Slam impact
                    draw_character_frame(d, cfg, cx, cy, crouch=4, weapon_action={"type": "slash", "radius": 24})
                else:
                    draw_character_frame(d, cfg, cx, cy, crouch=1)

            # ── ROW 6: ATTACK 3 (Slide Thrust @ 14 FPS) ──
            elif row == 6:
                if col in (0, 1):
                    draw_character_frame(d, cfg, cx - 4, cy, crouch=2)
                elif col in (2, 3, 4): # Rapid Thrust
                    draw_character_frame(d, cfg, cx + 6, cy, crouch=2, weapon_action={"type": "thrust"})
                else:
                    draw_character_frame(d, cfg, cx, cy)

            # ── ROW 7: ATTACK 4 (Ultimate Crescent Wave @ 14 FPS) ──
            elif row == 7:
                if col in (0, 1, 2): # Giant charge
                    draw_character_frame(d, cfg, cx - 4, cy, crouch=3)
                elif col in (3, 4, 5): # Crescent Wave Launch
                    draw_character_frame(d, cfg, cx + 6, cy, arm_r=(8, 0), weapon_action={"type": "slash", "radius": 28})
                else:
                    draw_character_frame(d, cfg, cx, cy)

            # ── ROW 8: DEATH / HURT (8 frames @ 8 FPS) ──
            elif row == 8:
                if col in (0, 1): # Hit recoil
                    draw_character_frame(d, cfg, cx - 6, cy, head_tilt=-2)
                elif col in (2, 3): # Fall down
                    draw_character_frame(d, cfg, cx - 10, cy + 6, crouch=6)
                else: # Ground knockout
                    draw_ground_shadow(d, cx - 8, 58, 14, 4)
                    d.rectangle([cx - 18, 52, cx + 8, 58], fill=cfg["cloth_primary"], outline=OUTLINE)
                    d.rectangle([cx - 24, 50, cx - 18, 58], fill=cfg["skin_base"], outline=OUTLINE)

    sheet_path = os.path.join(OUTPUT_DIR, f"{char_id}_combat_sheet.png")
    sheet.save(sheet_path)
    print(f"[SUCCESS] Saved combat spritesheet: {sheet_path}")

    # Also save class-level default if it's male (for backward compatibility)
    if char_id.endswith("_male"):
        base_id = char_id.replace("_male", "")
        compat_path = os.path.join(OUTPUT_DIR, f"{base_id}_combat_sheet.png")
        sheet.save(compat_path)
        print(f"[SUCCESS] Updated legacy compat sheet: {compat_path}")

def main():
    print("[INFO] Generating Full Suite of 8 Pixel Art Combat Spritesheets (512x576)...")
    for char_id, cfg in CHARACTER_THEMES.items():
        generate_full_combat_sheet(char_id, cfg)
    print("[SUCCESS] All 8 combat spritesheets created successfully!")

if __name__ == "__main__":
    main()

