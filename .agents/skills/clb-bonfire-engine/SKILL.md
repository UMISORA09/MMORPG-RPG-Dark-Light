---
name: clb-bonfire-engine
description: "Quy chuẩn kiến trúc và bộ công cụ phát triển game 2D/2.5D Action RPG kế thừa từ Bonfire Game Engine (bonfire-develop). Định hình cơ chế Entity-Component, AI Vision tầm nhìn quái, lực đẩy Knockback, đạn đạo bay FlyingAttack, thanh máu đôi UseBarLife, ánh sáng động Lighting Ambiance và camera bám đuổi BonfireCamera."
---

# CHIẾN LONG BÁ — QUY CHUẨN KIẾN TRÚC GAME ENGINE BONFIRE (BONFIRE ARPG GAME ENGINE SKILL)

Tài liệu này lưu trữ toàn bộ tinh hoa kiến trúc và quy chuẩn phát triển game 2D/2.5D Action RPG được kế thừa và chắt lọc trực tiếp từ source code của **Bonfire Game Engine (`bonfire-develop`)**, được chuẩn hóa cho dự án **Chiến Long Bá (`game/` & `@workspace/mmorpg-game`)**.

Mọi lập trình viên và AI Agent khi xây dựng màn chơi, tạo kẻ địch (Boss/Quái), cơ chế vũ khí, hiệu ứng phép thuật, hệ thống ánh sáng hoặc giao diện chiến đấu **BẮT BUỘC** phải tuân theo các quy tắc trong tài liệu này để game đạt độ mượt mà, cảm giác chém đánh (Game Feel / Juiciness) và chuẩn mực ARPG quốc tế.

---

## 1. TRIẾT LÝ KIẾN TRÚC THÀNH PHẦN (ENTITY-COMPONENT & MIXIN ARCHITECTURE)

Trong Bonfire, mọi thực thể trong thế giới game (`GameComponent`) đều được cấu thành từ các module hành vi độc lập (Mixins/Components). Trong Javascript/Typescript Canvas và Three.js, cấu trúc này được mô hình hóa theo 7 thành phần cốt lõi:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        GAME ENTITY (Player / Enemy)                    │
├─────────────────┬──────────────────┬─────────────────┬─────────────────┤
│  Movement &     │   Attackable     │  Vision Sensor  │   UseBarLife    │
│  Forces (Knock) │  (Life & iFrame) │  (AI Detection) │ (Overhead Gauge)│
├─────────────────┼──────────────────┼─────────────────┴─────────────────┤
│  SpriteRenderer │ LightingEmitter  │   FlyingAttack (Projectiles)      │
│  (Pivot 0.5,1.0)│ (Radial Gradient)│   (Crescent Slash / Bullets)      │
└─────────────────┴──────────────────┴───────────────────────────────────┘
```

---

## 2. HỆ THỐNG TẦM NHÌN & MÁY TRẠNG THÁI AI QUÁI VẬT (BONFIRE VISION & AI SYSTEM)

Kế thừa từ `bonfire/mixins/vision.dart` và `bonfire/npc/enemy/simple_enemy.dart`:

### 2.1. Cấu Trúc Máy Trạng Thái (FSM):
1. **`IDLE` (Nghỉ ngơi):** Quái vật thở nhịp nhàng, quan sát xung quanh.
2. **`PATROL` / `WANDER` (Đi tuần):** Khi không thấy người chơi, quái tự động di chuyển ngẫu nhiên quanh bán kính tuần tra (`patrolRadius = 120px`), đổi hướng sau mỗi 2 - 4 giây.
3. **`ALERT` & `CHASE` (Báo động & Truy đuổi):** Khi khoảng cách giữa người chơi và quái $D \le \text{radiusVision}$ (thường là 220 - 300px), quái bật icon cảnh báo (`!`), gầm gừ và tăng tốc chạy áp sát người chơi.
4. **`ATTACK` (Tấn công):** Khi $D \le \text{attackRadius}$ (khoảng 45 - 70px) và cooldown hồi chiêu đã hết, quái dừng bước, gồng đòn và tung chiêu (cào/dậm/phun độc).
5. **`HURT` (Trúng đòn):** Bị gián đoạn hành động (hitstun), kích hoạt lực đẩy lùi (Knockback).
6. **`DIE` (Tử trận):** Phát hoạt ảnh tan biến, rơi vàng/kinh nghiệm và tự hủy sau khi kết thúc frame.

### 2.2. Công Thức Toán Học Kiểm Tra Tầm Nhìn (Vision Math):
```javascript
function checkVision(enemy, target, radiusVision) {
  const dx = target.x - enemy.x;
  const dy = target.y - enemy.y;
  const distSq = dx * dx + dy * dy;
  return distSq <= radiusVision * radiusVision;
}
```

---

## 3. CƠ CHẾ VẬT LÝ CHIẾN ĐẤU & LỰC ĐẨY LÙI (BONFIRE FORCES & KNOCKBACK PHYSICS)

Kế thừa từ `bonfire/forces/` và `bonfire/mixins/attackable.dart`:

Khi một thực thể nhận sát thương, đòn đánh **KHÔNG ĐƯỢC PHÉP** chỉ trừ máu đơn thuần mà bắt buộc phải tạo ra cảm giác va đập vật lý (Impact Juiciness):

1. **Lực Đẩy Lùi (Knockback Impulse):**
   - Hướng đẩy $\vec{v}_{\text{kb}} = \text{facing} \times \text{knockbackForce}$.
   - Vận tốc đẩy lùi cộng dồn tức thì vào thực thể và suy giảm theo ma sát quán tính:
   $$\vec{v}_{\text{kb}}(t + \Delta t) = \vec{v}_{\text{kb}}(t) \times \max(0, 1 - \text{friction} \times \Delta t)$$
2. **Thời Gian Chớp Bất Tử (i-Frames / Flash):**
   - Khi bị đánh trúng, kích hoạt thời gian miễn nhiễm sát thương trong `0.2s - 0.35s` kèm hiệu ứng chớp trắng/trong suốt (`opacity: 0.5`) để tránh lỗi 1 hit chết do dính đa hitbox trùng lặp.
3. **Chấn Động Màn Hình (Trauma Screen Shake):**
   - Mỗi cú đánh trúng kích hoạt `screenShake = traumaLevel` (6 - 12px), suy giảm tuyến tính `Math.max(0, screenShake - dt * 25)`.

---

## 4. HỆ THỐNG ĐẠN ĐẠO & PHÉP THUẬT BAY (FLYING ATTACK GAME OBJECT)

Kế thừa từ `bonfire/objects/flying_attack_game_object.dart`:

Dành cho các đòn đánh tầm xa như Kiếm Khí Long Bá, Phi Tiêu Sát Thủ, Đạn Plasma, Cầu Lửa:

### 4.1. Thuộc Tính Đạn Đạo Chuẩn:
- `x, y`: Tọa độ xuất phát (tính từ ngực/mũi kiếm nhân vật).
- `vx, vy`: Véc-tơ vận tốc bay (thường từ 350 - 550 px/s).
- `maxDistance`: Tầm bay tối đa (sau đó tự phát nổ/tiêu biến).
- `pierceCount`: Số lượng quái có thể xuyên qua trước khi nổ.
- `trailVFX`: Hạt năng lượng phát sáng kéo theo sau đuôi đạn.
- `onDestroy`: Kích hoạt vòng nổ Anime Slash hoặc vỡ vụn hạt lửa (`particle burst`).

---

## 5. THANH MÁU NỔI ĐÔI LỚP (OVERHEAD USEBARLIFE SYSTEM)

Kế thừa từ `bonfire/mixins/use_barlife.dart`:

Thay vì thanh máu cố định nhàm chán ở góc màn hình, thanh máu phong cách Bonfire bay lơ lửng ngay phía trên đầu nhân vật và quái vật với 2 lớp màu:
1. **Lớp Máu Nhanh (Main HP Bar - Đỏ/Hồng):** Rút ngay lập tức về giá trị máu thực sau khi bị trừ.
2. **Lớp Máu Rát / Đệm Chậm (Ghost Lag Bar - Trắng/Vàng Kim):** Giữ nguyên độ dài trong 0.25s rồi từ từ tụt dần để người chơi nhìn rõ lượng sát thương vừa xả vào quái.
3. **Kèm Huy Hiệu:** Hiển thị Tên Quái + Cấp độ (Ví dụ: `Lv.5 Slime Oni Boss`).

---

## 6. HỆ THỐNG ÁNH SÁNG ĐỘNG HẮC ÁM (LIGHTING COMPONENT & AMBIANCE)

Kế thừa từ `bonfire/lighting/lighting_component.dart`:

Để tạo bầu không khí Dark Fantasy rùng rợn và huyền ảo:
1. Phủ một lớp bóng đêm bao trùm toàn bộ canvas (`#080410` với alpha 0.65 - 0.85).
2. Dùng chế độ hòa trộn `destination-out` (hoặc gradient trong suốt) để **khoét lỗ sáng tròn mềm mại** tại:
   - **Tâm người chơi:** Bán kính $R = 90 - 130\text{px}$ (vầng sáng đèn lồng / hào quang anh hùng).
   - **Các ngọn đuốc lâu đài:** Bán kính $R = 70\text{px}$ có hiệu ứng lập lòe sống động: $R(t) = R_0 + \sin(t \times 8) \times 4\text{px}$.
   - **Kiếm khí & Đạn bay:** Khi bay phát ra ánh sáng chói lọi xé toạc màn đêm.

