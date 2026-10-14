# Phương án tinh chỉnh nâng cao — Bàn phím, chuột và camera

**Dự án:** Chiến Long Bí Sử / Game2.5D  
**Ngày rà soát:** 15/10/2026  
**Phạm vi:** Đánh giá luồng input trong `Game.tsx`, `PlayerEntity25D.tsx`, `useGameStore.ts`, `useGameWorldStore.ts` và `MobileControls.tsx`. Chưa sửa gameplay code trong tài liệu này.

## 1. Nhận định tổng quan

Điều khiển hiện tại có cả vấn đề thiết kế lẫn lỗi đấu nối. Không nên bắt đầu bằng cách chỉnh vài con số sensitivity: trước hết cần có **một input router duy nhất**, một camera controller, một nguồn state gameplay và quy tắc phân biệt gameplay với UI. Sau khi bỏ listener trùng/xung đột mới tinh chỉnh feel.

### Các nguyên nhân đã thấy trong mã

1. **Hai bộ nhận keyboard độc lập:**
   - `Game.tsx` có `keysDown` listener cấp module.
   - `PlayerEntity25D.tsx` có `keys` listener cấp module khác.
   - `useGameStore` và `useGameWorldStore` cùng có logic gameplay/callback. `Game.tsx` gọi kỹ năng vào cả hai store. Rủi ro là một lần bấm sinh hai tác động hoặc hai state lệch nhau.

2. **Hotkey bị đè/chồng chức năng:**
   - `PlayerEntity25D.tsx`: `E` gọi skill 2, đồng thời `Game.tsx` cũng đọc `E` như interact.
   - `K` trong player listener gọi skill 1, trong Game controls `K` lại là shoot.
   - Một số phím skill được xử lý ở cả hai store.
   - Cùng một mục tiêu có nhiều phím thay thế khó nhớ (J/F/Z; K/X; Q/1; E/2; R/3), nhưng không có hệ thống keybind map tập trung để kiểm tra collision.

3. **Chuột trái không đánh:**
   - `Game.tsx` bắt `mousedown` trên canvas và gọi `requestPointerLock(canvas)` không phân biệt nút chuột.
   - Không thấy đường gọi attack từ `e.button === 0`; mouse down chỉ bật camera/pointer lock tracking.
   - Vì vậy dòng hướng dẫn “Chuột/J chém” không đúng với handler hiện tại; click trái chủ yếu cố khóa con trỏ.

4. **Pointer lock khó hiểu và quá nhạy:**
   - Bất kỳ nút chuột nào trên canvas cũng xin pointer lock.
   - Không có xử lý rõ ràng `pointerlockerror`, trạng thái lock dễ thấy, hay hành vi khi người dùng từ chối/thoát lock bằng Escape.
   - Khi lock không thành công, camera chỉ xoay khi trạng thái `isMouseDown` còn đúng; nhả chuột ngừng xoay. Khi lock được bật, chuột trái vẫn không thành attack.
   - Không thấy phân biệt click để đánh với drag để xoay camera, nên thao tác cơ bản không tự nhiên.

5. **Listener vòng đời không an toàn:**
   - Listener được tạo ở cấp module và không có cleanup; có thể sống qua remount/HMR, chạy trước khi game active hoặc bắt phím khi người dùng đang ở UI.
   - Kiểm tra typing chỉ loại `input`/`textarea`, chưa xử lý `select`, `contenteditable`, dialog/key capture, game pause/focus.
   - Không dựa trên `event.code`, nên layout bàn phím khác nhau có thể cho cảm giác không nhất quán.

6. **Điều khiển mobile đọc state khác:**
   - `MobileControls.tsx` đọc `useGameStore` và thay đổi `mobileState`.
   - `PlayerEntity25D.tsx` tiêu thụ `mobileState`, nhưng `Game.tsx` lại tiêu thụ `mobileState` cho game loop khác.
   - Có thể mobile controls không được mount trong cùng tree hoặc điều khiển chỉ tác động một loop; phải xác minh trước khi giữ song song hai loop.

