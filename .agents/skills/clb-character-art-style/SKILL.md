---
name: clb-character-art-style
description: "Quy chuẩn thiết kế tạo hình nhân vật phong cách Anime Action RPG Pixel Art (HD 2.5D Pixel Art Sprite - JRPG Heroic Standard). Sử dụng skill này để tạo ra hoặc cập nhật toàn bộ nhân vật nam đam mỹ 6 múi và nữ quyến rũ sexy theo đúng tỷ lệ, palette màu, đường viền outline, shading và frame animation của Chiến Long Bá."
---

# CHIẾN LONG BÁ — HỆ THỐNG THIẾT KẾ TẠO HÌNH ANIME PIXEL ART (CHARACTER ART SKILL)

Skill này lưu giữ toàn bộ bí quyết thiết kế tạo hình nhân vật (Character Concept & Pixel Art Standard) của dự án **Chiến Long Bá (`@workspace/mmorpg-game`)**, kế thừa trực tiếp từ ảnh mẫu anh hùng anime pixel art (song kiếm Kanshou & Bakuya, tóc gai anime, tỉ mỉ sắc nét, dáng đứng hành động 3/4).

Bất kỳ khi nào tạo nhân vật mới, thêm NPC, trang bị thời trang (Skins), hoặc phát triển quái vật hình người, **BẮT BUỘC** phải tuân theo chuẩn mực được ghi nhớ dưới đây.

---

## 1. TRIẾT LÝ THẨM MỸ (CORE AESTHETICS)

- **Phong Cách Cốt Lõi:** Japanese Action RPG Pixel Art (phong cách pixel art hành động Anime Nhật Bản thế hệ mới như Fate/stay night, Octopath Traveler, Dungeon Fighter Online, MapleStory).
- **Tỷ Lệ Cơ Thể (Heroic Semi-Chibi):** 
  - Tỷ lệ khoảng **3.5 đến 4 đầu (head-to-body ratio)**.
  - Đầu có kích thước vừa phải để biểu đạt rõ nét khuôn mặt anime, tóc gai nhiều tầng (layered spikes) và ánh mắt sắc lẹm.
  - Thân và tay chân giữ đúng cấu trúc giải phẫu học cơ bắp, không bị lùn bẹt hay vuông khối đơn giản.
  - Đứng tư thế **3/4 Action Battle Stance** linh động, hai chân hơi chùng trụ vững, hai tay cầm chắc vũ khí sẵn sàng xuất chiêu.
  - Dưới chân luôn có **Bóng Đổ Pixel Dẹt (Oval Drop Shadow)** bán trong suốt (`rgba(0,0,0,0.35)` đến `0.45`) để gắn chặt nhân vật vào mặt đất 2.5D.

---

## 2. QUY CHUẨN ĐỒ HỌA PIXEL ART & SHADING (PIXEL ART RULES)

| Yếu Tố | Quy Chuẩn Kỹ Thuật | Chi Tiết Thực Hiện |
| :--- | :--- | :--- |
| **Đường Viền (Contour Outline)** | Màu Tím Than / Đen Đậm (`#231926` hoặc `#1a1624`) | Độ dày 1 pixel bao bọc toàn bộ chu vi nhân vật, vũ khí và phụ kiện để tách biệt tuyệt đối khỏi mọi nền bản đồ. |
| **Shading 3 Lớp (Cel-Shading)** | Tối thiểu 3 tone cho mỗi mảng màu | - **Tone 1 (Highlight):** Ánh sáng phản chiếu trên lọn tóc, chóp ngực, lưỡi kiếm, múi cơ.<br>- **Tone 2 (Base Midtone):** Màu nhận diện chính của trang phục/da/tóc.<br>- **Tone 3 (Deep Shadow):** Đổ bóng nếp gấp vải, dưới cằm, rãnh cơ bụng, mặt khuất ánh sáng. |
| **Mắt Anime Sắc Nét** | Kích thước 4x6 đến 5x7 pixels | - Củng mạc trắng tinh (`#ffffff`).<br>- Tròng mắt 2 màu: nửa trên sẫm, nửa dưới phát sáng rực rỡ theo hệ nguyên tố.<br>- Luôn có **1 điểm sáng trắng (Catchlight Pixel)** ở góc trên để tạo hồn và thần thái sống động. |
| **Khử Răng Cưa (Pixel Precision)** | Nearest-Neighbor Scaling | Vẽ trên canvas gốc 72x80 hoặc 80x90, phóng to bằng `NEAREST` lên 360x360+ với thuộc tính CSS `image-rendering: pixelated;`. |