---

## 7. HỆ THỐNG CAMERA BÁM ĐUỔI MƯỢT MÀ (BONFIRE CAMERA & LERP)

Kế thừa từ `bonfire/camera/bonfire_camera.dart`:

1. Không dùng camera giật cục cố định. Tọa độ camera bám đuổi theo vị trí nhân vật chính với công thức nội suy (Linear Interpolation - Lerp):
   $$\text{camX} = \text{lerp}(\text{camX}, \text{targetX} - \frac{\text{CANVAS\_WIDTH}}{2}, 0.08)$$
2. **Giới Hạn Biên Bản Đồ (Clamping Bounds):**
   $$\text{camX} = \text{clamp}(\text{camX}, 0, \text{MAP\_WIDTH} - \text{CANVAS\_WIDTH})$$
3. Toàn bộ đối tượng vẽ thế giới được bù trừ tọa độ: $X_{\text{screen}} = X_{\text{world}} - \text{camX}$.

---

## 8. ĐIỀU KHIỂN CÔNG THÁI HỌC & JOYSTICK CẢM ỨNG (ERGONOMIC & TOUCH INPUT)

Kế thừa từ `bonfire/joystick/joystick.dart`:

Hỗ trợ đồng thời 100% không xung đột giữa Desktop Keyboard và Mobile Touch:
- **Trái:** Virtual Analog Joystick (cố định hoặc tự động xuất hiện tại vị trí ngón tay chạm).
- **Phải:** Cụm 4 nút hình vòng cung tiện lợi:
  - `J` / Nút Đỏ: Đòn đánh cận chiến Combo thường.
  - `K` / Nút Tím: Tuyệt kỹ chém Anime VFX.
  - `L` / Nút Vàng: Kiếm khí tầm xa (Flying Attack Projectile).
  - `Space` / Nút Xanh: Nhảy / Lướt né đòn (Dash/Dodge).