7. **Camera & nhân vật không có mapping thống nhất:**
   - Chuột điều khiển camera qua global `cameraControls`; movement camera-relative được tính riêng trong `PlayerEntity25D`.
   - Một loop khác trong `useGameStore` di chuyển theo velocity và không dùng `cameraYaw` trong đoạn cập nhật đang đọc. Nếu hai loop/store cùng hoạt động, cùng phím có thể tạo hai cách di chuyển khác nhau.

## 2. Sơ đồ điều khiển desktop đề xuất

Mục tiêu là dễ nhớ, không xung đột và thao tác được bằng WASD + chuột:

| Hành động | Mặc định | Ghi chú |
|---|---|---|
| Di chuyển | `W A S D` | Camera-relative; tốc độ chéo không nhanh hơn; input lấy theo `event.code`. |
| Nhảy | `Space` | Edge-trigger hoặc giữ theo gameplay; không giữ lặp gây nhảy liên tục. |
| Đánh thường / combo | **Chuột trái** hoặc `J` | Click trái phát attack; nhấn liên tiếp vào combo window. Không dùng click trái để khóa con trỏ. |
| Xoay camera | **Giữ chuột phải + rê** | Orbit tự do khi giữ; thả chuột phải thì dừng. Không cần pointer lock cho thao tác mặc định. |
| Khóa mục tiêu (nếu có) | `Tab` | Tùy chọn; không bắt buộc cho vertical slice. |
| Kỹ năng 1/2/3 | `Q / E / R` hoặc `1 / 2 / 3` | Hai dãy là alias rõ ràng; `E` không còn là interact. Chỉ map một lần tại input router. |
| Tương tác/NPC/loot | `F` | Chỉ khi có target hợp lệ; hiện prompt “F — Tương tác”. |
| Né/dash (nếu hỗ trợ) | `Shift` | Thêm sau khi có stamina/cooldown và test combat. |
| Inventory | `B` | UI action; bị chặn khi đang nhập text/capture key. |
| Shop | `P` | Có thể bỏ khỏi global hotkey nếu NPC/Shop tương tác tại thế giới. |
| Leaderboard | `O` | Tùy chọn. |
| Battle log/quest | `H` | Tùy chọn. |
| Escape | `Esc` | Đóng modal trước; nếu không modal thì mở pause/options và nhả pointer lock nếu đang dùng. |

### Chuột: quy tắc tránh “khó điều khiển”

- **Mặc định không dùng pointer lock.** Chuột phải giữ để orbit; kéo trái/phải đổi yaw, kéo lên/xuống đổi pitch trong giới hạn.
- Nút trái là action riêng, không gọi pointer lock.
- Nếu sản phẩm cần camera kiểu FPS, cung cấp setting “Camera capture / Pointer lock”, chỉ bật qua nút “Bắt đầu điều khiển camera” hoặc toggle rõ ràng; không bật ngầm từ click bất kỳ.
- Có nút reset camera, sensitivity X/Y riêng, invert Y, zoom wheel theo giới hạn (không cuộn trang khi canvas đang capture).
- Nếu click trái khi rê camera bằng chuột phải, không đánh ngoài ý muốn; không dùng `window mousemove` để xoay nếu không có right-button drag/pointer lock active.

## 3. Kiến trúc input cần hướng tới

### Single Input Router

Tạo một module/hook duy nhất (ví dụ `game/input/InputRouter.ts`) chịu trách nhiệm:
- Quản lý pressed keys theo `event.code`.
- Map physical key/button → semantic actions (`moveForward`, `basicAttack`, `skill1`, `interact`, `cameraOrbit`).
- Phân biệt action dạng **pressed edge** (attack/skill/jump/interact) với **held state** (di chuyển/giữ aim).
- Chặn input khi event target là input/textarea/select/contenteditable, khi modal mở, khi keybinding capture active hoặc document mất focus.
- Clear mọi pressed state khi `window.blur`, `visibilitychange`, pointer unlock, touchcancel và khi input context đổi; tránh nhân vật chạy/đánh mãi nếu keyup bị mất.
- Có context rõ: `gameplay`, `ui`, `rebinding`, `paused`; chỉ một context được nhận phím tại một thời điểm.
- Keybind map có collision validator và test; alias chỉ được khai báo tường minh.