---

## 3. ĐẶC TẢ TẠO HÌNH GIỚI TÍNH (GENDER SPECIFICATIONS)

### A. Phái Nam — Đam Mỹ Soái Ca & Thân Hình 6 Múi (Bishounen & Sculpted Abs)
1. **Gương Mặt:** Góc cạnh chữ V sắc sảo, cằm thanh tú, ánh mắt kiên định, nụ cười nhếch mép tự tin (smirk).
2. **Kiểu Tóc:** Tóc xước anime tỉ mỉ, có từng chùm tóc nhọn nhấp nhô, lọn tóc mai ôm sát gò má.
3. **Thân Hình:**
   - Dáng chữ V (V-taper): Bờ vai rộng, eo săn gọn.
   - Trang phục mở (áo khoác banh ngực, giáp vai trần hoặc áo vest võ thuật mở) để khoe **khối cơ ngực vạm vỡ** và **bộ cơ bụng 6 múi rõ nét** (rãnh bụng linea alba phân định 3 tầng múi cơ đối xứng).

### B. Phái Nữ — Quyến Rũ, Sexy & Dáng Chuẩn Chữ S (Seductive & Athletic Allure)
1. **Gương Mặt:** Đôi mắt to tròn long lanh có viền mi đen vuốt dài quyến rũ, chấm son môi hồng cam đào dịu ngọt.
2. **Kiểu Tóc:** Mái tóc bồng bềnh nữ tính (tóc dài lượn sóng, đuôi ngựa năng động, hoặc tóc 2 chùm twin-tails) có nơ hoặc kẹp tóc cyber.
3. **Đường Cong & Trang Phục:**
   - Dáng đồng hồ cát với vòng 1 đầy đặn quyến rũ, khe ngực gợi cảm (cleavage V-cut).
   - Áo cúp ngực (bustier), áo croptop thể thao lộ **cơ bụng số 11** săn chắc, hoặc bodysuit cut-out thời thượng.
   - Vòng eo con kiến, hông thon, đùi thon với bốt cao cổ hoặc quần bó sát tôn dáng.

---

## 4. HỆ THỐNG 4 NGHỀ NGHIỆP CHUẨN MỰC (THE 4 CLASS BLUEPRINTS)

### 1. Hộ Vệ (Tank) — Thần Thuẫn Bất Tử
- **Màu Chủ Đạo:** Vàng Hoàng Kim (`#eab308`) & Xanh Đá Thần (`#28c3e1`).
- **Tạo Hình Nam:** Thánh Hiệp Sĩ tóc vàng kim bồng bềnh, cởi trần khoe cơ bắp 6 múi, giáp vai rồng hoàng kim, tay trái cầm Đại Khiên Thần Sư Tử chạm ngọc cyan, tay phải cầm Kiếm Ánh Sáng bản dày.
- **Tạo Hình Nữ:** Nữ Thần Valkyrie tóc vàng óng, đội vương miện hoàng gia, áo giáp vàng cúp ngực khoét sâu tôn vòng 1 quyến rũ, khiên hộ mệnh lông vũ cánh én, kiếm lá liễu thanh mảnh.

### 2. Chiến Binh (Fighter) — Đại Kiếm Hộ Quốc (Chuẩn Theo Ảnh Mẫu Mới)
- **Màu Chủ Đạo:** Thép Bạc Titan, Đỏ Thẫm Rực Lửa, Xanh Lục Bảo & Vàng Hoàng Gia.
- **Tạo Hình Nam (Ảnh Mẫu Chuẩn):** Kiếm Sĩ tóc vàng lãng tử với chùm đuôi ngựa cao bay lượn kiêu hùng, choàng khăn quàng xanh lục bảo, mặc giáp sắt sáng bóng kết hợp áo bào đỏ xẻ tà, hai tay vác **Đại Kiếm Khổng Lồ (Two-Handed Greatsword)** ngang vai với tư thế thủ bộ cực kỳ dũng mãnh và khí chất soái ca hào sảng.
- **Tạo Hình Nữ (Ảnh Mẫu Chuẩn):** Nữ Kiếm Sư / Nữ Hiệp Sĩ tóc vàng tết bím quyến rũ, ánh mắt xanh biếc kiên nghị, khoác bộ chiến giáp hắc kim (Dark Plate Armor) ôm trọn vóc dáng kiêu kỳ gợi cảm, dải yếm ngọc lục bảo thêu hoa văn cổ, tay chống **Đại Kiếm Thần Binh Tinh Thể** cắm sàn tỏa ra luồng đao khí / hỏa vân đỏ rực rỡ uốn lượn xung quanh.

