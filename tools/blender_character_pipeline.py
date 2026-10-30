#!/usr/bin/env python3
"""
=============================================================================
CHIẾN LONG BÁ MMORPG — BLENDER 3D CHARACTER PIPELINE & EXPORTER TOOLKIT
Quy chuẩn tích hợp mô hình nhân vật 3D từ Blender vào WebGL / Three.js
=============================================================================
Hướng dẫn sử dụng:
1. Mở Blender (3.3 LTS hoặc 4.x trở lên).
2. Chuyển sang thẻ Text Editor, mở tệp này hoặc chạy trực tiếp bằng lệnh:
   blender --background --python tools/blender_character_pipeline.py -- --class fighter
3. Hoặc bấm "Run Script" trong Blender để tự động sinh Armature, Sockets và xuất GLB.
"""

import sys
import os
import json
import math

try:
    import bpy
    import mathutils
    IN_BLENDER = True
except ImportError:
    IN_BLENDER = False

# Budget thresholds
MAX_TRIANGLES = 25000
MAX_VERTICES = 20000
MAX_FILE_SIZE_MB = 5.0
STANDARD_ANIMATIONS = ["idle", "run", "attack_slash", "skill_cast", "death"]
STANDARD_SOCKETS = ["weapon_slot", "shield_slot", "head_socket", "back_socket"]

def create_chien_long_ba_armature():
    """Tự động dựng khung xương Humanoid chuẩn cho Chiến Long Bá trong Blender"""
    if not IN_BLENDER:
        print("[Error] Hàm này phải được chạy bên trong môi trường Blender!")
        return None

    # Tạo Armature data & object
    armature_data = bpy.data.armatures.new(name="CLB_Humanoid_Rig")
    armature_obj = bpy.data.objects.new(name="Armature", object_data=armature_data)
    bpy.context.collection.objects.link(armature_obj)
    bpy.context.view_layer.objects.active = armature_obj
    bpy.ops.object.mode_set(mode='EDIT')

    edit_bones = armature_data.edit_bones

    # 1. Root & Spine chain
    root = edit_bones.new('Root')
    root.head = (0, 0, 0)
    root.tail = (0, 0, 0.15)

    hips = edit_bones.new('Hips')
    hips.parent = root
    hips.head = (0, 0, 0.95)
    hips.tail = (0, 0, 1.1)

    spine = edit_bones.new('Spine')
    spine.parent = hips
    spine.head = (0, 0, 1.1)
    spine.tail = (0, 0, 1.25)

    spine1 = edit_bones.new('Spine1')
    spine1.parent = spine
    spine1.head = (0, 0, 1.25)
    spine1.tail = (0, 0, 1.4)

    spine2 = edit_bones.new('Spine2')
    spine2.parent = spine1
    spine2.head = (0, 0, 1.4)
    spine2.tail = (0, 0, 1.55)

    neck = edit_bones.new('Neck')
    neck.parent = spine2
    neck.head = (0, 0, 1.55)
    neck.tail = (0, 0, 1.65)

    head = edit_bones.new('Head')
    head.parent = neck
    head.head = (0, 0, 1.65)
    head.tail = (0, 0, 1.9)

    # 2. Left Arm chain
    l_shoulder = edit_bones.new('LeftShoulder')
    l_shoulder.parent = spine2
    l_shoulder.head = (0.05, 0, 1.5)
    l_shoulder.tail = (0.2, 0, 1.5)

    l_arm = edit_bones.new('LeftArm')
    l_arm.parent = l_shoulder
    l_arm.head = (0.2, 0, 1.5)
    l_arm.tail = (0.45, 0, 1.5)

    l_forearm = edit_bones.new('LeftForeArm')
    l_forearm.parent = l_arm
    l_forearm.head = (0.45, 0, 1.5)
    l_forearm.tail = (0.7, 0, 1.5)

    l_hand = edit_bones.new('LeftHand')
    l_hand.parent = l_forearm
    l_hand.head = (0.7, 0, 1.5)
    l_hand.tail = (0.85, 0, 1.5)

    # 3. Right Arm chain
    r_shoulder = edit_bones.new('RightShoulder')
    r_shoulder.parent = spine2
    r_shoulder.head = (-0.05, 0, 1.5)
    r_shoulder.tail = (-0.2, 0, 1.5)

    r_arm = edit_bones.new('RightArm')
    r_arm.parent = r_shoulder
    r_arm.head = (-0.2, 0, 1.5)
    r_arm.tail = (-0.45, 0, 1.5)

    r_forearm = edit_bones.new('RightForeArm')
    r_forearm.parent = r_arm
    r_forearm.head = (-0.45, 0, 1.5)
    r_forearm.tail = (-0.7, 0, 1.5)

    r_hand = edit_bones.new('RightHand')
    r_hand.parent = r_forearm
    r_hand.head = (-0.7, 0, 1.5)
    r_hand.tail = (-0.85, 0, 1.5)

    # 4. Left Leg chain
    l_upleg = edit_bones.new('LeftUpLeg')
    l_upleg.parent = hips
    l_upleg.head = (0.12, 0, 0.95)
    l_upleg.tail = (0.12, 0, 0.5)

    l_leg = edit_bones.new('LeftLeg')
    l_leg.parent = l_upleg
    l_leg.head = (0.12, 0, 0.5)
    l_leg.tail = (0.12, 0, 0.1)

    l_foot = edit_bones.new('LeftFoot')
    l_foot.parent = l_leg
    l_foot.head = (0.12, 0, 0.1)
    l_foot.tail = (0.12, 0.18, 0)

    # 5. Right Leg chain
    r_upleg = edit_bones.new('RightUpLeg')
    r_upleg.parent = hips
    r_upleg.head = (-0.12, 0, 0.95)
    r_upleg.tail = (-0.12, 0, 0.5)

    r_leg = edit_bones.new('RightLeg')
    r_leg.parent = r_upleg
    r_leg.head = (-0.12, 0, 0.5)
    r_leg.tail = (-0.12, 0, 0.1)

    r_foot = edit_bones.new('RightFoot')
    r_foot.parent = r_leg
    r_foot.head = (-0.12, 0, 0.1)
    r_foot.tail = (-0.12, 0.18, 0)

    # 6. Attachment Sockets (Empty nodes parented to bones)
    w_socket = edit_bones.new('weapon_slot')
    w_socket.parent = r_hand
    w_socket.head = (-0.75, 0, 1.48)
    w_socket.tail = (-0.75, 0.2, 1.48)

    s_socket = edit_bones.new('shield_slot')
    s_socket.parent = l_forearm
    s_socket.head = (0.55, -0.08, 1.5)
    s_socket.tail = (0.55, -0.2, 1.5)

    h_socket = edit_bones.new('head_socket')
    h_socket.parent = head
    h_socket.head = (0, 0, 1.9)
    h_socket.tail = (0, 0, 2.05)

    b_socket = edit_bones.new('back_socket')
    b_socket.parent = spine2
    b_socket.head = (0, -0.12, 1.45)
    b_socket.tail = (0, -0.25, 1.45)

    bpy.ops.object.mode_set(mode='OBJECT')
    print("[Success] Đã khởi tạo Armature chuẩn Chien Long Ba Humanoid thành công!")
    return armature_obj

