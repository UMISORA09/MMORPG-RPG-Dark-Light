#!/usr/bin/env python3
"""
Mô hình nhân vật ảo Validator - Chiến Long Bá (Game2.5D)
Kiểm tra và xác thực chất lượng tệp mô hình 3D (.glb) nhân vật ảo theo tiêu chuẩn dự án.
"""

import sys
import os
import json
import struct

# Đảm bảo UTF-8 khi chạy trên Windows console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

REQUIRED_ANIMATIONS = {"idle", "run", "attack_slash", "skill_cast", "death"}
MAX_FILE_SIZE_MB = 5.0

def parse_glb_header(file_path):
    with open(file_path, "rb") as f:
        # Header: 12 bytes [magic (4 bytes), version (4 bytes), length (4 bytes)]
        header = f.read(12)
        if len(header) < 12:
            return None, "Tệp quá ngắn để là tệp GLB hợp lệ."

        magic, version, length = struct.unpack("<4sII", header)
        if magic != b"glTF":
            return None, f"Tiêu đề không hợp lệ: {magic} (kỳ vọng b'glTF')."

        # Chunk 0: JSON metadata
        chunk_header = f.read(8)
        if len(chunk_header) < 8:
            return None, "Không đọc được thông tin Chunk 0."

        chunk_len, chunk_type = struct.unpack("<II", chunk_header)
        if chunk_type != 0x4E4F534A:  # "JSON"
            return None, f"Chunk 0 không phải dạng JSON (type: {hex(chunk_type)})."

        json_bytes = f.read(chunk_len)
        try:
            gltf_json = json.loads(json_bytes.decode("utf-8"))
        except Exception as e:
            return None, f"Lỗi giải mã JSON chunk: {e}"

        return gltf_json, None

def validate_character_model(file_path):
    print("=" * 70)
    print(f"[KIEM DINH MO HINH NHAN VAT AO]: {os.path.basename(file_path)}")
    print("=" * 70)

    if not os.path.exists(file_path):
        print(f"[ERROR] Khong tim thay tep: {file_path}")
        return False

    size_mb = os.path.getsize(file_path) / (1024 * 1024)
    print(f"[INFO] Dung luong tep: {size_mb:.2f} MB (Gioi han khuyen nghi: {MAX_FILE_SIZE_MB} MB)")

    if size_mb > MAX_FILE_SIZE_MB:
        print(f"[WARN] Dung luong vuot muc khuyen nghi {MAX_FILE_SIZE_MB} MB!")

    gltf, err = parse_glb_header(file_path)
    if err:
        print(f"[ERROR] Loi dinh dang GLB: {err}")
        return False

    # 1. Thống kê Meshes & Nodes
    nodes = gltf.get("nodes", [])
    meshes = gltf.get("meshes", [])
    materials = gltf.get("materials", [])
    skins = gltf.get("skins", [])
    animations = gltf.get("animations", [])

    print(f"[INFO] Nodes: {len(nodes)} | Meshes: {len(meshes)} | Materials: {len(materials)} | Skins: {len(skins)}")

    # 2. Kiểm tra Animations
    found_anims = set()
    for anim in animations:
        name = anim.get("name", "").strip()
        if name:
            found_anims.add(name)

    print(f"[INFO] Animation Clips ({len(found_anims)}): {', '.join(sorted(found_anims)) if found_anims else 'Trong'}")

    missing_anims = REQUIRED_ANIMATIONS - found_anims
    if missing_anims:
        print(f"[WARN] Thieu {len(missing_anims)} animation clip bat buoc:")
        for ma in sorted(missing_anims):
            print(f"    - {ma}")
    else:
        print("[SUCCESS] Day du toan bo 5 animation clips chuan (idle, run, attack_slash, skill_cast, death).")

    # 3. Kiểm tra xương / Skeleton
    if skins:
        joint_count = len(skins[0].get("joints", []))
        print(f"[INFO] Khung xuong (Skeleton): Hop le voi {joint_count} khop xuong (joints).")
    else:
        print("[INFO] Mo hinh dang tinh hoac greybox (khong co SkinnedMesh).")

    print("=" * 70)
    print("[SUCCESS] Kiem dinh hoan tat.")
    return True

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "artifacts/mmorpg-game/public/assets/models/characters/fighter.glb"
    validate_character_model(target)
