# ROLE & OBJECTIVE
Bạn là một Principal Technical Artist và Senior Game Engine Architect. Nhiệm vụ của bạn là xây dựng một **End-to-End 2D Sprite Pipeline & Runtime Animation System** hoàn chỉnh, tự động hóa 100% từ khâu xử lý ảnh thô do AI vẽ (NPC, Monster, Skill VFX) theo phong cách **HD-2D Pixel Art kết hợp 2D Anime/Chibi**, cho đến khâu cắt frame, đóng gói Texture Atlas, xuất Mapping JSON và chạy thử nghiệm trực tiếp trong Game.

Hãy thực thi toàn bộ dự án này theo chế độ **Zero-Touch Execution** (tự tạo file, tự cài thư viện, tự sinh dữ liệu mẫu và chạy kiểm thử).

---

# ART STYLE & TECHNICAL CONSTRAINTS (PIXEL ART x ANIME CHIBI)
Phong cách Pixel Art Chibi có đặc thù: đầu to (tỷ lệ 2-3 head-tall), viền sắc nét (crisp pixel outlines) kết hợp hiệu ứng Skill Anime phát sáng mượt (smooth alpha/glow). Do đó, code xử lý BẮT BUỘC phải tuân thủ:
1. **Nearest-Neighbor Filtering:** Tuyệt đối không dùng Bilinear/Bicubic khi resize hoặc cắt ghép nhân vật để tránh làm mờ hạt pixel (blurring).
2. **Strict Bottom-Center Pivot (`x: 0.5, y: 1.0`):** Nhân vật Chibi khi tung chiêu hoặc nhảy thường vung vũ khí làm thay đổi chiều cao bounding box. Mọi frame của NPC/Quái bắt buộc phải căn chuẩn theo điểm giữa-dưới của bàn chân để không bị giật (jittering) khi chuyển frame.
3. **Center-Center Pivot (`x: 0.5, y: 0.5`) & Additive Blending cho Skill VFX:** Các chiêu thức Anime (kiếm khí, nổ ma thuật) phải căn tâm ở chính giữa và hỗ trợ chế độ hòa trộn ánh sáng.
4. **Anti-Fringing Chroma Key:** Khi xóa nền xanh (`#00FF00`) hoặc hồng (`#FF00FF`), phải khử viền màu thừa bám quanh nét vẽ đen của nhân vật Chibi nhưng không làm mất góc vuông của điểm ảnh.

---

# KIẾN TRÚC HỆ THỐNG CẦN XÂY DỰNG (3 MODULES)

Hãy tạo cấu trúc thư mục dự án và viết code đầy đủ cho 3 phân hệ sau:

## MODULE 1: `tools/sprite_pipeline.py` (Auto-Slicer, Rig Normalizer & Atlas Packer)
Viết một script Python hoàn chỉnh (sử dụng `Pillow`, `numpy`, `scipy` hoặc `opencv-python`) xử lý ảnh đầu vào trong thư mục `raw_ai_sprites/` và xuất kết quả ra `assets/exported/`:
1. **Smart Background Removal:**
   - Tự động lấy mẫu màu nền tại góc `(0,0)` hoặc nhận mã HEX (`#00FF00`, `#FF00FF`).
   - Chuyển nền thành Alpha = 0 với ngưỡng `tolerance` tùy chỉnh, giữ nguyên độ sắc nét của Pixel Art.
   - Chế độ riêng cho `vfx`: Nếu ảnh có nền đen (`#000000`), chuyển độ sáng (Luminance) thành kênh Alpha hoặc giữ nguyên để dùng chế độ `Additive` trong game.
2. **Island Detection & Auto-Slicing (Không cắt theo lưới mù):**
   - Dùng thuật toán Connected Components (`scipy.ndimage.label` hoặc `cv2.findContours`) kèm bước `binary_dilation` nhỏ để gom các bộ phận rời (như vũ khí bay cạnh nhân vật hoặc hạt tia lửa của Chibi) vào chung 1 frame.
   - Loại bỏ các hạt nhiễu (noise) có diện tích `< min_area`.
   - Sắp xếp chính xác thứ tự các frame theo hàng (Row-major order: từ trên xuống dưới, từ trái qua phải với sai số dòng `row_tolerance`).
3. **Canvas Normalization & Pivot Locking:**
   - Tìm kích thước lớn nhất `(max_w, max_h)` của chuỗi hành động.
   - Đóng khung tất cả các frame vào canvas đồng nhất `(max_w + padding*2, max_h + padding*2)`.
   - Nếu là `character` (NPC/Monster): Dán ảnh gốc sát đáy (`y = canvas_h - padding - sprite_h`) và căn giữa theo trục X (`x = (canvas_w - sprite_w) // 2`).
   - Nếu là `vfx` (Skill): Căn chính giữa hoàn toàn cả trục X và Y.
