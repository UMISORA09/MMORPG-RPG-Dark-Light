# HỆ THỐNG MÔ HÌNH NHÂN VẬT ẢO & PHÂN TÁCH BỘ PHẬN HOẠT ẢNH (MODULAR RIG)

Tài liệu chi tiết về hệ thống bóc tách từng bộ phận cơ thể (Modular Skeletal Rig & Puppet Animation System) trong dự án **Chiến Long Bá (Game2.5D)**.

---

## 1. CÂY PHÂN CẤP KHỚP XƯƠNG (BONE & LIMB HIERARCHY)

Để dễ dàng tạo hoạt ảnh (animation) cho nhân vật Pixel Art, cơ thể nhân vật được phân tách thành 17 bộ phận độc lập có điểm xoay (Pivot Points) rõ ràng theo cấu trúc cây cha - con:

```
Root (Trọng tâm)
 └── Hips (Khung chậu & Thắt lưng rồng)
      ├── Torso (Thân trên & Giáp ngực)
      │    ├── Abs (Lớp cơ bụng 6 múi riêng biệt / Eo chữ S)
      │    ├── Head (Khớp cổ & Đầu, Mặt Anime, Mắt)
      │    │    ├── Hair Spikes (Mái tóc gai trước & sau)
      │    │    └── Helmet / Horns (Sừng lửa Hộ Vệ / Kính Scouter Xạ Thủ)
      │    ├── Scarf / Cape (Khăn quàng xanh / Áo choàng rách)
      │    ├── Left Shoulder (Giáp vai trái)
      │    │    └── Left Arm (Bắp tay)
      │    │         └── Left Forearm & Hand (Cẳng tay & Bàn tay)
      │    │              └── Offhand Weapon (Khiên Tháp Hắc Kim / Song Đao)
      │    └── Right Shoulder (Giáp vai phải)
      │         └── Right Arm (Bắp tay)
      │              └── Right Forearm & Hand (Cẳng tay & Bàn tay)
      │                   └── Main Weapon (Thanh Long Đại Kiếm / Súng Plasma)
      ├── Left Thigh (Bắp đùi trái)
      │    └── Left Shin & Foot (Cẳng chân & Bốt chiến binh)
      └── Right Thigh (Bắp đùi phải)
           └── Right Shin & Foot (Cẳng chân & Bốt chiến binh)
```

---

## 2. CÁC TÍNH NĂNG HỖ TRỢ TẠO HOẠT ẢNH TRÊN GIAO DIỆN

1. **Thanh Trượt Bóc Tách (Exploded View Slider - 0% đến 100%):**
   - Kéo thanh trượt để tách rời toàn bộ các bộ phận (Đầu bay lên, 2 tay bay sang hai bên, vũ khí tách khỏi tay, 2 chân tách xuống dưới, cơ bụng 6 múi trượt về phía trước).
   - Hiển thị tia nối khung xương màu cyan/amber liên kết từng bộ phận về khớp gốc.
   - Giúp họa sĩ kiểm tra góc xoay, viền outline pixel và pivot không bị chồng chéo.

2. **Bảng Điều Chỉnh Góc Xoay Thủ Công (Pose Maker / FK Rotator):**
   - Cung cấp 12 thanh trượt điều chỉnh góc xoay trực tiếp:
     - Gật / Ngửa Đầu (`headPitch`) & Quay Đầu (`headYaw`).
     - Nghiêng Thân (`torsoLean`) & Vặn Eo (`torsoTwist`).
     - Vung Vai Phải (`rightShoulderPitch`) & Gập Khuỷu Tay (`rightElbow`).
     - Góc Vung Binh Khí (`weaponAngle`).
     - Vung Vai Trái / Thủ Khiên (`leftShoulderPitch`) & Gập Khuỷu Tay (`leftElbow`).
     - Bước Chân Trái / Phải (`leftHipPitch`, `rightHipPitch`).
     - Gập Đầu Gối Trái / Phải (`leftKnee`, `rightKnee`).
   - Nút **[Đặt Lại Góc Xoay]** để khôi phục thế đứng chuẩn.

3. **Thư Mục Tài Nguyên Các Bộ Phận Độc Lập:**
   - Toàn bộ 17 bộ phận đã được xuất rời thành file `.png` và tệp đặc tả JSON tại:
     `artifacts/mmorpg-game/public/assets/character-environment/modular-parts/`
   - Animator có thể import trực tiếp vào Spine 2D, DragonBones, Live2D, Aseprite hoặc Photoshop.
