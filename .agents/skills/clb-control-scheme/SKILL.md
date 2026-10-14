---
name: clb-control-scheme
description: "Quy chuẩn thiết kế hệ thống điều khiển công thái học, sơ đồ bàn phím không xung đột và công thức chuyển động theo góc nhìn camera 3D/2.5D cho Chiến Long Bá. Sử dụng skill này để đảm bảo trải nghiệm di chuyển tự nhiên, thao tác mượt mà bằng một tay/hai tay và ngăn ngừa lỗi sập màn hình đen khi tử trận."
---

# CHIẾN LONG BÁ — QUY CHUẨN ĐIỀU KHIỂN CÔNG THÁI HỌC & SƠ ĐỒ BÀN PHÍM (ARPG CONTROL SCHEME SKILL)

Tài liệu này định hình kiến trúc điều khiển công thái học (Ergonomic Controls System), sơ đồ gán phím bàn phím PC/Desktop, ánh xạ Touch Mobile, và công thức toán học chuyển động theo góc nhìn Camera của **Chiến Long Bá (`@workspace/mmorpg-game`)**.

Mọi lập trình viên và AI Agent khi bổ sung nhân vật, kỹ năng, chức năng UI, hoặc cơ chế chiến đấu mới **BẮT BUỘC** phải tuân theo các quy tắc trong tài liệu này để tránh xung đột phím, tránh lỗi điều khiển ngược ngạo và bảo đảm canvas 3D không bao giờ bị unmount gây đen màn hình.

---

## 1. NGUYÊN TẮC CÔNG THÁI HỌC (ERGONOMIC CONTROL PHILOSOPHY)

Hệ thống điều khiển Chiến Long Bá chia theo 2 phong cách tiếp cận trực quan:

```
[BÀN TAY TRÁI - LEFT HAND CLUSTER]         [BÀN TAY PHẢI - RIGHT HAND / MOUSE]
┌───┬───┬───┐                              ┌───────────────┐
│ 1 │ 2 │ 3 │ (Chiêu thức tức thì)          │ Chuột Trái    │ => Đòn đánh Combo thường
└───┴───┴───┘                              │ Chuột Phải/Rê │ => Xoay Camera Orbit 3D
┌───┬───┬───┐                              └───────────────┘
│ Q │ W │ E │ R (Q/E/R: Kỹ năng chiến đấu)  ┌───────────────┐
└───┴───┴───┘                              │ J             │ => Đòn đánh thường (Phím)
┌───┬───┬───┐                              │ K / L         │ => Đòn đánh phụ
│ A │ S │ D │ (WASD: Di chuyển Camera-Rel) └───────────────┘
└───┴───┴───┘                              ┌───┬───┬───┬───┐
┌───────────┐                              │ B │ P │ O │ H │ (Giao diện Modals)
│ SPACEBAR  │ => Nhảy cao / Vượt địa hình  └───┴───┴───┴───┘
└───────────┘
```

1. **Khối Tay Trái (WASD + Q/E/R hoặc 1/2/3 + Space):**
   - Di chuyển luôn đặt ngón giữa ở `W`, ngón áp út ở `A`, ngón trỏ ở `D`.
   - Ngón trỏ và áp út có thể gõ nhẹ `Q`, `E`, `R` hoặc vươn lên `1`, `2`, `3` mà không cần rời mắt khỏi màn hình.
   - Ngón cái luôn tì sẵn trên phím `Space` để nhảy né đòn tức thì.
2. **Khối Tay Phải (Chuột hoặc J/K/L):**
   - Click chuột trái hoặc bấm phím `J` để chém đòn thường (3-Hit Combo).
   - Rê chuột trong không gian 3D để xoay góc nhìn camera mà không làm đảo lộn hướng di chuyển.
3. **Khối Phím Chức Năng (Menu & Modals):**
   - Tách biệt hoàn toàn khỏi các phím di chuyển và chiến đấu. Không bao giờ gán chức năng mở Modal vào phím nằm trong chuỗi đòn đánh chính.

---

## 2. MA TRẬN PHÍM TẮT KHÔNG XUNG ĐỘT (CONFLICT-FREE KEYBINDING MATRIX)

