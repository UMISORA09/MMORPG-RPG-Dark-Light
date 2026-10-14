"""
tools/dummy_ai_generator.py
Tạo 3 Sprite Sheet thô giả lập đầu ra của AI với phong cách Pixel Art Chibi:
1. raw_ai_sprites/chibi_knight_raw.png (Nền #00FF00)
2. raw_ai_sprites/slime_oni_monster_raw.png (Nền #FF00FF)
3. raw_ai_sprites/anime_slash_vfx_raw.png (Nền #000000)
"""

import os
from PIL import Image, ImageDraw

def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

def create_chibi_knight_sheet(output_path):
    # Kích thước mỗi cell ~ 64x64, 3 hàng:
    # Hàng 0: Idle (4 frames)
    # Hàng 1: Run (6 frames)
    # Hàng 2: Attack (4 frames)
    cols = 6
    rows = 3
    cell_w, cell_h = 64, 64
    img = Image.new("RGBA", (cols * cell_w, rows * cell_h), (0, 255, 0, 255)) # Chroma #00FF00
    draw = ImageDraw.Draw(img)

    # Palette
    outline = (25, 20, 35, 255)
    skin = (255, 215, 175, 255)
    hair = (50, 90, 160, 255)
    armor = (190, 205, 225, 255)
    armor_dark = (120, 140, 170, 255)
    cape = (210, 50, 60, 255)
    sword_blade = (240, 245, 255, 255)
    sword_gold = (245, 190, 40, 255)
    eye = (30, 40, 70, 255)

    def draw_knight(cx, cy, frame_type, step):
        # cx, cy là tâm dưới đất của nhân vật (ground pivot)
        # Cố tình cộng thêm chút jitter ngẫu nhiên để test auto-slicing và pivot normalization
        jitter_x = (step % 2) - 1
        jitter_y = ((step + 1) % 2)
        bx = cx + jitter_x
        by = cy + jitter_y

        # Bobbing
        bob = 0
        if frame_type == "idle":
            bob = 1 if step in (1, 2) else 0
        elif frame_type == "run":
            bob = -2 if step in (1, 4) else (1 if step in (0, 3) else 0)

        # Chân (Legs)
        foot_y = by - 2
        if frame_type == "run":
            leg_offsets = [(-5, 0, 5, -3), (-6, -2, 4, 0), (-2, 0, 2, 0), (4, -3, -5, 0), (6, -1, -4, 0), (2, 0, -2, 0)]
            lx1, ly1, lx2, ly2 = leg_offsets[step % 6]
            draw.rectangle([bx + lx1 - 2, foot_y + ly1 - 6, bx + lx1 + 2, foot_y + ly1], fill=armor_dark, outline=outline)
            draw.rectangle([bx + lx2 - 2, foot_y + ly2 - 6, bx + lx2 + 2, foot_y + ly2], fill=armor_dark, outline=outline)
        else:
            draw.rectangle([bx - 6, foot_y - 6, bx - 2, foot_y], fill=armor_dark, outline=outline)
            draw.rectangle([bx + 2, foot_y - 6, bx + 6, foot_y], fill=armor_dark, outline=outline)

        # Áo choàng sau (Cape back)
        draw.polygon([(bx - 7, by - 16 + bob), (bx + 7, by - 16 + bob), (bx + 10, by - 3), (bx - 10, by - 3)], fill=cape, outline=outline)

        # Thân giáp Chibi nhỏ (Body)
        draw.rectangle([bx - 7, by - 18 + bob, bx + 7, by - 6 + bob], fill=armor, outline=outline)
        draw.rectangle([bx - 3, by - 16 + bob, bx + 3, by - 8 + bob], fill=armor_dark)

        # Đầu Chibi to (Tỷ lệ 2.5 đầu: Chiều cao đầu ~ 20px)
        head_top = by - 38 + bob
        draw.rectangle([bx - 12, head_top, bx + 12, head_top + 18], fill=skin, outline=outline)
        # Mũ giáp / Tóc Anime
        draw.rectangle([bx - 13, head_top - 2, bx + 13, head_top + 7], fill=hair, outline=outline)
        # Mái tóc rủ
        draw.polygon([(bx - 10, head_top + 6), (bx - 7, head_top + 12), (bx - 4, head_top + 6)], fill=hair)
        draw.polygon([(bx - 3, head_top + 6), (bx, head_top + 13), (bx + 3, head_top + 6)], fill=hair)
        draw.polygon([(bx + 4, head_top + 6), (bx + 7, head_top + 12), (bx + 10, head_top + 6)], fill=hair)

        # Mắt to kiểu Chibi Anime
        draw.rectangle([bx - 9, head_top + 9, bx - 5, head_top + 15], fill=eye)
        draw.rectangle([bx - 8, head_top + 9, bx - 6, head_top + 11], fill=(255, 255, 255, 255)) # highlight
        draw.rectangle([bx + 5, head_top + 9, bx + 9, head_top + 15], fill=eye)
        draw.rectangle([bx + 6, head_top + 9, bx + 8, head_top + 11], fill=(255, 255, 255, 255))
        # Má hồng
        draw.rectangle([bx - 10, head_top + 15, bx - 7, head_top + 16], fill=(255, 150, 150, 255))
        draw.rectangle([bx + 7, head_top + 15, bx + 10, head_top + 16], fill=(255, 150, 150, 255))

        # Đại kiếm (Sword)
        if frame_type == "attack":
            if step == 0: # Wind up
                draw.rectangle([bx - 20, by - 28, bx - 16, by - 6], fill=sword_blade, outline=outline)
                draw.rectangle([bx - 22, by - 6, bx - 14, by - 4], fill=sword_gold, outline=outline)
            elif step == 1: # Pre-slash raised high
                draw.rectangle([bx - 5, by - 48, bx + 5, by - 24], fill=sword_blade, outline=outline)
                draw.rectangle([bx - 8, by - 24, bx + 8, by - 21], fill=sword_gold, outline=outline)
            elif step == 2: # Massive forward swing
                draw.rectangle([bx + 8, by - 24, bx + 28, by - 14], fill=sword_blade, outline=outline)
                draw.rectangle([bx + 6, by - 26, bx + 10, by - 12], fill=sword_gold, outline=outline)
                # Tia chém nhỏ gắn liền
                draw.line([(bx + 28, by - 28), (bx + 31, by - 12)], fill=(200, 240, 255, 255), width=2)
            elif step == 3: # Recovery
                draw.rectangle([bx + 10, by - 14, bx + 22, by - 2], fill=sword_blade, outline=outline)
                draw.rectangle([bx + 8, by - 16, bx + 14, by - 14], fill=sword_gold, outline=outline)
        else:
            # Idle/Run: Cầm kiếm bên hông
            draw.rectangle([bx + 8, by - 26 + bob, bx + 13, by - 8 + bob], fill=sword_blade, outline=outline)
            draw.rectangle([bx + 6, by - 8 + bob, bx + 15, by - 6 + bob], fill=sword_gold, outline=outline)
            draw.rectangle([bx + 9, by - 6 + bob, bx + 12, by - 2 + bob], fill=armor_dark)

    # Row 0: Idle (4 frames)
    for i in range(4):
        draw_knight(i * cell_w + 32, 54, "idle", i)

    # Row 1: Run (6 frames)
    for i in range(6):
        draw_knight(i * cell_w + 32, cell_h + 54, "run", i)

    # Row 2: Attack (4 frames)
    for i in range(4):
        draw_knight(i * cell_w + 32, cell_h * 2 + 54, "attack", i)

    img.save(output_path, "PNG")
    print(f"Created {output_path}")

