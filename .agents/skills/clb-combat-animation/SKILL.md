---
name: clb-combat-animation
description: "Quy chuẩn thiết kế ảnh động chiến đấu nhân vật (Combat Animation Spritesheet System - 2.5D Action RPG). Sử dụng skill này kết hợp với skill tạo nhân vật clb-character-art-style để luôn luôn đảm bảo mọi nhân vật được sinh ra đều có đầy đủ bộ ảnh động chiến đấu chuẩn 9 hàng (Idle, Walk, Jump/Fall, Attack 1-4, Air Attack, Death) theo đúng cơ chế combo chiến đấu thực tế của Chiến Long Bá."
---

# CHIẾN LONG BÁ — HỆ THỐNG QUY CHUẨN ẢNH ĐỘNG CHIẾN ĐẤU NHÂN VẬT (COMBAT ANIMATION SKILL)

Skill này lưu giữ toàn bộ quy chuẩn thiết kế chuyển động chiến đấu (Combat Animation & Spritesheet Pipeline) của dự án **Chiến Long Bá (`@workspace/mmorpg-game`)**, kế thừa từ bảng mẫu spritesheet hoạt họa chiến đấu chuẩn mực (Idle, Walk, Jump/Fall, Attack 1, Attack 2, Air Attack, Attack 3, Attack 4, Death).

**QUY TẮC BẮT BUỘC:** Skill này **LUÔN LUÔN PHẢI KẾT HỢP** với skill tạo nhân vật `clb-character-art-style`. Bất kỳ khi nào tạo hoặc cập nhật nhân vật (nam đam mỹ 6 múi, nữ sexy, NPC hay Boss), bắt buộc phải tích hợp đầy đủ bộ khung chuyển động 9 hàng này để nhân vật hoạt động hoàn hảo trong hệ sinh thái chiến đấu thời gian thực 2.5D.

---

## 1. CƠ CHẾ CHUYỂN ĐỘNG CHIẾN ĐẤU (ACTION MOTION PRINCIPLES)

Mỗi đòn đánh trong Chiến Long Bá được cấu thành từ 4 giai đoạn hoạt họa cốt lõi:
1. **Giai Đoạn Chuẩn Bị (Windup / Anticipation):** Nhân vật rút kiếm/gồng tấn, trọng tâm ngả ra sau, cơ thể chùng xuống để tích lũy động năng.
2. **Giai Đoạn Bộc Phát & Tác Động (Active Impact):** Xuất chiêu cực nhanh (trong 1-2 frames), vệt đao khí/tia năng lượng (Swoosh Trail) vẽ một đường cong sắc lẹm (màu trắng bạc hoặc cyan neon). Khung hình này kích hoạt **Hitbox gây sát thương thực tế**.
3. **Giai Đoạn Quán Tính (Follow-Through):** Thân người và mũi đao vươn dài hết biên độ, tà áo/mái tóc bay cuộn theo chiều vung đòn.
4. **Giai Đoạn Thu Chiêu (Recovery / Combo Cancel Window):** Nhân vật thu đao về thế thủ hoặc cho phép người chơi bấm phím đánh tiếp theo để kích hoạt hủy đòn (Animation Canceling) sang chuỗi Combo kế tiếp.

---

## 2. CẤU TRÚC BẢNG SPRITESHEET CHUẨN 9 HÀNG (THE 9-ROW COMBAT GRID)

Mỗi spritesheet chuẩn có độ phân giải **512 x 576 pixels** (gồm **8 Cột x 9 Hàng**, kích thước mỗi khung hình là **64 x 64 pixels**):

| Hàng (Row) | Tên Trạng Thái (State) | Số Frame | FPS Chuẩn | Mô Tả Chuyển Động & Cơ Chế Thực Chiến |
| :---: | :--- | :---: | :---: | :--- |
| **0** | `idle` | 8 | 8 FPS | Nhịp thở bồng bềnh, mái tóc/vạt áo đung đưa nhẹ, chớp mắt tự nhiên ở frame 6. |
| **1** | `walk` / `run` | 8 | 12 FPS | Bước chạy chiến đấu, chân so le linh hoạt, trọng tâm thân người hơi đổ về trước. |
| **2** | `jump` & `fall` | 8 | 10 FPS | Bật nhảy: Nhún chân (0) $\rightarrow$ Bay vọt lên (1-3) $\rightarrow$ Đạt đỉnh (4) $\rightarrow$ Rơi xuống (5-6) $\rightarrow$ Tiếp đất (7). |
| **3** | `attack1` (Combo 1) | 8 | 14 FPS | Đòn chém ngang tốc độ cao, vệt đao khí trắng bạc sắc nét (đòn đánh thường cơ bản). |
| **4** | `attack2` (Combo 2) | 8 | 14 FPS | Đòn xoay người 360 độ (Whirlwind Slash) chém quét vòng cung năng lượng diện rộng. |
| **5** | `air_attack` | 8 | 12 FPS | Đòn không kích: Bổ từ trên không xuống đất với vệt năng lượng thẳng đứng cắm sàn. |
| **6** | `attack3` (Combo 3) | 8 | 14 FPS | Đòn lướt đâm xuyên phá (Slide Thrust), để lại tia laser tốc độ cao xé gió. |
| **7** | `attack4` (Ultimate) | 8 | 14 FPS | Đòn trảm kích trăng khuyết hạng nặng (Crescent Energy Wave), phóng đao khí khổng lồ. |
| **8** | `death` / `hurt` | 8 | 8 FPS | Bị đánh trúng giật lùi (0-1), ngã gục xuống sàn (2-5), nằm bất động trên mặt đất (6-7). |