### 3. Sát Thủ (Assassin) — Ảnh Vũ Đoạt Hồn (Chuẩn Theo Ảnh Mẫu)
- **Màu Chủ Đạo:** Tím Đêm Huyền Bí (`#a855f7`) & Trắng Bạc / Đen Khói.
- **Tạo Hình Nam (Ảnh Mẫu Chuẩn):** Lãng khách tóc cam/đỏ rực, khoác áo jacket đen mở ngực, quần jeans xanh xắn gấu, giày thể thao đế trắng, **cầm song kiếm thần binh** (tay phải đao trắng lưỡi cong bạc, tay trái đao đen răng cưa) — phong thái chiến thần anime chuẩn mực.
- **Tạo Hình Nữ:** Kunoichi tóc tím sẫm kiêu kỳ, áo corset da đen xẻ sâu khoe eo thon và vòng 1 bốc lửa, dây đai đùi gợi cảm, cầm song chủy thủ tím phát quang đảo ngược (reverse grip).

### 4. Xạ Thủ (Gunner) — Thần Xạ Cơ Giới
- **Màu Chủ Đạo:** Xanh Ngọc Cyan Neon (`#28c3e1`) & Xám Thép Titan (`#475569`).
- **Tạo Hình Nam:** Thiện Xạ tóc bạc bạch kim undercut lãng tử, mắt trái gắn Kính Độc Nhãn Cyberpunk phát sáng cyan, khoác măng-tô đen hở ngực lộ 6 múi, vác Súng Trường Plasma nòng ray năng lượng rực sáng.
- **Tạo Hình Nữ:** Nữ Thiện Xạ tóc 2 chùm cyan neon với kẹp tóc công nghệ cao, bộ bodysuit da bóng khoét ngực hình thoi quyến rũ, eo con kiến, hai tay cầm Song Súng Lục Laser cực ngầu.

---

## 5. BỘ QUY CHUẨN TÍCH HỢP CODE (INTEGRATION GUIDELINES)

1. **Assets Location:**
   - Toàn bộ spritesheets và avatars đặt tại: `artifacts/mmorpg-game/public/assets/characters/`.
   - Đặt tên chuẩn: `{classId}_{gender}.png` (ví dụ: `tank_male.png`, `fighter_female.png`).
2. **Kích Thước & Thuộc Tính Hiển Thị (React/Tailwind):**
   ```tsx
   <img
     src={`/assets/characters/${classId}_${gender}.png`}
     alt={`${classId} ${gender}`}
     style={{ imageRendering: 'pixelated' }}
     className="w-full h-full object-contain object-center filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.65)] select-none pointer-events-none"
   />
   ```
3. **Script Tự Động Sinh Sprite:**
   - Chạy `python scripts/generate_pixel_characters.py` bất cứ khi nào cần cập nhật lại toàn bộ 8 nhân vật chuẩn pixel art.

---

## 6. QUY TẮC BẮT BUỘC: KẾT HỢP VỚI SKILL ẢNH ĐỘNG CHIẾN ĐẤU (`clb-combat-animation`)
- **Nguyên Tắc Bất Di Bất Dịch:** Mọi nhân vật sinh ra từ quy chuẩn tạo hình này **LUÔN LUÔN PHẢI KẾT HỢP** với skill `clb-combat-animation` (`c:\Cassavas\Game2.5D\.agents\skills\clb-combat-animation\SKILL.md`).
- Tuyệt đối không để nhân vật chỉ tồn tại dưới dạng ảnh tĩnh. Mỗi nhân vật phải có đầy đủ spritesheet 9 hàng tương ứng:
  - `Idle` (Thở/nhấp nhô/chớp mắt)
  - `Walk` / `Run` (Di chuyển chiến đấu)
  - `Jump` & `Fall` (Nhảy/rơi)
  - `Attack 1` (Chém thường 1)
  - `Attack 2` (Xoay người 360 độ chém vòng tròn)
  - `Air Attack` (Không kích cắm sàn)
  - `Attack 3` (Đâm lướt xuyên phá)
  - `Attack 4` (Trảm kích trăng khuyết hạng nặng / Crescent Energy Wave)
  - `Death` (Gục ngã / Trúng đòn)
- Toàn bộ spritesheet chiến đấu tương thích 100% với `SpriteBillboard25D.tsx` và engine 2.5D Canvas Three.js.

