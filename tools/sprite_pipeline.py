"""
tools/sprite_pipeline.py
End-to-End 2D Sprite Pipeline & Runtime Animation System
- Smart Background Removal & Anti-Fringing
- Connected Components Island Detection & Auto-Slicing
- Canvas Normalization & Strict Bottom-Center / Center-Center Pivot Locking
- Texture Atlas Packing & JSON Mapping Generation
"""

import os
import json
import math
import numpy as np
from PIL import Image
from scipy.ndimage import label, binary_dilation

def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

def remove_background(img_np, bg_color=None, tolerance=35, is_vfx=False, anti_fringe=True):
    """
    Tách nền thông minh và khử viền màu (Anti-Fringing).
    img_np: numpy array RGBA
    """
    h, w, c = img_np.shape
    r = img_np[:, :, 0].astype(np.float32)
    g = img_np[:, :, 1].astype(np.float32)
    b = img_np[:, :, 2].astype(np.float32)
    a = img_np[:, :, 3].astype(np.float32)

    if bg_color is None:
        # Lấy mẫu tại góc (0,0)
        bg_color = (img_np[0, 0, 0], img_np[0, 0, 1], img_np[0, 0, 2])

    bg_r, bg_g, bg_b = bg_color

    if is_vfx and bg_color == (0, 0, 0):
        # Chế độ VFX nền đen: Chuyển độ sáng Luminance thành Alpha
        lum = 0.299 * r + 0.587 * g + 0.114 * b
        new_a = np.clip(lum * 1.5, 0, 255).astype(np.uint8)
        # Giữ nguyên pixel sáng, pixel tối chuyển sang trong suốt
        result = img_np.copy()
        result[:, :, 3] = new_a
        return result

    # Tính khoảng cách Euclidean màu
    dist = np.sqrt((r - bg_r)**2 + (g - bg_g)**2 + (b - bg_b)**2)
    mask_bg = dist <= tolerance

    result = img_np.copy()
    result[mask_bg, 3] = 0

    if anti_fringe:
        # Khử viền lem màu nền vào outline
        # Nếu màu nền là Xanh lá lá (#00FF00), giảm G ở các pixel gần biên
        mask_fg = result[:, :, 3] > 0
        if bg_color == (0, 255, 0): # Green chroma
            fringe_g = (g > r) & (g > b) & mask_fg
            result[fringe_g, 1] = np.maximum(r[fringe_g], b[fringe_g])
        elif bg_color == (255, 0, 255): # Magenta chroma
            fringe_m = (r > g) & (b > g) & mask_fg
            avg = ((r + b) / 2.0).astype(np.uint8)
            result[fringe_m, 0] = np.minimum(result[fringe_m, 0], avg[fringe_m])
            result[fringe_m, 2] = np.minimum(result[fringe_m, 2], avg[fringe_m])

    return result

