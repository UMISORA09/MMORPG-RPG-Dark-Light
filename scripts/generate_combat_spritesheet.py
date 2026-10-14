import os
import math
from PIL import Image, ImageDraw

OUTPUT_DIR = r"c:\Cassavas\Game2.5D\artifacts\mmorpg-game\public\assets\sprites"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Grid setup
FRAME_W = 64
FRAME_H = 64
COLS = 8
ROWS = 9
SHEET_W = COLS * FRAME_W
SHEET_H = ROWS * FRAME_H

OUTLINE = (35, 25, 38, 255)
SKIN_BASE = (255, 218, 185, 255)
SKIN_SHADOW = (225, 172, 142, 255)
EYE_WHITE = (255, 255, 255, 255)
SHADOW_GROUND = (0, 0, 0, 85)

# Shirou / Anime Action Hero Palette
HAIR_BASE = (225, 95, 60, 255) # Orange-red spiky hair
HAIR_HI = (255, 145, 95, 255)
HAIR_SH = (165, 55, 40, 255)
JACKET_BASE = (38, 42, 52, 255) # Dark jacket
SHIRT_BASE = (245, 245, 250, 255) # White inner shirt
PANTS_BASE = (45, 90, 145, 255) # Blue jeans
SWORD_WHITE = (245, 250, 255, 255) # Kanshou
SWORD_BLACK = (35, 38, 45, 255) # Bakuya
SLASH_WHITE = (255, 255, 255, 220)
SLASH_CYAN = (60, 225, 255, 200)