4. **Atlas Packing & JSON Mapping Generator:**
   - Ghép toàn bộ các chuỗi hành động (`idle`, `run`, `attack`, `hit`, `die`, `skill_cast`) vào 1 tấm `atlas.png` duy nhất.
   - Xuất file `mapping.json` theo cấu trúc chuẩn:
     ```json
     {
       "meta": {
         "image": "atlas.png",
         "style": "pixel_chibi",
         "scale_mode": "NEAREST",
         "size": {"w": 1024, "h": 1024}
       },
       "frames": {
         "attack_0": {
           "frame": {"x": 0, "y": 0, "w": 64, "h": 64},
           "pivot": {"x": 0.5, "y": 1.0},
           "hitbox": {"x": 32, "y": -40, "w": 45, "h": 30, "active": false}
         }
       },
       "animations": {
         "idle": {"frames": ["idle_0", "idle_1", "idle_2", "idle_3"], "fps": 8, "loop": true},
         "run": {"frames": ["run_0", "run_1", "run_2", "run_3", "run_4", "run_5"], "fps": 12, "loop": true},
         "attack": {
           "frames": ["attack_0", "attack_1", "attack_2", "attack_3"],
           "fps": 14,
           "loop": false,
           "events": [{"frame_index": 2, "action": "spawn_vfx", "vfx_id": "slash_anime_01", "offset": {"x": 28, "y": -24}}]
         }
       }
     }
     ```

## MODULE 2: `tools/dummy_ai_generator.py` (Trình Tạo Sprite Pixel Chibi Mẫu Để Test Ngay)
Để pipeline chạy và kiểm chứng được ngay lập tức mà không cần chờ ảnh bên ngoài, hãy viết một script Python tự động vẽ bằng code ra 3 tấm ảnh Sprite Sheet thô giả lập đầu ra của AI đặt vào `raw_ai_sprites/`:
1. `chibi_knight_raw.png` (Nền `#00FF00`): Nhân vật Hiệp sĩ Chibi Pixel (tỷ lệ đầu to thân nhỏ, mắt to kiểu Anime, cầm kiếm lớn) với 3 hàng animation: `idle` (4 frames nhấp nhô), `run` (6 frames nghiêng người chạy), `attack` (4 frames vung đại kiếm). Cố tình đặt các frame hơi lệch vị trí một chút để chứng minh thuật toán Auto-Slicing và Bottom-Center Pivot của Module 1 hoạt động hoàn hảo.
2. `slime_oni_monster_raw.png` (Nền `#FF00FF`): Quái vật Slime sừng Oni với 3 hàng: `idle` (4 frames), `hit` (2 frames bị đánh văng), `die` (4 frames tan biến).
3. `anime_slash_vfx_raw.png` (Nền `#000000`): Hiệu ứng chém kiếm khí lưỡi liềm màu tím-xanh neon (6 frames từ tia sáng nhỏ bùng nổ thành vệt chém lớn rồi tan thành hạt pixel).

## MODULE 3: Interactive Game Sandbox (Trình Chạy Game Thực Tế)
Tạo một ứng dụng Game 2D hoàn chỉnh (Sử dụng HTML5 Canvas / Phaser 3 hoặc Python Pygame — ưu tiên công nghệ nào có thể khởi chạy và hiển thị trực quan nhanh nhất trên môi trường hiện tại) để đọc trực tiếp `atlas.png` + `mapping.json` từ Module 1:
1. **Pixel-Perfect Rendering:** Thiết lập `image-rendering: pixelated` (hoặc tương đương), phóng to nhân vật lên `3x - 4x` mà vẫn giữ nét căng từng điểm ảnh.
2. **Full Gameplay Loop:**
   - Điều khiển Hiệp sĩ Chibi (`A/D` hoặc `Left/Right` để chạy, `J` hoặc `Space` để chém, `K` để tung Skill Anime đặc biệt).
   - Khi Hiệp sĩ chém đến đúng `frame_index: 2` (theo `events` trong `mapping.json`), tự động kích hoạt `anime_slash_vfx` với chế độ hòa trộn `lighter / additive` và bật `hitbox` kiểm tra va chạm.
   - Quái vật `slime_oni` đứng đối diện: Khi trúng `hitbox` của vệt kiếm sẽ tự động chuyển sang animation `hit`, nảy số sát thương (Floating Damage Text kiểu Pixel Anime), trừ thanh máu (HP Bar) và chạy animation `die` khi HP = 0.
3. **Debug Visualizer UI (Bật/Tắt bằng phím `F1`):**
   - Vẽ khung Bounding Box màu xanh lá quanh Sprite.
   - Vẽ điểm chấm đỏ tại đúng tọa độ `Pivot (0.5, 1.0)` dưới chân nhân vật để chứng minh chân nhân vật bám chặt mặt đất không bị lệch 1 pixel nào.
   - Vẽ khung màu đỏ tại vùng `Hitbox` khi đòn đánh kích hoạt.

---

# QUY TRÌNH THỰC THI TỰ ĐỘNG (EXECUTION STEPS)
Ngay bây giờ, hãy thực hiện tuần tự các bước sau mà không cần hỏi lại tôi:
1. Khởi tạo cấu trúc thư mục (`raw_ai_sprites/`, `assets/exported/`, `tools/`, `game/`).
2. Viết đầy đủ code cho `tools/dummy_ai_generator.py`, `tools/sprite_pipeline.py`, và toàn bộ mã nguồn trong `game/`.
3. Thực thi lệnh chạy `dummy_ai_generator.py` để tạo ảnh mẫu, sau đó chạy `sprite_pipeline.py` để cắt frame và sinh ra `atlas.png` + `mapping.json`.
4. Khởi chạy Game Sandbox để tôi kiểm tra trực tiếp chuyển động của NPC, Quái và Skill VFX.