| Thao Tác | Phím Chính (Default) | Phím Dự Phòng (Alt) | Phân Nhóm | Ghi Chú & Quy Tắc Tránh Xung Đột |
| :--- | :--- | :--- | :--- | :--- |
| **Tiến Về Phía Trước** | `W` | `Mũi tên Lên` | Di chuyển | Hướng thẳng ra xa tầm nhìn camera |
| **Lùi Lại Phía Sau** | `S` | `Mũi tên Xuống` | Di chuyển | Hướng thẳng về phía người chơi/camera |
| **Sang Trái** | `A` | `Mũi tên Trái` | Di chuyển | Hướng sang mép trái màn hình |
| **Sang Phải** | `D` | `Mũi tên Phải` | Di chuyển | Hướng sang mép phải màn hình |
| **Nhảy Cao** | `Space` | Touch Jump | Di chuyển | Nhảy vật lý có quán tính trọng lực |
| **Đánh Thường (Combo)** | `J` | Chuột Trái / `F` | Chiến Đấu | Combo 3 nhịp liên hoàn, tự động reset sau 0.85s |
| **Kỹ Năng 1** | `1` | `Q` (hoặc `K`) | Chiến Đấu | Kỹ năng mở giao tranh / Đột kích |
| **Kỹ Năng 2** | `2` | `E` | Chiến Đấu | **TUYỆT ĐỐI KHÔNG DÙNG `L`** (Tránh đè với BXH) |
| **Kỹ Năng 3 (Nộ / Ult)** | `3` | `R` (hoặc `U`) | Chiến Đấu | Chiêu cuối tiêu hao nộ khí, sát thương diện rộng |
| **Mở Túi Đồ (Inventory)** | `B` (Bag) | `I` | Giao Diện | Mở bảng trang bị, túi vật phẩm trang phục |
| **Cửa Hàng (Shop)** | `P` (Purchases) | Click HUD | Giao Diện | **TUYỆT ĐỐI KHÔNG DÙNG `B`** để tránh xung đột với Bag |
| **Bảng Xếp Hạng (Leaderboard)** | `O` (Order/Rank) | Click HUD | Giao Diện | **TUYỆT ĐỐI KHÔNG DÙNG `L`** để giải phóng phím chiến đấu |
| **Chiến Báo (Battle Logs)** | `H` (History) | Click HUD | Giao Diện | Mở lịch sử săn quái và nhận thưởng |
| **Đổi Chế Độ 2.5D ↔ 3D** | `V` (View) | Click HUD | Hệ Thống | Chuyển đổi giữa Sprite 2.5D Pixel & RPG 3D Model |
| **Đóng Cửa Sổ / Thoát** | `Escape` | Click Nút X | Hệ Thống | Đóng mọi popup, nhả con trỏ chuột Pointer Lock |

---

## 3. CÔNG THỨC TOÁN HỌC CHUYỂN ĐỘNG THEO GÓC NHÌN (CAMERA-RELATIVE MOTION VECTORS)

### Vấn đề thường gặp:
Khi camera xoay tự do trong không gian 3D quanh trục Y (`yaw`), việc cộng tọa độ tuyệt đối vào trục thế giới ($x += moveX, z += moveZ$) sẽ khiến nhân vật đi ngược chiều người nhìn (ví dụ xoay camera 180 độ thì bấm `W` lại chạy tụt lùi về phía người xem).

### Giải pháp chuẩn mực:
Tính toán véc-tơ chuyển động dựa trên góc xoay `cameraControls.yaw`:

```ts
// 1. Xác định véc-tơ cơ sở nhìn từ camera trên mặt phẳng XZ
const yaw = cameraControls.yaw;
const forwardX = -Math.sin(yaw); // Chiều sâu: Xa camera
const forwardZ = -Math.cos(yaw);
const rightX = Math.cos(yaw);   // Chiều ngang: Sang phải màn hình
const rightZ = -Math.sin(yaw);

// 2. Thu thập tín hiệu đầu vào từ bàn phím & joystick ảo
let inputForward = 0; // +1 = Tiến, -1 = Lùi
let inputRight = 0;   // +1 = Phải, -1 = Trái

if (keys.has("w") || keys.has("arrowup")) inputForward += 1;
if (keys.has("s") || keys.has("arrowdown")) inputForward -= 1;
if (keys.has("d") || keys.has("arrowright")) inputRight += 1;
if (keys.has("a") || keys.has("arrowleft")) inputRight -= 1;

// Joystick ảo trên Mobile (kéo ngón tay lên trên dy < 0 mang giá trị âm)
if (joyY < -deadzone) inputForward += -joyY;
if (joyY > deadzone) inputForward += -joyY;
if (joyX > deadzone) inputRight += joyX;
if (joyX < -deadzone) inputRight += joyX;

// 3. Chuẩn hóa độ dài véc-tơ đường chéo (tránh chạy nhanh hơn khi ấn W+D)
const inputMag = Math.hypot(inputForward, inputRight);
if (inputMag > 1) {
  inputForward /= inputMag;
  inputRight /= inputMag;
}

// 4. Biến đổi không gian camera sang tọa độ thế giới thực
const moveX = forwardX * inputForward + rightX * inputRight;
const moveZ = forwardZ * inputForward + rightZ * inputRight;

// 5. Cập nhật hướng mặt nhân vật (Sprite Flip) theo phương ngang màn hình
if (inputRight < -0.05) facingLeftRef.current = true;
else if (inputRight > 0.05) facingLeftRef.current = false;
else if (moveX < -0.05) facingLeftRef.current = true;
else if (moveX > 0.05) facingLeftRef.current = false;
```