def auto_slice_islands(img_rgba, min_area=36, dilation_iter=4, row_tolerance=20):
    """
    Phát hiện các đảo pixel (Connected Components) kết hợp binary_dilation
    để không làm rơi vũ khí hoặc hiệu ứng bay rời.
    Sắp xếp thứ tự theo Row-Major (trên xuống dưới, trái qua phải).
    """
    alpha = img_rgba[:, :, 3]
    binary_mask = alpha > 10

    # Dilation để nối các bộ phận tách rời (như kiếm vung ra ngoài)
    struct = np.ones((3, 3), dtype=bool)
    dilated_mask = binary_dilation(binary_mask, structure=struct, iterations=dilation_iter)

    labeled_array, num_features = label(dilated_mask)
    boxes = []

    for idx in range(1, num_features + 1):
        comp = (labeled_array == idx)
        area = np.sum(binary_mask & comp)
        if area < min_area:
            continue

        # Lấy bounding box dựa trên mask thực tế (không phải mask dilation)
        fg_indices = np.where(binary_mask & comp)
        if len(fg_indices[0]) == 0:
            continue

        min_y = np.min(fg_indices[0])
        max_y = np.max(fg_indices[0]) + 1
        min_x = np.min(fg_indices[1])
        max_x = np.max(fg_indices[1]) + 1

        boxes.append({
            "min_x": int(min_x),
            "max_x": int(max_x),
            "min_y": int(min_y),
            "max_y": int(max_y),
            "w": int(max_x - min_x),
            "h": int(max_y - min_y),
            "cx": float(min_x + max_x) / 2.0,
            "cy": float(min_y + max_y) / 2.0,
        })

    if not boxes:
        return []

    # Sắp xếp Row-Major
    # 1. Nhóm các box có cy gần nhau (trong khoảng row_tolerance)
    boxes.sort(key=lambda b: b["cy"])
    rows = []
    current_row = [boxes[0]]

    for b in boxes[1:]:
        row_avg_y = sum(x["cy"] for x in current_row) / len(current_row)
        if abs(b["cy"] - row_avg_y) <= row_tolerance:
            current_row.append(b)
        else:
            current_row.sort(key=lambda x: x["min_x"])
            rows.append(current_row)
            current_row = [b]

    current_row.sort(key=lambda x: x["min_x"])
    rows.append(current_row)

    sorted_boxes = []
    for r in rows:
        sorted_boxes.extend(r)

    return sorted_boxes

def normalize_frames(img_rgba, boxes, kind="character", padding=4):
    """
    Đưa mọi frame vào canvas đồng nhất (max_w + pad*2, max_h + pad*2)
    character: căn giữa X, dán sát đáy Y (Pivot 0.5, 1.0)
    vfx: căn giữa X, căn giữa Y (Pivot 0.5, 0.5)
    """
    max_w = max(b["w"] for b in boxes)
    max_h = max(b["h"] for b in boxes)
    canvas_w = max_w + padding * 2
    canvas_h = max_h + padding * 2

    # Đảm bảo canvas là số chẵn
    if canvas_w % 2 != 0: canvas_w += 1
    if canvas_h % 2 != 0: canvas_h += 1

    normalized_imgs = []

    for b in boxes:
        cropped = img_rgba[b["min_y"]:b["max_y"], b["min_x"]:b["max_x"]]
        frame_canvas = np.zeros((canvas_h, canvas_w, 4), dtype=np.uint8)

        sw = b["w"]
        sh = b["h"]

        if kind == "character":
            # Strict Bottom-Center Pivot (0.5, 1.0)
            target_x = (canvas_w - sw) // 2
            target_y = canvas_h - padding - sh
            pivot = {"x": 0.5, "y": 1.0}
        else:
            # VFX Center-Center Pivot (0.5, 0.5)
            target_x = (canvas_w - sw) // 2
            target_y = (canvas_h - sh) // 2
            pivot = {"x": 0.5, "y": 0.5}

        frame_canvas[target_y:target_y + sh, target_x:target_x + sw] = cropped
        normalized_imgs.append({
            "img": frame_canvas,
            "pivot": pivot,
            "orig_box": b
        })

    return normalized_imgs, canvas_w, canvas_h