def setup_basic_actions(armature_obj):
    """Tạo các Action Strips chuẩn: idle, run, attack_slash, skill_cast, death"""
    if not IN_BLENDER or not armature_obj:
        return

    bpy.context.view_layer.objects.active = armature_obj

    # Create 5 keyframed actions
    for anim_name in STANDARD_ANIMATIONS:
        action = bpy.data.actions.new(name=anim_name)
        armature_obj.animation_data_create()
        armature_obj.animation_data.action = action

        # Insert placeholder keyframes at frame 1 and 30
        bpy.context.scene.frame_set(1)
        armature_obj.keyframe_insert(data_path="location", frame=1)
        armature_obj.keyframe_insert(data_path="rotation_euler", frame=1)

        bpy.context.scene.frame_set(30)
        armature_obj.keyframe_insert(data_path="location", frame=30)
        armature_obj.keyframe_insert(data_path="rotation_euler", frame=30)

        # Mark as fake user so Blender doesn't delete it
        action.use_fake_user = True
        print(f"  ✓ Đã khởi tạo action: {anim_name}")

def export_character_glb(output_path):
    """Xuất mô hình sang tệp .glb tối ưu chuẩn WebGL/Three.js"""
    if not IN_BLENDER:
        print("[Error] Phải chạy bên trong Blender!")
        return

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        export_image_format='AUTO',
        export_texcoords=True,
        export_normals=True,
        export_tangents=True,
        export_materials='EXPORT',
        export_colors=True,
        export_cameras=False,
        export_yup=True,
        export_apply=False,
        export_animations=True,
        export_frame_range=True,
        export_frame_step=1,
        export_force_sampling=True,
        export_animation_mode='ACTIONS',
        export_nla_strips=True,
        export_def_bones=True,
        export_optimize_animation_size=True,
        export_anim_single_armature=True,
        export_reset_pose_bones=True,
        export_skins=True,
        export_morph=True,
        export_lights=False
    )
    print(f"[Export] Đã xuất GLB thành công ra: {output_path}")

def validate_model_budget():
    """Kiểm định số lượng triangles và vertices hiện tại trong scene"""
    if not IN_BLENDER:
        return

    total_tris = 0
    total_verts = 0
    meshes_count = 0

    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH':
            meshes_count += 1
            mesh = obj.data
            total_verts += len(mesh.vertices)
            total_tris += len(mesh.polygons)

    print("==================================================")
    print("📊 BÁO CÁO KIỂM ĐỊNH MÔ HÌNH BLENDER (BUDGET CHECK)")
    print(f"  • Số meshes: {meshes_count}")
    print(f"  • Số đa giác (Tris): {total_tris:,} / Tối đa {MAX_TRIANGLES:,}")
    print(f"  • Số đỉnh (Vertices): {total_verts:,} / Tối đa {MAX_VERTICES:,}")
    if total_tris <= MAX_TRIANGLES:
        print("  ✅ ĐẠT CHUẨN HIỆU NĂNG CHO GAME WEB MMORPG!")
    else:
        print("  ⚠️ VƯỢT QUÁ NGƯỠNG ĐA GIÁC! Hãy Decimate hoặc Bake Normal Map.")
    print("==================================================")

if __name__ == "__main__":
    if IN_BLENDER:
        print("Khởi chạy Chiến Long Bá Blender Character Pipeline...")
        rig = create_chien_long_ba_armature()
        setup_basic_actions(rig)
        validate_model_budget()
    else:
        print("Tệp này là kịch bản Python dành riêng cho Blender 3D.")
        print("Vui lòng mở Blender và nạp tệp này qua Text Editor hoặc chạy qua lệnh CLI.")