---

## 3. NGUYÊN TẮC KẾT HỢP VỚI SKILL TẠO NHÂN VẬT (`clb-character-art-style`)

Khi áp dụng skill này cùng với `clb-character-art-style`:
1. **Nam Đam Mỹ 6 Múi:** Trong các động tác tấn công (Attack 1-4), trang phục mở hoặc vạt áo phanh ra làm lộ rõ khối cơ ngực nở và cơ bụng 6 múi cuộn sóng theo từng thế vung đao.
2. **Nữ Quyến Rũ Sexy:** Khi nhảy (`jump`), xoay (`attack2`) hoặc không kích (`air_attack`), lọn tóc dài/đuôi ngựa bay lượn mềm mại, tôn trọn đường cong vòng 1 và eo thon quyến rũ.
3. **Hiệu Ứng Vệt Chém (VFX Slash Trails):** Đồng bộ màu sắc theo hệ phái:
   - **Hộ Vệ:** Vệt chém màu Vàng Kim Hoàng Gia (`#facc15`) & Trắng.
   - **Chiến Binh:** Vệt chém màu Đỏ Lửa Rồng (`#ef4444`) & Cam Cháy.
   - **Sát Thủ:** Vệt chém màu Tím Đêm Huyền Bí (`#a855f7`) & Bạc Sắc Lẹm.
   - **Xạ Thủ:** Tia laser & chùm plasma màu Xanh Neon Cyan (`#28c3e1`).

---

## 4. CÔNG THỨC TOẠ ĐỘ UV CHUẨN THREE.JS / 2.5D BILLBOARD

Trong Three.js, gốc toạ độ UV `(0, 0)` nằm ở **góc dưới bên trái**. Vì hàng 0 nằm ở đỉnh spritesheet nên công thức ánh xạ như sau:

```typescript
const COLS = 8;
const ROWS = 9;

// Kích thước ô trong không gian UV
const uStep = 1 / COLS; // 0.125
const vStep = 1 / ROWS; // 0.1111

// Tính toán toạ độ V dựa trên hàng hiện tại (0 -> 8)
const vOffset = (ROWS - 1 - rowIndex) * vStep;

// Lật mặt nhân vật khi xoay trái/phải
if (facingLeft) {
  texture.repeat.x = -uStep;
  texture.offset.x = (currentCol + 1) * uStep;
} else {
  texture.repeat.x = uStep;
  texture.offset.x = currentCol * uStep;
}
texture.offset.y = vOffset;
```

---

## 5. BỘ CÔNG CỤ TỰ ĐỘNG & TỆP NGUỒN LIÊN QUAN

- **Script Tạo Spritesheet Chiến Đấu:** [scripts/generate_combat_spritesheet.py](file:///c:/Cassavas/Game2.5D/scripts/generate_combat_spritesheet.py)
  - Sinh ra toàn bộ các tệp `.png` chuẩn 512x576 trong thư mục: `artifacts/mmorpg-game/public/assets/sprites/`
- **Ảnh Mẫu Tham Chiếu Gốc Đã Tách Nền:** [action_hero_sheet_reference.png](file:///c:/Cassavas/Game2.5D/artifacts/mmorpg-game/public/assets/sprites/action_hero_sheet_reference.png)
- **Component Render 2.5D:** [SpriteBillboard25D.tsx](file:///c:/Cassavas/Game2.5D/artifacts/mmorpg-game/src/canvas/sprites/SpriteBillboard25D.tsx)
- **Thực Thể Điều Khiển:** [PlayerEntity25D.tsx](file:///c:/Cassavas/Game2.5D/artifacts/mmorpg-game/src/canvas/entities/PlayerEntity25D.tsx)