def pack_atlas(frame_entries, max_atlas_width=1024):
    """
    Đóng gói tất cả frame_entries vào 1 texture atlas duy nhất
    """
    total_frames = len(frame_entries)
    if total_frames == 0:
        return None, {}

    # Lấy kích thước frame lớn nhất
    max_fw = max(e["w"] for e in frame_entries)
    max_fh = max(e["h"] for e in frame_entries)

    cols = max_atlas_width // max_fw
    if cols < 1: cols = 1
    rows = math.ceil(total_frames / cols)

    atlas_w = cols * max_fw
    atlas_h = rows * max_fh

    # Lũy thừa 2 (Power of Two) nếu cần, hoặc giữ gọn
    atlas_img = np.zeros((atlas_h, atlas_w, 4), dtype=np.uint8)
    mapping_frames = {}

    for idx, entry in enumerate(frame_entries):
        r = idx // cols
        c = idx % cols
        x = c * max_fw
        y = r * max_fh

        fw = entry["w"]
        fh = entry["h"]

        atlas_img[y:y + fh, x:x + fw] = entry["img"]

        mapping_frames[entry["name"]] = {
            "frame": {"x": int(x), "y": int(y), "w": int(fw), "h": int(fh)},
            "pivot": entry["pivot"],
            "hitbox": entry.get("hitbox", {"x": 0, "y": 0, "w": 0, "h": 0, "active": False})
        }

    return atlas_img, mapping_frames, atlas_w, atlas_h

