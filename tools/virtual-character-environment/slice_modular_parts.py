#!/usr/bin/env python3
"""
Tách từng bộ phận nhân vật Pixel Art thành các Layer / Part Sprites độc lập
để phục vụ rigging và tạo hoạt ảnh (Skeletal / Cutout / Puppet 2D & 2.5D Animation).
"""

import os
import sys
import json
from PIL import Image, ImageDraw

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

OUTPUT_DIR = "artifacts/mmorpg-game/public/assets/character-environment/modular-parts"

# Hierarchy definition & Pivot points normalized from 0.0 to 1.0
MODULAR_PARTS_SPEC = {
    "system": "ChienLongBa-Modular-Pixel-Animation-Rig",
    "version": "1.0.0",
    "canvasSize": [360, 360],
    "hierarchy": {
        "root": {
            "name": "Gốc Trọng Tâm (Root)",
            "pivot": [0.5, 0.95],
            "children": ["hips"]
        },
        "hips": {
            "name": "Khung Chậu & Thắt Lưng Rồng (Hips)",
            "pivot": [0.5, 0.65],
            "bbox": [130, 210, 230, 255],
            "children": ["torso", "leg_left_thigh", "leg_right_thigh"]
        },
        "torso": {
            "name": "Thân & Giáp Ngực (Torso)",
            "pivot": [0.5, 0.85],
            "bbox": [120, 140, 240, 215],
            "children": ["abs", "head", "arm_left_upper", "arm_right_upper", "scarf"]
        },
        "abs": {
            "name": "Cơ Bụng 6 Múi / Eo Chữ S (Abs Layer)",
            "pivot": [0.5, 0.5],
            "bbox": [140, 175, 220, 225],
            "children": []
        },
        "head": {
            "name": "Đầu, Mặt Anime & Mắt (Head)",
            "pivot": [0.5, 0.92],
            "bbox": [135, 75, 225, 145],
            "children": ["hair_spikes", "helmet_horns"]
        },
        "hair_spikes": {
            "name": "Mái Tóc Gai Nhiều Tầng (Spiky Hair Layer)",
            "pivot": [0.5, 0.8],
            "bbox": [115, 30, 245, 125],
            "children": []
        },
        "arm_left_upper": {
            "name": "Bắp Tay & Giáp Vai Trái (Left Shoulder/Upper Arm)",
            "pivot": [0.75, 0.2],
            "bbox": [85, 140, 135, 195],
            "children": ["arm_left_forearm"]
        },
        "arm_left_forearm": {
            "name": "Cẳng Tay & Bàn Tay Trái (Left Forearm/Hand)",
            "pivot": [0.5, 0.15],
            "bbox": [70, 185, 125, 250],
            "children": ["offhand_weapon"]
        },
        "arm_right_upper": {
            "name": "Bắp Tay & Giáp Vai Phải (Right Shoulder/Upper Arm)",
            "pivot": [0.25, 0.2],
            "bbox": [225, 140, 275, 195],
            "children": ["arm_right_forearm"]
        },
        "arm_right_forearm": {
            "name": "Cẳng Tay & Bàn Tay Phải (Right Forearm/Hand)",
            "pivot": [0.5, 0.15],
            "bbox": [235, 185, 290, 250],
            "children": ["main_weapon"]
        },
        "main_weapon": {
            "name": "Binh Khí Chính: Thanh Long Đại Kiếm / Súng Plasma",
            "pivot": [0.35, 0.85],
            "bbox": [245, 50, 345, 260],
            "children": []
        },
        "offhand_weapon": {
            "name": "Binh Khí Phụ: Khiên Tháp Hắc Kim / Song Đao",
            "pivot": [0.65, 0.5],
            "bbox": [40, 170, 120, 275],
            "children": []
        },
        "leg_left_thigh": {
            "name": "Bắp Đùi Trái (Left Thigh)",
            "pivot": [0.5, 0.15],
            "bbox": [135, 245, 180, 295],
            "children": ["leg_left_foot"]
        },
        "leg_left_foot": {
            "name": "Cẳng Chân & Bốt Trái (Left Shin/Boot)",
            "pivot": [0.5, 0.15],
            "bbox": [130, 285, 180, 350],
            "children": []
        },
        "leg_right_thigh": {
            "name": "Bắp Đùi Phải (Right Thigh)",
            "pivot": [0.5, 0.15],
            "bbox": [180, 245, 225, 295],
            "children": ["leg_right_foot"]
        },
        "leg_right_foot": {
            "name": "Cẳng Chân & Bốt Phải (Right Shin/Boot)",
            "pivot": [0.5, 0.15],
            "bbox": [180, 285, 230, 350],
            "children": []
        },
        "scarf": {
            "name": "Khăn Quàng Xanh / Áo Choàng Bay (Scarf/Cape)",
            "pivot": [0.5, 0.1],
            "bbox": [140, 130, 220, 220],
            "children": []
        }
    }
}

def generate_modular_slices():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Write manifest JSON
    manifest_path = os.path.join(OUTPUT_DIR, "modular_parts_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(MODULAR_PARTS_SPEC, f, ensure_ascii=False, indent=2)
    print(f"[SUCCESS] Da tao dac ta khop xuong: {manifest_path}")

    # Generate sample sliced part images from existing fighter_male.png if present
    base_src = "artifacts/mmorpg-game/public/assets/characters/fighter_male.png"
    if os.path.exists(base_src):
        src_img = Image.open(base_src).convert("RGBA")
        w, h = src_img.size

        parts = MODULAR_PARTS_SPEC["hierarchy"]
        for part_key, part_data in parts.items():
            if "bbox" not in part_data:
                continue

            x1, y1, x2, y2 = part_data["bbox"]
            part_canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
            crop_box = src_img.crop((x1, y1, x2, y2))
            part_canvas.paste(crop_box, (x1, y1))

            part_filename = f"part_{part_key}.png"
            part_canvas.save(os.path.join(OUTPUT_DIR, part_filename))
        print(f"[SUCCESS] Da tach {len(parts)} bo phan roi vao thu muc: {OUTPUT_DIR}")
    else:
        print("[WARN] Khong tim thay tep goc de tach anh crop.")

if __name__ == "__main__":
    generate_modular_slices()