### Một nguồn gameplay state và một loop

- Chọn một trong hai: `useGameStore` cũ hoặc `useGameWorldStore` mới làm presentation/game state. Loại bỏ loop/handler còn lại khi đã xác định luồng thật.
- Keyboard listener không gọi `triggerSkill` trực tiếp vào hai store. Nó phát semantic action một lần, game/combat system tiêu thụ.
- Với hướng server-authoritative đang thiết kế: InputRouter tạo input intent; client gửi intent server và chỉ prediction/render cục bộ, không quyết định hit/reward.
- Camera controller chỉ đọc `cameraOrbit` intent; player controller chỉ đọc movement vector đã chuẩn hóa camera-relative.

## 4. Thứ tự tinh chỉnh cảm giác điều khiển

Không chốt số sensitivity chỉ bằng cảm tính; đưa thành options và hiệu chỉnh qua playtest.

1. **Responsiveness:** input có tác dụng trong frame/tick kế tiếp; không chờ API/network để phát animation phản hồi ban đầu.
2. **Movement:** camera-relative forward/right; normalize chéo; smoothing acceleration/deceleration có ngưỡng deadzone; không trôi khi mất focus.
3. **Camera:** right-drag, yaw 360° liên tục, pitch min/max, sensitivity riêng X/Y, delta clamp khi chuột bị giật; tùy chọn invert Y.
4. **Combat:** click trái chỉ phát một press edge; giữ chuột có auto-repeat chỉ nếu thiết kế cho phép; combo window và cancel được hiển thị/nhất quán.
5. **UI feedback:** HUD hiển thị phím hiện tại; tooltip thay đổi theo keybind; remap có cảnh báo trùng; “Restore defaults”.
6. **Accessibility:** chỉnh độ nhạy, giảm camera shake, toggle/hold cho aim/camera, tránh yêu cầu giữ nhiều phím đồng thời; hỗ trợ gamepad nếu thuộc scope.

## 5. Kế hoạch triển khai theo phase

### Phase A — Quan sát và khóa hành vi hiện tại (0.5 ngày)
- Xác nhận route game render component nào, có mount `WorldLoop` nào, có mount `MobileControls` ở đâu.
- Dùng log tạm/React devtools xác định một lần nhấn có bị cả hai listener/store xử lý.
- Ghi video/screenshot lỗi chuột nếu có thể; đo input-to-visible response.
- Chốt sơ đồ điều khiển mặc định ở mục 2.

**Gate:** xác định duy nhất entry component và loop gameplay đang chạy trong build.

### Phase B — Sửa lỗi chức năng P0 (1-2 ngày)
- Bỏ listener cấp module; đăng ký/cleanup trong `useEffect` hoặc InputRouter.
- Làm chuột trái → attack, chuột phải drag → orbit; bỏ pointer lock tự bật trên mọi `mousedown`.
- Gỡ xung đột `E` interact/skill2, `K` skill/shoot; cắt alias không cần thiết.
- Xử lý blur/visibility/modal để clear held keys.
- Chọn một store/loop nhận input; tránh gọi cùng action vào hai store.

**Gate:** WASD, Space, left-click/J, right-drag, Q/E/R hoặc 1/2/3 hoạt động một lần đúng action.

### Phase C — Input Router & camera options (2-4 ngày)
- Xây semantic action map, context và collision detection.
- Thêm options camera sensitivity X/Y, invert Y, reset camera và tùy chọn pointer lock.
- Tích hợp prompt interaction theo target; không bật tương tác chỉ vì phím bị hold.
- Đồng bộ HUD controls/hints với map thật bằng một source config.

**Gate:** mọi phím hiển thị trên HUD lấy trực tiếp từ input map; remap trùng bị cảnh báo/chặn.

