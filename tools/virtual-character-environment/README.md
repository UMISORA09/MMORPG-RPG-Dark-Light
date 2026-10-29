# HƯỚNG DẪN MÔI TRƯỜNG MÔ HÌNH NHÂN VẬT ẢO 3D (VIRTUAL CHARACTER MODEL ENVIRONMENT)

Thư mục này định nghĩa toàn bộ quy chuẩn kỹ thuật, cấu hình kiểm định và công cụ nhập/xuất tài nguyên 3D cho các mô hình nhân vật ảo trong dự án **Chiến Long Bá (Game2.5D)**.

---

## 1. QUY CHUẨN KỸ THUẬT MÔ HÌNH NHÂN VẬT ẢO (TECHNICAL SPECIFICATIONS)

### A. Định Dạng Tệp & Nén
- **Định dạng chuẩn:** `.glb` (glTF 2.0 Binary) hoặc `.gltf` kèm `.bin`.
- **Tối ưu hóa (Compression):** Draco Mesh Compression (khuyến nghị cho web) hoặc KHR_mesh_quantization.
- **Tọa độ trục (Coordinate System):** Y-Up, Z-Forward (chuẩn WebGL / Three.js).

### B. Giới Hạn Đa Giác & Tải Trọng (Polycount & Performance Budget)
| Thông Số | Mức Khuyến Nghị (Hero Avatar) | Mức Tối Đa (Max Threshold) |
| :--- | :--- | :--- |
| **Triangles (Tris)** | 8,000 – 15,000 tris | 25,000 tris |
| **Draw Calls** | 1 – 2 draw calls per character | Tối đa 3 draw calls |
| **Materials** | 1 Uber Material (PBR Metallic-Roughness) | Tối đa 2 materials |
| **Texture Resolution** | 1024x1024 (Atlas) | Tối đa 2048x2048 |
| **Dung lượng tệp (.glb)** | < 3.5 MB | < 6.0 MB |

### C. Khung Xương Chuẩn (Humanoid Skeleton Rig)
Hệ thống sử dụng cấu trúc xương tương thích Humanoid tiêu chuẩn:
- `Root` $\rightarrow$ `Hips` $\rightarrow$ `Spine` $\rightarrow$ `Spine1` $\rightarrow$ `Spine2` $\rightarrow$ `Neck` $\rightarrow$ `Head`
- `LeftShoulder` $\rightarrow$ `LeftArm` $\rightarrow$ `LeftForeArm` $\rightarrow$ `LeftHand`
- `RightShoulder` $\rightarrow$ `RightArm` $\rightarrow$ `RightForeArm` $\rightarrow$ `RightHand`
- `LeftUpLeg` $\rightarrow$ `LeftLeg` $\rightarrow$ `LeftFoot` $\rightarrow$ `LeftToeBase`
- `RightUpLeg` $\rightarrow$ `RightLeg` $\rightarrow$ `RightFoot` $\rightarrow$ `RightToeBase`

### D. Socket Gắn Vũ Khí & Phụ Kiện (Attachment Sockets)
1. `weapon_slot`: Nằm ở xương bàn tay phải (`RightHand`), hướng trục Z hướng mũi kiếm/nòng súng.
2. `shield_slot`: Nằm ở cẳng tay trái (`LeftForeArm`), xoay 90 độ để khiên úp vào tay.
3. `head_socket`: Nằm ở đỉnh đầu (`Head`), offset +0.15m trục Y cho mũ trụ / sừng lửa.
4. `back_socket`: Nằm ở xương sống trên (`Spine2`), offset -0.15m trục Z cho áo choàng / cánh.

---

## 2. BỘ HOẠT ẢNH BẮT BUỘC (MANDATORY ANIMATION CLIPS)

Mỗi mô hình nhân vật ảo phải tích hợp đủ các animation clips sau trong tệp `.glb`:

| Clip Name | Tên Hiển Thị | Tốc Độ Chuẩn | Cơ Chế Thực Hiện |
| :--- | :--- | :--- | :--- |
| `idle` | Đứng thở | 24 - 30 FPS (Loop) | Nhịp thở tự nhiên, đung đưa vạt áo/vũ khí |
| `run` | Chạy bộ | 30 FPS (Loop) | Chạy chiến đấu, trọng tâm hơi ngả trước |
| `attack_slash` | Đòn chém 1-2 | 30 FPS (One-shot) | Vung kiếm/đao xé gió có vệt sáng |
| `skill_cast` | Niệm chú / Nộ | 30 FPS (One-shot) | Gồng năng lượng phóng chiêu tối thượng |
| `death` | Tử trận | 30 FPS (Clamp) | Ngã gục tiếp đất bất động |

---

## 3. CÔNG CỤ KIỂM ĐỊNH TỰ ĐỘNG (`model_validator.py`)

Chạy công cụ kiểm tra mô hình nhân vật:
```bash
python tools/virtual-character-environment/model_validator.py artifacts/mmorpg-game/public/assets/models/characters/fighter.glb
```

Công cụ sẽ tự động rà soát:
1. Tính toàn vẹn của cấu trúc glTF / GLB.
2. Số lượng meshes, vertices, và triangles.
3. Sự hiện diện của các animation clips bắt buộc.
4. Tương thích socket xương.

