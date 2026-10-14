# CHIẾN LONG BÍ SỬ — PRODUCT BRIEF & KIẾN TRÚC MMORPG REALTIME

> **Ngày phê duyệt**: 15/10/2026  
> **Phiên bản tài liệu**: 2.0 (Official Baseline)  
> **Định vị sản phẩm**: 2.5D Real-Time Action MMORPG (Web-First, Cross-Platform)  
> **Nguồn sự thật duy nhất (Single Source of Truth)** cho toàn bộ thiết kế, API và triển khai mã nguồn.

---

## 1. TỔNG QUAN SẢN PHẨM (PRODUCT IDENTITY)

- **Tên thương mại**: **Chiến Long Bí Sử — Realm of Legends** (Tiền tố: *Chiến Long Bá*)
- **Thể loại**: 2.5D Real-Time Action MMORPG (Nhập vai hành động thời gian thực nhiều người chơi).
- **Trải nghiệm cốt lõi (Core Loop)**:
  `Tạo nhân vật` ➔ `Bước vào thế giới mở 3D liên thông` ➔ `Gặp gỡ & cùng người chơi khác chiến đấu realtime` ➔ `Nhặt trang bị / Vàng / EXP` ➔ `Nâng cấp & Cường hóa` ➔ `Săn Boss Altar Tổ đội` ➔ `Ghi danh Bảng Vàng Server`.
- **Nền tảng mục tiêu**:
  - **Desktop Web**: Trải nghiệm chuột + bàn phím công thái học (`WASD` di chuyển camera-relative, `J` chém, `1/Q, 2/E, 3/R` kỹ năng).
  - **Mobile Web**: Cảm ứng chạm mượt mà với Virtual Joystick và Touch HUD.

---

## 2. NGUỒN SỰ THẬT VỀ GAMEPLAY & CƠ CHẾ CHIẾN ĐẤU (COMBAT PARADIGM)

| Thành phần | Quy Chuẩn Chốt | Ghi Chú Kỹ Thuật |
| :--- | :--- | :--- |
| **Cơ chế chiến đấu chính** | **100% Real-Time Action Combat** | Di chuyển tự do, hitbox/hurtbox 3D, combo 3 nhịp, né đòn, nộ chiêu diện rộng. |
| **Vai trò API Battle cũ** | **Đồng bộ hóa kết quả & Chống gian lận** | Loại bỏ hoàn toàn mô phỏng xúc xắc theo lượt (turn-based dice roll). Chuyển hóa thành API Authoritative Combat Sync xác nhận tiêu diệt quái và phát thưởng an toàn. |
| **Phong cách đồ họa** | **2.5D HD Pixel Art Billboard Sprite (Chính) + 3D RPG Model (Tùy chọn)** | Sprite 9 hàng chuẩn combat JRPG (Idle, Run, Jump, Attack 1-3, Air Attack, Death). Nút `V` cho phép chuyển sang model 3D tùy sở thích người chơi. |
| **Bản đồ thế giới** | **Bản Đồ Mở Liên Thông (Seamless World Map)** | 3 phân khu không tải cảnh: `Làng Long Tộc` (An toàn, hồi máu), `Đấu Trường Hoang Dã` (Quái thường), `Cấm Địa Boss` (Rồng lửa cổ đại). |

---

## 3. THIẾT KẾ KIẾN TRÚC MULTIPLAYER REALTIME (NETCODE SPECIFICATION)

### A. Mô hình Mạng (Network Topology)
- **Giao thức truyền dẫn**: **WebSocket** (`ws` trên backend Node.js / `window.WebSocket` gốc trên frontend).
- **Cơ chế đồng bộ**: Client-Server Authoritative kết hợp Client-Side Interpolation (`lerp`).
- **Tần số cập nhật (Tick Rate)**:
  - Cập nhật vị trí & trạng thái người chơi: **20 Hz** (mỗi 50ms).
  - Đồng bộ sự kiện chiến đấu (gây sát thương, tung chiêu, nhặt đồ): **Tức thì (Event-Driven)**.

### B. Định Dạng Gói Tin WebSocket (Packet Schema)