### Phase D — Combat feel và server intent (3-5 ngày, song song theo combat migration)
- Action attack/skill tạo event edge; không phát lặp mỗi frame vì key đang giữ.
- Dùng server-authoritative input sequence khi encounter server có mặt; client prediction chỉ animation/camera.
- Đồng bộ cancel windows/cooldown với luật server; client UI hiển thị trạng thái authoritative.

**Gate:** spam key/packet không tạo action vượt cooldown; click combo hoạt động ổn định.

### Phase E — QA và tinh chỉnh (2-3 ngày)
- Desktop chuột 60/125/500/1000 Hz, nhiều DPI, full-screen/windowed, pointer lock được/không được phép.
- Chrome/Edge, màn hình tỉ lệ khác nhau; bàn phím layout QWERTY/AZERTY nếu hỗ trợ.
- Kiểm tra WASD + skill + mouse simultaneous, modal focus, chat/input, blur/alt-tab, reconnect.
- Mobile landscape: joystick + camera drag + attack/jump multi-touch, pointer capture/touchcancel.
- Tuning playtest ít nhất 3-5 người; thu thập “camera too fast/slow”, “attack missed”, “key conflict” thay vì hỏi chung chung.

## 6. Bộ test hồi quy tối thiểu

- Nhấn W/A/S/D từng phím và đường chéo; tốc độ chéo bằng tốc độ thẳng.
- Xoay camera 0°, 90°, 180° rồi bấm W: luôn đi ra xa theo hướng nhìn.
- Nhấn E chỉ dùng đúng một action (khuyến nghị skill 2 nếu giữ Q/E/R); F tương tác.
- Nhấn K không tự kích hoạt skill/shoot nếu không nằm trong map mặc định.
- Click chuột trái đánh đúng một lần; không bật pointer lock.
- Giữ chuột phải và rê thì camera orbit; nhả chuột phải camera dừng.
- Kéo chuột vượt ra ngoài canvas rồi nhả: không mắc trạng thái drag.
- Nhấn Escape thoát pointer lock/pause đúng thứ tự; modal đang mở thì Escape chỉ đóng modal trước.
- Gõ trong input/chat: phím game không bị xử lý.
- Alt-tab khi đang giữ W: nhân vật dừng ngay.
- Mở/đóng modal và HMR/remount không nhân đôi listener/action.
- Skill trên keyboard và HUD/mobile đều chỉ phát một lần, cooldown trùng giữa UI/game.

## 7. Ưu tiên theo mức độ

| Mức | Việc | Lý do |
|---|---|---|
| P0 | Left click attack; right-drag orbit; không pointer-lock ngầm | Sửa trực tiếp phàn nàn “chuột không hoạt động tốt”. |
| P0 | Một InputRouter, bỏ listener/module duplicate, một store/loop | Ngăn action kép, stuck keys, state không nhất quán. |
| P0 | Gỡ xung đột E/K và đồng bộ HUD hint với input map | Người chơi bấm đúng phím nhưng có nguy cơ ra action khác. |
| P1 | Camera settings, reset, pointer-lock opt-in | Tạo cảm giác điều khiển cá nhân hóa/dễ tiếp cận. |
| P1 | Key rebinding + collision validation + restore defaults | Hỗ trợ layout và sở thích người chơi. |
| P2 | Gamepad, lock-on target, accessibility presets | Chỉ làm sau khi keyboard/mouse nền tảng ổn định. |

## 8. Khuyến nghị

Đừng chỉnh sensitivity trước khi sửa đường input. Bước đầu nên là **(1) single router/context, (2) left click attack, (3) right-drag camera, (4) loại bỏ listener và store trùng, (5) test xung đột phím**. Sau khi các test chức năng qua, mới tune camera/movement theo playtest.

Không nên tuyên bố “60 FPS/điều khiển chuẩn” chỉ từ checklist nội bộ. Cần chạy kiểm thử thực tế trong browser sau khi build được, đặc biệt vì môi trường rà soát chưa xác minh runtime của frontend.