def create_slime_oni_sheet(output_path):
    cols = 4
    rows = 3
    cell_w, cell_h = 64, 64
    img = Image.new("RGBA", (cols * cell_w, rows * cell_h), (255, 0, 255, 255)) # Chroma #FF00FF
    draw = ImageDraw.Draw(img)

    outline = (25, 10, 30, 255)
    body_main = (160, 45, 220, 255)
    body_light = (205, 95, 255, 255)
    body_core = (100, 20, 150, 255)
    horn_gold = (255, 200, 40, 255)
    eye_red = (255, 50, 50, 255)

    def draw_slime(cx, cy, anim, step):
        bx = cx + (step % 2) - 1
        by = cy

        if anim == "idle":
            # Squash & stretch
            sq_w = [18, 20, 17, 19][step]
            sq_h = [14, 12, 16, 13][step]
            draw.ellipse([bx - sq_w, by - sq_h * 2, bx + sq_w, by], fill=body_main, outline=outline, width=2)
            draw.ellipse([bx - sq_w + 4, by - sq_h * 2 + 3, bx + sq_w - 4, by - 6], fill=body_light)
            # Oni Horn
            draw.polygon([(bx - 3, by - sq_h * 2 - 2), (bx, by - sq_h * 2 - 12), (bx + 3, by - sq_h * 2 - 2)], fill=horn_gold, outline=outline)
            # Eyes
            draw.rectangle([bx - 8, by - sq_h - 2, bx - 4, by - sq_h + 3], fill=eye_red)
            draw.rectangle([bx + 4, by - sq_h - 2, bx + 8, by - sq_h + 3], fill=eye_red)

        elif anim == "hit":
            # Knockback and flash
            flash_color = (255, 255, 255, 255) if step == 0 else (240, 100, 100, 255)
            bx += -4 if step == 0 else -8
            draw.ellipse([bx - 17, by - 26, bx + 19, by - 2], fill=flash_color, outline=outline, width=2)
            draw.polygon([(bx - 6, by - 28), (bx - 3, by - 38), (bx, by - 28)], fill=horn_gold, outline=outline)
            # Hurt eyes (X X)
            draw.line([(bx - 8, by - 16), (bx - 4, by - 12)], fill=outline, width=2)
            draw.line([(bx - 8, by - 12), (bx - 4, by - 16)], fill=outline, width=2)
            draw.line([(bx + 4, by - 16), (bx + 8, by - 12)], fill=outline, width=2)
            draw.line([(bx + 4, by - 12), (bx + 8, by - 16)], fill=outline, width=2)

        elif anim == "die":
            # Melting & disappearing
            scale_h = [12, 8, 4, 2][step]
            scale_w = [18, 22, 24, 16][step]
            alpha_color = [(160, 45, 220, 255), (140, 40, 190, 220), (100, 30, 140, 150), (60, 20, 90, 80)][step]
            draw.ellipse([bx - scale_w, by - scale_h * 2, bx + scale_w, by], fill=alpha_color, outline=outline if step < 3 else None)
            # Dissolving smoke particles
            for p in range(step * 3):
                px = bx + (p * 7 % 24) - 12
                py = by - 10 - (p * 5)
                draw.rectangle([px, py, px + 2, py + 2], fill=(220, 140, 255, 200))

    # Row 0: Idle (4 frames)
    for i in range(4):
        draw_slime(i * cell_w + 32, 56, "idle", i)

    # Row 1: Hit (2 frames)
    for i in range(2):
        draw_slime(i * cell_w + 32, cell_h + 56, "hit", i)

    # Row 2: Die (4 frames)
    for i in range(4):
        draw_slime(i * cell_w + 32, cell_h * 2 + 56, "die", i)

    img.save(output_path, "PNG")
    print(f"Created {output_path}")