```
[CLIENT]                                            [SERVER WebSocket]
   │                                                         │
   ├─── 1. C_AUTH { token / characterId } ──────────────────>│ (Xác thực danh tính)
   │<── 2. S_INIT { worldState, otherPlayers, monsters } ────┤
   │                                                         │
   ├─── 3. C_MOVE { x, y, z, facingLeft, animState } ───────>│ (20Hz Tick)
   │<── 4. S_PLAYER_MOVED { playerId, x, y, z, anim } ───────┤ (Broadcast lân cận)
   │                                                         │
   ├─── 5. C_CAST_SKILL { skillId, targetPos } ─────────────>│
   │<── 6. S_SKILL_VFX { playerId, skillId, origin } ────────┤ (Hiệu ứng cho người khác)
   │                                                         │
   ├─── 7. C_MONSTER_HIT { monsterId, damage, skillSlot } ──>│
   │<── 8. S_MONSTER_SYNC { monsterId, hp, isDead, loot } ───┤
```

### C. Quản lý Thực Thể Người Chơi Khác (Remote Players System)
- Thành phần: [`RemotePlayersManager25D.tsx`](file:///c:/Cassavas/Game2.5D/artifacts/mmorpg-game/src/canvas/entities/RemotePlayersManager25D.tsx)
- Mỗi người chơi khác trong phòng được render dưới dạng Billboard Sprite 2.5D tương tự nhân vật chính:
  - Hiển thị tên, danh hiệu, cấp độ và thanh máu động trên đầu.
  - Tự động nội suy vị trí mượt mà giữa các gói tin để chuyển động không bị giật lag.
  - Đồng bộ hoạt ảnh: Chạy, Nhảy, Tung chiêu chém, Bị đánh văng.

---

## 4. MA TRẬN 4 HỆ PHÁI ANH HÙNG (CLASS ROSTER)

1. **Xạ Thủ (Tech Gunner)**:
   - Sát thương vật lý & năng lượng tầm xa (12m - 18m).
   - Nội tại: Đòn bắn thứ 4 gây bộc phá đạn nổ diện rộng.
   - Chiêu thức: Đạn Xuyên Giáp, Bão Đạn Liên Hoàn, Tên Lửa Hủy Diệt.
2. **Sát Thủ (Shadow Assassin)**:
   - Tốc độ thần sầu, bạo kích chí mạng, lướt bóng tối.
   - Nội tại: Đòn đánh từ phía sau lưng tăng 1.8x sát thương.
   - Chiêu thức: Nhát Đâm Hư Không, Độc Nhãn Tinh, Lưỡi Hái Tử Thần.
3. **Chiến Binh (Berserk Fighter)**:
   - Cận chiến quyền cước sấm sét, công thủ toàn diện.
   - Nội tại: Nộ Huyết — Càng thấp máu sát thương càng bùng nổ.
   - Chiêu thức: Hơi Thở Hỏa Long, Vòng Xoáy Nghịch Long, Long Thần Giáng Thế.
4. **Hộ Vệ (Holy Guardian Tank)**:
   - Khiên thần thánh, giáp sắt phản đòn, bảo hộ đồng đội.
   - Nội tại: Thánh Thuẫn — Giảm 30% sát thương nhận vào, tự phản đòn sóng chấn động.
   - Chiêu thức: Thánh Thuẫn Khiên, Phá Giáp Địa Chấn, Pháo Đài Bất Tử.

---

## 5. LỘ TRÌNH TRIỂN KHAI MULTIPLAYER THEO GIAI ĐOẠN

- **Mốc 1: WebSocket Backend Foundation (Hiện tại)**:
  Tích hợp `ws` server vào `@workspace/api-server`, hỗ trợ phòng chơi Làng Long Tộc, broadcast di chuyển và hoạt ảnh.
- **Mốc 2: Frontend Remote Players Rendering**:
  Hiển thị người chơi khác cùng chạy, nhảy và chiến đấu trong Canvas 3D.
- **Mốc 3: Multiplayer Combat & Boss Raid**:
  Nhiều người chơi cùng đánh Slime, Wolf, Orc và săn Boss Rồng Lửa Cổ Đại tại Altar; chia sẻ thanh máu Boss thời gian thực.
- **Mốc 4: Party & Tổ Đội / Chat Realtime**:
  Hệ thống kênh chat thế giới, mời tổ đội và chia sẻ phần thưởng phó bản.