---

## 4. CƠ CHẾ BẢO VỆ CANVAS: CHỐNG UNMOUNT & ĐEN MÀN HÌNH (ZERO-UNMOUNT ARCHITECTURE)

### Triệu chứng lỗi đen màn hình:
Khi quái chết hoặc người chơi tử nạn, client kích hoạt mutation backend (`startBattle`). Sau khi mutation hoàn tất, việc gọi blanket `invalidateQueries` khiến React Query chuyển trạng thái sang `isLoading = true` hoặc xóa tạm `characterDetail`. Điều này kích hoạt điều kiện loading toàn màn hình trong `game.tsx`, dẫn đến việc **unmount `<Game />` (Canvas Three.js)**. Khi remount lại, ngữ cảnh WebGL bị hỏng và để lại màn hình đen vĩnh viễn.

### 3 Nguyên tắc bất khả xâm phạm để triệt tiêu lỗi:

1. **Guard Canvas Không Bao Giờ Unmount (Permanent Mounting):**
   ```tsx
   const hasInitializedRef = useRef(false);
   if (characterDetail) {
     hasInitializedRef.current = true;
   }
   
   // CHỈ hiển thị màn hình tải dữ liệu trong lần đầu khởi tạo
   if (!hasInitializedRef.current && (userLoading || charactersLoading || characterLoading || !characterDetail)) {
     return <GameLoadingSpinner />;
   }
   
   // Một khi đã mount, Canvas Three.js sẽ TỒN TẠI SUỐT PHIÊN CHƠI
   return <Game onLogout={handleLogout} />;
   ```

2. **Cập nhật Query Cache Trực Tiếp (Direct SetQueryData):**
   Thay vì invalidate toàn bộ thông tin nhân vật đang chơi, hãy gán trực tiếp dữ liệu mới từ backend:
   ```ts
   queryClient.setQueryData(getGetCharacterQueryKey(currentChar.id), result.character);
   ```

3. **Bảo toàn HP & Hồi Sinh An Toàn (Safe Respawn Guarantee):**
   Không bao giờ gán HP <= 0 vào Zustand store của người chơi khi nhận kết quả từ backend. Luôn kẹp `safeHp = Math.max(1, result.character.hp)` hoặc tự động hồi sinh tại tọa độ Làng Long Tộc `(0, 0, 0)` kèm khiên bất tử tạm thời 2.5 giây.

---

## 5. ĐỒNG BỘ GIAO DIỆN TOUCH TRÊN MOBILE (VIRTUAL JOYSTICK & TOUCH BUTTONS)

1. **Virtual Joystick (Góc Trái Màn Hình):**
   - Vùng cảm ứng kích thước cố định `w-28 h-28` với núm điều khiển di động `w-12 h-12`.
   - Bán kính giới hạn `maxRadius = 38px`. Tọa độ `joyX` và `joyY` luôn nằm trong dải `[-1.0, 1.0]`.
   - Tự động reset về `(0, 0)` khi nhấc ngón tay (`onTouchEnd`).
2. **Cụm Nút Chiến Đấu (Góc Phải / Dưới Giữa):**
   - Nút Chém Combo: To bản, có thanh timer thể hiện nhịp chờ combo đòn tiếp theo.
   - Nút Kỹ Năng 1, 2, 3: Hiển thị đếm ngược Cooldown bằng giây số nguyên to rõ, làm tối nút khi đang hồi chiêu.
   - Luôn hiển thị nhãn phím gợi ý: `1/Q`, `2/E`, `3/R` để người dùng PC cũng có thể tra cứu nhanh trực quan.

---

## 6. CHECKLIST KIỂM THỬ TRƯỚC KHI DEPLOY (QA CHECKLIST)

- [x] Nhấn phím `W` ở bất kỳ góc quay camera nào: Nhân vật phải chạy thẳng ra xa theo chiều dọc màn hình.
- [x] Nhấn phím `S`: Nhân vật phải chạy thẳng lùi lại phía màn hình.
- [x] Nhấn phím `A` và `D`: Nhân vật di chuyển sang trái/phải màn hình chính xác và lật mặt nhân vật mượt mà.
- [x] Bấm phím `2` hoặc `E`: Kích hoạt kỹ năng 2, **KHÔNG** được bật modal Bảng Xếp Hạng.
- [x] Bấm phím `B`: Bật Túi Đồ; Bấm phím `P`: Bật Cửa Hàng; Bấm phím `O`: Bật Bảng Xếp Hạng.
- [x] Đánh hạ quái vật bất kỳ (Slime, Wolf, Dragon): Nhận Vàng, Exp, hiển thị số damage bay và **màn hình game giữ nguyên 100% 60FPS không bị nhấp nháy đen**.
- [x] Khi người chơi bị boss đánh cạn máu: Tự động hồi sinh tại trung tâm Làng Long Tộc, không bị kẹt ở trạng thái chết.