def process_pipeline():
    base_dir = os.path.dirname(os.path.dirname(__file__))
    raw_dir = os.path.join(base_dir, "raw_ai_sprites")
    export_dir = os.path.join(base_dir, "assets", "exported")
    ensure_dir(export_dir)

    print("=== STARTING 2D PIXEL CHIBI SPRITE PIPELINE ===")

    all_packed_entries = []

    # 1. Xử lý Chibi Knight
    knight_path = os.path.join(raw_dir, "chibi_knight_raw.png")
    if os.path.exists(knight_path):
        print("-> Processing chibi_knight_raw.png ...")
        k_img = np.array(Image.open(knight_path).convert("RGBA"))
        k_clean = remove_background(k_img, bg_color=(0, 255, 0), tolerance=40, is_vfx=False)
        k_boxes = auto_slice_islands(k_clean, min_area=40, dilation_iter=4, row_tolerance=24)
        k_norm, kw, kh = normalize_frames(k_clean, k_boxes, kind="character", padding=4)

        # Gán tên cho từng animation (4 idle, 6 run, 4 attack)
        names = (
            [f"knight_idle_{i}" for i in range(4)] +
            [f"knight_run_{i}" for i in range(6)] +
            [f"knight_attack_{i}" for i in range(4)]
        )

        for i, entry in enumerate(k_norm):
            name = names[i] if i < len(names) else f"knight_frame_{i}"
            hitbox = {"x": 0, "y": 0, "w": 0, "h": 0, "active": False}
            if name == "knight_attack_2":
                # Kích hoạt hitbox kiếm khi chém mạnh nhất
                hitbox = {"x": 26, "y": -36, "w": 38, "h": 32, "active": True}

            all_packed_entries.append({
                "name": name,
                "img": entry["img"],
                "w": kw, "h": kh,
                "pivot": entry["pivot"],
                "hitbox": hitbox
            })
        print(f"   [OK] Knight processed: {len(k_norm)} frames ({kw}x{kh})")

    # 2. Xử lý Slime Oni Monster
    slime_path = os.path.join(raw_dir, "slime_oni_monster_raw.png")
    if os.path.exists(slime_path):
        print("-> Processing slime_oni_monster_raw.png ...")
        s_img = np.array(Image.open(slime_path).convert("RGBA"))
        s_clean = remove_background(s_img, bg_color=(255, 0, 255), tolerance=40, is_vfx=False)
        s_boxes = auto_slice_islands(s_clean, min_area=30, dilation_iter=4, row_tolerance=24)
        s_norm, sw, sh = normalize_frames(s_clean, s_boxes, kind="character", padding=4)

        names = (
            [f"slime_idle_{i}" for i in range(4)] +
            [f"slime_hit_{i}" for i in range(2)] +
            [f"slime_die_{i}" for i in range(4)]
        )

        for i, entry in enumerate(s_norm):
            name = names[i] if i < len(names) else f"slime_frame_{i}"
            all_packed_entries.append({
                "name": name,
                "img": entry["img"],
                "w": sw, "h": sh,
                "pivot": entry["pivot"],
                "hitbox": {"x": -16, "y": -28, "w": 32, "h": 28, "active": False}
            })
        print(f"   [OK] Slime processed: {len(s_norm)} frames ({sw}x{sh})")

    # 3. Xử lý Anime Slash VFX
    vfx_path = os.path.join(raw_dir, "anime_slash_vfx_raw.png")
    if os.path.exists(vfx_path):
        print("-> Processing anime_slash_vfx_raw.png ...")
        v_img = np.array(Image.open(vfx_path).convert("RGBA"))
        v_clean = remove_background(v_img, bg_color=(0, 0, 0), tolerance=15, is_vfx=True)
        v_boxes = auto_slice_islands(v_clean, min_area=6, dilation_iter=4, row_tolerance=20)
        v_norm, vw, vh = normalize_frames(v_clean, v_boxes, kind="vfx", padding=4)

        names = [f"slash_vfx_{i}" for i in range(len(v_norm))]

        for i, entry in enumerate(v_norm):
            name = names[i]
            all_packed_entries.append({
                "name": name,
                "img": entry["img"],
                "w": vw, "h": vh,
                "pivot": entry["pivot"],
                "hitbox": {"x": 0, "y": 0, "w": 0, "h": 0, "active": False}
            })
        print(f"   [OK] VFX processed: {len(v_norm)} frames ({vw}x{vh})")

    # Đóng gói Texture Atlas & Xuất Mapping JSON
    atlas_img, frames_dict, atlas_w, atlas_h = pack_atlas(all_packed_entries, max_atlas_width=512)

    atlas_output_path = os.path.join(export_dir, "atlas.png")
    mapping_output_path = os.path.join(export_dir, "mapping.json")

    # Lưu atlas.png bằng Pillow với Nearest Neighbor
    Image.fromarray(atlas_img).save(atlas_output_path, "PNG")

    # Chuẩn bị cấu trúc mapping.json chuẩn theo tài liệu taonhanvat.md
    mapping_data = {
        "meta": {
            "image": "atlas.png",
            "style": "pixel_chibi",
            "scale_mode": "NEAREST",
            "size": {"w": int(atlas_w), "h": int(atlas_h)}
        },
        "frames": frames_dict,
        "animations": {
            "knight_idle": {
                "frames": [f"knight_idle_{i}" for i in range(4)],
                "fps": 8,
                "loop": True
            },
            "knight_run": {
                "frames": [f"knight_run_{i}" for i in range(6)],
                "fps": 12,
                "loop": True
            },
            "knight_attack": {
                "frames": [f"knight_attack_{i}" for i in range(4)],
                "fps": 14,
                "loop": False,
                "events": [
                    {
                        "frame_index": 2,
                        "action": "spawn_vfx",
                        "vfx_id": "slash_anime_01",
                        "offset": {"x": 28, "y": -24}
                    }
                ]
            },
            "slime_idle": {
                "frames": [f"slime_idle_{i}" for i in range(4)],
                "fps": 6,
                "loop": True
            },
            "slime_hit": {
                "frames": [f"slime_hit_{i}" for i in range(2)],
                "fps": 8,
                "loop": False
            },
            "slime_die": {
                "frames": [f"slime_die_{i}" for i in range(4)],
                "fps": 8,
                "loop": False
            },
            "slash_anime_01": {
                "frames": [f"slash_vfx_{i}" for i in range(6)],
                "fps": 18,
                "loop": False,
                "blend_mode": "additive"
            }
        }
    }

    with open(mapping_output_path, "w", encoding="utf-8") as f:
        json.dump(mapping_data, f, indent=2, ensure_ascii=False)

    print(f"[OK] Atlas saved to: {atlas_output_path} ({atlas_w}x{atlas_h})")
    print(f"[OK] Mapping JSON saved to: {mapping_output_path}")
    print("=== PIPELINE EXECUTION COMPLETED SUCCESSFULLY ===")

if __name__ == "__main__":
    process_pipeline()