def draw_ground_shadow(d, cx, cy, rx, ry):
    for y in range(-ry, ry + 1):
        for x in range(-rx, rx + 1):
            if (x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1.0:
                d.point((cx + x, cy + y), fill=SHADOW_GROUND)

def draw_base_hero(d, cx, cy, bob_y=0, leg_l=(0, 0), leg_r=(0, 0), arm_l=(0, 0), arm_r=(0, 0), head_tilt=0, eyes_closed=False, crouch=0):
    # Foot anchor is around cy = 54
    # Ground shadow
    draw_ground_shadow(d, cx, 58, 14, 4)

    body_y = cy + bob_y + crouch

    # 1. Legs
    # Left Leg
    ll_x = cx - 5 + leg_l[0]
    ll_y = body_y + 16 + leg_l[1]
    d.rectangle([ll_x, ll_y, ll_x + 4, ll_y + 12 - crouch], fill=PANTS_BASE, outline=OUTLINE)
    d.rectangle([ll_x - 1, ll_y + 11 - crouch, ll_x + 4, ll_y + 14 - crouch], fill=(30, 60, 110, 255), outline=OUTLINE)
    d.line([ll_x - 1, ll_y + 14 - crouch, ll_x + 4, ll_y + 14 - crouch], fill=(255, 255, 255, 255)) # White sole

    # Right Leg
    rl_x = cx + 2 + leg_r[0]
    rl_y = body_y + 16 + leg_r[1]
    d.rectangle([rl_x, rl_y, rl_x + 4, rl_y + 12 - crouch], fill=PANTS_BASE, outline=OUTLINE)
    d.rectangle([rl_x, rl_y + 11 - crouch, rl_x + 5, rl_y + 14 - crouch], fill=(30, 60, 110, 255), outline=OUTLINE)
    d.line([rl_x, rl_y + 14 - crouch, rl_x + 5, rl_y + 14 - crouch], fill=(255, 255, 255, 255))

    # 2. Torso (Jacket & Shirt)
    d.rectangle([cx - 7, body_y + 2, cx + 7, body_y + 16], fill=JACKET_BASE, outline=OUTLINE)
    # White inner shirt
    d.rectangle([cx - 3, body_y + 4, cx + 3, body_y + 16], fill=SHIRT_BASE)
    d.line([cx - 4, body_y + 3, cx - 1, body_y + 7], fill=JACKET_BASE, width=1) # Lapel L
    d.line([cx + 4, body_y + 3, cx + 1, body_y + 7], fill=JACKET_BASE, width=1) # Lapel R

    # 3. Head & Hair
    hy = body_y - 12 + head_tilt
    hx = cx
    # Face
    d.rectangle([hx - 6, hy, hx + 6, hy + 12], fill=SKIN_BASE, outline=OUTLINE)
    # Neck
    d.rectangle([hx - 2, hy + 12, hx + 2, hy + 14], fill=SKIN_SHADOW)

    # Eyes
    if eyes_closed:
        d.line([hx - 4, hy + 6, hx - 1, hy + 6], fill=OUTLINE)
        d.line([hx + 1, hy + 6, hx + 4, hy + 6], fill=OUTLINE)
    else:
        # Left eye
        d.rectangle([hx - 4, hy + 4, hx - 1, hy + 8], fill=EYE_WHITE, outline=OUTLINE)
        d.point((hx - 2, hy + 6), fill=(215, 140, 40, 255))
        d.point((hx - 2, hy + 5), fill=EYE_WHITE)
        # Right eye
        d.rectangle([hx + 1, hy + 4, hx + 4, hy + 8], fill=EYE_WHITE, outline=OUTLINE)
        d.point((hx + 2, hy + 6), fill=(215, 140, 40, 255))
        d.point((hx + 2, hy + 5), fill=EYE_WHITE)

    # Spiky Anime Hair
    d.polygon([(hx - 9, hy + 2), (hx - 7, hy - 6), (hx - 2, hy - 8), (hx + 4, hy - 8), (hx + 9, hy - 4), (hx + 9, hy + 3), (hx + 6, hy - 1), (hx, hy - 3), (hx - 7, hy)], fill=HAIR_SH, outline=OUTLINE)
    d.polygon([(hx - 8, hy - 1), (hx - 5, hy - 6), (hx - 1, hy - 4), (hx - 3, hy + 2)], fill=HAIR_BASE, outline=OUTLINE)
    d.polygon([(hx - 3, hy - 6), (hx + 2, hy - 9), (hx + 5, hy - 4), (hx + 1, hy + 1)], fill=HAIR_HI, outline=OUTLINE)
    d.polygon([(hx + 3, hy - 5), (hx + 8, hy - 5), (hx + 8, hy + 1), (hx + 5, hy)], fill=HAIR_BASE, outline=OUTLINE)
    # Bangs
    d.polygon([(hx - 6, hy + 1), (hx - 4, hy + 5), (hx - 3, hy + 2)], fill=HAIR_BASE)
    d.polygon([(hx + 3, hy + 1), (hx + 5, hy + 5), (hx + 4, hy + 2)], fill=HAIR_BASE)

    # 4. Arms & Dual Swords
    # Left Arm (Kanshou - White Blade)
    lax = cx - 8 + arm_l[0]
    lay = body_y + 4 + arm_l[1]
    d.rectangle([lax - 2, lay, lax + 2, lay + 7], fill=JACKET_BASE, outline=OUTLINE)
    d.point((lax, lay + 8), fill=SKIN_BASE)
    # White Sword (curved blade)
    d.polygon([(lax - 1, lay + 8), (lax - 10, lay + 4), (lax - 12, lay + 2), (lax - 2, lay + 6)], fill=SWORD_WHITE, outline=OUTLINE)
    d.line([lax - 1, lay + 8, lax + 1, lay + 10], fill=(160, 40, 50, 255), width=2) # Red hilt

    # Right Arm (Bakuya - Black Blade)
    rax = cx + 8 + arm_r[0]
    ray = body_y + 4 + arm_r[1]
    d.rectangle([rax - 2, ray, rax + 2, ray + 7], fill=JACKET_BASE, outline=OUTLINE)
    d.point((rax, ray + 8), fill=SKIN_BASE)
    # Black Sword
    d.polygon([(rax + 1, ray + 8), (rax + 11, ray + 12), (rax + 13, ray + 10), (rax + 2, ray + 6)], fill=SWORD_BLACK, outline=OUTLINE)
    d.line([rax + 1, ray + 8, rax - 1, ray + 10], fill=(160, 40, 50, 255), width=2)

def generate_full_spritesheet():
    sheet = Image.new("RGBA", (SHEET_W, SHEET_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(sheet)

    for r in range(ROWS):
        for c in range(COLS):
            fx = c * FRAME_W
            fy = r * FRAME_H
            cx = fx + FRAME_W // 2
            cy = fy + 38 # baseline

            t = c / (COLS - 1)
            phase = c / COLS

            # ==================================================================
            # ROW 0: IDLE (Breathing, Hair Bob, Blink)
            # ==================================================================
            if r == 0:
                bob = int(math.sin(phase * math.pi * 2) * 2)
                blink = (c == 6) # Blink on frame 6
                draw_base_hero(d, cx, cy, bob_y=bob, eyes_closed=blink)

            # ==================================================================
            # ROW 1: WALK / RUN (Stride Cycle, Lean Forward)
            # ==================================================================
            elif r == 1:
                bob = -int(abs(math.sin(phase * math.pi * 2)) * 4)
                stride = int(math.sin(phase * math.pi * 2) * 5)
                arm_swing = int(math.cos(phase * math.pi * 2) * 4)
                draw_base_hero(d, cx + 2, cy, bob_y=bob, leg_l=(-stride, 0), leg_r=(stride, 0), arm_l=(arm_swing, -2), arm_r=(-arm_swing, 2))

            # ==================================================================
            # ROW 2: JUMP & FALL (Crouch -> Ascend -> Peak -> Descend -> Land)
            # ==================================================================
            elif r == 2:
                if c == 0: # Crouch before jump
                    draw_base_hero(d, cx, cy, crouch=3)
                elif c < 4: # Ascending / Peak
                    air_y = -int(math.sin(c / 3.0 * math.pi * 0.9) * 16)
                    draw_base_hero(d, cx, cy, bob_y=air_y, leg_l=(2, -3), leg_r=(-2, -2), arm_l=(-3, -5), arm_r=(3, -5))
                elif c < 7: # Falling down
                    fall_y = -12 + (c - 4) * 5
                    draw_base_hero(d, cx, cy, bob_y=fall_y, leg_l=(-1, 1), leg_r=(1, 2), arm_l=(-2, -2), arm_r=(2, -2))
                else: # Landing
                    draw_base_hero(d, cx, cy, crouch=2)

            # ==================================================================
            # ROW 3: ATTACK 1 (Quick Horizontal Slash)
            # ==================================================================
            elif r == 3:
                slash_prog = c / (COLS - 1)
                lean = int(slash_prog * 4)
                draw_base_hero(d, cx + lean, cy, arm_l=(-4 + int(slash_prog * 12), -2), arm_r=(4 - int(slash_prog * 8), 0))
                # Slash VFX arc
                if 2 <= c <= 5:
                    arc_x = cx + 8 + (c - 2) * 4
                    arc_y = cy - 2 + (c - 2) * 3
                    d.arc([arc_x - 12, arc_y - 12, arc_x + 12, arc_y + 12], 260, 410, fill=SLASH_WHITE, width=3)
                    d.arc([arc_x - 10, arc_y - 10, arc_x + 10, arc_y + 10], 270, 400, fill=SLASH_CYAN, width=2)

            # ==================================================================
            # ROW 4: ATTACK 2 (360 Spin Whirlwind Slash)
            # ==================================================================
            elif r == 4:
                spin_angle = phase * math.pi * 2
                lean_x = int(math.sin(spin_angle) * 3)
                draw_base_hero(d, cx + lean_x, cy, arm_l=(-int(math.cos(spin_angle) * 8), int(math.sin(spin_angle) * 4)), arm_r=(int(math.cos(spin_angle) * 8), -int(math.sin(spin_angle) * 4)))
                # Radial Circular Slash Wave
                if 2 <= c <= 6:
                    d.ellipse([cx - 24, cy - 14, cx + 24, cy + 18], outline=SLASH_WHITE, width=2)
                    d.ellipse([cx - 21, cy - 12, cx + 21, cy + 16], outline=SLASH_CYAN, width=1)

            # ==================================================================
            # ROW 5: AIR ATTACK (Aerial Downward Dive Slash)
            # ==================================================================
            elif r == 5:
                dive_y = -14 + int(phase * 18)
                draw_base_hero(d, cx + int(phase * 6), cy, bob_y=dive_y, leg_l=(2, -3), leg_r=(-1, -2), arm_l=(2, 6), arm_r=(4, 8))
                # Downward Swoosh trail
                if 1 <= c <= 6:
                    trail_y = cy + dive_y + 4
                    d.polygon([(cx - 2, trail_y - 14), (cx + 8, trail_y + 12), (cx + 12, trail_y + 10), (cx + 2, trail_y - 16)], fill=SLASH_WHITE)
                    d.line([(cx + 8, trail_y + 12), (cx + 16, trail_y + 16)], fill=SLASH_CYAN, width=2)

            # ==================================================================
            # ROW 6: ATTACK 3 (Forward Sliding Thrust / Blade Dash)
            # ==================================================================
            elif r == 6:
                slide_x = int(phase * 12)
                draw_base_hero(d, cx + slide_x, cy, bob_y=2, leg_l=(-6, 1), leg_r=(6, 1), arm_l=(8, -3), arm_r=(10, -1))
                # Forward Thrust Piercing Lines
                if 2 <= c <= 6:
                    d.line([cx + slide_x + 8, cy + 2, cx + slide_x + 28, cy + 2], fill=SLASH_WHITE, width=3)
                    d.line([cx + slide_x + 12, cy - 2, cx + slide_x + 32, cy - 2], fill=SLASH_CYAN, width=2)
                    d.line([cx + slide_x + 12, cy + 6, cx + slide_x + 30, cy + 6], fill=SLASH_CYAN, width=2)

            # ==================================================================
            # ROW 7: ATTACK 4 (Ultimate Heavy Crescent Wave Slash)
            # ==================================================================
            elif r == 7:
                recoil = -int(math.sin(phase * math.pi) * 6)
                draw_base_hero(d, cx + recoil, cy, arm_l=(-6, -4), arm_r=(8, -6))
                # Massive Crescent Moon Energy Wave
                if 2 <= c <= 6:
                    wave_r = 14 + (c - 2) * 5
                    wave_cx = cx + recoil + 16 + (c - 2) * 4
                    d.arc([wave_cx - wave_r, cy - wave_r, wave_cx + wave_r, cy + wave_r], -70, 70, fill=SLASH_WHITE, width=4)
                    d.arc([wave_cx - wave_r - 2, cy - wave_r - 2, wave_cx + wave_r + 2, cy + wave_r + 2], -80, 80, fill=SLASH_CYAN, width=2)
                    # Energy sparks
                    d.point((wave_cx + wave_r - 4, cy - wave_r + 4), fill=(255, 255, 255, 255))
                    d.point((wave_cx + wave_r - 4, cy + wave_r - 4), fill=(255, 255, 255, 255))

            # ==================================================================
            # ROW 8: DEATH (Stagger, Collapse, Lay Flat)
            # ==================================================================
            elif r == 8:
                if c < 2: # Hit stagger
                    draw_base_hero(d, cx - 4, cy, bob_y=1, head_tilt=3, arm_l=(-3, 2), arm_r=(-1, 4))
                elif c < 5: # Falling backward / forward
                    rot_y = cy + (c - 2) * 4
                    draw_base_hero(d, cx - 6 + (c - 2) * 2, rot_y, crouch=(c - 2) * 4, arm_l=(-4, 6), arm_r=(2, 6))
                else: # Lying flat on ground
                    # Ground shadow
                    draw_ground_shadow(d, cx, 58, 18, 4)
                    # Flat hero on floor
                    d.rectangle([cx - 16, 52, cx + 16, 57], fill=JACKET_BASE, outline=OUTLINE)
                    d.rectangle([cx - 14, 50, cx - 4, 55], fill=SKIN_BASE, outline=OUTLINE) # Head flat
                    d.rectangle([cx - 18, 48, cx - 6, 51], fill=HAIR_BASE) # Hair
                    d.rectangle([cx + 4, 53, cx + 18, 57], fill=PANTS_BASE, outline=OUTLINE) # Legs flat
                    # Dropped sword
                    d.line([cx - 2, 58, cx + 8, 58], fill=SWORD_WHITE, width=2)

    target_path = os.path.join(OUTPUT_DIR, "hero_combat_sheet.png")
    sheet.save(target_path)
    print("SUCCESS: Hero Combat Spritesheet generated at:", target_path)

    # Class specific combat sheets
    for cls_name in ["assassin", "fighter", "tank", "gunner"]:
        cls_path = os.path.join(OUTPUT_DIR, f"{cls_name}_combat_sheet.png")
        sheet.save(cls_path)
        print(f"SUCCESS: {cls_name.capitalize()} Combat Spritesheet generated at:", cls_path)

if __name__ == "__main__":
    generate_full_spritesheet()