def create_anime_slash_sheet(output_path):
    cols = 6
    rows = 1
    cell_w, cell_h = 64, 64
    img = Image.new("RGBA", (cols * cell_w, rows * cell_h), (0, 0, 0, 255)) # Black #000000 for Additive VFX
    draw = ImageDraw.Draw(img)

    neon_cyan = (50, 230, 255, 255)
    neon_purple = (190, 60, 255, 255)
    white_core = (255, 255, 255, 255)

    for i in range(6):
        cx = i * cell_w + 32
        cy = 32

        if i == 0:
            # Frame 0: Spark
            draw.line([(cx - 8, cy), (cx + 8, cy)], fill=neon_cyan, width=2)
            draw.line([(cx, cy - 8), (cx, cy + 8)], fill=neon_purple, width=2)
            draw.rectangle([cx - 2, cy - 2, cx + 2, cy + 2], fill=white_core)
        elif i == 1:
            # Frame 1: Crescent forming
            draw.arc([cx - 18, cy - 20, cx + 18, cy + 20], start=30, end=170, fill=neon_cyan, width=4)
            draw.arc([cx - 16, cy - 18, cx + 16, cy + 18], start=40, end=160, fill=white_core, width=2)
        elif i == 2:
            # Frame 2: Massive explosive arc
            draw.arc([cx - 26, cy - 28, cx + 26, cy + 28], start=10, end=190, fill=neon_purple, width=6)
            draw.arc([cx - 24, cy - 26, cx + 24, cy + 26], start=20, end=180, fill=neon_cyan, width=4)
            draw.arc([cx - 22, cy - 24, cx + 22, cy + 24], start=30, end=170, fill=white_core, width=2)
        elif i == 3:
            # Frame 3: Peak wide slash with energy burst
            draw.arc([cx - 28, cy - 28, cx + 28, cy + 28], start=0, end=210, fill=neon_cyan, width=5)
            draw.arc([cx - 25, cy - 25, cx + 25, cy + 25], start=25, end=185, fill=white_core, width=3)
            # Sparkles
            draw.point([(cx + 20, cy - 14), (cx - 18, cy + 16), (cx + 12, cy + 22)], fill=white_core)
        elif i == 4:
            # Frame 4: Dispersing into pixel particles
            draw.arc([cx - 24, cy - 24, cx + 24, cy + 24], start=40, end=160, fill=neon_purple, width=2)
            for s in range(8):
                sx = cx + (s * 7 % 36) - 18
                sy = cy + (s * 5 % 30) - 15
                draw.rectangle([sx, sy, sx + 2, sy + 2], fill=neon_cyan)
        elif i == 5:
            # Frame 5: Fading sparkles
            for s in range(5):
                sx = cx + (s * 9 % 30) - 15
                sy = cy + (s * 7 % 26) - 13
                draw.point([(sx, sy), (sx + 1, sy)], fill=neon_purple)

    img.save(output_path, "PNG")
    print(f"Created {output_path}")

def main():
    target_dir = os.path.join(os.path.dirname(__file__), "..", "raw_ai_sprites")
    ensure_dir(target_dir)

    create_chibi_knight_sheet(os.path.join(target_dir, "chibi_knight_raw.png"))
    create_slime_oni_sheet(os.path.join(target_dir, "slime_oni_monster_raw.png"))
    create_anime_slash_sheet(os.path.join(target_dir, "anime_slash_vfx_raw.png"))
    print("[OK] Dummy AI Sprites Generated Successfully!")

if __name__ == "__main__":
    main()
